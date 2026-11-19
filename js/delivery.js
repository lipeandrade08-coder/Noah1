// Fila persistente antes do primeiro envio. Só remove itens confirmados pelo servidor ou pela planilha.
const NoahDelivery = (() => {
  const key = "noah_delivery_queue_v2";
  let running;
  const read = () => JSON.parse(localStorage.getItem(key) || "[]");
  const write = items => localStorage.setItem(key, JSON.stringify(items));

  function createId() {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, "0")).join("");
  }

  function enqueue(kind, record) {
    record = { ...record, campaignId: typeof PARTY_CONFIG !== "undefined" ? PARTY_CONFIG.campaignId : record.campaignId };
    if (kind === "message" && record.rsvpId) record = { ...record, id: "rsvp-" + record.rsvpId };
    const items = read().filter(item => !(item.kind === kind && item.record.id === record.id));
    items.push({ kind, record, revision: createId() });
    write(items);
  }

  async function deliver(item) {
    let response;
    let recognizedServer = false;
    try {
      const paths = { hunter: "/api/hunters", rsvp: "/api/rsvp", message: "/api/messages" };
      response = await fetch(paths[item.kind], {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.record), signal: AbortSignal.timeout(12000)
      });
      if (response.ok) {
        const answer = await response.json();
        recognizedServer = typeof answer.success === "boolean";
        if (answer.success) {
          if (["message", "rsvp"].includes(item.kind) && !["sheet", "server"].includes(answer.destination)) {
            recognizedServer = false;
            throw new Error("O servidor antigo não confirmou o destino do recado.");
          }
          const saved = item.kind === "rsvp" ? answer.rsvp : answer.message;
          if (["message", "rsvp"].includes(item.kind) && answer.destination === "sheet" && saved?.sheetSync?.status !== "synced") {
            throw new Error("O registro está no servidor e aguarda confirmação na planilha.");
          }
          return answer;
        }
        throw new Error(answer.message || "Envio pendente");
      }
      if (response.status !== 404 && response.status !== 405) throw new Error("O servidor não confirmou o envio.");
    } catch (error) {
      if (recognizedServer || (response && !response.ok && response.status !== 404 && response.status !== 405)) throw error;
    }

    // Mantém a hospedagem estática compatível, com confirmação legível do Google.
    const endpoint = typeof PARTY_CONFIG !== "undefined" && PARTY_CONFIG.googleScriptUrl;
    if (!endpoint) throw new Error("Sem conexão. O registro continua guardado neste aparelho.");
    const record = { ...item.record };
    if (item.kind === "hunter") record.code = "ALIEN-" + record.id.replace(/-/g, "").slice(0, 12).toUpperCase();
    const payload = NoahSheetPayload(record, item.kind, item.revision);
    const googleResponse = await fetch(endpoint, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(15000)
    });
    const result = await googleResponse.json();
    if (!googleResponse.ok || result.result !== "success" || result.recordId !== record.id || result.revision !== item.revision) {
      throw new Error(result.error || "A planilha não confirmou o registro.");
    }
    if (item.kind === "hunter") {
      if (!result.rsvpId || result.rsvpId !== record.rsvpId || !result.code) {
        throw new Error("A planilha não confirmou o vínculo com o formulário.");
      }
      record.code = result.code;
    }
    record.sheetSync = { status: "synced", revision: item.revision };
    return { success: true, rsvp: record, hunter: record, message: record, destination: "sheet" };
  }

  async function flush() {
    if (running) return running;
    running = (async () => {
      for (const item of read()) {
        try {
          const answer = await deliver(item);
          const record = item.kind === "hunter" ? answer.hunter : item.kind === "message" ? answer.message : answer.rsvp;
          if (!record) throw new Error("Confirmação incompleta");
          if (item.kind === "hunter" && (record.rsvpId !== item.record.rsvpId ||
              record.ticketCode !== item.record.ticketCode || record.sheetSync?.status !== "synced")) {
            throw new Error("O distintivo aguarda o formulário e a gravação na planilha.");
          }
          if (item.kind === "rsvp") record.deliveryConfirmedAt = new Date().toISOString();
          if (item.kind === "message") {
            record.deliveryConfirmedAt = new Date().toISOString();
            record.destination = answer.destination || "sheet";
          }
          const current = read();
          if (!current.some(entry => entry.revision === item.revision)) continue;
          if (item.kind === "rsvp") saveRsvpLocally(record);
          else if (item.kind === "message") saveMessageLocally(record);
          else localStorage.setItem("noah_alien_badge_v2", JSON.stringify(record));
          write(current.filter(entry => entry.revision !== item.revision));
          document.dispatchEvent(new CustomEvent("noah:delivered", { detail: { kind: item.kind, record } }));
        } catch (error) {
          console.warn("Registro mantido para nova tentativa:", error.message);
        }
      }
    })();
    try { await running; } finally { running = null; }
  }

  function pending(kind, id) { return read().some(item => item.kind === kind && item.record.id === id); }

  document.addEventListener("DOMContentLoaded", () => {
    // Recupera também cópias de convidados criadas por versões anteriores.
    try {
      const previous = JSON.parse(localStorage.getItem("noah_story_rsvps") || "[]");
      if (!localStorage.getItem("noah_delivery_migrated_v2")) {
        previous.forEach(record => { if (record.id && !record.id.startsWith("rsvp_sample_")) enqueue("rsvp", record); });
        localStorage.setItem("noah_delivery_migrated_v2", "1");
      }
      if (!localStorage.getItem("noah_messages_migrated_v1")) {
        const messages = JSON.parse(localStorage.getItem("noah_story_messages") || "[]");
        messages.filter(message => message.author && message.message && !["archived", "deleted"].includes(message.status))
          .forEach(message => enqueue("message", { ...message, id: message.id || createId() }));
        localStorage.setItem("noah_messages_migrated_v1", "1");
      }
      void flush();
    } catch (error) { console.warn("Não foi possível recuperar a fila local:", error); }
    setInterval(() => { if (navigator.onLine) void flush(); }, 20000);
  });
  window.addEventListener("online", () => void flush());
  return { enqueue, flush, pending, createId };
})();
