// The existing app is static. Supabase's read-only REST API is the browser client.
// Only the publishable key is used; the database grants no browser write access.
/** @typedef {{url:string,publishableKey:string}} SupabaseConfig */
/** @type {SupabaseConfig | undefined} */
const config = /** @type {typeof globalThis & {GOT_SUPABASE_CONFIG?: SupabaseConfig}} */ (globalThis).GOT_SUPABASE_CONFIG;

/** @returns {Promise<{total_champions:number,total_abilities:number,total_raid_bosses:number,total_factions:number,total_faction_memberships:number,total_announced_updates:number,data_version:string|null,imported_at:string|null}>} */
export async function getDataHealth() {
  if (!config?.url || !config.publishableKey) throw new Error('Supabase is not configured for this build.');
  const response = await fetch(`${config.url.replace(/\/$/, '')}/rest/v1/rpc/got_data_health`, {
    headers: { apikey: config.publishableKey, Accept: 'application/json' }
  });
  if (!response.ok) throw new Error(`Supabase request failed (${response.status}).`);
  const data = await response.json();
  if (!data || typeof data.total_champions !== 'number') throw new Error('Supabase returned an incomplete health result.');
  return data;
}
