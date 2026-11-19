/**
 * Convite Noah — publique uma nova versão após salvar.
 * As primeiras treze colunas antigas são preservadas.
 * O distintivo exige uma confirmação de presença já gravada.
 */
var NOAH_CAMPAIGN = "noah-live-20261119-01";
function respostaNoah(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function textoNoah(value) {
  var text = String(value === undefined || value === null ? "" : value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function abaNoah(book, kind) {
  var names = { rsvp: "Confirmações", hunter: "Caçadores de aliens", badge: "Distintivos", test: "Teste de conexão",
    message: "Recados para o Noah", delivery: "Entregas de lembrancinhas", voucher: "Vouchers" };
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
    test: ["ID", "Teste em", "Revisão"],
    message: ["ID", "Enviado em", "De", "Para", "Mensagem", "Origem", "ID da confirmação", "Status", "Revisão", "Atualizado em"],
    delivery: ["Código do voucher", "Entregue em", "Criança", "Responsável", "Quantidade", "ID da confirmação", "Idade", "Tipo de voucher"],
    voucher: ["Código do voucher", "Criança / pré-adolescente", "Idade", "Tipo de voucher", "Responsável", "Quantidade", "Status", "Entregue em", "ID da confirmação", "Código do ingresso"]
  };
  var headers = columns[kind];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground(kind === "message" ? "#6d28d9" : "#15558d").setFontColor("#ffffff")
    .setFontWeight("bold").setFontFamily("Arial").setFontSize(12).setWrap(true);
  sheet.setFrozenRows(1);
  return sheet;
}

function ajustarAlturaNoah(sheet, row, width) {
  sheet.getRange(row, 1, 1, width).setFontFamily("Arial").setFontSize(12).setVerticalAlignment("middle");
  sheet.autoResizeRows(row, 1);
  if (sheet.getRowHeight(row) < 44) sheet.setRowHeight(row, 44);
}

function linhasNoah(sheet, width) {
  return sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getValues() : [];
}

function dataISOnoah(value) {
  return value instanceof Date ? value.toISOString() : String(value || "");
}

function confirmacoesNoah(book) {
  return linhasNoah(abaNoah(book, "rsvp"), 16).map(function(row, index) {
    if (!row[1]) return null;
    var children = [];
    try { children = JSON.parse(String(row[10] || "[]")); } catch (ignored) {}
    if (!Array.isArray(children)) children = [];
    return { id: String(row[8] || "sheet-row-" + (index + 2)), name: String(row[1]), presence: String(row[2]),
      adults: Number(row[3]) || 0, children: Number(row[4]) || 0, companions: String(row[5] || ""),
      phone: String(row[6] || ""), message: String(row[7] || ""), ticketCode: String(row[9] || ""),
      childrenDetails: children, createdAt: dataISOnoah(row[0]), updatedAt: dataISOnoah(row[12]),
      badgeStatus: row[13] === "Sim" ? "Sim" : "Não", badgeCode: String(row[14] || ""),
      completedAt: dataISOnoah(row[15]), sheetSync: { status: "synced" } };
  }).filter(Boolean);
}

function recadosNoah(book, registrations) {
  var messages = linhasNoah(abaNoah(book, "message"), 10).filter(function(row) { return row[0]; }).map(function(row) {
    return { id: String(row[0]), createdAt: dataISOnoah(row[1]), author: String(row[2] || ""),
      recipient: String(row[3] || "Pequeno Xerife Noah"), message: String(row[4] || ""), source: String(row[5] || "capsule"),
      rsvpId: String(row[6] || ""), status: String(row[7] || "approved"), sheetSync: { status: "synced" } };
  });
  registrations.forEach(function(record) {
    if (!record.message.trim() || messages.some(function(item) { return item.rsvpId === record.id; })) return;
    messages.push({ id: "rsvp-" + record.id, author: record.name, message: record.message, rsvpId: record.id,
      recipient: "Pequeno Xerife Noah", source: "rsvp", status: "approved", createdAt: record.updatedAt || record.createdAt });
  });
  return messages.filter(function(item) { return item.status === "approved"; }).sort(function(a, b) {
    return String(b.createdAt).localeCompare(String(a.createdAt));
  });
}

function gravarRecadoNoah(book, data) {
  if (!String(data.nome || "").trim() || !String(data.mensagem || "").trim()) throw new Error("Nome e recado são obrigatórios.");
  if (String(data.nome).length > 160 || String(data.mensagem).length > 5000) throw new Error("O recado ultrapassa o tamanho permitido.");
  var id = data.rsvpId ? "rsvp-" + data.rsvpId : String(data.recordId || "");
  if (!id || id.length > 120 || !data.revision) throw new Error("Recado sem identificação.");
  var sheet = abaNoah(book, "message");
  var entries = linhasNoah(sheet, 10);
  var index = entries.findIndex(function(row) { return String(row[0]) === id; });
  var previous = index >= 0 ? entries[index] : null;
  var issued = data.issuedAt || new Date().toISOString();
  if (!previous || (String(previous[9]) <= String(issued) && previous[7] !== "archived")) {
    var destination = index >= 0 ? index + 2 : sheet.getLastRow() + 1;
    sheet.getRange(destination, 1, 1, 10).setValues([[
      id, previous ? previous[1] : issued, textoNoah(data.nome), "Pequeno Xerife Noah", textoNoah(data.mensagem),
      data.rsvpId ? "rsvp" : "capsule", String(data.rsvpId || ""), "approved", data.revision, issued
    ]]);
    ajustarAlturaNoah(sheet, destination, 10);
  }
  SpreadsheetApp.flush();
  var row = linhasNoah(sheet, 10).find(function(item) { return String(item[0]) === id; });
  if (!row || (!previous && String(row[8]) !== String(data.revision))) throw new Error("A leitura não confirmou o recado.");
  return { result: "success", recordId: id, revision: data.revision, message: "Recado endereçado ao Noah e confirmado na planilha." };
}

function painelNoah(book) {
  var registrations = confirmacoesNoah(book);
  sincronizarVouchersNoah(book, registrations);
  return { result: "success", source: "sheet", updatedAt: new Date().toISOString(), rsvps: registrations,
    messages: recadosNoah(book, registrations), deliveries: linhasNoah(abaNoah(book, "delivery"), 6).map(function(row) {
      return { code: String(row[0]), redeemed: true, redeemedAt: dataISOnoah(row[1]) };
    }) };
}

function acaoNoah(book, data) {
  if (data.action === "publicMessages") {
    // A consulta pública devolve somente recados aprovados; nunca telefones ou ingressos.
    return { result: "success", messages: recadosNoah(book, confirmacoesNoah(book)).slice(0, 6).map(function(item) {
      return { id: item.id, author: item.author, message: item.message, recipient: item.recipient, createdAt: item.createdAt, status: "approved" };
    }) };
  }
  var password = PropertiesService.getScriptProperties().getProperty("NOAH_ADMIN_PASSWORD") || "noah2027";
  if (!data.password || String(data.password) !== password) throw new Error("Senha dos pais incorreta.");
  if (data.action === "dashboard") return painelNoah(book);
  if (data.action === "archiveMessage") {
    var registrations = confirmacoesNoah(book);
    var message = recadosNoah(book, registrations).find(function(item) { return item.id === data.id; });
    var sheet = abaNoah(book, "message");
    var rows = linhasNoah(sheet, 10);
    var index = rows.findIndex(function(row) { return String(row[0]) === String(data.id); });
    if (index < 0 && message) {
      gravarRecadoNoah(book, { recordId: message.id, rsvpId: message.rsvpId, nome: message.author,
        mensagem: message.message, revision: Utilities.getUuid(), issuedAt: new Date().toISOString() });
      index = linhasNoah(sheet, 10).findIndex(function(row) { return String(row[0]) === String(data.id); });
    }
    if (index < 0) throw new Error("Recado não encontrado.");
    sheet.getRange(index + 2, 8).setValue("archived");
    return { result: "success", message: "Recado arquivado. O texto continua guardado na planilha." };
  }
  if (data.action === "cancelRsvp") {
    var sheet = abaNoah(book, "rsvp");
    var rows = linhasNoah(sheet, 16);
    var index = rows.findIndex(function(row, index) { return String(row[8] || "sheet-row-" + (index + 2)) === String(data.id); });
    if (index < 0) throw new Error("Confirmação não encontrada.");
    sheet.getRange(index + 2, 3).setValue("Cancelado");
    sheet.getRange(index + 2, 13).setValue(new Date().toISOString());
    atualizarDistintivosNoah(book, sheet.getRange(index + 2, 1, 1, 16).getValues()[0]);
    sincronizarVouchersNoah(book);
    return { result: "success", message: "Presença cancelada. O registro continua guardado na planilha." };
  }
  if (data.action === "redeemVoucher") {
    var match;
    confirmacoesNoah(book).forEach(function(record) {
      if (record.presence !== "Confirmado") return;
      var sequence = 1;
      record.childrenDetails.forEach(function(child) {
        if (child.age === "" || child.age === null || child.age === undefined) return;
        var age = Number(child.age);
        if (!Number.isInteger(age) || age < 0 || age > 17 || !record.ticketCode) return;
        var type = age <= 12 ? "RED" : "GOLD";
        var code = "VOUCH-" + type + "-" + record.ticketCode.replace("NOAH-1-", "") + "-" + sequence++;
        if (code === data.code) match = { code: code, name: child.name || "Criança", age: age,
          category: age <= 12 ? "Criança" : "Pré-adolescente", guest: record.name, qty: age <= 12 ? 2 : 1, id: record.id };
      });
    });
    if (!match) throw new Error("Voucher não encontrado entre as presenças confirmadas.");
    var deliveries = abaNoah(book, "delivery");
    if (linhasNoah(deliveries, 6).some(function(row) { return String(row[0]) === match.code; })) throw new Error("Este voucher já foi entregue.");
    deliveries.getRange(deliveries.getLastRow() + 1, 1, 1, 8).setValues([[
      match.code, new Date().toISOString(), textoNoah(match.name), textoNoah(match.guest), match.qty, match.id, match.age, match.category
    ]]);
    deliveries.getRange(deliveries.getLastRow(), 1, 1, 8).setBackground(match.age <= 12 ? "#fce7f3" : "#dbeafe");
    ajustarAlturaNoah(deliveries, deliveries.getLastRow(), 8);
    sincronizarVouchersNoah(book);
    return { result: "success", message: "Lembrancinha entregue para " + match.name + " (" + match.qty + " itens)." };
  }
  throw new Error("Ação desconhecida. Atualize a implantação do Apps Script.");
}

// Uma linha por beneficiário permite separar as cores dentro da mesma família.
// Os códigos RED/GOLD existentes permanecem válidos e as entregas nunca são apagadas.
function sincronizarVouchersNoah(book, registrations) {
  registrations = registrations || confirmacoesNoah(book);
  var sheet = abaNoah(book, "voucher");
  var previous = linhasNoah(sheet, 10);
  var deliveries = linhasNoah(abaNoah(book, "delivery"), 8);
  var active = {};
  registrations.forEach(function(record) {
    if (record.presence !== "Confirmado" || !record.ticketCode) return;
    var sequence = 1;
    record.childrenDetails.forEach(function(child) {
      if (child.age === "" || child.age === null || child.age === undefined) return;
      var age = Number(child.age);
      if (!Number.isInteger(age) || age < 0 || age > 17) return;
      var code = "VOUCH-" + (age <= 12 ? "RED" : "GOLD") + "-" + record.ticketCode.replace("NOAH-1-", "") + "-" + sequence++;
      active[code] = true;
      var delivery = deliveries.find(function(row) { return String(row[0]) === code; });
      var values = [code, textoNoah(child.name || "Criança"), age, age <= 12 ? "Criança" : "Pré-adolescente",
        textoNoah(record.name), age <= 12 ? 2 : 1, delivery ? "Entregue" : "Disponível",
        delivery ? dataISOnoah(delivery[1]) : "", record.id, record.ticketCode];
      var index = previous.findIndex(function(row) { return String(row[0]) === code; });
      var destination = index < 0 ? sheet.getLastRow() + 1 : index + 2;
      if (index < 0 || JSON.stringify(previous[index]) !== JSON.stringify(values)) {
        sheet.getRange(destination, 1, 1, 10).setValues([values]).setWrap(true)
          .setBackground(age <= 12 ? "#fce7f3" : "#dbeafe").setFontColor(age <= 12 ? "#831843" : "#1e3a8a");
        ajustarAlturaNoah(sheet, destination, 10);
      }
    });
  });
  previous.forEach(function(row, index) {
    if (row[0] && !active[String(row[0])] && row[6] !== "Cancelado") sheet.getRange(index + 2, 7).setValue("Cancelado");
  });
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
  ajustarAlturaNoah(sheet, row, 8);
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
  ajustarAlturaNoah(sheet, row, 10);
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
    var book = SpreadsheetApp.getActiveSpreadsheet();
    if (!book) throw new Error("Este Apps Script precisa estar vinculado à planilha do convite.");
    if ((!data.action || ["redeemVoucher", "cancelRsvp", "archiveMessage"].indexOf(data.action) !== -1) && data.campaignId !== NOAH_CAMPAIGN) {
      throw new Error("O convite foi reiniciado para a abertura oficial. Recarregue a página antes de enviar.");
    }
    if (data.action) return respostaNoah(acaoNoah(book, data));
    var kind = data.kind || "rsvp";
    if (["rsvp", "hunter", "message", "test"].indexOf(kind) === -1) throw new Error("Tipo de registro inválido.");
    var id = String(data.recordId || data.codigoIngresso || ("legacy-" + (data.telefone || data.nome || "")));
    if (id === "legacy-") throw new Error("Registro sem identificação.");
    data.recordId = id;
    data.revision = data.revision || ("legacy-" + new Date().toISOString());
    if (kind === "message") return respostaNoah(gravarRecadoNoah(book, data));
    if (kind === "hunter") return registrarDistintivoNoah(book, data);
    if (kind === "test") {
      prepararDistintivosNoah(book);
      sincronizarVouchersNoah(book);
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
      if (data.presenca === "Confirmado") {
        var children;
        try { children = JSON.parse(data.detalhesCriancas || "[]"); } catch (ignored) { throw new Error("Informe as idades das crianças e pré-adolescentes."); }
        if (!Array.isArray(children) || children.length !== Number(data.criancas || 0) || children.some(function(child) {
          return child.age === "" || child.age === null || child.age === undefined || !Number.isInteger(Number(child.age)) || Number(child.age) < 0 || Number(child.age) > 17;
        })) throw new Error("Informe a idade de cada criança ou pré-adolescente, de 0 a 17 anos.");
      }
      var values = [
        existing ? existing[0] : Utilities.formatDate(new Date(), "America/Sao_Paulo", "dd/MM/yyyy HH:mm:ss"),
        textoNoah(data.nome), textoNoah(data.presenca), Number(data.adultos) || 0, Number(data.criancas) || 0,
        textoNoah(data.acompanhantes), textoNoah(data.telefone), textoNoah(data.mensagem),
        id, textoNoah(data.codigoIngresso), textoNoah(data.detalhesCriancas || "[]"), data.revision, issued,
        existing && existing[13] === "Sim" ? "Sim" : "Não",
        existing ? existing[14] || "" : "", existing ? existing[15] || "" : ""
      ];
      sheet.getRange(row, 1, 1, 16).setValues([values]);
      ajustarAlturaNoah(sheet, row, 16);
    }
    atualizarDistintivosNoah(book, sheet.getRange(row, 1, 1, 16).getValues()[0]);
    sincronizarVouchersNoah(book);
    if (!stale && String(data.mensagem || "").trim()) {
      gravarRecadoNoah(book, { recordId: "rsvp-" + id, rsvpId: id, nome: data.nome,
        mensagem: data.mensagem, revision: data.revision, issuedAt: issued });
    }
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
  return respostaNoah({ result: "active", version: 8, campaignId: NOAH_CAMPAIGN, message: "Convite em uso oficial. Confirmações, distintivos, recados e vouchers conectados à planilha." });
}
