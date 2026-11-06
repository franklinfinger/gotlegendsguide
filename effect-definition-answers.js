import { embeddedEffectSpecs, embeddedSpecFor, embeddedEffectReferences, hasEmbeddedDefinition } from './embedded-effect-definitions.js';
// Exact named-effect reference questions from the catalog and opt-in overlay.
// This module cannot produce battle scores, providers, ownership or extra rules.
const normalize=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const unique=values=>[...new Set(values)];
const aliasesFor=row=>{
  const names=[row.effectName,row.title,...(embeddedSpecFor(row.effectName)?.aliases||[])].filter(Boolean);
  if(row.effectName==='CHARGE')names.push('CHARGE I','CHARGE II','CHARGE III','CHARGE IV','CHARGE V','CHARGE 1','CHARGE 2','CHARGE 3','CHARGE 4','CHARGE 5');
  if(row.effectName==='SCOUT / SCOUTED')names.push('SCOUT','SCOUTED');
  if(row.effectName==="SEASMOKE'S FAVOR / FAVORED")names.push("SEASMOKE'S FAVOR","SEASMOKE'S FAVORED");
  return unique(names.map(normalize));
};

/** Only a complete named-effect subject can override existing question routing.
 * Longer team/skill questions and substring matches remain with the old router. */
export function routePrivateEffectQuestion(question,guideData) {
  const collection=guideData.verifiedCollection;
  const embedded=embeddedEffectReferences(guideData);
  const rows=[...(collection?.effectDefinitionUpdates||[]),...(collection?.effectDefinitions||[]),...embeddedEffectSpecs.filter(spec=>embedded.some(row=>row.effectName===spec.effectName))];
  if(!rows.length)return null;
  const aliases=rows.flatMap(row=>aliasesFor(row).map(alias=>({alias,effectName:row.effectName})));
  let subject=String(question||'').trim().replace(/[?!.]+$/,'').trim();
  let explicit=false;
  const prefix=/^(?:what is the definition of|what does|what is|what are|how does|definition of|define|explain|describe|tell me about)\s+/i;
  if(prefix.test(subject)){explicit=true;subject=subject.replace(prefix,'');}
  else if(/\s+definition$/i.test(subject)){explicit=true;subject=subject.replace(/\s+definition$/i,'');}
  subject=subject.replace(/\s+(?:in|during) (?:a |the )?(?:battle|combat)$/i,'');
  let qualifier=null;
  const scoped=/\s+(?:for|on|from)\s+(.+)$/i.exec(subject);
  if(scoped){qualifier=scoped[1].trim();subject=subject.slice(0,scoped.index);}
  subject=subject.replace(/\s+(?:do|work|mean)$/i,'').trim();
  let matches=aliases.filter(row=>row.alias===normalize(subject));
  if(!matches.length&&!qualifier) {
    const possessive=/^(.+?)[’']s\s+(.+)$/i.exec(subject);
    if(possessive){matches=aliases.filter(row=>row.alias===normalize(possessive[2]));if(matches.length)qualifier=possessive[1];}
  }
  const effects=unique(matches.map(row=>row.effectName));
  if(effects.length===1)return {intent:collection?'private_effect_definition':'effect_definition',entityType:'private_effect',effectName:effects[0],requestedName:subject,qualifier};
  if(explicit&&!qualifier&&/\b(?:and|versus|vs)\b|[,/]/i.test(subject)) {
    const subjects=subject.split(/\s+\b(?:and|versus|vs)\b\s+|[,/]/i).map(part=>part.trim()).filter(Boolean);
    const matches=subjects.map(part=>unique(aliases.filter(row=>row.alias===normalize(part)).map(row=>row.effectName)));
    // Every subject must itself be a complete effect name. Mere mentions inside
    // a composition or team question must not steal its strategy route.
    const separate=unique(matches.flat());
    if(matches.length>1&&matches.every(row=>row.length===1)&&separate.length>1)return {intent:'clarification',message:'Which one effect definition would you like: '+separate.join(', ')+'?'};
  }
  return null;
}

const sourceRef=row=>(row.provenanceRef||'source-unavailable')+':'+(row.sourceFilenames||[]).join(',');
const completeDefinition=row=>row.reviewStatus==='complete'&&row.sourceFilenames?.length&&row.provenanceRef&&!/…|\.\.\./.test(row.text||'');
const scopeNames=(row,names)=>row.scopes?.map(scope=>names.get(scope.variantId)||scope.variantId)||[];
const stateLabel=state=>({absent:'Missing standalone definition',partial:'Partial definition coverage',alias_unconfirmed:'Unconfirmed alias',defined_quantitative_limits:'Definition exists; numerical limits remain unverified',captured_definition:'Captured definition',embedded_definition:'Definition recorded in Skill, trait or item wording'}[state]||'Incomplete definition coverage');

export function answerPrivateEffectQuestion(route,guideData) {
  const collection=guideData.verifiedCollection||{},names=new Map(guideData.champions.map(row=>[row.id,row.name]));
  let embedded=embeddedEffectReferences(guideData).filter(row=>row.effectName===route.effectName);
  const embeddedSpec=embeddedSpecFor(route.effectName);
  let definitions=(collection.effectDefinitionUpdates||[]).filter(row=>row.effectName===route.effectName);
  let coverage=(collection.effectDefinitions||[]).filter(row=>row.effectName===route.effectName);
  const knownScopes=unique([...definitions.flatMap(row=>scopeNames(row,names)),...coverage.map(row=>names.get(row.variantId)).filter(Boolean),...embedded.map(row=>names.get(row.variantId)||row.historicalSubject).filter(Boolean)]);
  if(route.qualifier) {
    const exact=guideData.champions.filter(row=>normalize(row.name)===normalize(route.qualifier));
    const historicalScope=embedded.filter(row=>!row.variantId&&row.historicalSubject&&normalize(row.historicalSubject)===normalize(route.qualifier));
    if(exact.length!==1) {
      const standalone=definitions.filter(row=>!row.scopes?.length&&normalize(row.observedChampion)===normalize(route.qualifier));
      if(standalone.length||historicalScope.length){definitions=standalone;coverage=[];embedded=historicalScope;}
      else return {status:'needs_clarification',intent:route.intent,message:`No single exact captured variant matches “${route.qualifier}”. Specify the exact variant, or ask for ${route.effectName} without a champion qualifier. Source scopes: ${knownScopes.join('; ')||'standalone tooltip only'}.`};
    } else {
      const id=exact[0].id;
      definitions=definitions.filter(row=>row.scopes?.some(scope=>scope.variantId===id));
      coverage=coverage.filter(row=>row.variantId===id);
      embedded=embedded.filter(row=>row.variantId===id);
      // A same-name catalog entry is not evidence linking an unscoped historical
      // item to that variant. Retain the subject-matched source without adding a
      // variant ID, so it is still presented as historical-only evidence.
      if(!embedded.length&&!definitions.length)embedded=historicalScope;
      if(!definitions.length&&!coverage.length&&!embedded.length)return {status:'ready',intent:route.intent,kind:'knowledge',title:route.effectName,summary:`No definition evidence is linked to ${exact[0].name} in the available exact-variant sources.`,definitionState:'scope_unverified',facts:[{title:'Scope limit',wording:`Do not transfer another variant's effect or infer applicability. Available source scopes: ${knownScopes.join('; ')||'standalone tooltip only'}.`}],entries:[]};
    }
  }
  const facts=[],sources=[];
  let historicalDefinitionCount=0;
  const historicalNames=new Set([normalize(route.effectName),...definitions.flatMap(row=>aliasesFor(row))]);
  const appendHistorical=()=>{
    const historical=[...(guideData.statuses||[]),...(guideData.mechanics||[])].filter(row=>historicalNames.has(normalize(row.name))&&typeof row.text==='string'&&row.text.trim());
    const distinct=historical.filter((row,index,array)=>array.findIndex(other=>other.id===row.id&&other.text===row.text)===index);
    for(const row of distinct){
      historicalDefinitionCount++;
      const ref=row.provenanceRef||row.provenance||(row.id?'catalog:'+row.id:null);
      facts.push({title:`${row.name} · historical catalog wording${row.reviewStatus==='complete'?'':' (partial or unreviewed)'}`,wording:row.text,...(ref?{provenance:ref}:{})});
      facts.push({title:'Historical source and currentness',wording:`${ref||'Existing catalog record; source identifier unavailable'}. Not newly verified by the imported screenshots. Preserve this wording as historical reference, not proof of current quantities or broader variant applicability. Older and newer wording remain separate; no values are blended.`});
      if(ref)sources.push(ref);
    }
  };
  for(const row of definitions) {
    const complete=completeDefinition(row);
    facts.push({title:`${row.title} · ${complete?'tooltip verbatim':'partial or unverified tooltip'}`,wording:row.text||'Tooltip wording is unavailable.'});
    const scoped=scopeNames(row,names);
    facts.push({title:'Source scope',wording:scoped.length?`Linked only to ${scoped.join('; ')}. This does not establish the effect for other variants.`:`Standalone tooltip${row.observedChampion?' observed with '+row.observedChampion:''}. No exact variant or ownership is inferred.`});
    facts.push({title:'Source',wording:`Reviewed ${row.reviewCompletedDate||'date unavailable'}; ${(row.sourceFilenames||[]).join(', ')||'source filename unavailable'}. ${row.contextNote||''}`.trim(),provenance:sourceRef(row)});
    for(const source of row.sourceIdentities||[])facts.push({title:'Source identity',wording:[source.file_name,source.library_file_id,source.message_id,source.sent_at?'Uploaded '+source.sent_at:null,source.sha256?'SHA-256 '+source.sha256:null,source.champion_context,source.screen_context,source.notes].filter(Boolean).join(' · '),provenance:sourceRef(row)});
    sources.push(sourceRef(row));
    if(!complete)facts.push({title:'Missing evidence',wording:'The tooltip is partial or lacks complete source evidence. No missing wording or rule is inferred.'});
    if(row.remainingRules?.length)facts.push({title:'Separate rule questions',wording:row.remainingRules.join(' ')});
    const nested=(collection.effectDefinitions||[]).filter(other=>other.effectName!==row.effectName&&other.sourceRefs?.includes(sourceRef(row))&&other.definitionState!=='captured_definition');
    for(const other of nested.filter((value,index,array)=>array.findIndex(next=>next.effectName===value.effectName)===index))facts.push({title:`Related mechanic: ${other.effectName}`,wording:`${stateLabel(other.definitionState)}. ${other.unresolved} A reference in this tooltip does not supply the missing rules.`});
  }
  for(const row of embedded) {
    const historical=row.historicalReference||!row.captureDate&&!row.reviewCompletedDate;
    const ref=row.provenanceRef||(/^(?:Screenshot Verified|Official Current|Derived|Community\/Observed)$/.test(row.provenance||'')?null:row.provenance)||(row.id?'catalog:'+row.id:'source-unavailable');
    const source=[ref,...(row.sourceFilenames||[])].join(':');
    const complete=row.reviewStatus==='complete'&&!/…|\.\.\./.test(row.text);
    facts.push({title:`${row.name} · ${historical?'historical':'captured'} ${row.itemName?'item ability':row.evidenceKind==='trait_excerpt'?'trait excerpt':row.kind==='trait'?'trait':'Skill'} wording${complete?'':' (partial)'}`,wording:row.text,provenance:source});
    if(row.excerptNote)facts.push({title:'Partial excerpt boundary',wording:row.excerptNote});
    for(const identity of row.sourceIdentities||[])facts.push({title:'Source identity',wording:[identity.file_name,identity.library_file_id,identity.message_id,identity.sent_at?'Uploaded '+identity.sent_at:null,identity.sha256?'SHA-256 '+identity.sha256:null,identity.champion_context,identity.screen_context,identity.notes].filter(Boolean).join(' · '),provenance:source});
    const scope=names.get(row.variantId);
    const skillLevel=row.displayedSkillLevel??row.shownSkillLevel;
    facts.push({title:'Embedded definition scope',wording:`${scope?'Linked only to '+scope:row.historicalSubject?'Historical source identity: '+row.historicalSubject+'. An exact current variant is not established by this retained row':'Exact variant identity is not established'}.${row.itemName?' Item: '+row.itemName+(row.itemLevel!=null?', '+(historical?'historical':'captured')+' level '+row.itemLevel:'')+((row.abilityRank||row.itemRank)?', ability rank '+(row.abilityRank||row.itemRank):'')+'.':''}${skillLevel!=null?' Shown Skill level: '+skillLevel+'.':''} No ownership, current equipment or cross-variant applicability is inferred.`});
    facts.push({title:'Embedded source and currentness',wording:`${source}. ${row.sourceTable?'Historical SQLite '+row.sourceTable+' #'+row.sourceRecordId+', source #'+row.sourceId+'. ':''}${historical?'Historical catalog evidence; not newly verified for the current build.':'Captured '+(row.captureDate||'date unavailable')+(row.reviewCompletedDate?'; reviewed '+row.reviewCompletedDate:'')+'. Values apply only to that captured build, not live game state.'}${row.sourceState?' Source record state: '+row.sourceState+'.':''}${!complete?' Partial wording is preserved; no missing text is filled in.':''}`});
    sources.push(source);
  }
  const embeddedDefinitionFound=embedded.some(row=>hasEmbeddedDefinition(embeddedSpec,row));
  if(embedded.length)facts.push({title:'Separate rule questions',wording:`${embeddedDefinitionFound?'The effect is explained within the quoted Skill, trait or item':'The visible embedded evidence is quoted, but the scoped definition remains partial'}; a standalone popup is not required. ${embeddedSpec.remaining} No missing rule, locked upgrade or activation rate is inferred.`});
  if(!definitions.length&&!embedded.length) {
    // Retain existing exact catalog knowledge when the audit already distinguishes
    // a known or partly documented effect from its remaining gaps. Do not relabel it as a
    // current screenshot tooltip, apply it to another effect, or invent a source.
    if(coverage.some(row=>['defined_quantitative_limits','partial'].includes(row.definitionState))) {
      appendHistorical();
    }
    const distinct=coverage.filter((row,index,array)=>array.findIndex(other=>other.definitionState===row.definitionState&&other.known===row.known&&other.unresolved===row.unresolved)===index);
    for(const row of distinct) {
      facts.push({title:stateLabel(row.definitionState),wording:row.definitionState==='defined_quantitative_limits'?`Audit context: ${row.known} Unresolved: ${row.unresolved} No complete current tooltip was supplied in this import.`:`A complete current tooltip is not supplied in this import for this source scope. Audit context: ${row.known} Unresolved: ${row.unresolved}`});
    }
    const scopes=unique(coverage.map(row=>names.get(row.variantId)).filter(Boolean));
    const refs=unique(coverage.flatMap(row=>row.sourceRefs||[]));
    facts.push({title:'Application/reference evidence only',wording:`${scopes.join('; ')||'No exact captured scope'}. ${refs.join(' · ')}. These references are not substitute tooltip definitions.`});
    sources.push(...refs);
  }
  if(definitions.length&&!route.qualifier)appendHistorical();
  return {status:'ready',intent:route.intent,kind:'knowledge',title:route.effectName,definitionState:definitions.length?(definitions.every(completeDefinition)?'source_bounded_definition':'partial_definition'):embedded.length?(embeddedDefinitionFound?'embedded_definition':'partial_embedded_evidence'):historicalDefinitionCount?'historical_definition_with_gaps':'incomplete_definition',summary:'Source-bounded reference evidence. Imported tooltips, embedded ability definitions and historical catalog text are labeled separately. No unshown rules, cross-variant applicability, activation rate or strategy score is inferred.',facts,entries:[],sourceRefs:unique(sources)};
}
