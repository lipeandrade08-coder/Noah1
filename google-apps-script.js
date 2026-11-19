/**
 * Convite Noah — publique uma nova versão da implantação após salvar.
 * As oito primeiras colunas antigas são preservadas.
 * Confirmações e conquistas usam IDs para que novas tentativas atualizem a mesma linha.
 */
function respostaNoah(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function textoNoah(value) {
  var text = String(value === undefined || value === null ? "" : value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function abaNoah(book, kind) {
  var name = kind === "hunter" ? "Caçadores de aliens" : kind === "test" ? "Teste de conexão" : "Confirmações";
  var sheet = book.getSheetByName(name);
  if (!sheet && kind === "rsvp") {
    var all = book.getSheets();
    for (var i = 0; i < all.length; i++) {
      if (all[i].getLastRow() && all[i].getRange(1, 2).getDisplayValue() === "Nome do Convidado") {
        sheet = all[i];
        break;
      }
    }
  }
  if (!sheet) sheet = book.insertSheet(name);
  var headers = kind === "hunter"
    ? ["Concluído em", "Caçador", "Código do distintivo", "ID", "Revisão", "Atualizado em"]
    : kind === "test"
    ? ["ID", "Teste em", "Revisão"]
    : ["Data/Hora Envio", "Nome do Convidado", "Status de Presença", "Adultos", "Crianças",
       "Nomes dos Acompanhantes", "WhatsApp / Telefone", "Recado para o Noah", "ID",
       "Código do ingresso", "Detalhes das crianças", "Revisão", "Atualizado em"];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground("#15558d").setFontColor("#ffffff").setFontWeight("bold");
  sheet.setFrozenRows(1);
  return sheet;
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
    data.revision = data.revision || ("legacy-" + new Date().toISOString());
    if (kind !== "test" && !String(data.nome || "").trim()) throw new Error("Informe o nome.");
    var sheet = abaNoah(book, kind);
    var idColumn = kind === "rsvp" ? 9 : kind === "hunter" ? 4 : 1;
    var revisionColumn = kind === "rsvp" ? 12 : kind === "hunter" ? 5 : 3;
    var timeColumn = kind === "rsvp" ? 13 : kind === "hunter" ? 6 : 2;
    var row = sheet.getLastRow() + 1;
    var old = sheet.getLastRow() > 1
      ? sheet.getRange(2, 1, sheet.getLastRow() - 1, kind === "rsvp" ? 13 : kind === "hunter" ? 6 : 3).getValues() : [];
    for (var i = 0; i < old.length; i++) {
      var same = String(old[i][idColumn - 1]) === id;
      if (!same && kind === "rsvp") {
        var oldPhone = String(old[i][6]).replace(/\D/g, "");
        var phone = String(data.telefone || "").replace(/\D/g, "");
        same = phone ? oldPhone === phone : String(old[i][1]).trim().toLowerCase() === String(data.nome).trim().toLowerCase();
      }
      if (same) { row = i + 2; break; }
    }
    var issued = data.issuedAt || data.concluidoEm || new Date().toISOString();
    var existing = row <= sheet.getLastRow() ? old[row - 2] : null;
    var stale = existing && String(existing[timeColumn - 1]) > String(issued);
    if (!stale) {
      var values;
      if (kind === "test") {
        values = [id, new Date().toISOString(), data.revision];
      } else if (kind === "hunter") {
        values = [data.concluidoEm || issued, textoNoah(data.nome), textoNoah(data.codigoDistintivo), id, data.revision, issued];
      } else {
        values = [
          existing ? existing[0] : Utilities.formatDate(new Date(), "America/Sao_Paulo", "dd/MM/yyyy HH:mm:ss"),
          textoNoah(data.nome), textoNoah(data.presenca), Number(data.adultos) || 0, Number(data.criancas) || 0,
          textoNoah(data.acompanhantes), textoNoah(data.telefone), textoNoah(data.mensagem),
          id, textoNoah(data.codigoIngresso), textoNoah(data.detalhesCriancas || "[]"), data.revision, issued
        ];
      }
      sheet.getRange(row, 1, 1, values.length).setValues([values]);
    }
    SpreadsheetApp.flush();
    if (String(sheet.getRange(row, idColumn).getValue()) !== String(stale ? existing[idColumn - 1] : id)) throw new Error("A leitura não confirmou a gravação.");
    if (!stale && String(sheet.getRange(row, revisionColumn).getValue()) !== String(data.revision)) {
      throw new Error("A revisão gravada não confere.");
    }
    return respostaNoah({
      result: "success", recordId: id, revision: data.revision, row: row,
      message: kind === "test" ? "Gravação e leitura de teste confirmadas." : "Registro confirmado."
    });
  } catch (error) {
    return respostaNoah({ result: "error", error: String(error.message || error) });
  } finally {
    if (acquired) lock.releaseLock();
  }
}

function doGet() {
  return respostaNoah({ result: "active", version: 2, message: "Convite Noah pronto para confirmar gravações." });
}
