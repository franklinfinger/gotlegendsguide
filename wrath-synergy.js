// Narrow, source-matched composition support for an imported collection only.
// No starting WRATH, stacking frequency, damage formula or event probability.
const normalize=value=>String(value||'').replace(/\s+/g,' ').trim();
const identity=value=>normalize(value).toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const QARTH='sqlite-champion-6';
const cached=new WeakMap();
const reference=row=>row.provenanceRef+':'+row.sourceFilenames.join(',');
const verified=row=>row?.reviewStatus==='complete'&&row.provenanceRef&&row.sourceFilenames?.length&&!/…|\.\.\./.test(row.text);
const spending=/\b(?:consumes?|spends?|requires?|must|at (?:a|the) cost)\b/i;
const passivePattern=/^When an ally uses their Skill, Daenerys gains (\d+) WRATH, or (\d+) if the ally is a Free Cities Champion\. Drogon deals a bonus (\d+)% ATK Damage per WRATH\. Viserion & Rhaegal deal a bonus (\d+)% ATK Damage per WRATH\. Daenerys loses all WRATH after using her Skill\.$/;
const skillPattern=/^Drogon strikes a target enemy for \d+% ATK Fire Damage and afflicts them with FEAR x\d+\. Rhaegal and Viserion then each strike a random target for \d+% ATK Fire Damage\. Rhaegal and Viserion's attacks ignore TAUNT and STEALTH\.$/;
const itemPattern=/^Once per turn, when an enemy gains a SHIELD, Daenerys gains (\d+) WRATH\. When Daenerys destroys a SHIELD, Free Cities allies gain (\d+)% Stamina\. Anytime an enemy is defeated, Daenerys gains a (\d+)% ATK SHIELD for each WRATH she has\.$/;
const leaderPattern=/^When an enemy uses a Skill, CHARGE ([IVX]+) to all allies and grant Daenerys (\d+) WRATH\.$/;

function model(guideData) {
  if(cached.has(guideData))return cached.get(guideData);
  const records=guideData.verifiedCollection?.records||[];
  const champion=guideData.champions.find(row=>row.id===QARTH);
  const exact=identity(champion?.name)==='daenerys targaryen conqueror of qarth';
  const owned=records.filter(row=>row.variantId===QARTH&&verified(row));
  let passive=exact?owned.find(row=>row.kind==='trait'&&row.context!=='leader'&&passivePattern.test(normalize(row.text))):null;
  if(passive&&!passivePattern.exec(normalize(passive.text)).slice(1).every(value=>Number.isSafeInteger(Number(value))&&Number(value)>0))passive=null;
  const skill=exact?owned.find(row=>row.kind==='skill'&&skillPattern.test(normalize(row.text))):null;
  const item=exact?owned.find(row=>row.kind==='item'&&itemPattern.test(normalize(row.text))):null;
  const leader=exact?owned.find(row=>row.kind==='trait'&&row.context==='leader'&&leaderPattern.test(normalize(row.text))):null;
  const unresolved=new Set((guideData.verifiedCollection?.supportModelGaps||guideData.verifiedCollection?.definitionGaps||[]).map(row=>row.variantId));
  const skills=new Map(records.filter(row=>row.kind==='skill'&&verified(row)&&!spending.test(row.text)&&!unresolved.has(row.variantId)).map(row=>[row.variantId,row]));
  const faction=guideData.factions?.find(row=>row.name==='Free Cities');
  const memberships=new Map((guideData.verifiedCollection?.factionMembershipEvidence||[]).filter(row=>row.mechanicId==='faction_free_cities'&&['complete','reviewed'].includes(row.reviewStatus)&&row.provenanceRef&&faction?.memberVariantIds.includes(row.variantId)&&guideData.champions.find(champion=>champion.id===row.variantId)?.factions.includes('Free Cities')).map(row=>[row.variantId,row]));
  // A shield already present or a bare mechanic label does not prove a new gain.
  // Only an explicit, unconditional shield-giving Skill in the selected enemy
  // lineup can establish this opportunity, never its rate or actual activation.
  const shieldSkills=new Map([...skills].filter(([,row])=>{
    const first=normalize(row.text).split(/(?<=[.!?])\s+/)[0];
    return !/\b(if|when|chance|after|until|while)\b/i.test(first)&&/\b(?:grants?[^.]{0,70}(?:team member|allies|ally|himself|herself)[^.]{0,70}\bSHIELD|SHIELDS?\s+(?:a|the|all)\s+(?:target\s+)?(?:team member|allies|ally))\b/.test(first);
  }));
  const result={champion,passive,skill,item,leader,skills,memberships,shieldSkills};
  cached.set(guideData,result);return result;
}

/** A conservative two-point composition preference, not a combat simulator.
 * Sources carry their capture/review dates and any inherited membership caveat. */
export function evaluateWrathSynergy({guideData,variantIds=[],leaderVariantId=null,itemStates={},itemRanks={},enemyVariantIds=[]}) {
  const empty={status:'not_applicable',score:0,contributions:[],opportunities:[],limitations:[],sourceRefs:[]};
  if(!guideData?.verifiedCollection||!variantIds.includes(QARTH))return empty;
  const m=model(guideData);
  if(!m.passive||!m.skill)return {...empty,status:'source_incomplete',limitations:['Qarth WRATH scoring requires complete, exactly matched current passive and Skill wording. No partial or historical substitute is used.']};
  const allies=[...new Set(variantIds)].filter(id=>id!==QARTH&&m.skills.has(id));
  const freeCities=allies.filter(id=>m.memberships.has(id));
  const amounts=passivePattern.exec(normalize(m.passive.text));
  const contributions=[];
  const sharedSources=[reference(m.passive),reference(m.skill)];
  if(allies.length)contributions.push({id:'wrath-ally-skill-access',score:1,contributors:[QARTH,...allies],sourceRefs:[...sharedSources,...allies.map(id=>reference(m.skills.get(id)))],text:'Qarth Daenerys has other complete, resource-unrestricted ally Skills as possible WRATH triggers. +1 source-flexibility point, not a forecast of casts, starting WRATH or damage.'});
  if(freeCities.length&&Number(amounts[2])>Number(amounts[1]))contributions.push({id:'wrath-free-cities-option',score:1,contributors:[QARTH,...freeCities],sourceRefs:[reference(m.passive),...freeCities.map(id=>m.memberships.get(id).provenanceRef)],text:`A separately corroborated Free Cities ally offers the passive's ${amounts[2]}-rather-than-${amounts[1]} WRATH event. +1 bounded composition point; additional Free Cities allies do not multiply this credit.`});
  const opportunities=[];
  if(m.leader) {
    const values=leaderPattern.exec(normalize(m.leader.text)),selected=leaderVariantId===QARTH;
    opportunities.push({id:'wrath-leader-enemy-skill',status:selected?'conditional_opportunity':'leader_not_selected',score:0,sourceRefs:[reference(m.leader)],text:selected?`With Qarth selected as Leader, an enemy Skill can supply ${values[2]} WRATH and CHARGE ${values[1]} to allies. This is a separate enemy event, not an ally-Skill trigger; CHARGE is not converted to a Stamina percentage.`:'Qarth is not the selected Leader. Her enemy-Skill WRATH and CHARGE clause supplies no assumed effect or points.'});
  }
  if(m.item) {
    const values=itemPattern.exec(normalize(m.item.text));
    const enabled=itemStates[QARTH]==='enabled';
    const rank=itemRanks[QARTH];
    const rankMatches=Number.isSafeInteger(m.item.itemLevel)&&m.item.itemLevel>0&&!!m.item.itemRank&&rank?.level===m.item.itemLevel&&rank?.rank===m.item.itemRank;
    const providers=[...new Set(enemyVariantIds)].filter(id=>m.shieldSkills.has(id));
    const gate=!enabled?'item_not_enabled':!rankMatches?'item_rank_unconfirmed':null;
    const gateText=!enabled?'Hatchling Dragons is not explicitly enabled.':!rankMatches?'The enabled item does not have an explicitly confirmed match to the captured level and rank.':null;
    opportunities.push({id:'wrath-enemy-shield-gain',status:gate||(providers.length?'supported_opportunity':'enemy_trigger_unestablished'),score:0,sourceRefs:[reference(m.item),...providers.map(id=>reference(m.shieldSkills.get(id)))],text:gateText|| (providers.length?`A selected enemy has a complete shield-giving Skill. If an enemy actually gains a SHIELD, the item can grant ${values[1]} WRATH, at most once per turn. Player-side shields and shields already present do not establish this event. No event rate or ranking credit is assigned.`:'No current, unconditional enemy shield-giving Skill is established in the supplied lineup. Player shields, an existing enemy shield, and a bare shield tag do not establish a new enemy shield-gain event.')});
    opportunities.push({id:'wrath-shield-destruction',status:gate||'destruction_unestablished',score:0,sourceRefs:[reference(m.item)],text:gateText||`Only if Qarth actually destroys a SHIELD does the item grant Free Cities allies ${values[2]}% Stamina. An enemy shield source alone does not establish destruction, timing or a repeatable rotation.`});
    opportunities.push({id:'wrath-enemy-defeat-shield',status:gate||'defeat_unestablished',score:0,sourceRefs:[reference(m.item)],text:gateText||`The personal ${values[3]}% ATK SHIELD per WRATH requires an enemy defeat and an unknown WRATH balance at that event. Her own SHIELD does not trigger the enemy-shield WRATH clause; no self-feeding loop is assumed.`});
  }
  return {status:'modeled',score:contributions.reduce((sum,row)=>sum+row.score,0),contributions,opportunities,allyVariantIds:allies,freeCitiesVariantIds:freeCities,sourceRefs:[...new Set([...sharedSources,...contributions.flatMap(row=>row.sourceRefs),...opportunities.flatMap(row=>row.sourceRefs)])],limitations:[
    'At most two structural-fit points. They express source flexibility, not a formula for WRATH, expected damage, turn cadence or win probability.',
    /\bOnce\b/.test([m.passive.sourceBadgeText,...(m.passive.sourceBadges||[])].join(' '))?'The passive shows a Once badge whose trigger-limit semantics are not established. No repeated same-turn or per-battle stacking is assumed.':'The passive trigger-limit badge is unavailable in the structured source. No repeated same-turn or per-battle stacking is assumed.',
    'WRATH is only partially defined: its cap, removability and other intrinsic behavior are unknown; no extra payoff is assumed.',
    'Qarth is not counted as her own ally. Her Skill consumes all WRATH afterward, so previous-cycle gains are not carried forward.',
    `The passive names ${amounts[3]}% and ${amounts[4]}% ATK Damage bonuses per WRATH. Their damage type, resistance, hit allocation and total are not inferred from the base Skill's Fire Damage.`,
    'Free Cities membership is corroborated from the existing catalog and membership evidence, not inferred from faction-popup backgrounds or newly reverified by these screenshots.',
  ]};
}
