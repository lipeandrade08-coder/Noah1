/**
 * CONFIGURAÇÃO DO CONVITE - NOAH STORY (1º ANINHO)
 * Tema oficial: Toy Story / Noah Story
 * Data da Festa: 16 de Janeiro de 2027
 */

const PARTY_CONFIG = {
  // Identifica a abertura oficial e invalida o progresso e as filas da fase de testes.
  campaignId: "noah-live-20261123-01",
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
    rule: "Cada pessoa/família leva apenas 500g de carne por pessoa!",
    description: "Para comemorar em grande estilo, faremos um delicioso Churrasco Americano! Traga seus cortes favoritos (picanha, fraldinha, linguiça, frango, etc.). A família do Noah cuidará de todas as bebidas, acompanhamentos, saladas, bolo e docinhos com muito carinho!"
  },

  // Local do Evento
  location: {
    name: "Espaço Geová Jireh",
    address: "Rua Jose Verza, 109 - Santa Luzia",
    cityState: "Guaratinguetá - SP",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Espa%C3%A7o+Geov%C3%A1+Jireh+Rua+Jose+Verza+109+Guaratinguet%C3%A1+SP",
    wazeUrl: "https://waze.com/ul?q=Rua+Jose+Verza+109+Guaratingueta"
  },

  // Integração com o Google Sheets (cole aqui a URL do seu Google Apps Script)
  googleScriptUrl: "https://script.google.com/macros/s/AKfycbx_sp08d5z-Jiis6aKiJjzdFbUPm1ovyyKKI7g_vgfwbGs87sSNJQ3LIU-Me0T-jbHq/exec",

  // Contato dos Pais (WhatsApp com DDD)
  hostWhatsapp: "5511999999999",

  // Dicas para os convidados (em Português BR)
  tips: {
    dressCode: "Venham com uma roupa confortável.",
    clothingSize: "Tamanhos de 1 a 2 anos",
    shoeSize: "Numeração 20/21",
    bbqRule: "Churrasco Americano: Levar apenas 500g de carne por pessoa (bebidas por nossa conta!)",
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
    if (localStorage.getItem("noah_campaign_id") !== PARTY_CONFIG.campaignId) {
      ["noah_story_rsvps", "noah_story_messages", "noah_delivery_queue_v2", "noah_alien_hunt_v2",
        "noah_alien_badge_v2", "noah_invite_script_url"].forEach(key => localStorage.removeItem(key));
      localStorage.setItem("noah_campaign_id", PARTY_CONFIG.campaignId);
      localStorage.setItem("noah_delivery_migrated_v2", "1");
      localStorage.setItem("noah_messages_migrated_v1", "1");
    }
    const savedScriptUrl = localStorage.getItem("noah_invite_script_url");
    if (savedScriptUrl && savedScriptUrl.trim() !== "") {
      PARTY_CONFIG.googleScriptUrl = savedScriptUrl.trim();
    }
  } catch (e) {
    console.warn("Storage inacessível:", e);
  }
})();
