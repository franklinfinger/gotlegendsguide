import { embeddedSpecFor, hasEmbeddedDefinition } from './embedded-effect-definitions.js';
// Interpretation coverage from the inspected catalog, not a claim that these
// effects lack an in-game definition. No owner roster or screenshot IDs here.
const rows=[
 ['BRIGHTFLAME','BRIGHTFLAME','absent','Application and loss clauses only.','Intrinsic stack effect, cap, duration and removal.',true],
 ['DRAGON FOLLOWER','DRAGON FOLLOWER','absent','Application and marked-enemy defeat clause only.','Intrinsic mark effect, duration, limits and removal.',true],
 ['HOLY PURPOSE','HOLY PURPOSE','absent','Applied to random allies at combat start.','Effect, duration, consumption, stacking and removal. Not an alias for R’hollor’s Purpose.',true],
 ['RESURGENCE','RESURGENCE','absent','Named acquisition triggers are recorded.','What the acquired effect does, duration and consumption.'],
 ['CHARGE','CHARGE(?:\\s+(?:III|II|IV|I|V|[1-5]))?','partial','Official update describes fixed Stamina tiers.','Rank-to-amount mapping; do not convert to historical percentage Stamina.'],
 ['SCOUT / SCOUTED','SCOUT(?:ED|S)?','absent','Application, durations and named champion payoffs are recorded.','Underlying debuff behavior.'],
 ['PACIFY','PACIF(?:Y|IED|IES|YING)','partial','Some awakening and action-delay behavior is mentioned.','Complete action restrictions, break conditions, immunity and removal.'],
 ['FURY','FURY','partial','Historical definition links FURY to Stamina gain and ENRAGED effect.','Current complete interaction and ENRAGED threshold/consumption.'],
 ['ENRAGED','ENRAGED','absent','Ability-specific activation clauses may be recorded.','Threshold, full benefit, duration and consumption.'],
 ['CLEANSING FIRE Gem','CLEANSING FIRE','absent','Power-Up replacement condition is recorded.','The gem effect itself.'],
 ['DOWNFALL','DOWNFALL','partial','Marked leader defeat triggers the recorded succession effects.','Mark limit, duration, transfer/removal and any other intrinsic benefit.'],
 ['LOYALTY','LOYALTY','partial','Application and linked healing trigger are recorded.','Intrinsic benefit, mark limit, duration, transfer and removal.'],
 ['Justice Gem','JUSTICE GEMS?','partial','Spawn and BRITTLE-hit follow-up are recorded.','The gem’s own damage, targeting and other effects.'],
 ["THE HOUND'S PROTECTION","THE HOUND'S PROTECTION",'partial','Marking and explicit champion payoffs are recorded.','Simultaneous-mark limit, duration, transfer/removal and independent effects.'],
 ["SEASMOKE'S FAVOR / FAVORED","SEASMOKE'S FAVOR(?:ED)?",'partial','Named Skill and trait payoffs are recorded.','Exact name, limits, duration, transfer and removal.'],
 ["JOFFREY'S SCORN","JOFFREY'S SCORN",'partial','Treasury application, duration and named payoffs are recorded.','Any additional intrinsic effect or mark restrictions.'],
 ['WRATH','WRATH','partial','Acquisition, per-mark Skill bonuses and post-Skill reset are explicit.','Cap, removability and any other intrinsic behavior.'],
 ['ANGER','ANGER','partial','Acquisition and Treasury-gated Skill payoff are recorded.','Cap, consumption/reset, duration and removal.'],
 ['OMEN','OMEN','partial','Reinforcement acquisition and once-per-turn payoff are recorded.','Cap, decay/removal and other intrinsic behavior.'],
 ['RESENTMENT','RESENTMENT','partial','The item wording records acquisition, per-stack Dodge and reset after Dodging a Skill.','Stack cap, duration and removal beyond the recorded reset.'],
 ['RUIN','RUIN','partial','Application, three-mark payoff and Dragon exception are recorded.','Mark consumption/reset, DEF-debuff duration and removal.'],
 ['ICE','ICE','partial','Applications and the historical BRITTLE threshold are recorded.','ICE’s own stack effect, decay, damage and removal beyond that definition.'],
 ['STUN','STUN(?:S|NED)?','absent','Applications, durations and some immunities are recorded.','Complete standalone control definition.'],
 ['Durability','DURABILITY','absent','Explicit buff/debuff amounts are recorded.','Exact affected damage, caps and calculation.'],
 ['INSPIRATION','INSPIRATION','alias_unconfirmed','The catalog has a separately named Inspire definition.','Confirm current alias and limits before treating them as identical.'],
 ['BIRTHRIGHT','BIRTHRIGHT','defined_quantitative_limits','Historical definition increases Skill/Leader/Passive damage and loses one mark each turn.','Numeric increase per mark and current quantitative applicability.'],
 ['FIRE','FIRE','defined_quantitative_limits','A status definition is present.','Complete stack-damage formula tables are not supplied.'],
 ['BLEED','BLEED','defined_quantitative_limits','A status definition is present.','Complete stack-damage formula tables are not supplied.'],
];
export const effectDefinitionCoverage=rows.map(([effectName,pattern,definitionState,known,unresolved,blocksWrathSupport=false])=>({effectName,pattern:new RegExp('\\b(?:'+pattern+')\\b','i'),definitionState,known,unresolved,blocksWrathSupport}));

// These names are known concepts, not definitions inferred from their labels.
// Current tooltip bodies and private source identities arrive only via the file.
const additionalNames = [
  ['ENDURING FIRE GEM','ENDURING FIRE(?: GEMS?)?'],
  ['CRIPPLING FIRE GEM','CRIPPLING FIRE(?: GEMS?)?'],
  ['ROARING FIRE GEM','ROARING FIRE(?: GEMS?)?'],
  ['WARMONGER','WARMONGER'], ['BIDE','BID(?:E|ING)'],
  ['TRUE KNIGHT GEM','TRUE KNIGHT GEMS?'], ['GOLDEN BASTION','GOLDEN BASTION'],
  ["THE KHAL'S DOMINANCE","THE KHAL'S DOMINANCE"], ["TYRION'S DEFENDER","TYRION'S DEFENDER"],
  ['TAUNT','TAUNT(?:ING)?'], ['POISON','POISON(?:ED|ING)?'], ['RAID','RAID'], ['DECEIVE','DECEIV(?:E|ED|ES|ING)'],
  ['BRITTLE','BRITTLE'], ['TRUE DAMAGE','TRUE DAMAGE'], ['DODGE CHANCE','DODGE(?: CHANCE)?'],
  ['FIRE RESISTANCE','FIRE RESISTANCE'], ['REMOVE','REMOV(?:E|ED|ES|ING)'], ['TREASURY','TREASURY'],
  ['WOUND','WOUND(?:ED|ING)?'], ['BLOOD DEBT','BLOOD DEBT'], ["VIPER'S BITE","VIPER'S BITE"],
  ['CURRENT HP','CURRENT HP'], ['WILDLING HORDE','WILDLING HORDE'], ["ARYA'S LIST","ARYA'S LIST"],
  ['REVIVE','REVIV(?:E|ED|ES|ING)'], ['ABILITY','ABILIT(?:Y|IES)'], ['PHYSICAL RESISTANCE','PHYSICAL RESISTANCE'],
  ['HP GUARD','HP GUARD'], ['GEM CRIT CHANCE','GEM CRIT CHANCE'], ['COUNTER','COUNTER'], ['DEPOSE','DEPOSE'],
  ['ACCURACY','ACCURACY'], ["CRISTON'S CHARGE","CRISTON'S CHARGE"], ['SUSTAINED','SUSTAINED'], ['RED DRAGON GEM','RED DRAGON GEMS?'],
];
const key = value => String(value || '').toUpperCase().replace(/\s+/g,' ').trim();
const identity = value => key(value).replace(/[’']/g,'').replace(/[^A-Z0-9]+/g,' ').trim();
const specs = [...effectDefinitionCoverage,...additionalNames.map(([effectName,pattern])=>({effectName,pattern:new RegExp('\\b(?:'+pattern+')\\b','i'),blocksWrathSupport:false}))];
export const effectSpecFor = name => specs.find(row=>key(row.effectName)===key(name)||({JUSTICE:'Justice Gem',SCOUT:'SCOUT / SCOUTED',SCOUTED:'SCOUT / SCOUTED',INSPIRE:'INSPIRATION'}[key(name)]===row.effectName));
const specFor = effectSpecFor;
const hasText = value => typeof value==='string' && value.trim().length>0;
const sourceRef = row => (row.provenanceRef||'source-unavailable')+':'+(row.sourceFilenames||[]).join(',');
export const definitionIsUnresolved = row => ['absent','partial','alias_unconfirmed'].includes(row.definitionState);
// Damage/resistance types and named Fire Gems are not references to the FIRE
// status itself. The gem's body may independently name FIRE; inspect that body.
export function mentionsEffect(spec,text) {
  let value=String(text||'').replaceAll('’',"'");
  if(spec.effectName==='CHARGE') value=value.replace(/\bCRISTON'S CHARGE\b/gi,' ');
  if(spec.effectName==='FIRE') value=value.replace(/\b(?:ENDURING|CRIPPLING|CLEANSING|ROARING) FIRE(?: GEMS?)?\b/gi,' ').replace(/\bFIRE\s+(?:Damage|Resistance)\b/gi,' ');
  return spec.pattern.test(value);
}


/** Validate explicit exact-group links. An unlinked tooltip remains reference
 * evidence; it cannot create a champion, ownership claim, ability or score. */
export const recordMentionsEffect=(spec,record)=>[record.text,...(record.textFragments||[]).map(fragment=>fragment.text)].some(text=>mentionsEffect(spec,text));

export const prepareEffectDefinitionUpdates=(updates,groups,records)=>prepareEffectEvidence(updates,groups,records,false);
export const prepareEffectDefinitionExcerpts=(updates,groups,records)=>prepareEffectEvidence(updates,groups,records,true);
function prepareEffectEvidence(updates, groups, records, excerpt) {
  if (updates == null) return [];
  if (!Array.isArray(updates)) throw Error('Effect definition updates must be an array.');
  const seen = new Set();
  return updates.map(row=>{
    const spec=specFor(row?.effect);
    if (!spec || !hasText(row.title) || !hasText(row.definition) || (!excerpt&&/…|\.\.\./.test(row.definition)) || row.readability!==(excerpt?'partial_trait_excerpt_visually_readable':'complete_popup_visually_readable')) throw Error('Effect definition requires a supported name and complete reviewed tooltip wording.');
    if(excerpt&&(!embeddedSpecFor(spec.effectName)||row.evidence_kind!=='trait_excerpt'||!hasText(row.ability_name)||!hasText(row.excerpt_note)))throw Error('Embedded excerpt requires its recorded trait name and an explicit partial-evidence note.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.review_date||'') || !Array.isArray(row.remaining) || row.remaining.some(note=>!hasText(note)) || !Array.isArray(row.applies_to)) throw Error('Effect definition needs a review date, remaining-rule notes and explicit scope.');
    if(row.sources!=null&&row.source!=null)throw Error('Use one source container; reconcile source identities explicitly.');
    const sources=row.sources||[row.source];
    if (!Array.isArray(sources)||!sources.length) throw Error('Effect definition sources must be a nonempty array.');
    const filenames=new Set(),ids=new Set();
    for(const source of sources) {
      if (!source || !hasText(source.file_name) || !hasText(source.library_file_id) || (source.version!=null&&(!Number.isSafeInteger(source.version)||source.version<0))) throw Error('Effect definition source identity is missing or inconsistent.');
      if (filenames.has(source.file_name)||ids.has(source.library_file_id)) throw Error('Duplicate effect definition source identity; reconcile evidence explicitly.');
      filenames.add(source.file_name);ids.add(source.library_file_id);
      if(source.sha256!=null&&!/^[a-f0-9]{64}$/.test(source.sha256))throw Error('Invalid effect definition source hash.');
    }
    if(row.source&&row.source.file_name!==row.screenshot)throw Error('Effect definition source identity is missing or inconsistent.');
    if(sources.length>1&&(row.reconciliation?.kind!=='identical_definition_sources'||row.reconciliation.source_count!==sources.length))throw Error('Multiple sources require explicit identical-definition reconciliation.');
    const linked=[];
    for (const scope of row.applies_to) {
      const group=groups.get(scope.capture_group_id);
      if (!group || group.duplicate_of_group_id || identity(group.champion)!==identity(scope.champion) || identity(group.exact_variant)!==identity(scope.exact_variant)) throw Error('Effect definition exact-variant scope does not match a primary capture group.');
      const matches=records.filter(record=>record.captureGroupId===group.capture_group_id&&recordMentionsEffect(spec,record));
      if (!matches.length) throw Error('Effect definition has no matching current ability reference in its scoped capture group.');
      linked.push({captureGroupId:group.capture_group_id,variantId:matches[0].variantId});
    }
    const keys=linked.length?linked.map(scope=>key(spec.effectName)+'|'+scope.captureGroupId):[key(spec.effectName)+'|standalone'];
    if (keys.some(value=>seen.has(value)) || new Set(keys).size!==keys.length) throw Error('Duplicate effect definition scope; reconcile evidence explicitly.');
    keys.forEach(value=>seen.add(value));
    // Select known identity fields rather than retaining executable/extra data or
    // executor-local paths supplied by an arbitrary selected JSON document.
    const sourceIdentities=sources.map(source=>{
      const result={file_name:source.file_name,library_file_id:source.library_file_id};
      for(const name of ['file_id','message_id','sent_at','sha256','champion_context','screen_context','notes'])if(hasText(source[name]))result[name]=source[name];
      if(source.version!=null)result.version=source.version;
      return result;
    });
    return {effectName:spec.effectName,title:row.title,text:row.definition,definitionState:excerpt?'partial_embedded_evidence':'captured_definition',reviewStatus:excerpt?'partial':'complete',reviewCompletedDate:row.review_date,remainingRules:[...row.remaining],contextNote:hasText(row.match)?row.match:'',observedChampion:hasText(row.champion)?row.champion:null,scopes:linked,scopeState:linked.length?'exact_variant_reference':'standalone_reference',sourceFilenames:sourceIdentities.map(source=>source.file_name),sourceIdentities,provenanceRef:`screenshot-${excerpt?'trait-excerpt':'tooltip'}:${row.review_date}:${key(spec.effectName)}`, ...(excerpt?{id:`trait-excerpt:${row.review_date}:${key(spec.effectName)}`,name:row.ability_name,kind:'trait',variantId:linked.length===1?linked[0].variantId:null,excerptNote:row.excerpt_note,evidenceKind:'trait_excerpt'}:{}),sourceReconciliation:sources.length>1?'identical_definition_sources':'single_source',scoringContribution:0};
  });
}

export function inspectEffectDefinitions(records, updates=[]) {
  const entries=[...effectDefinitionCoverage,...specs.filter(entry=>!effectDefinitionCoverage.includes(entry)&&updates.some(update=>update.effectName===entry.effectName))];
  return entries.flatMap(({pattern,...entry})=>{
    const linked=records.filter(row=>recordMentionsEffect({pattern,...entry},row));
    const definitions=updates.filter(row=>row.effectName===entry.effectName);
    const definition=definitions[0];
    const embeddedSpec=embeddedSpecFor(entry.effectName);
    const embedded=embeddedSpec?linked.filter(row=>hasEmbeddedDefinition(embeddedSpec,row)):[];
    const references=updates.filter(row=>row.effectName!==entry.effectName&&mentionsEffect({pattern,...entry},row.text));
    if (!linked.length&&!definition&&!references.length) return [];
    return [{...entry,
      ...(embedded.length?{definitionState:'embedded_definition',definitionEvidenceKind:'skill_trait_item',known:embedded.map(row=>row.text).join('\n'),unresolved:embeddedSpec.remaining,remainingRules:[embeddedSpec.remaining],definitionSourceRefs:embedded.map(sourceRef)}:{}),
      ...(definition?{definitionState:'captured_definition',definitionReviewStatus:'complete',definitionText:definitions.map(row=>row.text).join('\n'),known:definitions.map(row=>row.text).join('\n'),unresolved:definitions.flatMap(row=>row.remainingRules).join(' '),remainingRules:[...new Set(definitions.flatMap(row=>row.remainingRules))],definitionSourceRefs:definitions.map(sourceRef),sourceFilenames:[...new Set(definitions.flatMap(row=>row.sourceFilenames))],reviewCompletedDate:definition.reviewCompletedDate,contextNote:definition.contextNote}:{}),
      applicationTextState:linked.length?(linked.some(row=>row.reviewStatus!=='complete')?'partial':'captured'):'not_established',
      referenceOnly:!linked.length&&!definition,
      intrinsicPayoffAssumed:false,scoringContribution:0,
      sourceRefs:[...new Set([...linked.map(sourceRef),...definitions.map(sourceRef),...references.map(sourceRef)])],
    }];
  });
}
