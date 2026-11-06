import { prepareReviewedAbilitySections, unconditionalSkillClauses, abilityDisplayName } from './reviewed-ability-sections.js';
import { prepareCapturedAllyPairs } from './captured-ally-pairs.js';
import { applyReviewedFactionMemberships } from './reviewed-faction-memberships.js';
import { hasViserysRemovalTradeoff } from './viserys-removal-model.js';
import { normalizeCapturedDevelopment } from './captured-development.js';
import { prepareRecoveredPortfolios } from './bran-reinforcement-model.js';
import { collectEmbeddedEffectReferences } from './embedded-effect-definitions.js';
import { inspectEffectDefinitions, prepareEffectDefinitionUpdates, prepareEffectDefinitionExcerpts, definitionIsUnresolved } from './effect-definition-status.js';
// Local, opt-in review-handoff ingestion. No uploads, storage, or database writes.
// Screenshot states are dated evidence, never live ownership or progression.
const normalize = value => String(value || '').normalize('NFKC').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const unique = values => [...new Set(values)];
const filenames = text => unique(String(text || '').match(/IMG_\d+\.(?:PNG|JPE?G)/gi) || []);
const plain = text => String(text || '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\*\*/g, '').trim();
const sameIdentity = (group, row) => normalize(group.champion) === normalize(row.championName) && normalize(group.exact_variant) === normalize(row.exactVariant);

export function collectionExclusions(guideData) {
  if (!guideData.verifiedCollection) return [];
  const included = new Set(guideData.verifiedCollection.variantIds);
  return guideData.champions.filter(row => !included.has(row.id)).map(row => row.id);
}
export function collectionWarnings(guideData) {
  const collection = guideData.verifiedCollection;
  return collection ? [`Mechanics coverage is partial: ${unique((collection.effectDefinitionCoverage||collection.effectDefinitions||[]).filter(definitionIsUnresolved).map(row=>row.effectName)).length} named effects have missing, partial or alias-unconfirmed definitions. Complete ability transcription does not mean a fully understood portfolio. Captured tooltip definitions retain any separate rule questions and receive no automatic score.`,...(collection.definitionGaps?.length?[`Unverified special-effect definitions: ${unique(collection.definitionGaps.map(row=>row.effectName)).join(', ')}. They receive no special-effect score; independently visible ordinary damage is not a full interpretation of those champions.`]:[]),`Candidate pool is limited to ${collection.variantIds.length} exact variants in the dated, source-linked handoff. Ownership, levels and item ranks are a dated snapshot, not live game state.`, 'Reactive traits, leader effects, ally gems and iconic conditions remain reference evidence unless the structured battle model supports them. General ranking uses conservative current Skill clauses plus explicitly source-matched, bounded conditional models; a Qarth WRATH model may add at most two structural-fit points. Locked previews, clipped effects, missing skills, and unmodeled conditions receive no inferred credit. Items remain disabled for scoring unless explicitly enabled.'] : [];
}

function validateHandoff(input) {
  if (!input || !/^\d{4}-\d{2}-\d{2}$/.test(input.capture_date || '') || !Array.isArray(input.champion_capture_groups) || !input.champion_capture_groups.length) throw Error('Expected a dated screenshot verification handoff with champion capture groups.');
  if (!Array.isArray(input.all_reviewed_source_filenames) || new Set(input.all_reviewed_source_filenames).size !== input.all_reviewed_source_filenames.length) throw Error('Reviewed source filenames are missing or duplicated.');
  const sourceNames = new Set(input.all_reviewed_source_filenames);
  const groups = new Map();
  for (const row of input.champion_capture_groups) {
    if (!row.capture_group_id || groups.has(row.capture_group_id)) throw Error('Capture group IDs must be present and unique.');
    if (!String(row.champion || '').trim() || !String(row.exact_variant || '').trim() || !row.fields_as_recorded || typeof row.fields_as_recorded !== 'object') throw Error(`Incomplete exact identity or fields in ${row.capture_group_id}.`);
    if (!Array.isArray(row.group_source_filenames) || !row.group_source_filenames.length || row.group_source_filenames.some(name => !sourceNames.has(name)) || !sourceNames.has(row.profile_anchor)) throw Error(`Unresolved source filename in ${row.capture_group_id}.`);
    const cited = row.cited_source_filenames || []; // Unknown notes may explicitly name absent files.
    if (cited.some(name => !sourceNames.has(name))) throw Error(`Unreviewed source reference in ${row.capture_group_id}.`);
    groups.set(row.capture_group_id, row);
  }
  const identities = new Map();
  for (const row of groups.values()) {
    if (row.duplicate_of_group_id) {
      const original = groups.get(row.duplicate_of_group_id);
      if (!original || original.duplicate_of_group_id || normalize(row.champion) !== normalize(original.champion) || normalize(row.exact_variant) !== normalize(original.exact_variant)) throw Error(`Invalid declared duplicate in ${row.capture_group_id}.`);
    } else {
      const key = normalize(row.champion) + '|' + normalize(row.exact_variant);
      if (identities.has(key)) throw Error(`Undeclared duplicate identity in ${row.capture_group_id}; no silent deduplication.`);
      identities.set(key, row.capture_group_id);
    }
  }
  const counts = input.record_counts || {};
  if (counts.capture_groups != null && counts.capture_groups !== groups.size) throw Error('Capture-group count does not match the handoff.');
  if (counts.distinct_champion_records_after_known_duplicate != null && counts.distinct_champion_records_after_known_duplicate !== identities.size) throw Error('Distinct-champion count does not match the handoff.');
  if (counts.original_screenshots != null && counts.original_screenshots !== sourceNames.size) throw Error('Screenshot count does not match the handoff.');
  for (const row of input.faction_panels || []) if (!row.Faction || !row['Three-member bonus'] || !row.source_filenames?.length || row.source_filenames.some(name => !sourceNames.has(name))) throw Error('Faction panel has incomplete evidence.');
  return groups;
}

function evidence(input, group, field, text) {
  return {captureDate: input.capture_date, reviewCompletedDate: input.review_completed_date || null, captureGroupId: group.capture_group_id, field, sourceFilenames: filenames(text).length ? filenames(text) : filenames(group.fields_as_recorded[field]), sourceScope: 'reviewed_field', verificationMethod: 'user-supplied visual-review handoff', provenanceRef: `screenshot-handoff:${input.capture_date}:${group.capture_group_id}:${field}`};
}

// These are UI annotations, not ability bodies. Do not choose the longest quote:
// a later, longer quotation may be an inactive upgrade or an editorial note.
const quotedUiLabels = new Set(['upgraded', 'new', 'max', 'skill up', 'level up']);
function currentQuotation(chunk) {
  const quotes = [...chunk.matchAll(/“([^”]+)”/g)];
  const ignoredUiLabels = [];
  let index = 0;
  while (quotes[index] && quotedUiLabels.has(normalize(quotes[index][1]))) ignoredUiLabels.push(quotes[index++][1]);
  const quote = quotes[index];
  if (!quote) return {reason: 'Current ability quotation missing; no ability or score inferred.'};
  const before = chunk.slice(0, quote.index);
  // Ignore the title and known quoted badges when checking the current boundary.
  const metadata = plain(before.replace(/\*\*[^*]+\*\*/g, '').replace(/“[^”]+”/g, ''));
  if (/\b(?:locked|inactive|preview(?:s)?|next[- ]level)\b/i.test(metadata)) return {reason: 'Only inactive or preview wording follows the ability heading; no current ability or score inferred.'};
  // Check the selected quote's own boundary. A previously recognized badge does
  // not establish that the next quotation is an ability rather than another UI
  // label; conversely, its old "marked" prefix must not taint a real body.
  const precedingQuote = quotes[index - 1];
  const quotePrefix = plain(chunk.slice(precedingQuote ? precedingQuote.index + precedingQuote[0].length : 0, quote.index).replace(/\*\*[^*]+\*\*/g, ''));
  if (/\b(?:marked|badge|indicator|button|label)\s*[:=]?\s*$/i.test(quotePrefix)) return {reason: 'Unrecognized quoted UI annotation; current wording needs review and no ability or score is inferred.'};
  const fragmentQuotes = quotes.slice(index).filter((row, offset) => {
    const previous = quotes[index + offset - 1];
    const prefix = chunk.slice(previous ? previous.index + previous[0].length : 0, row.index);
    return /\bVisible (?:beginning|ending)\s*:\s*$/i.test(plain(prefix));
  });
  return {quote, before, ignoredUiLabels, fragmentQuotes};
}

/** Extract current quoted wording beneath a named ability, skipping explicit UI
 * labels. Later previews and editorial quotations are not abilities. Separately
 * captured beginnings/endings remain separate, partial evidence, never joined. */
export function extractReviewedAbilities(input, group) {
  const records = [], issues = [];
  for (const [field, raw] of Object.entries(group.fields_as_recorded)) {
    const kind = /^(?:current_|mance_|night_king_)?skill$/.test(field) ? 'skill' : /^(?:mance_|night_king_)?traits?(?:_at_current_rank)?$/.test(field) ? 'trait' : /^(?:current_)?iconic$/.test(field) ? 'item' : null;
    if (!kind || typeof raw !== 'string') continue;
    let chunks;
    if (kind === 'trait') {
      const headings = [...raw.matchAll(/\*\*([^*]+?)\*\*\s*[—–]/g)];
      chunks = headings.filter(match => !/stats bonus/i.test(match[1])).map((match, index) => ({name: match[1], text: raw.slice(match.index, headings[headings.indexOf(match) + 1]?.index ?? raw.length)}));
    } else {
      const headings = [...raw.matchAll(/\*\*([^*]+?)\*\*/g)];
      const heading = kind === 'item' ? headings[1] : headings[0];
      chunks = heading ? [{name: heading[1].replace(/:$/, ''), itemName: kind === 'item' ? headings[0]?.[1] : null, text: raw}] : [];
    }
    if (!chunks.length) issues.push({groupId: group.capture_group_id, field, reason: 'No supported named ability boundary; retained as review evidence only.'});
    for (const [index, chunk] of chunks.entries()) {
      const selected = currentQuotation(chunk.text);
      if (selected.reason) { issues.push({groupId: group.capture_group_id, field, abilityName: chunk.name, reason: selected.reason}); continue; }
      const {quote, before, ignoredUiLabels, fragmentQuotes} = selected;
      const text = quote[1].trim();
      const incomplete = /…|\.\.\./.test(text) || fragmentQuotes.length > 0;
      const source = evidence(input, group, field, chunk.text);
      if (source.sourceFilenames.some(name=>!input.all_reviewed_source_filenames.includes(name))) throw Error(`Unreviewed ability source in ${group.capture_group_id}/${field}.`);
      if (!source.sourceFilenames.length) { issues.push({groupId: group.capture_group_id, field, reason: 'Source citation missing; no ability or score inferred.'}); continue; }
      records.push({id: `handoff:${group.capture_group_id}:${field}:${index}`, name: chunk.name, itemName: chunk.itemName || null, kind, text, reviewStatus: incomplete ? 'partial' : 'complete', context: kind === 'trait' && /\bLeader\b/.test(before) ? 'leader' : kind,
        ...(ignoredUiLabels.length ? {ignoredUiLabels} : {}),
        ...(fragmentQuotes.length ? {textFragments: fragmentQuotes.map((fragment, fragmentIndex) => ({text: fragment[1].trim(), sourceFilenames: filenames(chunk.text.slice(fragment.index + fragment[0].length, fragmentQuotes[fragmentIndex + 1]?.index ?? chunk.text.length))})), reviewNotes: ['Separately captured fragments have an unverified connection. The displayed beginning is partial; do not join the fragments or infer the missing words.']} : {}),
        displayedSkillLevel: kind === 'skill' ? Number(/level\s+(\d+)/i.exec(plain(before))?.[1]) || null : null,
        sourceBadgeText:plain(before),
        displayedMax: /\bMAX\b/.test(before),
        staminaSpeed: kind==='skill'?/\b(Very Slow|Very Fast|Normal|Fast|Slow)\b/i.exec(plain(before))?.[1]?.replace(/\b\w/g,char=>char.toUpperCase())||null:null,
        itemLevel: kind === 'item' ? Number(/level\s+(\d+)/i.exec(plain(before))?.[1]) || null : null,
        itemRank: kind === 'item' ? /\s([IVX]+)$/.exec(chunk.name)?.[1] || null : null,
        ...source});
      if (incomplete) issues.push({groupId: group.capture_group_id, field, abilityName: chunk.name, sourceFilenames: source.sourceFilenames, reason: fragmentQuotes.length ? 'Separately captured beginning/ending retained as partial fragments with an unverified connection; no missing words or mechanic score inferred.' : 'Clipped current wording preserved as partial and excluded from mechanic scoring.'});
    }
  }
  return {records, issues};
}

// Conservative affordance extraction, not a combat simulator. A mention, immunity,
// header tag, cost, reaction or locked preview is not proof of an active provider.
function appliesStatus(sentence, status) {
  const friendly = /\b(?:allies|ally|team members?|himself|herself)\b/i;
  const unsafe = /\b(?:not|never|cannot|immune|unless|already|previously|who|chance)\b/i;
  const active = new RegExp(`\\b(?:afflicts?|inflicts?|applies?)\\b[^.;]{0,85}\\b${status}\\b`, 'i');
  // Preserve the existing direct-clause support. A later enemy-targeted clause
  // may stand independently of an earlier allied buff, but a bare "them" after
  // that buff is not enough to change the recipient from ally to enemy.
  const clauses = [sentence, ...sentence.split(/,?\s+then\s+/i).slice(1).filter(clause=>/\b(?:enemy|enemies)\b/i.test(clause))];
  if (clauses.some(clause=>active.test(clause)&&!unsafe.test(clause)&&!friendly.test(clause))) return true;
  // Passive application is recognized only with an explicit enemy subject.
  // "Is afflicted" describes state; only "become(s)" establishes an application.
  const passive = new RegExp(`^(?:(?:Each of these|All|The|An?)\\s+)?(?:enemy|enemies)\\s+becomes?\\s+afflicted with\\s+(?:\\d+\\s+)?${status}\\b`, 'i');
  if (!unsafe.test(sentence)&&!friendly.test(sentence)&&passive.test(sentence)) return true;
  if (status !== 'wound' || unsafe.test(sentence) || friendly.test(sentence)) return false;
  // WOUNDS is the application verb itself, not a second literal WOUND token.
  // A pronoun is accepted only after an explicit offensive enemy target.
  if (/\bWOUNDS?\s+(?:(?:all|each|the|an?)\s+)?(?:target\s+)?(?:enemy|enemies)\b/.test(sentence)) return true;
  const wound = /\bWOUNDS?\s+(?:them|that enemy)\b/.exec(sentence);
  return !!wound && /\b(?:strikes?\s+(?:(?:all|each|the|an?)\s+)?(?:target\s+)?(?:enemy|enemies)|deals?[^.;]*\bDamage to\s+(?:(?:all|each|the|an?)\s+)?(?:target\s+)?(?:enemy|enemies))\b/i.test(sentence.slice(0,wound.index));
}

function mechanicsFor(record) {
  if (record.reviewStatus !== 'complete' || record.kind !== 'skill') return [];
  // Removal and healing cannot be scored separately from this Skill's
  // self-PACIFY and FIRE replacements. Its complete tradeoff is explained by
  // the source-matched model, without a guessed net-benefit weight.
  if (hasViserysRemovalTradeoff(record)) return [];
  const direct = unconditionalSkillClauses(record.text);
  const found = [];
  const add = (id, sentence) => { if (!found.some(row => row.mechanicId === id)) found.push({mechanicId: id, sentence}); };
  for (const sentence of direct) {
    // Damage to a teammate is a cost, not offensive pressure. Restrict credit
    // to a clause explicitly targeting an enemy; generic 'target' is unresolved.
    const damageClauses=sentence.split(/,?\s+then\s+/i).filter(clause=>/\b(?:enemy|enemies|foes?|opponents?)\b/i.test(clause)&&! /\b(?:damage to|strikes?|attacks?)\b[^.;]{0,70}\b(?:team members?|allies|ally|himself|herself)\b/i.test(clause));
    for (const type of ['physical','fire','unnatural','true']) if (damageClauses.some(clause=>new RegExp(`\\b(?:strikes?|deals?|attacks?)\\b[^.]*\\b${type} Damage\\b`, 'i').test(clause))) add(type + '_damage', sentence);
    for (const status of ['bleed','fire','ice','raid','poison','wound']) if (appliesStatus(sentence,status)) add('apply_' + status, sentence);
    if (/\bHEALS?\b/.test(sentence)) add('healing', sentence);
    if (/\b(?:SHIELDS?|grants?[^.;]*SHIELD|gains?[^.;]*SHIELD)\b/.test(sentence)) add('shield', sentence);
    if (/\b(?:gains?|grants?|gives?)\b[^.;]{0,50}\b\d+% Stamina\b/i.test(sentence)) add('stamina', sentence);
    if (/\b(?:grants?|gains?)\b[^.;]{0,50}\bBIRTHRIGHT\b/.test(sentence)) add('birthright', sentence);
    if (/\bREMOVES?\b[^.;]{0,60}\bDebuffs?\b/.test(sentence)) add('cleanse', sentence);
    if (/\bremoves?\b[^.;]{0,50}\bBuffs?\b/i.test(sentence)) add('buff_removal', sentence);
    if (/\b(?:gains?|grants?)\b[^.;]{0,40}\bSTEALTH\b/.test(sentence)) add('stealth', sentence);
    if (/\b(?:STUNS?|PACIFIES|DECEIVES)\b[^.;]{0,50}\b(?:enem|target)/.test(sentence)) add(/STUN/.test(sentence) ? 'stun' : /PACIF/.test(sentence) ? 'pacify' : 'deceive', sentence);
  }
  // Their application text is retained, but the audit lacks a complete control
  // definition. Do not promote a generic STUN/PACIFY mention into control value.
  return found.filter(row=>!['stun','pacify'].includes(row.mechanicId));
}

/** Structured additions from a later visual review. Preview fields are retained
 * as evidence but never copied into active ability wording. No generic base-stat
 * claim is made from a single captured build. */
function reviewedUpdate(input, group) {
  const matches = (input.review_updates || []).filter(row=>normalize(row.character)===normalize(group.champion)&&normalize(row.variant)===normalize(group.exact_variant));
  if (matches.length > 1) throw Error(`Multiple review updates for ${group.capture_group_id}; reconcile their order explicitly.`);
  const update = matches[0];
  if (!update) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(update.review_date || '') || !update.source_files?.length || !update.current_build) throw Error('A review update needs a review date and source identities.');
  for (const [label,level] of [['skill',update.skill?.level],['iconic',update.iconic?.level]]) if (level != null && (!Number.isSafeInteger(level) || level < 1)) throw Error(`Reviewed ${label} level must be a positive integer.`);
  const sourceByName = new Map(update.source_files.map(row=>[row.file_name,row]));
  if (sourceByName.size!==update.source_files.length || update.source_files.some(row=>!row.file_name||!row.library_file_id)) throw Error('Review update source identities are missing or duplicated.');
  const source = (row, field) => {
    if (!row.sources?.length || row.sources.some(name=>!sourceByName.has(name))) throw Error(`Unresolved review-update source for ${group.capture_group_id}/${field}.`);
    return {captureDate:update.capture_date||null,reviewCompletedDate:update.review_date,captureGroupId:group.capture_group_id,field,sourceFilenames:[...row.sources],sourceIdentities:row.sources.map(name=>{const {local_path,...identity}=sourceByName.get(name);return identity;}),sourceScope:'reviewed_ability',verificationMethod:update.verification,provenanceRef:`screenshot-review:${update.review_date}:${group.capture_group_id}:${field}`};
  };
  const records=[];
  for (const [index,row] of (update.traits||[]).entries()) {
    const text=row.current_text||row.text;
    if (!text) continue; // A stat bonus is build evidence, not a combat ability.
    records.push({id:`review:${group.capture_group_id}:trait:${index}`,kind:'trait',context:row.badges?.includes('Leader')?'leader':'trait',name:row.name,text,reviewStatus:/…|\.\.\./.test(text)?'partial':'complete',sourceBadges:[...(row.badges||[])],lockedUpgrades:structuredClone(row.locked_upgrades||[]),...source(row,'trait:'+index)});
  }
  if (update.skill?.text) records.push({id:`review:${group.capture_group_id}:skill`,kind:'skill',context:'skill',name:update.skill.name,text:update.skill.text,reviewStatus:/…|\.\.\./.test(update.skill.text)?'partial':'complete',displayedSkillLevel:update.skill.level||null,displayedMax:update.skill.max===true,staminaSpeed:update.skill.stamina_speed,lockedPreview:update.skill.next_level_upgrade||null,...source(update.skill,'skill')});
  if (update.iconic?.text) records.push({id:`review:${group.capture_group_id}:item`,kind:'item',context:'item',name:update.iconic.ability_name,itemName:update.iconic.name,itemLevel:update.iconic.level,itemRank:/\s([IVX]+)$/.exec(update.iconic.ability_name)?.[1]||null,text:update.iconic.text,reviewStatus:/…|\.\.\./.test(update.iconic.text)?'partial':'complete',...source(update.iconic,'item')});
  return {update,records};
}

/** Pure overlay. Caller keeps the original catalogs for reset; no input is mutated.
 * Registry must come from the pre-existing public catalog, never a guessed roster map. */
export function integrateVerifiedHandoff({handoff, guideData, strategyData, identities = []}) {
  const groups = validateHandoff(handoff);
  const sectionReviews = prepareReviewedAbilitySections(handoff, groups);
  if (handoff.review_updates != null && !Array.isArray(handoff.review_updates)) throw Error('Review updates must be an array.');
  for (const update of handoff.review_updates || []) if (![...groups.values()].some(group=>normalize(group.champion)===normalize(update.character)&&normalize(group.exact_variant)===normalize(update.variant))) throw Error('Review update has no matching exact handoff identity.');
  const guide = structuredClone(guideData);
  // Catalog-only pages can review captured builds without requesting strategy.
  // The empty working set is never exposed as a usable strategy catalog.
  const strategy = strategyData ? structuredClone(strategyData) : {mechanics:[],championFacts:[],curatedRecommendations:[]};
  const originalChampions = structuredClone(guideData.identityChampions || guideData.champions);
  const audit = {captureDate: handoff.capture_date, reviewCompletedDate: handoff.review_completed_date, sourceCounts: handoff.record_counts, mappings: [], duplicates: [], extractionIssues: [], missingSkills: [], conflicts: structuredClone(handoff.material_conflicts_and_gaps || []), interpretationRules: [...(handoff.interpretation_rules || [])], factionMembershipsInferred: 0};
  const records = [], variantIds = [], mappedIds = new Set();
  for (const group of groups.values()) {
    if (group.duplicate_of_group_id) { audit.duplicates.push({groupId: group.capture_group_id, duplicateOf: group.duplicate_of_group_id, sourceFilenames: group.group_source_filenames}); continue; }
    const fullName = `${group.champion} — ${group.exact_variant}`;
    const registry = identities.filter(row => sameIdentity(group, row));
    const exact = guideData.champions.filter(row => normalize(row.name) === normalize(fullName));
    const candidates = unique([...registry.map(row => row.variantId), ...exact.map(row => row.id)]);
    if (candidates.length > 1) throw Error(`Ambiguous canonical identity for ${fullName}; review before importing.`);
    const variantId = candidates[0] || 'local-verified:' + normalize(fullName).replaceAll(' ', '-');
    if (mappedIds.has(variantId)) throw Error(`Two distinct handoff variants resolve to ${variantId}; review before importing.`);
    mappedIds.add(variantId); variantIds.push(variantId);
    let extracted = extractReviewedAbilities(handoff, group);
    const later = reviewedUpdate(handoff, group);
    if (later) {
      const replacedKinds=new Set(later.records.map(row=>row.kind));
      extracted={records:[...extracted.records.filter(row=>!replacedKinds.has(row.kind)),...later.records],issues:[...extracted.issues.filter(issue=>!later.records.some(row=>row.kind==='trait'&&/trait/.test(issue.field))),...later.records.filter(row=>row.reviewStatus==='partial').map(row=>({groupId:group.capture_group_id,field:row.field,reason:'Clipped later-review wording preserved as partial and excluded from mechanic scoring.'}))]};
      for(const conflict of audit.conflicts.filter(row=>String(row.group).split('/').includes(group.capture_group_id)&&later.update.resolved_fields?.includes(row.field))) {conflict.state='resolved_for_reviewed_build';conflict.resolution=later.update.resolved_issue;conflict.reviewedOn=later.update.review_date;conflict.resolutionSources=later.update.source_files.map(({file_name,library_file_id})=>({file_name,library_file_id}));}
    }
    const reviewedSections = sectionReviews.get(group.capture_group_id) || [];
    if (reviewedSections.some(section => extracted.records.some(row => row.kind === section.kind))) throw Error(`Ability section review: ${group.capture_group_id} already has that ability category; reconcile sources explicitly instead of replacing it.`);
    if (reviewedSections.length) {
      extracted.records.push(...reviewedSections);
      extracted.issues.push({groupId:group.capture_group_id,field:'ability_sections',reason:'Latest screenshot sections integrated; the complete Skill, trait and iconic portfolio has not yet been reconciled.'});
    }
    audit.extractionIssues.push(...extracted.issues);
    if (!extracted.records.some(row => row.kind === 'skill')) audit.missingSkills.push({groupId: group.capture_group_id, variantId, name: fullName});
    const sourceGroups = [group, ...[...groups.values()].filter(row => row.duplicate_of_group_id === group.capture_group_id)];
    const old = guide.champions.find(row => row.id === variantId);
    const champion = {...(old || {id: variantId, legacyId: null, rarity: null, gemColor: null, portrait: null, factions: [], roles: []}), name: fullName, releaseState: 'live', reviewStatus: !extracted.issues.length && extracted.records.some(row => row.kind === 'skill') && extracted.records.every(row=>row.reviewStatus==='complete') ? 'complete' : 'partial',
      screenshotState: {captureDate: handoff.capture_date, profileText: plain(group.fields_as_recorded.profile), sourceFilenames: unique(sourceGroups.flatMap(row => row.group_source_filenames)), conflicts: audit.conflicts.filter(row => String(row.group).split('/').includes(group.capture_group_id))}};
    if(later) {
      const build=later.update.current_build;
      champion.screenshotState={...champion.screenshotState,captureDate:later.update.capture_date||null,historicalProfileText:champion.screenshotState.profileText,reviewedOn:later.update.review_date,currentBuild:structuredClone(build),detailedStats:structuredClone(later.update.detailed_stats||{}),resolvedIssue:later.update.resolved_issue,sourceFilenames:later.update.source_files.map(row=>row.file_name),profileText:[later.update.rarity,build.level!=null?'level '+build.level:null,build.stars!=null?build.stars+' stars':null,build.champion_rating!=null?'power '+build.champion_rating:null,build.attack_display?'ATK '+build.attack_display:null,build.defense_display?'DEF '+build.defense_display:null,build.health_display?'HP '+build.health_display:null,build.skill_level!=null?'skill level '+build.skill_level:null].filter(Boolean).join('; ')};
    }
    champion.screenshotState.development=normalizeCapturedDevelopment({handoff,group,update:later?.update,variantId,conflicts:champion.screenshotState.conflicts});
    if (old) guide.champions[guide.champions.indexOf(old)] = champion; else guide.champions.push(champion);
    audit.mappings.push({groupId: group.capture_group_id, variantId, name: fullName, state: candidates.length ? 'existing_exact_identity' : 'local_exact_identity', identityProvenance: registry.map(row => row.provenanceRef)});
    records.push(...extracted.records.map(row => ({...row, variantId})));
  }
  // Earlier supplied portfolios are evidence, not a missing-upload claim.
  // Keep their observed ranks separate from the latest profile and do not feed
  // prior-rank bodies or upgrade previews to the current-Skill score extractor.
  const recoveredPortfolios = prepareRecoveredPortfolios(handoff, audit.mappings);
  audit.priorRankSkills = recoveredPortfolios.map(row => ({groupId:row.groupId,variantId:row.variantId,name:row.name,observedSkillLevel:row.skill.level,reason:'Earlier supplied Skill and portfolio recovered; current profile progression is stored separately.'}));
  audit.missingSkills = audit.missingSkills.filter(row => !recoveredPortfolios.some(portfolio => portfolio.variantId === row.variantId));
  for (const portfolio of recoveredPortfolios) {
    guide.champions.find(row => row.id === portfolio.variantId).screenshotState.recoveredPortfolio = {observedSkillLevel:portfolio.skill.level,reviewedOn:portfolio.reviewDate,sourceFilenames:unique([portfolio.skill,...portfolio.traits,portfolio.companion.skill].flatMap(row=>row.sourceFilenames)),status:'dated_portfolio_with_separate_current_progression'};
  }
  // Keep replaced source wording only for named-effect reference answers. This
  // archive is never consulted by collection filtering, providers or scoring.
  const historicalReferences=[...(guide.historicalEffectReferences||[]),...collectEmbeddedEffectReferences(guideData)];
  guide.historicalEffectReferences=historicalReferences.filter((row,index,all)=>all.findIndex(other=>other.referenceKey===row.referenceKey)===index).map(row=>({...row,historicalReference:true}));
  // Never borrow an old max-level skill, locked trait or item for a captured variant.
  guide.abilities = guide.abilities.filter(row => !mappedIds.has(row.variantId));
  guide.traits = (guide.traits || []).filter(row => !mappedIds.has(row.variantId));
  guide.items = guide.items.filter(row => !mappedIds.has(row.ownerVariantId));
  strategy.championFacts = strategy.championFacts.filter(row => !mappedIds.has(row.variantId) || ['identity','faction'].includes(row.context));
  for (const row of records) {
    const provenance = `${row.provenanceRef}:${row.sourceFilenames.join(',')}`;
    if (row.kind === 'item') guide.items.push({id: row.id, name: row.itemName, ownerVariantId: row.variantId, ownerName: guide.champions.find(champion => champion.id === row.variantId).name, reviewStatus: row.reviewStatus, abilities: [{...row, provenance}]});
    else if (row.kind === 'trait') guide.traits.push({...row, type: row.context === 'leader' ? 'Leader' : null, scope: null, provenance});
    else guide.abilities.push({...row, provenance});
    for (const fact of mechanicsFor(row).filter(fact => strategy.mechanics.some(mechanic => mechanic.id === fact.mechanicId))) strategy.championFacts.push({id: row.id + ':' + fact.mechanicId, variantId: row.variantId, mechanicId: fact.mechanicId, effectRole: 'provides', context: row.context, factText: abilityDisplayName(row) + ': ' + fact.sentence, fullSourceText: row.text, evidenceCategory: 'verified_fact', provenanceRef: provenance, sourceId: null, sourceFilenames: row.sourceFilenames, captureDate: row.captureDate, reviewCompletedDate:row.reviewCompletedDate, confidence: 1, reviewStatus: row.reviewStatus, extractionScope: 'explicit_unconditional_skill_clause', supportingClause: fact.sentence});
  }
  for (const panel of handoff.faction_panels || []) {
    const matches = guide.factions.filter(row => normalize(row.name) === normalize(panel.Faction));
    if (matches.length !== 1) { audit.extractionIssues.push({field: 'faction', reason: `No unique existing faction identity for ${panel.Faction}; panel retained without assigning memberships.`}); continue; }
    const faction = matches[0], ref = `screenshot-handoff:${handoff.capture_date}:faction:${panel.source_filenames.join(',')}`;
    faction.rules = faction.rules.filter(row => !['current_bonus','how_to_play'].includes(row.kind)).concat([{id: ref + ':bonus', kind: 'current_bonus', text: panel['Three-member bonus'], provenanceRef: ref}, {id: ref + ':play', kind: 'how_to_play', text: panel['How-to-play wording'] || '', provenanceRef: ref}]);
    // Keep original, independently supported membership only. A background name
    // behind the overlay is explicitly insufficient to identify a champion variant.
    guide.factionActivations = (guide.factionActivations || []).filter(row => row.factionId !== faction.id).concat([{factionId: faction.id, factionName: faction.name, requiredMembers: 3, sourceId: ref, provenanceRef: ref}]);
  }
  const effectDefinitionUpdates=prepareEffectDefinitionUpdates(handoff.effect_definition_updates,groups,records);
  const effectDefinitionExcerpts=prepareEffectDefinitionExcerpts(handoff.effect_definition_excerpts,groups,records);
  const effectDefinitionCoverage=inspectEffectDefinitions(records,effectDefinitionUpdates);
  audit.effectDefinitionUpdates={captured:effectDefinitionUpdates.length,uniqueDefinitions:unique(effectDefinitionUpdates.map(row=>row.effectName)).length,tooltipSources:effectDefinitionUpdates.reduce((count,row)=>count+row.sourceIdentities.length,0),duplicateSourcesRetained:effectDefinitionUpdates.reduce((count,row)=>count+row.sourceIdentities.length-1,0),traitExcerpts:effectDefinitionExcerpts.length,linked:effectDefinitionUpdates.filter(row=>row.scopes.length).length,standalone:effectDefinitionUpdates.filter(row=>!row.scopes.length).map(row=>({effectName:row.effectName,reason:'No exact captured variant was linked; definition retained without creating a roster member.'}))};
  const effectDefinitions=[];
  const supportModelGaps=[];
  const definitionGaps=[];
  for(const variantId of variantIds) {
    const coverage=inspectEffectDefinitions(records.filter(row=>row.variantId===variantId),effectDefinitionUpdates.filter(row=>row.scopes.some(scope=>scope.variantId===variantId))).map(row=>({...row,variantId}));
    effectDefinitions.push(...coverage);
    // Preserve the high-priority complete-definition gaps as explicit blockers
    // for newly inferred support links, without discarding known ordinary clauses.
    const gaps=coverage.filter(row=>row.blocksWrathSupport&&definitionIsUnresolved(row)).map(row=>({...row,status:'definition_unverified'}));
    // Definitions are reference-only. Removing a missing-definition warning must
    // not silently enable untested support models or change team scoring.
    supportModelGaps.push(...coverage.filter(row=>row.blocksWrathSupport).map(row=>({variantId,effectName:row.effectName,status:definitionIsUnresolved(row)?'definition_unverified':'support_model_unimplemented'})));
    definitionGaps.push(...gaps);
    const champion=guide.champions.find(row=>row.id===variantId);
    champion.screenshotState.definitionGaps=gaps;
    champion.screenshotState.effectDefinitions=coverage;
    champion.strategyInterpretationStatus=coverage.some(row=>definitionIsUnresolved(row)||row.remainingRules?.length)?'partial':'source_bounded';
  }
  audit.abilitySectionReviews={groups:sectionReviews.size,records:[...sectionReviews.values()].flat().length,completeBodies:[...sectionReviews.values()].flat().filter(row=>row.reviewStatus==='complete').length,partialBodies:[...sectionReviews.values()].flat().filter(row=>row.reviewStatus==='partial').length};
  const capturedAllies=prepareCapturedAllyPairs({handoff,mappings:audit.mappings});
  audit.capturedAllyPairs=capturedAllies.audit;
  audit.extractionIssues.push(...capturedAllies.issues);
  guide.historicalAllyGems = guide.allyGems || [];
  guide.allyGems = []; // Captured pairs use a separate zero-score model; no old pair activation is assumed.
  const factionReviews = applyReviewedFactionMemberships({reviews:handoff.faction_membership_reviews,mappings:audit.mappings,guide,strategy,baseMembershipEvidence:(strategyData?.championFacts||[]).filter(row=>row.effectRole==='member'&&row.mechanicId?.startsWith('faction_'))});
  audit.factionMembershipReviews = factionReviews.reviews;
  guide.identityChampions = originalChampions.filter(row => !mappedIds.has(row.id)).concat(guide.champions.filter(row => mappedIds.has(row.id)));
  guide.verifiedCollection = {captureDate: handoff.capture_date, reviewDates:unique([...(handoff.ability_section_reviews||[]).map(row=>row.review_date),...(handoff.review_updates||[]).map(row=>row.review_date),...factionReviews.reviews.map(row=>row.reviewedOn),...effectDefinitionUpdates.map(row=>row.reviewCompletedDate),...effectDefinitionExcerpts.map(row=>row.reviewCompletedDate)]), variantIds, audit, records, capturedAllyPairs:capturedAllies.pairs, definitionGaps, supportModelGaps, effectDefinitions, effectDefinitionUpdates, effectDefinitionExcerpts, effectDefinitionCoverage, factionMembershipEvidence:factionReviews.evidence, reviewedGroups:structuredClone(handoff.champion_capture_groups), reviewedUpdates:structuredClone(handoff.review_updates||[]), reviewedAbilitySections:structuredClone(handoff.ability_section_reviews||[]), supplementalPanels:structuredClone(handoff.supplemental_panels||[]), factionPanels:structuredClone(handoff.faction_panels||[])};
  guide.verifiedCollection.recoveredPortfolios = recoveredPortfolios;
  strategy.verifiedCollection = {captureDate: handoff.capture_date};
  // Historical curated advice remains accessible in the base catalog but cannot
  // silently introduce non-captured or unresolved roster slots into this session.
  strategy.curatedRecommendations = (strategy.curatedRecommendations || []).filter(row => row.members.every(member => member.variantId && mappedIds.has(member.variantId)));
  return {guideData: guide, strategyData: strategyData ? strategy : null, audit};
}
