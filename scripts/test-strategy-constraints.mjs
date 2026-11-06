import test from 'node:test';
import assert from 'node:assert/strict';
import { recommendMechanicTeam as recommendTeam, recommendDistinctTeams } from '../strategy-engine.js';
import { answerStrategyQuestion, buildTeamOptions } from '../conversation-engine.js';
import { routeGuideQuestion } from '../knowledge-engine.js';
import { analyzeRaidDefense } from '../raid-engine.js';

// Synthetic facts exercise constraints, not claims about live game mechanics.
function fixture(count=9) {
  const champions=Array.from({length:count},(_,index)=>({id:index===0?'gregor':`ally-${index}`,name:index===0?'Gregor Clegane':`Ally ${index}`,releaseState:'live',reviewStatus:'complete',factions:[],roles:[]}));
  const targets=[['raid:defense','Raid defense','raid'],['raid:attack','Raid attack','raid'],['legendary-assault:drogon','Drogon','legendary-assault'],['war:ravenous-pack','Ravenous Pack','war']].map(([id,name,battleMode])=>({id,name,battleMode,evidenceState:'verified',approach:'Use sourced mechanics.',timing:'Use verified Skills.',warning:'No guaranteed outcome.'}));
  const fact=(id,mechanicId,context='skill')=>({id:`${id}-${mechanicId}-${context}`,variantId:id,mechanicId,context,factText:`Synthetic verified ${mechanicId} effect.`,confidence:1,reviewStatus:'complete',evidenceCategory:'verified_fact',provenanceRef:`source:${id}-${mechanicId}`});
  const championFacts=[...champions.map(row=>fact(row.id,'physical_damage')),fact('gregor','shield','item'),fact('ally-1','healing')];
  const mechanics=['physical_damage','shield','healing'].map(id=>({id,name:id.replaceAll('_',' '),category:id==='physical_damage'?'damage':'support'}));
  const rules=targets.flatMap(target=>['physical_damage','shield','healing'].map(mechanicId=>({id:`${target.id}-${mechanicId}`,kind:'target_fit',targetId:target.id,mechanicId,score:mechanicId==='shield'?30:10,rationale:`Synthetic ${mechanicId} battle fit.`,confidence:1,evidenceCategory:'strategy_inference',provenanceRef:`rule:${target.id}-${mechanicId}`})));
  rules.push({id:'shield-healing',kind:'team_synergy',mechanicId:'shield',pairedMechanicId:'healing',score:8,rationale:'Synthetic protection and sustain.',confidence:1,evidenceCategory:'strategy_inference',provenanceRef:'rule:shield-healing'});
  return {guideData:{champions,items:[{id:'helm',name:'Enshrouding Helm',ownerVariantId:'gregor'}],teams:[],factions:[],factionActivations:[],allyGems:[]},strategyData:{targets,mechanics,championFacts,rules,curatedRecommendations:[]}};
}
const ids=result=>result.team.map(row=>row.champion.id);
const options={targetId:'raid:defense',requiredVariantIds:['gregor']};

 test('required exact variant is retained even outside the candidate ranking cutoff',()=>{
  const data=fixture(30);
  data.strategyData.rules.push({id:'required-low-score',kind:'target_fit',targetId:'raid:defense',subjectVariantId:'gregor',mechanicId:'physical_damage',score:-100,rationale:'Synthetic low ranking.',confidence:1,evidenceCategory:'strategy_inference',provenanceRef:'test:low-score'});
  const result=recommendTeam({...data,...options});
  assert.equal(result.status,'ready');
  assert.equal(result.team.length,5);
  assert.ok(ids(result).includes('gregor'));
  assert.equal(result.team.find(row=>row.champion.id==='gregor').substitute,null);
});

test('required variants cannot be silently dropped for unknown, excluded or unavailable inputs',()=>{
  const data=fixture();
  for(const overrides of [{requiredVariantIds:['missing']},{excludeVariantIds:['gregor']},{requiredVariantIds:data.guideData.champions.slice(0,6).map(row=>row.id)}]) {
    const result=recommendTeam({...data,...options,...overrides});
    assert.notEqual(result.status,'ready');
    assert.equal(result.team.length,0);
  }
  const unavailable=structuredClone(data);
  unavailable.guideData.champions[0].releaseState='unverified';
  assert.notEqual(recommendTeam({...unavailable,...options}).status,'ready');
  assert.notEqual(recommendTeam({...fixture(4),...options}).status,'ready');
});

test('every returned alternative honors required variants',()=>{
  const data=fixture();
  for(const build of [recommendDistinctTeams,buildTeamOptions]) {
    const results=build({...data,...options,limit:3});
    assert.ok(results.length);
    for(const result of results)assert.ok(ids(result).includes('gregor'));
  }
});

test('Ask Guide carries explicitly requested champion and iconic item into the recommendation',()=>{
  const answer=answerStrategyQuestion({...fixture(),question:'Build a Raid defense team around Gregor Clegane with Enshrouding Helm. Explain how his iconic item works with the other four champions.'});
  assert.equal(answer.status,'ready');
  assert.ok(ids(answer.result).includes('gregor'));
  assert.ok(answer.result.team.find(row=>row.champion.id==='gregor').scoringContributions.some(row=>row.mechanicId==='shield'));
});

test('unknown required champion and ambiguous variant request clarify rather than choose',()=>{
  const data=fixture();
  assert.notEqual(answerStrategyQuestion({...data,question:'Build a Raid defense team around Unknown Person.'}).status,'ready');
  const ambiguous=structuredClone(data);
  ambiguous.guideData.champions[0].name='Gregor Clegane — The Mountain';
  ambiguous.guideData.champions[2].name='Gregor Clegane — Another Variant';
  assert.notEqual(answerStrategyQuestion({...ambiguous,question:'Build a Raid defense team around Gregor Clegane.'}).status,'ready');
  const exact=answerStrategyQuestion({...ambiguous,question:'Build a Raid defense team around Gregor Clegane — The Mountain.'});
  assert.equal(exact.status,'ready');
  assert.ok(ids(exact.result).includes('gregor'));
});

test('item facts score only when explicitly enabled, across Dragon, Raid and War',()=>{
  const data=fixture();
  for(const target of data.strategyData.targets) {
    for(const state of ['enabled','disabled','unknown']) {
      const result=recommendTeam({...data,...options,targetId:target.id,itemStates:{gregor:state}});
      assert.equal(result.status,'ready');
      const member=result.team.find(row=>row.champion.id==='gregor');
      assert.equal(member.scoringContributions.some(row=>row.mechanicId==='shield'),state==='enabled',`${target.id}/${state}`);
      assert.equal(result.teamSynergy.some(row=>row.id==='shield-healing'),state==='enabled',`${target.id}/${state} synergy`);
      if(state!=='enabled')assert.ok(!member.reasons.some(row=>row.fact?.includes('shield')));
    }
    const unknown=recommendTeam({...data,...options,targetId:target.id});
    assert.ok(!unknown.team.find(row=>row.champion.id==='gregor').scoringContributions.some(row=>row.mechanicId==='shield'));
  }
});

test('enemy item effects are not assumed when equipment is unknown or disabled',()=>{
  const data=fixture();
  for(const state of ['enabled','disabled','unknown']) {
    const defense=analyzeRaidDefense({...data,enemyVariantIds:data.guideData.champions.slice(0,5).map(row=>row.id),itemStates:{gregor:state}});
    assert.equal(defense.mechanics.includes('shield'),state==='enabled');
    assert.equal(defense.facts.some(row=>row.context==='item'),state==='enabled');
  }
});

test('synergy explanation identifies actual selected contributors',()=>{
  const result=recommendTeam({...fixture(),...options,itemStates:{gregor:'enabled'}});
  const synergy=result.teamSynergy.find(row=>row.id==='shield-healing');
  assert.ok(synergy);
  assert.match(synergy.text,/Gregor Clegane/);
  assert.match(synergy.text,/Ally 1/);
});

test('actual Ask router preserves constrained battle request and repeated context',()=>{
  const data=fixture();
  const question='Build a Raid defense team around Gregor Clegane with Enshrouding Helm. Explain how his iconic item works with the other four champions.';
  assert.equal(routeGuideQuestion(question,data).intent,'battle_recommendation');
  const first=answerStrategyQuestion({...data,question});
  const why=answerStrategyQuestion({...data,question:'Why this team?',context:first.context});
  assert.ok(ids(why.result).includes('gregor'));
  assert.equal(why.context.itemStates.gregor,'enabled');
  const disabled=answerStrategyQuestion({...data,question:'Build a Raid defense team around Gregor Clegane without Enshrouding Helm.',context:first.context});
  assert.equal(disabled.status,'ready');
  assert.ok(ids(disabled.result).includes('gregor'));
  assert.equal(disabled.result.team.find(row=>row.champion.id==='gregor').itemState,'disabled');
  const alternative=answerStrategyQuestion({...data,question:'Another team',context:first.context});
  if(alternative.status==='ready')assert.ok(ids(alternative.result).includes('gregor'));
  const conflict=answerStrategyQuestion({...data,question:'Build a Raid defense team around Gregor Clegane.',context:{targetId:'raid:defense',excludedVariantIds:['gregor']}});
  assert.equal(conflict.status,'no_feasible_team');
});

test('contextual Ask routing handles explanations, item toggles, and alternatives',()=>{
  const data=fixture(),first=answerStrategyQuestion({...data,question:'Build a Raid defense team around Gregor Clegane.'});
  for(const question of ['Why Gregor?','Enable Enshrouding Helm','Another option'])assert.equal(routeGuideQuestion(question,{...data,context:first.context}).intent,'battle_recommendation');
  const enabled=answerStrategyQuestion({...data,question:'Enable Enshrouding Helm',context:first.context});
  assert.equal(enabled.result.team.find(row=>row.champion.id==='gregor').itemState,'enabled');
  const disabled=answerStrategyQuestion({...data,question:'Disable Enshrouding Helm',context:enabled.context});
  assert.equal(disabled.result.team.find(row=>row.champion.id==='gregor').itemState,'disabled');
});

test('supplied opposing variants affect matchup evaluation without inferred equipment or leader',()=>{
  const data=fixture(12);
  data.strategyData.championFacts.push({id:'enemy-poison',variantId:'ally-10',mechanicId:'apply_poison',context:'skill',factText:'Synthetic poison application.',reviewStatus:'complete',confidence:1,provenanceRef:'test:poison'});
  const base={...data,question:'Build a Raid attack team around Ally 1.'};
  const neutral=answerStrategyQuestion({...base,enemyVariantIds:['ally-5','ally-6','ally-7','ally-8','ally-9']});
  const poison=answerStrategyQuestion({...base,enemyVariantIds:['ally-5','ally-6','ally-7','ally-8','ally-10']});
  assert.equal(neutral.result.matchupReasons.some(row=>/POISON/.test(row.text)),false);
  assert.equal(poison.result.matchupReasons.some(row=>/POISON/.test(row.text)),true);
  assert.equal(poison.context.enemyLeaderVariantId,null);
  assert.equal(answerStrategyQuestion({...base,enemyVariantIds:['missing']}).status,'needs_clarification');
});

test('required champion and item parsing tolerates reordered battle clauses',()=>{
  const data=fixture();
  for(const question of [
    'Build a team around Gregor Clegane with Enshrouding Helm for Raid defense',
    'Build a Raid defense team with Gregor Clegane with Enshrouding Helm',
  ]) {
    const answer=answerStrategyQuestion({...data,question});
    assert.equal(answer.status,'ready',question);
    assert.ok(ids(answer.result).includes('gregor'));
    assert.equal(answer.result.team.find(row=>row.champion.id==='gregor').itemState,'enabled');
  }
});

test('curated lineup preserves a required lock even with incomplete encounter mechanics',()=>{
  const data=fixture();
  data.strategyData.targets[0].evidenceState='insufficient';
  data.strategyData.curatedRecommendations=[{id:'official',targetId:'raid:defense',active:true,reviewStatus:'reviewed',confidence:1,leaderVariantId:'gregor',members:data.guideData.champions.slice(0,5).map(row=>({variantId:row.id}))}];
  const answer=answerStrategyQuestion({...data,question:'Build a Raid defense team around Gregor Clegane.'});
  assert.equal(answer.status,'ready');
  assert.equal(answer.result.recommendationSource,'curated');
  assert.equal(answer.result.team.find(row=>row.champion.id==='gregor').substitute,null);
  assert.match(answer.result.evidenceTier,/incomplete/);
});

test('canonical Gregor and Helm wording survives the routed recommendation without invented item mechanics',()=>{
  const data=fixture();
  // Canonical source: data/audit/reconciled-knowledge.sqlite,
  // champions(4), champion_skills(1)/source 9, iconic_abilities(1)/source 10.
  // Other champions remain synthetic; this is not a claimed live best lineup.
  data.guideData.champions[0]={...data.guideData.champions[0],id:'sqlite-champion-4',gemColor:'Green',factions:['Lannister']};
  const wording='When Gregor Critically Strikes an enemy with his Skill, he REMOVES all RENEW from that enemy and spawns 3 Coin Gems. Gregor is immune to POISON, BLEED, and BRITTLE.';
  data.guideData.items=[{id:'sqlite-iconic-item-1',name:'Enshrouding Helm',ownerVariantId:'sqlite-champion-4',abilities:[{name:'The Monster Unleashed V',text:wording,reviewStatus:'complete',sourceId:10}]}];
  data.strategyData.championFacts=data.strategyData.championFacts.filter(row=>row.variantId!=='gregor');
  data.strategyData.championFacts.push({id:'gregor-skill',variantId:'sqlite-champion-4',mechanicId:'physical_damage',context:'skill',factText:'Your Gods Have Forsaken You!: Gregor deals 300% ATK Physical Damage to all enemies and has a 50% chance to WOUND them for 3 turns.',reviewStatus:'complete',confidence:1,evidenceCategory:'verified_fact',provenanceRef:'source:9'});
  const question='Build a Raid defense team around Gregor Clegane with Enshrouding Helm. Explain how his iconic item works with the other four champions.';
  assert.equal(routeGuideQuestion(question,data).intent,'battle_recommendation');
  const answer=answerStrategyQuestion({...data,question}),member=answer.result.team.find(row=>row.champion.id==='sqlite-champion-4');
  assert.equal(answer.result.team.length,5);
  assert.equal(member.itemState,'enabled');
  assert.equal(member.item.abilities[0].text,wording);
  assert.equal(member.scoringContributions.some(row=>row.mechanicId==='shield'),false);
  assert.match(member.reasons[0].fact,/50% chance to WOUND/);
  assert.match(answer.result.missingDataWarnings.join(' '),/stated in-battle triggers/);
});

test('changing only the enemy Leader invalidates cached alternative rankings',()=>{
  const data=fixture(12),enemyVariantIds=['ally-5','ally-6','ally-7','ally-8','ally-9'];
  const first=answerStrategyQuestion({...data,question:'Build a Raid attack team.',enemyVariantIds,enemyLeaderVariantId:'ally-5'});
  assert.ok(first.options.length>1);
  const context={...first.context,options:first.options.map(row=>({...row,overallScore:-999}))};
  const changed=answerStrategyQuestion({...data,question:'Another option',context,enemyLeaderVariantId:'ally-6'});
  assert.equal(changed.status,'ready');
  assert.equal(changed.context.enemyLeaderVariantId,'ally-6');
  assert.notEqual(changed.result.overallScore,-999);
});

test('confirmed timed conditional setup changes team selection without changing flat champion scores',()=>{
  const data=fixture(6),gregor='sqlite-champion-4',olenna='sqlite-champion-17';
  const remap=id=>id==='gregor'?gregor:id==='ally-5'?olenna:id;
  data.guideData.champions=data.guideData.champions.map(row=>({...row,id:remap(row.id),name:row.id==='ally-5'?'Z source-backed Olenna':row.name}));
  data.guideData.items=data.guideData.items.map(row=>({...row,ownerVariantId:remap(row.ownerVariantId)}));
  data.strategyData.championFacts=data.strategyData.championFacts.filter(row=>row.context!=='item').map(row=>({...row,variantId:remap(row.variantId)}));
  const args={...data,targetId:'raid:defense',requiredVariantIds:[gregor,'ally-1','ally-2','ally-3'],itemStates:{[gregor]:'enabled'},itemRanks:{[gregor]:{rank:'V',level:20}}};
  const baseline=recommendTeam(args);
  assert.equal(ids(baseline).includes(olenna),false);
  const timed={currentnessAssumptionSourceIds:[10,83],turn:1,buffAppliedTurns:{'olenna-critical':1}};
  const supported=recommendTeam({...args,effectContext:timed});
  assert.ok(ids(supported).includes(olenna));
  assert.equal(supported.overallScore,baseline.overallScore+2);
  assert.equal(supported.conditionalEffects.scoringContribution,2);
  assert.ok(supported.teamSynergy.some(row=>row.id==='conditional-gregor-helm-critical'&&row.score===2));
  const unknownRank=recommendTeam({...args,itemRanks:{},effectContext:timed});
  assert.equal(ids(unknownRank).includes(olenna),false);
  const noSourceConfirmation=recommendTeam({...args,effectContext:{...timed,currentnessAssumptionSourceIds:[]}});
  assert.equal(ids(noSourceConfirmation).includes(olenna),false);
});

test('changing battle or opposing team clears transient effect context, not collection rank facts',()=>{
  const data=fixture();
  const initial=answerStrategyQuestion({...data,question:'Build a Raid defense team.',itemRanks:{gregor:{rank:'V',level:20}},effectContext:{enemyStatuses:['renew'],turn:2,treasuryCoins:6,warPhase:3}});
  const changed=answerStrategyQuestion({...data,question:'Build a Raid attack team.',context:initial.context});
  assert.deepEqual(changed.context.effectContext,{});
  assert.deepEqual(changed.context.itemRanks,{gregor:{rank:'V',level:20}});
  const attack=answerStrategyQuestion({...data,question:'Build a Raid attack team.',effectContext:{enemyStatuses:['renew'],turn:2}});
  const enemyChanged=answerStrategyQuestion({...data,question:'Build a Raid attack team.',context:attack.context,enemyVariantIds:['ally-1','ally-2','ally-3','ally-4','ally-5']});
  assert.deepEqual(enemyChanged.context.effectContext,{});
});

test('existing Raid team substitution preserves four slots and reports infeasibility instead of rebuilding',()=>{
  const data=fixture();
  const first=answerStrategyQuestion({...data,question:'Build a Raid defense team.'});
  const subject=first.result.team[0].champion;
  const follow=answerStrategyQuestion({...data,question:`Replace ${subject.name}`,context:first.context});
  assert.equal(follow.status,'ready');
  const kept=first.result.team.filter(row=>row.champion.id!==subject.id).map(row=>row.champion.id);
  assert.ok(kept.every(id=>follow.result.team.some(row=>row.champion.id===id)));
  assert.equal(follow.replacementPlan.preservedVariantIds.length,4);
  const limited={...data,guideData:{...data.guideData,champions:first.result.team.map(row=>row.champion)}};
  const impossible=answerStrategyQuestion({...limited,question:`Replace ${subject.name}`,context:first.context});
  assert.notEqual(impossible.status,'ready');
  assert.match(impossible.message,/one-slot replacement|other four/i);
});
