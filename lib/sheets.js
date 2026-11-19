const { randomUUID } = require('crypto');
const toSheetPayload = require('../js/sheet-payload');

function markPending(record) {
  record.sheetSync = { status: 'pending', revision: randomUUID(), attempts: 0, nextAttemptAt: 0 };
  return record;
}

async function postToSheets(url, payload) {
  const response = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload), signal: AbortSignal.timeout(15000), redirect: 'follow'
  });
  if (!response.ok) throw new Error(`Planilha respondeu HTTP ${response.status}`);
  let answer;
  try { answer = await response.json(); }
  catch { throw new Error('A planilha não confirmou o registro em JSON. Confira a implantação do Apps Script.'); }
  if (answer.result !== 'success' || answer.recordId !== payload.recordId || answer.revision !== payload.revision) {
    throw new Error(answer.error || 'A planilha não confirmou este registro. Atualize o Apps Script.');
  }
  return answer;
}

module.exports = { markPending, toSheetPayload, postToSheets };
