/**
 * NOAH STORY 1 — APLICAÇÃO INTERATIVA OFICIAL 🤠🚀
 * Arquitetura Cinematográfica, Web Audio API, Minijogo dos Aliens,
 * Quiz Toy Story, Botão Proibido, RSVP com QR Code & Controle de Lembrancinhas.
 */

// Estado Global da Aplicação
const AppState = {
  soundEnabled: true,
  audioCtx: null,
  bgTrackOscillators: [],
  bgTrackRunning: false,
  aliensFound: new Set(),
  currentQuizStep: 1,
  quizAnswers: [],
  rsvps: [],
  messages: [],
  adminAuthenticated: false
};

// Falas dos Personagens em Português BR
const CHARACTER_QUOTES = {
  woody: {
    name: "Woody",
    quote: "🤠 Woody diz: 'Tem uma cobra na minha bota! Mas dia 16/01/2027 estarei na primeira fila da festa do Noah!'",
    sound: "woody"
  },
  buzz: {
    name: "Buzz Lightyear",
    quote: "🚀 Buzz Lightyear diz: 'Ao infinito... e além! Decolagem autorizada com destino ao 1º aninho do Noah!'",
    sound: "buzz"
  },
  jessie: {
    name: "Jessie",
    quote: "🐎 Jessie diz: 'Iupi-i-o! Preparem os chapéus, porque essa vai ser a comemoração mais animada do velho oeste!'",
    sound: "jessie"
  },
  rex: {
    name: "Rex",
    quote: "🦖 Rex diz: 'Eu sou um dinossauro assustador... ROAAAR! Mas estou morrendo de emoção para comer brigadeiro!'",
    sound: "rex"
  },
  alien: {
    name: "Alienígena",
    quote: "👽 Marciano diz: 'Ooooh! A Garra nos escolheu para celebrar o primeiro aninho do Noah!'",
    sound: "alien"
  },
  potato: {
    name: "Sr. Cabeça de Batata",
    quote: "🥔 Sr. Cabeça de Batata diz: 'Coloquei meus sapatos novos de festa e arrumei o bigode especialmente pro Noah!'",
    sound: "potato"
  },
  hamm: {
    name: "Hamm",
    quote: "🐷 Hamm diz: 'Podem me chamar de Dr. Costela de Porco! Presença super confirmada no churrasco do Noah!'",
    sound: "hamm"
  },
  slinky: {
    name: "Slinky",
    quote: "🐶 Slinky diz: 'Slinky pronto para esticar a diversão até o infinito! Au au!'",
    sound: "slinky"
  }
};

// ==========================================
// INICIALIZAÇÃO APÓS DOM CARREGAR
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  initPartyConfig();
  initResponsiveLayout();
  initSoundSystem();
  preloadAllCharacterAudios();
  initAlienHuntMinigame();
  initInteractiveToyBlocks();
  initNoahBalloons();
  initCharactersSection();
  initSpaceMissionRocket();
  initCountdown();
  initQuizToyStory();
  initForbiddenButton();
  initAlbumCarouselAndLightbox();
  initRsvpForm();
  initTimeCapsule();
  initAdminDashboard();
  initModalKeyboardControls();
  loadInitialData();
});

function initResponsiveLayout() {
  const bar = document.querySelector(".top-action-bar");
  if (!bar) return;
  const measure = () => document.documentElement.style.setProperty("--top-bar-height", Math.ceil(bar.getBoundingClientRect().height) + "px");
  new ResizeObserver(measure).observe(bar);
  measure();
}

function initModalKeyboardControls() {
  document.querySelectorAll(".modal-backdrop").forEach(modal => {
    let wasOpen = false;
    let previousFocus;
    const focusable = () => Array.from(modal.querySelectorAll("button, a[href], input, select, textarea, [tabindex='0']"))
      .filter(element => !element.disabled && element.getClientRects().length && getComputedStyle(element).visibility !== "hidden");
    new MutationObserver(() => {
      const open = modal.classList.contains("open");
      if (open === wasOpen) return;
      wasOpen = open;
      if (open) {
        previousFocus = document.activeElement;
        requestAnimationFrame(() => {
          if (modal.classList.contains("open") && !modal.contains(document.activeElement) &&
              !document.querySelector("dialog[open], .album-lightbox-modal.active") &&
              (modal.id === "ticket-modal" || !document.querySelector("#ticket-modal.open"))) {
            focusable()[0]?.focus({ preventScroll: true });
          }
        });
      } else if (modal.contains(document.activeElement) && !document.querySelector("dialog[open]")) {
        previousFocus?.focus({ preventScroll: true });
      }
    }).observe(modal, { attributes: true, attributeFilter: ["class"] });
    document.addEventListener("keydown", event => {
      if (event.defaultPrevented || !modal.classList.contains("open") ||
          document.querySelector("dialog[open], .album-lightbox-modal.active") ||
          (modal.id !== "ticket-modal" && document.querySelector("#ticket-modal.open"))) return;
      if (event.key === "Escape") {
        event.preventDefault();
        modal.classList.remove("open");
      } else if (event.key === "Tab") {
        const items = focusable();
        const first = items[0];
        const last = items[items.length - 1];
        if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus();
        }
      }
    });
  });
}

// ==========================================
// 1. CARREGAR CONFIGURAÇÕES BÁSICAS
// ==========================================
function initPartyConfig() {
  if (typeof PARTY_CONFIG === "undefined") return;

  const datePrimaryEl = document.getElementById("event-date-primary-text");
  const dateTextEl = document.getElementById("event-date-text");
  const timeTextEl = document.getElementById("event-time-text");
  const locNameEl = document.getElementById("location-name-text");
  const locAddrEl = document.getElementById("location-address-text");
  const tipDressEl = document.getElementById("tip-dresscode");
  const tipClothEl = document.getElementById("tip-clothingsize");
  const tipShoeEl = document.getElementById("tip-shoesize");

  if (datePrimaryEl) datePrimaryEl.textContent = PARTY_CONFIG.dateFormatted;
  if (dateTextEl) dateTextEl.textContent = PARTY_CONFIG.dateFormatted;
  if (timeTextEl) timeTextEl.textContent = PARTY_CONFIG.timeFormatted;
  if (locNameEl && PARTY_CONFIG.location) locNameEl.textContent = PARTY_CONFIG.location.name;
  if (locAddrEl && PARTY_CONFIG.location) {
    locAddrEl.textContent = `${PARTY_CONFIG.location.address} - ${PARTY_CONFIG.location.cityState}`;
  }
  if (tipDressEl && PARTY_CONFIG.tips) tipDressEl.textContent = PARTY_CONFIG.tips.dressCode;
  if (tipClothEl && PARTY_CONFIG.tips) tipClothEl.textContent = PARTY_CONFIG.tips.clothingSize;
  if (tipShoeEl && PARTY_CONFIG.tips?.shoeSize) tipShoeEl.textContent = PARTY_CONFIG.tips.shoeSize;

  // Botões de Maps e Waze
  const mapsBtn = document.getElementById("btn-google-maps");
  const wazeBtn = document.getElementById("btn-waze");
  if (mapsBtn && PARTY_CONFIG.location && PARTY_CONFIG.location.googleMapsUrl) {
    mapsBtn.href = PARTY_CONFIG.location.googleMapsUrl;
  }
  if (wazeBtn && PARTY_CONFIG.location && PARTY_CONFIG.location.wazeUrl) {
    wazeBtn.href = PARTY_CONFIG.location.wazeUrl;
  }

  // Copiar endereço
  const copyBtn = document.getElementById("btn-copy-address");
  if (copyBtn && PARTY_CONFIG.location) {
    copyBtn.addEventListener("click", () => {
      const fullAddr = `${PARTY_CONFIG.location.name}, ${PARTY_CONFIG.location.address} - ${PARTY_CONFIG.location.cityState}`;
      navigator.clipboard.writeText(fullAddr).then(() => {
        playTone(659.25, 0.15, "triangle");
        copyBtn.innerHTML = "<span>✅</span> Endereço Copiado!";
        setTimeout(() => {
          copyBtn.innerHTML = "<span>📋</span> Copiar Endereço";
        }, 2500);
      }).catch(() => {
        alert("Endereço: " + fullAddr);
      });
    });
  }

  // Google Agenda
  const googleCalBtn = document.getElementById("btn-add-google-cal");
  if (googleCalBtn) {
    const title = encodeURIComponent("Aniversário de 1 Ano do Noah - Noah Story 1 🤠🚀");
    const details = encodeURIComponent("Churrasco Americano do Xerife Noah! Venha comemorar com a família no quartel-general das brincadeiras.");
    const location = encodeURIComponent(`${PARTY_CONFIG.location.name}, ${PARTY_CONFIG.location.address}`);
    const dates = "20270116T143000Z/20270116T220000Z";
    googleCalBtn.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  }
}

// ==========================================
// 2. SISTEMA DE ÁUDIO & TRILHA SONORA ("AMIGO ESTOU AQUI")
// ==========================================
let themeAudioEl = null;

function getThemeAudio() {
  if (!themeAudioEl) {
    themeAudioEl = document.getElementById("theme-audio");
    if (themeAudioEl) {
      themeAudioEl.volume = 0.65;
    }
  }
  return themeAudioEl;
}

function startThemeMusic() {
  if (!AppState.soundEnabled) return;
  const audio = getThemeAudio();
  if (!audio) return;

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      updateSoundButton(true);
    }).catch(err => {
      console.log("Audio play error:", err.message);
    });
  }
}

function stopThemeMusic() {
  const audio = getThemeAudio();
  if (audio) {
    audio.pause();
  }
  updateSoundButton(false);
}

function updateSoundButton(isPlaying) {
  const toggleBtn = document.getElementById("sound-toggle-btn");
  const iconEl = document.getElementById("sound-icon");
  const labelEl = document.getElementById("sound-label");

  if (!toggleBtn) return;
  if (isPlaying) {
    toggleBtn.classList.add("active");
    if (iconEl) iconEl.textContent = "🔊";
    if (labelEl) labelEl.textContent = "Música: ON";
  } else {
    toggleBtn.classList.remove("active");
    if (iconEl) iconEl.textContent = "🔇";
    if (labelEl) labelEl.textContent = "Música: OFF";
  }
}

function getAudioContext() {
  if (!AppState.audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      AppState.audioCtx = new AudioContext();
    }
  }
  if (AppState.audioCtx && AppState.audioCtx.state === "suspended") {
    AppState.audioCtx.resume();
  }
  return AppState.audioCtx;
}

function initSoundSystem() {
  const toggleBtn = document.getElementById("sound-toggle-btn");
  if (!toggleBtn) return;

  updateSoundButton(getThemeAudio()?.paused === false);

  toggleBtn.addEventListener("click", () => {
    const audio = getThemeAudio();
    if (!audio) return;

    if (audio.paused) {
      AppState.soundEnabled = true;
      audio.play().then(() => {
        updateSoundButton(true);
        playFanfare();
      }).catch(e => console.warn(e));
    } else {
      AppState.soundEnabled = false;
      audio.pause();
      updateSoundButton(false);
    }
  });

  // Desbloqueio Global do Áudio Mobile (iOS Safari & Android Chrome)
  const onFirstInteraction = () => {
    unlockMobileAudio();
    document.removeEventListener("touchstart", onFirstInteraction);
    document.removeEventListener("touchend", onFirstInteraction);
    document.removeEventListener("click", onFirstInteraction);
  };
  document.addEventListener("touchstart", onFirstInteraction, { passive: true });
  document.addEventListener("touchend", onFirstInteraction, { passive: true });
  document.addEventListener("click", onFirstInteraction, { passive: true });
}

// Desbloqueador e pré-aquecedor do hardware de áudio para dispositivos móveis
let mobileAudioUnlocked = false;
const characterAudioBuffers = {};

function unlockMobileAudio() {
  if (mobileAudioUnlocked) return;
  mobileAudioUnlocked = true;

  // 1. Acorda o AudioContext no iOS / Safari / Chrome Mobile
  const ctx = getAudioContext();
  if (ctx) {
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    try {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch (e) {}
  }

  // 2. Pré-desbloqueia os elementos <audio> no DOM
  document.querySelectorAll("audio").forEach(audioEl => {
    try {
      if (audioEl.id === "theme-audio") return;
      audioEl.load();
      const p = audioEl.play();
      if (p !== undefined) {
        p.then(() => {
          audioEl.pause();
          audioEl.currentTime = 0;
        }).catch(() => {});
      }
    } catch (e) {}
  });

  // 3. Pré-carrega buffers em Web Audio para latência 0 e funcionamento no modo silencioso do iPhone
  preloadAllCharacterAudios();
}

function preloadAllCharacterAudios() {
  const characters = ["woody", "buzz", "jessie", "rex", "alien", "potato", "hamm", "slinky"];
  const ctx = getAudioContext();
  if (!ctx) return;

  characters.forEach(charKey => {
    if (characterAudioBuffers[charKey]) return;
    // Carrega o arquivo .aac puro de 40KB (baixa em 15ms em qualquer conexão móvel)
    const url = `assets/audio/characters/${charKey}.aac`;
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.arrayBuffer();
      })
      .then(arrayBuffer => ctx.decodeAudioData(arrayBuffer))
      .then(decoded => {
        characterAudioBuffers[charKey] = decoded;
      })
      .catch(err => {
        // Fallback para tentar m4a se aac falhar
        const fallbackUrl = `assets/audio/characters/${charKey}.m4a`;
        fetch(fallbackUrl)
          .then(r => r.arrayBuffer())
          .then(ab => ctx.decodeAudioData(ab))
          .then(d => { characterAudioBuffers[charKey] = d; })
          .catch(() => {});
      });
  });
}

function playTone(freq, duration = 0.2, type = "sine", gainVal = 0.15) {
  if (!AppState.soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  gain.gain.setValueAtTime(gainVal, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + duration);
}

// Fanfarra triunfal do Toy Story
function playFanfare() {
  if (!AppState.soundEnabled) return;
  const notes = [
    { freq: 261.63, dur: 0.15 }, // C4
    { freq: 329.63, dur: 0.15 }, // E4
    { freq: 392.00, dur: 0.18 }, // G4
    { freq: 523.25, dur: 0.40 }  // C5
  ];
  let time = 0;
  notes.forEach(n => {
    setTimeout(() => {
      playTone(n.freq, n.dur, "triangle", 0.2);
    }, time);
    time += n.dur * 1000 * 0.9;
  });
}

// Som do Raio Laser do Buzz Lightyear
function playBuzzLaser() {
  if (!AppState.soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(900, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.35);

  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.35);
}

// Voz dos alienígenas também nas descobertas e na comemoração do minijogo.
function playAlienOoooh() {
  if (!AppState.soundEnabled) return;
  playCharacterSound("alien");
}

// ==========================================
// SIRENE DE EMERGÊNCIA CONTÍNUA DO BOTÃO PROIBIDO 🚨
// Toca ininterruptamente até o botão ser pressionado ou o tempo acabar
// ==========================================
let emergencySirenNodes = null;

function startEmergencySirenAudio() {
  stopEmergencySirenAudio();

  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  try {
    const now = ctx.currentTime;

    // Master Gain com ataque suave para não dar estalo
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.35, now + 0.12);
    masterGain.connect(ctx.destination);

    // LFO (Oscilador de Baixa Frequência) para modular o pitch continuamente (sobe e desce)
    // 0.85 Hz = 1 ciclo completo de subida e descida a cada 1.18 segundos
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.85, now);

    // Ganho do LFO determina a profundidade do wail da sirene (+/- 280 Hz)
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(280, now);
    lfo.connect(lfoGain);

    // Oscilador 1 (Sawtooth) - Som de sirene mecânica / alarme aéreo (650Hz base)
    const osc1 = ctx.createOscillator();
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(650, now);
    lfoGain.connect(osc1.frequency); // Varia suavemente de 370Hz a 930Hz continuamente

    // Oscilador 2 (Square) - Dá o timbre cortante de alarme industrial
    const osc2 = ctx.createOscillator();
    osc2.type = "square";
    osc2.frequency.setValueAtTime(656, now);
    lfoGain.connect(osc2.frequency);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.22, now);
    osc2.connect(osc2Gain);

    osc1.connect(masterGain);
    osc2Gain.connect(masterGain);

    // Oscilador grave de sub-rumble para sensação física de tremor
    const rumbleOsc = ctx.createOscillator();
    rumbleOsc.type = "triangle";
    rumbleOsc.frequency.setValueAtTime(55, now);
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.setValueAtTime(0.35, now);
    rumbleOsc.connect(rumbleGain);
    rumbleGain.connect(masterGain);

    // Inicia todos os osciladores em sincronia no hardware de áudio
    lfo.start(now);
    osc1.start(now);
    osc2.start(now);
    rumbleOsc.start(now);

    emergencySirenNodes = {
      masterGain,
      lfo,
      osc1,
      osc2,
      rumbleOsc
    };
  } catch (err) {
    console.warn("Erro ao iniciar sirene contínua:", err);
  }
}

function stopEmergencySirenAudio() {
  if (!emergencySirenNodes) return;
  const nodes = emergencySirenNodes;
  emergencySirenNodes = null;

  const ctx = getAudioContext();
  if (ctx && nodes.masterGain) {
    try {
      const now = ctx.currentTime;
      nodes.masterGain.gain.cancelScheduledValues(now);
      nodes.masterGain.gain.setValueAtTime(nodes.masterGain.gain.value, now);
      nodes.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    } catch (e) {}
  }

  setTimeout(() => {
    try {
      nodes.lfo.stop();
      nodes.osc1.stop();
      nodes.osc2.stop();
      nodes.rumbleOsc.stop();
      nodes.masterGain.disconnect();
    } catch (e) {}
  }, 280);
}

// Trilha sonora leve em arpeggio de fundo
function startBackgroundMelody() {
  if (!AppState.soundEnabled || AppState.bgTrackRunning) return;
  // Apenas toca comemoração festiva se ativado
}

function stopBackgroundMelody() {
  AppState.bgTrackRunning = false;
}

// Disparador de Confetes
function triggerConfetti(particleCount = 60, spread = 70) {
  if (typeof confetti === "function") {
    try {
      confetti({
        particleCount: particleCount,
        spread: spread,
        origin: { y: 0.6 },
        colors: ["#ffcf00", "#ef4444", "#22c55e", "#3b82f6", "#a855f7"]
      });
    } catch (e) {
      console.log("Confetti trigger:", e);
    }
  }
}

// ==========================================
// 5. BLOCOS DE BRINQUEDO MUSICAIS (N - O - A - H - 1)
// ==========================================
function initInteractiveToyBlocks() {
  const blocks = document.querySelectorAll(".interactive-block");
  const noteFreqs = {
    "C4": 261.63,
    "D4": 293.66,
    "E4": 329.63,
    "G4": 392.00,
    "A4": 440.00
  };

  blocks.forEach(block => {
    let bounceTimer;
    block.addEventListener("click", () => {
      const note = block.getAttribute("data-note") || "C4";
      const freq = noteFreqs[note] || 440;
      playTone(freq, 0.35, "triangle", 0.25);

      clearTimeout(bounceTimer);
      block.classList.add("bounce");
      bounceTimer = setTimeout(() => block.classList.remove("bounce"), 180);
    });
  });
}

// ==========================================
// 6. BALÕES FESTIVOS COM O ROSTO DO NOAH
// ==========================================
function initNoahBalloons() {
  const balloons = document.querySelectorAll(".noah-balloon");
  balloons.forEach((balloon, index) => {
    balloon.addEventListener("click", () => {
      const freqs = [329.63, 392.00, 523.25, 659.25];
      playTone(freqs[index % freqs.length], 0.25, "sine", 0.2);
      triggerConfetti(25, 50);

      balloon.style.transform = "scale(1.3) rotate(15deg)";
      setTimeout(() => {
        balloon.style.transform = "";
      }, 350);
    });
  });
}

// ==========================================
// 7. TURMA DO TOY STORY & SONS ORIGINAIS DOS PERSONAGENS (RESPONSIVO NO MOBILE)
// ==========================================
let currentBufferSource = null;
let currentCharacterAudio = null;

function stopAllCharacterSounds() {
  if (currentBufferSource) {
    const source = currentBufferSource;
    const onEnded = source.onended;
    source.onended = null;
    try { source.stop(); } catch (e) {}
    onEnded?.();
    currentBufferSource = null;
  }
  if (currentCharacterAudio) {
    const audio = currentCharacterAudio;
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch (e) {}
    audio.onended?.();
    currentCharacterAudio = null;
  }
}

function playCharacterSound(charKey) {
  unlockMobileAudio();
  stopAllCharacterSounds();

  // Remove animação de todos os cards
  document.querySelectorAll(".character-card").forEach(c => c.classList.remove("is-speaking"));

  const targetCard = document.querySelector(`.character-card[data-character="${charKey}"]`);
  if (targetCard) {
    targetCard.classList.add("is-speaking");
  }

  // Ducking na trilha sonora de fundo enquanto o personagem fala
  const bgAudio = getThemeAudio();
  let prevVolume = 1;
  if (bgAudio && !bgAudio.paused) {
    prevVolume = bgAudio.volume;
    bgAudio.volume = Math.max(0.12, prevVolume * 0.2);
  }

  const onSoundEnded = () => {
    if (targetCard) targetCard.classList.remove("is-speaking");
    if (bgAudio && !bgAudio.paused) {
      bgAudio.volume = prevVolume;
    }
    currentBufferSource = null;
    currentCharacterAudio = null;
  };

  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  // MÉTODO 1 (Melhor para iOS/Android): Web Audio Buffer decodificado (0ms latência e funciona mesmo em modo silencioso)
  if (ctx && characterAudioBuffers[charKey]) {
    try {
      const source = ctx.createBufferSource();
      source.buffer = characterAudioBuffers[charKey];
      source.connect(ctx.destination);
      source.onended = onSoundEnded;
      source.start(0);
      currentBufferSource = source;
      return;
    } catch (e) {
      console.warn("Buffer play fallback:", e);
    }
  }

  // MÉTODO 2: Elemento <audio> pré-carregado no DOM com suporte a .m4a e .mp4
  const audioEl = document.getElementById(`audio-char-${charKey}`);
  if (audioEl) {
    currentCharacterAudio = audioEl;
    audioEl.currentTime = 0;
    audioEl.onended = onSoundEnded;
    audioEl.onerror = onSoundEnded;
    const playPromise = audioEl.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn(`Tentando fallback para new Audio(${charKey}):`, err.message);
        const dynAudio = new Audio(`assets/audio/characters/${charKey}.aac`);
        dynAudio.onended = onSoundEnded;
        dynAudio.play().catch(() => {
          const m4aAudio = new Audio(`assets/audio/characters/${charKey}.m4a`);
          m4aAudio.onended = onSoundEnded;
          m4aAudio.play().catch(onSoundEnded);
        });
      });
    }
    return;
  }

  // MÉTODO 3: Fallback dinâmico com arquivo leve .aac de 40KB
  const dynAudio = new Audio(`assets/audio/characters/${charKey}.aac`);
  dynAudio.onended = onSoundEnded;
  dynAudio.play().catch(() => {
    const m4aAudio = new Audio(`assets/audio/characters/${charKey}.m4a`);
    m4aAudio.onended = onSoundEnded;
    m4aAudio.play().catch(onSoundEnded);
  });
}

function initCharactersSection() {
  const cards = document.querySelectorAll(".character-card");
  const quoteToast = document.getElementById("character-quote-toast");

  cards.forEach(card => {
    const triggerCharacter = () => {
      const charKey = card.getAttribute("data-character");
      const charData = CHARACTER_QUOTES[charKey];
      if (!charData) return;

      // Reproduz o áudio do personagem com suporte total a Mobile
      playCharacterSound(charKey);

      // Exibe o balão de fala do personagem com animação
      if (quoteToast) {
        quoteToast.textContent = charData.quote;
        quoteToast.style.animation = "none";
        quoteToast.offsetHeight; // reflow
        quoteToast.style.animation = "fadeInZoom 0.35s ease";
      }
    };

    card.addEventListener("click", triggerCharacter);
    card.addEventListener("keydown", event => {
      if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
        event.preventDefault();
        triggerCharacter();
      }
    });
  });
}

// ==========================================
// 8. FOGUETE DO BUZZ (MISSÃO INTERGALÁCTICA)
// ==========================================
function initSpaceMissionRocket() {
  const dialog = document.getElementById("space-game");
  const launchBtn = document.getElementById("btn-launch-mission");
  if (!dialog || !launchBtn) return;

  const board = document.getElementById("flight-board");
  const course = document.getElementById("flight-course");
  const rocket = board.querySelector(".flight-rocket");
  const controls = document.getElementById("flight-controls");
  const buttons = Array.from(controls.querySelectorAll("[data-lane]"));
  const start = document.getElementById("flight-start");
  const pause = document.getElementById("flight-pause");
  const runControls = document.getElementById("flight-run-controls");
  const keyboardHint = dialog.querySelector(".flight-keyboard-hint");
  const instructions = document.getElementById("space-game-instructions");
  const status = document.getElementById("flight-status");
  const starsText = document.getElementById("flight-stars");
  const timeText = document.getElementById("flight-time");
  const outcome = document.getElementById("flight-outcome");
  const shieldText = document.getElementById("flight-shield");
  const actions = document.getElementById("flight-actions");
  const replay = document.getElementById("flight-replay");
  const coordinates = document.getElementById("flight-coordinates");
  const missionDetails = document.getElementById("space-mission-details");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const fixedStep = 1 / 120;
  let game;
  let sprites = [];
  let frameId = 0;
  let previousFrame = null;
  let accumulator = 0;
  let width = 0;
  let height = 0;
  let uiKey = "";
  let feedbackTimer;
  let pointerId = null;
  let focusedResult = false;

  function stopLoop() {
    cancelAnimationFrame(frameId);
    frameId = 0;
    previousFrame = null;
    accumulator = 0;
    if (pointerId !== null && board.hasPointerCapture(pointerId)) board.releasePointerCapture(pointerId);
    pointerId = null;
  }

  function message(text) {
    if (status.textContent !== text) status.textContent = text;
  }

  function feedback(kind) {
    clearTimeout(feedbackTimer);
    board.dataset.feedback = kind;
    feedbackTimer = setTimeout(() => delete board.dataset.feedback, 250);
  }

  function renderMotion() {
    if (!game || !width || !height) return;
    const state = game.state;
    rocket.style.transform = `translate3d(${state.shipX * width - 20}px, ${state.shipY * height - 22}px, 0) rotate(-44deg)`;
    board.dataset.invulnerable = state.elapsed < state.invulnerableUntil;
    for (let index = 0; index < state.objects.length; index++) {
      const object = state.objects[index];
      const visible = object.active && object.y >= -0.15 && object.y <= 1.15;
      const sprite = sprites[index];
      sprite.hidden = !visible;
      if (!visible) continue;
      const angle = object.kind === "asteroid" && !state.stepMode ? state.elapsed * (20 + object.row * 3) : 0;
      sprite.style.transform = `translate3d(${object.x * width - 17}px, ${object.y * height - 17}px, 0) rotate(${angle}deg)`;
    }
  }

  function renderUI() {
    const state = game.state;
    const key = [state.phase, state.stars, state.shield, state.targetLane, state.nextRow, Math.floor(state.elapsed)].join("|");
    if (key === uiKey) return;
    uiKey = key;
    const ended = state.phase === "won" || state.phase === "lost";
    const next = state.rows[state.nextRow];
    board.dataset.phase = state.phase;
    board.dataset.result = ended ? state.phase : "";
    starsText.textContent = `${state.stars}/${state.goal}`;
    shieldText.textContent = `${state.shield}/${state.maxShield}`;
    const seconds = Math.floor(state.elapsed);
    timeText.textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    outcome.hidden = !ended;
    if (ended) {
      const won = state.phase === "won";
      document.getElementById("flight-outcome-title").textContent = won ? "Missão cumprida!" : "Resgate a caminho!";
      document.getElementById("flight-outcome-description").textContent = won
        ? `${state.goal} estrelas! O Comando Estelar comemora com você.`
        : "O Buzz vai ajudar. Recarregue a nave e tente outra vez!";
      outcome.querySelector(".flight-result-symbol").textContent = won ? "🏅" : "🚀";
    }
    controls.hidden = ended;
    keyboardHint.hidden = ended;
    runControls.hidden = ended;
    start.hidden = state.phase !== "ready";
    pause.hidden = state.phase === "ready" || ended;
    pause.textContent = state.phase === "paused" ? "Continuar" : "Pausar";
    actions.hidden = !ended;
    coordinates.hidden = state.phase !== "won";
    buttons.forEach((button, lane) => {
      const blocked = state.stepMode && Math.abs(lane - state.targetLane) > 1;
      const disabled = state.phase === "paused" || ended || blocked;
      button.disabled = disabled;
      button.setAttribute("aria-disabled", String(disabled));
      button.dataset.current = String(lane === state.targetLane);
      const object = next?.star === lane ? "estrela" : next?.asteroid === lane ? "asteroide" : "trilha livre";
      button.setAttribute("aria-label", `${button.textContent}, ${object}${lane === state.targetLane ? ", trilha selecionada" : ""}`);
    });
    if (ended && !focusedResult) {
      focusedResult = true;
      (state.phase === "won" ? coordinates : replay).focus({ preventScroll: true });
    }
  }

  function updateView() {
    for (const event of game.state.events) {
      if (event.type === "star") {
        playTone(660 + game.state.stars * 38, 0.15, "triangle");
        feedback("star");
        message(`Estrela coletada! ${game.state.stars} de ${game.state.goal}.`);
      } else if (event.type === "hit") {
        playTone(115, 0.22, "triangle");
        feedback("hit");
        message(`Impacto! Escudo ${game.state.shield} de ${game.state.maxShield}.`);
      } else if (event.type === "blocked") {
        message(game.state.stepMode ? "Mude apenas uma trilha por comando." : "Você chegou à borda da rota.");
      } else if (event.type === "clear") {
        message("Trecho livre. Continue pilotando!");
      } else if (event.type === "phase") {
        if (event.phase === "running") message("Voo em curso. Colete as estrelas!");
        else if (event.phase === "paused") message("Voo pausado. Toque em Continuar para retomar.");
        else if (event.phase === "won") {
          stopLoop();
          playFanfare();
          message(`Missão cumprida! Você coletou ${game.state.goal} estrelas.`);
        } else if (event.phase === "lost") {
          stopLoop();
          message(game.state.shield ? "Fim da rota! Tente coletar mais estrelas." : "O escudo acabou. Tente de novo!");
        }
      }
    }
    game.state.events.length = 0;
    renderMotion();
    renderUI();
  }

  function frame(timestamp) {
    frameId = 0;
    if (!dialog.open || game.state.phase !== "running") return;
    if (previousFrame === null) previousFrame = timestamp;
    accumulator += Math.min((timestamp - previousFrame) / 1000, 0.1);
    previousFrame = timestamp;
    while (accumulator >= fixedStep && game.state.phase === "running") {
      game.tick(fixedStep);
      accumulator -= fixedStep;
    }
    updateView();
    if (game.state.phase === "running") frameId = requestAnimationFrame(frame);
  }

  function startLoop() {
    stopLoop();
    if (!game.state.stepMode && game.state.phase === "running") frameId = requestAnimationFrame(frame);
  }

  function measure() {
    width = board.clientWidth;
    height = board.clientHeight;
    renderMotion();
  }

  function resetFlight() {
    stopLoop();
    clearTimeout(feedbackTimer);
    delete board.dataset.feedback;
    game = createFlightEngine({ stepMode: reducedMotion.matches });
    uiKey = "";
    focusedResult = false;
    const fragment = document.createDocumentFragment();
    sprites = game.state.objects.map(object => {
      const sprite = document.createElement("span");
      sprite.className = "flight-object flight-" + object.kind;
      sprite.textContent = object.kind === "star" ? "⭐" : "🪨";
      fragment.append(sprite);
      return sprite;
    });
    course.replaceChildren(fragment);
    instructions.textContent = game.state.stepMode
      ? `Colete ${game.state.goal} estrelas e desvie dos asteroides. Com movimento reduzido, cada comando avança um trecho. Mude uma trilha por vez.`
      : `Colete ${game.state.goal} estrelas e desvie dos asteroides. A nave avança sozinha. Toque em uma trilha, arraste ou use as setas.`;
    keyboardHint.textContent = game.state.stepMode
      ? "Teclado ← → muda de trilha · ↑ avança · P pausa"
      : "Teclado ← → ou A/D · P pausa";
    message("Escolha uma trilha e toque em Decolar.");
    renderUI();
    measure();
  }

  function command(lane) {
    if (!game) return;
    game.command(lane);
    updateView();
  }

  function pauseFlight() {
    if (!dialog.open || game?.state.phase !== "running") return;
    game.pause();
    stopLoop();
    updateView();
  }

  launchBtn.addEventListener("click", () => {
    resetFlight();
    dialog.showModal();
    measure();
    unlockMobileAudio();
    start.focus({ preventScroll: true });
  });
  start.addEventListener("click", () => {
    game.start();
    playBuzzLaser();
    updateView();
    startLoop();
    board.focus({ preventScroll: true });
  });
  pause.addEventListener("click", () => {
    if (game.state.phase === "running") pauseFlight();
    else if (game.state.phase === "paused") {
      game.resume();
      updateView();
      startLoop();
      board.focus({ preventScroll: true });
    }
  });
  buttons.forEach((button, lane) => button.addEventListener("click", () => command(lane)));
  dialog.addEventListener("keydown", event => {
    if (event.altKey || event.ctrlKey || event.metaKey || !game) return;
    const key = event.key.toLowerCase();
    if (key === "p" && !event.repeat && ["running", "paused"].includes(game.state.phase)) {
      event.preventDefault();
      pause.click();
      return;
    }
    const direction = { arrowleft: -1, a: -1, arrowright: 1, d: 1, arrowup: 0 }[key];
    if (direction === undefined) return;
    event.preventDefault();
    if (!event.repeat || !game.state.stepMode) command(game.state.targetLane + direction);
  });

  function pointerLane(event) {
    const rectangle = board.getBoundingClientRect();
    return Math.max(0, Math.min(2, Math.floor((event.clientX - rectangle.left) / rectangle.width * 3)));
  }
  board.addEventListener("pointerdown", event => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0) ||
        !game || !["ready", "running"].includes(game.state.phase)) return;
    pointerId = event.pointerId;
    board.setPointerCapture(pointerId);
    if (!game.state.stepMode) command(pointerLane(event));
  });
  board.addEventListener("pointermove", event => {
    if (pointerId !== event.pointerId || game.state.stepMode) return;
    const lane = pointerLane(event);
    if (lane !== game.state.targetLane) command(lane);
  });
  board.addEventListener("pointerup", event => {
    if (pointerId !== event.pointerId) return;
    if (game.state.stepMode) command(pointerLane(event));
    if (board.hasPointerCapture(event.pointerId)) board.releasePointerCapture(event.pointerId);
    pointerId = null;
  });
  board.addEventListener("pointercancel", () => { pointerId = null; });
  dialog.addEventListener("close", () => {
    game?.pause();
    stopLoop();
    clearTimeout(feedbackTimer);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseFlight();
  });
  window.addEventListener("blur", pauseFlight);
  new ResizeObserver(measure).observe(board);
  replay.addEventListener("click", () => {
    resetFlight();
    start.focus({ preventScroll: true });
  });
  coordinates.addEventListener("click", () => {
    dialog.close();
    missionDetails.focus({ preventScroll: true });
    missionDetails.scrollIntoView({ block: "center" });
    if (!reducedMotion.matches) triggerConfetti(80, 80);
  });
}

// ==========================================
// 9. CONTAGEM REGRESSIVA PARA 16/01/2027
// ==========================================
function initCountdown() {
  const targetDate = new Date("2027-01-16T11:30:00").getTime();

  function update() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance <= 0) {
      document.getElementById("countdown-days").textContent = "00";
      document.getElementById("countdown-hours").textContent = "00";
      document.getElementById("countdown-minutes").textContent = "00";
      document.getElementById("countdown-seconds").textContent = "00";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const pad = (n) => String(n).padStart(2, "0");

    const daysEl = document.getElementById("countdown-days");
    const hoursEl = document.getElementById("countdown-hours");
    const minsEl = document.getElementById("countdown-minutes");
    const secsEl = document.getElementById("countdown-seconds");

    if (daysEl) daysEl.textContent = pad(days);
    if (hoursEl) hoursEl.textContent = pad(hours);
    if (minsEl) minsEl.textContent = pad(minutes);
    if (secsEl) secsEl.textContent = pad(seconds);
  }

  update();
  setInterval(update, 1000);
}

// ==========================================
// 10. QUIZ TOY STORY — QUAL BRINQUEDO VOCÊ SERIA? 🎮
// ==========================================
function initQuizToyStory() {
  const step1 = document.getElementById("quiz-step-1");
  const step2 = document.getElementById("quiz-step-2");
  const step3 = document.getElementById("quiz-step-3");
  const progressBar = document.getElementById("quiz-progress-bar");
  const resultCard = document.getElementById("quiz-result-card");
  const resultTitle = document.getElementById("quiz-result-title");
  const resultDesc = document.getElementById("quiz-result-desc");
  const resultImg = document.getElementById("quiz-result-img");
  const shareBtn = document.getElementById("btn-share-quiz-whatsapp");

  const optionBtns = document.querySelectorAll(".quiz-option-btn");

  const resultsData = {
    woody: {
      name: "Xerife Woody! 🤠",
      desc: "Você é um líder leal, companheiro de todas as horas e não deixa nenhum amigo para trás!",
      img: "assets/images/woody-1.jpg"
    },
    buzz: {
      name: "Buzz Lightyear! 🚀",
      desc: "Você é corajoso, destemido e sempre pronto para explorar o infinito e além!",
      img: "assets/images/buzz-toy-story.jpg"
    },
    jessie: {
      name: "Vaqueira Jessie! 🐎",
      desc: "Você é alegria pura, energia contagiante e o coração mais animado de qualquer festa!",
      img: "assets/images/jessie-toy-story.jpg"
    },
    rex: {
      name: "Dinossauro Rex! 🦖",
      desc: "Você tem um coração gigante, adora fazer todo mundo sorrir e não perde um doce por nada!",
      img: "assets/images/rex-toy-story.jpg"
    },
    alien: {
      name: "Alienígena da Garra! 👽",
      desc: "Você é leal, misterioso e sabe reconhecer quando algo verdadeiramente mágico acontece!",
      img: "assets/images/alien-wave.webp"
    }
  };

  optionBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const chosenToy = btn.getAttribute("data-toy") || "woody";
      AppState.quizAnswers.push(chosenToy);
      playTone(523.25, 0.15, "triangle");

      if (AppState.currentQuizStep === 1) {
        AppState.currentQuizStep = 2;
        if (step1) step1.classList.remove("active");
        if (step2) step2.classList.add("active");
        if (progressBar) progressBar.style.width = "66%";
      } else if (AppState.currentQuizStep === 2) {
        AppState.currentQuizStep = 3;
        if (step2) step2.classList.remove("active");
        if (step3) step3.classList.add("active");
        if (progressBar) progressBar.style.width = "100%";
      } else if (AppState.currentQuizStep === 3) {
        if (step3) step3.classList.remove("active");

        // Cálculo do resultado mais frequente
        const counts = {};
        AppState.quizAnswers.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
        let winningToy = "woody";
        let maxCount = 0;
        Object.entries(counts).forEach(([toy, cnt]) => {
          if (cnt > maxCount) { maxCount = cnt; winningToy = toy; }
        });

        const res = resultsData[winningToy] || resultsData.woody;

        if (resultTitle) resultTitle.textContent = `Você seria o ${res.name}`;
        if (resultDesc) resultDesc.textContent = res.desc;
        if (resultImg) resultImg.src = res.img;
        if (resultCard) resultCard.classList.add("show");

        if (shareBtn) {
          const msg = encodeURIComponent(`Descobri que no Noah Story 1 eu sou o ${res.name}! 🚀 Qual brinquedo você seria? Venha comemorar o 1º aninho do Noah no dia 16/01/2027!`);
          shareBtn.href = `https://api.whatsapp.com/send?text=${msg}`;
        }

        playFanfare();
        triggerConfetti(60, 75);
      }
    });
  });
}

// ==========================================
// 11. O BOTÃO PROIBIDO - ALERTA MÁXIMO DE EMERGÊNCIA 🚨
// ==========================================
function initForbiddenButton() {
  const btn = document.getElementById("btn-forbidden");
  const overlay = document.getElementById("emergency-overlay");
  const cancelBtn = document.getElementById("btn-cancel-emergency");
  const countdownEl = document.getElementById("emergency-countdown-num");
  const rexRunner = document.getElementById("rex-panic-runner-wrapper");
  const toast = document.getElementById("forbidden-toast-msg");

  if (!btn) return;

  let isEmergencyActive = false;
  let timerInterval = null;
  let remainingSeconds = 7;

  const stopEmergencyAlert = (wasManual = false) => {
    if (!isEmergencyActive) return;
    isEmergencyActive = false;

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    // 1. Remove tremor e overlay
    document.body.classList.remove("emergency-screen-shake");
    if (overlay) { overlay.classList.remove("active"); if (overlay.open) overlay.close(); }
    if (rexRunner) rexRunner.classList.remove("running");

    // 2. Para sirene de alarme imediatamente
    stopEmergencySirenAudio();

    // 3. Restaura música de fundo do Andy se estava ligada
    const bgAudio = getThemeAudio();
    if (bgAudio && AppState.soundEnabled && bgAudio.paused) {
      bgAudio.play().catch(() => {});
    }

    // 4. Feedback no balão de mensagem
    if (toast) {
      toast.textContent = wasManual
        ? "✅ UFA! Alarme desativado! O Andy desistiu de subir... Todos os brinquedos continuam seguros! 🤠"
        : "🎉 PROTOCOLO ESTABILIZADO! Falso alarme: o Andy foi brincar lá fora! Você tem a coragem de um verdadeiro patrulheiro espacial! 🚀";
      toast.style.animation = "none";
      toast.offsetHeight;
      toast.style.animation = "fadeInZoom 0.4s ease";
    }

    // 5. Chuva de confetes triunfal
    triggerConfetti(100, 80);
  };

  const startEmergencyAlert = () => {
    unlockMobileAudio();
    isEmergencyActive = true;
    AppState.soundEnabled = true;

    // 1. Pausa momentaneamente a música de fundo suave para a sirene de emergência dominar
    const bgAudio = getThemeAudio();
    if (bgAudio && !bgAudio.paused) {
      bgAudio.pause();
    }

    // 2. Tela começa a tremer violentamente (efeito terremoto de alarme contínuo)
    document.body.classList.remove("emergency-screen-shake");
    void document.body.offsetWidth;
    document.body.classList.add("emergency-screen-shake");

    // 3. Ativa o overlay de tela cheia com luzes vermelhas varrendo
    if (overlay) {
      if (!overlay.open) overlay.showModal();
      overlay.classList.add("active");
    }

    // 4. Rex corre em desespero pela tela com balão de fala
    if (rexRunner) {
      rexRunner.classList.remove("running");
      void rexRunner.offsetWidth;
      rexRunner.classList.add("running");
    }

    // 5. Inicia a sirene de emergência contínua que toca sem parar
    startEmergencySirenAudio();

    // Grito assustado do Rex (compatível com Mobile)
    const rexDom = document.getElementById("audio-emergency-rex") || document.getElementById("audio-char-rex");
    if (rexDom) {
      try {
        rexDom.currentTime = 0;
        rexDom.play().catch(() => {});
      } catch (e) {}
    } else {
      try {
        const rexAudio = new Audio("assets/audio/characters/rex.aac");
        rexAudio.play().catch(() => {});
      } catch (e) {}
    }

    // 6. Contagem regressiva de auto-estabilização (7 segundos)
    remainingSeconds = 7;
    if (countdownEl) countdownEl.textContent = `${remainingSeconds}s`;

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      remainingSeconds--;
      if (countdownEl) countdownEl.textContent = `${remainingSeconds}s`;
      if (remainingSeconds <= 0) {
        stopEmergencyAlert(false);
      }
    }, 1000);
  };

  const handleBtnToggle = () => {
    if (isEmergencyActive) {
      stopEmergencyAlert(true);
    } else {
      startEmergencyAlert();
    }
  };

  // Clicar ou tocar no botão vermelho inicia ou desativa a emergência
  btn.addEventListener("click", handleBtnToggle);
  overlay?.addEventListener("cancel", event => { event.preventDefault(); stopEmergencyAlert(true); });
  overlay?.addEventListener("close", () => { stopEmergencyAlert(true); btn.focus({ preventScroll: true }); });

  // Botão manual de desativação na tela de emergência
  if (cancelBtn) {
    const handleCancel = () => {
      stopEmergencyAlert(true);
    };
    cancelBtn.addEventListener("click", handleCancel);
  }
}

// ==========================================
// 11.1 ÁLBUM DE RECORDAÇÕES - CARROSSEL & LIGHTBOX 📸
// ==========================================
function initAlbumCarouselAndLightbox() {
  const carousel = document.getElementById("polaroid-carousel");
  const prevBtn = document.getElementById("album-prev-btn");
  const nextBtn = document.getElementById("album-next-btn");

  const lightbox = document.getElementById("album-lightbox");
  const lbClose = document.getElementById("lightbox-btn-close");
  const lbBg = document.getElementById("lightbox-bg-close");
  const lbPrev = document.getElementById("lightbox-arrow-prev");
  const lbNext = document.getElementById("lightbox-arrow-next");
  const lbImg = document.getElementById("lightbox-active-img");
  const lbTag = document.getElementById("lightbox-tag-pill");
  const lbTitle = document.getElementById("lightbox-title-text");
  const lbDesc = document.getElementById("lightbox-desc-text");
  const lbCounter = document.getElementById("lightbox-counter-badge");

  // Navegação por setas do carrossel
  if (prevBtn && carousel) {
    prevBtn.addEventListener("click", () => {
      carousel.scrollBy({ left: -300, behavior: "smooth" });
    });
  }

  if (nextBtn && carousel) {
    nextBtn.addEventListener("click", () => {
      carousel.scrollBy({ left: 300, behavior: "smooth" });
    });
  }

  // Coleta dados dos cards de momentos
  const cards = Array.from(document.querySelectorAll(".polaroid-card"));
  if (cards.length === 0) return;

  let currentLbIndex = 0;
  let previousFocus;

  const updateLightbox = (index) => {
    if (index < 0) index = cards.length - 1;
    if (index >= cards.length) index = 0;
    currentLbIndex = index;

    const card = cards[index];
    const fullSrc = card.getAttribute("data-full") || card.querySelector("img").src;
    const tag = card.getAttribute("data-tag") || "";
    const title = card.getAttribute("data-title") || "";
    const desc = card.getAttribute("data-desc") || "";

    if (lbImg) {
      lbImg.style.opacity = "0.2";
      lbImg.src = fullSrc;
      lbImg.alt = title;
      lbImg.onload = () => { lbImg.style.opacity = "1"; };
    }
    if (lbTag) lbTag.textContent = tag;
    if (lbTitle) lbTitle.textContent = title;
    if (lbDesc) lbDesc.textContent = desc;
    if (lbCounter) lbCounter.textContent = `${index + 1} / ${cards.length}`;
  };

  const openLightbox = (index) => {
    if (!lightbox) return;
    updateLightbox(index);
    lightbox.classList.add("active");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    previousFocus = document.activeElement;
    lbClose?.focus({ preventScroll: true });
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove("active");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    previousFocus?.focus({ preventScroll: true });
  };

  cards.forEach((card, idx) => {
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", "Ampliar foto: " + card.dataset.title);
    card.addEventListener("click", () => {
      openLightbox(idx);
    });
    card.addEventListener("keydown", event => {
      if ((event.key === "Enter" || event.key === " ") && !event.repeat) {
        event.preventDefault();
        openLightbox(idx);
      }
    });
  });

  if (lbClose) lbClose.addEventListener("click", closeLightbox);
  if (lbBg) lbBg.addEventListener("click", closeLightbox);
  if (lbPrev) lbPrev.addEventListener("click", (e) => { e.stopPropagation(); updateLightbox(currentLbIndex - 1); });
  if (lbNext) lbNext.addEventListener("click", (e) => { e.stopPropagation(); updateLightbox(currentLbIndex + 1); });

  // Navegação por teclado
  document.addEventListener("keydown", (e) => {
    if (!lightbox || !lightbox.classList.contains("active")) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowLeft") updateLightbox(currentLbIndex - 1);
    else if (e.key === "ArrowRight") updateLightbox(currentLbIndex + 1);
  });
}

// ==========================================
// 12. CONFIRMAÇÃO DE PRESENÇA (RSVP) & INGRESSO COM QR CODE
// ==========================================
function initRsvpForm() {
  const form = document.getElementById("rsvp-form");
  const childrenSelect = document.getElementById("guest-children");
  const dynamicBox = document.getElementById("children-dynamic-box");
  const rowsList = document.getElementById("children-rows-list");
  const addChildBtn = document.getElementById("btn-add-child-row");
  const presenceRadios = document.querySelectorAll('input[name="presence"]');
  const attendeesContainer = document.getElementById("attendees-container");

  document.addEventListener("noah:delivered", event => {
    if (event.detail.kind !== "rsvp") return;
    const state = document.getElementById("rsvp-delivery-status");
    state.textContent = "Sua resposta foi recebida. Obrigado!";
    state.dataset.pending = "false";
    const ticket = document.getElementById("ticket-modal");
    if (ticket.classList.contains("open") && document.getElementById("ticket-guest-name").textContent === event.detail.record.name) {
      displayDigitalTicket(event.detail.record);
    }
  });

  // Alterna exibição se "Não poderei ir" for marcado
  presenceRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      if (radio.value === "Não comparecerá") {
        if (attendeesContainer) attendeesContainer.style.display = "none";
      } else {
        if (attendeesContainer) attendeesContainer.style.display = "block";
      }
      rowsList.querySelectorAll("input, select").forEach(field => { field.disabled = radio.value === "Não comparecerá"; });
    });
  });

  // Atualiza linhas de crianças com base no select
  const syncChildrenRows = () => {
    const qty = parseInt(childrenSelect.value, 10) || 0;
    if (qty > 0) {
      dynamicBox.style.display = "block";
      const currentRows = rowsList.querySelectorAll(".child-row-item").length;
      if (currentRows < qty) {
        for (let i = currentRows; i < qty; i++) {
          addChildRow(i + 1);
        }
      } else if (currentRows > qty) {
        Array.from(rowsList.children).slice(qty).forEach(row => row.remove());
      }
    } else {
      dynamicBox.style.display = "none";
      rowsList.innerHTML = "";
    }
  };

  if (childrenSelect) {
    childrenSelect.addEventListener("change", syncChildrenRows);
  }

  const addChildRow = (index = 1, defaultName = "", defaultAge = "") => {
    const row = document.createElement("div");
    row.className = "child-row-item";
    row.innerHTML = `
      <label class="child-field-label">Nome da criança ou adolescente ${index}
        <input type="text" class="form-input child-name-input" placeholder="Nome" value="${escapeHtml(defaultName)}" required maxlength="160">
      </label>
      <label class="child-field-label">Idade (anos completos)
        <select class="form-select child-age-select" required>
          <option value="" ${defaultAge === "" ? "selected" : ""}>Selecione a idade</option>
          ${Array.from({ length: 18 }, (_, age) => `<option value="${age}" ${String(defaultAge) === String(age) ? "selected" : ""}>${age === 0 ? "Menos de 1 ano" : age + (age === 1 ? " ano" : " anos")}</option>`).join("")}
        </select>
      </label>
      <button type="button" class="btn-remove-child-row" title="Remover criança ou adolescente">&times;</button>
    `;

    row.querySelector(".btn-remove-child-row").addEventListener("click", () => {
      row.remove();
      const remaining = rowsList.querySelectorAll(".child-row-item").length;
      if (childrenSelect) childrenSelect.value = Math.min(remaining, 4);
      if (remaining === 0 && dynamicBox) dynamicBox.style.display = "none";
    });

    rowsList.appendChild(row);
  };

  if (addChildBtn) {
    addChildBtn.addEventListener("click", () => {
      const current = rowsList.querySelectorAll(".child-row-item").length;
      addChildRow(current + 1);
      if (childrenSelect) childrenSelect.value = Math.min(current + 1, 4);
      if (dynamicBox) dynamicBox.style.display = "block";
    });
  }

  // Envio do Formulário
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById("guest-name");
      const phoneInput = document.getElementById("guest-phone");
      const presenceChecked = document.querySelector('input[name="presence"]:checked');
      const adultsSelect = document.getElementById("guest-adults");
      const companionsInput = document.getElementById("guest-companions");
      const messageInput = document.getElementById("guest-message");
      const submitBtn = document.getElementById("btn-submit-rsvp");
      const submitText = document.getElementById("btn-submit-text");

      if (!nameInput.value.trim()) {
        alert("Por favor, preencha o seu nome completo.");
        nameInput.focus();
        return;
      }
      if (!phoneInput.value.trim()) {
        alert("Por favor, informe seu WhatsApp para contato.");
        phoneInput.focus();
        return;
      }

      const presence = presenceChecked ? presenceChecked.value : "Confirmado";
      const adults = parseInt(adultsSelect.value, 10) || 1;

      // Coleta detalhes das crianças
      const childrenDetails = [];
      const childRows = rowsList.querySelectorAll(".child-row-item");
      if (presence === "Confirmado") {
        for (const row of childRows) {
          const ageInput = row.querySelector(".child-age-select");
          const childName = row.querySelector(".child-name-input");
          if (!childName.value.trim() || ageInput.value === "" || !Number.isInteger(Number(ageInput.value)) || Number(ageInput.value) < 0 || Number(ageInput.value) > 17) {
            (childName.value.trim() ? ageInput : childName).reportValidity();
            return;
          }
          childrenDetails.push({ name: childName.value.trim(), age: Number(ageInput.value) });
        }
      }

      const payload = {
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        presence: presence,
        adults: presence === "Confirmado" ? adults : 0,
        children: presence === "Confirmado" ? childrenDetails.length : 0,
        childrenDetails: presence === "Confirmado" ? childrenDetails : [],
        companions: companionsInput ? companionsInput.value.trim() : "",
        message: messageInput ? messageInput.value.trim() : "",
        createdAt: new Date().toISOString()
      };

      submitBtn.disabled = true;
      submitText.textContent = "GRAVANDO MISSÃO...";

      try {
        const randomSuffix = NoahDelivery.createId().slice(0, 8).toUpperCase();
        const ticketCode = `NOAH-1-${randomSuffix}`;
        const localVouchers = NoahRecords.vouchers({ ...payload, ticketCode });

        let savedRsvp = {
          id: NoahDelivery.createId(),
          ticketCode: ticketCode,
          ...payload,
          vouchers: localVouchers
        };

        NoahDelivery.enqueue("rsvp", savedRsvp);
        saveRsvpLocally(savedRsvp);
        await NoahDelivery.flush();
        const savedLocal = JSON.parse(localStorage.getItem("noah_story_rsvps") || "[]");
        savedRsvp = savedLocal.find(record => record.id === savedRsvp.id || record.phone === savedRsvp.phone) || savedRsvp;
        const waiting = NoahDelivery.pending("rsvp", savedRsvp.id);
        const deliveryStatus = document.getElementById("rsvp-delivery-status");
        deliveryStatus.textContent = waiting
          ? "Sua resposta está guardada neste aparelho e aguarda conexão. Mantenha o convite aberto para concluir o envio."
          : "Sua resposta foi recebida e confirmada. Obrigado por participar!";
        deliveryStatus.dataset.pending = waiting;

        // Celebração & Modal do Ingresso
        playFanfare();
        triggerConfetti(100, 90);

        if (presence === "Confirmado") {
          displayDigitalTicket(savedRsvp);
        } else {
          showNotification("Obrigado por nos avisar! Sentiremos sua falta, parceiro! 🤠");
        }

        form.reset();
        if (attendeesContainer) attendeesContainer.style.display = "block";
        rowsList.innerHTML = "";
        if (dynamicBox) dynamicBox.style.display = "none";
      } catch (err) {
        console.error("Erro no envio:", err);
        alert("Ocorreu um erro ao processar. Por favor, tente novamente.");
      } finally {
        submitBtn.disabled = false;
        submitText.textContent = "🤠 CONFIRMAR MINHA MISSÃO! 🚀";
      }
    });
  }

  // Ações do Ingresso Digital
  initDigitalTicketActions();
}

function saveRsvpLocally(rsvp) {
  try {
    let local = JSON.parse(localStorage.getItem("noah_story_rsvps") || "[]");
    const idx = local.findIndex(r => r.id === rsvp.id || r.ticketCode === rsvp.ticketCode || (r.phone && r.phone.replace(/\D/g, "") === (rsvp.phone || "").replace(/\D/g, "")));
    if (idx >= 0) {
      local[idx] = rsvp;
    } else {
      local.unshift(rsvp);
    }
    localStorage.setItem("noah_story_rsvps", JSON.stringify(local));
  } catch (e) {
    console.warn("Erro ao salvar local:", e);
  }
}

// ==========================================
// 13. EXIBIÇÃO & DOWNLOAD DO INGRESSO DIGITAL (QR CODE)
// ==========================================
function displayDigitalTicket(rsvp) {
  const modal = document.getElementById("ticket-modal");
  const codeEl = document.getElementById("ticket-display-code");
  const nameEl = document.getElementById("ticket-guest-name");
  const descEl = document.getElementById("ticket-attendees-desc");
  const qrcodeContainer = document.getElementById("ticket-qrcode-container");
  const vouchersList = document.getElementById("ticket-vouchers-list");
  const vouchersContainer = document.getElementById("ticket-vouchers-container");

  if (!modal) return;

  const pending = NoahDelivery.pending("rsvp", rsvp.id);
  document.getElementById("ticket-delivery-state").textContent = pending
    ? "Aguardando conexão para registrar seu ingresso. Seus dados estão guardados neste aparelho."
    : "Ingresso registrado.";
  document.getElementById("btn-download-ticket-png").disabled = pending;

  if (codeEl) codeEl.textContent = rsvp.ticketCode || "NOAH-1-0000";
  if (nameEl) nameEl.textContent = rsvp.name;

  const totalKids = (rsvp.childrenDetails || []).length;
  if (descEl) {
    descEl.textContent = `${rsvp.adults} Adulto(s) ${totalKids > 0 ? " + " + totalKids + " Criança(s)/Teen(s)" : ""}`;
  }

  // Gera o QR Code exclusivo
  if (qrcodeContainer) {
    qrcodeContainer.innerHTML = "";
    const qrData = `NOAH-STORY-1|${rsvp.ticketCode}|${encodeURIComponent(rsvp.name)}|CONFIRMADO`;
    if (typeof QRCode !== "undefined") {
      new QRCode(qrcodeContainer, {
        text: qrData,
        width: 96,
        height: 96,
        colorDark: "#1e293b",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
      });
    } else {
      qrcodeContainer.innerHTML = `<span style="font-size: 2rem;">🎟️</span>`;
    }
  }

  // Recalcula também ingressos antigos sem perder as baixas existentes.
  rsvp = { ...rsvp, vouchers: NoahRecords.vouchers(rsvp) };
  // Renderiza Vouchers de Lembrancinhas
  if (vouchersList) {
    vouchersList.innerHTML = "";
    if (rsvp.vouchers && rsvp.vouchers.length > 0) {
      if (vouchersContainer) vouchersContainer.style.display = "block";
      rsvp.vouchers.forEach(v => {
        const item = document.createElement("div");
        item.className = `voucher-item-pill ${v.type === "pink" ? "voucher-item-pink" : "voucher-item-blue"}`;
        item.innerHTML = `
          <div>
            <span>${escapeHtml(v.childName || "Criança")}<br><small>${escapeHtml(v.label)}</small></span>
            <div style="font-size: 0.875rem; opacity: 0.9;">${v.code} • ${v.qty} lembrancinha(s)</div>
          </div>
          <span style="font-size: 0.75rem; background: rgba(0,0,0,0.25); padding: 2px 8px; border-radius: 999px;">
            ${v.redeemed ? "ENTREGUE" : "VÁLIDO"}
          </span>
        `;
        vouchersList.appendChild(item);
      });
    } else {
      if (vouchersContainer) vouchersContainer.style.display = "none";
    }
  }

  modal.classList.add("open");
}

function initDigitalTicketActions() {
  const closeBtn = document.getElementById("ticket-close-btn");
  const modal = document.getElementById("ticket-modal");
  const downloadBtn = document.getElementById("btn-download-ticket-png");
  const shareBtn = document.getElementById("btn-whatsapp-ticket-share");

  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("open");
    });
  }

  // Download do ingresso em imagem PNG (via html2canvas)
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      const ticketEl = document.getElementById("printable-ticket");
      if (!ticketEl) return;

      downloadBtn.innerHTML = "<span>⏳</span> Gerando Imagem...";

      if (typeof html2canvas !== "undefined") {
        html2canvas(ticketEl, {
          scale: 2,
          useCORS: true,
          backgroundColor: null
        }).then(canvas => {
          const link = document.createElement("a");
          link.download = `ingresso-noah-story-1.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
          downloadBtn.innerHTML = "<span>✅</span> Imagem Baixada!";
          setTimeout(() => {
            downloadBtn.innerHTML = "<span>📥</span> Baixar Imagem do Ingresso (PNG)";
          }, 3000);
        }).catch(err => {
          console.error("Erro ao gerar imagem:", err);
          alert("Dica: tire um print da tela do seu ingresso!");
          downloadBtn.innerHTML = "<span>📥</span> Baixar Imagem do Ingresso (PNG)";
        });
      } else {
        alert("Dica: você pode tirar um print da tela do seu ingresso para apresentar na entrada!");
        downloadBtn.innerHTML = "<span>📥</span> Baixar Imagem do Ingresso (PNG)";
      }
    });
  }

  // Compartilhar no WhatsApp
  if (shareBtn) {
    shareBtn.addEventListener("click", () => {
      const code = document.getElementById("ticket-display-code").textContent || "NOAH-1";
      const msg = encodeURIComponent(`🎉 Presença confirmada no 1º Aninho do Xerife Noah! Meu código de ingresso é: ${code}. Nos vemos no dia 16/01/2027! 🤠🚀`);
      window.open(`https://api.whatsapp.com/send?text=${msg}`, "_blank");
    });
  }
}

// ==========================================
// 14. MURAL DE RECADOS (CÁPSULA DO TEMPO) 💌
// ==========================================
function initTimeCapsule() {
  const form = document.getElementById("capsule-form");
  const status = document.getElementById("capsule-delivery-status");
  let latestMessageId;
  try {
    const saved = JSON.parse(localStorage.getItem("noah_story_messages") || "[]");
    if (saved.some(message => NoahDelivery.pending("message", message.id))) {
      status.textContent = "Há uma carta guardada neste aparelho aguardando confirmação de entrega. O convite tentará enviar novamente.";
      status.dataset.pending = "true";
    }
  } catch {}
  document.addEventListener("noah:delivered", event => {
    if (event.detail.kind !== "message") return;
    if (!latestMessageId || event.detail.record.id === latestMessageId) {
      status.textContent = event.detail.record.destination === "server"
        ? "Recado para o Noah recebido e guardado pelos pais."
        : "Recado para o Noah confirmado na planilha e entregue aos pais!";
      status.dataset.pending = "false";
    }
    void renderApprovedMessages();
    if (AppState.adminAuthenticated) void refreshAdminData();
  });

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const authorInput = document.getElementById("capsule-author");
      const messageInput = document.getElementById("capsule-message");
      const btn = document.getElementById("btn-send-capsule");

      if (!authorInput.value.trim() || !messageInput.value.trim()) return;

      btn.disabled = true;
      btn.textContent = "🚀 GUARDANDO NA CÁPSULA...";

      const newMsg = {
        id: NoahDelivery.createId(), createdAt: new Date().toISOString(),
        author: authorInput.value.trim(),
        message: messageInput.value.trim(),
        recipient: "Pequeno Xerife Noah", source: "capsule", status: "approved"
      };

      try {
        NoahDelivery.enqueue("message", newMsg);
        latestMessageId = newMsg.id;
        saveMessageLocally(newMsg);
        status.textContent = "Enviando sua carta para o Noah...";
        status.dataset.pending = "true";
        await NoahDelivery.flush();
        if (NoahDelivery.pending("message", newMsg.id)) {
          status.dataset.pending = "true";
          status.textContent = "Sua carta está guardada neste aparelho e aguarda confirmação de entrega. O convite tentará enviar novamente quando houver conexão.";
        } else {
          playFanfare();
          triggerConfetti(40, 50);
        }
        form.reset();
      } catch (err) {
        status.textContent = "Não foi possível guardar sua carta. Seu texto continua no formulário; tente enviar novamente.";
      } finally {
        btn.disabled = false;
        btn.textContent = "🤠 ENVIAR PARA O PEQUENO XERIFE! 💌";
      }
    });
  }
}

function saveMessageLocally(msg) {
  try {
    let local = JSON.parse(localStorage.getItem("noah_story_messages") || "[]");
    local = local.filter(item => item.id !== msg.id);
    local.unshift(msg);
    localStorage.setItem("noah_story_messages", JSON.stringify(local));
  } catch (e) {
    console.warn("Erro ao salvar local:", e);
  }
}

async function renderApprovedMessages() {
  const board = document.getElementById("capsule-messages-board");
  if (!board) return;

  let messages = [];

  try {
    const data = await NoahData.request("publicMessages");
    if (!Array.isArray(data.messages)) throw new Error("Recados indisponíveis");
    messages = data.messages;
  } catch (e) {
    try { messages = JSON.parse(localStorage.getItem("noah_story_messages") || "[]").filter(message => message.deliveryConfirmedAt); }
    catch {}
    if (!messages.length) {
      board.textContent = "Os recados não puderam ser carregados agora. Suas cartas pendentes continuam guardadas neste aparelho.";
      return;
    }
  }

  board.innerHTML = "";
  if (messages.length === 0) {
    board.innerHTML = `<p style="font-size: 0.9rem; color: #64748b; font-style: italic;">Seja o primeiro a enviar uma carta com carinho para o pequeno xerife!</p>`;
    return;
  }

  messages.slice(0, 6).forEach(m => {
    const card = document.createElement("div");
    card.className = "capsule-message-card";
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; font-weight: 800; color: #92400e; margin-bottom: 6px; border-bottom: 1px dashed rgba(180, 83, 9, 0.3); padding-bottom: 4px;">
        <span>🤠 Para: Pequeno Xerife Noah</span>
        <span>⭐ 1º Aninho</span>
      </div>
      <div class="capsule-msg-text" style="font-size: 0.92rem; color: #451a03; line-height: 1.45; font-style: italic;">
        "${escapeHtml(m.message)}"
      </div>
      <div class="capsule-msg-author" style="text-align: right; margin-top: 8px; font-weight: 700; color: #78350f; font-size: 0.88rem;">
        — Com carinho, <strong>${escapeHtml(m.author)}</strong>
      </div>
    `;
    board.appendChild(card);
  });
}

// ==========================================
// 15. PAINEL DOS PAIS (FILIPE & YASMIN) ⚙️
// ==========================================
function initAdminDashboard() {
  const modal = document.getElementById("admin-modal");
  const login = document.getElementById("admin-login-screen");
  const dashboard = document.getElementById("admin-dashboard-screen");
  const password = document.getElementById("admin-password-input");
  const loginError = document.getElementById("admin-login-err");
  const loginButton = document.getElementById("btn-admin-login");
  const showScreen = () => {
    login.style.display = AppState.adminAuthenticated ? "none" : "block";
    dashboard.style.display = AppState.adminAuthenticated ? "block" : "none";
  };
  document.getElementById("admin-quick-btn").addEventListener("click", () => {
    showScreen();
    modal.classList.add("open");
    if (AppState.adminAuthenticated) void refreshAdminData();
  });
  for (const id of ["admin-login-close-btn", "admin-dash-close-btn"]) {
    document.getElementById(id).addEventListener("click", () => modal.classList.remove("open"));
  }
  loginButton.addEventListener("click", async () => {
    loginButton.disabled = true;
    loginError.textContent = "Conectando ao controle dos pais...";
    try {
      const data = await NoahData.request("dashboard", { password: password.value });
      NoahRecords.dashboard(data); // Valida o contrato antes de abrir o painel.
      AppState.adminPassword = password.value;
      AppState.adminAuthenticated = true;
      password.value = "";
      loginError.textContent = "";
      showScreen();
      await refreshAdminData(data);
    } catch (error) { loginError.textContent = error.message; }
    finally { loginButton.disabled = false; }
  });
  password.addEventListener("keydown", event => { if (event.key === "Enter" && !loginButton.disabled) loginButton.click(); });
  document.getElementById("admin-logout").addEventListener("click", () => {
    AppState.adminAuthenticated = false;
    AppState.adminPassword = null;
    AppState.rsvps = [];
    AppState.messages = [];
    showScreen();
    password.focus();
  });
  document.getElementById("admin-refresh-data").addEventListener("click", () => void refreshAdminData());
  setInterval(() => {
    if (AppState.adminAuthenticated && modal.classList.contains("open") && !document.hidden) void refreshAdminData();
  }, 30000);
  document.querySelectorAll(".admin-tab-btn").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll(".admin-tab-btn").forEach(item => item.classList.toggle("active", item === button));
    document.querySelectorAll(".admin-tab-content").forEach(section => {
      section.style.display = section.id === button.dataset.tab ? "block" : "none";
    });
  }));
  document.getElementById("admin-guest-search").addEventListener("input", event => renderAdminGuestsTable(event.target.value.toLowerCase()));
  document.getElementById("btn-validate-voucher").addEventListener("click", async event => {
    const input = document.getElementById("voucher-code-input");
    const status = document.getElementById("voucher-validation-feedback");
    if (!input.value.trim()) return;
    event.currentTarget.disabled = true;
    try {
      const answer = await adminAction("redeemVoucher", { code: input.value.trim() });
      status.textContent = answer.message;
      input.value = "";
    } catch (error) { status.textContent = error.message; }
    finally { document.getElementById("btn-validate-voucher").disabled = false; }
  });
  document.getElementById("btn-export-csv-direct").addEventListener("click", () => {
    const cell = value => {
      let text = String(value ?? "");
      if (/^[-=+@]/.test(text)) text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    };
    const rows = [["Convidado", "Telefone", "Presença", "Adultos", "Crianças e jovens", "Distintivo", "Código do ingresso", "Recado para o Noah"]];
    AppState.rsvps.forEach(record => rows.push([record.name, record.phone, record.presence, record.adults, record.children,
      record.badgeStatus || "Não", record.ticketCode, record.message]));
    const blob = new Blob(["\uFEFF" + rows.map(row => row.map(cell).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "resumo-pais-noah.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  });

  const scriptInput = document.getElementById("admin-script-url-input");
  const scriptStatus = document.getElementById("admin-sheet-save-status");
  scriptInput.value = PARTY_CONFIG.googleScriptUrl || "";
  fetch("/api/settings").then(response => response.ok ? response.json() : null).then(data => {
    if (data?.settings) scriptInput.value = data.settings.googleScriptUrl || "";
  }).catch(() => {});
  document.getElementById("btn-save-script-url").addEventListener("click", async event => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      const url = scriptInput.value.trim();
      if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(url)) throw new Error("Informe a URL de implantação terminada em /exec.");
      let server = false;
      const response = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ googleScriptUrl: url }) });
      if (response.status !== 404 && response.status !== 405) {
        const answer = await response.json();
        if (!response.ok || !answer.success) throw new Error(answer.message || "Não foi possível salvar a URL.");
        server = true;
      }
      PARTY_CONFIG.googleScriptUrl = url;
      localStorage.setItem("noah_invite_script_url", url);
      scriptStatus.textContent = server ? "Integração salva no servidor." : "Integração salva neste navegador.";
      await refreshAdminData();
    } catch (error) { scriptStatus.textContent = error.message; }
    finally { button.disabled = false; }
  });
  document.getElementById("btn-test-script-url").addEventListener("click", async event => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await NoahData.request("dashboard", { password: AppState.adminPassword });
      scriptStatus.textContent = "Leitura da planilha confirmada com a senha dos pais.";
    } catch (error) { scriptStatus.textContent = error.message; }
    finally { button.disabled = false; }
  });
  document.getElementById("btn-sync-all-to-sheets").addEventListener("click", async event => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await NoahDelivery.flush();
      const response = await fetch("/api/sheets/sync", { method: "POST" });
      if (!response.ok && response.status !== 404 && response.status !== 405) throw new Error("O servidor não confirmou a sincronização.");
      await refreshAdminData();
      scriptStatus.textContent = "Nova tentativa de entrega concluída. Os registros pendentes continuam guardados.";
    } catch (error) { scriptStatus.textContent = error.message; }
    finally { button.disabled = false; }
  });
}

let adminRefreshRunning = false;
async function refreshAdminData(snapshot) {
  if (!AppState.adminAuthenticated || adminRefreshRunning) return;
  adminRefreshRunning = true;
  const status = document.getElementById("admin-data-status");
  const button = document.getElementById("admin-refresh-data");
  button.disabled = true;
  status.textContent = "Atualizando o resumo...";
  try {
    const answer = snapshot || await NoahData.request("dashboard", { password: AppState.adminPassword });
    const data = NoahRecords.dashboard(answer);
    if (!AppState.adminAuthenticated) return;
    AppState.rsvps = data.rsvps;
    AppState.messages = data.messages;
    AppState.dashboardSource = data.source;
    const fields = { "stat-total-rsvps": "responses", "stat-confirmed-people": "people", "stat-adults": "adults",
      "stat-kids": "children", "stat-badges": "badges", "stat-favors": "favors", "stat-messages": "messages", "stat-declined": "declined" };
    for (const [id, key] of Object.entries(fields)) document.getElementById(id).textContent = data.summary[key];
    const favors = document.getElementById("stat-favors");
    favors.dataset.pending = String(data.summary.missingAges > 0);
    if (data.summary.missingAges) favors.textContent = data.summary.favors ? data.summary.favors + "+" : "A confirmar";
    const source = data.source === "sheet" ? "planilha" : "servidor do convite";
    status.textContent = "Dados " + (data.source === "sheet" ? "da " : "do ") + source + " · atualizado às " + new Date().toLocaleTimeString("pt-BR") + ".";
    document.getElementById("sheet-sync-status").textContent = "O resumo e os recados são consultados diretamente " + (data.source === "sheet" ? "na " : "no ") + source + ".";
    document.getElementById("admin-summary-note").textContent = data.summary.missingAges
      ? data.summary.missingAges + " criança(s) sem idade informada: o total de pessoas está incluído, mas as lembrancinhas dessas crianças ainda não podem ser calculadas."
      : "Lembrancinhas: 2 por criança de 0 a 12 anos e 1 por pré-adolescente de 13 a 17 anos, entre as presenças confirmadas.";
    renderAdminGuestsTable(document.getElementById("admin-guest-search").value.toLowerCase());
    renderAdminVouchersTable();
    renderAdminMessagesList();
  } catch (error) {
    status.textContent = "Não foi possível atualizar: " + error.message + " Os dados anteriores continuam na tela.";
  } finally { adminRefreshRunning = false; button.disabled = false; }
}

async function adminAction(action, values) {
  const answer = await NoahData.request(action, { ...values, password: AppState.adminPassword });
  await refreshAdminData();
  return answer;
}

function renderAdminGuestsTable(query = "") {
  const tbody = document.getElementById("admin-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";
  const filtered = AppState.rsvps.filter(r => {
    if (!query) return true;
    return (r.name && r.name.toLowerCase().includes(query)) || (r.phone && r.phone.includes(query));
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #64748b; padding: 14px;">Nenhum convidado encontrado.</td></tr>`;
    return;
  }

  filtered.forEach(r => {
    const tr = document.createElement("tr");
    const favorsCount = (r.vouchers || []).reduce((acc, v) => acc + (v.qty || 0), 0);
    const isConf = r.presence === "Confirmado";

    tr.innerHTML = `
      <td><strong>${escapeHtml(r.ticketCode || "Sem ingresso")}</strong></td>
      <td>
        <div style="font-weight: bold;">${escapeHtml(r.name)}</div>
        <div style="font-size: 0.75rem; color: #64748b;">${escapeHtml(r.phone || "")}</div>
      </td>
      <td>
        <span style="display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 0.75rem; font-weight: bold; background: ${isConf ? "#dcfce7; color: #15803d" : "#fee2e2; color: #991b1b"}">
          ${isConf ? "Confirmado" : "Ausente"}
        </span>
      </td>
      <td>${r.adults || 0}</td>
      <td>${r.children || 0}</td>
      <td><span style="font-weight: bold; color: #b45309;">${favorsCount} itens</span></td>
      <td><span class="admin-badge-status" data-earned="${r.badgeStatus === "Sim"}">${r.badgeStatus === "Sim" ? "Sim ⭐" : "Não"}</span></td>
      <td>
        <div style="display: flex; gap: 4px;">
          <button type="button" class="btn-view-ticket-admin" style="background: #3b82f6; color: #fff; border: none; padding: 4px 8px; border-radius: 6px; cursor: pointer; font-size: 0.75rem;" title="${r.ticketCode ? "Ver ingresso" : "Registro antigo sem ingresso"}" ${r.ticketCode ? "" : "disabled"}>🎟️</button>
          <button type="button" class="btn-del-rsvp-admin" style="background: #ef4444; color: #fff; border: none; padding: 4px 8px; border-radius: 6px; cursor: pointer; font-size: 0.75rem;" title="Cancelar presença" ${isConf ? "" : "disabled"}>Cancelar</button>
        </div>
      </td>
    `;

    tr.querySelector(".btn-view-ticket-admin").addEventListener("click", () => {
      displayDigitalTicket(r);
    });

    tr.querySelector(".btn-del-rsvp-admin").addEventListener("click", async () => {
      if (confirm(`Cancelar a presença de ${r.name}? O registro continuará guardado.`)) {
        try {
          await adminAction("cancelRsvp", { id: r.id });
        } catch (e) {
          document.getElementById("admin-data-status").textContent = e.message;
        }
      }
    });

    tbody.appendChild(tr);
  });
}

function renderAdminVouchersTable() {
  const tbody = document.getElementById("admin-vouchers-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";
  const allVouchers = [];

  AppState.rsvps.forEach(r => {
    (r.vouchers || []).forEach(v => {
      allVouchers.push({ ...v, guestName: r.name });
    });
  });

  if (allVouchers.length === 0) {
    tbody.innerHTML = '<p class="admin-empty-state">Nenhum voucher emitido até o momento.</p>';
    return;
  }

  allVouchers.forEach(v => {
    const tr = document.createElement("article");
    tr.className = `admin-voucher-card voucher-card-${v.type}`;
    tr.innerHTML = `
      <div class="admin-voucher-heading">
        <div><strong>${escapeHtml(v.childName || "")}</strong><span>Responsável: ${escapeHtml(v.guestName || "")}</span></div>
        <span class="voucher-category voucher-category-${v.type}">${escapeHtml(v.label)}</span>
      </div>
      <code>${escapeHtml(v.code)}</code>
      <div class="admin-voucher-footer">
        <span>${v.qty} lembrancinha${v.qty === 1 ? "" : "s"}</span>
        <strong class="voucher-delivery-state" data-redeemed="${v.redeemed}">${v.redeemed ? "Entregue ✓" : "A entregar"}</strong>
        ${!v.redeemed ? '<button type="button" class="btn-redeem-row">Registrar entrega</button>' : `<span>${v.redeemedAt ? new Date(v.redeemedAt).toLocaleDateString("pt-BR") : "Entrega registrada"}</span>`}
      </div>
    `;
    const redeemBtn = tr.querySelector(".btn-redeem-row");
    if (redeemBtn) {
      redeemBtn.addEventListener("click", async () => {
        try {
          redeemBtn.disabled = true;
          await adminAction("redeemVoucher", { code: v.code });
          playFanfare();
        } catch (e) {
          document.getElementById("admin-data-status").textContent = e.message;
        } finally { redeemBtn.disabled = false; }
      });
    }

    tbody.appendChild(tr);
  });
}

function renderAdminMessagesList() {
  const container = document.getElementById("admin-messages-list");
  if (!container) return;

  const messages = AppState.messages || [];

  container.innerHTML = "";
  if (messages.length === 0) {
    container.innerHTML = `<p style="font-size: 0.88rem; color: #64748b;">Nenhuma mensagem recebida ainda.</p>`;
    return;
  }

  messages.forEach(m => {
    const item = document.createElement("div");
    item.className = "admin-message-card";
    item.innerHTML = `
      <div>
        <p class="admin-message-recipient">✉️ Para: Pequeno Xerife Noah</p>
        <div style="font-weight: bold; font-size: 0.9rem;">${escapeHtml(m.author)}</div>
        <div style="font-size: 0.85rem; color: #475569;">"${escapeHtml(m.message)}"</div>
        <small>${m.source === "rsvp" ? "Formulário de presença" : "Cápsula do tempo"}</small>
      </div>
      <button type="button" class="btn-del-msg">Arquivar</button>
    `;

    item.querySelector(".btn-del-msg").addEventListener("click", async () => {
      if (confirm("Arquivar este recado? O texto continuará guardado na planilha.")) {
        try {
          await adminAction("archiveMessage", { id: m.id });
          void renderApprovedMessages();
        } catch (e) {
          document.getElementById("admin-data-status").textContent = e.message;
        }
      }
    });

    container.appendChild(item);
  });
}

// ==========================================
// 16. CARREGAR DADOS INICIAIS
// ==========================================
function loadInitialData() {
  renderApprovedMessages();
}

// Toast de Notificação Flutuante
function showNotification(text) {
  let toast = document.getElementById("app-floating-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "app-floating-toast";
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: #1e293b;
      color: #facc15;
      font-family: var(--font-heading);
      font-weight: 700;
      font-size: 0.95rem;
      padding: 12px 22px;
      border-radius: 999px;
      border: 2px solid #facc15;
      box-shadow: 0 10px 25px rgba(0,0,0,0.4);
      z-index: 99999;
      transition: transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
      pointer-events: none;
      text-align: center;
      max-width: 90vw;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = text;
  toast.style.transform = "translateX(-50%) translateY(0)";

  setTimeout(() => {
    toast.style.transform = "translateX(-50%) translateY(100px)";
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
