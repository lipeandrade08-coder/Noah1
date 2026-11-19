const { randomUUID } = require('crypto');
const toSheetPayload = require('../js/sheet-payload');

function markPending(record) {
  record.sheetSync = { status: 'pending', revision: randomUUID(), attempts: 0, nextAttemptAt: 0 };
  return record;
}

async function requestSheet(url, payload) {
  const response = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload), signal: AbortSignal.timeout(15000), redirect: 'follow'
  });
  if (!response.ok) throw new Error(`Planilha respondeu HTTP ${response.status}`);
  let answer;
  try { answer = await response.json(); }
  catch { throw new Error('A planilha não confirmou o registro em JSON. Confira a implantação do Apps Script.'); }
  if (answer.result !== 'success') throw new Error(answer.error || 'A planilha não confirmou a operação. Atualize o Apps Script.');
  return answer;
}

async function postToSheets(url, payload) {
  const answer = await requestSheet(url, payload);
  if (answer.recordId !== payload.recordId || answer.revision !== payload.revision) {
    throw new Error(answer.error || 'A planilha não confirmou este registro. Atualize o Apps Script.');
  }
  if (payload.kind === 'hunter' && (answer.rsvpId !== payload.rsvpId || !/^ALIEN-[A-Z0-9-]{8,60}$/.test(answer.code || ''))) {
    throw new Error('A planilha ainda não confirmou o distintivo vinculado ao formulário.');
  }
  return answer;
}

module.exports = { markPending, toSheetPayload, postToSheets, requestSheet };
