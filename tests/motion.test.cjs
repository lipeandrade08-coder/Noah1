const test = require('node:test');
const assert = require('node:assert/strict');
const { createNoahMotion } = require('../js/motion');

test('o visitante pode ativar movimento no iPad com movimento reduzido e guardar sua escolha', () => {
  const saved = new Map();
  const storage = { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) };
  const media = { matches: true, addEventListener() {} };
  const updates = [];
  const motion = createNoahMotion({ media, storage, onChange: reduced => updates.push(reduced) });
  const changes = [];
  motion.addEventListener('change', event => changes.push(event.matches));
  assert.equal(motion.matches, true);
  motion.toggle();
  assert.equal(motion.matches, false);
  assert.deepEqual(changes, [false]);
  assert.deepEqual(updates, [true, false]);
  const reopened = createNoahMotion({ media, storage });
  assert.equal(reopened.matches, false);
  reopened.toggle();
  assert.equal(reopened.matches, true);
  assert.equal(saved.get('noah_motion_preference_v1'), 'reduced');
});

test('acompanha o sistema até a escolha explícita, inclusive no Safari com addListener', () => {
  let systemChanged;
  const media = { matches: false, addListener(callback) { systemChanged = callback; } };
  const updates = [];
  const motion = createNoahMotion({ media, storage: { getItem() { throw Error('storage bloqueado'); } }, onChange: value => updates.push(value) });
  media.matches = true;
  systemChanged();
  assert.equal(motion.matches, true);
  motion.toggle();
  systemChanged();
  assert.equal(motion.matches, false);
  assert.deepEqual(updates, [false, true, false]);
});
