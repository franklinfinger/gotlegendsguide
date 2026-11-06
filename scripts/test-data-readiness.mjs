import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

globalThis.GOT_SUPABASE_CONFIG = { url: 'https://example.supabase.co', publishableKey: 'public-test-key' };
const { createDataReadiness, readinessMarkup } = await import('../data-readiness.js');
const guide = { version: 'guide-v1', ...Object.fromEntries(['champions','abilities','traits','items','factions','statuses','mechanics','companions','legendaryAssault','warRules','raidRules','raidTeams','strategyTeams','teams','announcements'].map(key => [key, []])), champions:[{id:'champion',name:'Test champion',releaseState:'live',reviewStatus:'complete',factions:['Test faction'],roles:[]}], abilities:[{id:'ability',name:'Test ability',kind:'skill',variantId:'champion',text:'Test ability wording'}], factions:[{id:'faction',name:'Test faction',memberVariantIds:['champion'],rules:[]}] };
const raid = { factionActivations:[{factionId:'faction',factionName:'Test faction',requiredMembers:3,sourceId:1}], allyGems:[{id:'gem',ownerName:'Test champion',allyName:'Other champion',gemName:'Test gem',effect:'Test effect',reviewState:'visually_verified',currentnessState:'historical',sourceId:2}] };
const strategy = { version: 'strategy-v1', mechanics:[{id:'mechanic',name:'Test mechanic',category:'damage'}], targets:[{id:'target',battleMode:'raid',kind:'attack',name:'Test target',evidenceState:'verified',approach:'Test approach',timing:'',warning:'',provenanceRef:'test:1',reviewStatus:'reviewed'}], rules:[{id:'rule',kind:'target_fit',battleMode:'raid',targetId:'target',subjectVariantId:null,mechanicId:'mechanic',pairedMechanicId:null,score:5,rationale:'Test reason',evidenceCategory:'strategy_inference',provenanceRef:'test:1',confidence:1,reviewStatus:'reviewed'}], championFacts:[{id:'fact',variantId:'champion',mechanicId:'mechanic',effectRole:'provides',context:'skill',factText:'Test fact',evidenceCategory:'verified_fact',provenanceRef:'test:1',confidence:1,reviewStatus:'reviewed'}], curatedRecommendations:[] };
const payload = { got_guide_data:guide, got_raid_synergy_data:raid, got_strategy_data:strategy };
const successFetch = async (url, options) => {
  assert.equal(options.cache, 'no-store');
  assert.ok(options.signal instanceof AbortSignal);
  return new Response(JSON.stringify(payload[String(url).split('/').at(-1)]));
};

for (const endpoint of Object.keys(payload)) {
  test(`${endpoint} failure blocks advice and a fresh retry recovers`, async () => {
    const original = globalThis.fetch;
    const seen = [];
    const controller = createDataReadiness({onChange: state => seen.push(state)});
    try {
      globalThis.fetch = async (url, options) => String(url).endsWith(endpoint) ? new Response('{}', {status:503}) : successFetch(url, options);
      await controller.load();
      assert.equal(controller.state.status, 'unavailable');
      assert.equal(controller.state.guide, null);
      assert.equal(controller.state.strategy, null);
      assert.doesNotMatch(controller.state.error, /paused/i);
      assert.match(readinessMarkup(controller.state), /advice blocked/);
      globalThis.fetch = successFetch;
      await controller.load();
      assert.equal(controller.state.status, 'ready');
      assert.deepEqual(seen.map(row => row.status), ['loading','unavailable','loading','ready']);
      assert.match(readinessMarkup(controller.state), /Personal roster: not yet imported/);
      assert.match(readinessMarkup(controller.state), /guide-v1.*strategy-v1/);
    } finally { globalThis.fetch = original; }
  });
}

test('failed refresh removes advice, retaining only explicitly stale last-success metadata', async () => {
  let fail = false;
  const seen = [];
  const controller = createDataReadiness({guide:async()=>{if(fail)throw Error('Network unavailable');return {...guide,...raid};},strategy:async()=>strategy,now:()=> '2026-11-02T20:00:00Z',onChange:state=>seen.push(state)});
  await controller.load();
  fail = true;
  const pending = controller.load();
  assert.equal(controller.state.status, 'loading');
  assert.equal(controller.state.guide, null);
  await pending;
  assert.equal(controller.state.status, 'unavailable');
  assert.equal(controller.state.guide, null);
  assert.equal(controller.state.strategy, null);
  assert.equal(controller.state.lastSuccess.loadedAt, '2026-11-02T20:00:00Z');
  assert.match(readinessMarkup(controller.state), /stale; not used for advice/);
});

test('superseded successful response cannot overwrite the latest failed retry', async () => {
  let finish;
  let calls = 0;
  const controller = createDataReadiness({ guide:()=>++calls===1 ? new Promise(resolve=>{finish=resolve;}) : Promise.reject(Error('Latest request failed')), strategy:async()=>strategy });
  const old = controller.load();
  await controller.load();
  finish({...guide,...raid});
  await old;
  assert.equal(controller.state.status, 'unavailable');
  assert.equal(controller.state.lastSuccess, null);
});

test('superseded failure cannot erase the latest successful retry', async () => {
  let fail;
  let calls = 0;
  const controller = createDataReadiness({ guide:()=>++calls===1 ? new Promise((_,reject)=>{fail=reject;}) : Promise.resolve({...guide,...raid}), strategy:async()=>strategy });
  const old = controller.load();
  await controller.load();
  fail(Error('Old request failed'));
  await old;
  assert.equal(controller.state.status, 'ready');
});

for (const [label, patch, strategyPatch] of [
  ['empty champions',{champions:[]},{}],['empty abilities',{abilities:[]},{}],
  ['empty raid activations',{factionActivations:[]},{}],['empty ally gems',{allyGems:[]},{}],
  ['empty strategy targets',{}, {targets:[]}], ['empty strategy rules',{}, {rules:[]}],
  ['empty strategy facts',{}, {championFacts:[]}], ['blank guide version',{version:' '},{}],
  ['blank strategy version',{}, {version:' '}]
]) test(`${label} never becomes ready`, async()=> {
  const controller = createDataReadiness({guide:async()=>({...guide,...raid,...patch}),strategy:async()=>({...strategy,...strategyPatch})});
  await controller.load();
  assert.equal(controller.state.status,'unavailable');
  assert.equal(controller.state.guide,null);
});

test('unconfigured browser blocks advice without attributing a pause', async()=>{
  const saved = globalThis.GOT_SUPABASE_CONFIG;
  delete globalThis.GOT_SUPABASE_CONFIG;
  const client = await import('../supabase-client.js?unconfigured');
  globalThis.GOT_SUPABASE_CONFIG = saved;
  const controller=createDataReadiness({guide:client.getGuideData,strategy:client.getStrategyData});
  await controller.load();
  assert.equal(controller.state.status,'unavailable');
  assert.match(controller.state.error,/not configured/);
  assert.doesNotMatch(controller.state.error,/paused/i);
});

test('catalog-only page does not request strategy, while still requiring guide and Raid data', async()=>{
  const controller=createDataReadiness({guide:async()=>({...guide,...raid}),strategy:async()=>{throw Error('Must not request strategy');}});
  await controller.load(false);
  assert.equal(controller.state.status,'ready');
  assert.equal(controller.state.strategy,null);
});

test('interface removes stale content before readiness-gated rendering; health checks real game fetches',()=>{
  const source=fs.readFileSync(new URL('../guide.js',import.meta.url),'utf8');
  const callback=source.slice(source.indexOf('const readiness ='));
  assert.ok(callback.indexOf("root.innerHTML = ''") < callback.indexOf("if (result.status === 'ready') render()"));
  assert.match(callback,/snapshot = result.guide/);
  assert.match(callback,/strategySnapshot = result.strategy/);
  assert.doesNotMatch(callback,/location.reload/);
  const health=fs.readFileSync(new URL('../health.js',import.meta.url),'utf8');
  assert.match(health,/readiness.load\(true\)/);
  assert.doesNotMatch(health,/getDataHealth|connection: OK/);
});

for (const [label, failure] of [['offline',new TypeError('Failed to fetch')],['timeout',new DOMException('The operation timed out','TimeoutError')]]) test(`${label} blocks advice without a confirmed pause claim`, async()=>{
  const controller=createDataReadiness({guide:async()=>{throw failure;},strategy:async()=>strategy});
  await controller.load();
  assert.equal(controller.state.status,'unavailable');
  assert.equal(controller.state.guide,null);
  assert.doesNotMatch(controller.state.error,/paused/i);
  assert.match(readinessMarkup(controller.state),/cannot confirm a pause/);
});

for (const endpoint of Object.keys(payload)) test(`${endpoint} malformed result blocks readiness`, async()=>{
  const original=globalThis.fetch;
  try {
    globalThis.fetch=async(url,options)=>String(url).endsWith(endpoint) ? new Response('{}') : successFetch(url,options);
    const controller=createDataReadiness();
    await controller.load();
    assert.equal(controller.state.status,'unavailable');
    assert.equal(controller.state.guide,null);
  } finally {globalThis.fetch=original;}
});

test('untrusted error and version strings are escaped in status markup',()=>{
  const html=readinessMarkup({status:'unavailable',error:'<script>alert(1)</script>',lastSuccess:{loadedAt:'2026-11-02T20:00:00Z',guideVersion:'<img src=x>',strategyVersion:'<svg/onload=alert(1)>'}});
  assert.doesNotMatch(html,/<script>|<img|<svg/);
  assert.match(html,/&lt;script&gt;/);
});

// Exercise malformed records through the actual RPC/client path, then prove retry recovery.
for (const [endpoint, document] of Object.entries(payload)) {
  for (const key of Object.keys(document).filter(key => Array.isArray(document[key]))) {
    for (const badRow of [null, {}]) test(`${endpoint}.${key} rejects ${badRow === null ? 'null' : 'missing fields'} rows and retries`, async()=>{
      const original=globalThis.fetch;
      try {
        globalThis.fetch=async(url,options)=>String(url).endsWith(endpoint) ? new Response(JSON.stringify({...document,[key]:[badRow]})) : successFetch(url,options);
        const controller=createDataReadiness();
        await controller.load();
        assert.equal(controller.state.status,'unavailable');
        assert.equal(controller.state.guide,null);
        globalThis.fetch=successFetch;
        await controller.load();
        assert.equal(controller.state.status,'ready');
      } finally {globalThis.fetch=original;}
    });
  }
}

for (const [label, guidePatch, strategyPatch] of [
  ['invalid champion name',{champions:[{...guide.champions[0],name:42}]},{}],
  ['invalid champion factions',{champions:[{...guide.champions[0],factions:null}]},{}],
  ['duplicate champion IDs',{champions:[...guide.champions,...guide.champions]},{}],
  ['invalid nested faction rule',{factions:[{...guide.factions[0],rules:[null]}]},{}],
  ['invalid nested team member',{teams:[{id:'team',mode:'raid',members:[null]}]},{}],
  ['missing activation faction',{factionActivations:[{...raid.factionActivations[0],factionId:'missing'}]},{}],
  ['non-finite score',{}, {rules:[{...strategy.rules[0],score:NaN}]}],
  ['missing mechanic reference',{}, {championFacts:[{...strategy.championFacts[0],mechanicId:'missing'}]}],
  ['missing target reference',{}, {rules:[{...strategy.rules[0],targetId:'missing'}]}],
  ['empty mechanic catalog',{}, {mechanics:[]}]
]) test(`${label} blocks advice`,async()=>{
  const controller=createDataReadiness({guide:async()=>({...guide,...raid,...guidePatch}),strategy:async()=>({...strategy,...strategyPatch})});
  await controller.load();
  assert.equal(controller.state.status,'unavailable');
});

test('legitimate nullable metadata, insufficient target, and unresolved curated member remain valid',async()=>{
  const controller=createDataReadiness({guide:async()=>({...guide,...raid,champions:[{...guide.champions[0],legacyId:null,rarity:null,gemColor:null,portrait:null}],items:[{id:'item',name:'Test item',ownerVariantId:null,abilities:[]}]}),strategy:async()=>({...strategy,targets:[{...strategy.targets[0],evidenceState:'insufficient'}],curatedRecommendations:[{id:'curated',targetId:'target',title:'Partial team',recommendationType:'alternative',confidence:0.5,provenanceRef:'test:1',notes:'Unknown member',active:true,reviewStatus:'partial',leaderVariantId:null,members:[{position:1,variantId:null,displayName:'Unknown variant',identityStatus:'unresolved',isLeader:false}]}]})});
  await controller.load();
  assert.equal(controller.state.status,'ready');
});

test('observed teams may legitimately have an unknown (null) leader', async()=>{
  const controller=createDataReadiness({guide:async()=>({...guide,...raid,teams:[{id:'observed-team',mode:'observed_composition',members:[{name:'Test champion',isLeader:null}]}]}),strategy:async()=>strategy});
  await controller.load();
  assert.equal(controller.state.status,'ready');
  assert.equal(controller.state.guide.teams[0].members[0].isLeader,null);
});
