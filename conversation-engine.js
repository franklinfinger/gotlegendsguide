import { rankingPolicy } from './mode-ranking.js';
import { collectionExclusions } from './verified-handoff.js';
import { buildTeamExplanation } from './team-explanation.js';
import { recommendPrebattleTeams, supportsPrebattleTarget } from './prebattle-plan-engine.js';
import { mechanicCurrentnessIssue } from './mechanics-currentness.js';
import { analyzeRaidDefense } from './raid-engine.js';
import { evaluateExactTeam, parseStrategyQuestion, recommendDistinctTeams, recommendTeam, strategyLabel } from './strategy-engine.js';

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
  const text=' '+normalize(question)+' ';
  const rows=(team||[]).map(member=>({member,full:normalize((member.champion||member).name),base:baseName((member.champion||member).name)}));
  const matches=value=>value.length>3&&text.includes(' '+value+' ');
  const exact=rows.filter(row=>matches(row.full));
  if(exact.length) {
    const longest=exact.filter(row=>!exact.some(other=>other!==row&&other.full.includes(row.full)&&other.full.length>row.full.length));
    const ambiguousBare=longest.some(row=>row.full===row.base&&rows.filter(other=>other.base===row.base).length>1);
    if(!ambiguousBare)return longest.map(row=>row.member);
  }
  const bases=rows.filter(row=>matches(row.base));
  if(bases.length)return bases.map(row=>row.member);
  return rows.filter(row=>matches(row.base.split(' ')[0])).map(row=>row.member);
}

// Resolve whole known identities before interpreting conjunctions or clauses.
// A title may itself contain "and" or "for"; unmatched text is never discarded.
const constraintText=value=>String(value||'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9,]+/g,' ').replace(/\s+/g,' ').trim();
function constraintList(text,start,guideData,allowChampions,allowItems,allowShort=false) {
  const entities=[...(allowChampions?guideData.champions.flatMap(row=>[row.name,baseName(row.name),...(allowShort?[baseName(row.name).split(' ')[0]]:[])].map(name=>({name:constraintText(name),id:row.id,kind:'champion',row}))):[]),...(allowItems?(guideData.items||[]).map(row=>({name:constraintText(row.name),id:row.id,kind:'item',row})):[])];
  const values=[];
  let at=start;
  const boundary=/^(?:(?:but|and)\s+)?(?:with|without|exclude|excluding|not|except|avoid|leave out|(?:i )?(?:do not have|dont have)|do not include|dont include|do not use|dont use|(?:who|what) (?:should|can) i use|for|against|explain|equipped|enable|disable|disabled|around|including|include|must include|using)\b/;
  while(at<text.length) {
    const rest=text.slice(at);
    const possible=entities.filter(row=>rest===row.name||rest.startsWith(row.name+' ')||rest.startsWith(row.name+','));
    const longest=Math.max(0,...possible.map(row=>row.name.length));
    const matches=possible.filter(row=>row.name.length===longest).filter((row,index,all)=>all.findIndex(other=>other.kind===row.kind&&other.id===row.id)===index);
    if(matches.length!==1)return {status:matches.length?'ambiguous_variant':'needs_clarification',message:'Specify one full exact champion variant or verified item for this constraint: '+rest+'.'};
    values.push(matches[0]);at+=longest;
    while(text[at]===' ')at++;
    if(at===text.length||boundary.test(text.slice(at)))break;
    if(text[at]===',') {at++;while(text[at]===' ')at++;if(text.slice(at).startsWith('and '))at+=4;if(boundary.test(text.slice(at)))break;}
    else if(text.slice(at).startsWith('and '))at+=4;
    else return {status:'needs_clarification',message:'Unrecognized text after '+matches[0].row.name+': '+text.slice(at)+'. State each required or excluded exact variant explicitly.'};
    if(at===text.length||boundary.test(text.slice(at)))return {status:'needs_clarification',message:'A champion or item is missing after the list separator.'};
  }
  return values.length?{status:'ready',values,end:at}:{status:'needs_clarification',message:'Name the exact champion variant or item for this constraint.'};
}

function buildConstraints(question, guideData) {
  const text=constraintText(question),requiredVariantIds=[],excludedVariantIds=[],itemStates={};
  const markers=/\b(must include|do not include|dont include|do not use|dont use|do not have|dont have|not including|but not|and not|leave out|including|include|around|using|team with|without|excluding|exclude|except|avoid|equipped|enable|disable|disabled|with|not)(?:\s+|$)/g;
  let match,explicitChampionConstraint=false;
  while((match=markers.exec(text))) {
    const marker=match[1],availability=['do not have','dont have'].includes(marker),negative=availability||['without','excluding','exclude','but not','and not','except','avoid','leave out','do not include','dont include','do not use','dont use','not including','not','disable','disabled'].includes(marker);
    // A trailing "Explain how it works with the other four" is prose, not an
    // item constraint. Do not let that prose suppress a later explicit exclusion.
    if(marker==='with'&&/\bexplain\b/.test(text.slice(0,match.index))&&/^the other (?:four|4)(?: champions)?\b/.test(text.slice(markers.lastIndex)))continue;
    const championClause=['must include','including','include','around','using','team with'].includes(marker)||negative&&!['disable','disabled'].includes(marker);
    const parsed=constraintList(text,markers.lastIndex,guideData,championClause,true,availability);
    if(parsed.status!=='ready')return parsed;
    markers.lastIndex=parsed.end;
    for(const value of parsed.values) {
      if(value.kind==='champion') {
        (negative?excludedVariantIds:requiredVariantIds).push(value.id);
        if(!negative)explicitChampionConstraint=true;
      } else {
        const owner=value.row.ownerVariantId,state=negative?'disabled':'enabled';
        if(!guideData.champions.some(row=>row.id===owner))return {status:'needs_clarification',message:'The requested item has no verified exact owner variant.'};
        if(itemStates[owner]&&itemStates[owner]!==state)return {status:'needs_clarification',message:'The same iconic item is both enabled and disabled in this request. Which state should be used?'};
        itemStates[owner]=state;
        if(!negative)requiredVariantIds.push(owner);
      }
    }
  }
  if(requiredVariantIds.some(id=>excludedVariantIds.includes(id)))return {status:'no_feasible_team',message:'The same exact variant is both required and excluded. Choose which constraint should apply.'};
  return {status:'ready',requiredVariantIds:[...new Set(requiredVariantIds)],excludedVariantIds:[...new Set(excludedVariantIds)],itemStates,explicitChampionConstraint};
}

/** Route public questions only to supported deterministic battle targets. */
export function parseConversationRequest(question,{targets,context={},guideData}={}) {
  const text=normalize(question);
  if(!text)return {status:'needs_clarification',message:'Ask about a Legendary Assault encounter, Raid attack or defense, or a War battlefield.'};
  let intent=intentFor(text);
  const target=inferTarget(question,targets)||(context.targetId?targets.find(row=>row.id===context.targetId):null);
  if(!target)return {status:'needs_clarification',message:'Name an encounter, Raid attack or defense, or a War battlefield so I can use the correct verified rules.'};
  const constraints=buildConstraints(question,guideData);
  if(constraints.status!=='ready')return {...constraints,targetId:target.id,intent};
  const inherited=context.targetId===target.id;
  const explicitExcluded=constraints.excludedVariantIds;
  if(constraints.requiredVariantIds.length||Object.keys(constraints.itemStates).length)intent='recommendation';
  else if(explicitExcluded.length)intent=explicitExcluded.length===1&&inherited&&context.lastResult?.team?.some(row=>row.champion.id===explicitExcluded[0])&&!/\b(build|rebuild|recommend|new team|another team|different team|start over)\b/.test(text)?'substitution':'recommendation';
  const requiredVariantIds=constraints.explicitChampionConstraint?constraints.requiredVariantIds:[...new Set([...(inherited?context.requiredVariantIds||[]:[]).filter(id=>!explicitExcluded.includes(id)),...constraints.requiredVariantIds])];
  const excludedVariantIds=[...new Set([...(context.excludedVariantIds||[]),...explicitExcluded])];
  if(requiredVariantIds.some(id=>excludedVariantIds.includes(id)))return {status:'no_feasible_team',targetId:target.id,intent,message:'A required exact variant conflicts with the active exclusions.'};
  const itemStates={...(inherited?context.itemStates||{}:{}),...constraints.itemStates};
  const mentions=explicitExcluded.length&&intent==='substitution'?[]:mentionedMembers(question,context.lastResult?.team||[]);
  if(['substitution','explanation'].includes(intent)&&mentions.length>1)return {status:'ambiguous_variant',targetId:target.id,intent,message:'More than one exact variant matches that name in this team. Use the full variant name.'};
  let subjectVariantId=intent==='substitution'&&explicitExcluded.length===1?explicitExcluded[0]:mentions[0]?.champion.id||null;
  if(intent==='substitution'&&!subjectVariantId){
    const allMatches=mentionedMembers(question,guideData.champions);
    if(allMatches.length!==1)return {status:'ambiguous_variant',targetId:target.id,intent,message:'I could not identify one exact champion variant to replace. Use the full variant name or start from a recommended team.'};
    subjectVariantId=allMatches[0].id;
  }
  const mechanicIds=(context.strategyData?.mechanics||[]).filter(row=>text.includes(normalize(row.name))||text.includes(normalize(row.id.replaceAll('_',' ')))).map(row=>row.id);
  return {status:'ready',question,targetId:target.id,intent,subjectVariantId,mechanicIds,requiredVariantIds,itemStates,excludedVariantIds};
}

function currentCurated(strategyData,targetId) {
  return strategyData.curatedRecommendations.filter(row=>row.targetId===targetId&&row.active&&row.reviewStatus==='reviewed'&&Number(row.confidence)>=.9&&row.members.length===5&&row.members.every(member=>member.variantId)&&row.leaderVariantId)
    .sort((a,b)=>Number(b.confidence)-Number(a.confidence)||String(b.effectiveDate||'').localeCompare(String(a.effectiveDate||'')))[0]||null;
}
function partialCurated(strategyData,targetId) {
  return strategyData.curatedRecommendations.find(row=>row.targetId===targetId&&row.active&&row.reviewStatus==='partial'&&row.members.length===5)||null;
}
function respectsExclusions(result,excludedIds) {
  const excluded=new Set(excludedIds);
  return !(result.team||[]).some(row=>excluded.has(row.champion.id)||row.substitute&&excluded.has(row.substitute.champion.id))
    &&!(result.substitutes||[]).some(row=>excluded.has(row.champion.id))
    &&!['present','options'].some(key=>(result.capturedAllyPairs?.[key]||[]).some(pair=>pair.variantIds.some(id=>excluded.has(id))));
}
function sameLineup(left,right) {
  return left.team.length===5&&right.team.length===5&&left.team.map(row=>row.champion.id).sort().join('|')===right.team.map(row=>row.champion.id).sort().join('|');
}

/** Opening a current displayed option changes follow-up focus, not constraints. */
export function selectConversationOption(context,index) {
  const option=Number.isInteger(index)&&context.options?.[index];
  if(!option||option.target.id!==context.targetId||!respectsExclusions(option,context.excludedVariantIds||[])||(context.requiredVariantIds||[]).some(id=>!option.team.some(row=>row.champion.id===id)))return context;
  return {...context,lastResult:option,optionIndex:index};
}

/** The first-party lineup is first; public engine alternatives follow only when
 * target mechanics support them. Unresolved official positions stay unresolved. */
export function buildTeamOptions({guideData,strategyData,targetId,excludeVariantIds=[],limit=5,raidDefense=null,requiredVariantIds=[],itemStates={},itemRanks={},effectContext={}}) {
  excludeVariantIds = [...new Set([...excludeVariantIds,...collectionExclusions(guideData)])];
  if(requiredVariantIds.length) {
    const constrained=recommendTeam({guideData,strategyData,targetId,excludeVariantIds,raidDefense,requiredVariantIds,itemStates,itemRanks,effectContext});
    if(!['ready','insufficient_evidence'].includes(constrained.status))return [];
  }
  if(targetId==='legendary-assault:drogon')return recommendPrebattleTeams({guideData,strategyData,targetId,excludeVariantIds,requiredVariantIds,itemStates,itemRanks,limit}).map(result=>({...result,rankingPolicy:rankingPolicy({battleMode:'legendary-assault',team:result.team})}));
  const excluded=new Set(excludeVariantIds),options=[];
  const curated=currentCurated(strategyData,targetId);
  const partial=!curated?partialCurated(strategyData,targetId):null;
  if(curated&&requiredVariantIds.every(id=>curated.members.some(row=>row.variantId===id))&&!curated.members.some(member=>excluded.has(member.variantId))) {
    const exact=evaluateExactTeam({guideData,strategyData,targetId,variantIds:curated.members.map(row=>row.variantId),leaderVariantId:curated.leaderVariantId,itemStates,requiredVariantIds,excludeVariantIds,itemRanks,effectContext});
    options.push({...exact,curatedRecommendation:curated,strategyLabel:'Official In-Game Recommendation',evidenceTier:exact.target.evidenceState==='insufficient'?'Official lineup · ability details incomplete':'Official In-Game Recommendation'});
  } else if(partial&&!requiredVariantIds.length&&(!excludeVariantIds.length||partial.members.every(member=>member.variantId))&&!partial.members.some(member=>member.variantId&&excluded.has(member.variantId))) {
    const target=strategyData.targets.find(row=>row.id===targetId);
    options.push({status:'partial_curated',target,curatedRecommendation:partial,recommendationSource:'curated_partial',strategyLabel:'Official In-Game Recommendation',team:[],leader:null,rankingPolicy:rankingPolicy({battleMode:target.battleMode,suppliedLineupKeptExact:true})});
  }
  if(options.length<limit) {
    const alternatives=recommendDistinctTeams({guideData,strategyData,targetId,excludeVariantIds,limit,raidDefense,requiredVariantIds,itemStates,itemRanks,effectContext});
    for(const alternative of alternatives) {
      if(options.length>=limit)break;
      if(options.some(row=>sameLineup(row,alternative)))continue;
      options.push({...alternative,strategyLabel:strategyLabel(alternative)});
    }
  }
  return options;
}

/** Conversation selects among deterministic options; it never assembles a team. */
export function answerStrategyQuestion({question,guideData,strategyData,context={},enemyVariantIds=[],enemyLeaderVariantId=null,itemRanks={},effectContext={}}) {
  const request=parseConversationRequest(question,{targets:strategyData.targets,context:{...context,strategyData},guideData});
  if(request.status!=='ready')return {...request,question};
  if(request.targetId==='legendary-assault:drogon'&&!supportsPrebattleTarget(guideData,request.targetId))return {status:'insufficient_evidence',question,request,message:'Reviewed Drogon encounter evidence is missing, incomplete or changed. Cached teams cannot be reused until the source is checked.'};
  const previous=context.lastResult||null;
  const currentExclusions=[...new Set([...request.excludedVariantIds,...collectionExclusions(guideData)])];
  if(!Object.keys(itemRanks).length&&!Object.keys(effectContext).length&&!enemyVariantIds.length&&!enemyLeaderVariantId&&['leader','how_to','explanation'].includes(request.intent)&&previous?.target.id===request.targetId&&respectsExclusions(previous,currentExclusions)&&(context.options||[previous]).every(option=>respectsExclusions(option,currentExclusions))&&!request.requiredVariantIds.some(id=>!previous.team.some(row=>row.champion.id===id))) {
    if(request.intent==='explanation'&&request.subjectVariantId&&!previous.team.some(row=>row.champion.id===request.subjectVariantId))return {status:'needs_clarification',question,request,message:'That exact variant is not on the current recommended team.'};
    const usedRules=new Set(previous.team.flatMap(row=>row.scoringContributions||[]).map(row=>row.ruleId));
    const focusRules=request.mechanicIds.flatMap(id=>strategyData.rules.filter(row=>usedRules.has(row.id)&&row.mechanicId===id)).map(rule=>({...rule,rationale:`${previous.team.filter(member=>member.scoringContributions?.some(row=>row.ruleId===rule.id)).map(member=>member.champion.name).join(', ')}: ${rule.rationale}`}));
    return {status:'ready',question,request,result:previous,options:context.options||[previous],teamExplanation:buildTeamExplanation({result:previous,request,optionIndex:context.optionIndex||0,guideData}),focus:{intent:request.intent,subjectVariantId:request.subjectVariantId,mechanicIds:request.mechanicIds,rules:focusRules},context};
  }
  const excluded=new Set(request.excludedVariantIds);
  if(request.intent==='substitution'&&request.subjectVariantId)excluded.add(request.subjectVariantId);
  const selectedEnemy=enemyVariantIds.length?enemyVariantIds:context.targetId===request.targetId?(context.enemyVariantIds||[]):[];
  let raidDefense=null;
  if(request.targetId==='raid:attack'&&selectedEnemy.length) {
    if(selectedEnemy.length!==5||new Set(selectedEnemy).size!==5||selectedEnemy.some(id=>!guideData.champions.some(row=>row.id===id)))return {status:'needs_clarification',question,request,message:'Specify five distinct verified exact variants for the opposing team.'};
    const leader=enemyLeaderVariantId||(enemyVariantIds.length?null:context.enemyLeaderVariantId)||null;
    if(leader&&!selectedEnemy.includes(leader))return {status:'needs_clarification',question,request,message:'The opposing Leader must be one of the five selected variants.'};
    raidDefense=analyzeRaidDefense({guideData,strategyData,enemyVariantIds:selectedEnemy,leaderVariantId:leader});
  }
  const explicitRequiredVariantIds=request.requiredVariantIds.filter(id=>request.intent!=='substitution'||id!==request.subjectVariantId);
  const preserveOtherFour=request.intent==='substitution'&&previous?.target.id===request.targetId&&previous.team.length===5&&previous.team.some(row=>row.champion.id===request.subjectVariantId)&&! /\b(rebuild|new team|start over|different team)\b/.test(normalize(question));
  const preservedVariantIds=preserveOtherFour?previous.team.filter(row=>row.champion.id!==request.subjectVariantId).map(row=>row.champion.id):[];
  const requiredVariantIds=[...new Set([...explicitRequiredVariantIds,...preservedVariantIds])];
  const constraints={requiredVariantIds,itemStates:request.itemStates,itemRanks:{...(context.itemRanks||{}),...itemRanks},effectContext:{...(context.targetId===request.targetId&&!enemyVariantIds.length?context.effectContext||{}:{}),...effectContext}};
  if(requiredVariantIds.length) {
    const check=recommendTeam({guideData,strategyData,targetId:request.targetId,excludeVariantIds:[...excluded],raidDefense,...constraints});
    if(!['ready','insufficient_evidence'].includes(check.status))return {status:check.status,question,request,message:(preserveOtherFour?'No feasible one-slot replacement while keeping the other four champions. ':'')+(check.message||check.missingDataWarnings.join(' '))};
  }
  const options=request.intent==='alternate'&&!Object.keys(itemRanks).length&&!Object.keys(effectContext).length&&!enemyVariantIds.length&&!enemyLeaderVariantId&&context.targetId===request.targetId&&context.options?.length&&context.options.every(option=>respectsExclusions(option,currentExclusions)&&requiredVariantIds.every(id=>option.team.some(row=>row.champion.id===id)))?context.options:buildTeamOptions({guideData,strategyData,targetId:request.targetId,excludeVariantIds:[...excluded],raidDefense,...constraints});
  if(!options.length)return {status:'needs_clarification',question,request,message:preserveOtherFour?'No feasible source-supported one-slot replacement keeps the other four champions. Ask explicitly to rebuild the team if you want broader changes.':'No five-person team has enough verified support for this battle yet.'};
  const index=request.intent==='alternate'&&context.targetId===request.targetId?((context.optionIndex||0)+1)%options.length:0;
  if(request.intent==='alternate'&&options.length<2)return {status:'needs_clarification',question,request,message:'No other strategically distinct lineup has enough verified support for this battle yet.'};
  const result=request.intent==='substitution'||request.intent==='alternate'?{...options[index],recommendationSource:options[index].recommendationSource==='engine'?'engine_alternative':options[index].recommendationSource}:options[index];
  const enemySet=new Set(selectedEnemy);
  const enemyThreats=request.targetId==='raid:attack'?[...enemySet].slice(0,5).flatMap(id=>{
    const champion=guideData.champions.find(row=>row.id===id);
    return champion?strategyData.championFacts.filter(row=>row.variantId===id&&row.reviewStatus==='complete'&&!mechanicCurrentnessIssue(row)&&row.context!=='metadata'&&row.context!=='item'&&(row.context!=='leader'||row.variantId===raidDefense?.leader?.id)).slice(0,3).map(row=>({champion:champion.name,mechanicId:row.mechanicId,text:row.factText,provenanceRef:row.provenanceRef})):[];
  }):[];
  return {status:'ready',question,request,result,options,enemyThreats,teamExplanation:buildTeamExplanation({result,request,optionIndex:index,guideData}),focus:{intent:request.intent,subjectVariantId:request.subjectVariantId,mechanicIds:request.mechanicIds,rules:[]},replacementPlan:preserveOtherFour?{replacedVariantId:request.subjectVariantId,preservedVariantIds}:null,context:{targetId:request.targetId,...constraints,requiredVariantIds:explicitRequiredVariantIds,excludedVariantIds:[...excluded],lastResult:result,options,optionIndex:index,enemyVariantIds:[...enemySet],enemyLeaderVariantId:raidDefense?.leader?.id||null}};
}
