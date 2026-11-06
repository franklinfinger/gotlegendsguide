import { capturedDevelopment, capturedDevelopmentMarkup, describeTeamDevelopment, developmentNoticeMarkup } from './captured-development.js';
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const unique = rows => [...new Set(rows.filter(Boolean))];

/** Explain the evaluated lineup, never build a new team or infer missing roles.
 * Fact quotes stay separate from the planner's mechanic matches. In particular,
 * a healing Skill match does not establish an automatic/reactive healing trigger.
 */
export function buildTeamExplanation({result,request,optionIndex=0,guideData}) {
  if(request.intent!=='explanation')return null;
  const selected=new Set((result.team||[]).map(row=>row.champion.id));
  const names=ids=>ids.map(id=>guideData.champions.find(row=>row.id===id)?.name).filter(Boolean);
  const members=(result.team||[]).map(member=>({
    variantId:member.champion.id,name:member.champion.name,
    required:(request.requiredVariantIds||[]).includes(member.champion.id),
    focused:request.subjectVariantId===member.champion.id,
    facts:(member.reasons||[]).filter(row=>row.fact&&row.factProvenanceRef).filter((row,index,all)=>all.findIndex(other=>other.fact===row.fact&&other.factProvenanceRef===row.factProvenanceRef)===index).map(row=>({
      text:row.fact,sourceRef:row.factProvenanceRef,
      matches:unique((member.scoringContributions||[]).filter(part=>part.score>0&&part.factProvenanceRef===row.factProvenanceRef&&part.fact===row.fact).map(part=>part.mechanicName)),
    })),
    itemState:member.itemState||'unknown',itemName:member.item?.name||null,
    tradeoff:member.skillTradeoff||null,
    development:capturedDevelopment(member.champion),
  }));
  const synergy=(result.teamSynergy||[]).filter(row=>row.score>0&&row.provenanceRef&&['verified_fact','strategy_inference'].includes(row.evidenceCategory)&&(!row.contributors||row.contributors.every(id=>selected.has(id)))).map(row=>({text:row.text,sourceRef:row.provenanceRef,kind:row.evidenceCategory==='verified_fact'?'Source-backed team effect':'Strategy inference'}));
  const leader=result.leader&&selected.has(result.leader.champion.id)?{
    name:result.leader.champion.name,
    fact:result.leader.evidence?.variantId===result.leader.champion.id&&result.leader.evidence?.reviewStatus==='complete'&&result.leader.evidence?.provenanceRef?result.leader.evidence.factText:null,
    sourceRef:result.leader.evidence?.variantId===result.leader.champion.id?result.leader.evidence.provenanceRef:null,
    referenceOnly:result.leader.evidence?.referenceOnly===true,
  }:null;
  return {
    optionNumber:optionIndex+1,targetName:result.target.name,
    development:describeTeamDevelopment((result.team||[]).map(member=>member.champion),result.rankingPolicy,guideData.verifiedCollection),
    subjectName:members.find(row=>row.focused)?.name||null,
    members,synergy,leader,
    requiredNames:names(request.requiredVariantIds||[]),excludedNames:names(request.excludedVariantIds||[]),
    partial:result.status==='partial_curated',
    curatedSource:result.curatedRecommendation?.provenanceRef||null,
    warnings:unique([...(result.dangers||[]),...(result.missingDataWarnings||[]),...(result.wrathSynergy?.limitations||[])]),
    sourceRefs:unique([...members.flatMap(row=>row.facts.map(fact=>fact.sourceRef)),...members.flatMap(row=>row.tradeoff?.sourceRefs||[]),...describeTeamDevelopment((result.team||[]).map(member=>member.champion),result.rankingPolicy,guideData.verifiedCollection).sourceRefs,...synergy.map(row=>row.sourceRef),leader?.sourceRef,result.curatedRecommendation?.provenanceRef]),
  };
}

export function teamExplanationIntro(answer) {
  const plan=answer.teamExplanation;
  if(!plan)return '';
  return plan.subjectName?`Why ${plan.subjectName} is in Team Option ${plan.optionNumber} for ${plan.targetName}.`:`Why Team Option ${plan.optionNumber} was suggested for ${plan.targetName}.`;
}

export function teamExplanationMarkup(answer) {
  const plan=answer.teamExplanation;
  if(!plan)return '';
  const constraints=[plan.requiredNames.length?`Required: ${plan.requiredNames.join('; ')}.`:'',plan.excludedNames.length?`Excluded: ${plan.excludedNames.join('; ')}.`:''].filter(Boolean);
  const members=plan.members.map(member=>`<li data-variant-id="${esc(member.variantId)}"><h4>${esc(member.name)}${member.focused?' · Requested champion':''}</h4>${capturedDevelopmentMarkup({id:member.variantId,screenshotState:{development:member.development}})}${member.required?'<p>Included because you required this exact variant.</p>':''}${member.facts.length?member.facts.map(fact=>`<p>${esc(fact.text)}</p>${fact.matches.length?`<p><strong>Battle-plan match:</strong> ${esc(fact.matches.join(', '))}. This is a strategy inference; the quoted effect keeps its stated trigger and conditions.</p>`:''}`).join(''):'<p>No separate source-backed battle contribution is established for this exact variant.</p>'}${member.tradeoff?`<p><strong>Conditional Skill tradeoff:</strong> ${esc(member.tradeoff.summary||member.tradeoff.limitations[0])}</p>${member.tradeoff.steps.length?`<ul>${member.tradeoff.steps.map(row=>`<li>${esc(row.text)}</li>`).join('')}</ul>`:''}`:''}${member.itemName?`<p><strong>${esc(member.itemName)}:</strong> ${member.itemState==='enabled'?'Enabled for this plan; only separately modeled effects and their stated triggers are credited.':'Not credited in this plan; item state is '+esc(member.itemState)+'.'}</p>`:''}</li>`).join('');
  const leader=plan.leader?`<p><strong>Selected Leader: ${esc(plan.leader.name)}.</strong> ${esc(plan.leader.fact||'The selected lineup names this Leader, but a complete Leader effect is not established here.')}${plan.leader.referenceOnly?' Captured reference only; not included in planning points.':''}</p>`:'<p><strong>Leader gap:</strong> No verified Leader choice is established for this lineup.</p>';
  return `<section class="team-explanation"><h3>Selected lineup · Team Option ${plan.optionNumber}</h3>${plan.development?developmentNoticeMarkup(plan.development):''}${constraints.length?`<p class="explanation-constraints">${esc(constraints.join(' '))}</p>`:''}${plan.partial?'<p>The official lineup has unresolved variants. A complete five-champion explanation is not established; no missing identity or role has been guessed.</p>':`<h3>What each champion contributes</h3><ul class="explanation-members">${members}</ul>${leader}<h3>How this lineup fits together</h3>${plan.synergy.length?`<ul>${plan.synergy.map(row=>`<li><strong>${esc(row.kind)}:</strong> ${esc(row.text)}</li>`).join('')}</ul>`:'<p>No additional source-backed combination is established for these five. Individual effects alone do not prove a team synergy.</p>'}`}<p>This explains the selected option, not a proven best team or a guaranteed win. Unmodeled traits, unknown equipment, and battle timing are not assumed. Your constraints remain in effect; any existing alternatives are unchanged.</p><details class="evidence-details"><summary>Sources and limits for this explanation</summary>${plan.curatedSource?`<p>Official lineup source: ${esc(plan.curatedSource)}</p>`:''}<ul>${plan.sourceRefs.map(ref=>`<li>${esc(ref)}</li>`).join('')}${plan.warnings.map(text=>`<li>${esc(text)}</li>`).join('')}</ul></details></section>`;
}
