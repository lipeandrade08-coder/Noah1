const test = require('node:test');
const assert = require('node:assert/strict');
const fixture = require('./sheets-fixture.cjs');
const records = require('../js/records');

const registration = { kind: 'rsvp', recordId: 'registration-1', revision: 'revision-1', issuedAt: '2026-11-19T12:00:00Z',
  nome: 'Família Teste', telefone: '0000000000', presenca: 'Confirmado', adultos: 2, criancas: 2,
  codigoIngresso: 'NOAH-1-TEST1234', detalhesCriancas: JSON.stringify([{ name: 'Bebê', age: 0 }, { name: 'Jovem', age: 15 }]),
  mensagem: 'Querido Noah, um abraço!' };

test('Apps Script autentica o resumo e lê a mesma origem dos registros', () => {
  const f = fixture();
  assert.equal(f.post(registration).result, 'success');
  assert.equal(f.post({ action: 'dashboard', password: 'errada' }).result, 'error');
  const data = f.post({ action: 'dashboard', password: 'noah2027' });
  assert.equal(data.source, 'sheet');
  const result = records.dashboard(data);
  assert.equal(result.summary.people, 4);
  assert.equal(result.summary.favors, 3);
  assert.equal(result.summary.messages, 1);
  assert.equal(data.messages[0].recipient, 'Pequeno Xerife Noah');
  assert.equal(f.sheets.get('Recados para o Noah').rows.length, 2);
});

test('recados são confirmados, idempotentes, públicos sem dados de contato e arquiváveis', () => {
  const f = fixture();
  f.post(registration);
  const message = { kind: 'message', recordId: 'message-1', revision: 'message-v1', issuedAt: '2026-11-19T13:00:00Z', nome: 'Vovó', mensagem: 'Carta para o futuro' };
  assert.equal(f.post(message).recordId, message.recordId);
  assert.equal(f.post(message).revision, message.revision);
  assert.equal(f.sheets.get('Recados para o Noah').rows.length, 3);
  const publicData = f.post({ action: 'publicMessages' });
  assert.equal(publicData.messages.length, 2);
  assert.ok(publicData.messages.every(item => !('phone' in item) && !('ticketCode' in item) && !('rsvpId' in item)));
  assert.equal(f.post({ action: 'archiveMessage', id: 'message-1', password: 'noah2027' }).result, 'success');
  f.post(message);
  assert.equal(f.post({ action: 'publicMessages' }).messages.length, 1);
  assert.equal(f.sheets.get('Recados para o Noah').rows[2][7], 'archived');
  assert.equal(f.post({ kind: 'message', recordId: 'bad', nome: 'Sem texto' }).result, 'error');
});

test('voucher só pode ser entregue uma vez e cancelamento atualiza o resumo da planilha', () => {
  const f = fixture();
  f.post(registration);
  const action = { action: 'redeemVoucher', password: 'noah2027', code: 'VOUCH-RED-TEST1234-1' };
  assert.equal(f.post(action).result, 'success');
  assert.equal(f.post(action).result, 'error');
  assert.equal(records.dashboard(f.post({ action: 'dashboard', password: 'noah2027' })).rsvps[0].vouchers[0].redeemed, true);
  assert.equal(f.post({ action: 'cancelRsvp', password: 'noah2027', id: registration.recordId }).result, 'success');
  assert.equal(records.dashboard(f.post({ action: 'dashboard', password: 'noah2027' })).summary.people, 0);
  assert.equal(f.sheets.get('Confirmações').rows.length, 2);
});

test('distintivo continua exigindo formulário e fica visível no painel', () => {
  const f = fixture();
  const hunter = { kind: 'hunter', recordId: 'hunter-12345678', revision: 'hunt-v1', rsvpId: registration.recordId,
    codigoIngresso: registration.codigoIngresso, encontrados: [1, 2, 3, 4, 5], codigoDistintivo: 'ALIEN-TEST12345678' };
  assert.equal(f.post(hunter).result, 'error');
  f.post(registration);
  assert.equal(f.post(hunter).result, 'success');
  const data = records.dashboard(f.post({ action: 'dashboard', password: 'noah2027' }));
  assert.equal(data.summary.badges, 1);
  assert.equal(data.rsvps[0].badgeStatus, 'Sim');
});

test('planilha separa vouchers por idade, exige escolha e mantém histórico de entregas', () => {
  const f = fixture();
  const data = { ...registration, criancas: 4, detalhesCriancas: JSON.stringify([0, 12, 13, 17].map(age => ({ name: 'Idade ' + age, age }))) };
  assert.equal(f.post({ ...data, detalhesCriancas: JSON.stringify([{ age: '' }]) }).result, 'error');
  assert.equal(f.post(data).result, 'success');
  let rows = f.sheets.get('Vouchers').rows;
  assert.deepEqual(rows.slice(1).map(row => [row[2], row[3], row[5], row[6]]),
    [[0, 'Criança', 2, 'Disponível'], [12, 'Criança', 2, 'Disponível'], [13, 'Pré-adolescente', 1, 'Disponível'], [17, 'Pré-adolescente', 1, 'Disponível']]);
  const action = { action: 'redeemVoucher', password: 'noah2027', code: 'VOUCH-GOLD-TEST1234-4' };
  assert.equal(f.post(action).result, 'success');
  assert.equal(f.post(action).result, 'error');
  assert.equal(rows[4][6], 'Entregue');
  assert.deepEqual(f.sheets.get('Entregas de lembrancinhas').rows[1].slice(6), [17, 'Pré-adolescente']);
  f.post({ action: 'dashboard', password: 'noah2027' });
  assert.equal(rows.length, 5);
  assert.equal(f.post({ action: 'cancelRsvp', password: 'noah2027', id: registration.recordId }).result, 'success');
  assert.ok(rows.slice(1).every(row => row[6] === 'Cancelado'));
  assert.equal(f.sheets.get('Entregas de lembrancinhas').rows.length, 2);
});
