import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.GOT_SUPABASE_CONFIG = { url: 'https://example.supabase.co', publishableKey: 'public-test-key' };
const { getDataHealth, getGuideData, getStrategyData } = await import('../supabase-client.js');

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
  const data = Object.fromEntries(['champions','abilities','traits','items','factions','statuses','mechanics','companions','legendaryAssault','warRules','raidRules','raidTeams','strategyTeams','teams','announcements'].map(key => [key, []]));
  data.version = 'verified-sqlite-2026-10-05';
  globalThis.fetch = async url => new Response(JSON.stringify(String(url).includes('got_raid_synergy_data')?{factionActivations:[],allyGems:[]}:data));
  try { const result=await getGuideData();assert.equal(result.version, data.version);assert.deepEqual(result.allyGems,[]); }
  finally { globalThis.fetch = original; }
});

test('guide RPC rejects a response missing restored product collections', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ version: 'verified-sqlite-2026-10-05', champions: [] }));
  try { await assert.rejects(getGuideData, /incomplete guide result/); }
  finally { globalThis.fetch = original; }
});

test('strategy RPC requires its normalized collections', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ version: '2026-10-07.3', mechanics: [], targets: [], rules: [], championFacts: [], curatedRecommendations: [] }));
  try { assert.equal((await getStrategyData()).version, '2026-10-07.3'); }
  finally { globalThis.fetch = original; }
});

test('strategy RPC rejects incomplete results', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ version: '2026-10-07.1', targets: [] }));
  try { await assert.rejects(getStrategyData, /incomplete strategy result/); }
  finally { globalThis.fetch = original; }
});
