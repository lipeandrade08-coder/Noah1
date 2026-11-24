const test = require('node:test');
const assert = require('node:assert/strict');
const { createNoahUpdateChecker, noahCanReload } = require('../js/updates');

test('uma página já aberta detecta outra publicação e não duplica a consulta', async () => {
  let resolveVersion;
  let calls = 0;
  const updates = [];
  const check = createNoahUpdateChecker({ currentVersion: 'aaaaaaaaaaaaaaaa',
    fetchVersion: () => { calls++; return new Promise(resolve => { resolveVersion = resolve; }); }, onUpdate: version => updates.push(version) });
  const first = check();
  const second = check();
  await Promise.resolve();
  assert.equal(calls, 1);
  resolveVersion('bbbbbbbbbbbbbbbb');
  await Promise.all([first, second]);
  assert.deepEqual(updates, ['bbbbbbbbbbbbbbbb']);
});

test('falha de rede não recarrega a página e permite conferir a versão depois', async () => {
  let offline = true;
  const updates = [];
  const check = createNoahUpdateChecker({ currentVersion: 'aaaaaaaaaaaaaaaa', fetchVersion: async () => {
    if (offline) throw new Error('offline'); return 'cccccccccccccccc';
  }, onUpdate: version => updates.push(version) });
  await check();
  assert.equal(updates.length, 0);
  offline = false;
  await check();
  assert.deepEqual(updates, ['cccccccccccccccc']);
});

test('a mesma versão e respostas inválidas não geram recarregamento', async () => {
  for (const version of ['aaaaaaaaaaaaaaaa', undefined, '<html>erro</html>']) {
    const check = createNoahUpdateChecker({ currentVersion: 'aaaaaaaaaaaaaaaa', fetchVersion: async () => version,
      onUpdate: () => assert.fail('Não deve recarregar') });
    await check();
  }
});

test('atualização automática respeita formulários, painel aberto e envios pendentes', () => {
  let fields = [];
  let modal = null;
  let queue = '[]';
  const document = { querySelector: () => modal, querySelectorAll: () => fields };
  const storage = { getItem: () => queue };
  assert.equal(noahCanReload(document, storage), true);
  fields = [{ value: 'Nome do convidado ainda não enviado' }];
  assert.equal(noahCanReload(document, storage), false);
  fields = [];
  modal = {};
  assert.equal(noahCanReload(document, storage), false);
  modal = null;
  queue = '[{"kind":"rsvp","record":{"id":"aguardando"}}]';
  assert.equal(noahCanReload(document, storage), false);
  queue = 'corrompido';
  assert.equal(noahCanReload(document, storage), false);
});
