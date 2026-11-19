const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { webcrypto } = require('node:crypto');

function browser(fetch) {
  const storage = new Map();
  const messages = [];
  const context = vm.createContext({ fetch, crypto: webcrypto, AbortSignal, console: { warn() {} },
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    PARTY_CONFIG: { googleScriptUrl: 'https://script.google.com/macros/s/test/exec' },
    document: { addEventListener() {}, dispatchEvent() {} }, window: { addEventListener() {} }, setInterval() {},
    CustomEvent: class { constructor(type, values) { this.type = type; this.detail = values.detail; } },
    saveMessageLocally: record => messages.push(record), saveRsvpLocally() {} });
  for (const file of ['sheet-payload.js', 'delivery.js', 'data-api.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/' + file), 'utf8'), context);
  }
  vm.runInContext('globalThis.delivery = NoahDelivery; globalThis.api = NoahData', context);
  return { context, storage, messages };
}

test('recado offline permanece na fila e só sai após confirmação identificada', async () => {
  let online = false;
  const state = browser(async (url, init) => {
    if (url.startsWith('/')) return new Response('', { status: 404 });
    if (!online) throw new Error('offline');
    const data = JSON.parse(init.body);
    return Response.json({ result: 'success', recordId: data.recordId, revision: data.revision });
  });
  const record = { id: 'message-1234', author: 'Família', message: 'Querido Noah!', createdAt: '2026-11-19' };
  state.context.delivery.enqueue('message', record);
  await state.context.delivery.flush();
  assert.equal(state.context.delivery.pending('message', record.id), true);
  online = true;
  await state.context.delivery.flush();
  assert.equal(state.context.delivery.pending('message', record.id), false);
  assert.equal(state.messages[0].sheetSync.status, 'synced');
  assert.ok(state.messages[0].deliveryConfirmedAt);
});

test('servidor com recado pendente não produz confirmação falsa nem duplica o envio direto', async () => {
  let calls = 0;
  const state = browser(async () => {
    calls++;
    return Response.json({ success: true, destination: 'sheet', message: { id: 'pending', sheetSync: { status: 'pending' } } });
  });
  state.context.delivery.enqueue('message', { id: 'pending', author: 'A', message: 'B' });
  await state.context.delivery.flush();
  assert.equal(state.context.delivery.pending('message', 'pending'), true);
  assert.equal(calls, 1);
  assert.equal(state.messages.length, 0);
});

test('painel não troca erro de autenticação ou falha da planilha por uma lista local vazia', async () => {
  let calls = 0;
  const state = browser(async () => { calls++; return Response.json({ success: false, message: 'Senha incorreta' }, { status: 401 }); });
  await assert.rejects(state.context.api.request('dashboard', { password: 'errada' }), /Senha incorreta/);
  assert.equal(calls, 1);
});

test('hospedagem estática consulta o Apps Script e envia a senha no corpo, sem URL pública', async () => {
  let payload;
  const state = browser(async (url, init) => {
    if (url.startsWith('/')) return new Response('', { status: 404 });
    assert.equal(url.includes('password'), false);
    payload = JSON.parse(init.body);
    return Response.json({ result: 'success', source: 'sheet', rsvps: [], messages: [] });
  });
  assert.equal((await state.context.api.request('dashboard', { password: 'noah2027' })).source, 'sheet');
  assert.equal(payload.password, 'noah2027');
});

test('rota estática que devolve HTML também usa a planilha', async () => {
  const state = browser(async url => url.startsWith('/') ? new Response('<html>convite</html>')
    : Response.json({ result: 'success', source: 'sheet', rsvps: [], messages: [] }));
  assert.equal((await state.context.api.request('dashboard', { password: 'noah2027' })).source, 'sheet');
});

test('ACK de servidor antigo sem destino confirmado usa gravação direta identificada', async () => {
  let direct = 0;
  const state = browser(async (url, init) => {
    if (url.startsWith('/')) return Response.json({ success: true, message: { id: 'legacy' } });
    direct++;
    const data = JSON.parse(init.body);
    return Response.json({ result: 'success', recordId: data.recordId, revision: data.revision });
  });
  state.context.delivery.enqueue('message', { id: 'stable-id-1', author: 'A', message: 'Para o Noah' });
  await state.context.delivery.flush();
  assert.equal(direct, 1);
  assert.equal(state.messages[0].id, 'stable-id-1');
  assert.equal(state.messages[0].destination, 'sheet');
});

test('confirmação de presença aguarda gravação real, sem perder a fila nem duplicar a resposta', async () => {
  let synced = false;
  let attempts = 0;
  const state = browser(async () => {
    attempts++;
    return Response.json({ success: true, destination: 'sheet', rsvp: { id: 'rsvp-live', sheetSync: { status: synced ? 'synced' : 'pending' } } });
  });
  state.context.delivery.enqueue('rsvp', { id: 'rsvp-live', name: 'Família' });
  await state.context.delivery.flush();
  assert.equal(state.context.delivery.pending('rsvp', 'rsvp-live'), true);
  synced = true;
  await state.context.delivery.flush();
  assert.equal(state.context.delivery.pending('rsvp', 'rsvp-live'), false);
  assert.equal(attempts, 2);
});
