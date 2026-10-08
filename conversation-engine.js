import { evaluateExactTeam, parseStrategyQuestion, recommendDistinctTeams, strategyLabel } from './strategy-engine.js';

const normalize = value => String(value||'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const baseName = name => normalize(String(name||'').split(/\s+[—-]\s+/)[0]);

function inferTarget(question, targets) {
  const explicit=parseStrategyQuestion(question,targets);
  if(explicit)return explicit;
  const text=normalize(question);
  if(/\b(defense|defence|defensive)\b/.test(text))return targets.find(row=>row.id==='raid:defense')||null;
  if(/\b(attack|attacking|offense|offence)\b/.test(text) || (/\braid\b/.test(text)&&/\b(against|counter|opposing|enemy)\b/.test(text)))return targets.find(row=>row.id==='raid:attack')||null;
  return null;
}
function intentFor(text) {
  if(/\b(dont have|do not have|without|replace|replacement|substitute|instead)\b/.test(text))return 'substitution';
  if(/\b(another|alternate|alternative|different|more options)\b/.test(text))return 'alternate';
  if(/\bwho\b.*\bleader\b|\bwhich\b.*\bleader\b|\bleader\?$/.test(text))return 'leader';
  if(/\bhow\b.*\b(play|use|fight|beat)\b|\bstrategy\b|\btiming\b|\bsequence\b/.test(text))return 'how_to';
  if(/\bwhy\b/.test(text))return 'explanation';
  return 'recommendation';
}
function mentionedMembers(question,team) {
  const text=normalize(question);
  return (team||[]).filter(member=>{
    const champion=member.champion||member,full=normalize(champion.name),base=baseName(champion.name),first=base.split(' ')[0];
    return (full.length>3&&text.includes(full))||(base.length>3&&text.includes(base))||(first.length>3&&new RegExp(`\\b${first}\\b`).test(text));
  });
}

/** Route public questions only to supported deterministic battle targets. */
export function parseConversationRequest(question,{targets,context={},guideData}={}) {
  const text=normalize(question);
  if(!text)return {status:'needs_clarification',message:'Ask about a Legendary Assault encounter, Raid attack or defense, or a War battlefield.'};
  const intent=intentFor(text);
  const target=inferTarget(question,targets)||(context.targetId?targets.find(row=>row.id===context.targetId):null);
  if(!target)return {status:'needs_clarification',message:'Name an encounter, Raid attack or defense, or a War battlefield so I can use the correct verified rules.'};
  const mentions=mentionedMembers(question,context.lastResult?.team||[]);
  if(['substitution','explanation'].includes(intent)&&mentions.length>1)return {status:'ambiguous_variant',targetId:target.id,intent,message:'More than one exact variant matches that name in this team. Use the full variant name.'};
  let subjectVariantId=mentions[0]?.champion.id||null;
  if(intent==='substitution'&&!subjectVariantId){
    const allMatches=guideData.champions.filter(champion=>{
      const full=normalize(champion.name),base=baseName(champion.name),first=base.split(' ')[0];
      return (full.length>3&&text.includes(full))||(base.length>3&&text.includes(base))||(first.length>3&&new RegExp(`\\b${first}\\b`).test(text));
    });
    if(allMatches.length!==1)return {status:'ambiguous_variant',targetId:target.id,intent,message:'I could not identify one exact champion variant to replace. Use the full variant name or start from a recommended team.'};
    subjectVariantId=allMatches[0].id;
  }
  const mechanicIds=(context.strategyData?.mechanics||[]).filter(row=>text.includes(normalize(row.name))||text.includes(normalize(row.id.replaceAll('_',' ')))).map(row=>row.id);
  return {status:'ready',question,targetId:target.id,intent,subjectVariantId,mechanicIds,excludedVariantIds:[...(context.excludedVariantIds||[])]};
}

function currentCurated(strategyData,targetId) {
  return strategyData.curatedRecommendations.filter(row=>row.targetId===targetId&&row.active&&row.reviewStatus==='reviewed'&&Number(row.confidence)>=.9&&row.members.length===5&&row.members.every(member=>member.variantId)&&row.leaderVariantId)
    .sort((a,b)=>Number(b.confidence)-Number(a.confidence)||String(b.effectiveDate||'').localeCompare(String(a.effectiveDate||'')))[0]||null;
}
function partialCurated(strategyData,targetId) {
  return strategyData.curatedRecommendations.find(row=>row.targetId===targetId&&row.active&&row.reviewStatus==='partial'&&row.members.length===5)||null;
}
function sameLineup(left,right) {
  return left.team.length===5&&right.team.length===5&&left.team.map(row=>row.champion.id).sort().join('|')===right.team.map(row=>row.champion.id).sort().join('|');
}

/** The first-party lineup is first; public engine alternatives follow only when
 * target mechanics support them. Unresolved official positions stay unresolved. */
export function buildTeamOptions({guideData,strategyData,targetId,excludeVariantIds=[],limit=5,raidDefense=null}) {
  const excluded=new Set(excludeVariantIds),options=[];
  const curated=currentCurated(strategyData,targetId);
  const partial=!curated?partialCurated(strategyData,targetId):null;
  if(curated&&!curated.members.some(member=>excluded.has(member.variantId))) {
    const exact=evaluateExactTeam({guideData,strategyData,targetId,variantIds:curated.members.map(row=>row.variantId),leaderVariantId:curated.leaderVariantId});
    options.push({...exact,curatedRecommendation:curated,strategyLabel:'Official In-Game Recommendation',evidenceTier:exact.target.evidenceState==='insufficient'?'Official lineup · ability details incomplete':'Official In-Game Recommendation'});
  } else if(partial&&!partial.members.some(member=>member.variantId&&excluded.has(member.variantId))) {
    const target=strategyData.targets.find(row=>row.id===targetId);
    options.push({status:'partial_curated',target,curatedRecommendation:partial,recommendationSource:'curated_partial',strategyLabel:'Official In-Game Recommendation',team:[],leader:null});
  }
  if(options.length<limit) {
    const alternatives=recommendDistinctTeams({guideData,strategyData,targetId,excludeVariantIds,limit,raidDefense});
    for(const alternative of alternatives) {
      if(options.length>=limit)break;
      if(options.some(row=>sameLineup(row,alternative)))continue;
      options.push({...alternative,strategyLabel:strategyLabel(alternative)});
    }
  }
  return options;
}

/** Conversation selects among deterministic options; it never assembles a team. */
export function answerStrategyQuestion({question,guideData,strategyData,context={},enemyVariantIds=[]}) {
  const request=parseConversationRequest(question,{targets:strategyData.targets,context:{...context,strategyData},guideData});
  if(request.status!=='ready')return {...request,question};
  const previous=context.lastResult||null;
  if(['leader','how_to','explanation'].includes(request.intent)&&previous?.target.id===request.targetId) {
    if(request.intent==='explanation'&&request.subjectVariantId&&!previous.team.some(row=>row.champion.id===request.subjectVariantId))return {status:'needs_clarification',question,request,message:'That exact variant is not on the current recommended team.'};
    const focusRules=request.mechanicIds.flatMap(id=>strategyData.rules.filter(row=>(row.targetId===request.targetId||row.targetId==null)&&row.mechanicId===id));
    return {status:'ready',question,request,result:previous,options:context.options||[previous],focus:{intent:request.intent,subjectVariantId:request.subjectVariantId,mechanicIds:request.mechanicIds,rules:focusRules},context};
  }
  const excluded=new Set(request.excludedVariantIds);
  if(request.intent==='substitution'&&request.subjectVariantId)excluded.add(request.subjectVariantId);
  const options=request.intent==='alternate'&&context.targetId===request.targetId&&context.options?.length?context.options:buildTeamOptions({guideData,strategyData,targetId:request.targetId,excludeVariantIds:[...excluded]});
  if(!options.length)return {status:'needs_clarification',question,request,message:'No five-person team has enough verified support for this battle yet.'};
  const index=request.intent==='alternate'&&context.targetId===request.targetId?(context.optionIndex+1)%options.length:0;
  if(request.intent==='alternate'&&options.length<2)return {status:'needs_clarification',question,request,message:'No other strategically distinct lineup has enough verified support for this battle yet.'};
  const result=request.intent==='substitution'||request.intent==='alternate'?{...options[index],recommendationSource:options[index].recommendationSource==='engine'?'engine_alternative':options[index].recommendationSource}:options[index];
  const selectedEnemy=enemyVariantIds.length?enemyVariantIds:context.targetId===request.targetId?(context.enemyVariantIds||[]):[];
  const enemySet=new Set(selectedEnemy);
  const enemyThreats=request.targetId==='raid:attack'?[...enemySet].slice(0,5).flatMap(id=>{
    const champion=guideData.champions.find(row=>row.id===id);
    return champion?strategyData.championFacts.filter(row=>row.variantId===id&&row.reviewStatus==='complete'&&row.context!=='metadata').slice(0,3).map(row=>({champion:champion.name,mechanicId:row.mechanicId,text:row.factText,provenanceRef:row.provenanceRef})):[];
  }):[];
  return {status:'ready',question,request,result,options,enemyThreats,focus:{intent:request.intent,subjectVariantId:request.subjectVariantId,mechanicIds:request.mechanicIds,rules:[]},context:{targetId:request.targetId,excludedVariantIds:[...excluded],lastResult:result,options,optionIndex:index,enemyVariantIds:[...enemySet]}};
}
