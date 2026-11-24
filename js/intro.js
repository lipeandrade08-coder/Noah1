(() => {
  const intro = document.getElementById("cinematic-intro");
  const openChest = document.getElementById("btn-open-chest");
  const skip = document.getElementById("btn-skip-intro");
  const stage = document.getElementById("toy-chest-stage");
  const toys = document.getElementById("jumping-toys-layer");
  const revealedPanel = document.getElementById("intro-revealed-panel");
  const startAdventure = document.getElementById("btn-start-adventure");
  const title = intro.querySelector(".intro-title");
  const themeAudio = document.getElementById("theme-audio");
  const confettiLayer = document.getElementById("intro-confetti");
  const boxOpening = stage.querySelector(".cardboard-opening");
  const reducedMotion = window.NoahMotion;
  let revealTimer;
  let confettiTimer;
  let closeTimer;
  let sparkTimer;
  let sparkInterval;
  let closingQueued = false;

  function stopClosedSparks() {
    clearTimeout(sparkTimer);
    clearInterval(sparkInterval);
  }

  function startOpeningAudio() {
    if (window.startThemeMusic) {
      window.unlockMobileAudio();
      window.startThemeMusic();
      return;
    }

    // Mantém o primeiro toque válido para o áudio enquanto o restante do convite carrega.
    themeAudio.volume = 0.65;
    themeAudio.play().catch(() => {});
  }

  function launchConfetti(multiplier = 1) {
    if (reducedMotion.matches) return;

    const opening = boxOpening.getBoundingClientRect();
    const colors = ["#ffe167", "#ff686a", "#75e0ff", "#9bed92", "#c49cfd", "#fff4ca"];
    const width = intro.clientWidth;
    const spread = Math.min(width * 0.56, 420);
    const baseCount = width < 640 ? 48 : 72;
    const count = Math.max(6, Math.round(baseCount * multiplier));
    const pieces = document.createDocumentFragment();
    confettiLayer.style.setProperty("--confetti-x", `${opening.left + opening.width / 2}px`);
    confettiLayer.style.setProperty("--confetti-y", `${opening.top + opening.height / 2}px`);

    for (let index = 0; index < count; index++) {
      const piece = document.createElement("span");
      const star = index % 5 === 0;
      const direction = index % 2 === 0 ? -1 : 1;
      const distance = direction * spread * (0.32 + Math.random() * 0.68);
      const rise = 70 + Math.random() * Math.min(180, intro.clientHeight * 0.22);
      piece.className = star ? "intro-confetti-piece confetti-star" : "intro-confetti-piece";
      const motion = {
        "--color": star ? "#ffe167" : colors[index % colors.length],
        "--size": `${star ? 10 + Math.random() * 9 : 5 + Math.random() * 5}px`,
        "--crest-x": `${distance * 0.75}px`,
        "--crest-y": `${-rise}px`,
        "--landing-x": `${distance}px`,
        "--landing-y": `${80 + Math.random() * 240}px`,
        "--spin": `${direction * (160 + Math.random() * 370)}deg`,
        "--flight-time": `${1.3 + Math.random() * 1.05}s`,
        "--delay": `${Math.random() * 0.26}s`,
      };
      for (const [property, value] of Object.entries(motion)) piece.style.setProperty(property, value);
      piece.addEventListener("animationend", () => piece.remove(), { once: true });
      pieces.append(piece);
    }
    confettiLayer.append(pieces);
  }

  openChest.addEventListener("click", () => {
    stopClosedSparks();
    startOpeningAudio();
    window.playTone?.(440, 0.24, "triangle");
    stage.classList.add("opened");
    intro.classList.add("chest-opened");
    openChest.hidden = true;
    toys.removeAttribute("aria-hidden");
    revealedPanel.hidden = false;

    const reveal = () => {
      title.textContent = "Há um novo xerife na cidade!";
      title.classList.add("is-revealed");
      if (document.activeElement !== skip) startAdventure.focus({ preventScroll: true });
      if (!reducedMotion.matches) launchConfetti(0.65);
      window.playFanfare?.();
    };
    if (reducedMotion.matches) {
      reveal();
    } else {
      confettiTimer = setTimeout(() => launchConfetti(1), 240);
      revealTimer = setTimeout(reveal, 1250);
    }
  });

  function triggerBlocksWave() {
    if (reducedMotion.matches) return;
    const blocks = document.querySelectorAll(".toy-blocks-shelf .interactive-block");
    blocks.forEach((block, index) => {
      setTimeout(() => {
        block.classList.add("bounce");
        setTimeout(() => block.classList.remove("bounce"), 260);
      }, 280 + index * 90);
    });
  }

  function showInvitation() {
    const hero = document.getElementById("convite");
    if (!hero) {
      if (!closingQueued) {
        closingQueued = true;
        document.addEventListener("DOMContentLoaded", showInvitation, { once: true });
      }
      return;
    }

    if (intro.classList.contains("is-closing") || !intro.open) return;

    const finalizeClose = () => {
      intro.classList.remove("is-closing");
      if (intro.open) intro.close();
      hero.scrollIntoView({ block: "start" });
      hero.focus({ preventScroll: true });
    };

    document.body.classList.add("invitation-entered");
    triggerBlocksWave();

    if (reducedMotion.matches) {
      finalizeClose();
      return;
    }

    intro.classList.add("is-closing");
    window.triggerConfetti?.(90, 75);
    clearTimeout(closeTimer);
    closeTimer = setTimeout(finalizeClose, 520);
  }

  function enterInvitation() {
    if (intro.classList.contains("is-closing") || !intro.open) return;
    stopClosedSparks();
    clearTimeout(revealTimer);
    clearTimeout(confettiTimer);
    confettiLayer.replaceChildren();
    startOpeningAudio();
    showInvitation();
  }

  skip.addEventListener("click", enterInvitation);
  startAdventure.addEventListener("click", enterInvitation);
  intro.addEventListener("cancel", event => {
    event.preventDefault();
    enterInvitation();
  });
  intro.showModal();

  function startClosedSparks() {
    stopClosedSparks();
    if (reducedMotion.matches) return;
    sparkTimer = setTimeout(() => {
      if (stage.classList.contains("opened") || !intro.open || intro.classList.contains("is-closing")) return;
      if (!document.hidden) launchConfetti(0.16);
      sparkInterval = setInterval(() => {
        if (stage.classList.contains("opened") || !intro.open || intro.classList.contains("is-closing")) {
          stopClosedSparks();
          return;
        }
        if (!document.hidden) launchConfetti(0.16);
      }, 1750);
    }, 1170);
  }
  reducedMotion.addEventListener("change", () => {
    stopClosedSparks();
    if (reducedMotion.matches) confettiLayer.replaceChildren();
    else if (stage.classList.contains("opened") && intro.open) launchConfetti(0.65);
    else startClosedSparks();
  });
  startClosedSparks();
})();
