/**
 * CONFIGURAÇÃO DO CONVITE - NOAH STORY (1º ANINHO)
 * Tema oficial: Toy Story / Noah Story
 * Data da Festa: 16 de Janeiro de 2027
 */

const PARTY_CONFIG = {
  // Informações do Aniversariante
  childName: "Noah",
  ageNumber: "1",
  ageText: "1º Aninho",
  themeTitle: "Noah Story",
  subTitle: "Ao infinito e além para comemorar o primeiro aninho do Noah!",

  // Data e Horário da Festa
  eventDateISO: "2027-01-16T11:30:00",
  dateFormatted: "Sábado, 16 de Janeiro de 2027",
  timeFormatted: "A partir das 11:30 horas (Churrasco Americano)",

  // Detalhes do Churrasco Americano
  bbq: {
    title: "Churrasco Americano do Xerife Noah! 🥩🤠",
    rule: "Cada pessoa/família leva 500g de carne por pessoa + 1 bebida da sua preferência!",
    description: "Para comemorar em grande estilo, faremos um delicioso Churrasco Americano! Traga seus cortes favoritos (picanha, fraldinha, linguiça, frango, etc.) e sua bebida gelada preferida. A família do Noah cuidará de todos os acompanhamentos, saladas, pão de alho, bolo e docinhos!"
  },

  // Local do Evento
  location: {
    name: "Espaço DiverKids & Brincadeiras",
    address: "Rua das Nuvens Felizes, 123 - Bairro Encantado",
    cityState: "São Paulo - SP",
    googleMapsUrl: "https://maps.google.com/?q=Espaco+Kids+Sao+Paulo",
    wazeUrl: "https://waze.com/ul?q=Espaco+Kids"
  },

  // Integração com o Google Sheets (cole aqui a URL do seu Google Apps Script)
  googleScriptUrl: "",

  // Contato dos Pais (WhatsApp com DDD)
  hostWhatsapp: "5511999999999",

  // Dicas para os convidados (em Português BR)
  tips: {
    dressCode: "Venha bem confortável para brincar muito no quarto do Andy!",
    clothingSize: "Tamanho de Roupinha: 1 a 2 anos | Calçado: 20/21",
    diaperSize: "Fralda: Tamanho G ou XG (qualquer marca)",
    bbqRule: "Churrasco Americano: Levar 500g de carne por pessoa + 1 bebida favorita",
    giftWishlistUrl: "",
    pixKey: ""
  },

  // Trilha Sonora Oficial
  audioTrackUrl: "assets/audio/amigo-estou-aqui.mp3",

  // Frases do Toy Story / Noah Story
  quotes: [
    "Amigo, estou aqui!",
    "Ao infinito... e além!",
    "Você é o nosso brinquedo favorito!"
  ]
};

// Sincroniza URL salva localmente pelo painel administrativo
(function syncStoredConfig() {
  try {
    const savedScriptUrl = localStorage.getItem("noah_invite_script_url");
    if (savedScriptUrl && savedScriptUrl.trim() !== "") {
      PARTY_CONFIG.googleScriptUrl = savedScriptUrl.trim();
    }
  } catch (e) {
    console.warn("Storage inacessível:", e);
  }
})();
