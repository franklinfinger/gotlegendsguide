import { historicalEmbeddedReferences } from './historical-embedded-effect-references.js';
// Named marks can be defined by their Skill, trait or item wording. These
// references never establish collection ownership, item activation or scores.
export const embeddedEffectSpecs=[
  {effectName:"THE HOUND'S PROTECTION",aliases:["THE HOUND'S PROTECTION","HOUND'S PROTECTION","HOUND'S PROTECT","HOUNDS PROTECT"],pattern:/\bTHE HOUND'S PROTECTION\b/i,definition:/\bSHIELD\b[^.!?]*\bMax HP\b/i,remaining:'Simultaneous-mark limit, duration and transfer/removal are not stated by this evidence.'},
  {effectName:'RUIN',aliases:['RUIN'],pattern:/\bRUIN\b/i,definition:/\bAt 3 RUIN\b[^.!?]*\bCurrent HP\b/i,remaining:'Mark consumption/reset, DEF-debuff duration and removal are not stated by this evidence.'},
  {effectName:"JOFFREY'S SCORN",aliases:["JOFFREY'S SCORN","JOFFREY SCORN"],pattern:/\bJOFFREY'S SCORN\b/i,definition:/\bDECEIVED\b[^.!?]*\bDodge Chance\b/i,remaining:'Any additional intrinsic effects and mark restrictions are not stated by this evidence.'},
  {effectName:"SEASMOKE'S FAVOR / FAVORED",aliases:["SEASMOKE'S FAVOR","SEASMOKE'S FAVORED","SEASMOKE FAVOR"],pattern:/\bSEASMOKE'S FAVOR(?:ED)?\b/i,definition:/\bRAID\b[^.!?]*\bStamina\b/i,remaining:'The Skill says FAVOR and the trait says FAVORED. Preserve both source names; do not infer an additional effect. Mark limits, duration and transfer/removal are not stated.'},
  {effectName:'RESENTMENT',aliases:['RESENTMENT'],pattern:/\bRESENTMENT\b/i,definition:/\bEach RESENTMENT\b[^.!?]*\bDodge\b/i,remaining:'Stack cap, duration and removal beyond the explicitly stated reset after Dodging a Skill are not stated.'},
];
export const embeddedSpecFor=name=>embeddedEffectSpecs.find(row=>row.effectName===name);
export const mentionsEmbeddedEffect=(spec,text)=>spec.pattern.test(String(text||'').replaceAll('’',"'"));
export const hasEmbeddedDefinition=(spec,row)=>row.reviewStatus==='complete'&&!/…|\.\.\./.test(row.text||'')&&mentionsEmbeddedEffect(spec,row.text)&&spec.definition.test(row.text);

/** Select existing source rows, retaining text byte-for-byte and exact catalog
 * links. No character-name matching creates a variant or item relationship. */
export function collectEmbeddedEffectReferences(guideData) {
  const rows=[...(guideData.verifiedCollection?.effectDefinitionExcerpts||[]),...(guideData.abilities||[]),...(guideData.traits||[]).map(row=>({...row,kind:'trait'})),...(guideData.items||[]).flatMap(item=>(item.abilities||[]).map(row=>({...row,kind:'item',itemName:item.name,variantId:row.variantId||item.ownerVariantId||null})))];
  const references=[];
  for(const row of rows) {
    if(typeof row.text!=='string'||!row.text.trim())continue;
    for(const spec of embeddedEffectSpecs.filter(spec=>mentionsEmbeddedEffect(spec,row.text))) {
      const key=[spec.effectName,row.id,row.variantId,row.text].join('|');
      if(references.some(other=>other.referenceKey===key))continue;
      references.push({...row,effectName:spec.effectName,referenceKey:key,scoringContribution:0});
    }
  }
  return references;
}

export function embeddedEffectReferences(guideData) {
  // In owner-private mode, even a reference-only answer must not resurrect the
  // retired catalog's Skill, trait, or iconic wording or enrich it from history.
  if (guideData.privateCollection?.latestEvidenceOnly) return collectEmbeddedEffectReferences(guideData);
  const enrich=row=>{
    const catalog=historicalEmbeddedReferences.find(other=>other.id===row.id&&other.text===row.text);
    if(!catalog)return row;
    const enriched={...catalog,...row,historicalReference:true};
    for(const field of ['sourceTable','sourceRecordId','sourceId','sourceState','provenanceRef','historicalSubject','historicalChampionId']) {
      if(enriched[field]==null||enriched[field]==='')enriched[field]=catalog[field];
    }
    if(!enriched.sourceFilenames?.length)enriched.sourceFilenames=catalog.sourceFilenames;
    return enriched;
  };
  const current=collectEmbeddedEffectReferences(guideData).map(enrich);
  const historical=collectEmbeddedEffectReferences({abilities:[...(guideData.historicalEffectReferences||[]),...historicalEmbeddedReferences]}).map(row=>enrich({...row,historicalReference:true}));
  const all=[...current,...historical];
  const sameSource=(a,b)=>a.effectName===b.effectName&&a.id===b.id&&a.text===b.text;
  // An exact ID/body match enriches the known link, never creates one. Prefer
  // that linked copy over its unscoped archive duplicate, while keeping all
  // conflicting non-null scopes and all different source wording separate.
  return all.filter((row,index)=>!all.slice(0,index).some(other=>sameSource(row,other)&&(row.variantId||null)===(other.variantId||null))&&
    (row.variantId||!all.some(other=>other.variantId&&sameSource(row,other))));
}
