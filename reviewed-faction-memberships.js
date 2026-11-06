// Explicit, source-linked local review only. Faction-panel backgrounds and
// character names never infer memberships. Personal evidence stays in the
// selected private handoff, not this module or the public source catalog.
const normalize = value => String(value || '').normalize('NFKC').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const factionKey = value => normalize(value).replace(/^the /, '');
const isMembership = row => row.effectRole === 'member' && row.mechanicId?.startsWith('faction_');

/** Applies already reviewed complete exact-variant faction lists to the cloned
 * working catalogs. Validate the entire batch before changing those clones. */
export function applyReviewedFactionMemberships({reviews, mappings, guide, strategy, baseMembershipEvidence = []}) {
  if (reviews == null) return {reviews: [], evidence: structuredClone(baseMembershipEvidence)};
  if (!Array.isArray(reviews)) throw Error('Faction membership reviews must be an array.');
  const seen = new Set(), reviewIds = new Set();
  const plans = reviews.map(row => {
    if (!row.review_id || reviewIds.has(row.review_id) || !/^\d{4}-\d{2}-\d{2}$/.test(row.review_date || '') || row.membership_scope !== 'complete_exact_variant') throw Error('Faction review needs a unique ID, date and complete exact-variant scope.');
    const matches = mappings.filter(mapping => mapping.groupId === row.capture_group_id && mapping.variantId === row.variant_id && normalize(mapping.name) === normalize(`${row.champion} — ${row.exact_variant}`));
    if (matches.length !== 1 || seen.has(row.variant_id)) throw Error('Faction review has a missing, mismatched or duplicate exact variant.');
    const champion = guide.champions.find(candidate => candidate.id === row.variant_id);
    if (!champion) throw Error('Faction review champion is absent from the working catalog.');
    if (!Array.isArray(row.factions) || row.factions.length < 1 || row.factions.length > 2 || new Set(row.factions.map(factionKey)).size !== row.factions.length) throw Error('Faction review needs one or two unique named factions.');
    const factions = row.factions.map(name => {
      const found = guide.factions.filter(faction => factionKey(faction.name) === factionKey(name));
      if (found.length !== 1) throw Error(`Faction review has no unique catalog identity for ${name}.`);
      return found[0];
    });
    if (!Array.isArray(row.evidence) || !row.evidence.length || row.evidence.some(source => !source.claim || !(
      source.kind === 'screenshot' && source.file_name && (source.library_file_id || /^https:\/\//.test(source.source_url || '')) ||
      source.kind === 'official' && /^https:\/\//.test(source.source_url || '') ||
      source.kind === 'user_confirmation' && source.message_id
    ))) throw Error('Faction review needs complete screenshot, official or user-confirmation provenance.');
    // A bare approval is not a substitute for the game evidence being reviewed.
    if (!row.evidence.some(source => ['screenshot', 'official'].includes(source.kind))) throw Error('Faction review has no screenshot or official game evidence.');
    seen.add(row.variant_id); reviewIds.add(row.review_id);
    const evidence = row.evidence.map(({local_path, ...source}) => structuredClone(source));
    const before = [...champion.factions];
    const after = factions.map(faction => faction.name);
    const provenanceRef = `faction-review:${row.review_date}:${row.review_id}`;
    return {row, champion, factions, evidence, before, after, provenanceRef};
  });
  const updatedEvidence = structuredClone(baseMembershipEvidence.filter(row => !seen.has(row.variantId)));
  const audit = [];
  for (const plan of plans) {
    const {row, champion, factions, evidence, before, after, provenanceRef} = plan;
    champion.factions = after;
    champion.factionMembershipReview = {reviewedOn: row.review_date, membershipScope: row.membership_scope, verificationNote: row.verification_note || null, provenanceRef, evidence};
    for (const faction of guide.factions) {
      const belongs = factions.includes(faction);
      if (!belongs) faction.memberVariantIds = faction.memberVariantIds.filter(id => id !== champion.id);
      else if (!faction.memberVariantIds.includes(champion.id)) faction.memberVariantIds.push(champion.id);
    }
    const replacedFacts = strategy.championFacts.filter(fact => fact.variantId === champion.id && isMembership(fact));
    strategy.championFacts = strategy.championFacts.filter(fact => !(fact.variantId === champion.id && isMembership(fact)));
    for (const faction of factions) {
      const mechanicId = 'faction_' + factionKey(faction.name).replaceAll(' ', '_');
      if (!strategy.mechanics.some(mechanic => mechanic.id === mechanicId)) strategy.mechanics.push({id: mechanicId, name: faction.name, category: 'faction'});
      const fact = {id: `${provenanceRef}:${faction.id}`, variantId: champion.id, mechanicId, effectRole: 'member', context: 'faction', factText: `${champion.name} belongs to ${faction.name}.`, evidenceCategory: 'verified_fact', reviewStatus: 'reviewed', confidence: 1, sourceId: null, provenanceRef, reviewedOn: row.review_date, sourceFilenames: evidence.filter(source => source.kind === 'screenshot').map(source => source.file_name), sourceEvidence: structuredClone(evidence)};
      strategy.championFacts.push(fact);
      updatedEvidence.push(structuredClone(fact));
    }
    audit.push({variantId: champion.id, groupId: row.capture_group_id, name: champion.name, before, after, added: after.filter(name => !before.includes(name)), removed: before.filter(name => !after.includes(name)), provenanceRef, reviewedOn: row.review_date, verificationNote: row.verification_note || null, evidence, replacedFacts, historicalMembershipEvidence: structuredClone(baseMembershipEvidence.filter(fact => fact.variantId === champion.id))});
  }
  return {reviews: audit, evidence: updatedEvidence};
}
