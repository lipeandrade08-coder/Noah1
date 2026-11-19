/**
 * Convite Noah — publique uma nova versão após salvar.
 * As primeiras treze colunas antigas são preservadas.
 * O distintivo exige uma confirmação de presença já gravada.
 */
function respostaNoah(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function textoNoah(value) {
  var text = String(value === undefined || value === null ? "" : value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function abaNoah(book, kind) {
  var names = { rsvp: "Confirmações", hunter: "Caçadores de aliens", badge: "Distintivos", test: "Teste de conexão" };
  var sheet = book.getSheetByName(names[kind]);
  if (!sheet && kind === "rsvp") {
    var all = book.getSheets();
    for (var i = 0; i < all.length; i++) {
      if (all[i].getLastRow() && all[i].getRange(1, 2).getDisplayValue() === "Nome do Convidado") {
        sheet = all[i];
        break;
      }
    }
  }
  if (!sheet) sheet = book.insertSheet(names[kind]);
  var columns = {
    rsvp: ["Data/Hora Envio", "Nome do Convidado", "Status de Presença", "Adultos", "Crianças",
      "Nomes dos Acompanhantes", "WhatsApp / Telefone", "Recado para o Noah", "ID",
      "Código do ingresso", "Detalhes das crianças", "Revisão", "Atualizado em",
      "Distintivo", "Código do distintivo", "Data da conquista"],
    hunter: ["Concluído em", "Caçador", "Código do distintivo", "ID", "Revisão", "Atualizado em",
      "ID da confirmação", "WhatsApp / Telefone", "Código do ingresso", "Distintivo"],
    badge: ["Nome do Convidado", "WhatsApp / Telefone", "Status de Presença", "Distintivo",
      "Código do distintivo", "Código do ingresso", "ID da confirmação", "Data da conquista"],
    test: ["ID", "Teste em", "Revisão"]
  };
  var headers = columns[kind];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground("#15558d").setFontColor("#ffffff").setFontWeight("bold");
  sheet.setFrozenRows(1);
  return sheet;
}

function linhasNoah(sheet, width) {
  return sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getValues() : [];
}

function atualizarDistintivosNoah(book, registration) {
  var sheet = abaNoah(book, "badge");
  var entries = linhasNoah(sheet, 8);
  var row = sheet.getLastRow() + 1;
  for (var i = 0; i < entries.length; i++) {
    if ((registration[8] && String(entries[i][6]) === String(registration[8])) ||
        (registration[9] && String(entries[i][5]) === String(registration[9])) ||
        (registration[6] && String(entries[i][1]).replace(/\D/g, "") === String(registration[6]).replace(/\D/g, ""))) {
      row = i + 2;
      break;
    }
  }
  sheet.getRange(row, 1, 1, 8).setValues([[
    registration[1], registration[6], registration[2], registration[13] === "Sim" ? "Sim" : "Não",
    registration[14] || "", registration[9] || "", registration[8] || "", registration[15] || ""
  ]]);
}

function prepararDistintivosNoah(book) {
  var registrations = abaNoah(book, "rsvp");
  var hunters = linhasNoah(abaNoah(book, "hunter"), 10);
  var entries = linhasNoah(registrations, 16);
  abaNoah(book, "badge");
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    if (!entry[1]) continue;
    for (var j = 0; j < hunters.length; j++) {
      if (entry[8] && hunters[j][6] && String(entry[8]) === String(hunters[j][6]) && hunters[j][2]) {
        entry[13] = "Sim";
        entry[14] = hunters[j][2];
        entry[15] = hunters[j][0];
        break;
      }
    }
    entry[13] = entry[13] === "Sim" && entry[14] ? "Sim" : "Não";
    registrations.getRange(i + 2, 14, 1, 3).setValues([[entry[13], entry[14] || "", entry[15] || ""]]);
    atualizarDistintivosNoah(book, entry);
  }
}

function registrarDistintivoNoah(book, data) {
  if (!data.rsvpId || !data.codigoIngresso || !Array.isArray(data.encontrados) ||
      ![1, 2, 3, 4, 5].every(function(id) { return data.encontrados.indexOf(id) !== -1; })) {
    throw new Error("Complete a caça e envie o formulário de presença antes de emitir o distintivo.");
  }
  var registrations = abaNoah(book, "rsvp");
  var entries = linhasNoah(registrations, 16);
  var index = -1;
  for (var i = 0; i < entries.length; i++) {
    if (String(entries[i][8]) === String(data.rsvpId) && String(entries[i][9]) === String(data.codigoIngresso) &&
        entries[i][1] && entries[i][6]) { index = i; break; }
  }
  if (index === -1) throw new Error("O formulário de presença ainda não foi confirmado na planilha.");
  var registration = entries[index];
  var sheet = abaNoah(book, "hunter");
  var hunters = linhasNoah(sheet, 10);
  var row = sheet.getLastRow() + 1;
  var existing = null;
  for (var j = 0; j < hunters.length; j++) {
    if (String(hunters[j][6]) === String(data.rsvpId) || String(hunters[j][3]) === String(data.recordId) ||
        (registration[14] && String(hunters[j][2]) === String(registration[14]))) {
      row = j + 2;
      existing = hunters[j];
      break;
    }
  }
  if (existing && existing[6] && String(existing[6]) !== String(data.rsvpId) &&
      String(existing[7]).replace(/\D/g, "") !== String(registration[6]).replace(/\D/g, "")) {
    throw new Error("Esta conquista já está vinculada a outro formulário.");
  }
  var code = existing && existing[2] ? String(existing[2]) : String(data.codigoDistintivo || "");
  if (!/^ALIEN-[A-Z0-9-]{8,60}$/.test(code)) throw new Error("Código de distintivo inválido.");
  var completed = existing && existing[0] ? existing[0] : data.concluidoEm || new Date().toISOString();
  var hunterId = existing && existing[3] ? existing[3] : data.recordId;
  sheet.getRange(row, 1, 1, 10).setValues([[
    completed, registration[1], code, hunterId, data.revision, new Date().toISOString(),
    data.rsvpId, registration[6], registration[9], "Sim"
  ]]);
  registration[13] = "Sim";
  registration[14] = code;
  registration[15] = completed;
  registrations.getRange(index + 2, 14, 1, 3).setValues([["Sim", code, completed]]);
  atualizarDistintivosNoah(book, registration);
  SpreadsheetApp.flush();
  if (registrations.getRange(index + 2, 14).getValue() !== "Sim" ||
      String(sheet.getRange(row, 3).getValue()) !== code) throw new Error("A planilha não confirmou o distintivo.");
  return respostaNoah({
    result: "success", recordId: data.recordId, revision: data.revision, row: row,
    code: code, rsvpId: String(data.rsvpId), message: "Distintivo vinculado ao formulário e registrado."
  });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  var acquired = false;
  try {
    acquired = lock.tryLock(20000);
    if (!acquired) return respostaNoah({ result: "error", error: "Planilha ocupada. Tente novamente." });
    var data;
    try { data = JSON.parse(e.postData.contents); }
    catch (ignored) { data = e.parameter || {}; }
    var kind = data.kind || "rsvp";
    if (["rsvp", "hunter", "test"].indexOf(kind) === -1) throw new Error("Tipo de registro inválido.");
    var book = SpreadsheetApp.getActiveSpreadsheet();
    if (!book) throw new Error("Este Apps Script precisa estar vinculado à planilha do convite.");
    var id = String(data.recordId || data.codigoIngresso || ("legacy-" + (data.telefone || data.nome || "")));
    if (id === "legacy-") throw new Error("Registro sem identificação.");
    data.recordId = id;
    data.revision = data.revision || ("legacy-" + new Date().toISOString());
    if (kind === "hunter") return registrarDistintivoNoah(book, data);
    if (kind === "test") {
      prepararDistintivosNoah(book);
      var test = abaNoah(book, "test");
      test.getRange(2, 1, 1, 3).setValues([[id, new Date().toISOString(), data.revision]]);
      SpreadsheetApp.flush();
      if (String(test.getRange(2, 3).getValue()) !== String(data.revision)) throw new Error("Teste de gravação não confirmado.");
      return respostaNoah({ result: "success", recordId: id, revision: data.revision, row: 2,
        message: "Gravação confirmada. Aba Distintivos e coluna Sim/Não atualizadas." });
    }
    if (!String(data.nome || "").trim()) throw new Error("Informe o nome.");
    var sheet = abaNoah(book, "rsvp");
    var old = linhasNoah(sheet, 16);
    var row = sheet.getLastRow() + 1;
    for (var i = 0; i < old.length; i++) {
      var same = String(old[i][8]) === id;
      if (!same) {
        var oldPhone = String(old[i][6]).replace(/\D/g, "");
        var phone = String(data.telefone || "").replace(/\D/g, "");
        same = phone ? oldPhone === phone : String(old[i][1]).trim().toLowerCase() === String(data.nome).trim().toLowerCase();
      }
      if (same) { row = i + 2; break; }
    }
    var issued = data.issuedAt || new Date().toISOString();
    var existing = row <= sheet.getLastRow() ? old[row - 2] : null;
    var stale = existing && String(existing[12]) > String(issued);
    if (!stale) {
      var values = [
        existing ? existing[0] : Utilities.formatDate(new Date(), "America/Sao_Paulo", "dd/MM/yyyy HH:mm:ss"),
        textoNoah(data.nome), textoNoah(data.presenca), Number(data.adultos) || 0, Number(data.criancas) || 0,
        textoNoah(data.acompanhantes), textoNoah(data.telefone), textoNoah(data.mensagem),
        id, textoNoah(data.codigoIngresso), textoNoah(data.detalhesCriancas || "[]"), data.revision, issued,
        existing && existing[13] === "Sim" ? "Sim" : "Não",
        existing ? existing[14] || "" : "", existing ? existing[15] || "" : ""
      ];
      sheet.getRange(row, 1, 1, 16).setValues([values]);
    }
    atualizarDistintivosNoah(book, sheet.getRange(row, 1, 1, 16).getValues()[0]);
    SpreadsheetApp.flush();
    if (String(sheet.getRange(row, 9).getValue()) !== String(stale ? existing[8] : id)) throw new Error("A leitura não confirmou a gravação.");
    if (!stale && String(sheet.getRange(row, 12).getValue()) !== String(data.revision)) throw new Error("A revisão gravada não confere.");
    return respostaNoah({ result: "success", recordId: id, revision: data.revision, row: row, message: "Registro confirmado." });
  } catch (error) {
    return respostaNoah({ result: "error", error: String(error.message || error) });
  } finally {
    if (acquired) lock.releaseLock();
  }
}

function doGet() {
  return respostaNoah({ result: "active", version: 3, message: "Distintivos vinculados ao formulário de presença." });
}
