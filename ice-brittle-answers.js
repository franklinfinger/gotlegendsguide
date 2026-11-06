import {evaluateIceBrittleSynergy,iceBrittleCore} from './ice-brittle-synergy.js';

const normalize=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const contains=(text,value)=>(' '+text+' ').includes(' '+normalize(value)+' ');

/** A named composition explanation is distinct from a definition, a provider
 * search or a request to build/modify a team. Never select two extra champions. */
export function routeIceBrittleSetupQuestion(question,{guideData,context={}}) {
  if(!guideData.verifiedCollection)return null;
  const text=normalize(question);
  if(!/\b(?:ice|brittle)\b/.test(text)||!(/\b(?:combine|combination|together|setup|set up|sequence|rotation|trigger|reach)\b/.test(text)||/\bhow\b.*\b(?:use|apply|make|create)\b/.test(text)))return null;
  if(/\b(?:teams?|lineups?|recommend|build|replace|replacement|substitute|without|instead|who|which)\b/.test(text))return null;
  if(!iceBrittleCore.every(row=>contains(text,row.shortName)))return null;
  if(!iceBrittleCore.every(row=>contains(text,row.name)))return {intent:'clarification',message:'The supported setup uses these exact variants: '+iceBrittleCore.map(row=>row.name).join('; ')+'. Confirm those versions, or name the exact versions you mean. No same-character substitution is assumed.'};
  const explicitRaidWar=/\b(?:raids?|war)\b/.test(text);
  if(/\b(?:drogon|rhaegal|viserion|legendary assault|dragon encounter)\b/.test(text)||!explicitRaidWar&&context.targetId?.startsWith('legendary-assault:'))return {intent:'clarification',message:'This captured three-champion setup is modeled for Raid/War only, not Legendary Assault. Are you asking about that Raid/War core, or the dragon encounter?'};
  let leaderVariantId=iceBrittleCore[0].id;
  const leadershipMention=/\b(?:leader|leads|leading|led by)\b/.test(text);
  if(leadershipMention) {
    const matches=iceBrittleCore.filter(row=>[row.name,row.shortName].some(name=>contains(text,name+' as leader')||contains(text,name+' as the leader')||contains(text,name+' is leader')||contains(text,name+' is the leader')||contains(text,'leader is '+name)||contains(text,'leader '+name)||contains(text,name+' leads')||contains(text,name+' leading')||contains(text,name+' is leading')||contains(text,'led by '+name)));
    if(matches.length!==1||/\b(?:not|no|different)\b/.test(text))return {intent:'clarification',message:'Which exact champion is the Leader for this setup? The opening ICE requires Ned Stark — Warden Of The North as Leader.'};
    leaderVariantId=matches[0].id;
  }
  return {intent:'ice_brittle_setup',entityType:'ice_brittle_setup',leaderVariantId,battleMode:/\bwar\b/.test(text)?'war':'raid',hypotheticalLeader:!leadershipMention};
}

export function answerIceBrittleSetupQuestion(route,guideData) {
  const model=evaluateIceBrittleSynergy({guideData,battleMode:route.battleMode,variantIds:iceBrittleCore.map(row=>row.id),leaderVariantId:route.leaderVariantId});
  return {status:'ready',intent:route.intent,kind:'knowledge',title:'ICE to BRITTLE · three-champion setup',
    summary:model.status==='conditional_plan'?'For Raid/War, Warden Ned as Leader supplies 1 opening ICE, then True Knight Brienne and Lord of Karhold Rickard can add 2 each to the same eligible target. This is a conditional five-ICE route, not a selected five-champion team.':'The requested setup is not established under these conditions. The source and Leader limits are shown below; no missing ICE or evidence is assumed.',
    facts:[{title:'Exact core and Leader requirement',wording:iceBrittleCore.map(row=>row.name).join('; ')+'. '+(route.hypotheticalLeader?'Ned as Leader is a requirement for this proposed setup, not an inferred selection from your roster or previous team.':'Only the Leader explicitly named in this question is evaluated.')}],
    entries:[],iceBrittleSynergy:model};
}
