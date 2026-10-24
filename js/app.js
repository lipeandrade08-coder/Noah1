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
  initSoundSystem();
  initCinematicIntro();
  initAlienHuntMinigame();
  initInteractiveToyBlocks();
  initNoahBalloons();
  initCharactersSection();
  initSpaceMissionRocket();
  initCountdown();
  initQuizToyStory();
  initForbiddenButton();
  initRsvpForm();
  initTimeCapsule();
  initAdminDashboard();
  loadInitialData();
});

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
  const tipDiaperEl = document.getElementById("tip-diapersize");

  if (datePrimaryEl) datePrimaryEl.textContent = PARTY_CONFIG.dateFormatted;
  if (dateTextEl) dateTextEl.textContent = PARTY_CONFIG.dateFormatted;
  if (timeTextEl) timeTextEl.textContent = PARTY_CONFIG.timeFormatted;
  if (locNameEl && PARTY_CONFIG.location) locNameEl.textContent = PARTY_CONFIG.location.name;
  if (locAddrEl && PARTY_CONFIG.location) {
    locAddrEl.textContent = `${PARTY_CONFIG.location.address} - ${PARTY_CONFIG.location.cityState}`;
  }
  if (tipDressEl && PARTY_CONFIG.tips) tipDressEl.textContent = PARTY_CONFIG.tips.dressCode;
  if (tipClothEl && PARTY_CONFIG.tips) tipClothEl.textContent = PARTY_CONFIG.tips.clothingSize;
  if (tipDiaperEl && PARTY_CONFIG.tips) tipDiaperEl.textContent = PARTY_CONFIG.tips.diaperSize;

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

  // A música começa pausada e só começa a tocar após o convidado abrir a caixa!
  updateSoundButton(false);

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

  // Desbloqueio do áudio e contexto sonoro no primeiro toque
  const unlockAudio = () => {
    getAudioContext();
    document.removeEventListener("touchstart", unlockAudio);
    document.removeEventListener("click", unlockAudio);
  };
  document.addEventListener("touchstart", unlockAudio, { passive: true });
  document.addEventListener("click", unlockAudio, { passive: true });
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

// Som marciano harmônico dos Alienígenas ("Ooooh!")
function playAlienOoooh() {
  if (!AppState.soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const freqs = [329.63, 493.88, 659.25]; // Acorde E maior místico
  freqs.forEach((f, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(f, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(f * 1.08, ctx.currentTime + 0.6);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + (idx * 0.04));
    osc.stop(ctx.currentTime + 0.75);
  });
}

// Sirene do Botão Proibido
function playForbiddenAlarm() {
  if (!AppState.soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  let now = ctx.currentTime;
  for (let i = 0; i < 4; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(i % 2 === 0 ? 800 : 550, now + (i * 0.18));
    gain.gain.setValueAtTime(0.2, now + (i * 0.18));
    gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.18) + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + (i * 0.18));
    osc.stop(now + (i * 0.18) + 0.17);
  }
}

// Trilha sonora leve em arpeggio de fundo
function startBackgroundMelody() {
  if (!AppState.soundEnabled || AppState.bgTrackRunning) return;
  // Apenas toca comemoração festiva se ativado
}

function stopBackgroundMelody() {
  AppState.bgTrackRunning = false;
}

// ==========================================
// 3. ABERTURA CINEMATOGRÁFICA (QUARTO DO ANDY)
// ==========================================
function initCinematicIntro() {
  const introEl = document.getElementById("cinematic-intro");
  const openChestBtn = document.getElementById("btn-open-chest");
  const skipBtn = document.getElementById("btn-skip-intro");
  const stageEl = document.getElementById("toy-chest-stage");
  const boxEl = document.getElementById("toy-chest-box");
  const initialAction = document.getElementById("intro-initial-action");
  const revealedPanel = document.getElementById("intro-revealed-panel");
  const startAdvBtn = document.getElementById("btn-start-adventure");
  const titleEl = document.getElementById("intro-main-title");

  if (!introEl || !openChestBtn) return;

  // Botão Pular Abertura
  if (skipBtn) {
    skipBtn.addEventListener("click", () => {
      introEl.classList.add("hide");
      startThemeMusic();
      playFanfare();
      triggerConfetti();
    });
  }

  // Clicar para Abrir a Caixa de Brinquedos
  openChestBtn.addEventListener("click", () => {
    startThemeMusic();

    // 1. A caixa treme
    boxEl.classList.add("wobble");
    playTone(180, 0.4, "triangle", 0.3);

    setTimeout(() => {
      boxEl.classList.remove("wobble");

      // 2. A tampa se abre em 3D e a luz irrompe
      stageEl.classList.add("opened");
      playTone(440, 0.2, "sine");
      playTone(554.37, 0.3, "triangle");
      playTone(659.25, 0.5, "sine");

      // 3. Disparar confetes suaves
      triggerConfetti();

      // 4. Transição para o painel revelado
      setTimeout(() => {
        if (initialAction) initialAction.style.display = "none";
        if (titleEl) titleEl.style.display = "none";
        if (revealedPanel) revealedPanel.classList.add("show");
        playFanfare();
      }, 700);

    }, 600);
  });

  // Botão Começar a Aventura
  if (startAdvBtn) {
    startAdvBtn.addEventListener("click", () => {
      introEl.classList.add("hide");
      startThemeMusic();
      playFanfare();
      triggerConfetti();
      const heroEl = document.querySelector(".hero-card");
      if (heroEl) {
        heroEl.scrollIntoView({ behavior: "smooth" });
      }
    });
  }
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
// 4. MINIJOGO: CAÇA AOS ALIENÍGENAS ESCONDIDOS 👽
// ==========================================
function initAlienHuntMinigame() {
  const alien1 = document.getElementById("alien-secret-1");
  const alien2 = document.getElementById("alien-secret-2");
  const alien3 = document.getElementById("alien-secret-3");

  const registerAlienClick = (num, el) => {
    if (!el) return;
    el.addEventListener("click", () => {
      if (AppState.aliensFound.has(num)) {
        playAlienOoooh();
        showNotification("👽 Alienígena: 'A Garra já nos escolheu!'");
        return;
      }

      AppState.aliensFound.add(num);
      playAlienOoooh();
      triggerConfetti(35, 45);

      // Atualiza visual do alien encontrado
      el.style.transform = "scale(1.4) rotate(15deg)";
      setTimeout(() => { el.style.transform = "scale(1)"; }, 400);

      // Atualiza o HUD
      updateAlienHud();

      showNotification(`🎉 VOCÊ ENCONTROU UM ALIENÍGENA! 👽 (${AppState.aliensFound.size}/3)`);

      // Se achou os 3
      if (AppState.aliensFound.size === 3) {
        setTimeout(celebrateAllAliensFound, 700);
      }
    });
  };

  registerAlienClick(1, alien1);
  registerAlienClick(2, alien2);
  registerAlienClick(3, alien3);

  // Botão fechar modal de vitória dos aliens
  const winModal = document.getElementById("alien-win-modal");
  const winCloseBtn = document.getElementById("alien-win-close-btn");
  const winOkBtn = document.getElementById("btn-alien-win-ok");

  const closeWinModal = () => {
    if (winModal) winModal.classList.remove("open");
  };
  if (winCloseBtn) winCloseBtn.addEventListener("click", closeWinModal);
  if (winOkBtn) winOkBtn.addEventListener("click", closeWinModal);
}

function updateAlienHud() {
  const countText = document.getElementById("aliens-counter-text");
  if (countText) countText.textContent = AppState.aliensFound.size;

  [1, 2, 3].forEach(i => {
    const dot = document.getElementById(`alien-dot-${i}`);
    if (dot) {
      if (AppState.aliensFound.has(i)) {
        dot.classList.add("found");
      } else {
        dot.classList.remove("found");
      }
    }
  });
}

function celebrateAllAliensFound() {
  playFanfare();
  playAlienOoooh();
  triggerConfetti(120, 100);

  const winModal = document.getElementById("alien-win-modal");
  if (winModal) {
    winModal.classList.add("open");
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
    block.addEventListener("click", () => {
      const note = block.getAttribute("data-note") || "C4";
      const freq = noteFreqs[note] || 440;
      playTone(freq, 0.35, "triangle", 0.25);

      block.style.transform = "scale(1.2) translateY(-6px)";
      setTimeout(() => {
        block.style.transform = "";
      }, 200);
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
// 7. TURMA DO TOY STORY & BALÃO DE FALA
// ==========================================
function initCharactersSection() {
  const cards = document.querySelectorAll(".character-card");
  const quoteToast = document.getElementById("character-quote-toast");

  cards.forEach(card => {
    card.addEventListener("click", () => {
      const charKey = card.getAttribute("data-character");
      const charData = CHARACTER_QUOTES[charKey];
      if (!charData) return;

      if (charKey === "buzz") playBuzzLaser();
      else if (charKey === "alien") playAlienOoooh();
      else playTone(440, 0.2, "triangle");

      if (quoteToast) {
        quoteToast.textContent = charData.quote;
        quoteToast.style.animation = "none";
        quoteToast.offsetHeight; // reflow
        quoteToast.style.animation = "fadeInZoom 0.35s ease";
      }
    });
  });
}

// ==========================================
// 8. FOGUETE DO BUZZ (MISSÃO INTERGALÁCTICA)
// ==========================================
function initSpaceMissionRocket() {
  const launchBtn = document.getElementById("btn-launch-mission");
  const rocketContainer = document.getElementById("rocket-ship-container");

  if (!launchBtn || !rocketContainer) return;

  launchBtn.addEventListener("click", () => {
    playBuzzLaser();
    playTone(150, 0.8, "sawtooth", 0.2);
    triggerConfetti(50, 60);

    rocketContainer.classList.add("launched");
    launchBtn.innerHTML = "<span>✨</span> MISSÃO EM CURSO!";

    setTimeout(() => {
      const missionDetails = document.querySelector(".space-mission-details");
      if (missionDetails) {
        missionDetails.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 600);

    setTimeout(() => {
      rocketContainer.classList.remove("launched");
      launchBtn.innerHTML = "<span>🚀</span> INICIAR MISSÃO!";
    }, 4000);
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
      img: "assets/images/aliens-toy-story.jpg"
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
// 11. O BOTÃO PROIBIDO 🚨
// ==========================================
function initForbiddenButton() {
  const btn = document.getElementById("btn-forbidden");
  const toast = document.getElementById("forbidden-toast-msg");
  const runner = document.getElementById("rex-panic-runner");

  if (!btn) return;

  const funnyMessages = [
    "🚨 VOCÊ ACORDOU TODOS OS BRINQUEDOS! Agora não tem volta: sua missão é se divertir no aniversário do Noah! 🤠",
    "🦖 REX EM PÂNICO: 'ALGUÉM ESCONDEU O BOLO DE CHOCOLATE?! ROAAAR!'",
    "🚀 BUZZ LIGHTYEAR: 'ALERTA VERMELHO! O ZURG FOI DETECTADO COMENDO BRIGADEIRO!'",
    "👽 OS ALIENÍGENAS: 'A GARRA FOI ACIONADA PELO SEU DEDO! OOOOOH!'",
    "🐎 JESSIE: 'IUPI-I-O! QUEM APERTOU O BOTÃO VAI TER QUE DANÇAR NO CHURRASCO!'"
  ];
  let msgIdx = 0;

  btn.addEventListener("click", () => {
    // 1. Tela treme
    document.body.classList.remove("rumble-shake");
    void document.body.offsetWidth; // trigger reflow
    document.body.classList.add("rumble-shake");

    // 2. Alarme sonoro
    playForbiddenAlarm();

    // 3. Rex correndo em pânico
    if (runner) {
      runner.classList.remove("running");
      void runner.offsetWidth;
      runner.classList.add("running");
    }

    // 4. Confetes
    triggerConfetti(80, 90);

    // 5. Mensagem aleatória
    if (toast) {
      toast.textContent = funnyMessages[msgIdx % funnyMessages.length];
      msgIdx++;
    }
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

  // Alterna exibição se "Não poderei ir" for marcado
  presenceRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      if (radio.value === "Não comparecerá") {
        if (attendeesContainer) attendeesContainer.style.display = "none";
      } else {
        if (attendeesContainer) attendeesContainer.style.display = "block";
      }
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
      }
    } else {
      dynamicBox.style.display = "none";
      rowsList.innerHTML = "";
    }
  };

  if (childrenSelect) {
    childrenSelect.addEventListener("change", syncChildrenRows);
  }

  const addChildRow = (index = 1, defaultName = "", defaultAge = "4") => {
    const row = document.createElement("div");
    row.className = "child-row-item";
    row.innerHTML = `
      <input type="text" class="form-input child-name-input" placeholder="Nome da Criança ${index}" value="${defaultName}">
      <select class="form-select child-age-select">
        <option value="0" ${defaultAge == 0 ? "selected" : ""}>Bebê (&lt; 1 ano)</option>
        <option value="1" ${defaultAge == 1 ? "selected" : ""}>1 ano</option>
        <option value="2" ${defaultAge == 2 ? "selected" : ""}>2 anos</option>
        <option value="3" ${defaultAge == 3 ? "selected" : ""}>3 anos</option>
        <option value="4" ${defaultAge == 4 ? "selected" : ""}>4 anos</option>
        <option value="5" ${defaultAge == 5 ? "selected" : ""}>5 anos</option>
        <option value="6" ${defaultAge == 6 ? "selected" : ""}>6 anos</option>
        <option value="7" ${defaultAge == 7 ? "selected" : ""}>7 anos</option>
        <option value="8" ${defaultAge == 8 ? "selected" : ""}>8 anos</option>
        <option value="9" ${defaultAge == 9 ? "selected" : ""}>9 anos</option>
        <option value="10" ${defaultAge == 10 ? "selected" : ""}>10 anos</option>
        <option value="11" ${defaultAge == 11 ? "selected" : ""}>11 anos</option>
        <option value="12" ${defaultAge == 12 ? "selected" : ""}>12 anos</option>
        <option value="13" ${defaultAge == 13 ? "selected" : ""}>13 anos (Teen)</option>
        <option value="14" ${defaultAge == 14 ? "selected" : ""}>14 anos (Teen)</option>
        <option value="15" ${defaultAge == 15 ? "selected" : ""}>15 anos (Teen)</option>
        <option value="16" ${defaultAge == 16 ? "selected" : ""}>16 anos (Teen)</option>
      </select>
      <button type="button" class="btn-remove-child-row" title="Remover">&times;</button>
    `;

    row.querySelector(".btn-remove-child-row").addEventListener("click", () => {
      row.remove();
      const remaining = rowsList.querySelectorAll(".child-row-item").length;
      if (childrenSelect) childrenSelect.value = remaining;
      if (remaining === 0 && dynamicBox) dynamicBox.style.display = "none";
    });

    rowsList.appendChild(row);
  };

  if (addChildBtn) {
    addChildBtn.addEventListener("click", () => {
      const current = rowsList.querySelectorAll(".child-row-item").length;
      addChildRow(current + 1);
      if (childrenSelect) childrenSelect.value = current + 1;
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
      childRows.forEach((row, i) => {
        const cName = row.querySelector(".child-name-input").value.trim() || `Criança ${i + 1}`;
        const cAge = parseInt(row.querySelector(".child-age-select").value, 10) || 4;
        childrenDetails.push({ name: cName, age: cAge });
      });

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
        // Enviar para API local se disponível
        let savedRsvp = null;
        try {
          const apiRes = await fetch("/api/rsvp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          if (apiRes.ok) {
            const apiData = await apiRes.json();
            savedRsvp = apiData.rsvp;
          }
        } catch (apiErr) {
          console.warn("API server inacessível, salvando localmente:", apiErr);
        }

        // Se a API não respondeu, simula vouchers e salva no localStorage
        if (!savedRsvp) {
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          const ticketCode = `NOAH-1-${randomSuffix}`;
          const localVouchers = [];
          let seq = 1;

          payload.childrenDetails.forEach(c => {
            const age = parseInt(c.age, 10);
            if (age >= 0 && age <= 12) {
              localVouchers.push({
                code: `VOUCH-RED-${randomSuffix}-${seq++}`,
                type: "red",
                label: "Voucher Vermelho (Kids 0-12)",
                childName: `${c.name} (${age} anos)`,
                qty: 2,
                redeemed: false
              });
            } else if (age >= 13 && age <= 16) {
              localVouchers.push({
                code: `VOUCH-GOLD-${randomSuffix}-${seq++}`,
                type: "gold",
                label: "Voucher Dourado (Teens 13-16)",
                childName: `${c.name} (${age} anos)`,
                qty: 1,
                redeemed: false
              });
            }
          });

          savedRsvp = {
            id: `rsvp_${Date.now()}`,
            ticketCode: ticketCode,
            ...payload,
            vouchers: localVouchers
          };
        }

        // Salva cópia no localStorage
        saveRsvpLocally(savedRsvp);

        // Se houver Google Apps Script configurado, envia também
        if (typeof PARTY_CONFIG !== "undefined" && PARTY_CONFIG.googleScriptUrl && PARTY_CONFIG.googleScriptUrl.startsWith("http")) {
          sendToGoogleSheets(savedRsvp);
        }

        // Se enviou recado no RSVP, guarda também na Cápsula do Tempo para o Pequeno Xerife
        if (payload.message && payload.message.trim()) {
          const capsuleFromRsvp = {
            author: payload.name,
            message: payload.message.trim(),
            theme: "woody",
            autoApprove: true
          };
          fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(capsuleFromRsvp)
          }).then(() => {
            renderApprovedMessages();
          }).catch(() => {});
        }

        // Celebração & Modal do Ingresso
        playFanfare();
        triggerConfetti(100, 90);

        if (presence === "Confirmado") {
          displayDigitalTicket(savedRsvp);
        } else {
          showNotification("Obrigado por nos avisar! Sentiremos sua falta, parceiro! 🤠");
        }

        form.reset();
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
    const idx = local.findIndex(r => r.ticketCode === rsvp.ticketCode || (r.phone && r.phone === rsvp.phone));
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

// Envia dados para o Google Sheets em segundo plano
function sendToGoogleSheets(rsvp) {
  try {
    const kidsStr = (rsvp.childrenDetails || []).map(k => `${k.name} (${k.age}a)`).join(", ");
    const formData = new FormData();
    formData.append("nome", rsvp.name);
    formData.append("telefone", rsvp.phone);
    formData.append("presenca", rsvp.presence);
    formData.append("adultos", rsvp.adults);
    formData.append("criancas", rsvp.children);
    formData.append("acompanhantes", `${kidsStr ? "Crianças: " + kidsStr + ". " : ""}${rsvp.companions || ""}`);
    formData.append("mensagem", rsvp.message || "");

    fetch(PARTY_CONFIG.googleScriptUrl, {
      method: "POST",
      mode: "no-cors",
      body: formData
    }).catch(e => console.warn("Google Sheets sync:", e));
  } catch (err) {
    console.warn("Falha no Google Sheets sync:", err);
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

  // Renderiza Vouchers de Lembrancinhas
  if (vouchersList) {
    vouchersList.innerHTML = "";
    if (rsvp.vouchers && rsvp.vouchers.length > 0) {
      if (vouchersContainer) vouchersContainer.style.display = "block";
      rsvp.vouchers.forEach(v => {
        const item = document.createElement("div");
        item.className = `voucher-item-pill ${v.type === "red" ? "voucher-item-red" : "voucher-item-gold"}`;
        item.innerHTML = `
          <div>
            <span>${v.type === "red" ? "🔴" : "🟡"} ${v.childName || "Criança"}</span>
            <div style="font-size: 0.72rem; opacity: 0.9;">${v.code} • ${v.qty} lembrancinha(s)</div>
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
  const board = document.getElementById("capsule-messages-board");

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
        author: authorInput.value.trim(),
        message: messageInput.value.trim(),
        theme: "woody",
        autoApprove: true
      };

      try {
        let saved = null;
        try {
          const res = await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newMsg)
          });
          if (res.ok) {
            const data = await res.json();
            saved = data.message;
          }
        } catch (apiErr) {
          console.warn("API offline:", apiErr);
        }

        if (!saved) {
          saved = {
            id: `msg_${Date.now()}`,
            ...newMsg,
            status: "approved",
            createdAt: new Date().toISOString()
          };
        }

        saveMessageLocally(saved);
        renderApprovedMessages();

        playFanfare();
        triggerConfetti(40, 50);
        showNotification("💌 Carta endereçada ao Pequeno Xerife Noah e guardada com amor na Cápsula do Tempo!");

        form.reset();
      } catch (err) {
        console.error("Erro ao salvar mensagem:", err);
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
    const res = await fetch("/api/messages");
    if (res.ok) {
      const data = await res.json();
      messages = data.messages || [];
    }
  } catch (e) {
    messages = JSON.parse(localStorage.getItem("noah_story_messages") || "[]");
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
  const quickBtn = document.getElementById("admin-quick-btn");
  const modal = document.getElementById("admin-modal");
  const loginScreen = document.getElementById("admin-login-screen");
  const dashScreen = document.getElementById("admin-dashboard-screen");
  const loginBtn = document.getElementById("btn-admin-login");
  const passInput = document.getElementById("admin-password-input");
  const loginErr = document.getElementById("admin-login-err");
  const loginCloseBtn = document.getElementById("admin-login-close-btn");
  const dashCloseBtn = document.getElementById("admin-dash-close-btn");

  const closeAdminModal = () => {
    if (modal) modal.classList.remove("open");
  };
  if (loginCloseBtn) loginCloseBtn.addEventListener("click", closeAdminModal);
  if (dashCloseBtn) dashCloseBtn.addEventListener("click", closeAdminModal);

  if (quickBtn && modal) {
    quickBtn.addEventListener("click", () => {
      modal.classList.add("open");
      if (AppState.adminAuthenticated) {
        if (loginScreen) loginScreen.style.display = "none";
        if (dashScreen) dashScreen.style.display = "block";
        refreshAdminData();
      } else {
        if (loginScreen) loginScreen.style.display = "block";
        if (dashScreen) dashScreen.style.display = "none";
      }
    });
  }

  // Login de Administrador (Senha padrão: noah2027)
  if (loginBtn && passInput) {
    loginBtn.addEventListener("click", () => {
      const pass = passInput.value.trim();
      if (pass === "noah2027" || pass === "123456") {
        AppState.adminAuthenticated = true;
        if (loginErr) loginErr.textContent = "";
        passInput.value = "";
        if (loginScreen) loginScreen.style.display = "none";
        if (dashScreen) dashScreen.style.display = "block";
        refreshAdminData();
      } else {
        if (loginErr) loginErr.textContent = "Senha incorreta! Dica: ano da festa";
      }
    });

    passInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") loginBtn.click();
    });
  }

  // Abas do Painel
  const tabBtns = document.querySelectorAll(".admin-tab-btn");
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const targetId = btn.getAttribute("data-tab");
      document.querySelectorAll(".admin-tab-content").forEach(content => {
        content.style.display = content.id === targetId ? "block" : "none";
      });
    });
  });

  // Busca de convidados
  const searchInput = document.getElementById("admin-guest-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      renderAdminGuestsTable(e.target.value.toLowerCase());
    });
  }

  // Validador de Vouchers de Lembrancinhas
  const validateBtn = document.getElementById("btn-validate-voucher");
  const voucherInput = document.getElementById("voucher-code-input");
  const voucherFeedback = document.getElementById("voucher-validation-feedback");

  if (validateBtn && voucherInput) {
    validateBtn.addEventListener("click", async () => {
      const code = voucherInput.value.trim();
      if (!code) return;

      try {
        const res = await fetch("/api/vouchers/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: code })
        });
        const data = await res.json();
        if (data.success) {
          playFanfare();
          triggerConfetti(40, 50);
          if (voucherFeedback) {
            voucherFeedback.style.color = "#15803d";
            voucherFeedback.textContent = `✅ ${data.message}`;
          }
          voucherInput.value = "";
          refreshAdminData();
        } else {
          if (voucherFeedback) {
            voucherFeedback.style.color = "#b91c1c";
            voucherFeedback.textContent = `❌ ${data.message}`;
          }
        }
      } catch (e) {
        if (voucherFeedback) {
          voucherFeedback.style.color = "#b91c1c";
          voucherFeedback.textContent = "Erro ao conectar com servidor.";
        }
      }
    });
  }

  // Download do CSV
  const exportBtn = document.getElementById("btn-export-csv-direct");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      window.location.href = "/api/export-csv";
    });
  }

  // Salvar Script URL do Google Sheets
  const saveScriptBtn = document.getElementById("btn-save-script-url");
  const scriptInput = document.getElementById("admin-script-url-input");
  const scriptStatus = document.getElementById("admin-sheet-save-status");

  if (saveScriptBtn && scriptInput) {
    saveScriptBtn.addEventListener("click", () => {
      const val = scriptInput.value.trim();
      if (val) {
        localStorage.setItem("noah_invite_script_url", val);
        if (typeof PARTY_CONFIG !== "undefined") PARTY_CONFIG.googleScriptUrl = val;
        if (scriptStatus) scriptStatus.textContent = "✅ Link salvo com sucesso no navegador!";
      }
    });
  }
}

async function refreshAdminData() {
  let rsvps = [];
  try {
    const res = await fetch("/api/rsvp");
    if (res.ok) {
      const data = await res.json();
      rsvps = data.rsvps || [];
    }
  } catch (e) {
    rsvps = JSON.parse(localStorage.getItem("noah_story_rsvps") || "[]");
  }

  AppState.rsvps = rsvps;

  // Atualiza métricas
  let confirmedPeople = 0;
  let totalAdults = 0;
  let totalKids = 0;
  let totalTeens = 0;
  let totalFavors = 0;

  rsvps.forEach(r => {
    if (r.presence === "Confirmado") {
      const a = parseInt(r.adults, 10) || 0;
      const k = parseInt(r.children, 10) || 0;
      totalAdults += a;
      confirmedPeople += (a + k);

      (r.childrenDetails || []).forEach(child => {
        const age = parseInt(child.age, 10);
        if (age >= 0 && age <= 12) {
          totalKids++;
          totalFavors += 2;
        } else if (age >= 13 && age <= 16) {
          totalTeens++;
          totalFavors += 1;
        }
      });
    }
  });

  const elTotal = document.getElementById("stat-total-rsvps");
  const elConf = document.getElementById("stat-confirmed-people");
  const elAdults = document.getElementById("stat-adults");
  const elKids = document.getElementById("stat-kids");
  const elTeens = document.getElementById("stat-teens");
  const elFavors = document.getElementById("stat-favors");

  if (elTotal) elTotal.textContent = rsvps.length;
  if (elConf) elConf.textContent = confirmedPeople;
  if (elAdults) elAdults.textContent = totalAdults;
  if (elKids) elKids.textContent = totalKids;
  if (elTeens) elTeens.textContent = totalTeens;
  if (elFavors) elFavors.textContent = totalFavors;

  renderAdminGuestsTable();
  renderAdminVouchersTable();
  renderAdminMessagesList();
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
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 14px;">Nenhum convidado encontrado.</td></tr>`;
    return;
  }

  filtered.forEach(r => {
    const tr = document.createElement("tr");
    const favorsCount = (r.vouchers || []).reduce((acc, v) => acc + (v.qty || 0), 0);
    const isConf = r.presence === "Confirmado";

    tr.innerHTML = `
      <td><strong>${r.ticketCode || "NOAH-1"}</strong></td>
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
      <td>
        <div style="display: flex; gap: 4px;">
          <button type="button" class="btn-view-ticket-admin" style="background: #3b82f6; color: #fff; border: none; padding: 4px 8px; border-radius: 6px; cursor: pointer; font-size: 0.75rem;" title="Ver Ingresso">🎟️</button>
          <button type="button" class="btn-del-rsvp-admin" style="background: #ef4444; color: #fff; border: none; padding: 4px 8px; border-radius: 6px; cursor: pointer; font-size: 0.75rem;" title="Excluir">&times;</button>
        </div>
      </td>
    `;

    tr.querySelector(".btn-view-ticket-admin").addEventListener("click", () => {
      displayDigitalTicket(r);
    });

    tr.querySelector(".btn-del-rsvp-admin").addEventListener("click", async () => {
      if (confirm(`Tem certeza que deseja remover o convidado ${r.name}?`)) {
        try {
          await fetch(`/api/rsvp/${r.id}`, { method: "DELETE" });
          refreshAdminData();
        } catch (e) {
          console.warn("Delete error:", e);
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
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 14px;">Nenhum voucher emitido até o momento.</td></tr>`;
    return;
  }

  allVouchers.forEach(v => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><code>${v.code}</code></td>
      <td>
        <span style="display: inline-block; padding: 2px 6px; border-radius: 6px; font-size: 0.75rem; font-weight: bold; background: ${v.type === "red" ? "#fee2e2; color: #b91c1c" : "#fef3c7; color: #b45309"}">
          ${v.type === "red" ? "Kids (0-12)" : "Teens (13-16)"}
        </span>
      </td>
      <td>
        <div style="font-weight: 600;">${escapeHtml(v.childName || "")}</div>
        <div style="font-size: 0.72rem; color: #64748b;">Resp: ${escapeHtml(v.guestName || "")}</div>
      </td>
      <td><strong>${v.qty}</strong></td>
      <td>
        <span style="font-weight: bold; color: ${v.redeemed ? "#15803d" : "#ea580c"}">
          ${v.redeemed ? "ENTREGUE ✅" : "PENDENTE ⏳"}
        </span>
      </td>
      <td>
        ${!v.redeemed ? `<button type="button" class="btn-redeem-row" style="background: #22c55e; color: #fff; border: none; padding: 3px 8px; border-radius: 6px; cursor: pointer; font-size: 0.75rem;">Dar Baixa</button>` : `<span style="font-size: 0.75rem; color: #64748b;">${v.redeemedAt ? new Date(v.redeemedAt).toLocaleDateString("pt-BR") : "OK"}</span>`}
      </td>
    `;

    const redeemBtn = tr.querySelector(".btn-redeem-row");
    if (redeemBtn) {
      redeemBtn.addEventListener("click", async () => {
        try {
          const res = await fetch("/api/vouchers/redeem", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: v.code })
          });
          if (res.ok) {
            playFanfare();
            refreshAdminData();
          }
        } catch (e) {
          console.warn("Redeem error:", e);
        }
      });
    }

    tbody.appendChild(tr);
  });
}

async function renderAdminMessagesList() {
  const container = document.getElementById("admin-messages-list");
  if (!container) return;

  let messages = [];
  try {
    const res = await fetch("/api/messages?all=1");
    if (res.ok) {
      const data = await res.json();
      messages = data.messages || [];
    }
  } catch (e) {
    messages = JSON.parse(localStorage.getItem("noah_story_messages") || "[]");
  }

  container.innerHTML = "";
  if (messages.length === 0) {
    container.innerHTML = `<p style="font-size: 0.88rem; color: #64748b;">Nenhuma mensagem recebida ainda.</p>`;
    return;
  }

  messages.forEach(m => {
    const item = document.createElement("div");
    item.style.cssText = "background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px; display: flex; justify-content: space-between; align-items: center; gap: 10px;";
    item.innerHTML = `
      <div>
        <div style="font-weight: bold; font-size: 0.9rem;">${escapeHtml(m.author)}</div>
        <div style="font-size: 0.85rem; color: #475569;">"${escapeHtml(m.message)}"</div>
      </div>
      <button type="button" class="btn-del-msg" style="background: #ef4444; color: #fff; border: none; padding: 4px 8px; border-radius: 6px; cursor: pointer; font-size: 0.75rem;">Excluir</button>
    `;

    item.querySelector(".btn-del-msg").addEventListener("click", async () => {
      if (confirm("Deseja apagar este recado?")) {
        try {
          await fetch(`/api/messages/${m.id}`, { method: "DELETE" });
          renderAdminMessagesList();
          renderApprovedMessages();
        } catch (e) {
          console.warn("Delete msg error:", e);
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
