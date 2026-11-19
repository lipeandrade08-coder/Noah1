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
    const items = read().filter(item => !(item.kind === kind && item.record.id === record.id));
    items.push({ kind, record, revision: createId() });
    write(items);
  }

  async function deliver(item) {
    let response;
    let recognizedServer = false;
    try {
      response = await fetch(item.kind === "hunter" ? "/api/hunters" : "/api/rsvp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.record), signal: AbortSignal.timeout(12000)
      });
      if (response.ok) {
        const answer = await response.json();
        recognizedServer = typeof answer.success === "boolean";
        if (answer.success) return answer;
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
    record.sheetSync = { status: "synced", revision: item.revision };
    return { success: true, rsvp: record, hunter: record };
  }

  async function flush() {
    if (running) return running;
    running = (async () => {
      for (const item of read()) {
        try {
          const answer = await deliver(item);
          const record = item.kind === "hunter" ? answer.hunter : answer.rsvp;
          if (!record || (record.id !== item.record.id && item.kind === "hunter")) throw new Error("Confirmação incompleta");
          const current = read();
          if (!current.some(entry => entry.revision === item.revision)) continue;
          if (item.kind === "rsvp") saveRsvpLocally(record);
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
      void flush();
    } catch (error) { console.warn("Não foi possível recuperar a fila local:", error); }
    setInterval(() => { if (navigator.onLine) void flush(); }, 20000);
  });
  window.addEventListener("online", () => void flush());
  return { enqueue, flush, pending, createId };
})();
