function initAlienHuntMinigame() {
  const stateKey = "noah_alien_hunt_v2";
  const badgeKey = "noah_alien_badge_v2";
  const briefing = document.getElementById("hunt-briefing");
  const victory = document.getElementById("alien-win-modal");
  const hud = document.getElementById("alien-hud-tracker");
  const status = document.getElementById("hunter-save-status");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const groups = [
    [".western-header", ".wanted-poster-container", ".family-full-adventure-card"],
    [".space-header", ".space-countdown-container", ".space-mission-details"],
    [".quiz-header", ".quiz-section", ".forbidden-button-section"],
    [".timeline-header", ".album-hint-badge", ".timeline-section"],
    [".capsule-letter-header", ".gift-guide-section", ".capsule-header"]
  ];
  let state;
  let badge;
  let registration;
  let requestingBadge = false;
  try {
    state = JSON.parse(localStorage.getItem(stateKey) || "null");
    badge = JSON.parse(localStorage.getItem(badgeKey) || "null");
  } catch {}
  if (!state || !Array.isArray(state.places) || state.places.length !== 5) {
    state = {
      id: NoahDelivery.createId(), found: [], started: false, announced: false,
      places: groups.map(group => ({
        selector: group[Math.floor(Math.random() * group.length)],
        side: Math.random() > 0.5 ? "right" : "left",
        top: 15 + Math.floor(Math.random() * 65), phase: Math.floor(Math.random() * 17000)
      }))
    };
  }
  state.found = [...new Set(state.found || [])].filter(id => Number.isInteger(id) && id >= 1 && id <= 5);
  AppState.aliensFound = new Set(state.found);

  function persist() {
    try { localStorage.setItem(stateKey, JSON.stringify(state)); }
    catch { status.textContent = "O navegador não permite guardar o progresso. Salve seu distintivo ao concluir."; }
  }
  function updateCounter() {
    document.getElementById("aliens-counter-text").textContent = state.found.length;
    hud.setAttribute("aria-label", state.found.length === 5 ? "Abrir meu distintivo" : `Caça aos aliens, ${state.found.length} de 5. Abrir aviso.`);
  }
  function registeredGuest() {
    try {
      const records = JSON.parse(localStorage.getItem("noah_story_rsvps") || "[]").filter(record =>
        record.id && record.ticketCode && record.name && record.phone &&
        !record.id.startsWith("rsvp_sample_") && !NoahDelivery.pending("rsvp", record.id) &&
        (record.deliveryConfirmedAt || record.sheetSync));
      records.sort((a, b) => Date.parse(b.submittedAt || b.updatedAt || b.createdAt) - Date.parse(a.submittedAt || a.updatedAt || a.createdAt));
      return records.find(record => record.id === (state.rsvpId || badge?.rsvpId)) || records[0];
    } catch { return null; }
  }
  registration = registeredGuest();

  function badgeReady() {
    return Boolean(registration && badge?.code && badge.rsvpId === registration.id &&
      badge.ticketCode === registration.ticketCode && badge.sheetSync?.status === "synced");
  }

  function showVictory() {
    renderBadge();
    if (!victory.open) victory.showModal();
    if (registration && !badgeReady()) void requestBadge();
  }

  const targets = state.places.map((place, index) => {
    const parent = document.querySelector(place.selector) || document.querySelector(groups[index][0]);
    parent.classList.add("hunt-hideout");
    const alien = document.createElement("button");
    alien.type = "button";
    alien.className = "hunt-target";
    alien.dataset.huntId = index + 1;
    alien.style.setProperty("--hunt-top", place.top + "%");
    alien.style.setProperty("--hunt-side", place.side === "left" ? "3px" : "calc(100% - 47px)");
    const img = document.createElement("img");
    img.src = index % 2 ? "assets/images/alien-face.webp" : "assets/images/alien-wave.webp";
    img.alt = "";
    alien.append(img);
    alien.setAttribute("aria-label", "Alienígena escondido");
    alien.addEventListener("click", event => {
      event.stopPropagation();
      // Cada toque reproduz a voz, mesmo quando este alien já foi encontrado.
      playAlienOoooh();
      const id = index + 1;
      if (state.found.includes(id)) return;
      state.found.push(id);
      AppState.aliensFound.add(id);
      persist();
      updateCounter();
      alien.dataset.found = "true";
      alien.setAttribute("aria-label", "Alienígena encontrado, ouvir novamente");
      showNotification(`Alien encontrado! ${state.found.length} de 5.`);
      if (state.found.length === 5) {
        state.completedAt = new Date().toISOString();
        persist();
        triggerConfetti(100, 80);
        showVictory();
      }
    });
    parent.append(alien);
    return alien;
  });

  function updateAppearances() {
    targets.forEach((alien, index) => {
      const found = state.found.includes(index + 1);
      // Aparições estáveis por janela de tempo, com fases diferentes em cada aparelho.
      const visible = state.started && (found || reducedMotion.matches || (Date.now() + state.places[index].phase) % 17000 < 3500);
      alien.dataset.visible = String(visible);
      alien.dataset.found = String(found);
      alien.disabled = !visible;
      alien.tabIndex = visible ? 0 : -1;
    });
  }
  setInterval(() => { if (!document.hidden) updateAppearances(); }, 500);
  reducedMotion.addEventListener("change", updateAppearances);
  updateAppearances();
  updateCounter();
  persist();

  function showBriefing() {
    state.announced = true;
    persist();
    briefing.showModal();
  }
  hud.addEventListener("click", () => state.found.length === 5 ? showVictory() : showBriefing());
  document.getElementById("hunt-start").addEventListener("click", () => {
    state.started = true;
    persist();
    briefing.close();
    updateAppearances();
  });
  function surprise() {
    if (state.announced || state.found.length === 5) return;
    if (document.hidden || document.querySelector("dialog[open], .modal-backdrop.open")) {
      setTimeout(surprise, 4000);
      return;
    }
    showBriefing();
  }
  const intro = document.getElementById("cinematic-intro");
  if (intro.open) intro.addEventListener("close", () => setTimeout(surprise, 6500), { once: true });
  else setTimeout(surprise, 6500);

  // Os demais aliens continuam interativos sem contar como um achado.
  document.querySelectorAll('.toy-alien, .footer-alien-img, .hunt-briefing-alien').forEach(alien => {
    alien.classList.add("alien-voice");
    alien.setAttribute("role", "button");
    alien.tabIndex = 0;
    alien.setAttribute("aria-label", "Ouvir o alienígena");
    alien.addEventListener("click", () => playAlienOoooh());
    alien.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        playAlienOoooh();
      }
    });
  });

  function renderBadge() {
    const ready = badgeReady();
    document.getElementById("hunter-form-gate").hidden = Boolean(registration);
    document.getElementById("hunter-earned").hidden = !ready;
    document.getElementById("hunter-badge-art").hidden = !ready;
    document.getElementById("hunter-download").disabled = !ready;
    document.getElementById("hunter-share").disabled = !ready;
    if (!registration) {
      status.textContent = "A caça está concluída e salva. Preencha o formulário para liberar seu distintivo.";
      return;
    }
    if (!ready) {
      status.textContent = "Seu formulário foi recebido. A conquista aguarda confirmação na planilha para liberar o distintivo.";
      return;
    }
    document.getElementById("hunter-owner").textContent = badge.name;
    document.getElementById("hunter-code").textContent = badge.code;
    status.textContent = "Distintivo registrado como Sim na planilha. Salve uma cópia para apresentar na festa.";
  }

  async function requestBadge() {
    if (!registration || state.found.length !== 5 || requestingBadge || badgeReady()) return;
    requestingBadge = true;
    try {
      const claim = {
        id: state.id, name: registration.name, rsvpId: registration.id,
        ticketCode: registration.ticketCode, found: state.found, completedAt: state.completedAt
      };
      state.rsvpId = registration.id;
      persist();
      NoahDelivery.enqueue("hunter", claim);
      badge = { ...claim, code: null };
      localStorage.setItem(badgeKey, JSON.stringify(badge));
      renderBadge();
      await NoahDelivery.flush();
      // Um formulário ainda em entrega pode ter iniciado a rodada anterior da fila.
      if (NoahDelivery.pending("hunter", state.id)) await NoahDelivery.flush();
    } catch {
      status.textContent = "A conquista aguarda envio. Mantenha o convite aberto ou reabra neste aparelho para tentar novamente.";
    } finally { requestingBadge = false; }
  }

  document.getElementById("hunter-go-form").addEventListener("click", () => {
    victory.close();
    const section = document.getElementById("rsvp-section");
    section.scrollIntoView({ block: "start" });
    document.getElementById("guest-name").focus({ preventScroll: true });
  });
  document.getElementById("hunter-ticket").addEventListener("click", () => {
    if (!registration) return;
    victory.close();
    displayDigitalTicket(registration);
  });

  document.addEventListener("noah:delivered", event => {
    if (event.detail.kind === "rsvp") {
      registration = registeredGuest();
      renderBadge();
      if (state.found.length === 5) void requestBadge();
      return;
    }
    if (event.detail.kind !== "hunter" || event.detail.record.rsvpId !== registration?.id ||
        event.detail.record.ticketCode !== registration.ticketCode) return;
    badge = event.detail.record;
    renderBadge();
    if (state.found.length === 5 && badgeReady()) {
      document.getElementById("ticket-modal").classList.remove("open");
      if (!victory.open) victory.showModal();
    }
  });
  if (state.found.length === 5 && registration && !badgeReady()) void requestBadge();

  async function badgeFile() {
    if (!badgeReady()) throw new Error("Conclua o formulário para liberar o distintivo.");
    const image = new Image();
    image.src = "assets/images/alien-hunter-badge.webp";
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1500;
    const context = canvas.getContext("2d");
    context.fillStyle = "#102c30";
    context.fillRect(0, 0, 1200, 1500);
    context.strokeStyle = "#edcb64";
    context.lineWidth = 6;
    context.strokeRect(35, 35, 1130, 1430);
    context.textAlign = "center";
    context.fillStyle = "#ffdf78";
    context.font = "bold 68px Arial";
    context.fillText("Caçadores de aliens", 600, 140, 1080);
    context.fillStyle = "#dceee6";
    context.font = "30px Arial";
    context.fillText("MISSÃO SECRETA · NOAH STORY 1", 600, 200);
    const height = image.height * (850 / image.width);
    context.drawImage(image, 175, 265, 850, height);
    context.fillStyle = "#fff6d1";
    context.font = "bold 54px Arial";
    context.fillText(badge.name, 600, 1140, 1040);
    context.font = "32px monospace";
    context.fillText(badge.code, 600, 1210);
    context.fillStyle = "#dceee6";
    context.font = "32px Arial";
    context.fillText("Apresente na festa para receber uma surpresa!", 600, 1310, 1050);
    context.fillText("16 de janeiro de 2027 · 1º aninho do Noah", 600, 1370, 1050);
    return new Promise((resolve, reject) => canvas.toBlob(blob => {
      if (blob) resolve(new File([blob], "cacadores-de-aliens-" + badge.code + ".png", { type: "image/png" }));
      else reject(new Error("Falha ao gerar imagem"));
    }, "image/png"));
  }
  async function saveBadge(share) {
    try {
      const file = await badgeFile();
      if (share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Caçadores de aliens" });
        return;
      }
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      status.textContent = "Imagem preparada. No celular, escolha Salvar em Arquivos ou Salvar Imagem.";
    } catch (error) {
      if (error.name !== "AbortError") status.textContent = "Não foi possível salvar agora. Tente novamente.";
    }
  }
  document.getElementById("hunter-download").addEventListener("click", () => void saveBadge(false));
  document.getElementById("hunter-share").addEventListener("click", () => void saveBadge(true));
}
