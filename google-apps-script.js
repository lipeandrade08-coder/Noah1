/**
 * ==========================================================================
 * CÓDIGO DO GOOGLE APPS SCRIPT - CONVITE NOAH STORY (1º ANINHO)
 * Tema: Toy Story / Noah Story - 16 de Janeiro de 2027
 * ==========================================================================
 * 
 * INSTRUÇÕES RÁPIDAS PARA ATIVAR:
 * 
 * 1. Abra o Google Planilhas (https://sheets.new) e crie uma planilha nova.
 *    Nomeie como: "Confirmações - Noah Story 1º Aninho"
 * 
 * 2. No menu superior da planilha, clique em:
 *    "Extensões" > "Apps Script"
 * 
 * 3. Apague qualquer código que estiver lá e cole todo este código abaixo.
 * 
 * 4. Clique no ícone de Salvar (💾).
 * 
 * 5. Clique no botão azul "Implantar" (canto superior direito) > "Nova implantação".
 * 
 * 6. Na engrenagem ao lado de "Selecione o tipo", escolha "App da Web".
 * 
 * 7. Preencha as configurações:
 *    - Descrição: "API Convite Noah"
 *    - Executar como: "Eu (seu email)"
 *    - Quem pode acessar: "Qualquer pessoa" (MUITO IMPORTANTE para os convidados conseguirem enviar sem fazer login!)
 * 
 * 8. Clique em "Implantar". Autorize as permissões da sua conta Google.
 * 
 * 9. Copie a "URL do app da Web" gerada (termina com `/exec`) e cole
 *    no arquivo `js/config.js` na variável `googleScriptUrl` (ou pelo painel do convite).
 * 
 * Pronto! Todas as confirmações irão direto para a sua planilha em tempo real!
 * ==========================================================================
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // Aguarda até 10s para evitar concorrência simultânea

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Se a planilha estiver vazia, cria o cabeçalho estilizado automaticamente
    if (sheet.getLastRow() === 0) {
      criarCabecalhoEstilizado(sheet);
    }

    var data;
    // Suporta envio em JSON ou formulário URL encoded
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter;
      }
    } else {
      data = e.parameter || {};
    }

    var agora = new Date();
    var dataHoraFormatada = Utilities.formatDate(agora, "America/Sao_Paulo", "dd/MM/yyyy HH:mm:ss");

    var nome = data.nome || "Não informado";
    var presenca = data.presenca || "Confirmado"; // 'Confirmado' ou 'Não comparecerá'
    var adultos = data.adultos !== undefined ? data.adultos : 1;
    var criancas = data.criancas !== undefined ? data.criancas : 0;
    var acompanhantes = data.acompanhantes || "";
    var telefone = data.telefone || "";
    var mensagem = data.mensagem || "";

    // Adiciona a linha na planilha
    sheet.appendRow([
      dataHoraFormatada,
      nome,
      presenca,
      adultos,
      criancas,
      acompanhantes,
      telefone,
      mensagem
    ]);

    // Aplica formatação condicional sutil na linha adicionada
    var ultimaLinha = sheet.getLastRow();
    var celulaPresenca = sheet.getRange(ultimaLinha, 3);
    if (presenca.indexOf("Confirmad") !== -1 || presenca.indexOf("Sim") !== -1) {
      celulaPresenca.setBackground("#d1e7dd").setFontColor("#0f5132").setFontWeight("bold");
    } else {
      celulaPresenca.setBackground("#f8d7da").setFontColor("#842029").setFontWeight("bold");
    }

    // Retorna resposta de sucesso
    return ContentService
      .createTextOutput(JSON.stringify({ 
        result: "success", 
        message: "Presença registrada com sucesso!",
        row: ultimaLinha 
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        result: "error", 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  // Permite testar facilmente se a URL está funcionando pelo navegador
  return ContentService
    .createTextOutput(JSON.stringify({
      result: "active",
      message: "API do Convite Toy Story do Noah está online e pronta para receber confirmações!"
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Cria um cabeçalho bonito no estilo Toy Story caso a planilha esteja vazia
 */
function criarCabecalhoEstilizado(sheet) {
  var cabecalhos = [
    "Data/Hora Envio",
    "Nome do Convidado",
    "Status de Presença",
    "Adultos",
    "Crianças",
    "Nomes dos Acompanhantes",
    "WhatsApp / Telefone",
    "Recado para o Noah"
  ];

  sheet.appendRow(cabecalhos);
  var headerRange = sheet.getRange(1, 1, 1, cabecalhos.length);
  
  // Cores inspiradas no Toy Story (Azul nuvem com texto branco em negrito)
  headerRange
    .setBackground("#0056b3")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setFontSize(11);

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, cabecalhos.length);
}
