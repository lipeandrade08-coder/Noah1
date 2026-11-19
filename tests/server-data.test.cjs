const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const fixture = require('./sheets-fixture.cjs');

test('servidor usa a planilha como origem e recupera recados sem duplicação após falha', { timeout: 40000 }, async () => {
  const f = fixture();
  f.post({ kind: 'rsvp', recordId: 'external-1', revision: 'external-v1', nome: 'Convidado da planilha',
    telefone: '00000000', presenca: 'Confirmado', adultos: 2, criancas: 0, codigoIngresso: 'NOAH-1-EXTERNAL', mensagem: 'Abraço, Noah!' });
  let failing = false;
  const upstream = http.createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    if (failing) { res.writeHead(503); res.end('offline'); return; }
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(f.post(JSON.parse(body))));
  });
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'noah-data-test-'));
  const campaignId = 'noah-live-20261119-01';
  await fs.writeFile(path.join(directory, 'settings.json'), JSON.stringify({ campaignId, googleScriptUrl: 'http://127.0.0.1:' + upstream.address().port }));
  const portProbe = http.createServer();
  await new Promise(resolve => portProbe.listen(0, '127.0.0.1', resolve));
  const port = portProbe.address().port;
  await new Promise(resolve => portProbe.close(resolve));
  const server = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(port), NOAH_DATA_DIR: directory }, stdio: 'ignore' });
  const base = 'http://127.0.0.1:' + port;
  const post = async (route, data) => {
    const response = await fetch(base + route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaignId, ...data }) });
    return { status: response.status, data: await response.json() };
  };
  try {
    let ready = false;
    for (let i = 0; i < 50; i++) {
      try { ready = (await fetch(base + '/api/rsvp')).ok; } catch {}
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 40));
    }
    assert.equal(ready, true);
    assert.equal((await fetch(base + '/google-apps-script.js')).status, 404);
    assert.equal((await fetch(base + '/data/rsvps.json')).status, 404);
    assert.equal((await fetch(base + '/js/data-api.js')).status, 200);
    const local = await fetch(base + '/api/rsvp').then(response => response.json());
    assert.equal(local.rsvps.length, 0);
    const dashboard = await post('/api/invite-data', { action: 'dashboard', password: 'noah2027' });
    assert.equal(dashboard.data.source, 'sheet');
    assert.equal(dashboard.data.rsvps[0].name, 'Convidado da planilha');
    assert.equal((await post('/api/invite-data', { action: 'dashboard', password: 'errada' })).status, 401);

    const record = { id: 'capsule-message-1', author: 'Teste da cápsula', message: 'Noah, guarde esta carta!', createdAt: '2026-11-19T16:00:00Z' };
    const first = await post('/api/messages', record);
    assert.equal(first.data.message.sheetSync.status, 'synced');
    assert.equal(first.data.destination, 'sheet');
    await post('/api/messages', record);
    assert.equal(f.sheets.get('Recados para o Noah').rows.filter(row => row[0] === record.id).length, 1);

    failing = true;
    const waiting = { ...record, id: 'capsule-pending-2' };
    const pending = await post('/api/messages', waiting);
    assert.equal(pending.data.message.sheetSync.status, 'pending');
    assert.equal((await post('/api/invite-data', { action: 'dashboard', password: 'noah2027' })).status, 502);
    failing = false;
    assert.equal((await post('/api/messages', waiting)).data.message.sheetSync.status, 'synced');
    assert.equal(f.sheets.get('Recados para o Noah').rows.filter(row => row[0] === waiting.id).length, 1);
    const publicData = (await post('/api/invite-data', { action: 'publicMessages' })).data;
    assert.equal(publicData.messages.length, 3);
    assert.ok(publicData.messages.every(item => !item.phone && !item.ticketCode));

    const guest = { id: 'live-family-1', name: 'Família oficial', phone: '11111111111', presence: 'Confirmado', adults: 2, children: 2,
      childrenDetails: [{ name: 'Criança', age: 12 }, { name: 'Adolescente', age: 17 }], ticketCode: 'NOAH-1-LIVEQA', createdAt: '2026-11-19T18:00:00Z' };
    assert.equal((await post('/api/rsvp', { ...guest, campaignId: undefined })).status, 409);
    failing = true;
    const savedOffline = await post('/api/rsvp', guest);
    assert.equal(savedOffline.data.destination, 'sheet');
    assert.equal(savedOffline.data.rsvp.sheetSync.status, 'pending');
    failing = false;
    const savedOnline = await post('/api/rsvp', guest);
    assert.equal(savedOnline.data.rsvp.sheetSync.status, 'synced');
    assert.equal(f.sheets.get('Confirmações').rows.filter(row => row[8] === guest.id).length, 1);
    const claim = { id: 'hunter-live-12345678', name: guest.name, rsvpId: guest.id, ticketCode: guest.ticketCode, found: [1, 2, 3, 4, 5] };
    assert.equal((await post('/api/hunters', { ...claim, rsvpId: 'sem-formulario' })).status, 409);
    assert.equal((await post('/api/hunters', claim)).data.hunter.sheetSync.status, 'synced');
    const delivery = { action: 'redeemVoucher', password: 'noah2027', code: 'VOUCH-GOLD-LIVEQA-2' };
    assert.equal((await post('/api/invite-data', delivery)).status, 200);
    assert.equal((await post('/api/invite-data', delivery)).status, 502);
    const final = (await post('/api/invite-data', { action: 'dashboard', password: 'noah2027' })).data;
    const normalized = require('../js/records').dashboard(final);
    assert.equal(normalized.summary.badges, 1);
    assert.equal(normalized.rsvps.find(r => r.id === guest.id).vouchers[1].redeemed, true);
  } finally {
    server.kill();
    upstream.closeAllConnections();
    await new Promise(resolve => upstream.close(resolve));
    await fs.rm(directory, { recursive: true, force: true });
  }
});
