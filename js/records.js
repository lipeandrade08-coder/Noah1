// Regras compartilhadas pelo painel e pelo servidor, sem depender do navegador.
const NoahRecords = (() => {
  function vouchers(record, deliveries = []) {
    if (!record.ticketCode || record.presence !== "Confirmado") return [];
    let sequence = 1;
    return (record.childrenDetails || []).flatMap(child => {
      if (child.age === "" || child.age === null || child.age === undefined) return [];
      const age = Number(child.age);
      if (!Number.isInteger(age) || age < 0 || age > 17) return [];
      const type = age <= 12 ? "pink" : "blue";
      // Preserve os códigos já emitidos e as baixas registradas antes da troca de cores.
      const code = `VOUCH-${age <= 12 ? "RED" : "GOLD"}-${record.ticketCode.replace("NOAH-1-", "")}-${sequence++}`;
      const saved = deliveries.find(item => item.code === code) || (record.vouchers || []).find(item => item.code === code);
      return [{ code, type, age, label: age <= 12 ? "Criança (0 a 12 anos)" : "Pré-adolescente (13 a 17 anos)",
        childName: `${child.name || "Criança"} (${age} anos)`, qty: age <= 12 ? 2 : 1,
        redeemed: Boolean(saved?.redeemed), redeemedAt: saved?.redeemedAt || null }];
    });
  }

  function dashboard(data) {
    if (!Array.isArray(data.rsvps) || !Array.isArray(data.messages)) throw new Error("O painel recebeu dados incompletos.");
    const rsvps = data.rsvps.map(record => {
      const normalized = { ...record, adults: Math.max(0, Math.floor(Number(record.adults) || 0)),
        children: Math.max(0, Math.floor(Number(record.children) || 0)),
        childrenDetails: Array.isArray(record.childrenDetails) ? record.childrenDetails : [] };
      return { ...normalized, vouchers: vouchers(normalized, data.deliveries) };
    });
    const messages = data.messages.filter(message => !["archived", "deleted"].includes(message.status));
    const summary = { responses: rsvps.length, people: 0, adults: 0, children: 0, kids: 0, teens: 0,
      favors: 0, missingAges: 0, badges: 0, messages: messages.length, declined: 0 };
    for (const record of rsvps) {
      if (record.badgeStatus === "Sim") summary.badges++;
      if (record.presence !== "Confirmado") { summary.declined++; continue; }
      const adults = Math.max(0, Number(record.adults) || 0);
      const children = Math.max(0, Number(record.children) || 0);
      summary.adults += adults;
      summary.children += children;
      summary.people += adults + children;
      let known = 0;
      for (const child of record.childrenDetails) {
        if (child.age === "" || child.age === null || child.age === undefined) continue;
        const age = Number(child.age);
        if (!Number.isInteger(age) || age < 0 || age > 17) continue;
        known++;
        if (age <= 12) { summary.kids++; summary.favors += 2; }
        else { summary.teens++; summary.favors++; }
      }
      summary.missingAges += Math.max(0, children - known);
    }
    return { ...data, rsvps, messages, summary };
  }

  function messages(registrations, stored) {
    const all = stored.slice();
    for (const record of registrations) {
      if (!record.message?.trim() || all.some(item => item.rsvpId === record.id ||
          (item.author === record.name && item.message === record.message.trim()))) continue;
      all.push({ id: "rsvp-" + record.id, rsvpId: record.id, author: record.name, message: record.message.trim(),
        recipient: "Pequeno Xerife Noah", source: "rsvp", status: "approved", createdAt: record.createdAt });
    }
    return all.filter(item => !["archived", "deleted"].includes(item.status))
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }
  return { dashboard, vouchers, messages };
})();
if (typeof module === "object" && module.exports) module.exports = NoahRecords;
