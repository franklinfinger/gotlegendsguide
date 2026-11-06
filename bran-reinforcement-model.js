// Recovered dated evidence stays separate from current-rank observations.
// This bounded explanation adds no combat score, damage forecast or proc loop.
const BRAN = 'sqlite-champion-53';
const normalized = value => String(value || '').normalize('NFKC').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const text = value => String(value || '').replace(/\s+/g,' ').trim();
const date = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '');
const unique = values => [...new Set(values)];
const expected = {
  skill: 'Bran creates a Color Clear Power-Up, then Bran wargs into Summer, REINFORCING the battle with 52% HP and 65% Stamina.',
  skillUpgrade: 'Level 9 Upgrade: +3% Summer starting HP',
  leader: 'Anytime an ally REINFORCES the battle, Bran afflicts all enemies with 1 ICE and gains +25% Stamina.',
  passive: 'When a Stark team member uses their Skill or an Ally Gem is destroyed, Bran has a 60% chance to afflict a random enemy with 1 ICE. Bran then gains a 25% Hit Buff for 4 turns.',
  summer: 'Summer strikes an enemy for 210% ATK Physical Damage. Summer then deals an additional 65% ATK Physical Damage for each ICE on the target.',
  summerUpgrade: 'Level 9 Upgrade: +20% ATK Physical Damage',
  inheritance: 'Summer will inherit their Level, Star Rank, and Skill Level from Bran Stark.',
};

/** Optional source-history envelope. Preserve prior-rank bodies as reference
 * evidence, never copy them into the current-Skill fact extractor. */
export function prepareRecoveredPortfolios(handoff, mappings) {
  const rows = handoff.recovered_variant_portfolios || [];
  if (!Array.isArray(rows)) throw Error('Recovered portfolios must be an array.');
  const seen = new Set();
  return rows.map(row => {
    const mapping = mappings.find(item => item.groupId === row.capture_group_id);
    const group = handoff.champion_capture_groups.find(item => item.capture_group_id === row.capture_group_id);
    if (!mapping || !group || group.duplicate_of_group_id || normalized(row.champion) !== normalized(group.champion) || normalized(row.exact_variant) !== normalized(group.exact_variant) || seen.has(mapping.variantId)) throw Error('Recovered portfolio has an ambiguous, duplicate or mismatched exact identity.');
    seen.add(mapping.variantId);
    if (!date(row.review_date) || !Array.isArray(row.source_files) || !row.source_files.length) throw Error('Recovered portfolio needs dated source identities.');
    const sources = new Map();
    for (const source of row.source_files) {
      if (!source.file_name || sources.has(source.file_name) || !date(source.evidence_date) || !(source.library_file_id || source.drive_url) || !handoff.all_reviewed_source_filenames.includes(source.file_name)) throw Error('Recovered portfolio source is unknown, duplicated or undated.');
      const {local_path,workspace_path,...safe} = source;
      sources.set(source.file_name, safe);
    }
    const record = (body, field) => {
      if (!body || !text(body.text) || /…|\.\.\./.test(body.text) || !Array.isArray(body.sources) || !body.sources.length || body.sources.some(name => !sources.has(name))) throw Error(`Recovered portfolio ${field} needs complete text and resolved sources.`);
      return {...structuredClone(body), evidenceClass:'observed_prior_snapshot', reviewStatus:'complete', referenceOnly:true, reviewCompletedDate:row.review_date,
        sourceFilenames:[...body.sources], sourceIdentities:body.sources.map(name => sources.get(name)),
        evidenceDates:unique(body.sources.map(name => sources.get(name).evidence_date)),
        provenanceRef:`recovered-portfolio:${row.review_date}:${row.capture_group_id}:${field}`};
    };
    if (!Array.isArray(row.traits) || !row.traits.length) throw Error('Recovered portfolio requires its separately sourced traits.');
    return {variantId:mapping.variantId, name:mapping.name, groupId:mapping.groupId, reviewDate:row.review_date,
      skill:record(row.skill,'skill'), skillUpgrade:record(row.skill_upgrade,'skill_upgrade'),
      traits:row.traits.map((body,index) => record(body,`trait:${index}`)),
      companion:{name:row.companion?.name, exactVariant:row.companion?.exact_variant,
        skill:record(row.companion?.skill,'companion_skill'), upgrade:record(row.companion?.upgrade,'companion_upgrade'), inheritance:record(row.companion?.inheritance,'companion_inheritance')},
      starUpgrade:record(row.star_upgrade,'star_upgrade')};
  });
}

const sourceRef = row => `${row.provenanceRef}:${row.sourceFilenames.join(',')}`;
const valid = row => row?.reviewStatus === 'complete' && row.referenceOnly === true && row.evidenceClass === 'observed_prior_snapshot' && row.provenanceRef && row.sourceFilenames?.length && row.sourceIdentities?.length === row.sourceFilenames.length && row.sourceFilenames.every(name=>row.sourceIdentities.some(source=>source.file_name===name&&(source.library_file_id||source.drive_url))) && row.evidenceDates?.length && row.evidenceDates.every(date) && !/…|\.\.\./.test(row.text || '');
const matches = (row, body) => valid(row) && text(row.text) === body;
const evidence = (row,label) => ({name:row.name || label,label,text:row.text,provenanceRef:sourceRef(row),evidenceClass:row.evidenceClass,evidenceDates:row.evidenceDates});

export function evaluateBranReinforcement({guideData,battleMode,variantIds=[],leaderVariantId=null}) {
  const empty={status:'not_applicable',variantId:BRAN,score:0,steps:[],sourceEvidence:[],sourceRefs:[],limitations:[],derivedValues:[]};
  const collection=guideData?.verifiedCollection;
  if (!collection || !['raid','war'].includes(battleMode) || !variantIds.includes(BRAN)) return empty;
  if (new Set(variantIds).size!==variantIds.length || variantIds.length>5 || variantIds.some(id=>!collection.variantIds?.includes(id)||!guideData.champions.some(row=>row.id===id&&row.releaseState==='live')) || (leaderVariantId && !variantIds.includes(leaderVariantId))) return {...empty,status:'invalid_selection',limitations:['Bran’s explanation requires distinct owned, captured exact variants and a selected Leader within that lineup.']};
  const champion=guideData.champions.find(row=>row.id===BRAN);
  const rows=(collection.recoveredPortfolios||[]).filter(row=>row.variantId===BRAN);
  const portfolio=rows.length===1?rows[0]:null;
  const leader=portfolio?.traits.find(row=>normalized(row.name)==='my dreams are different ii');
  const passive=portfolio?.traits.find(row=>normalized(row.name)==='follow the raven iii');
  const complete=normalized(champion?.name)==='bran stark fugitive of winterfell' && portfolio?.traits.length===2 &&
    normalized(portfolio.skill.name)==='a dream of summer' && portfolio.skill.level===8 && portfolio.skill.stamina_speed==='Slow' && matches(portfolio.skill,expected.skill) && matches(portfolio.skillUpgrade,expected.skillUpgrade) &&
    matches(leader,expected.leader) && leader.max===true && leader.badges?.includes('Leader') && matches(passive,expected.passive) && passive.max===true && passive.badges?.includes('1 Once') &&
    portfolio.companion.name==='Summer' && normalized(portfolio.companion.exactVariant)==='brans direwolf' && portfolio.companion.skill.level===8 && portfolio.companion.skill.stamina_speed==='Fast' && matches(portfolio.companion.skill,expected.summer) && matches(portfolio.companion.upgrade,expected.summerUpgrade) && matches(portfolio.companion.inheritance,expected.inheritance) &&
    valid(portfolio.starUpgrade) && portfolio.starUpgrade.rank===7 && portfolio.starUpgrade.stat==='DEF' && portfolio.starUpgrade.percent===10 && text(portfolio.starUpgrade.text)==='+10% DEF';
  if (!complete) return {...empty,status:'source_incomplete',limitations:['Recovered Bran/Summer evidence is missing, changed or conflicting. Preserve it for review; no unsupported rank value, effect or score is inferred.']};
  const shown=[portfolio.skill,passive,portfolio.companion.skill,portfolio.companion.inheritance,...(leaderVariantId===BRAN?[leader]:[])];
  const sourceEvidence=shown.map(row=>evidence(row,row===portfolio.skill?'Earlier observed Skill, level 8':row===portfolio.companion.skill?'Earlier observed Summer Skill, level 8':'Earlier observed MAX trait / inheritance rule'));
  const steps=[
    {text:'After Bran can cast A Dream Of Summer, it creates a Color Clear Power-Up and REINFORCES with Summer. Summer’s Fast attack is a separate Skill, not damage dealt automatically by Bran’s cast. Do not count Summer as an additional owned roster slot.',sourceRefs:[sourceRef(portfolio.skill),sourceRef(portfolio.companion.skill)]},
    {text:'Follow The Raven requires a Stark team member’s Skill or destruction of an Ally Gem, then states a 60% chance for 1 ICE on a random enemy and a 25% Hit Buff for 4 turns. Preserve the “1 Once” badge; its reset scope, self-triggering and repeat rate are not inferred.',sourceRefs:[sourceRef(passive)]},
    {text:'Summer’s additional 65% ATK Physical Damage is per ICE actually on the attacked target. Do not assume ICE is present, turn the conditional extra attack into flat damage, or apply a BRITTLE multiplier without its separate rules.',sourceRefs:[sourceRef(portfolio.companion.skill)]},
  ];
  if (leaderVariantId===BRAN) steps.push({text:'With Bran explicitly selected as Leader, an allied reinforcement is the stated trigger for 1 ICE on all enemies and +25% Stamina to Bran. Whether Bran’s own warg counts as that allied event, repeated casts, immunity and resolution order remain unestablished.',sourceRefs:[sourceRef(leader)]});
  else steps.push({text:'Bran’s reinforcement-triggered Leader trait is not activated for this lineup: Bran has not been explicitly selected as Leader.',sourceRefs:[sourceRef(leader)]});
  const state=champion.screenshotState, build=state?.currentBuild, development=state?.development;
  const profileVerified=development?.variantId===BRAN && development.provenanceRef && development.sourceFilenames?.length && date(development.captureDate) && development.captureDate>=portfolio.skill.evidenceDates.slice().sort().at(-1);
  const derivedValues=[];
  const skillConflict=(state?.conflicts||[]).some(row=>row.state!=='resolved_for_reviewed_build'&&/skill/i.test(row.field||''));
  if (profileVerified && !skillConflict && build?.skill_level===9) {
    derivedValues.push({field:'summer_starting_hp_percent',value:55,evidenceClass:'derived_from_observed_upgrade',assumption:'The previously shown level-9 upgrade remains unchanged.',basis:'Observed level-8 starting HP 52% plus the explicit +3 percentage-point level-9 preview; the latest profile shows Skill 9.',sourceRefs:[sourceRef(portfolio.skill),sourceRef(portfolio.skillUpgrade),development.provenanceRef]});
    steps.push({text:'Derived, not a newly observed Skill quotation: the shown level-9 +3% Summer starting HP upgrade and current Skill 9 support 55% starting HP (52 + 3), assuming the upgrade rule is unchanged. The observed earlier starting Stamina is 65%. Neither value is a team-wide Stamina buff.',sourceRefs:derivedValues.at(-1).sourceRefs});
    steps.push({text:'Summer inherits Bran’s level, stars and Skill level. The existing level-9 preview says “+20% ATK Physical Damage”; it is retained as upgrade evidence, not silently substituted into a freshly observed attack body or a damage forecast.',sourceRefs:[sourceRef(portfolio.companion.inheritance),sourceRef(portfolio.companion.upgrade),development.provenanceRef]});
  } else steps.push({text:'The directly observed Skill/Summer bodies are level 8. A source-linked current Skill 9 is not established here, so their level-9 previews are not activated.',sourceRefs:[sourceRef(portfolio.skill),sourceRef(portfolio.companion.skill)]});
  if (profileVerified && development.stars===7 && build?.stars===7 && build.star_rank_max===true) {
    derivedValues.push({field:'rank_7_def_bonus_percent',value:10,evidenceClass:'derived_unlocked_rank',assumption:'The previously shown seven-star unlock remains unchanged.',sourceRefs:[sourceRef(portfolio.starUpgrade),development.provenanceRef]});
    steps.push({text:'The earlier trait panel shows the seven-star +10% DEF unlock, and the latest profile confirms seven stars. This unlock is source-derived; do not add another 10% to the already displayed current DEF or invent a new named-trait upgrade. Both named traits were already MAX.',sourceRefs:derivedValues.at(-1).sourceRefs});
  }
  const sourceRefs=unique([...sourceEvidence.map(row=>row.provenanceRef),...steps.flatMap(row=>row.sourceRefs)]);
  return {...empty,status:'conditional_recovered_portfolio',sourceEvidence,sourceRefs,steps,derivedValues,
    summary:'Bran’s recovered Skill, MAX traits and Summer attack are available as conditional source-backed evidence. Reinforcement, reactive ICE and per-target ICE damage are not automatic opening effects and add no flat combat points.',
    limitations:['Original source wording remains dated and rank-specific; the latest profile verifies progression, not a new transcription of every ability. Derived upgrades keep their source and unchanged-rule assumption.','This model does not establish a reinforcement loop, trigger ordering, target ICE count, debuff success rate, cast timing or damage/win forecast. Historical catalog WOUND facts are not borrowed.','These Raid/War notes do not activate a Leader, item, Ally Gem or faction effect, and do not claim that the full portfolio or Dragon encounter interactions are modeled.']};
}

/** Expose useful sourced mechanics in ordinary cards and Why explanations
 * without changing their lineup, Leader, score or ranking preference. */
export function explainBranReinforcement(result,guideData) {
  const model=evaluateBranReinforcement({guideData,battleMode:result.target?.battleMode,variantIds:(result.team||[]).map(row=>row.champion.id),leaderVariantId:result.leader?.champion.id||null});
  if (model.status==='not_applicable') return result;
  const reasons=[...model.sourceEvidence.map(row=>({fact:`${row.label} (${row.evidenceDates.join(', ')}): ${row.text}`,text:row.label,score:0,evidenceCategory:'verified_fact',provenanceRef:row.provenanceRef,factProvenanceRef:row.provenanceRef})),...model.steps.map(row=>({fact:row.text,text:'Conditional interpretation / source-derived progression, zero combat points.',score:0,evidenceCategory:'strategy_inference',provenanceRef:row.sourceRefs.join(','),factProvenanceRef:row.sourceRefs.join(',')}))];
  return {...result,branReinforcement:model,team:(result.team||[]).map(member=>member.champion.id===BRAN?{...member,reasons:[...(member.reasons||[]),...reasons]}:member),missingDataWarnings:unique([...(result.missingDataWarnings||[]),model.summary||model.limitations[0],...model.limitations])};
}
