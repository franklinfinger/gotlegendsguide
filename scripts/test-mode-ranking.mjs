import test from 'node:test';
import assert from 'node:assert/strict';
import { recommendMechanicTeam, recommendDistinctTeams, evaluateExactTeam, recommendTeam } from '../strategy-engine.js';
import { buildTeamOptions } from '../conversation-engine.js';

const ids = result => result.team.map(row=>row.champion.id).sort();
const observation = (id,stars=7) => ({variantId:id,stars,level:100,power:10000,captureDate:'2026-11-01',sourceFilenames:['SYNTHETIC.png'],provenanceRef:'synthetic:profile:'+id});
function fixture(rows,battleMode='raid') {
  const target={id:battleMode==='legendary-assault'?'legendary-assault:rhaegal':`${battleMode}:synthetic`,battleMode,name:'Synthetic target',evidenceState:'verified',approach:'Synthetic mechanics',timing:'Synthetic timing',warning:'Synthetic warning'};
  const champions=rows.map(([id,score,stars])=>({id,name:'Synthetic '+id,releaseState:'live',reviewStatus:'complete',factions:[],roles:[],gemColor:'Blue',...(stars===undefined?{}:{screenshotState:{development:observation(id,stars)}})}));
  const rule=(id,score,mechanicId='physical_damage')=>({id:'rule-'+id,kind:'target_fit',targetId:target.id,subjectVariantId:id,mechanicId,score,rationale:'Synthetic target fit',provenanceRef:'synthetic:rule',evidenceCategory:'strategy_inference',confidence:1});
  const fact=(id,mechanicId='physical_damage')=>({id:'fact-'+id,variantId:id,mechanicId,context:'skill',factText:'Synthetic '+mechanicId,provenanceRef:'synthetic:ability:'+id,reviewStatus:'complete',confidence:1,evidenceCategory:'verified_fact'});
  return {guideData:{champions,items:[],teams:[],factions:[],factionActivations:[],allyGems:[]},strategyData:{targets:[target],mechanics:[{id:'physical_damage',name:'Physical Damage',category:'damage'}],rules:rows.map(([id,score])=>rule(id,score)),championFacts:rows.map(([id])=>fact(id)),curatedRecommendations:[]},targetId:target.id,fact,rule};
}
const strong = ['a','b','c','d','e'].map(id=>[id,10,5]);
const developed = ['u','v','w','x','y'].map(id=>[id,1,7]);

test('Raid and War prefer sourced viable seven-stars without changing numeric mechanics scores',()=>{
  for (const mode of ['raid','war']) {
    const f=fixture([...strong,...developed],mode),before=JSON.stringify(f);
    const result=recommendMechanicTeam(f);
    assert.deepEqual(ids(result),['u','v','w','x','y']);
    assert.equal(result.overallScore,5);
    assert.ok(result.team.every(row=>row.score===1));
    assert.deepEqual(result.rankingPolicy.sevenStarContributorIds,ids(result));
    assert.equal(result.rankingPolicy.active,true);
    assert.equal(result.rankingPolicy.knownStarCount,5);
    assert.match(result.rankingPolicy.limitations.join(' '),/Missing champions or incomplete ability portfolios can change/);
    assert.equal(JSON.stringify(f),before,'ranking must not mutate source data');
    const exact=evaluateExactTeam({...f,variantIds:ids(result),leaderVariantId:'u'});
    assert.equal(exact.overallScore,result.overallScore);
  }
});

test('unknown or unbound stars, raw fields, level and power never supply preference',()=>{
  const f=fixture([...strong,...developed]);
  const invalid=[{variantId:'other'},{provenanceRef:null},{captureDate:null},{sourceFilenames:[]},{stars:null}];
  developed.forEach(([id],i)=>{
    const c=f.guideData.champions.find(row=>row.id===id);
    Object.assign(c,{stars:7,rawPower:99999999,power:99999999,level:999});
    Object.assign(c.screenshotState.development,invalid[i]);
  });
  const result=recommendMechanicTeam(f);
  assert.deepEqual(ids(result),['a','b','c','d','e']);
  assert.deepEqual(result.rankingPolicy.sevenStarContributorIds,[]);
  const unknown=fixture([...strong.map(([id,s])=>[id,s]),...developed.map(([id,s])=>[id,s])]);
  const missing=recommendMechanicTeam(unknown);
  assert.deepEqual(ids(missing),ids(result));
  assert.equal(missing.rankingPolicy.knownStarCount,0);
  assert.equal(missing.rankingPolicy.unknownStarCount,5);
});

test('star-only, neutral unsupported and net-negative-fit members get no preference, even with a positive component',()=>{
  const f=fixture([...strong,['n',0,7],['z',0,7],['bad',5,7]]);
  f.strategyData.championFacts=f.strategyData.championFacts.filter(row=>row.variantId!=='n');
  f.strategyData.rules.push(f.rule('bad',-15,'fire_damage'));
  f.strategyData.championFacts.push(f.fact('bad','fire_damage'));
  const result=recommendMechanicTeam(f);
  assert.deepEqual(ids(result),['a','b','c','d','e']);
  assert.deepEqual(result.rankingPolicy.sevenStarContributorIds,[]);
  const required=recommendMechanicTeam({...f,requiredVariantIds:['n','z','bad']});
  assert.ok(['n','z','bad'].every(id=>ids(required).includes(id)));
  assert.deepEqual(required.rankingPolicy.sevenStarContributorIds,[]);
});

test('a zero-direct-score seven-star member can qualify through active sourced faction synergy',()=>{
  const f=fixture([...strong,['z',0,7]]);
  f.guideData.factions=[{id:'synthetic-faction',name:'Synthetic Faction',memberVariantIds:['a','b','z'],rules:[{kind:'current_bonus',text:'Synthetic bonus'}]}];
  f.guideData.factionActivations=[{factionId:'synthetic-faction',requiredMembers:3,sourceId:'synthetic-faction-source'}];
  const result=recommendMechanicTeam(f);
  assert.ok(ids(result).includes('z'));
  assert.deepEqual(result.rankingPolicy.sevenStarContributorIds,['z']);
  assert.ok(result.factionBonuses.length);
  const absent=recommendMechanicTeam({...f,excludeVariantIds:['a']});
  assert.deepEqual(absent.rankingPolicy.sevenStarContributorIds,[]);
  const starOnly=JSON.parse(JSON.stringify(f));
  starOnly.strategyData.championFacts=starOnly.strategyData.championFacts.filter(row=>row.variantId!=='z');
  assert.deepEqual(recommendMechanicTeam(starOnly).rankingPolicy.sevenStarContributorIds,[]);
});

test('preference protects low-scoring sourced seven-stars beyond the initial 24-candidate pruning cutoff',()=>{
  const rows=[...Array.from({length:26},(_,i)=>['high-'+i,20,5]),...developed];
  const result=recommendMechanicTeam(fixture(rows));
  assert.deepEqual(ids(result),['u','v','w','x','y']);
  assert.equal(result.candidateStats.pruned,29);
});

test('synergy and selected leader remain decisive between equally developed viable members',()=>{
  const f=fixture([...developed,['z',0,7]]);
  f.strategyData.championFacts.push(f.fact('z','shield'));
  f.strategyData.rules.push({id:'synthetic-synergy',kind:'team_synergy',mechanicId:'physical_damage',pairedMechanicId:'shield',score:20,rationale:'Synthetic shield synergy',provenanceRef:'synthetic:synergy',confidence:1});
  f.strategyData.championFacts.push({...f.fact('z','leader_effect'),id:'leader-z',context:'leader'});
  const result=recommendMechanicTeam(f);
  assert.ok(ids(result).includes('z'));
  assert.equal(result.leader.champion.id,'z');
  assert.equal(result.rankingPolicy.sevenStarContributorIds.length,5);
  assert.ok(result.teamSynergy.some(row=>row.id==='synthetic-synergy'));
});

test('required and excluded exact variants stay binding and required slots have no substitute',()=>{
  const f=fixture([...strong,...developed]);
  const result=recommendMechanicTeam({...f,requiredVariantIds:['a'],excludeVariantIds:['u']});
  assert.deepEqual(ids(result),['a','v','w','x','y']);
  assert.equal(result.team.find(row=>row.champion.id==='a').substitute,null);
  assert.equal(recommendMechanicTeam({...f,requiredVariantIds:['a'],excludeVariantIds:['a']}).status,'no_feasible_team');
});

test('substitutes and alternative engine teams follow the same preference policy',()=>{
  const f=fixture([...strong,...developed,['z',.5,7],...['j','k','l','m','n'].map(id=>[id,.25,7])]);
  const result=recommendMechanicTeam(f);
  for(const member of result.team) {
    assert.equal(member.substitute.champion.screenshotState.development.stars,7);
    assert.equal(member.substitute.rankingPolicy.sevenStarContributorIds.length,5);
  }
  const options=recommendDistinctTeams({...f,limit:3});
  assert.ok(options.length>1);
  assert.ok(options.every(row=>row.rankingPolicy.active));
  assert.ok(options.every(row=>row.rankingPolicy.sevenStarContributorIds.length===5));
});

test('supplied exact and curated lineups and leaders are not reranked',()=>{
  const f=fixture([...strong,...developed]),variantIds=['e','d','c','b','a'];
  const exact=evaluateExactTeam({...f,variantIds,leaderVariantId:'c'});
  assert.deepEqual(exact.team.map(row=>row.champion.id),variantIds);
  assert.equal(exact.leader.champion.id,'c');
  assert.equal(exact.rankingPolicy.active,false);
  assert.equal(exact.rankingPolicy.suppliedLineupKeptExact,true);
  assert.throws(()=>evaluateExactTeam({...f,variantIds,leaderVariantId:'c',requiredVariantIds:['u']}),/required variant/);
  f.strategyData.curatedRecommendations=[{id:'synthetic-curated',targetId:f.targetId,active:true,reviewStatus:'reviewed',confidence:1,leaderVariantId:'c',members:variantIds.map(variantId=>({variantId}))}];
  const options=buildTeamOptions({...f,limit:2});
  assert.deepEqual(options[0].team.map(row=>row.champion.id),variantIds);
  assert.equal(options[0].leader.champion.id,'c');
  assert.equal(options[0].rankingPolicy.suppliedLineupKeptExact,true);
  assert.equal(options[1].rankingPolicy.active,true);
});

test('dragon selection, scores, leadership, substitutes and option order are invariant to all development fields',()=>{
  const f=fixture([...strong,...developed,...['j','k','l','m','n'].map(id=>[id,4,7])],'legendary-assault');
  const compact=result=>({ids:ids(result),score:result.overallScore,leader:result.leader?.champion.id,substitutes:result.team.map(row=>[row.champion.id,row.substitute?.champion.id,row.substitute?.projectedTeamScore])});
  const before=recommendTeam(f),options=recommendDistinctTeams({...f,limit:3});
  for (const c of f.guideData.champions) c.screenshotState={development:{...observation(c.id,c.id<'u'?7:1),level:999,power:999999999}};
  const after=recommendTeam(f),changedOptions=recommendDistinctTeams({...f,limit:3});
  assert.deepEqual(compact(after),compact(before));
  assert.deepEqual(changedOptions.map(compact),options.map(compact));
  assert.equal(after.rankingPolicy.active,false);
  assert.equal(after.rankingPolicy.id,'mechanics-and-synergy');
});


test('partial, historical, superseded and malformed combat facts cannot justify preference',()=>{
  const changes=[{reviewStatus:'partial'},{currentnessState:'historical_unconfirmed'},{sourceState:'superseded'},{mechanicId:undefined},{provenanceRef:null},{context:'metadata'}];
  for(const change of changes) {
    const f=fixture([...strong,['z',1,7]]);
    Object.assign(f.strategyData.championFacts.find(row=>row.variantId==='z'),change);
    const result=recommendMechanicTeam(f);
    assert.deepEqual(ids(result),['a','b','c','d','e'],JSON.stringify(change));
    assert.deepEqual(result.rankingPolicy.sevenStarContributorIds,[]);
  }
});


test('a complete unrelated fact cannot launder a partial synergy provider into preference',()=>{
  for(const badEvidence of [{reviewStatus:'partial'},{currentnessState:'historical_unconfirmed'},{provenanceRef:null}]) {
    const f=fixture([...strong,['z',0,7]]);
    f.strategyData.championFacts=f.strategyData.championFacts.filter(row=>row.variantId!=='z');
    f.strategyData.championFacts.push(f.fact('z','healing'),{...f.fact('z','shield'),...badEvidence});
    f.strategyData.rules.push({id:'partial-synergy',kind:'team_synergy',mechanicId:'physical_damage',pairedMechanicId:'shield',score:1,rationale:'Synthetic synergy',provenanceRef:'synthetic:synergy'});
    const result=recommendMechanicTeam(f);
    assert.deepEqual(ids(result),['a','b','c','d','e']);
    assert.deepEqual(result.rankingPolicy.sevenStarContributorIds,[]);
    // An exact lineup still receives the legacy numeric mechanics total.
    assert.equal(evaluateExactTeam({...f,variantIds:['a','b','c','d','z'],leaderVariantId:'a'}).overallScore,41);
  }
});

test('a complete unrelated fact cannot launder an unsourced or historical Leader into preference',()=>{
  for(const badEvidence of [{provenanceRef:null},{currentnessState:'historical_unconfirmed'}]) {
    const f=fixture([...strong,['z',0,7]]);
    f.strategyData.championFacts.push(f.fact('z','healing'),{...f.fact('z','leader_effect'),id:'leader-z',context:'leader',...badEvidence});
    const result=recommendMechanicTeam(f);
    assert.deepEqual(ids(result),['a','b','c','d','e']);
    assert.deepEqual(result.rankingPolicy.sevenStarContributorIds,[]);
    assert.equal(evaluateExactTeam({...f,variantIds:['a','b','c','d','z'],leaderVariantId:'z'}).overallScore,43);
  }
});

test('historical ally-card synergy keeps legacy mechanics points but receives no development preference',()=>{
  const f=fixture([...strong,['z',0,7]]);
  f.guideData.allyGems=[{id:'synthetic-ally-pair',ownerName:'Synthetic z',allyName:'Synthetic a',gemName:'Synthetic Gem',effect:'Synthetic ally effect',sourceId:'synthetic-pair-source',reviewState:'visually_verified',currentnessState:'historical_unconfirmed'}];
  const result=recommendMechanicTeam(f);
  assert.deepEqual(ids(result),['a','b','c','d','e']);
  assert.deepEqual(result.rankingPolicy.sevenStarContributorIds,[]);
  const current={...f,guideData:structuredClone(f.guideData)};
  current.guideData.allyGems[0].currentnessState='current';
  const selected=recommendMechanicTeam(current);
  assert.ok(ids(selected).includes('z'));
  assert.equal(selected.overallScore,48);
  assert.deepEqual(selected.rankingPolicy.sevenStarContributorIds,['z']);
});
