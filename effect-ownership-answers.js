import { routePrivateEffectQuestion, answerPrivateEffectQuestion } from './effect-definition-answers.js';

const normalize=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();

// Ownership is a separate question from a definition or an application lookup.
// Match the complete named subject so battle and provider questions stay put.
export function routeEffectOwnershipQuestion(question,guideData) {
  const text=String(question||'').trim().replace(/[?!.]+$/,'').trim();
  const match=/^(?:who owns|which champion owns|what champion owns|who is the owner of|owner of)\s+(.+)$/i.exec(text)
    || /^who does\s+(.+?)\s+belong to$/i.exec(text);
  if(!match)return null;
  const subject=match[1].trim();
  if(/\b(?:team|teams|lineup|lineups|battle|fight|beat|counter|raid|war)\b/i.test(subject))return null;
  const definitionRoute=routePrivateEffectQuestion(`Define ${subject}`,guideData);
  if(definitionRoute?.entityType==='private_effect')return {...definitionRoute,intent:'effect_ownership',entityType:'effect_ownership',definitionRoute};
  const rows=[...(guideData.statuses||[]),...(guideData.mechanics||[])].filter(row=>normalize(row.name)===normalize(subject));
  if(!rows.length)return null;
  return {intent:'effect_ownership',entityType:'effect_ownership',effectName:rows[0].name,catalogRows:rows};
}

export function answerEffectOwnershipQuestion(route,guideData) {
  const reference=route.definitionRoute?answerPrivateEffectQuestion(route.definitionRoute,guideData):null;
  const scope=reference?.status==='needs_clarification'?[{title:'Source scope',wording:reference.message}]:reference?.facts||route.catalogRows.map(row=>({title:'Catalog reference only',wording:row.text||'Definition wording is unavailable.',...(row.provenanceRef?{provenance:row.provenanceRef}:{})}));
  return {
    status:'ready',intent:'effect_ownership',kind:'knowledge',title:route.effectName,
    summary:`An owner of ${route.effectName} is not established by this effect-reference lookup. A standalone tooltip or source scope does not prove ownership.`,
    facts:[{title:'Ownership evidence limit',wording:'The evidence below identifies definition or reference sources only. An observed champion, linked variant, or item reference is not treated as an owner or a complete list of effect providers. Current collection ownership and equipment are not inferred.'},...scope],
    entries:[],showEmpty:false,sourceRefs:reference?.sourceRefs||[],ownershipState:'unverified'
  };
}
