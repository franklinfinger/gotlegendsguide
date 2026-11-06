import { integrateVerifiedHandoff } from '../../verified-handoff.js';
import { catalogIdentities } from '../../champion-identities.js';

export const EVIDENCE_FORMAT = 'got-reviewed-evidence-v1';
export const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;
const normalizeIdentity = value => String(value || '').normalize('NFKC').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const fullIdentity = row => normalizeIdentity(`${row.championName} — ${row.exactVariant}`);
const byteLength = value => new TextEncoder().encode(JSON.stringify(value)).length;
const forbidden = /^(?:__proto__|constructor|prototype|password|access_token|refresh_token|authorization|service_role|secret_key|api_key)$/i;

// Preserve complete structured source evidence, not just derived ownership IDs.
// Machine-specific paths are not useful on another device and must not upload.
export function sanitizeEvidence(value, depth = 0) {
  if (depth > 40) throw Error('The evidence nesting exceeds the supported limit.');
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.map(row => sanitizeEvidence(row, depth + 1));
  if (!value || typeof value !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw Error('Evidence must be plain JSON.');
  const result = {};
  for (const [key, item] of Object.entries(value)) {
    if (forbidden.test(key)) throw Error('Evidence contains an unsupported credential or object-control field.');
    if (key === 'local_path' || key === 'workspace_path') continue;
    result[key] = sanitizeEvidence(item, depth + 1);
  }
  return result;
}
export function prepareEvidenceSnapshot({ handoff, guideData, identities = catalogIdentities, previousSnapshot = null }) {
  const clean = sanitizeEvidence(handoff);
  if (byteLength(clean) > MAX_EVIDENCE_BYTES) throw Error('The evidence exceeds the 5 MB limit.');
  const previous = previousSnapshot ? validateEnvelope(previousSnapshot) : null;
  const present = new Set((clean.champion_capture_groups || []).map(row=>normalizeIdentity(`${row.champion} — ${row.exact_variant}`)));
  const retained = (previous?.identityMap || []).filter(row=>present.has(fullIdentity(row)));
  const retainedIds = new Set(retained.map(row=>row.variantId));
  const links = (previous?.identityLinks || []).filter(row=>retainedIds.has(row.variantId));
  const preservedGuide = guideWithReviewedLinks({identityMap:retained,identityLinks:links}, guideData);
  const stableIdentities = [...retained,...identities.filter(row=>!retained.some(saved=>fullIdentity(saved)===fullIdentity(row)))];
  const result = integrateVerifiedHandoff({ handoff: clean, guideData: preservedGuide, strategyData: null, identities: stableIdentities });
  const identityMap = result.audit.mappings.map(mapping => {
    const group = clean.champion_capture_groups.find(row => row.capture_group_id === mapping.groupId);
    return { championName: group.champion, exactVariant: group.exact_variant, variantId: mapping.variantId, provenanceRef: `saved-evidence:${mapping.groupId}` };
  });
  const snapshot = { format: EVIDENCE_FORMAT, handoff: clean, identityMap,
    ...(links.length ? {identityLinks:structuredClone(links)} : {}),
    ...(previous?.identityReviews ? {identityReviews:structuredClone(previous.identityReviews)} : {}) };
  if (byteLength(snapshot) > MAX_EVIDENCE_BYTES) throw Error('The evidence exceeds the 5 MB limit.');
  return { snapshot, result };
}
function validateEnvelope(snapshot) {
  if (!snapshot || snapshot.format !== EVIDENCE_FORMAT || !Array.isArray(snapshot.identityMap) || byteLength(snapshot) > MAX_EVIDENCE_BYTES) throw Error('Unsupported saved evidence.');
  if (snapshot.identityMap.some(row => !row || ['variantId','championName','exactVariant'].some(key => typeof row[key] !== 'string' || !row[key].trim()) || row.variantId.length > 160)) throw Error('Saved exact identity mapping is incomplete.');
  const clean = sanitizeEvidence(snapshot);
  if (JSON.stringify(clean) !== JSON.stringify(snapshot)) throw Error('Saved evidence contains unsupported local paths.');
  return clean;
}
function guideWithReviewedLinks(snapshot, guideData) {
  const links = snapshot.identityLinks || [];
  if (!Array.isArray(links)) throw Error('Saved identity links require review.');
  const targets = new Set(), sources = new Set();
  for (const link of links) {
    const identity = snapshot.identityMap.find(row => row.variantId === link.variantId);
    const canonical = guideData.champions.find(row => row.id === link.canonicalVariantId);
    const exact = guideData.champions.filter(row => normalizeIdentity(row.name) === fullIdentity(identity || {}));
    if (!identity || !identity.variantId.startsWith('local-verified:') || !canonical || exact.length !== 1 || exact[0].id !== canonical.id || canonical.id === identity.variantId || sources.has(identity.variantId) || targets.has(canonical.id)) {
      throw Error('A reviewed identity link no longer has one exact catalog match. Review it again; no mapping was applied.');
    }
    sources.add(identity.variantId); targets.add(canonical.id);
  }
  if (!links.length) return guideData;
  // Explicit links preserve the saved local ID and its ownership. Only the
  // reviewed duplicate catalog identity is omitted from this private overlay.
  // The caller's original catalog and all saved source text stay untouched.
  return { ...guideData,
    champions: guideData.champions.filter(row => !targets.has(row.id)),
    ...(guideData.identityChampions ? {identityChampions:guideData.identityChampions.filter(row=>!targets.has(row.id))} : {}) };
}
export function restoreEvidenceSnapshot({ snapshot, guideData, strategyData = null }) {
  const clean = validateEnvelope(snapshot);
  const overlayGuide = guideWithReviewedLinks(clean, guideData);
  const result = integrateVerifiedHandoff({ handoff: clean.handoff, guideData: overlayGuide, strategyData, identities: clean.identityMap });
  const ids = result.audit.mappings.map(row => row.variantId);
  if (new Set(clean.identityMap.map(row => row.variantId)).size !== clean.identityMap.length || ids.length !== clean.identityMap.length || clean.identityMap.some(row => !ids.includes(row.variantId))) {
    throw Error('Saved exact identities require reconciliation. No identity was silently dropped or merged.');
  }
  return result;
}
export function prepareIdentityReconciliation({ snapshot, guideData, expectedRevision }) {
  const clean = validateEnvelope(snapshot);
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) throw Error('Refresh the saved evidence before reviewing identities.');
  const changes = [];
  for (const identity of clean.identityMap) {
    const matches = guideData.champions.filter(row => normalizeIdentity(row.name) === fullIdentity(identity));
    if (matches.length > 1) throw Error('More than one exact catalog match exists. Export the unchanged evidence for manual identity review.');
    if (!matches.length || matches[0].id === identity.variantId) continue;
    if (!identity.variantId.startsWith('local-verified:') || matches[0].id.startsWith('local-verified:')) throw Error('This identity change needs manual review. The saved evidence has not changed.');
    const previous = (clean.identityLinks || []).find(row => row.variantId === identity.variantId);
    if (previous?.canonicalVariantId === matches[0].id) continue;
    changes.push({ name: `${identity.championName} — ${identity.exactVariant}`, variantId: identity.variantId,
      canonicalVariantId: matches[0].id, previousCanonicalVariantId: previous?.canonicalVariantId || null });
  }
  if (!changes.length) throw Error('No safe exact identity link is available. Export the unchanged evidence for manual review.');
  const candidate = structuredClone(clean);
  candidate.identityLinks = [...(clean.identityLinks || []).filter(row => !changes.some(change=>change.variantId===row.variantId)), ...changes.map(({variantId,canonicalVariantId})=>({variantId,canonicalVariantId}))];
  candidate.identityReviews = [...(clean.identityReviews || []), { previousRevision: expectedRevision, changes: structuredClone(changes), decision: 'keep_saved_local_identity_with_reviewed_catalog_link' }];
  restoreEvidenceSnapshot({ snapshot: candidate, guideData });
  return { snapshot: candidate, changes, expectedRevision };
}
