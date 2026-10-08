const normalize=value=>String(value||'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const baseName=value=>normalize(String(value||'').split(/\s+[—-]\s+/)[0]);
const complete=fact=>fact.reviewStatus==='complete'&&Number(fact.confidence)>=0.8&&fact.provenanceRef&&fact.context!=='metadata';
const cachedSynergy=new WeakMap();

function exactSourceVariant(name,champions) {
  const exact=champions.filter(row=>normalize(row.name)===normalize(name));
  if(exact.length===1)return exact[0];
  const base=champions.filter(row=>baseName(row.name)===baseName(name));
  return base.length===1?base[0]:null;
}

/** A bonus is called active only where a source shows its member threshold. */
export function activeFactionBonuses(members,guideData) {
  const ids=new Set(members.map(row=>(row.champion||row).id));
  return synergyIndex(guideData).factions.flatMap(({rule,faction,bonus,memberIds})=>{
    const contributors=memberIds.filter(id=>ids.has(id)).map(id=>synergyIndex(guideData).championById.get(id));
    return contributors.length>=rule.requiredMembers?[{factionName:faction.name,bonusText:bonus.text,contributors,requiredMembers:rule.requiredMembers,sourceId:rule.sourceId}]:[];
  }).sort((a,b)=>b.contributors.length-a.contributors.length||a.factionName.localeCompare(b.factionName));
}

/** Historical ally cards are displayed with their currentness caveat. */
export function verifiedAllyPairs(members,guideData) {
  const ids=new Set(members.map(row=>(row.champion||row).id));
  return synergyIndex(guideData).allyPairs.filter(row=>ids.has(row.owner.id)&&ids.has(row.ally.id));
}

function synergyIndex(guideData) {
  if(cachedSynergy.has(guideData))return cachedSynergy.get(guideData);
  const championById=new Map(guideData.champions.map(row=>[row.id,row]));
  const factions=(guideData.factionActivations||[]).flatMap(rule=>{
    const faction=guideData.factions.find(row=>row.id===rule.factionId);
    const bonus=faction?.rules.find(row=>row.kind==='current_bonus');
    return bonus?[{rule,faction,bonus,memberIds:faction.memberVariantIds}]:[];
  });
  const allyPairs=(guideData.allyGems||[]).flatMap(card=>{
    if(card.reviewState!=='visually_verified'||!card.effect||!card.sourceId)return [];
    const owner=exactSourceVariant(card.ownerName,guideData.champions);
    const ally=exactSourceVariant(card.allyName,guideData.champions);
    return owner&&ally&&owner.id!==ally.id?[{...card,owner,ally}]:[];
  });
  const index={championById,factions,allyPairs};cachedSynergy.set(guideData,index);return index;
}

function verifiedFacts(ids,leaderVariantId,strategyData) {
  const selected=new Set(ids),seen=new Set();
  return strategyData.championFacts.filter(fact=>{
    if(!selected.has(fact.variantId)||!complete(fact)||(fact.context==='leader'&&fact.variantId!==leaderVariantId))return false;
    const key=`${fact.variantId}|${fact.factText}`;
    if(seen.has(key))return false;
    seen.add(key);return true;
  });
}

/** Analyze five exact variants; no leader is inferred from the roster. */
export function analyzeRaidDefense({guideData,strategyData,enemyVariantIds,leaderVariantId=null}) {
  const ids=enemyVariantIds||[];
  if(ids.length!==5||new Set(ids).size!==5)return {status:'incomplete',members:[],factionBonuses:[],allyPairs:[],leader:null,highlights:[],facts:[],mechanics:[]};
  const members=ids.map(id=>guideData.champions.find(row=>row.id===id));
  if(members.some(row=>!row))throw new Error('The defense contains an unknown exact champion variant.');
  if(leaderVariantId&&!ids.includes(leaderVariantId))throw new Error('The enemy Leader must belong to the selected defense.');
  const leader=leaderVariantId?members.find(row=>row.id===leaderVariantId):null;
  const facts=verifiedFacts(ids,leaderVariantId,strategyData);
  const selected=new Set(ids);
  const mechanics=[...new Set(strategyData.championFacts.filter(fact=>selected.has(fact.variantId)&&complete(fact)&&(fact.context!=='leader'||fact.variantId===leaderVariantId)).map(row=>row.mechanicId))];
  const named=fact=>({champion:members.find(row=>row.id===fact.variantId),fact});
  const byText=pattern=>facts.filter(fact=>pattern.test(fact.factText)).map(named);
  const leaderFact=leader?facts.find(fact=>fact.variantId===leader.id&&fact.context==='leader'):null;
  const highlights=[];
  const ice=byText(/\bafflicts?\b[^.!?]{0,90}\bICE\b/i);
  const brittle=byText(/\bBRITTLE\b/i);
  if(ice.length&&brittle.length)highlights.push({title:'ICE / BRITTLE setup and payoff',text:`${[...new Set(ice.map(row=>row.champion.name))].join(', ')} can build ICE; ${[...new Set(brittle.map(row=>row.champion.name))].join(', ')} have verified BRITTLE interactions.`,facts:[...ice,...brittle]});
  const poison=byText(/\bafflicts?\b[^.!?]{0,90}\bPOISON\b/i);
  if(poison.length)highlights.push({title:'POISON pressure',text:`${[...new Set(poison.map(row=>row.champion.name))].join(', ')} can apply or extend POISON.`,facts:poison});
  const birthright=byText(/\bBIRTHRIGHT\b/i);
  const critical=byText(/\b(?:Critical Strike Chance|Critical Damage|Critically HEAL)\b/i);
  if(birthright.length&&critical.length)highlights.push({title:'BIRTHRIGHT and critical effects',text:`${[...new Set([...birthright,...critical].map(row=>row.champion.name))].join(', ')} have verified BIRTHRIGHT or critical interactions.`,facts:[...birthright,...critical]});
  const healing=byText(/\bHEALS?\b/i).filter(row=>/\b(?:all team members|all allies|team member|weakest ally)\b/i.test(row.fact.factText));
  if(healing.length)highlights.push({title:'Team sustain',text:`${[...new Set(healing.map(row=>row.champion.name))].join(', ')} have verified team healing.`,facts:healing});
  const control=byText(/\b(?:TAUNTS?|STUNS?|PACIF(?:Y|IES)|DECEIVES?)\b/i);
  if(control.length)highlights.push({title:'Control',text:`${[...new Set(control.map(row=>row.champion.name))].join(', ')} can disrupt targeting or turns.`,facts:control});
  const cleanse=byText(/\bREMOVES?\b[^.!?]{0,45}\b(?:Debuffs?|Buffs?)\b/i);
  if(cleanse.length)highlights.push({title:'Removal',text:`${[...new Set(cleanse.map(row=>row.champion.name))].join(', ')} have verified buff or debuff removal.`,facts:cleanse});
  return {status:leader?'ready':'leader_needed',members,factionBonuses:activeFactionBonuses(members,guideData),allyPairs:verifiedAllyPairs(members,guideData),leader,leaderFact,highlights,facts,mechanics,signature:`${ids.join('|')}|${leaderVariantId||''}`};
}

/** Team-level points are internal ranking signals, never a displayed power claim. */
export function raidTeamEvaluation(team,guideData,defense=null,leaderVariantId=null) {
  const factionBonuses=activeFactionBonuses(team,guideData);
  const allyPairs=verifiedAllyPairs(team,guideData);
  const teamMechanics=new Set(team.flatMap(member=>member.facts.filter(fact=>complete(fact)&&(fact.context!=='leader'||member.champion.id===leaderVariantId)).map(fact=>fact.mechanicId)));
  const enemy=new Set(defense?.mechanics||[]);
  const matchup=[];
  const add=(condition,score,text)=>{if(condition)matchup.push({score,text});};
  add((enemy.has('apply_ice')||enemy.has('brittle_payoff'))&&teamMechanics.has('stamina'),6,'Fast Skill access helps act before the ICE / BRITTLE cycle develops.');
  add((enemy.has('apply_ice')||enemy.has('apply_poison'))&&teamMechanics.has('cleanse'),7,'Cleanse addresses verified enemy status pressure.');
  add(enemy.has('apply_poison')&&teamMechanics.has('healing'),5,'Healing helps withstand verified POISON pressure.');
  add((enemy.has('taunt')||enemy.has('birthright'))&&teamMechanics.has('buff_removal'),5,'Buff removal can disrupt verified defensive effects.');
  add(!!defense?.leader&&teamMechanics.has('stun'),3,'STUN can create a tempo window against the selected Leader.');
  const factionWeight=defense?.mode==='war'?35:55;
  const factionScore=factionBonuses.reduce((sum,row,index)=>sum+(index===0?factionWeight:18)+Math.max(0,row.contributors.length-row.requiredMembers)*4,0);
  const allyScore=allyPairs.length*8;
  return {score:factionScore+allyScore+matchup.reduce((sum,row)=>sum+row.score,0),factionScore,allyScore,factionBonuses,allyPairs,matchup};
}

/** Pure state transition used by the Raid controls; every change drops results. */
export function raidSelectionTransition(previous,{enemyVariantIds,leaderVariantId}) {
  const ids=[...enemyVariantIds];
  const leader=ids.includes(leaderVariantId)?leaderVariantId:null;
  const signature=`${ids.join('|')}|${leader||''}`;
  return signature===previous.signature?previous:{enemyVariantIds:ids,leaderVariantId:leader,signature,analysis:null,recommendations:[]};
}

export function resetRaidSelection() {
  return {enemyVariantIds:['','','','',''],leaderVariantId:null,signature:'|||||',analysis:null,recommendations:[]};
}
