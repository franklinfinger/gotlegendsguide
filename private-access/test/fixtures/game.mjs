import {evidenceFixture} from './evidence.mjs';
import {createOwnerStore,OWNER_TABLE,ROSTER_TABLE,EVIDENCE_TABLE,VARIANT_TABLE} from '../../src/client.js';
export function gameFixture() {
  const guide={version:'base-v1',...Object.fromEntries(['champions','abilities','traits','items','factions','statuses','mechanics','companions','legendaryAssault','warRules','raidRules','raidTeams','strategyTeams','teams','announcements'].map(key=>[key,[]]))};
  guide.champions=Array.from({length:7},(_,i)=>({id:`v${i}`,name:`Fixture Champion ${i} — Exact`,factions:['Fixture faction'],roles:[],releaseState:'live',reviewStatus:'complete',gemColor:'Blue'}));
  guide.abilities=guide.champions.map((row,i)=>({id:`old-${i}`,kind:'skill',name:'Historical healing',variantId:row.id,text:'HEALS all allies for 999% Max HP.'}));
  guide.factions=[{id:'f1',name:'Fixture faction',memberVariantIds:guide.champions.map(row=>row.id),rules:[]}];
  const synergy={factionActivations:[{factionId:'f1',factionName:'Fixture faction',requiredMembers:3,sourceId:1}],allyGems:[{id:'a1',ownerName:'Fixture Champion 0',allyName:'Fixture Champion 1',gemName:'Example',effect:'Captured historical effect',reviewState:'visually_verified',currentnessState:'historical',sourceId:2}]};
  const strategy={version:'strategy-v1',mechanics:[{id:'healing',name:'Healing',category:'support'}],targets:[{id:'raid:defense',battleMode:'raid',kind:'defense',name:'Raid defense',evidenceState:'verified',approach:'A sourced defensive plan.',timing:'Use Skills when ready.',warning:'Not a verified victory.',provenanceRef:'synthetic:target',reviewStatus:'complete'}],rules:[{id:'r1',kind:'target_fit',battleMode:'raid',targetId:'raid:defense',subjectVariantId:null,mechanicId:'healing',pairedMechanicId:null,score:10,rationale:'Healing support.',evidenceCategory:'strategy_inference',provenanceRef:'synthetic:rule',confidence:.7,reviewStatus:'complete'}],championFacts:guide.champions.map((row,i)=>({id:`fact-${i}`,variantId:row.id,mechanicId:'healing',effectRole:'provides',context:'skill',factText:'Historical healing 999%.',evidenceCategory:'verified_fact',provenanceRef:'synthetic:old',confidence:1,reviewStatus:'complete'})),curatedRecommendations:[]};
  const handoff=evidenceFixture().handoff;
  handoff.review_updates=[];
  handoff.champion_capture_groups=Array.from({length:6},(_,i)=>({capture_group_id:`G${i}`,champion:`Fixture Champion ${i}`,exact_variant:'Exact',profile_anchor:'IMG_100.PNG',group_source_filenames:['IMG_100.PNG'],fields_as_recorded:{profile:'Level 1; skill level 1.',current_skill:`**Current Heal ${i}** — level 1, Slow. “HEALS all allies for ${10+i}% of their Max HP.” IMG_100.PNG`,traits:'**Current Leader** — Leader. “All allies gain 1% DEF.” IMG_100.PNG'}}));
  return {guide,synergy,strategy,handoff};
}
// Two SDK instances share only mock remote tables. Each keeps its own session.
export function gameService(fixture=gameFixture()) {
  const remote={evidence:null,variants:new Map(),owned:new Set(),allowed:true,rpcFailure:null,events:[],holdRpc:null};
  function device({signedIn=true}={}) {
    let listener=()=>{};
    const sdk={auth:{getUser:async()=>({data:{user:signedIn?{id:'owner'}:null}}),onAuthStateChange(fn){listener=fn;return {data:{subscription:{unsubscribe(){}}}};},signInWithPassword:async()=>{signedIn=true;listener('SIGNED_IN');return {};},signOut:async()=>{signedIn=false;listener('SIGNED_OUT');return {};}},rpc:async name=>{remote.events.push(['rpc',name]);if(remote.holdRpc)await remote.holdRpc;if(remote.rpcFailure===name)return {error:{message:'Unavailable'}};return {data:structuredClone(({got_guide_data:fixture.guide,got_raid_synergy_data:fixture.synergy,got_strategy_data:fixture.strategy})[name])};},from(table){
      const filters={};let action='read',values;
      const run=()=>{
        remote.events.push([table,action]);
        if(table===OWNER_TABLE)return {data:remote.allowed?{user_id:'owner'}:null};
        if(table===EVIDENCE_TABLE){if(action==='insert'){if(remote.evidence)return {error:{code:'23505'}};remote.evidence=structuredClone(values);}if(action==='update'){if(remote.evidence?.revision!==filters.revision)return {data:null};remote.evidence={...remote.evidence,...structuredClone(values)};}return {data:structuredClone(remote.evidence)};}
        if(table===VARIANT_TABLE){if(action==='upsert')for(const row of Array.isArray(values)?values:[values])if(!remote.variants.has(row.variant_id))remote.variants.set(row.variant_id,structuredClone(row));return {data:[...remote.variants.values()]};}
        if(table===ROSTER_TABLE){if(action==='upsert')for(const row of Array.isArray(values)?values:[values])remote.owned.add(row.variant_id);if(action==='delete')remote.owned.delete(filters.variant_id);return {data:filters.variant_id?(remote.owned.has(filters.variant_id)?{variant_id:filters.variant_id}:null):[...remote.owned].map(variant_id=>({variant_id}))};}
        throw Error('Unexpected table');
      };
      const chain={select(){return chain;},eq(key,value){filters[key]=value;return chain;},order(){return chain;},maybeSingle(){return Promise.resolve(run());},insert(value){action='insert';values=value;return chain;},update(value){action='update';values=value;return chain;},upsert(value){action='upsert';values=value;return chain;},delete(){action='delete';return chain;},then(resolve,reject){return Promise.resolve(run()).then(resolve,reject);}};return chain;
    }};
    return {store:createOwnerStore({config:{enabled:true,url:'http://localhost:54321',publishableKey:'sb_publishable_synthetic'},createClient:()=>sdk}),emit:code=>listener(code)};
  }
  return {remote,device,fixture};
}
