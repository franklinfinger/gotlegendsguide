import { createPasswordRecovery } from './password-recovery.js';
import { validateReadyData } from '../../data-readiness.js';
import { prepareEvidenceSnapshot, restoreEvidenceSnapshot, prepareIdentityReconciliation } from './evidence.js';
// Default-off owner store. Public mode never creates this client.
// All authorization lives in PostgreSQL RLS; client checks only improve the UX.
export const OWNER_TABLE = 'got_owner_access';
export const ROSTER_TABLE = 'got_owner_roster';
export const EVIDENCE_TABLE = 'got_owner_evidence';
export const VARIANT_TABLE = 'got_owner_variants';

export function validateConfiguration(config = {}) {
  if (config.enabled !== true) return null;
  const url = new URL(config.url);
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) {
    throw new Error('Use the Supabase project origin without credentials or a path.');
  }
  if (!(loopback && ['http:', 'https:'].includes(url.protocol)) && !(url.protocol === 'https:' && config.allowHosted === true)) {
    throw new Error('Hosted access is disabled for this preview.');
  }
  const key = config.publishableKey;
  // Deliberately do not accept legacy JWT keys or service-role/secret keys here.
  if (typeof key !== 'string' || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) {
    throw new Error('A Supabase publishable key is required. Never use a secret or service-role key.');
  }
  return { url: url.origin, publishableKey: key };
}

export class PrivateAccessError extends Error {
  constructor(code, message) { super(message); this.name = 'PrivateAccessError'; this.code = code; }
}
const failure = (code, message) => new PrivateAccessError(code, message);
const isVariant = value => typeof value === 'string' && value.length > 0 && value.length <= 160 && !/[\u0000-\u001f]/.test(value);

export function createOwnerStore({ config, createClient, location = globalThis.location, history = globalThis.history }) {
  const checked = validateConfiguration(config);
  if (!checked) return { enabled: false };
  const client = createClient(checked.url, checked.publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
      storageKey: `got-owner-${new URL(checked.url).host}-auth`,
    },
    global: { headers: { 'X-Client-Info': 'got-private-access-preview' } },
  });
  let epoch = 0;
  let signedOut = false;
  const assertCurrent = generation => {
    if (generation !== epoch || signedOut) throw failure('session_changed', 'Your session changed. Sign in again.');
  };
  async function owner() {
    if (signedOut) throw failure('signed_out', 'Sign in to open your collection.');
    const generation = epoch;
    const { data, error } = await client.auth.getUser();
    assertCurrent(generation);
    if (error || !data?.user) throw failure('signed_out', 'Sign in to open your collection.');
    if (data.user.is_anonymous) throw failure('not_owner', 'This account does not have access.');
    const result = await client.from(OWNER_TABLE).select('user_id').eq('user_id', data.user.id).maybeSingle();
    assertCurrent(generation);
    if (result.error) throw failure('access_unavailable', 'Could not verify private access. Try again.');
    if (result.data?.user_id !== data.user.id) throw failure('not_owner', 'This account does not have access.');
    return { id: data.user.id, generation };
  }
  const recovery = createPasswordRecovery({auth:client.auth, owner, location, history, sessionChanged: () => {epoch += 1; signedOut = false;}});
  async function readCollection({ includeGameData = false, includeStrategy = false } = {}) {
    if (!['none','complete','cancelled'].includes(recovery.passwordRecoveryStatus())) throw failure('password_recovery_required', 'Finish or cancel password recovery before opening the guide.');
    const user = await owner();
    const [roster, guide, evidence, variants, synergy, strategy] = await Promise.all([
      client.from(ROSTER_TABLE).select('variant_id').eq('user_id', user.id).order('variant_id'),
      client.rpc('got_guide_data'),
      client.from(EVIDENCE_TABLE).select('revision,payload').eq('user_id', user.id).maybeSingle(),
      client.from(VARIANT_TABLE).select('variant_id,display_name,canonical_variant_id,capture_date').eq('user_id', user.id),
      includeGameData ? client.rpc('got_raid_synergy_data') : Promise.resolve({data:null}),
      includeStrategy ? client.rpc('got_strategy_data') : Promise.resolve({data:null}),
    ]);
    assertCurrent(user.generation);
    if (roster.error || guide.error || evidence.error || variants.error || synergy.error || strategy.error) throw failure('read_failed', 'Could not load your saved collection. No changes were made.');
    if (!Array.isArray(roster.data) || !Array.isArray(guide.data?.champions) || !Array.isArray(variants.data)) {
      throw failure('invalid_data', 'The collection data is incomplete.');
    }
    const baseGuide = includeGameData ? {...guide.data, ...synergy.data} : guide.data;
    if (includeGameData) validateReadyData(baseGuide, strategy.data, includeStrategy);
    let restored = null, restoreError = null;
    try { if (evidence.data) restored = restoreEvidenceSnapshot({ snapshot: evidence.data.payload, guideData: baseGuide, strategyData: strategy.data }); }
    catch (error) { restoreError = error; }
    // Check live access before reporting any private evidence problem.
    const verified = await owner();
    assertCurrent(user.generation);
    if (verified.id !== user.id) throw failure('session_changed', 'Your session changed. Sign in again.');
    if (restoreError) {
      const error = failure('evidence_reconciliation_required', 'Saved evidence needs identity or source review. It has not been changed, and recommendations are blocked.');
      error.reason = restoreError.message;
      throw error;
    }
    const guideData = restored?.guideData || baseGuide;
    const champions = [...guideData.champions];
    const capturedIds = new Set(guideData.verifiedCollection?.variantIds || []);
    for (const row of variants.data) {
      const index = champions.findIndex(champion => champion.id === row.variant_id);
      const unavailable = index < 0 || ((evidence.data || row.capture_date) && !capturedIds.has(row.variant_id));
      if (!unavailable) continue;
      // Preserve identity, but never silently substitute old catalog wording for
      // reviewed evidence omitted by a later snapshot.
      const champion = index >= 0 ? champions[index] : { id: row.variant_id, name: row.display_name };
      const flagged = { ...champion, evidenceUnavailable: true, reviewStatus: 'partial' };
      if (index >= 0) champions[index] = flagged; else champions.push(flagged);
    }
    const owned = new Set(roster.data.map(row => row.variant_id));
    const unavailableOwnedVariantIds = champions.filter(row=>row.evidenceUnavailable && owned.has(row.id)).map(row=>row.id);
    const stillOwner = await owner();
    assertCurrent(user.generation);
    if (stillOwner.id !== user.id) throw failure('session_changed', 'Your session changed. Sign in again.');
    return { ownerId: user.id, variantIds: roster.data.map(row => row.variant_id), champions,
      canonicalVariantIds: guide.data.champions.map(row => row.id),
      evidenceRevision: evidence.data?.revision || 0, evidenceSnapshot: evidence.data?.payload || null,
      guideData, strategyData: restored?.strategyData || strategy.data, audit: restored?.audit || null, unavailableOwnedVariantIds,
      recommendationsBlocked: unavailableOwnedVariantIds.length > 0 };
  }
  async function readEvidenceForRecovery() {
    const user = await owner();
    const result = await client.from(EVIDENCE_TABLE).select('revision,payload').eq('user_id', user.id).maybeSingle();
    assertCurrent(user.generation);
    if (result.error || !result.data) throw failure('read_failed', 'Could not retrieve the unchanged saved evidence.');
    const verified = await owner();
    assertCurrent(user.generation);
    if (verified.id !== user.id) throw failure('session_changed', 'Your session changed. Sign in again.');
    // Deliberately no restore, mapping, or mutation here: even a conflicted
    // snapshot remains available to its verified owner for review/export.
    return structuredClone(result.data);
  }
  async function proposeEvidenceReconciliation(expectedRevision) {
    const user = await owner();
    const saved = await readEvidenceForRecovery();
    if (saved.revision !== expectedRevision) throw failure('evidence_conflict', 'Saved evidence changed on another device. Refresh before reviewing identities.');
    const guide = await client.rpc('got_guide_data');
    assertCurrent(user.generation);
    if (guide.error) throw failure('read_failed', 'Could not check current catalog identities.');
    const proposal = prepareIdentityReconciliation({ snapshot: saved.payload, guideData: guide.data, expectedRevision });
    const verified = await owner();
    assertCurrent(user.generation);
    if (verified.id !== user.id) throw failure('session_changed', 'Your session changed. Sign in again.');
    return proposal;
  }
  async function prepareEvidence(handoff) {
    const user = await owner();
    const [guide, saved] = await Promise.all([
      client.rpc('got_guide_data'),
      client.from(EVIDENCE_TABLE).select('revision,payload').eq('user_id', user.id).maybeSingle(),
    ]);
    assertCurrent(user.generation);
    if (guide.error || saved.error) throw failure('read_failed', 'Could not validate the selected evidence.');
    const prepared = prepareEvidenceSnapshot({ handoff, guideData: guide.data, previousSnapshot: saved.data?.payload || null });
    const verified = await owner();
    assertCurrent(user.generation);
    if (verified.id !== user.id) throw failure('session_changed', 'Your session changed. Sign in again.');
    return prepared;
  }
  async function saveEvidence(snapshot, expectedRevision) {
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0 || expectedRevision >= 2147483647) throw failure('invalid_revision', 'Refresh before saving evidence.');
    const user = await owner();
    const guide = await client.rpc('got_guide_data');
    assertCurrent(user.generation);
    if (guide.error) throw failure('read_failed', 'Could not validate the selected evidence.');
    restoreEvidenceSnapshot({ snapshot, guideData: guide.data });
    const next = expectedRevision + 1;
    const operation = expectedRevision === 0
      ? client.from(EVIDENCE_TABLE).insert({ user_id: user.id, revision: next, payload: snapshot })
      : client.from(EVIDENCE_TABLE).update({ revision: next, payload: snapshot }).eq('user_id', user.id).eq('revision', expectedRevision);
    const result = await operation.select('revision').maybeSingle();
    assertCurrent(user.generation);
    if (result.error?.code === '23505' || (!result.error && result.data?.revision !== next)) throw failure('evidence_conflict', 'Saved evidence changed on another device. Refresh and review before saving again.');
    if (result.error) throw failure('save_failed', 'Could not confirm the evidence save. Refresh before trying again.');
    const stillOwner = await owner();
    assertCurrent(user.generation);
    if (stillOwner.id !== user.id) throw failure('session_changed', 'Your session changed. Sign in again.');
    return next;
  }
  async function setOwned(variantId, owned) {
    if (!isVariant(variantId) || typeof owned !== 'boolean') throw failure('invalid_variant', 'Choose an exact champion variant.');
    const user = await owner();
    if (owned) {
      const collection = await readCollection();
      const champion = collection.champions.find(row => row.id === variantId);
      if (!champion) throw failure('invalid_variant', 'Choose an exact catalog or saved-evidence variant.');
      const canonical = collection.canonicalVariantIds.includes(variantId);
      const registered = await client.from(VARIANT_TABLE).upsert({ user_id: user.id, variant_id: variantId,
        canonical_variant_id: canonical ? variantId : null, display_name: champion.name,
        capture_date: champion.screenshotState?.captureDate || null }, { onConflict: 'user_id,variant_id', ignoreDuplicates: true });
      assertCurrent(user.generation);
      if (registered.error) throw failure('save_failed', 'Could not preserve this exact variant. Refresh before trying again.');
    }
    // Each action touches one variant. A stale device never replaces the whole roster.
    // No offline queue or automatic destructive reconciliation is used.
    const result = owned
      ? await client.from(ROSTER_TABLE).upsert({ user_id: user.id, variant_id: variantId }, { onConflict: 'user_id,variant_id', ignoreDuplicates: true })
      : await client.from(ROSTER_TABLE).delete().eq('user_id', user.id).eq('variant_id', variantId);
    assertCurrent(user.generation);
    if (result.error) throw failure('save_failed', 'Could not confirm this change. Refresh before trying again.');
    // Re-read server truth. A zero-row RLS denial must not be displayed as saved.
    const saved = await client.from(ROSTER_TABLE).select('variant_id').eq('user_id', user.id).eq('variant_id', variantId).maybeSingle();
    assertCurrent(user.generation);
    if (saved.error || Boolean(saved.data) !== owned) throw failure('save_unconfirmed', 'Could not confirm this change. Refresh before trying again.');
    // Deletion returning no rows also occurs if membership was revoked mid-save.
    // Recheck access before reporting success, rather than treating invisibility as deletion.
    const stillOwner = await owner();
    assertCurrent(user.generation);
    if (stillOwner.id !== user.id) throw failure('session_changed', 'Your session changed. Sign in again.');
    return owned;
  }
  async function addCapturedVariants(expectedRevision) {
    const user = await owner();
    const collection = await readCollection();
    if (collection.evidenceRevision !== expectedRevision || !expectedRevision) throw failure('evidence_conflict', 'Saved evidence changed. Refresh before adding captured variants.');
    const ids = collection.guideData.verifiedCollection?.variantIds || [];
    if (!ids.length) throw failure('invalid_data', 'No reviewed captured variants are available.');
    const registry = ids.map(id => {
      const champion = collection.champions.find(row=>row.id===id);
      return {user_id:user.id,variant_id:id,canonical_variant_id:collection.canonicalVariantIds.includes(id)?id:null,display_name:champion.name,capture_date:champion.screenshotState?.captureDate||null};
    });
    const registered = await client.from(VARIANT_TABLE).upsert(registry,{onConflict:'user_id,variant_id',ignoreDuplicates:true});
    assertCurrent(user.generation);
    if (registered.error) throw failure('save_failed','Could not preserve the captured identities. Refresh before trying again.');
    // Additive only: never replace a newer device's roster or silently remove a variant.
    const result = await client.from(ROSTER_TABLE).upsert(ids.map(variant_id=>({user_id:user.id,variant_id})),{onConflict:'user_id,variant_id',ignoreDuplicates:true});
    assertCurrent(user.generation);
    if (result.error) throw failure('save_failed','Could not confirm the collection save. Refresh before trying again.');
    const saved = await readCollection();
    assertCurrent(user.generation);
    if (ids.some(id=>!saved.variantIds.includes(id))) throw failure('save_unconfirmed','Could not confirm every captured variant. Refresh and review the saved collection.');
    return saved;
  }
  async function signIn(email, password) {
    if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
      throw failure('credentials_required', 'Enter your email and password.');
    }
    epoch += 1;
    signedOut = false;
    const generation = epoch;
    // The SDK owns token storage/rotation. Never store or log the password ourselves.
    const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
    assertCurrent(generation);
    if (error) throw failure('sign_in_failed', 'Could not sign in. Check your email and password.');
    return owner();
  }
  async function signOut() {
    epoch += 1;
    signedOut = true;
    // Local scope keeps this user's other devices signed in.
    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) throw failure('sign_out_failed', 'The screen is locked, but sign-out could not be confirmed. Reconnect and try again before leaving this device.');
  }
  function watch(onChange) {
    const { data } = client.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') { epoch += 1; signedOut = true; }
      if (event === 'SIGNED_IN') signedOut = false;
      // No Supabase calls are awaited inside the SDK callback (avoids auth-lock deadlock).
      onChange(event);
    });
    return () => data.subscription.unsubscribe();
  }
  return { enabled: true, ...recovery, owner, readCollection, readEvidenceForRecovery, proposeEvidenceReconciliation, prepareEvidence, saveEvidence, setOwned, addCapturedVariants, signIn, signOut, watch };
}
