import { collectionExclusions, collectionWarnings } from './verified-handoff.js';
import { capturedPrebattleNotes } from './prebattle-source-notes.js';
import { prebattleCapabilities, prebattleProfiles, drogonPlanRules } from './prebattle-catalog.js';
import { mechanicCurrentnessIssue, factionCurrentnessIssue } from './mechanics-currentness.js';

const normalize=value=>String(value||'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const baseName=value=>normalize(String(value||'').split(/\s+[—-]\s+/)[0]);
const exactText=value=>String(value||'').replace(/\s+/g,' ').trim();
const rankValue=value=>({I:'1',II:'2',III:'3',IV:'4',V:'5',VI:'6',VII:'7',VIII:'8',IX:'9',X:'10'}[String(value||'').toUpperCase()]||String(value||''));
const unique=rows=>[...new Set(rows)];
const bossRef=id=>'legendary_assault_ability:'+id;
const sourceRef=cap=>cap.source.provenanceRef||'source:'+cap.source.sourceId;
const cached=new WeakMap();
const IMMUNE_STATUSES=new Set(['fire','poison','ice','raid','stun','deceive','pacify']);

/** Use this interpretation only when the supplied encounter wording matches its
 * reviewed source. It is a partial plan model, not a replacement game simulator. */
export function supportsPrebattleTarget(guideData,targetId) {
  if(targetId!==drogonPlanRules.targetId)return false;
  const boss=guideData.legendaryAssault?.find(row=>row.id===drogonPlanRules.encounterId);
  return !!boss&&drogonPlanRules.abilities.every(expected=>boss.abilities.some(row=>row.id===expected.id&&exactText(row.text)===exactText(expected.text)&&row.reviewStatus==='complete'));
}

function model(guideData) {
  if(cached.has(guideData))return cached.get(guideData);
  const championById=new Map(guideData.champions.map(row=>[row.id,row]));
  const textBySource=new Map();
  const typedRows=[...(guideData.abilities||[]).map(row=>({...row,table:'champion_skills'})),...(guideData.traits||[]).map(row=>({...row,table:'champion_traits'})),...(guideData.items||[]).flatMap(item=>(item.abilities||[]).map(row=>({...row,variantId:item.ownerVariantId,table:'iconic_abilities'})))];
  for(const row of typedRows) {
    const key=row.variantId+':'+row.table;
    if(!textBySource.has(key))textBySource.set(key,new Set());
    if(row.reviewStatus==='complete')textBySource.get(key).add(exactText(row.text));
  }
  const capabilities=prebattleCapabilities.map(cap=>{
    // The audited guide_ability source is a Skill record, not an iconic/trait.
    const sourceTable=cap.source.table==='guide_ability'?'champion_skills':cap.source.table;
    const kind={champion_skills:'skill',champion_traits:'trait',iconic_abilities:'item'}[sourceTable];
    const reviewed=guideData.verifiedCollection?.records.find(row=>row.variantId===cap.variantId&&row.kind===kind&&row.reviewStatus==='complete'&&exactText(row.text)===exactText(cap.source.exactText));
    const source=reviewed?{...cap.source,provenanceRef:reviewed.provenanceRef+':'+reviewed.sourceFilenames.join(','),captureDate:reviewed.captureDate,currentness:'screenshot_captured'}:cap.source;
    const itemEvidence=reviewed?.kind==='item'?{itemRank:reviewed.itemRank||null,itemLevel:reviewed.itemLevel??null}:{};
    return {...cap,...itemEvidence,source,currentnessIssue:mechanicCurrentnessIssue(cap),sourceMatched:cap.source.reviewStatus==='complete'&&!!textBySource.get(cap.variantId+':'+sourceTable)?.has(exactText(cap.source.exactText))};
  }).filter(cap=>!guideData.privateCollection?.latestEvidenceOnly || (cap.sourceMatched && cap.source.currentness==='screenshot_captured'));
  const profiles=new Map(prebattleProfiles.map(row=>{
    const skill=guideData.verifiedCollection?.records.find(record=>record.variantId===row.variantId&&record.kind==='skill'&&record.reviewStatus==='complete');
    return [row.variantId,skill?{...row,skillSpeed:skill.staminaSpeed,sourceRef:skill.provenanceRef+':'+skill.sourceFilenames.join(',')}:row];
  }));
  const identity=guideData.identityChampions||guideData.champions;
  const factionIndex=new Map((guideData.factions||[]).map(faction=>[normalize(faction.name),new Set(faction.memberVariantIds.filter(id=>championById.get(id)?.factions.some(name=>normalize(name)===normalize(faction.name))))]));
  const value={championById,capabilities,profiles,identity,factionIndex};
  cached.set(guideData,value);return value;
}

function factionMembers(guideData,name,ids) {
  const members=model(guideData).factionIndex.get(normalize(name));
  return ids.filter(id=>members?.has(id));
}

function resolveCardName(name,identity) {
  const full=normalize(name),family=baseName(name);
  const variants=identity.filter(row=>baseName(row.name)===family);
  // A bare character name cannot select one variant just because that variant
  // also happens to have a bare catalog label.
  if(full===family&&variants.length!==1)return null;
  const exact=identity.filter(row=>normalize(row.name)===full);
  return exact.length===1?exact[0]:null;
}

export function inspectPrebattleAllyPairs(guideData,variantIds) {
  const ids=new Set(variantIds),identity=model(guideData).identity;
  return (guideData.allyGems||[]).flatMap(card=>{
    const owner=resolveCardName(card.ownerName,identity),ally=resolveCardName(card.allyName,identity);
    const relevant=variantIds.some(id=>[baseName(card.ownerName),baseName(card.allyName)].includes(baseName(model(guideData).championById.get(id)?.name)));
    if(!relevant)return [];
    if(!owner||!ally)return [{...card,status:'ambiguous_variant',score:0,reason:'Historical card identity is not resolved to two unique exact variants; no pair activation is inferred.'}];
    if(!ids.has(owner.id)||!ids.has(ally.id))return [];
    return [{...card,owner,ally,status:'conditional_currentness',score:0,reason:'Exact pair is present, but card currentness and in-battle Gem availability/activation are not established; no active bonus or ranking credit is assumed.'}];
  });
}

function inspectFactions(guideData,ids) {
  return (guideData.factions||[]).flatMap(faction=>{
    const contributors=factionMembers(guideData,faction.name,ids);
    if(!contributors.length)return [];
    const activation=(guideData.factionActivations||[]).find(row=>row.factionId===faction.id&&Number.isInteger(row.requiredMembers)&&row.requiredMembers>0&&row.sourceId);
    const bonus=faction.rules.find(row=>row.kind==='current_bonus');
    const currentnessIssue=factionCurrentnessIssue(faction);
    return [{name:faction.name,contributors,requiredMembers:activation?.requiredMembers||null,sourceId:activation?.sourceId||null,bonusText:bonus?.text||null,currentnessIssue,status:currentnessIssue?'currentness_blocked':activation&&bonus&&contributors.length>=activation.requiredMembers?'supported_threshold':'threshold_unverified',score:0}];
  });
}

function recipients(cap,ids,guideData) {
  if(cap.recipients==='self')return ids.includes(cap.variantId)?[cap.variantId]:[];
  if(['team','skill_user'].includes(cap.recipients))return ids;
  if(cap.recipients==='faction')return factionMembers(guideData,cap.faction,ids);
  // Target choice and reactive identity are not silently expanded into team-wide buffs.
  return [];
}

/** Evaluate a feasible potential sequence, without claiming buffs already active.
 * Points are explicitly capped composition heuristics, not damage or win odds. */
export function evaluatePrebattlePlan({guideData,strategyData,targetId,variantIds,leaderVariantId=null,itemStates={},itemRanks={},allowPartial=false,scoreOnly=false}) {
  const fail=(status,message)=>({status,message,score:0,contributions:[],dependencies:[],steps:[],risks:[],unknowns:[],members:[],capabilities:[]});
  if(!supportsPrebattleTarget(guideData,targetId))return fail('unsupported_target','Reviewed prebattle encounter wording is unavailable or has changed.');
  const ids=variantIds||[],m=model(guideData);
  if((!allowPartial&&ids.length!==5)||ids.length>5||new Set(ids).size!==ids.length||ids.some(id=>!m.championById.has(id)))return fail('needs_clarification','Specify five distinct known exact variants.');
  const excluded=new Set(collectionExclusions(guideData));
  if(ids.some(id=>excluded.has(id)))return fail('no_feasible_team','The exact lineup includes a variant outside the active imported collection. Resolve that exact identity or ownership before evaluating it; another variant cannot supply its abilities.');
  if(leaderVariantId&&!ids.includes(leaderVariantId))return fail('needs_clarification','The Leader must be a member of the exact team.');
  const names=values=>scoreOnly?'':values.map(id=>m.championById.get(id)?.name||id).join(', ');
  const contributions=[],dependencies=[],risks=[],unknowns=[];
  const selected=m.capabilities.filter(cap=>ids.includes(cap.variantId));
  const biding=new Set(selected.filter(cap=>cap.kind==='bide'&&cap.sourceMatched).map(cap=>cap.variantId));
  const openingBank=selected.filter(cap=>cap.kind==='treasury_grant'&&cap.trigger==='battle_start'&&cap.sourceMatched&&(!cap.leaderOnly||cap.variantId===leaderVariantId));
  const capabilities=selected.map(cap=>{
    let status='feasible',reason='Source-backed potential effect; it still needs its documented trigger.';
    if(cap.currentnessIssue){status='blocked';reason=cap.currentnessIssue.message;}
    else if(!cap.sourceMatched){status='blocked';reason='Complete source wording does not match the supplied catalog; no effect credit.';}
    else if(cap.leaderOnly&&cap.variantId!==leaderVariantId){status='blocked';reason='Only the selected exact Leader supplies this effect.';}
    else if(cap.itemRequired&&(!cap.itemRank||!Number.isInteger(cap.itemLevel)||cap.itemLevel<=0||itemStates[cap.variantId]!=='enabled'||rankValue(itemRanks[cap.variantId]?.rank)!==rankValue(cap.itemRank)||itemRanks[cap.variantId]?.level!==cap.itemLevel)){status='conditional';reason='Iconic item enablement and the source rank/level are not confirmed; no default plan credit.';}
    else if(cap.condition==='not_dragons'){status='blocked';reason='This effect explicitly does not apply to Dragons.';}
    else if(cap.kind==='status_apply'&&IMMUNE_STATUSES.has(normalize(cap.status))){status='blocked';reason='Drogon is immune to this status. This does not imply immunity to direct Fire Damage.';}
    else if(cap.condition==='after_bide'||biding.has(cap.variantId)&&['opening_stamina','skill_damage'].includes(cap.kind)){status='conditional';reason='BIDE must clear before action/Stamina access; opening Stamina is not an available opening Skill.';}
    else if(['enemy_defeat','owner_defeat'].includes(cap.condition)||['owner_enemy_defeat','first_enemy_defeat','owner_defeat'].includes(cap.trigger)){status='conditional';reason='Defeat-triggered effects cannot sustain a pre-defeat plan against the single boss.';}
    else if(cap.condition==='treasury_cost'){
      if(openingBank.some(bank=>bank.amount>=cap.treasuryCost)){reason='A selected opening Treasury source can cover the first cost only if banked coins remain unspent; future repeated payment is unproven.';}
      else {status='conditional';reason='No selected source establishes enough opening banked Treasury; Coin Gems and future HP-Guard income are not an opening balance.';}
    } else if(cap.condition&&!['damages_strongest'].includes(cap.condition)){status='conditional';reason='Requires '+cap.condition.replaceAll('_',' ')+'; this prerequisite is not automatically present.';}
    else if(cap.chance!=null&&cap.chance<1){status='conditional';reason='Chance-based trigger is not a dependable setup or expected-value calculation.';}
    else if(!['skill_use','battle_start','ally_skill_use','enemy_skill_use','ally_skill_damages_strongest'].includes(cap.trigger)){status='conditional';reason='Reactive trigger '+cap.trigger.replaceAll('_',' ')+' is not an already active effect.';}
    return {...cap,appliedStatus:cap.kind==='status_apply'?cap.status:null,status,reason};
  });
  const sourceReferenceNotes=scoreOnly?[]:capturedPrebattleNotes({guideData,variantIds:ids,leaderVariantId,capabilities,itemStates});
  for(const cap of capabilities.filter(row=>row.currentnessIssue))if(sourceReferenceNotes.some(row=>row.variantId===cap.variantId&&row.kind==='trait'&&(row.context==='leader')===!!cap.leaderOnly))cap.reason='This historical effect is superseded and receives no planning credit. Current captured wording is shown separately under effects outside the scoring model; it is not converted to the old Stamina quantities.';
  const feasible=kind=>capabilities.filter(cap=>cap.kind===kind&&cap.status==='feasible');
  const add=(id,score,variantIds,sourceRefs,text)=>{
    if(!score)return;
    contributions.push({id,score,variantIds:unique(variantIds),sourceRefs:unique(sourceRefs),text,evidenceCategory:'strategy_inference'});
  };
  const birthrightProviders=[...feasible('birthright_grant').filter(cap=>cap.trigger==='skill_use'),...feasible('birthright_opening')];
  const bearerIds=unique(birthrightProviders.flatMap(cap=>recipients(cap,ids,guideData)));
  for(const cap of birthrightProviders) {
    const beneficiaries=recipients(cap,ids,guideData);
    if(!beneficiaries.length)continue;
    if(!scoreOnly)dependencies.push({kind:'birthright_boss_payoff',capabilityId:cap.id,providerVariantId:cap.variantId,beneficiaryVariantIds:beneficiaries,sourceRefs:[sourceRef(cap),bossRef('drogon-daznaks-fury'),'source:545'],text:`${names([cap.variantId])} can supply BIRTHRIGHT to ${names(beneficiaries)} via ${cap.trigger.replaceAll('_',' ')}. Daznak's Fury checks bearers at turn start; marks decay and the sequence is not guaranteed.`});
  }
  add('birthright-coverage',Math.min(20,bearerIds.length*4),bearerIds,birthrightProviders.map(sourceRef).concat(bossRef('drogon-daznaks-fury')),`${bearerIds.length} selected champions have a sourced potential BIRTHRIGHT route to the boss's turn-start payoff; not a predicted damage total.`);
  const openingBirthright=unique(feasible('birthright_opening').flatMap(cap=>recipients(cap,ids,guideData)));
  add('opening-birthright',Math.min(6,openingBirthright.length*2),openingBirthright,feasible('birthright_opening').map(sourceRef),'Sourced opening BIRTHRIGHT reduces dependence on first charging a provider Skill.');

  const readyFast=ids.filter(id=>!biding.has(id)&&['Fast','Very Fast'].includes(m.profiles.get(id)?.skillSpeed)&&capabilities.some(cap=>cap.variantId===id&&cap.sourceMatched&&cap.source.table==='champion_skills'));
  add('fast-skill-access',Math.min(6,readyFast.length*2),readyFast,readyFast.map(id=>m.profiles.get(id).sourceRef).concat(bossRef('drogon-brimstone-rain-ii')),'Fast/Very Fast source speeds supply possible alternating Skill users; gem charging still determines availability.');
  const openers=feasible('opening_stamina').filter(cap=>cap.amount>=50&&!biding.has(cap.variantId));
  const openerIds=unique(openers.flatMap(cap=>recipients(cap,ids,guideData)).filter(id=>!biding.has(id)));
  add('opening-stamina',Math.min(6,openerIds.length*2),openerIds,openers.map(sourceRef),'Sourced opening Stamina helps start the Skill plan; it is not a guaranteed turn-one cast.');

  const freeCities=factionMembers(guideData,'Free Cities',ids).filter(id=>capabilities.some(cap=>cap.variantId===id&&cap.trigger==='skill_use'&&cap.sourceMatched));
  for(const id of freeCities)if(!scoreOnly)dependencies.push({kind:'skill_refund',providerVariantId:null,beneficiaryVariantIds:[id],capabilityId:'drogon-free-cities-refund',sourceRefs:[bossRef('drogon-daznaks-fury')],text:`${names([id])} is Free Cities: the encounter source returns 30% Stamina after that champion uses a Skill. This is not a faction-threshold bonus or opening Stamina.`});
  add('free-cities-refund',Math.min(6,freeCities.length*2),freeCities,[bossRef('drogon-daznaks-fury')],'Exact Free Cities membership supplies post-Skill encounter refunds, independent of unverified faction activation thresholds.');
  const leaderRefunds=feasible('stamina_refund').filter(cap=>cap.leaderOnly&&['ally_skill_use','ally_skill_damages_strongest'].includes(cap.trigger));
  const leaderRecipients=cap=>recipients(cap,ids,guideData).filter(id=>cap.trigger!=='ally_skill_damages_strongest'||feasible('skill_damage').some(damage=>damage.variantId===id&&damage.trigger==='skill_use'));
  const leaderReceivers=unique(leaderRefunds.flatMap(leaderRecipients));
  for(const cap of leaderRefunds)if(!scoreOnly)dependencies.push({kind:'skill_refund',capabilityId:cap.id,providerVariantId:cap.variantId,beneficiaryVariantIds:leaderRecipients(cap),sourceRefs:[sourceRef(cap)],text:`${names([cap.variantId])} as Leader can refund ${names(leaderRecipients(cap))} after their eligible Skill${cap.trigger==='ally_skill_damages_strongest'?' damages the sole boss (the strongest enemy); healing-only Skills do not qualify':''}${cap.maxPerBattle?`, limited to ${cap.maxPerBattle} triggers per battle and once per turn`:''}. Separate refunds are not numerically summed without stacking evidence.`});
  add('leader-refund',Math.min(6,leaderReceivers.length),leaderReceivers,leaderRefunds.map(sourceRef),'The chosen Leader supplies a source-compatible post-Skill recovery route; finite trigger limits remain in the plan.');
  const targeted=feasible('stamina_grant').filter(cap=>cap.trigger==='skill_use'&&['target_ally','team'].includes(cap.recipients));
  for(const cap of targeted)if(!scoreOnly)dependencies.push({kind:'targeted_charge',capabilityId:cap.id,providerVariantId:cap.variantId,beneficiaryVariantIds:ids.filter(id=>id!==cap.variantId),sourceRefs:[sourceRef(cap)],text:`After charging ${names([cap.variantId])}, use its Stamina support on an eligible next Skill user rather than assuming everyone is already charged.`});
  add('targeted-stamina',Math.min(4,targeted.length*2),targeted.map(cap=>cap.variantId),targeted.map(sourceRef),'A controllable Skill can help charge the next eligible ally; target choice is part of the proposed sequence.');

  // A second-stage dependency is feasible as a plan without pretending its buff
  // is already active. Only explicitly typed recipient-compatible sources link.
  const birthrightReactive=capabilities.filter(cap=>['stamina_grant','stamina_refund'].includes(cap.kind)&&['owner_gains_birthright','owner_healed_or_birthright_from_skill'].includes(cap.trigger)&&cap.sourceMatched&&!cap.currentnessIssue&&!cap.itemRequired&&(!cap.leaderOnly||cap.variantId===leaderVariantId));
  const linked=[];
  for(const consumer of birthrightReactive)for(const provider of feasible('birthright_grant').filter(cap=>cap.trigger==='skill_use')) {
    if(!recipients(provider,ids,guideData).includes(consumer.variantId))continue;
    linked.push(consumer.variantId);
    if(!scoreOnly)dependencies.push({kind:'birthright_stamina',capabilityId:consumer.id,providerVariantId:provider.variantId,beneficiaryVariantIds:[consumer.variantId],sourceRefs:[sourceRef(provider),sourceRef(consumer)],text:`Plan ${names([provider.variantId])}'s BIRTHRIGHT-granting Skill before ${names([consumer.variantId])}'s next action to enable its sourced Stamina response; no specific turn or stacked total is asserted.`});
  }
  add('birthright-stamina-link',Math.min(4,unique(linked).length*2),unique(linked),birthrightReactive.filter(cap=>linked.includes(cap.variantId)).map(sourceRef),'Recipient-compatible BIRTHRIGHT delivery can also enable sourced Stamina responses.');

  const damage=feasible('skill_damage').filter(cap=>cap.trigger==='skill_use');
  const damageIds=unique(damage.map(cap=>cap.variantId));
  add('direct-damage',Math.min(4,damageIds.length),damageIds,damage.map(sourceRef),'Direct Skill damage remains a usable channel. FIRE-status immunity alone does not establish immunity to direct Fire Damage; damage magnitude/resistance is not simulated.');
  const heals=feasible('healing').filter(cap=>cap.trigger==='skill_use');
  add('healing-support',Math.min(4,heals.reduce((sum,cap)=>sum+(cap.recipients==='team'?2:1),0)),heals.map(cap=>cap.variantId),heals.map(sourceRef),'Available healing Skills can support the rotation, but a WOUNDED target may not receive healing until that restriction is addressed.');
  const fury=feasible('fury_grant').filter(cap=>cap.trigger==='skill_use'&&cap.recipients==='team');
  add('fury-support',Math.min(2,fury.length),fury.map(cap=>cap.variantId),fury.map(sourceRef).concat('source:527'),'Team FURY has sourced Stamina-gain support; ENRAGED thresholds and numerical stacking are not assumed.');
  const factions=inspectFactions(guideData,ids),supportedFactions=factions.filter(row=>row.status==='supported_threshold');
  add('faction-support',Math.min(2,supportedFactions.length),supportedFactions.flatMap(row=>row.contributors),supportedFactions.map(row=>'source:'+row.sourceId),'Only source-recorded faction thresholds met by exact memberships receive small composition credit; stacking with boss modifiers is not calculated.');
  const immune=capabilities.filter(cap=>cap.kind==='status_apply'&&IMMUNE_STATUSES.has(normalize(cap.appliedStatus))&&cap.sourceMatched&&cap.trigger==='skill_use');
  add('immune-status-waste',-Math.min(4,unique(immune.map(cap=>cap.variantId)).length),immune.map(cap=>cap.variantId),immune.map(sourceRef).concat(bossRef('drogon-born-in-flames-ii')),'These Skills include status payloads Drogon ignores; their independent damage/support payloads are retained.');
  const powerups=feasible('powerup_spawn');
  add('powerup-risk',-Math.min(3,powerups.length),powerups.map(cap=>cap.variantId),powerups.map(sourceRef).concat(bossRef('drogon-ember-storm-ii')),'Generated Power-Ups create a later match/destruction hazard; generation alone is not treated as the retaliation trigger.');
  const paid=birthrightProviders.filter(cap=>cap.condition==='treasury_cost');
  add('treasury-fragility',paid.length?-3:0,paid.map(cap=>cap.variantId),paid.map(sourceRef).concat(bossRef('drogon-ember-storm-ii')),'This BIRTHRIGHT route needs banked Treasury at cast time; opening income is not guaranteed to survive intervening costs or Drogon drains.');

  if(scoreOnly)return {status:'ready',variantIds:ids,leaderVariantId,score:contributions.reduce((sum,row)=>sum+row.score,0)};
  for(const cap of capabilities.filter(cap=>cap.status!=='feasible'))risks.push({capabilityId:cap.id,text:`${names([cap.variantId])}: ${cap.reason}`,variantIds:[cap.variantId],sourceRefs:[sourceRef(cap),...(cap.currentnessIssue?.sourceUrls||[])]});
  for(const cap of capabilities.filter(cap=>cap.status==='feasible'&&cap.selfCost))risks.push({capabilityId:cap.id,text:`${names([cap.variantId])}: this effect has a sourced self-cost (${cap.selfCost.amount} ${cap.selfCost.unit.replaceAll('_',' ')}); support value is not free sustain.`,variantIds:[cap.variantId],sourceRefs:[sourceRef(cap)]});
  for(const cap of capabilities.filter(cap=>cap.kind==='birthright_spend'&&cap.sourceMatched))risks.push({capabilityId:cap.id,text:`${names([cap.variantId])} also spends BIRTHRIGHT under its source wording; grant size is not guaranteed retained uptime. Marks additionally decay each turn.`,variantIds:[cap.variantId],sourceRefs:[sourceRef(cap),'source:545']});
  risks.push({text:'Do not leave an avoidable turn without a player Skill: the next turn can trigger Brimstone Rain and the separate FIRE chance. No uninterrupted cadence is guaranteed by this plan.',variantIds:ids,sourceRefs:[bossRef('drogon-brimstone-rain-ii'),bossRef('drogon-born-in-flames-ii')]});
  risks.push({text:'Power-Up matching/destruction triggers Ember Storm and Treasury loss; Gem Damage is heavily reduced. Do not assume ally-gem replacement avoids this interaction.',variantIds:ids,sourceRefs:[bossRef('drogon-ember-storm-ii')]});
  if(heals.length)risks.push({text:'Dracarys WOUNDS its target for five turns; healing support is not proof of survival or effective healing through WOUND.',variantIds:heals.map(cap=>cap.variantId),sourceRefs:[bossRef('drogon-dracarys')]});
  unknowns.push(...unique([...capabilities.filter(cap=>cap.currentnessIssue).map(cap=>cap.reason),...factions.map(faction=>faction.currentnessIssue?.message)].filter(Boolean)));
  for(const faction of factions.filter(row=>row.status==='threshold_unverified'&&row.bonusText))unknowns.push(`${faction.name}: no met, source-confirmed activation threshold; do not assume "${faction.bonusText}" is active.`);
  if(supportedFactions.length>1)unknowns.push('Multiple faction bonuses are present, but the September diminishing-return rules are not modeled; do not sum full-strength bonus quantities.');
  unknowns.push('This is prebattle planning from historical source wording, not a current-game verification, turn simulator, ownership check, level-aware optimization, or win probability.');
  unknowns.push('Skill charge depends on the board; refund stacking, BIRTHRIGHT uptime, actual quantities at other ranks, and damage magnitudes remain unmodeled.');
  const skills=birthrightProviders.filter(cap=>cap.trigger==='skill_use');
  const steps=[
    openerIds.length?`Opening: ${names(openerIds)} have sourced opening Stamina; check charge availability rather than assuming they act immediately.`:'Opening: no modeled high-Stamina opener; use the board to charge a Skill and avoid a dead turn.',
    skills.length?`Establish BIRTHRIGHT with ${names(unique(skills.map(cap=>cap.variantId)))} when its Skill is available; preserve bearers through the next start-of-turn check.`:'No controllable team BIRTHRIGHT-granting Skill is established; the plan relies on individual opening or conditional routes.',
    `Alternate available Skills${readyFast.length?' using '+names(readyFast)+' as potential fast users':''}; use targeted Stamina support on the next caster. Post-Skill recovery is not opening charge.`,
    'Replenish BIRTHRIGHT as marks decay; do not spend all ready Skills at once if it leaves the next turn without a Skill. Reassess WOUND, board hazards and finite trigger limits.',
  ];
  const unmodeled=ids.filter(id=>!capabilities.some(cap=>cap.variantId===id&&cap.sourceMatched));
  return {status:'ready',targetId,variantIds:ids,leaderVariantId,score:contributions.reduce((sum,row)=>sum+row.score,0),contributions,dependencies,steps,risks,unknowns,capabilities,sourceReferenceNotes,factions,allyPairs:inspectPrebattleAllyPairs(guideData,ids),members:ids.map(id=>({champion:m.championById.get(id),capabilities:capabilities.filter(cap=>cap.variantId===id)})),coverage:{modeledVariants:ids.length-unmodeled.length,unmodeledVariantIds:unmodeled,catalogVariantCount:prebattleProfiles.length,label:'Partial source-reviewed prebattle model; all champion portfolios and all possible teams are not covered.'},currentness:drogonPlanRules.currentness};
}

export function prebattleResult({plan,guideData,strategyData,itemStates={},reference=null,comparison=null}) {
  const target=strategyData.targets.find(row=>row.id===plan.targetId);
  const name=id=>guideData.champions.find(row=>row.id===id)?.name||id;
  const team=plan.members.map(member=>{
    const useful=member.capabilities.filter(cap=>cap.sourceMatched&&cap.status==='feasible');
    const contributions=plan.contributions.filter(row=>row.variantIds.includes(member.champion.id));
    const linked=plan.dependencies.filter(row=>row.providerVariantId===member.champion.id);
    const prioritized=[...useful].sort((a,b)=>Number(/birthright|stamina/.test(b.kind))-Number(/birthright|stamina/.test(a.kind)));
    const distinct=prioritized.filter((cap,index,rows)=>rows.findIndex(other=>sourceRef(other)===sourceRef(cap))===index).slice(0,3);
    return {champion:member.champion,score:contributions.reduce((sum,row)=>sum+row.score/Math.max(1,row.variantIds.length),0),roles:unique(useful.map(cap=>cap.kind.includes('birthright')?'BIRTHRIGHT setup':cap.kind.includes('stamina')?'Skill rotation':cap.kind==='skill_damage'?'Direct damage':cap.kind==='healing'?'Healing support':null).filter(Boolean)).slice(0,2),
      reasons:distinct.map(cap=>({text:linked.find(row=>row.capabilityId===cap.id)?.text||`${member.champion.name}: ${cap.kind.replaceAll('_',' ')} via ${cap.trigger.replaceAll('_',' ')}; ${cap.reason}`,fact:cap.source.exactText,score:0,evidenceCategory:'verified_fact',provenanceRef:sourceRef(cap),factProvenanceRef:sourceRef(cap),confidence:null})),
      scoringContributions:contributions.map(row=>({mechanicId:row.id,mechanicName:row.id.replaceAll('-',' '),score:row.score,ruleId:'prebattle:'+row.id,ruleProvenanceRef:row.sourceRefs.join(','),fact:row.text,factProvenanceRef:row.sourceRefs.join(',')})),
      dangers:plan.risks.filter(row=>row.variantIds.length===1&&row.variantIds[0]===member.champion.id).slice(0,2).map(row=>({text:row.text,score:0,evidenceCategory:'strategy_inference',provenanceRef:row.sourceRefs.join(',')})),
      item:guideData.items.find(item=>item.ownerVariantId===member.champion.id)||null,itemState:itemStates[member.champion.id]||'unknown',substitute:null};
  });
  const leaderCap=plan.capabilities.find(cap=>cap.variantId===plan.leaderVariantId&&cap.leaderOnly&&cap.status==='feasible');
  const leaderReference=plan.sourceReferenceNotes?.find(row=>row.variantId===plan.leaderVariantId&&row.context==='leader');
  const leaderEvidence=leaderCap?{variantId:leaderCap.variantId,context:'leader',reviewStatus:leaderCap.source.reviewStatus,factText:leaderCap.source.exactText,provenanceRef:sourceRef(leaderCap)}:leaderReference?{variantId:leaderReference.variantId,context:'leader',reviewStatus:'complete',factText:leaderReference.text,provenanceRef:leaderReference.sourceRefs.join(','),referenceOnly:true}:null;
  const thresholdFactions=plan.factions.filter(row=>row.status==='supported_threshold');
  const scoreLabel=reference?'Recorded reference lineup':'Best supported among examined plans';
  return {status:'ready',target,team,leader:plan.leaderVariantId?{champion:guideData.champions.find(row=>row.id===plan.leaderVariantId),evidence:leaderEvidence,score:0}:null,
    overallScore:plan.score,recommendationSource:'prebattle_plan',strategyLabel:scoreLabel,evidenceTier:'Source-backed prebattle inference · historical encounter',prebattlePlan:plan,comparison,referenceRecommendation:reference,
    teamSynergy:plan.contributions.map(row=>({id:'prebattle:'+row.id,text:row.text,score:row.score,evidenceCategory:'strategy_inference',provenanceRef:row.sourceRefs.join(','),confidence:null})),
    factionBonuses:thresholdFactions.map(row=>({factionName:row.name,bonusText:row.bonusText,contributors:row.contributors.map(id=>guideData.champions.find(champion=>champion.id===id)),requiredMembers:row.requiredMembers,sourceId:row.sourceId})),
    allyPairs:[],matchupReasons:[],
    approach:`Compare a feasible BIRTHRIGHT / Skill-rotation plan for these five exact variants. ${plan.dependencies.filter(row=>row.kind==='birthright_boss_payoff').map(row=>row.text).join(' ')}`,
    timing:plan.steps.join(' '),dangers:plan.risks.filter(row=>row.variantIds.length>1).map(row=>row.text).concat(plan.risks.filter(row=>row.variantIds.length===1).map(row=>row.text)).slice(0,8),substitutes:[],confidence:'conditional',
    evidenceSummary:{verifiedFacts:unique(plan.capabilities.filter(cap=>cap.sourceMatched&&!cap.currentnessIssue).map(sourceRef)).length,strategyInferences:plan.contributions.length,communityObservations:0},
    missingDataWarnings:[...collectionWarnings(guideData),...plan.unknowns,plan.coverage.label,...plan.coverage.unmodeledVariantIds.map(id=>'Structured portfolio not modeled: '+name(id)),...(reference?['This recorded lineup is a source-backed reference, not a proof of optimality.']:[])],
    candidateStats:{considered:guideData.champions.length,eligible:comparison?.candidateCount||plan.variantIds.length,pruned:comparison?.candidateCount||plan.variantIds.length}};
}

const searchCache=new WeakMap();

/** Bounded deterministic beam comparison. The examined set and constraints are
 * disclosed; neither complete enumeration nor player-owned suitability is claimed. */
export function recommendPrebattleTeams({guideData,strategyData,targetId,requiredVariantIds=[],excludeVariantIds=[],itemStates={},itemRanks={},limit=5}) {
  if(!supportsPrebattleTarget(guideData,targetId))return [];
  const required=unique(requiredVariantIds),excluded=new Set([...excludeVariantIds,...collectionExclusions(guideData)]),m=model(guideData);
  if(required.length>5||required.some(id=>excluded.has(id)||m.championById.get(id)?.releaseState!=='live'))return [];
  const key=JSON.stringify({targetId,required:[...required].sort(),excluded:[...excluded].sort(),itemStates,itemRanks,limit});
  if(!searchCache.has(guideData))searchCache.set(guideData,new WeakMap());
  const strategyCaches=searchCache.get(guideData);
  if(!strategyCaches.has(strategyData))strategyCaches.set(strategyData,new Map());
  const resultCache=strategyCaches.get(strategyData);
  if(resultCache.has(key))return resultCache.get(key);
  const pool=unique([...prebattleProfiles.map(row=>row.variantId),...required]).filter(id=>!excluded.has(id)&&m.championById.get(id)?.releaseState==='live'&&(required.includes(id)||m.capabilities.some(cap=>cap.variantId===id&&cap.sourceMatched)));
  if(pool.length<5)return [];
  const evaluated=new Map();
  const evaluate=(ids,forcedLeader)=>{
    const sorted=[...ids].sort(),key=sorted.join('|')+(forcedLeader===undefined?'':'#'+forcedLeader);
    if(evaluated.has(key))return evaluated.get(key);
    const leaders=forcedLeader!==undefined?[forcedLeader]:sorted.filter(id=>m.capabilities.some(cap=>cap.variantId===id&&cap.leaderOnly&&cap.sourceMatched&&!cap.currentnessIssue));
    if(!leaders.length)leaders.push(null);
    const variants=leaders.map(leaderVariantId=>evaluatePrebattlePlan({guideData,strategyData,targetId,variantIds:sorted,leaderVariantId,itemStates,itemRanks,allowPartial:true,scoreOnly:true}));
    variants.sort((a,b)=>b.score-a.score||String(a.leaderVariantId).localeCompare(String(b.leaderVariantId)));
    evaluated.set(key,variants[0]);return variants[0];
  };
  let beam=[evaluate(required)];
  for(let size=required.length;size<5;size++) {
    const next=new Map();
    for(const plan of beam)for(const id of pool) {
      if(plan.variantIds.includes(id))continue;
      const ids=[...plan.variantIds,id].sort(),key=ids.join('|');
      if(!next.has(key))next.set(key,evaluate(ids));
    }
    beam=[...next.values()].sort((a,b)=>b.score-a.score||a.variantIds.join('|').localeCompare(b.variantIds.join('|'))).slice(0,32);
  }
  const referenceRows=(strategyData.curatedRecommendations||[]).filter(row=>row.targetId===targetId&&row.active&&row.reviewStatus==='reviewed'&&row.members.length===5&&row.members.every(member=>member.variantId)&&row.leaderVariantId);
  const references=[];
  for(const reference of referenceRows) {
    const ids=reference.members.map(row=>row.variantId);
    if(ids.some(id=>excluded.has(id)||m.championById.get(id)?.releaseState!=='live')||required.some(id=>!ids.includes(id)))continue;
    const plan=evaluate(ids,reference.leaderVariantId);
    references.push({plan,reference});
  }
  const ranked=[...beam,...references.map(row=>row.plan)].sort((a,b)=>b.score-a.score||a.variantIds.join('|').localeCompare(b.variantIds.join('|')));
  const planIdentity=plan=>plan.variantIds.join('|')+'#'+(plan.leaderVariantId||'');
  const chosen=[];
  for(const plan of ranked) {
    if(chosen.some(row=>planIdentity(row)===planIdentity(plan)))continue;
    chosen.push(plan);if(chosen.length>=Math.max(1,limit))break;
  }
  // Preserve a valid recorded reference for an actual side-by-side comparison,
  // even if the bounded search found higher heuristic-scoring alternatives.
  if(limit>1)for(const row of references)if(!chosen.some(plan=>planIdentity(plan)===planIdentity(row.plan))) {
    if(chosen.length>=limit)chosen.pop();chosen.push(row.plan);
  }
  const comparison={method:'deterministic_beam',beamWidth:32,candidateCount:pool.length,modeledCandidateCount:pool.filter(id=>m.capabilities.some(cap=>cap.variantId===id&&cap.sourceMatched)).length,requiredUnmodeledVariantIds:required.filter(id=>!m.capabilities.some(cap=>cap.variantId===id&&cap.sourceMatched)),examinedTeamCount:[...evaluated.values()].filter(row=>row.variantIds.length===5).length,requiredVariantIds:required,excludedVariantIds:[...excluded],scope:'Best supported among this examined source-covered candidate set, not all possible or player-owned teams.'};
  const results=chosen.map(plan=>prebattleResult({plan:evaluatePrebattlePlan({guideData,strategyData,targetId,variantIds:plan.variantIds,leaderVariantId:plan.leaderVariantId,itemStates,itemRanks}),guideData,strategyData,itemStates,reference:references.find(row=>planIdentity(row.plan)===planIdentity(plan))?.reference||null,comparison}));
  for(const [index,result] of results.entries())if(index>0&&!result.referenceRecommendation)result.strategyLabel='Alternative examined plan';
  for(const result of results)result.comparison={...comparison,rankAmongReturned:results.indexOf(result)+1,scoreGapFromFirst:results[0].overallScore-result.overallScore,tradeoffs:result.prebattlePlan.risks.filter(row=>row.variantIds.length===1).slice(0,3).map(row=>row.text)};
  resultCache.set(key,results);return results;
}
