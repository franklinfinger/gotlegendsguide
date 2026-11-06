import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateWrathSynergy } from '../wrath-synergy.js';
import { evaluateExactTeam, recommendTeam } from '../strategy-engine.js';
const qarth='sqlite-champion-6';
const passive='When an ally uses their Skill, Daenerys gains 2 WRATH, or 3 if the ally is a Free Cities Champion. Drogon deals a bonus 25% ATK Damage per WRATH. Viserion & Rhaegal deal a bonus 10% ATK Damage per WRATH. Daenerys loses all WRATH after using her Skill.';
const skill="Drogon strikes a target enemy for 200% ATK Fire Damage and afflicts them with FEAR x2. Rhaegal and Viserion then each strike a random target for 75% ATK Fire Damage. Rhaegal and Viserion's attacks ignore TAUNT and STEALTH.";
const item='Once per turn, when an enemy gains a SHIELD, Daenerys gains 3 WRATH. When Daenerys destroys a SHIELD, Free Cities allies gain 20% Stamina. Anytime an enemy is defeated, Daenerys gains a 2% ATK SHIELD for each WRATH she has.';
const source=(id,kind,text,variantId=qarth,extra={})=>({id,kind,context:kind,name:id,text,variantId,reviewStatus:'complete',provenanceRef:'synthetic:'+id,sourceFilenames:['synthetic-'+id+'.png'],...extra});
function fixture(){
  const champions=[qarth,'neutral-a','neutral-b','neutral-c','neutral-d','free-a','free-b','enemy-shield','resource','unknown'].map(id=>({id,name:id===qarth?'Daenerys Targaryen — Conqueror Of Qarth':id,factions:id.startsWith('free-')?['Free Cities']:[],releaseState:'live',reviewStatus:'complete',roles:[]}));
  const records=[source('passive','trait',passive,qarth,{sourceBadges:['1 Once']}),source('qarth-skill','skill',skill),source('iconic','item',item,qarth,{itemLevel:12,itemRank:'III'}),source('leader','trait','When an enemy uses a Skill, CHARGE II to all allies and grant Daenerys 2 WRATH.',qarth,{context:'leader'}),...champions.filter(row=>row.id!==qarth).map(row=>source(row.id+'-skill','skill',row.id==='enemy-shield'?'Example grants a team member a 50% DEF SHIELD.':row.id==='resource'?'Example consumes 1 TOKEN to strike an enemy for 100% ATK Physical Damage.':'Example strikes an enemy for 100% ATK Physical Damage.',row.id))];
  const guideData={version:'synthetic',champions,abilities:[],traits:[],items:[],teams:[],allyGems:[],factionActivations:[],factions:[{id:'free',name:'Free Cities',memberVariantIds:['free-a','free-b'],rules:[]}],verifiedCollection:{captureDate:'2000-01-01',variantIds:champions.filter(row=>row.id!=='enemy-shield').map(row=>row.id),records,definitionGaps:[{variantId:'unknown',effectName:'UNVERIFIED EFFECT'}],factionMembershipEvidence:['free-a','free-b'].map(variantId=>({variantId,mechanicId:'faction_free_cities',reviewStatus:'reviewed',provenanceRef:'synthetic:membership:'+variantId}))}};
  const strategyData={version:'synthetic',mechanics:[{id:'physical_damage',name:'Physical',category:'damage'}],targets:[{id:'raid:test',battleMode:'raid',name:'Synthetic',evidenceState:'verified',approach:'Synthetic',timing:'Synthetic',warning:'Synthetic'}],rules:[{id:'damage',kind:'target_fit',targetId:'raid:test',mechanicId:'physical_damage',score:1,rationale:'Synthetic score',evidenceCategory:'strategy_inference',provenanceRef:'synthetic:damage',confidence:1}],championFacts:champions.map(row=>({id:'fact-'+row.id,variantId:row.id,mechanicId:'physical_damage',context:'skill',factText:'Synthetic direct damage',evidenceCategory:'verified_fact',provenanceRef:'synthetic:fact:'+row.id,confidence:1,reviewStatus:'complete'})),curatedRecommendations:[]};
  return {guideData,strategyData};
}
const evaluate=(f,variantIds,rest={})=>evaluateWrathSynergy({guideData:f.guideData,variantIds,...rest});

test('one bounded Free Cities preference, not event counts or a damage formula',()=>{
  const f=fixture();
  assert.equal(evaluate(f,[qarth]).score,0);
  assert.equal(evaluate(f,[qarth,'neutral-a']).score,1);
  assert.equal(evaluate(f,[qarth,'free-a']).score,2);
  assert.equal(evaluate(f,[qarth,'free-a','free-b','neutral-a','neutral-b']).score,2);
  const result=evaluate(f,[qarth,'free-a']);
  assert.match(result.limitations.join(' '),/Once.*not established/);
  assert.match(result.limitations.join(' '),/consumes all WRATH afterward/);
  assert.match(result.limitations.join(' '),/damage type.*not inferred/);
  assert.ok(result.contributions.every(row=>row.sourceRefs.length));
});

test('Qarth is not her own ally; missing, resource-gated and unknown portfolios get no trigger credit',()=>{
  const f=fixture();
  assert.equal(evaluate(f,[qarth,qarth,'missing','resource','unknown']).score,0);
  assert.deepEqual(evaluate(f,[qarth,'resource','unknown']).allyVariantIds,[]);
});

test('complete exact passive and skill wording plus exact variant identity are mandatory',()=>{
  for(const mutate of [f=>{f.guideData.verifiedCollection.records[0].reviewStatus='partial';},f=>{f.guideData.verifiedCollection.records[0].text+=' Extra unknown condition.';},f=>{f.guideData.verifiedCollection.records[1].text+='…';},f=>{f.guideData.champions[0].name='Daenerys Targaryen — Other Variant';}]) {
    const f=fixture();mutate(f);assert.equal(evaluate(f,[qarth,'free-a']).score,0);
  }
  const f=fixture();delete f.guideData.verifiedCollection;
  assert.equal(evaluate(f,[qarth,'free-a']).status,'not_applicable');
});

test('Free Cities needs membership evidence and agreement in both existing identity lists',()=>{
  for(const mutate of [f=>{f.guideData.verifiedCollection.factionMembershipEvidence=[];},f=>{f.guideData.factions[0].memberVariantIds=[];},f=>{f.guideData.champions.find(row=>row.id==='free-a').factions=[];}]) {
    const f=fixture();mutate(f);assert.equal(evaluate(f,[qarth,'free-a']).score,1);
  }
});

test('shield gain, destruction and defeat stay distinct and require enabled matching item evidence',()=>{
  const f=fixture(),options={itemStates:{[qarth]:'enabled'},itemRanks:{[qarth]:{level:12,rank:'III'}},enemyVariantIds:['enemy-shield']};
  const r=evaluate(f,[qarth,'free-a'],options);
  assert.equal(r.opportunities.find(row=>row.id==='wrath-enemy-shield-gain').status,'supported_opportunity');
  assert.equal(r.opportunities.find(row=>row.id==='wrath-shield-destruction').status,'destruction_unestablished');
  assert.equal(r.opportunities.find(row=>row.id==='wrath-enemy-defeat-shield').status,'defeat_unestablished');
  assert.ok(r.opportunities.every(row=>row.score===0));
  assert.match(r.opportunities.find(row=>row.id==='wrath-enemy-defeat-shield').text,/does not trigger/);
  for(const itemStates of [{},{[qarth]:'disabled'}])assert.equal(evaluate(f,[qarth,'free-a'],{...options,itemStates}).opportunities.find(row=>row.id==='wrath-enemy-shield-gain').status,'item_not_enabled');
  assert.equal(evaluate(f,[qarth,'free-a'],{...options,itemRanks:{[qarth]:{level:20,rank:'V'}}}).opportunities.find(row=>row.id==='wrath-enemy-shield-gain').status,'item_rank_unconfirmed');
});

test('player shields and bare enemy tags do not establish a new enemy shield event',()=>{
  const f=fixture();
  const r=evaluate(f,[qarth,'enemy-shield'],{itemStates:{[qarth]:'enabled'},itemRanks:{[qarth]:{level:12,rank:'III'}},enemyMechanics:['shield']});
  assert.equal(r.opportunities.find(row=>row.id==='wrath-enemy-shield-gain').status,'enemy_trigger_unestablished');
});

test('leader enemy-Skill WRATH is separate, selected-leader only and has no CHARGE conversion',()=>{
  const f=fixture();
  const unselected=evaluate(f,[qarth,'free-a']);
  assert.equal(unselected.opportunities.find(row=>row.id==='wrath-leader-enemy-skill').status,'leader_not_selected');
  const selected=evaluate(f,[qarth,'free-a'],{leaderVariantId:qarth});
  assert.equal(selected.score,unselected.score);
  const clause=selected.opportunities.find(row=>row.id==='wrath-leader-enemy-skill');
  assert.equal(clause.status,'conditional_opportunity');assert.match(clause.text,/CHARGE II/);assert.match(clause.text,/not converted/);
});

test('equal direct-score compositions gain only the bounded corroborated faction difference',()=>{
  const f=fixture(),neutral=[qarth,'neutral-a','neutral-b','neutral-c','neutral-d'],paired=[qarth,'neutral-a','neutral-b','neutral-c','free-a'];
  const left=evaluateExactTeam({...f,targetId:'raid:test',variantIds:neutral,leaderVariantId:qarth});
  const right=evaluateExactTeam({...f,targetId:'raid:test',variantIds:paired,leaderVariantId:qarth});
  assert.equal(right.overallScore-left.overallScore,1);
  assert.equal(right.wrathSynergy.score,2);
  assert.ok(right.teamSynergy.some(row=>row.id==='wrath-free-cities-option'&&row.evidenceCategory==='strategy_inference'));
  const suggested=recommendTeam({...f,targetId:'raid:test',requiredVariantIds:[qarth,'neutral-a','neutral-b','neutral-c']});
  assert.equal(suggested.status,'ready');assert.ok(suggested.team.some(row=>row.champion.id.startsWith('free-')));
});

test('no faction premium when matched wording has no larger Free Cities event amount',()=>{
  const f=fixture();f.guideData.verifiedCollection.records[0].text=passive.replace('or 3 if','or 2 if');
  assert.equal(evaluate(f,[qarth,'free-a']).score,1);
  const invalid=fixture();invalid.guideData.verifiedCollection.records[0].text=passive.replace('gains 2 WRATH','gains 0 WRATH');
  assert.equal(evaluate(invalid,[qarth,'free-a']).status,'source_incomplete');
});

test('exact-team substitutes stay inside the imported collection',()=>{
  const f=fixture();
  const team=[qarth,'neutral-a','neutral-b','neutral-c','neutral-d'];
  const result=evaluateExactTeam({...f,targetId:'raid:test',variantIds:team,leaderVariantId:qarth});
  assert.ok(result.substitutes.every(row=>f.guideData.verifiedCollection.variantIds.includes(row.champion.id)));
});

test('resolving a tooltip does not silently enable an unimplemented support portfolio',()=>{
  const f=fixture();f.guideData.verifiedCollection.definitionGaps=[];
  f.guideData.verifiedCollection.supportModelGaps=[{variantId:'unknown',status:'support_model_unimplemented'}];
  assert.equal(evaluate(f,[qarth,'unknown']).score,0);
  assert.deepEqual(evaluate(f,[qarth,'unknown']).allyVariantIds,[]);
});
