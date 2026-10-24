const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const RSVPS_FILE = path.join(DATA_DIR, 'rsvps.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

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
  '.m4a': 'audio/mp4'
};

function readJsonFile(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error(`Erro ao ler ${filePath}:`, err);
    return [];
  }
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
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

const server = http.createServer(async (req, res) => {
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
        return (cleanPhone && rPhone === cleanPhone) || (rName === cleanName);
      });

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const ticketCode = data.ticketCode || `NOAH-1-${randomSuffix}`;

      // Gerar vouchers de acordo com as idades das crianças
      const vouchers = generateVouchers(ticketCode, data.childrenDetails || []);

      const rsvpRecord = {
        id: data.id || `rsvp_${Date.now()}_${randomSuffix}`,
        ticketCode: ticketCode,
        name: data.name.trim(),
        phone: data.phone ? data.phone.trim() : '',
        presence: data.presence || 'Confirmado',
        adults: parseInt(data.adults, 10) || 1,
        children: parseInt(data.children, 10) || 0,
        childrenDetails: data.childrenDetails || [],
        companions: data.companions ? data.companions.trim() : '',
        message: data.message ? data.message.trim() : '',
        createdAt: new Date().toISOString(),
        vouchers: vouchers
      };

      if (existingIndex >= 0 && !data.forceNew) {
        const oldRecord = rsvps[existingIndex];
        rsvpRecord.id = oldRecord.id;
        rsvpRecord.ticketCode = oldRecord.ticketCode;
        
        const updatedVouchers = generateVouchers(oldRecord.ticketCode, data.childrenDetails || []);
        rsvpRecord.vouchers = updatedVouchers.map(v => {
          const matchOld = (oldRecord.vouchers || []).find(ov => ov.code === v.code);
          return matchOld ? { ...v, redeemed: matchOld.redeemed, redeemedAt: matchOld.redeemedAt } : v;
        });

        rsvps[existingIndex] = rsvpRecord;
        writeJsonFile(RSVPS_FILE, rsvps);
        return sendJson(res, 200, { success: true, updated: true, rsvp: rsvpRecord, message: 'Confirmação atualizada com sucesso!' });
      }

      rsvps.unshift(rsvpRecord);
      writeJsonFile(RSVPS_FILE, rsvps);
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

    if (data.childrenDetails) {
      updated.vouchers = generateVouchers(current.ticketCode, data.childrenDetails);
    }

    rsvps[index] = updated;
    writeJsonFile(RSVPS_FILE, rsvps);
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
        r.adults || 1,
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

    // Suporte a Range Requests para arquivos de áudio
    const range = req.headers.range;
    if (range && (ext === '.mp3' || ext === '.wav' || ext === '.ogg' || ext === '.m4a')) {
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
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor Noah Story rodando com sucesso em http://localhost:${PORT}`);
});
