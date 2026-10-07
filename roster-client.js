import { createClient } from '@supabase/supabase-js';

/** @typedef {{userId:string,email:string}} RosterSession */
/** @type {{url:string,publishableKey:string} | undefined} */
const config = /** @type {typeof globalThis & {GOT_SUPABASE_CONFIG?: {url:string,publishableKey:string}}} */ (globalThis).GOT_SUPABASE_CONFIG;
/** @type {import('@supabase/supabase-js').SupabaseClient | undefined} */
let client;

function supabase() {
  if (!config?.url || !config.publishableKey) throw new Error('The guide database is not configured for this build.');
  client ||= createClient(config.url, config.publishableKey, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
  });
  return client;
}

export async function getRosterSession() {
  const { data: { session }, error } = await supabase().auth.getSession();
  if (error) throw error;
  if (!session) return null;
  // getUser validates the token server-side; never accept a cached user as authorization.
  const { data: { user }, error: userError } = await supabase().auth.getUser();
  if (userError || !user) throw userError || new Error('Your session could not be verified.');
  return { userId: user.id, email: user.email || '' };
}

/** @param {string} email */
export async function requestRosterSignIn(email) {
  const redirect = new URL('roster.html', location.href).href;
  const { error } = await supabase().auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } });
  if (error) throw error;
}

export async function signOutRoster() {
  const { error } = await supabase().auth.signOut();
  if (error) throw error;
}

export async function loadRoster() {
  const session = await getRosterSession();
  if (!session) return { session: null, entries: [] };
  const { data, error } = await supabase().from('player_roster')
    .select('variant_id,owned,level,stars,created_at,updated_at').eq('user_id', session.userId);
  if (error) throw error;
  return { session, entries: data || [] };
}

/** @param {RosterSession} session @param {string} variantId @param {{owned:boolean,level:number|null,stars:number|null}} entry */
export async function saveRosterEntry(session, variantId, { owned, level, stars }) {
  if (!session?.userId) throw new Error('Sign in before editing your roster.');
  if (typeof variantId !== 'string' || !variantId) throw new Error('An exact champion variant is required.');
  if (!owned) return removeRosterEntry(session, variantId);
  if (level !== null && (!Number.isInteger(level) || level < 1)) throw new Error('Level must be a positive whole number.');
  if (stars !== null && (!Number.isInteger(stars) || stars < 0)) throw new Error('Stars must be a nonnegative whole number.');
  const { data, error } = await supabase().from('player_roster')
    .upsert({ user_id: session.userId, variant_id: variantId, owned: true, level, stars }, { onConflict: 'user_id,variant_id' })
    .select('variant_id,owned,level,stars,created_at,updated_at').single();
  if (error) throw error;
  return data;
}

/** @param {RosterSession} session @param {string} variantId */
export async function removeRosterEntry(session, variantId) {
  if (!session?.userId) throw new Error('Sign in before editing your roster.');
  const { error } = await supabase().from('player_roster').delete().eq('user_id', session.userId).eq('variant_id', variantId);
  if (error) throw error;
  return null;
}
