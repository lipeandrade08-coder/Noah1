const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

test('abertura oficial limpa o progresso de teste uma vez e preserva novos envios nas próximas visitas', () => {
  const storage = new Map([
    ['noah_story_rsvps', '[{"id":"teste"}]'], ['noah_story_messages', '[{"id":"carta-teste"}]'],
    ['noah_delivery_queue_v2', '[{"record":{"id":"antigo"}}]'], ['noah_alien_hunt_v2', '{"found":[1,2,3,4,5]}'],
    ['noah_alien_badge_v2', '{"code":"ALIEN-TESTE"}'], ['preferencia-de-outro-app', 'preservar']
  ]);
  const load = () => {
    const context = vm.createContext({ console, localStorage: {
      getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key)
    } });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/config.js'), 'utf8'), context);
  };
  load();
  assert.equal(storage.has('noah_alien_badge_v2'), false);
  assert.equal(storage.has('noah_delivery_queue_v2'), false);
  assert.equal(storage.has('noah_story_rsvps'), false);
  assert.equal(storage.get('preferencia-de-outro-app'), 'preservar');
  assert.equal(storage.get('noah_campaign_id'), 'noah-live-20261123-01');
  storage.set('noah_story_rsvps', '[{"id":"convidado-oficial"}]');
  storage.set('noah_alien_hunt_v2', '{"found":[1]}');
  load();
  assert.equal(storage.get('noah_story_rsvps'), '[{"id":"convidado-oficial"}]');
  assert.equal(storage.get('noah_alien_hunt_v2'), '{"found":[1]}');
});
