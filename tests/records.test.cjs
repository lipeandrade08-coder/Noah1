const test = require('node:test');
const assert = require('node:assert/strict');
const records = require('../js/records');

test('resumo concilia presenças e distintivos sem inventar idades ausentes', () => {
  const result = records.dashboard({ rsvps: [
    { id: 'a', name: 'A', presence: 'Confirmado', adults: 2, children: 3, ticketCode: 'NOAH-1-ABCD', badgeStatus: 'Sim',
      childrenDetails: [{ name: 'Bebê', age: 0 }, { name: 'Jovem', age: 14 }] },
    { id: 'b', name: 'B', presence: 'Não comparecerá', adults: 5, children: 1, childrenDetails: [{ age: 4 }] }
  ], messages: [{ id: 'm', status: 'approved' }, { id: 'old', status: 'archived' }],
  deliveries: [{ code: 'VOUCH-RED-ABCD-1', redeemed: true, redeemedAt: '2026-11-19' }] });
  assert.deepEqual(result.summary, { responses: 2, people: 5, adults: 2, children: 3, kids: 1, teens: 1,
    favors: 3, missingAges: 1, badges: 1, messages: 1, declined: 1 });
  assert.equal(result.rsvps[0].vouchers[0].redeemed, true);
  assert.equal(result.rsvps[1].vouchers.length, 0);
});

test('idade vazia não vira bebê nem gera voucher', () => {
  assert.equal(records.vouchers({ presence: 'Confirmado', ticketCode: 'NOAH-1-X', childrenDetails: [{ age: '' }] }).length, 0);
  assert.throws(() => records.dashboard({ rsvps: [] }), /incompletos/);
});

test('faixas dos vouchers incluem 0 e 12 em rosa, 13 e 17 em azul, sem alterar códigos emitidos', () => {
  const record = { presence: 'Confirmado', ticketCode: 'NOAH-1-FAIXAS',
    childrenDetails: [0, 12, 13, 17, 18, '', -1, 2.5].map(age => ({ name: 'Convidado', age })) };
  const items = records.vouchers(record, [{ code: 'VOUCH-GOLD-FAIXAS-4', redeemed: true }]);
  assert.deepEqual(items.map(v => [v.age, v.type, v.qty]), [[0, 'pink', 2], [12, 'pink', 2], [13, 'blue', 1], [17, 'blue', 1]]);
  assert.equal(items[3].redeemed, true);
  const summary = records.dashboard({ rsvps: [{ ...record, adults: 1, children: 4 }], messages: [] }).summary;
  assert.equal(summary.kids, 2);
  assert.equal(summary.teens, 2);
  assert.equal(summary.favors, 6);
});

test('recados do formulário e da cápsula se unem sem repetir ou reabrir arquivados', () => {
  const rsvps = [{ id: 'rsvp-a', name: 'Família', message: 'Para o Noah', createdAt: '2026-11-19' }];
  assert.equal(records.messages(rsvps, []).length, 1);
  assert.equal(records.messages(rsvps, [{ id: 'x', rsvpId: 'rsvp-a', status: 'archived' }]).length, 0);
});
