// Deterministic answers from the two public, read-only Supabase guide models.
// A mechanic tag alone is not proof that a champion applies that mechanic.
const normalize = value => String(value || '').toLowerCase().replace(/[’']s\b/g, '').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const contains = (text, value) => (` ${text} `).includes(` ${normalize(value)} `);
const baseName = name => String(name || '').split(/\s+[—-]\s+/)[0];
const complete = row => row?.reviewStatus === 'complete';

const mechanicQueries = [
  {id:'apply_poison',label:'POISON',aliases:['poison','poisoned'],proof:/\b(?:afflicts?|inflicts?|applies?)\b[^.!?]{0,110}\bPOISON\b/i},
  {id:'apply_fire',label:'FIRE',aliases:['fire','burn'],proof:/\b(?:afflicts?|inflicts?|applies?)\b[^.!?]{0,110}\bFIRE\b|\benemies begin combat with\b[^.!?]{0,60}\bFIRE\b/i},
  {id:'brittle',label:'BRITTLE',aliases:['brittle'],proof:/\b(?:afflicts?|inflicts?|applies?|causes?)\b[^.!?]{0,110}\bBRITTLE\b/i},
  {id:'stun',label:'STUN',aliases:['stun','stuns','stunning'],proof:/\bSTUNS\b|\bSTUN\s+(?:them|an?\s+enemy|all\s+enemies|the\s+target)\b|\b(?:afflicts?|inflicts?)\b[^.!?]{0,30}\bSTUN\b/i},
  {id:'healing',label:'Healing',aliases:['heal','heals','healing','healer'],proof:/\bHEALS?\b/i},
  {id:'buff_removal',label:'Buff removal',aliases:['remove buffs','removes buffs','buff removal','strip buffs'],proof:/\bREMOVES?\b[^.!?]{0,100}\bBuffs?\b|\bstrips?\b[^.!?]{0,100}\bBuffs?\b/i},
  {id:'apply_wound',label:'WOUND',aliases:['wound','wounds','wounding'],proof:/\bWOUNDS?\b|\b(?:afflicts?|inflicts?|applies?)\b[^.!?]{0,110}\bWOUND\b/i},
  {id:'apply_ice',label:'ICE',aliases:['ice','icy'],proof:/\b(?:afflicts?|inflicts?|applies?)\b[^.!?]{0,110}\bICE\b|\benemies are afflicted with\b[^.!?]{0,50}\bICE\b/i},
  {id:'taunt',label:'TAUNT',aliases:['taunt','taunts','taunting'],proof:/\bTAUNTS?\b|\b(?:grants?|gains?)\b[^.!?]{0,100}\bTAUNT\b/i},
  {id:'birthright',label:'BIRTHRIGHT',aliases:['birthright'],proof:/\bgrants?\b[^.!?]{0,100}\bBIRTHRIGHT\b|\bgain\b[^.!?]{0,100}\bBIRTHRIGHT\b/i},
];

const nameMatches = (text, rows, name = row => row.name) => rows.filter(row => contains(text, name(row)));

/** Battle questions retain the existing strategy engine; knowledge questions do not inherit its target. */
export function routeGuideQuestion(question, {guideData,strategyData,context={}}) {
  const text=normalize(question);
  if(!text)return {intent:'clarification',message:'Ask about a champion, mechanic, faction, item, or battle.'};
  const battle=/\b(team|teams|lineup|lineups|battle|fight|beat|counter|raid attack|raid defense|war battlefield)\b/.test(text);
  const followUp=Boolean(context.targetId)&&(/\b(dont have|do not have|without|replace|substitute|instead|another team|different team|leader|how to play)\b/.test(text)||(/\bwhy\b/.test(text)&&/\b(this|that) team\b/.test(text)));
  if(battle||followUp)return {intent:'battle_recommendation'};
  const mechanic=mechanicQueries.find(row=>row.aliases.some(alias=>contains(text,alias)));
  if(mechanic)return {intent:/\b(how|what does|explain)\b/.test(text)?'explanation':'mechanic_lookup',entityType:'mechanic',entity:mechanic};
  const champions=guideData.champions.filter(row=>contains(text,row.name)||contains(text,baseName(row.name))||(baseName(row.name).split(' ')[0].length>=5&&contains(text,baseName(row.name).split(' ')[0])));
  if(champions.length)return {intent:/\b(skill|trait)\b/.test(text)?'skill_trait_lookup':/\b(how|why)\b/.test(text)?'explanation':'champion_lookup',entityType:'champion',matches:champions};
  if(/\bdual faction\b/.test(text))return {intent:'faction_lookup',entityType:'dual_faction'};
  const factions=nameMatches(text,guideData.factions);
  if(factions.length)return {intent:/\b(how|why)\b/.test(text)?'explanation':'faction_lookup',entityType:'faction',entity:factions.sort((a,b)=>b.name.length-a.name.length)[0]};
  if(/\b(iconic items|have items|uses items)\b/.test(text))return {intent:'item_lookup',entityType:'all_items'};
  const items=nameMatches(text,guideData.items);
  if(items.length)return {intent:'item_lookup',entityType:'item',entity:items.sort((a,b)=>b.name.length-a.name.length)[0]};
  const definition=nameMatches(text,[...guideData.statuses,...guideData.mechanics]).sort((a,b)=>b.name.length-a.name.length)[0];
  if(definition)return {intent:/\b(how|why)\b/.test(text)?'explanation':'mechanic_status_lookup',entityType:'definition',entity:definition};
  if(/\b(skill|trait|item|faction|mechanic|status)\b/.test(text))return {intent:'clarification',message:'Which champion, faction, item, or mechanic do you mean?'};
  return {intent:'clarification',message:'Which champion, mechanic, faction, item, or battle would you like to know about?'};
}

function verifiedMechanicEntries(mechanic,guideData,strategyData) {
  const champions=new Map(guideData.champions.map(row=>[row.id,row]));
  const seen=new Set(),entries=[];
  for(const fact of strategyData.championFacts) {
    if(mechanic.id!=='brittle'&&fact.mechanicId!==mechanic.id)continue;
    if(fact.evidenceCategory!=='verified_fact'||!complete(fact)||!fact.provenanceRef||!mechanic.proof.test(fact.factText))continue;
    if(mechanic.id==='apply_ice'&&/\b(?:an?|another) ally afflicts?\b[^.!?]{0,80}\bICE\b/i.test(fact.factText)&&[...fact.factText.matchAll(/\bafflicts?\b/gi)].length===1)continue;
    const champion=champions.get(fact.variantId);
    if(!champion||champion.releaseState!=='live')continue;
    const key=`${champion.id}|${fact.factText}`;
    if(seen.has(key))continue;
    seen.add(key);
    const colon=fact.factText.indexOf(':');
    const title=colon>0?fact.factText.slice(0,colon).trim():'Verified ability';
    const wording=colon>0?fact.factText.slice(colon+1).trim():fact.factText;
    entries.push({champion,title,kind:fact.context==='leader'?'Leader trait':fact.context==='item'?'Item ability':fact.context==='skill'?'Skill':'Trait or ability',wording,provenance:fact.provenanceRef});
  }
  return entries.sort((a,b)=>a.champion.name.localeCompare(b.champion.name)||a.title.localeCompare(b.title));
}

function championAnswer(route,text,guideData) {
  const exact=route.matches.filter(row=>contains(text,row.name));
  const selected=(exact.length?exact:route.matches).sort((a,b)=>a.name.localeCompare(b.name));
  const wantsVersions=/\b(versions|variants)\b/.test(text);
  const wantsFaction=/\bfaction\b/.test(text);
  const wantsItem=/\b(items?|gear)\b/.test(text);
  const wantsSkill=/\bskill\b/.test(text);
  const wantsTrait=/\btrait\b/.test(text);
  const entries=selected.map(champion=>{
    const abilities=guideData.abilities.filter(row=>row.variantId===champion.id&&complete(row)&&['skill','champion_skill','trait'].includes(row.kind));
    const traits=guideData.traits.filter(row=>row.variantId===champion.id&&complete(row));
    const items=guideData.items.filter(row=>row.ownerVariantId===champion.id);
    const units=(guideData.companions||[]).filter(row=>row.variantId===champion.id&&complete(row));
    const facts=wantsVersions||wantsFaction?[]:wantsItem?items.map(row=>({title:row.name,kind:'Iconic item',wording:row.abilities.filter(complete).map(ability=>`${ability.name}: ${ability.text}`).join(' ')||'Item ability wording is unavailable.',href:`items.html#${row.id}`})):[
      ...(!wantsTrait?abilities.filter(row=>row.kind!=='trait').map(row=>({title:row.name,kind:'Skill',wording:row.text,provenance:row.provenance})):[]),
      ...(!wantsSkill?[...traits,...abilities.filter(row=>row.kind==='trait')].map(row=>({title:row.name,kind:'Trait',wording:row.text,provenance:row.provenance})):[]),
      ...(!wantsTrait?units.map(row=>({title:`${row.name}: ${row.skillName}`,kind:'Associated unit skill',wording:`${row.skillText} ${row.inheritanceText}`,provenance:'Screenshot Verified'})):[]),
      ...(!wantsSkill?units.map(row=>({title:`${row.name}: ${row.traitName}`,kind:'Associated unit trait',wording:row.traitText,provenance:'Screenshot Verified'})):[])
    ];
    return {champion,facts};
  });
  const subject=selected.length===1?selected[0].name:baseName(selected[0]?.name)||'Champions';
  const summary=wantsVersions?`${selected.length} verified variant${selected.length===1?'':'s'} are listed.`:wantsFaction?'Current faction membership is shown for each exact variant.':wantsItem?'Only connected iconic items with verified ownership are shown.':'Verified skills and traits are shown for each exact variant.';
  return {status:'ready',intent:route.intent,kind:'knowledge',title:subject,summary,entries,emptyMessage:`No verified details are available for ${subject}.`};
}

function factionAnswer(route,text,guideData) {
  if(route.entityType==='dual_faction')return {status:'ready',intent:route.intent,kind:'knowledge',title:'Dual-faction champions',summary:'Current live memberships only.',entries:guideData.champions.filter(row=>row.releaseState==='live'&&row.factions.length===2).map(champion=>({champion,facts:[]})),emptyMessage:'No verified dual-faction champions are listed.'};
  const faction=route.entity;
  const wantsBonus=/\b(bonus|buff)\b/.test(text),wantsPlay=/\b(how|play|works)\b/.test(text);
  const playRules=faction.rules.filter(row=>row.kind==='how_to_play');
  const rules=faction.rules.filter(row=>wantsBonus?row.kind==='current_bonus':wantsPlay?row.kind==='how_to_play'||!playRules.length&&row.kind==='current_bonus':true);
  return {status:'ready',intent:route.intent,kind:'knowledge',title:faction.name,summary:wantsPlay&&!playRules.length?'A dedicated play description is unavailable. The current team bonus is shown.':'Current live faction information.',facts:rules.map(row=>({title:row.kind==='current_bonus'?'Team bonus':'How it plays',wording:row.text})),entries:wantsBonus||wantsPlay?[]:faction.memberVariantIds.map(id=>guideData.champions.find(row=>row.id===id)).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name)).map(champion=>({champion,facts:[]})),emptyMessage:`No verified ${wantsBonus?'bonus':wantsPlay?'play description':'members'} is recorded for ${faction.name}.`};
}

function itemAnswer(route,guideData) {
  if(route.entityType==='all_items')return {status:'ready',intent:route.intent,kind:'knowledge',title:'Iconic items',summary:'Verified champion and item relationships.',entries:guideData.items.filter(row=>row.ownerVariantId).map(item=>({champion:guideData.champions.find(row=>row.id===item.ownerVariantId),facts:[{title:item.name,kind:'Iconic item',wording:item.abilities.filter(complete).map(ability=>`${ability.name}: ${ability.text}`).join(' ')||'Ability wording unavailable.',href:`items.html#${item.id}`}]})).filter(row=>row.champion).sort((a,b)=>a.champion.name.localeCompare(b.champion.name)),emptyMessage:'No verified iconic item relationships are listed.'};
  const item=route.entity,champion=guideData.champions.find(row=>row.id===item.ownerVariantId);
  return {status:'ready',intent:route.intent,kind:'knowledge',title:item.name,summary:champion?`Iconic item for ${champion.name}.`:'A verified champion relationship is unavailable.',entries:champion?[{champion,facts:item.abilities.filter(complete).map(row=>({title:row.name,kind:'Item ability',wording:row.text,provenance:row.provenance}))}]:[],facts:champion?[]:item.abilities.filter(complete).map(row=>({title:row.name,kind:'Item ability',wording:row.text,provenance:row.provenance})),emptyMessage:`No verified ability wording is recorded for ${item.name}.`};
}

/** Returns a knowledge answer or a battle route for the existing strategy engine. */
export function answerGuideQuestion({question,guideData,strategyData,context={}}) {
  const route=routeGuideQuestion(question,{guideData,strategyData,context}),text=normalize(question);
  if(route.intent==='battle_recommendation')return {status:'battle',intent:route.intent};
  if(route.intent==='clarification')return {status:'needs_clarification',intent:route.intent,message:route.message};
  if(route.entityType==='definition')return {status:'ready',intent:route.intent,kind:'knowledge',title:route.entity.name,summary:'Verified guide definition.',facts:[{title:route.entity.name,wording:route.entity.text}],entries:[],emptyMessage:`A verified definition for ${route.entity.name} is unavailable.`};
  if(route.entityType==='mechanic') {
    const matches=verifiedMechanicEntries(route.entity,guideData,strategyData),grouped=new Map();
    for(const match of matches){
      if(!grouped.has(match.champion.id))grouped.set(match.champion.id,{champion:match.champion,facts:[]});
      grouped.get(match.champion.id).facts.push({title:match.title,kind:match.kind,wording:match.wording,provenance:match.provenance});
    }
    const entries=[...grouped.values()];
    const definition=guideData.mechanics.find(row=>normalize(row.name)===normalize(route.entity.label))||guideData.statuses.find(row=>normalize(row.name)===normalize(route.entity.label));
    return {status:'ready',intent:route.intent,kind:'knowledge',title:route.entity.label,summary:`${entries.length} exact champion variant${entries.length===1?'':'s'} with verified wording.`,facts:definition?.text?[{title:'What it does',wording:definition.text}]:[],entries,showEmpty:entries.length===0,emptyMessage:`No verified champion currently matches ${route.entity.label} in the guide.`};
  }
  if(route.entityType==='champion')return championAnswer(route,text,guideData);
  if(route.entityType==='faction'||route.entityType==='dual_faction')return factionAnswer(route,text,guideData);
  return itemAnswer(route,guideData);
}
