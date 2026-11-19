function NoahSheetPayload(record, kind, revision = record.sheetSync?.revision) {
  if (kind === 'message') {
    return { kind, campaignId: record.campaignId, recordId: record.rsvpId ? 'rsvp-' + record.rsvpId : record.id, revision,
      issuedAt: record.updatedAt || record.createdAt, nome: record.author, mensagem: record.message,
      rsvpId: record.rsvpId || '', origem: record.rsvpId ? 'rsvp' : 'capsule' };
  }
  if (kind === 'hunter') {
    return {
      kind, campaignId: record.campaignId, recordId: record.id, revision,
      nome: record.name, codigoDistintivo: record.code, concluidoEm: record.completedAt,
      rsvpId: record.rsvpId, codigoIngresso: record.ticketCode, encontrados: record.found,
      issuedAt: record.updatedAt || record.completedAt
    };
  }
  const kids = (record.childrenDetails || []).map(child => `${child.name} (${child.age} anos)`).join(', ');
  return {
    kind: 'rsvp', campaignId: record.campaignId, recordId: record.id, revision,
    issuedAt: record.updatedAt || record.createdAt,
    nome: record.name, telefone: record.phone || '', presenca: record.presence,
    adultos: record.adults ?? 0, criancas: record.children ?? 0,
    acompanhantes: [kids, record.companions].filter(Boolean).join(' · '),
    mensagem: record.message || '', codigoIngresso: record.ticketCode,
    detalhesCriancas: JSON.stringify(record.childrenDetails || [])
  };
}

if (typeof module === "object" && module.exports) module.exports = NoahSheetPayload;
