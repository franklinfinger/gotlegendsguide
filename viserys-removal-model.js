// A source-matched tradeoff, not a net-benefit score or a combat simulator.
const VISERYS='sqlite-champion-68';
const identity=value=>String(value||'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const text=value=>String(value||'').replace(/\s+/g,' ').trim();
const skillPattern=/^Viserys PACIFIES himself for (\d+) turns, then removes (\d+) Buff from each enemy and (\d+) Debuff from each team member\. Each Buff and Debuff Viserys removes is replaced with FIRE\. He then HEALS each team member for (\d+(?:\.\d+)?)% ATK with a bonus (\d+(?:\.\d+)?)% ATK HEALING for each FIRE on them\.$/;
const definitions={FIRE:'Marks the target to receive Fire Damage which greatly increases with more stacks.',PACIFY:'Renders the target unable to deal damage or use any abilities until they are struck by an enemy Skill.',REMOVE:'Eliminates Buffs from enemies or Debuffs from allies.'};
const verified=row=>row?.reviewStatus==='complete'&&!row.historicalReference&&!!(row.captureDate||row.reviewCompletedDate)&&!!row.provenanceRef&&row.sourceFilenames?.length>0&&!/…|\.\.\./.test(row.text||'');
const reference=row=>row.provenanceRef+':'+row.sourceFilenames.join(',');
const sourceEvidence=rows=>rows.map(row=>({name:row.name||row.title,text:row.text,provenanceRef:reference(row),captureDate:row.captureDate||null,reviewCompletedDate:row.reviewCompletedDate||null}));

/** The known replacement Skill must not be flattened into free removal or
 * healing. A changed body needs review, rather than silently regaining credit. */
export function hasViserysRemovalTradeoff(record) {
  return record.variantId===VISERYS&&record.kind==='skill';
}

export function evaluateViserysRemoval({guideData,battleMode,variantIds=[]}) {
  const empty={status:'not_applicable',score:0,variantId:VISERYS,steps:[],limitations:[],sourceRefs:[],sourceEvidence:[]};
  const collection=guideData?.verifiedCollection;
  if(!collection||!['raid','war'].includes(battleMode)||!variantIds.includes(VISERYS))return empty;
  if(new Set(variantIds).size!==variantIds.length||variantIds.length>5||variantIds.some(id=>!collection.variantIds?.includes(id)||!guideData.champions.some(row=>row.id===id&&row.releaseState==='live')))return {...empty,status:'invalid_selection',limitations:['A tradeoff explanation requires distinct captured exact variants. No new effect is assumed.']};
  const champion=guideData.champions.find(row=>row.id===VISERYS);
  const records=(collection.records||[]).filter(row=>row.variantId===VISERYS&&row.kind==='skill');
  const skill=records.length===1?records[0]:null;
  const match=verified(skill)&&hasViserysRemovalTradeoff(skill)&&identity(skill.name)==='set aside your grievances'&&skillPattern.exec(text(skill.text));
  if(identity(champion?.name)!=='viserys targaryen i the peaceful king'||!match||!match.slice(1).every(value=>Number(value)>0))return {...empty,status:'source_incomplete',limitations:['Viserys’ removal tradeoff needs one complete, matching current Skill source for The Peaceful King. No isolated removal, cleanse, healing or FIRE score is inferred.']};
  const skillSources={sourceRefs:[reference(skill)],sourceEvidence:sourceEvidence([skill]),sourceLevel:skill.displayedSkillLevel||null};
  const definitionRows=[];
  for(const [name,expected] of Object.entries(definitions)) {
    const rows=(collection.effectDefinitionUpdates||[]).filter(row=>row.effectName===name);
    if(!rows.length||rows.some(row=>!verified(row)||!row.reviewCompletedDate||text(row.text)!==expected||!row.scopes?.some(scope=>scope.variantId===VISERYS)))return {...empty,...skillSources,status:'definition_unverified',limitations:['The captured Skill retains its self-PACIFY and FIRE-replacement clauses, but matching, complete FIRE, PACIFY and REMOVE definitions are required before interpreting the tradeoff. No historical fallback or extra score is used.']};
    definitionRows.push(...rows);
  }
  const evidence=[skill,...definitionRows];
  const [pacifyTurns,enemyBuffs,allyDebuffs,baseHeal,fireHeal]=match.slice(1).map(Number);
  return {...empty,status:'conditional_tradeoff',sourceLevel:skill.displayedSkillLevel||null,sourceRefs:[...new Set(evidence.map(reference))],sourceEvidence:sourceEvidence(evidence),
    summary:'Viserys trades removal for FIRE on the affected champions and PACIFY on himself. This is not a clean status reset or guaranteed net healing; the coupled Skill earns no flat removal, cleanse, healing or FIRE points.',
    steps:[
      {id:'self-pacify',text:`The captured Skill lists self-PACIFY for ${pacifyTurns} turns. PACIFY prevents damage and ability use until an enemy Skill strikes the affected champion. Do not assume ordinary damage breaks it or that Viserys can immediately repeat his Skill.`,sourceRefs:[reference(skill),...definitionRows.filter(row=>row.effectName==='PACIFY').map(reference)]},
      {id:'bounded-removal',text:`The Skill removes ${enemyBuffs} Buff from each enemy and ${allyDebuffs} Debuff from each team member, where a removable effect is present. This is not removal of every status, and no particular effect is assumed to be selected.`,sourceRefs:[reference(skill),...definitionRows.filter(row=>row.effectName==='REMOVE').map(reference)]},
      {id:'fire-replacement',text:'Each Buff or Debuff actually removed is replaced with FIRE. That can leave an affected ally with FIRE after losing a Debuff. An empty or unremovable status slot does not establish a successful removal or a replacement.',sourceRefs:[reference(skill)]},
      {id:'healing-tradeoff',text:`The text then lists ${baseHeal}% ATK healing per team member plus ${fireHeal}% ATK healing for each FIRE on that member. FIRE also marks its target to receive Fire Damage that increases with stacks. The missing damage curve, actual FIRE counts and battle state prevent a net-healing or damage calculation.`,sourceRefs:[reference(skill),...definitionRows.filter(row=>row.effectName==='FIRE').map(reference)]},
    ],
    limitations:[
      'This is a conditional reading of the captured Skill, not a recommendation to cast it in every situation. It adds no ranking points or invented penalty.',
      'Intra-Skill resolution is not established: do not assume self-PACIFY cancels the rest of the cast, that its own removal selects PACIFY, or that removal always clears the status you wanted.',
      'Existing FIRE, actual removable effects, immunity, prevention, healing restrictions, enemy reactions and the board are unknown. No added FIRE count, proc rate, cast cadence or turn outcome is predicted.',
      'The Leader and passive are separate effects, not activated by selecting this Skill explanation. No random allied FIRE, retaliation, equipment or Leader effect is silently combined with it.',
      'Captured percentages apply to the shown Skill source, not every rank. Source dates are evidence dates, not live game verification.',
    ]};
}

/** Attach the source and caution to the existing cards without changing a
 * lineup, selecting a Leader, adding a score or depending on a new UI route. */
export function explainViserysRemoval(result,guideData) {
  const model=evaluateViserysRemoval({guideData,battleMode:result.target?.battleMode,variantIds:(result.team||[]).map(row=>row.champion.id)});
  if(model.status==='not_applicable')return result;
  const note=model.summary||model.limitations[0];
  const source=model.sourceEvidence[0];
  return {...result,viserysRemoval:model,team:result.team.map(member=>member.champion.id!==VISERYS?member:{...member,skillTradeoff:model,reasons:[...member.reasons,...(source?[{fact:source.text,text:note,score:0,evidenceCategory:'verified_fact',provenanceRef:source.provenanceRef,factProvenanceRef:source.provenanceRef}]:[]),{text:note,score:0,evidenceCategory:'strategy_inference',provenanceRef:model.sourceRefs.join(',')}]}),missingDataWarnings:[...(result.missingDataWarnings||[]),note,...model.limitations]};
}
