import { evaluateExactTeam, parseStrategyQuestion, recommendTeam } from './strategy-engine.js';

const normalize = value => String(value||'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const baseName = name => normalize(String(name||'').split(/\s+[—-]\s+/)[0]);

function inferTarget(question, targets) {
  const explicit = parseStrategyQuestion(question,targets);
  if (explicit) return explicit;
  const text=normalize(question);
  if (/\b(defense|defence|defensive)\b/.test(text)) return targets.find(row=>row.id==='raid:defense')||null;
  if (/\b(attack|attacking|offense|offence)\b/.test(text)) return targets.find(row=>row.id==='raid:attack')||null;
  return null;
}

function intentFor(text) {
  if (/\b(which|what)\b.*\bofficial team\b.*\bclosest\b/.test(text)) return 'closest_official';
  if (/\b(who|which)\b.*\bmissing\b|\bhow close\b|\bown\b.*\bof\b.*\bfive\b/.test(text)) return 'missing';
  if (/\b(who|what)\b.*\bbuild next\b|\bwhat champion\b.*\bimprove\b/.test(text)) return 'build_next';
  if (/\b(dont have|do not have|without|replace|replacement|substitute|instead)\b/.test(text)) return 'substitution';
  if (/\b(another|alternate|alternative|different)\b/.test(text) && /\b(team|lineup|five)\b/.test(text)) return 'alternate';
  if (/\bwho\b.*\bleader\b|\bwhich\b.*\bleader\b|\bleader\?$/.test(text)) return 'leader';
  if (/\bhow\b.*\b(play|use|fight|beat)\b|\bstrategy\b|\btiming\b|\bsequence\b/.test(text)) return 'how_to';
  if (/\bwhy\b/.test(text)) return 'explanation';
  return 'recommendation';
}

function mentionedMembers(question,team) {
  const text=normalize(question);
  return (team||[]).filter(member=>{
    const champion=member.champion||member;
    const full=normalize(champion.name);
    const base=baseName(champion.name);
    const first=base.split(' ')[0];
    return (full.length>3&&text.includes(full))||(base.length>3&&text.includes(base))||(first.length>3&&new RegExp(`\\b${first}\\b`).test(text));
  });
}

/** Convert player wording to a deterministic request. */
export function parseConversationRequest(question,{targets,context={},guideData,roster=null}={}) {
  const text=normalize(question);
  if (!text) return {status:'needs_clarification',message:'Ask about a Legendary Assault encounter, Raid attack or defense, or a War battlefield.'};
  const intent=intentFor(text);
  // An explicit new battle question resets the mode; short follow-ups inherit it.
  const explicitTarget=Boolean(inferTarget(question,targets));
  const explicitRoster=/\b(my|mine)\b|\bfrom my roster\b|\bcan i make\b|\bhow close\b|\bwho am i missing\b|\bwhich champions am i missing\b/.test(text);
  const rosterMode=Boolean(explicitRoster || (!explicitTarget && context.rosterMode) || ['closest_official','build_next'].includes(intent));
  if (intent==='closest_official') return {status:'ready',question,targetId:null,intent,rosterMode,roster:roster?{ownedVariantIds:roster.ownedVariantIds||[],levels:roster.levels||{},stars:roster.stars||{}}:null};
  const target=inferTarget(question,targets)||(context.targetId?targets.find(row=>row.id===context.targetId):null);
  if (!target) return {status:'needs_clarification',message:'Name an encounter, Raid attack or defense, or a War battlefield so I can use the correct verified rules.'};
  const priorTeam=context.lastResult?.team||[];
  const mentions=mentionedMembers(question,priorTeam);
  let subjectVariantId=null;
  if (['substitution','explanation'].includes(intent) && mentions.length>1) {
    return {status:'ambiguous_variant',targetId:target.id,intent,message:'More than one exact variant matches that name in the current team. Use the full variant name or tap the champion card.'};
  }
  if (mentions.length===1) subjectVariantId=mentions[0].champion.id;
  if (intent==='substitution' && !subjectVariantId) {
    const allMatches=guideData.champions.filter(champion=>{
      const full=normalize(champion.name),base=baseName(champion.name);
      const first=base.split(' ')[0];
      return (full.length>3&&text.includes(full))||(base.length>3&&text.includes(base))||(first.length>3&&new RegExp(`\\b${first}\\b`).test(text));
    });
    if (allMatches.length===1) subjectVariantId=allMatches[0].id;
    else if (allMatches.length===0 && context.lastSubstitutedVariantId) subjectVariantId=context.lastSubstitutedVariantId;
    else if (allMatches.length===0 && context.lastResult?.rosterComparison?.knownMissing.length===1) subjectVariantId=context.lastResult.rosterComparison.knownMissing[0].variantId;
    else return {status:'ambiguous_variant',targetId:target.id,intent,message:'I could not identify one exact champion variant to replace. Use the full variant name or start from a recommended team.'};
  }
  const mechanicIds=(context.strategyData?.mechanics||[]).filter(row=>text.includes(normalize(row.name))||text.includes(normalize(row.id.replaceAll('_',' ')))).map(row=>row.id);
  return {
    status:'ready',question,targetId:target.id,intent,subjectVariantId,mechanicIds,rosterMode,
    excludedVariantIds:[...(context.excludedVariantIds||[])],
    roster:roster?{
      ownedVariantIds:roster.ownedVariantIds||[],levels:roster.levels||{},stars:roster.stars||{},gear:roster.gear||{},equippedItemIds:roster.equippedItemIds||{}
    }:null,
  };
}

export function compareCuratedRoster(curated,ownedVariantIds) {
  const owned=new Set(ownedVariantIds);
  const known=curated.members.filter(member=>member.variantId);
  return {
    targetId:curated.targetId,
    knownOwned:known.filter(member=>owned.has(member.variantId)),
    knownMissing:known.filter(member=>!owned.has(member.variantId)),
    unresolved:curated.members.filter(member=>!member.variantId),
    exact:known.length===5,
    ownedCount:known.filter(member=>owned.has(member.variantId)).length,
  };
}

function closestOfficial(strategyData,ownedVariantIds) {
  return strategyData.curatedRecommendations
    .filter(row=>row.active && row.members.length===5 && row.members.every(member=>member.variantId))
    .map(row=>({curated:row,comparison:compareCuratedRoster(row,ownedVariantIds)}))
    .sort((a,b)=>b.comparison.ownedCount-a.comparison.ownedCount || a.curated.targetId.localeCompare(b.curated.targetId))[0]||null;
}

function currentCurated(strategyData,targetId) {
  return strategyData.curatedRecommendations
    .filter(row=>row.targetId===targetId && row.active && row.reviewStatus==='reviewed' && Number(row.confidence)>=.9 && row.members.length===5 && row.members.every(member=>member.variantId) && row.leaderVariantId)
    .sort((a,b)=>Number(b.confidence)-Number(a.confidence) || String(b.effectiveDate||'').localeCompare(String(a.effectiveDate||'')))[0]||null;
}

function partialCurated(strategyData,targetId) {
  return strategyData.curatedRecommendations.find(row=>row.targetId===targetId && row.active && row.reviewStatus==='partial' && row.members.length===5)||null;
}

/** Apply the fixed precedence: curated, then deterministic engine. Community
 * observations remain explanatory context and can never supply the team. */
export function answerStrategyQuestion({question,guideData,strategyData,context={},roster=null}) {
  const request=parseConversationRequest(question,{targets:strategyData.targets,context:{...context,strategyData},guideData,roster});
  if (request.status!=='ready') return {...request,question};
  if (request.rosterMode && !roster) return {status:'roster_required',question,request,message:'Sign in and add your exact champion variants to My Roster before asking for a roster team.'};
  if (request.intent==='closest_official') {
    const closest=closestOfficial(strategyData,roster.ownedVariantIds);
    return {status:'roster_analysis',question,request,analysis:closest,context:{...context,rosterMode:true}};
  }
  const previous=context.lastResult||null;
  const previousStillOwned=!request.rosterMode || !previous?.team?.length || previous.team.every(row=>roster.ownedVariantIds.includes(row.champion.id));
  if (previous?.status==='partial_curated' && request.intent==='substitution' && !request.rosterMode) {
    return {status:'needs_clarification',question,request,message:'Some champion variants in this first-party lineup are not identified yet. Ask for an engine-derived alternative team instead.'};
  }
  if (request.rosterMode && ['missing','build_next'].includes(request.intent)) {
    const curatedForGap=currentCurated(strategyData,request.targetId)||partialCurated(strategyData,request.targetId);
    if (!curatedForGap) return {status:'roster_analysis',question,request,analysis:null,context:{...context,targetId:request.targetId,rosterMode:true}};
    const comparison=compareCuratedRoster(curatedForGap,roster.ownedVariantIds);
    return {status:'roster_analysis',question,request,analysis:{curated:curatedForGap,comparison},context:{...context,targetId:request.targetId,rosterMode:true,lastResult:previous}};
  }
  if (request.rosterMode && request.intent==='substitution' && !request.subjectVariantId && previous?.rosterComparison?.knownMissing.length===1) {
    return {status:'roster_analysis',question,request,analysis:{curated:previous.curatedRecommendation,comparison:previous.rosterComparison,replacement:previous.rosterReplacements?.[0]||null},context:{...context,rosterMode:true}};
  }
  if (['leader','how_to','explanation'].includes(request.intent) && previous && previousStillOwned && previous.target.id===request.targetId) {
    if (request.intent==='explanation' && request.subjectVariantId && !previous.team.some(row=>row.champion.id===request.subjectVariantId)) {
      return {status:'needs_clarification',question,request,message:'That exact variant is not on the current recommended team.'};
    }
    const focusRules=request.mechanicIds.flatMap(id=>strategyData.rules.filter(row=>(row.targetId===request.targetId||row.targetId==null)&&row.mechanicId===id));
    return {status:'ready',question,request,result:previous,focus:{intent:request.intent,subjectVariantId:request.subjectVariantId,mechanicIds:request.mechanicIds,rules:focusRules},context:{...context,targetId:request.targetId,lastResult:previous}};
  }
  const excluded=new Set(request.excludedVariantIds);
  if (request.intent==='substitution' && request.subjectVariantId) excluded.add(request.subjectVariantId);
  if (request.intent==='alternate' && previous?.target.id===request.targetId) previous.team.forEach(row=>excluded.add(row.champion.id));
  const curated=currentCurated(strategyData,request.targetId);
  const partial=!curated && excluded.size===0 && request.intent!=='alternate' ? partialCurated(strategyData,request.targetId) : null;
  if (partial && !request.rosterMode) {
    const target=strategyData.targets.find(row=>row.id===request.targetId);
    const result={status:'partial_curated',target,curatedRecommendation:partial,recommendationSource:'curated_partial',team:[],leader:null};
    return {status:'ready',question,request,result,focus:{intent:request.intent,subjectVariantId:null,mechanicIds:[],rules:[]},context:{targetId:request.targetId,excludedVariantIds:[],lastResult:result}};
  }
  let result;
  const owned=request.rosterMode?new Set(roster.ownedVariantIds):null;
  const comparison=curated||partial?compareCuratedRoster(curated||partial,roster?.ownedVariantIds||[]):null;
  if (curated && excluded.size===0 && request.intent!=='alternate' && (!owned || curated.members.every(member=>owned.has(member.variantId)))) {
    result=evaluateExactTeam({guideData,strategyData,targetId:request.targetId,variantIds:curated.members.map(row=>row.variantId),leaderVariantId:curated.leaderVariantId});
    result={...result,curatedRecommendation:curated};
    if (result.target.evidenceState==='insufficient') result={...result,evidenceTier:'First-party lineup · ability details incomplete'};
  } else {
    const required=owned && curated && request.intent!=='alternate' ? curated.members.map(row=>row.variantId).filter(id=>owned.has(id)&&!excluded.has(id)) : [];
    result=recommendTeam({guideData,strategyData,targetId:request.targetId,excludeVariantIds:[...excluded],ownedVariantIds:owned?[...owned]:null,requiredVariantIds:required,preferredLeaderVariantId:curated&&required.includes(curated.leaderVariantId)?curated.leaderVariantId:null});
    if (result.status==='ready' && (request.intent==='substitution'||request.intent==='alternate')) result={...result,evidenceTier:'Alternative viable team',recommendationSource:'engine_alternative'};
  }
  if (owned && result.status==='ready') {
    const officialIds=new Set((curated||partial)?.members.map(member=>member.variantId).filter(Boolean)||[]);
    const rosterReplacements=result.team.filter(member=>!officialIds.has(member.champion.id)).map(member=>member.champion);
    result={...result,recommendationSource:curated&&comparison?.knownMissing.length===0&&excluded.size===0?'roster_curated':'roster_engine',evidenceTier:'Best team from your roster',curatedRecommendation:curated||partial||null,rosterComparison:comparison,rosterReplacements,substitutes:result.substitutes.filter(row=>owned.has(row.champion.id)),missingDataWarnings:[...result.missingDataWarnings.filter(row=>!row.includes('owned champions are not included')), 'Level and stars are saved but do not affect team selection yet.']};
  }
  return {
    status:'ready',question,request,result,
    focus:{intent:request.intent,subjectVariantId:request.subjectVariantId,mechanicIds:request.mechanicIds,rules:[]},
    context:{targetId:request.targetId,excludedVariantIds:[...excluded],lastResult:result,rosterMode:request.rosterMode,lastSubstitutedVariantId:request.intent==='substitution'?request.subjectVariantId:context.lastSubstitutedVariantId},
  };
}
