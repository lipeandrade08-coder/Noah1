// A mesma consulta funciona no servidor Node e em hospedagem estática.
const NoahData = (() => {
  async function request(action, values = {}) {
    values = { ...values, campaignId: typeof PARTY_CONFIG !== "undefined" ? PARTY_CONFIG.campaignId : undefined };
    let response;
    try {
      response = await fetch("/api/invite-data", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, action }), signal: AbortSignal.timeout(20000)
      });
    } catch { /* A hospedagem estática usa o Apps Script diretamente. */ }
    if (response && response.status !== 404 && response.status !== 405) {
      let answer;
      try { answer = await response.json(); } catch { /* Uma rota estática pode devolver HTML. */ }
      if (typeof answer?.success === "boolean") {
        if (!response.ok || !answer.success) throw new Error(answer.message || "Não foi possível carregar a planilha.");
        return answer;
      }
      if (!response.ok) throw new Error("O servidor não confirmou a consulta.");
    }
    const endpoint = typeof PARTY_CONFIG !== "undefined" && PARTY_CONFIG.googleScriptUrl;
    if (!endpoint) throw new Error("A integração com a planilha não está configurada.");
    const google = await fetch(endpoint, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...values, action }), signal: AbortSignal.timeout(20000)
    });
    let answer;
    try { answer = await google.json(); } catch { throw new Error("A planilha não confirmou a consulta. Confira a implantação do Apps Script."); }
    if (!google.ok || answer.result !== "success") throw new Error(answer.error || "A planilha não confirmou a consulta.");
    return answer;
  }
  return { request };
})();
