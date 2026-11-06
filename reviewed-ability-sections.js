// Supplement missing ability sections with explicitly reviewed, current source
// evidence. An incomplete portfolio is never completed from an older catalog.
const normalize = value => String(value || '').normalize('NFKC').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const date = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '');
const fail = detail => { throw Error('Ability section review: ' + detail); };

export function abilityDisplayName(record) {
  return record.name || (record.kind === 'skill' ? 'Skill (name not visible)' : 'Trait (name not visible)');
}

export function prepareReviewedAbilitySections(handoff, groups) {
  const reviews = handoff.ability_section_reviews || [];
  if (!Array.isArray(reviews)) fail('expected an array.');
  const result = new Map();
  for (const review of reviews) {
    const group = groups.get(review.capture_group_id);
    if (!group || group.duplicate_of_group_id || normalize(group.champion) !== normalize(review.champion) || normalize(group.exact_variant) !== normalize(review.exact_variant)) fail('exact capture identity does not match.');
    if (result.has(group.capture_group_id)) fail('duplicate group review needs reconciliation.');
    if (!date(review.review_date) || review.policy !== 'fill_missing_sections_only' || !review.sections?.length || !Array.isArray(review.sections)) fail('review date, policy and sections are required.');
    if (!Array.isArray(review.source_files) || !review.source_files.length) fail('source identities are required.');
    const sources = new Map();
    for (const source of review.source_files) {
      if (!source.file_name || !source.library_file_id || !source.source_message_id || !source.uploaded_at || sources.has(source.file_name)) fail('source identities are incomplete or duplicated.');
      const {local_path, workspace_path, ...identity} = source;
      sources.set(source.file_name, identity);
    }
    const seen = new Set();
    const records = review.sections.map(section => {
      if (!section.section_id || seen.has(section.section_id)) fail('section IDs must be unique.');
      seen.add(section.section_id);
      if (!['skill','trait'].includes(section.kind) || !['complete','partial'].includes(section.body_status) || !String(section.text || '').trim()) fail('supported kind, explicit body completeness and wording are required.');
      if (!['skill','leader','trait'].includes(section.context) || (section.kind === 'skill') !== (section.context === 'skill')) fail('ability context is inconsistent.');
      if (section.name !== null && (typeof section.name !== 'string' || !section.name.trim())) fail('name must be visible text or null.');
      if (section.name === null && !section.name_limit) fail('hidden names need an explicit limit.');
      if (section.body_status === 'complete' && /…|\.\.\./.test(section.text)) fail('clipped text cannot be complete.');
      if (section.body_status === 'partial' && !section.completeness_note) fail('partial bodies need an explicit limit.');
      if (!section.sources?.length || new Set(section.sources).size !== section.sources.length || section.sources.some(name => !sources.has(name))) fail('section source is unresolved.');
      for (const level of [section.displayed_skill_level, section.inferred_skill_level]) if (level != null && (!Number.isSafeInteger(level) || level < 1 || section.kind !== 'skill')) fail('skill level is invalid.');
      if (section.inferred_skill_level != null && (!section.level_inference_basis || section.displayed_skill_level != null)) fail('inferred and displayed levels must remain distinct.');
      if (section.next_level_preview && (section.next_level_preview.current !== false || !section.next_level_preview.text)) fail('next-level previews must be explicitly inactive.');
      return {
        id:`section-review:${group.capture_group_id}:${section.section_id}`, kind:section.kind, context:section.context,
        name:section.name, nameStatus:section.name === null ? 'not_visible' : 'visible', text:section.text,
        reviewStatus:section.body_status, portfolioStatus:'not_fully_reconciled',
        reviewNotes:[section.name_limit, section.completeness_note, ...(section.limits || [])].filter(Boolean),
        displayedSkillLevel:section.displayed_skill_level || null,
        inferredSkillLevel:section.inferred_skill_level || null, levelInferenceBasis:section.level_inference_basis || null,
        displayedMax:section.rank_label === 'MAX', sourceBadges:[...(section.badges || [])],
        lockedPreview:section.next_level_preview?.text || null,
        captureDate:review.capture_date || null, reviewCompletedDate:review.review_date, captureGroupId:group.capture_group_id,
        field:'ability_section:' + section.section_id, sourceFilenames:[...section.sources],
        sourceIdentities:section.sources.map(name => structuredClone(sources.get(name))),
        sourceScope:'reviewed_current_ability_section', verificationMethod:'visual review of latest user-supplied screenshot',
        provenanceRef:`screenshot-section-review:${review.review_date}:${group.capture_group_id}:${section.section_id}`
      };
    });
    if (records.filter(row => row.kind === 'skill').length > 1) fail('multiple current Skills need explicit reconciliation.');
    result.set(group.capture_group_id, records);
  }
  return result;
}

// One bounded grammar separates a direct status application from a later
// per-stack damage amount. No conditional damage total or score is inferred.
// Other conditional wording retains the existing stop-at-first-condition rule.
export function unconditionalSkillClauses(text) {
  const sentences = text.split(/(?<=[.!?])\s+/), direct = [];
  const gate = /\b(if|when|whenever|upon|chance|treasury\s*\(|for each|per \w+|at the start|after|until|while|consumes?|spends?|requires?|at (?:a|the) cost)\b/i;
  const countedStrike = /^([A-Z][A-Za-z'’ -]* afflicts an enemy with \d+ (BLEED|FIRE|ICE|POISON|WOUND)) then strikes them for \d+% ATK (?:Physical|Fire|Unnatural|True) Damage for each \2\.$/;
  for (const sentence of sentences) {
    if (!gate.test(sentence)) { direct.push(sentence); continue; }
    const match = countedStrike.exec(sentence);
    if (match && !gate.test(match[1])) { direct.push(match[1]); continue; }
    break;
  }
  return direct;
}
