import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.GOT_SUPABASE_CONFIG = { url: 'https://example.supabase.co', publishableKey: 'public-test-key' };
const { getDataHealth, getGuideData } = await import('../supabase-client.js');

test('health RPC accepts the table-valued response from PostgREST', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify([{ total_champions: 86, data_version: 'verified-sqlite-2026-10-05' }]));
  try {
    const result = await getDataHealth();
    assert.equal(result.total_champions, 86);
  } finally { globalThis.fetch = original; }
});

test('guide RPC requires every curated collection', async () => {
  const original = globalThis.fetch;
  const data = Object.fromEntries(['champions','abilities','traits','items','factions','statuses','companions','bosses','raidRules','raidTeams','teams','announcements'].map(key => [key, []]));
  data.version = 'verified-sqlite-2026-10-05';
  globalThis.fetch = async () => new Response(JSON.stringify(data));
  try { assert.equal((await getGuideData()).version, data.version); }
  finally { globalThis.fetch = original; }
});
