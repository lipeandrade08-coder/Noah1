const http = require('http');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { markPending, toSheetPayload, postToSheets } = require('./lib/sheets');

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.NOAH_DATA_DIR || path.join(__dirname, 'data');
const RSVPS_FILE = path.join(DATA_DIR, 'rsvps.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const HUNTERS_FILE = path.join(DATA_DIR, 'hunters.json');

// Ensure data folder and files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(RSVPS_FILE)) {
  fs.writeFileSync(RSVPS_FILE, JSON.stringify([], null, 2), 'utf-8');
}
if (!fs.existsSync(MESSAGES_FILE)) {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2), 'utf-8');
}
if (!fs.existsSync(SETTINGS_FILE)) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ googleScriptUrl: '' }, null, 2), 'utf-8');
}

if (!fs.existsSync(HUNTERS_FILE)) writeJsonFile(HUNTERS_FILE, []);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.csv': 'text/csv; charset=utf-8',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.mp4': 'video/mp4',
  '.aac': 'audio/aac'
};

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    // Uma cópia inválida nunca deve apagar os registros já recebidos.
    try { return JSON.parse(fs.readFileSync(filePath + '.bak', 'utf-8')); }
    catch { throw new Error('Não foi possível ler os registros de ' + path.basename(filePath)); }
  }
}

function writeJsonFile(filePath, data) {
  const temporary = filePath + '.' + randomUUID() + '.tmp';
  try {
    fs.writeFileSync(temporary, JSON.stringify(data, null, 2), { encoding: 'utf-8', mode: 0o600 });
    const handle = fs.openSync(temporary, 'r');
    try { fs.fsyncSync(handle); } finally { fs.closeSync(handle); }
    if (fs.existsSync(filePath)) {
      try {
        JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        fs.copyFileSync(filePath, filePath + '.bak');
      } catch {}
    }
    fs.renameSync(temporary, filePath);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 2e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(payload));
}

function generateVouchers(ticketCode, childrenDetails = []) {
  const vouchers = [];
  let seq = 1;

  childrenDetails.forEach((child) => {
    const age = parseInt(child.age, 10);
    const childName = child.name ? child.name.trim() : 'Criança';

    if (!isNaN(age)) {
      if (age >= 0 && age <= 12) {
        // Crianças 0 a 12 anos: 2 lembrancinhas
        vouchers.push({
          code: `VOUCH-RED-${ticketCode.replace('NOAH-1-', '')}-${seq++}`,
          type: 'red',
          label: 'Voucher Vermelho (Kids 0-12)',
          childName: `${childName} (${age} anos)`,
          qty: 2,
          redeemed: false,
          redeemedAt: null
        });
      } else if (age >= 13 && age <= 16) {
        // Adolescentes 13 a 16 anos: 1 lembrancinha
        vouchers.push({
          code: `VOUCH-GOLD-${ticketCode.replace('NOAH-1-', '')}-${seq++}`,
          type: 'gold',
          label: 'Voucher Dourado (Teens 13-16)',
          childName: `${childName} (${age} anos)`,
          qty: 1,
          redeemed: false,
          redeemedAt: null
        });
      }
    }
  });

  return vouchers;
}

// Os próprios registros guardam a fila, inclusive após reiniciar o servidor.
let sheetsRunning = false;
const sheetSources = [[RSVPS_FILE, 'rsvp'], [HUNTERS_FILE, 'hunter']];

async function flushSheets(force = false) {
  if (sheetsRunning) return;
  const settings = readJsonFile(SETTINGS_FILE);
  if (!settings.googleScriptUrl) return;
  sheetsRunning = true;
  try {
    for (const [file, kind] of sheetSources) {
      const pending = readJsonFile(file).filter(record =>
        !String(record.id || '').startsWith('rsvp_sample_') && record.sheetSync?.status !== 'synced' &&
        (force || (record.sheetSync?.nextAttemptAt || 0) <= Date.now()));
      for (const initial of pending) {
        const records = readJsonFile(file);
        const record = records.find(item => item.id === initial.id);
        if (!record || record.sheetSync?.status === 'synced') continue;
        if (!record.sheetSync) {
          markPending(record);
          writeJsonFile(file, records);
        }
        const revision = record.sheetSync.revision;
        let error;
        let receipt;
        try { receipt = await postToSheets(settings.googleScriptUrl, toSheetPayload(record, kind)); }
        catch (failure) { error = failure.message; }
        // Um envio antigo não pode confirmar uma edição recebida durante a requisição.
        const latest = readJsonFile(file);
        const current = latest.find(item => item.id === record.id);
        if (!current || current.sheetSync?.revision !== revision) continue;
        if (!error && kind === 'hunter') {
          current.code = receipt.code || current.code;
          current.rsvpId = receipt.rsvpId || current.rsvpId;
        }
        const attempts = (current.sheetSync.attempts || 0) + 1;
        current.sheetSync = {
          ...current.sheetSync, attempts,
          status: error ? 'pending' : 'synced',
          lastError: error || '',
          nextAttemptAt: error ? Date.now() + Math.min(900000, 15000 * 2 ** Math.min(attempts, 6)) : 0,
          syncedAt: error ? null : new Date().toISOString()
        };
        writeJsonFile(file, latest);
      }
    }
  } finally { sheetsRunning = false; }
}

function sheetsStatus() {
  const entries = sheetSources.flatMap(([file]) => readJsonFile(file)).filter(record => !String(record.id || '').startsWith('rsvp_sample_'));
  return {
    configured: Boolean(readJsonFile(SETTINGS_FILE).googleScriptUrl),
    pending: entries.filter(record => record.sheetSync?.status !== 'synced').length,
    synced: entries.filter(record => record.sheetSync?.status === 'synced').length,
    lastError: entries.find(record => record.sheetSync?.lastError)?.sheetSync.lastError || ''
  };
}

setInterval(() => flushSheets().catch(console.error), 15000).unref();
setTimeout(() => flushSheets().catch(console.error), 1000).unref();

// Salva recadinho do convidado na Cápsula do Tempo / Mural
function saveRsvpMessageToCapsule(rsvpRecord) {
  if (!rsvpRecord.message || !rsvpRecord.message.trim()) return;
  try {
    const messages = readJsonFile(MESSAGES_FILE);
    const exists = messages.some(m => m.rsvpId === rsvpRecord.id || (m.author === rsvpRecord.name && m.message === rsvpRecord.message.trim()));
    if (!exists) {
      messages.unshift({
        id: `msg_rsvp_${Date.now()}`,
        rsvpId: rsvpRecord.id,
        author: rsvpRecord.name,
        message: rsvpRecord.message.trim(),
        theme: 'woody',
        status: 'approved',
        createdAt: new Date().toISOString()
      });
      writeJsonFile(MESSAGES_FILE, messages);
    }
  } catch (e) {
    console.warn('[Mural] Erro ao salvar recado:', e.message);
  }
}

// Sincroniza todas as mensagens já existentes em RSVPs para a lista de recados dos pais
function syncAllExistingRsvpMessages() {
  try {
    const rsvps = readJsonFile(RSVPS_FILE);
    const messages = readJsonFile(MESSAGES_FILE);
    let changed = false;

    rsvps.forEach(r => {
      if (r.message && r.message.trim()) {
        const cleanMsg = r.message.trim();
        const exists = messages.some(m => m.rsvpId === r.id || (m.author === r.name && m.message === cleanMsg));
        if (!exists) {
          messages.unshift({
            id: `msg_rsvp_${r.id || Date.now()}`,
            rsvpId: r.id,
            author: r.name,
            message: cleanMsg,
            theme: 'woody',
            status: 'approved',
            createdAt: r.createdAt || new Date().toISOString()
          });
          changed = true;
        }
      }
    });

    if (changed) {
      writeJsonFile(MESSAGES_FILE, messages);
      console.log('[Mural] 💌 Recados de confirmações anteriores sincronizados com o Painel dos Pais com sucesso!');
    }
  } catch (e) {
    console.warn('[Mural] Erro ao sincronizar recadinhos:', e.message);
  }
}

// Executa sincronização inicial no carregamento
syncAllExistingRsvpMessages();

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch(error => {
    console.error(error);
    if (!res.headersSent) sendJson(res, 500, { success: false, message: 'Não foi possível gravar os dados. Tente novamente.' });
    else res.end();
  });
});

async function handleRequest(req, res) {
  const urlParts = req.url.split('?');
  const pathname = urlParts[0];

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // ==========================================
  // API ENDPOINTS
  // ==========================================

  // 1. POST /api/rsvp (Criar ou atualizar confirmação de presença)
  if (pathname === '/api/rsvp' && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      if (!data.name || !data.name.trim()) {
        return sendJson(res, 400, { success: false, message: 'O nome do convidado é obrigatório.' });
      }

      const rsvps = readJsonFile(RSVPS_FILE);
      const cleanPhone = (data.phone || '').replace(/\D/g, '');
      const cleanName = data.name.trim().toLowerCase();

      // Verificar duplicados (pelo telefone se informado ou nome idêntico)
      const existingIndex = rsvps.findIndex(r => {
        const rPhone = (r.phone || '').replace(/\D/g, '');
        const rName = (r.name || '').trim().toLowerCase();
        return (data.id && r.id === data.id) || (cleanPhone && rPhone === cleanPhone) || (rName === cleanName);
      });

      const submittedAt = data.submittedAt || data.createdAt || new Date().toISOString();
      const previous = rsvps[existingIndex];
      if (previous && !data.forceNew &&
          Date.parse(submittedAt) <= Date.parse(previous.submittedAt || previous.updatedAt || previous.createdAt)) {
        return sendJson(res, 200, { success: true, rsvp: previous, message: 'Registro já recebido.' });
      }

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const ticketCode = data.ticketCode || 'NOAH-1-' + randomUUID().slice(0, 8).toUpperCase();

      // Gerar vouchers de acordo com as idades das crianças
      const vouchers = generateVouchers(ticketCode, data.childrenDetails || []);

      const rsvpRecord = {
        id: data.id || `rsvp_${Date.now()}_${randomSuffix}`,
        ticketCode: ticketCode,
        name: data.name.trim(),
        phone: data.phone ? data.phone.trim() : '',
        presence: data.presence || 'Confirmado',
        adults: data.presence === 'Não comparecerá' ? 0 : Math.max(0, parseInt(data.adults, 10) || 0),
        children: parseInt(data.children, 10) || 0,
        childrenDetails: data.childrenDetails || [],
        companions: data.companions ? data.companions.trim() : '',
        message: data.message ? data.message.trim() : '',
        createdAt: data.createdAt || new Date().toISOString(),
        submittedAt,
        updatedAt: new Date().toISOString(),
        vouchers: vouchers
      };

      markPending(rsvpRecord);

      if (existingIndex >= 0 && !data.forceNew) {
        const oldRecord = rsvps[existingIndex];
        rsvpRecord.id = oldRecord.id;
        rsvpRecord.createdAt = oldRecord.createdAt;
        rsvpRecord.ticketCode = oldRecord.ticketCode;
        
        const updatedVouchers = generateVouchers(oldRecord.ticketCode, data.childrenDetails || []);
        rsvpRecord.vouchers = updatedVouchers.map(v => {
          const matchOld = (oldRecord.vouchers || []).find(ov => ov.code === v.code);
          return matchOld ? { ...v, redeemed: matchOld.redeemed, redeemedAt: matchOld.redeemedAt } : v;
        });

        rsvps[existingIndex] = rsvpRecord;
        writeJsonFile(RSVPS_FILE, rsvps);
        saveRsvpMessageToCapsule(rsvpRecord);
        void flushSheets().catch(console.error);
        return sendJson(res, 200, { success: true, updated: true, rsvp: rsvpRecord, message: 'Confirmação atualizada com sucesso!' });
      }

      rsvps.unshift(rsvpRecord);
      writeJsonFile(RSVPS_FILE, rsvps);
      saveRsvpMessageToCapsule(rsvpRecord);
      void flushSheets().catch(console.error);
      return sendJson(res, 201, { success: true, created: true, rsvp: rsvpRecord, message: 'Presença confirmada com sucesso!' });
    } catch (err) {
      console.error('Erro em POST /api/rsvp:', err);
      return sendJson(res, 500, { success: false, message: 'Erro interno ao processar confirmação.' });
    }
  }

  // 2. GET /api/rsvp (Listar confirmações)
  if (pathname === '/api/rsvp' && req.method === 'GET') {
    const rsvps = readJsonFile(RSVPS_FILE);
    return sendJson(res, 200, { success: true, rsvps: rsvps });
  }

  // 3. PUT /api/rsvp/:id (Editar confirmação de convidado pelos pais)
  if (pathname.startsWith('/api/rsvp/') && req.method === 'PUT') {
    const id = pathname.replace('/api/rsvp/', '');
    const data = await parseBody(req);
    const rsvps = readJsonFile(RSVPS_FILE);
    const index = rsvps.findIndex(r => r.id === id);

    if (index === -1) {
      return sendJson(res, 404, { success: false, message: 'Convidado não encontrado.' });
    }

    const current = rsvps[index];
    const updated = {
      ...current,
      ...data,
      id: current.id,
      ticketCode: current.ticketCode,
      updatedAt: new Date().toISOString()
    };
    updated.submittedAt = updated.updatedAt;

    if (data.childrenDetails) {
      updated.vouchers = generateVouchers(current.ticketCode, data.childrenDetails);
    }

    markPending(updated);
    rsvps[index] = updated;
    writeJsonFile(RSVPS_FILE, rsvps);
    void flushSheets().catch(console.error);
    return sendJson(res, 200, { success: true, rsvp: updated, message: 'Convidado atualizado com sucesso!' });
  }

  // 4. DELETE /api/rsvp/:id (Remover/Cancelar confirmação)
  if (pathname.startsWith('/api/rsvp/') && req.method === 'DELETE') {
    const id = pathname.replace('/api/rsvp/', '');
    let rsvps = readJsonFile(RSVPS_FILE);
    const initialLen = rsvps.length;
    rsvps = rsvps.filter(r => r.id !== id);

    if (rsvps.length === initialLen) {
      return sendJson(res, 404, { success: false, message: 'Convidado não encontrado.' });
    }

    writeJsonFile(RSVPS_FILE, rsvps);
    return sendJson(res, 200, { success: true, message: 'Convidado removido com sucesso.' });
  }

  // 5. POST /api/vouchers/redeem (Dar baixa e validar lembrancinha)
  if (pathname === '/api/vouchers/redeem' && req.method === 'POST') {
    const data = await parseBody(req);
    const voucherCode = (data.code || '').trim().toUpperCase();

    if (!voucherCode) {
      return sendJson(res, 400, { success: false, message: 'Código de voucher não informado.' });
    }

    const rsvps = readJsonFile(RSVPS_FILE);
    let matchedVoucher = null;
    let matchedRsvp = null;

    for (const rsvp of rsvps) {
      if (rsvp.vouchers && Array.isArray(rsvp.vouchers)) {
        for (const v of rsvp.vouchers) {
          if (v.code.toUpperCase() === voucherCode) {
            matchedVoucher = v;
            matchedRsvp = rsvp;
            break;
          }
        }
      }
      if (matchedVoucher) break;
    }

    if (!matchedVoucher) {
      return sendJson(res, 404, { success: false, message: 'Voucher não encontrado no sistema!' });
    }

    if (matchedVoucher.redeemed) {
      return sendJson(res, 400, {
        success: false,
        alreadyRedeemed: true,
        message: `Este voucher já foi utilizado anteriormente em ${new Date(matchedVoucher.redeemedAt).toLocaleString('pt-BR')}!`,
        voucher: matchedVoucher
      });
    }

    matchedVoucher.redeemed = true;
    matchedVoucher.redeemedAt = new Date().toISOString();
    writeJsonFile(RSVPS_FILE, rsvps);

    return sendJson(res, 200, {
      success: true,
      message: `Lembrancinha validada com sucesso para ${matchedVoucher.childName}! (${matchedVoucher.qty} itens)`,
      voucher: matchedVoucher,
      guestName: matchedRsvp.name
    });
  }

  // 6. GET /api/messages (Listar mensagens do mural)
  if (pathname === '/api/messages' && req.method === 'GET') {
    const messages = readJsonFile(MESSAGES_FILE);
    const searchParams = new URLSearchParams(urlParts[1] || '');
    const showAll = searchParams.get('all') === '1';

    const filtered = showAll ? messages : messages.filter(m => m.status === 'approved');
    return sendJson(res, 200, { success: true, messages: filtered });
  }

  // 7. POST /api/messages (Adicionar mensagem na Cápsula do Tempo)
  if (pathname === '/api/messages' && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      if (!data.author || !data.author.trim() || !data.message || !data.message.trim()) {
        return sendJson(res, 400, { success: false, message: 'Nome e mensagem são obrigatórios.' });
      }

      const messages = readJsonFile(MESSAGES_FILE);
      const newMsg = {
        id: `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        author: data.author.trim(),
        message: data.message.trim(),
        theme: data.theme || 'woody',
        status: data.autoApprove ? 'approved' : 'approved',
        createdAt: new Date().toISOString()
      };

      messages.unshift(newMsg);
      writeJsonFile(MESSAGES_FILE, messages);
      return sendJson(res, 201, { success: true, message: newMsg });
    } catch (err) {
      return sendJson(res, 500, { success: false, message: 'Erro ao salvar recado.' });
    }
  }

  // 8. PUT /api/messages/:id (Moderar mensagem)
  if (pathname.startsWith('/api/messages/') && req.method === 'PUT') {
    const id = pathname.replace('/api/messages/', '');
    const data = await parseBody(req);
    const messages = readJsonFile(MESSAGES_FILE);
    const index = messages.findIndex(m => m.id === id);

    if (index === -1) {
      return sendJson(res, 404, { success: false, message: 'Mensagem não encontrada.' });
    }

    messages[index] = { ...messages[index], ...data, id: messages[index].id };
    writeJsonFile(MESSAGES_FILE, messages);
    return sendJson(res, 200, { success: true, message: messages[index] });
  }

  // 9. DELETE /api/messages/:id (Excluir mensagem)
  if (pathname.startsWith('/api/messages/') && req.method === 'DELETE') {
    const id = pathname.replace('/api/messages/', '');
    let messages = readJsonFile(MESSAGES_FILE);
    messages = messages.filter(m => m.id !== id);
    writeJsonFile(MESSAGES_FILE, messages);
    return sendJson(res, 200, { success: true, message: 'Mensagem removida com sucesso.' });
  }

  // 10. GET /api/export-csv (Baixar CSV formatado)
  if (pathname === '/api/export-csv' && req.method === 'GET') {
    const rsvps = readJsonFile(RSVPS_FILE);
    let csv = '\uFEFF';
    csv += 'Código Ingresso;Nome do Responsável;Telefone/WhatsApp;Presença;Adultos;Crianças;Detalhes das Crianças;Acompanhantes;Lembrancinhas Previstas;Recadinho;Data de Confirmação\r\n';

    rsvps.forEach(r => {
      const kidsDesc = (r.childrenDetails || []).map(c => `${c.name || 'Criança'} (${c.age || 0}a)`).join(', ');
      const totalLembrancas = (r.vouchers || []).reduce((acc, v) => acc + (v.qty || 0), 0);
      const row = [
        r.ticketCode || '',
        `"${(r.name || '').replace(/"/g, '""')}"`,
        `"${(r.phone || '').replace(/"/g, '""')}"`,
        r.presence || '',
        r.adults ?? 0,
        r.children || 0,
        `"${kidsDesc.replace(/"/g, '""')}"`,
        `"${(r.companions || '').replace(/"/g, '""')}"`,
        totalLembrancas,
        `"${(r.message || '').replace(/"/g, '""')}"`,
        r.createdAt ? new Date(r.createdAt).toLocaleString('pt-BR') : ''
      ];
      csv += row.join(';') + '\r\n';
    });

    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="convidados-noah-story-1.csv"'
    });
    return res.end(csv);
  }

  // 11. GET /api/settings (Obter configurações salvas do sistema)
  if (pathname === '/api/settings' && req.method === 'GET') {
    let settings = { googleScriptUrl: '' };
    try {
      settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8') || '{}');
    } catch(e) {}
    return sendJson(res, 200, { success: true, settings });
  }

  // 12. POST /api/settings (Salvar configurações do sistema, ex: Google Apps Script URL)
  if (pathname === '/api/settings' && req.method === 'POST') {
    const data = await parseBody(req);
    let settings = {};
    try {
      settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8') || '{}');
    } catch(e) {}
    if (data.googleScriptUrl !== undefined) {
      settings.googleScriptUrl = (data.googleScriptUrl || '').trim();
    }
    if (settings.googleScriptUrl && !/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(settings.googleScriptUrl)) {
      return sendJson(res, 400, { success: false, message: 'Informe a URL de implantação terminada em /exec.' });
    }
    writeJsonFile(SETTINGS_FILE, settings);
    void flushSheets(true).catch(console.error);
    return sendJson(res, 200, { success: true, settings, message: 'Configurações salvas com sucesso!' });
  }

  if (pathname === '/api/sheets/status' && req.method === 'GET') {
    return sendJson(res, 200, { success: true, ...sheetsStatus() });
  }
  if (pathname === '/api/sheets/sync' && req.method === 'POST') {
    await flushSheets(true);
    return sendJson(res, 200, { success: true, ...sheetsStatus() });
  }
  if (pathname === '/api/test-sheets' && req.method === 'POST') {
    const data = await parseBody(req);
    const endpoint = data.googleScriptUrl || readJsonFile(SETTINGS_FILE).googleScriptUrl;
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(endpoint || '')) {
      return sendJson(res, 400, { success: false, message: 'Informe a URL de implantação /exec.' });
    }
    const result = await postToSheets(endpoint, { kind: 'test', recordId: 'connection-test', revision: randomUUID() });
    return sendJson(res, 200, { success: true, message: result.message || 'Gravação e leitura de teste confirmadas.' });
  }
  if (pathname === '/api/hunters' && req.method === 'POST') {
    const data = await parseBody(req);
    if (!/^[a-zA-Z0-9-]{8,80}$/.test(data.id || '') || !String(data.name || '').trim() ||
        !Array.isArray(data.found) || new Set(data.found).size !== 5 ||
        !data.found.every(value => Number.isInteger(value) && value >= 1 && value <= 5)) {
      return sendJson(res, 400, { success: false, message: 'Complete os cinco alienígenas e informe seu nome.' });
    }
    const registration = readJsonFile(RSVPS_FILE).find(record =>
      record.id === data.rsvpId && record.ticketCode === data.ticketCode && record.name && record.phone);
    if (!registration) {
      return sendJson(res, 409, { success: false, message: 'Conclua o formulário de presença para liberar seu distintivo.' });
    }
    const hunters = readJsonFile(HUNTERS_FILE);
    let hunter = hunters.find(item => item.rsvpId === registration.id || item.id === data.id);
    if (hunter?.rsvpId && hunter.rsvpId !== registration.id) {
      return sendJson(res, 409, { success: false, message: 'Esta conquista já está vinculada a outro formulário.' });
    }
    if (!hunter) {
      hunter = { id: data.id, code: 'ALIEN-' + randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase() };
      hunters.push(hunter);
    }
    if (hunter.rsvpId !== registration.id || hunter.ticketCode !== registration.ticketCode || hunter.name !== registration.name) {
      Object.assign(hunter, {
        name: registration.name, rsvpId: registration.id, phone: registration.phone,
        ticketCode: registration.ticketCode, found: [1, 2, 3, 4, 5],
        completedAt: hunter.completedAt || data.completedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      markPending(hunter);
      writeJsonFile(HUNTERS_FILE, hunters);
    }
    await flushSheets(true);
    const saved = readJsonFile(HUNTERS_FILE).find(item => item.id === hunter.id);
    if (saved.sheetSync?.status !== 'synced') {
      return sendJson(res, 503, { success: false, message: 'A conquista está guardada e aguarda confirmação da planilha.' });
    }
    return sendJson(res, 200, { success: true, hunter: saved });
  }

  // ==========================================
  // STATIC FILES SERVING (WITH AUDIO RANGE STREAMING)
  // ==========================================
  let decodedPath = pathname;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch (e) {
    decodedPath = pathname;
  }

  let reqPath = decodedPath === '/' ? 'index.html' : decodedPath;
  let safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(__dirname, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('404 Not Found');
      }
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('500 Internal Error');
    }

    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Suporte a Range Requests para arquivos de áudio e vídeo
    const range = req.headers.range;
    if (range && (ext === '.mp3' || ext === '.wav' || ext === '.ogg' || ext === '.m4a' || ext === '.mp4' || ext === '.aac')) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunkSize = (end - start) + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType
      });
      fileStream.pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache, must-revalidate'
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

server.listen(PORT, () => {
  console.log(`🚀 Servidor Noah Story rodando com sucesso em http://localhost:${PORT}`);
});
