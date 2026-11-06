// Dated profile observations for display only. No scoring, thresholds, or
// combat-effectiveness conversion belongs in this module.
const positiveInteger = value => Number.isSafeInteger(value) && value > 0;
const date = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value : null;
const words = {one:1,two:2,three:3,four:4,five:5,six:6,seven:7};
const unique = values => [...new Set(values)];
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const number = value => value.toLocaleString('en-US');

function profileField(text, field) {
  // Only standalone profile clauses count. Skill/item levels, upgrade arrows,
  // shard progress, previews and rounded K values cannot supply these fields.
  const clauses = text.split(';').map(value=>value.trim());
  const patterns = {
    level: /^level\s+([1-9]\d*)(?:(?:,?\s+MAX)|(?:\s+\([^)]*\))|(?:\s+with Level Up active))?\.?$/i,
    power: /^power\s+([1-9]\d{0,2}(?:,\d{3})+|[1-9]\d*)(?=$|[;.]?$|\s*(?:\[|Source:))/i,
    stars: /^(one|two|three|four|five|six|seven|[1-9]\d*)(?:\s+of\s+(one|two|three|four|five|six|seven|[1-9]\d*))?\s+stars(?:\s+at maximum rank|\s*\(\d+\/\d+ progress (?:toward|to) (?:one|two|three|four|five|six|seven|[1-9]\d*)\)|,\s*\d+\/\d+ progress (?:toward|to) (?:one|two|three|four|five|six|seven|[1-9]\d*)|,\s*with \d+\/\d+ shards shown beside an active Enhance button)?\.?$/i,
  };
  const starts = {level:/^level\b/i,power:/^power\b/i,stars:/^(?:one|two|three|four|five|six|seven|\d+)\s+(?:of\s+\S+\s+)?stars\b/i};
  const found = clauses.filter(value=>starts[field].test(value));
  if (!found.length) return {value:null,issue:null};
  const parsed = found.map(value=>{
    if (/\b(?:unknown|uncertain|unreadable|unclear|clipped|conflict|preview|locked|inactive|upgrade|next|was|previously|not|or)\b|\?|…|\.\.\./i.test(value)) return null;
    const match = patterns[field].exec(value);
    const token = match?.[1];
    const n = words[token?.toLowerCase()] || Number(token?.replaceAll(',',''));
    if (field==='stars' && match?.[2] && n>(words[match[2].toLowerCase()]||Number(match[2]))) return null;
    return positiveInteger(n) ? n : null;
  });
  return parsed.includes(null) || unique(parsed).length !== 1
    ? {value:null,issue:`Captured ${field} wording is ambiguous or unsupported; no value inferred.`}
    : {value:parsed[0],issue:null};
}

/** Called only after the handoff has resolved the exact variant and sources.
 * A later reviewed build replaces the profile observation as a whole: missing
 * fields never borrow older values, and review date is not capture date. */
export function normalizeCapturedDevelopment({handoff,group,update=null,variantId,conflicts=[]}) {
  const issues = [];
  const values = {};
  const profile = String(group.fields_as_recorded.profile || '').replace(/\*\*/g,'');
  for (const [field,key] of [['level','level'],['stars','stars'],['power','champion_rating']]) {
    const raw = update?.current_build?.[key];
    const parsed = update ? {value:positiveInteger(raw)?raw:null,issue:raw!=null&&!positiveInteger(raw)?`Reviewed ${field} is not a positive integer; no value inferred.`:null} : profileField(profile,field);
    const disputed = conflicts.some(row=>row.state!=='resolved_for_reviewed_build' && (field==='stars'?/\bstars?\b/i:field==='power'?/\b(?:power|rating)\b/i:/\b(?:champion )?level\b/i).test(row.field||'') && !/\b(?:skill|trait|iconic|item)\b/i.test(row.field||''));
    values[field] = disputed ? null : parsed.value;
    if (disputed) issues.push(`Captured ${field} has an unresolved source conflict; no value selected.`);
    if (parsed.issue) issues.push(parsed.issue);
  }
  const sources = update ? update.source_files.map(row=>row.file_name) : [group.profile_anchor];
  return {
    variantId,...values,
    captureDate:date(update ? update.capture_date : handoff.capture_date),
    reviewCompletedDate:date(update ? update.review_date : handoff.review_completed_date),
    sourceFilenames:unique(sources),
    sourceScope:update?'reviewed_build':'profile_anchor',
    provenanceRef:update?`screenshot-review:${update.review_date}:${group.capture_group_id}:current_build`:`screenshot-handoff:${handoff.capture_date}:${group.capture_group_id}:profile`,
    issues,
  };
}

export function capturedDevelopment(champion) {
  const row = champion?.screenshotState?.development;
  // Do not borrow a raw power field, an old currentBuild, or another variant.
  if (!row || row.variantId!==champion.id || !row.provenanceRef || !Array.isArray(row.sourceFilenames) || !row.sourceFilenames.length || !(date(row.captureDate)||date(row.reviewCompletedDate))) return null;
  return {...row,issues:Array.isArray(row.issues)?row.issues:[],...Object.fromEntries(['level','stars','power'].map(key=>[key,positiveInteger(row[key])?row[key]:null]))};
}

export const developmentRankingNotice = 'Rankings do not yet consider level, stars or displayed power. Modeled mechanics can fit a battle without establishing the strongest available build.';

export function describeTeamDevelopment(champions, rankingPolicy=null, collection=null) {
  const observations = champions.map(champion=>({champion,development:capturedDevelopment(champion)}));
  const ranges = ['level','power'].map(field=>{
    const values = observations.map(row=>row.development?.[field]).filter(positiveInteger);
    return values.length?{field,min:Math.min(...values),max:Math.max(...values),known:values.length,total:champions.length}:null;
  }).filter(Boolean);
  const differs = ['level','stars'].some(field=>unique(observations.map(row=>row.development?.[field]).filter(positiveInteger)).length>1);
  return {
    notice:rankingPolicy?.summary||developmentRankingNotice,rankingPolicy,ranges,
    importedVariantCount:Array.isArray(collection?.variantIds)?collection.variantIds.length:null,
    missingCount:observations.filter(row=>!positiveInteger(row.development?.level)||!positiveInteger(row.development?.power)).length,
    caution:differs?'Captured levels or stars differ. A less-developed build may be a weak point even when its mechanics fit, but these differences are not a battle-strength estimate.':'Captured power alone does not establish which champion is stronger for this battle.',
    sourceRefs:unique([...observations.map(row=>row.development?.provenanceRef),...(rankingPolicy?.sourceRefs||[])].filter(Boolean)),
  };
}

export function capturedDevelopmentMarkup(champion) {
  const row = capturedDevelopment(champion);
  if (!row) return '<p class="captured-development subtle-note">Captured level and power unavailable for this exact variant.</p>';
  const label = row.captureDate?`Captured ${row.captureDate}${row.reviewCompletedDate&&row.reviewCompletedDate!==row.captureDate?`; reviewed ${row.reviewCompletedDate}`:''}`:`Reviewed ${row.reviewCompletedDate}; capture date not recorded`;
  return `<div class="captured-development"><p><strong>Captured build:</strong> Level ${row.level==null?'unknown':number(row.level)} · ${row.stars==null?'Stars unknown':number(row.stars)+' stars'} · Power ${row.power==null?'unknown':number(row.power)}</p><details class="development-sources"><summary>${esc(label)} · Not live</summary><p>Source ${esc(row.provenanceRef)} · ${esc(row.sourceFilenames.join(', '))}</p>${row.issues.length?`<p>${esc(row.issues.join(' '))}</p>`:''}</details></div>`;
}

export function developmentNoticeMarkup(summary) {
  const ranges = summary.ranges.map(row=>`Captured ${row.field} ${row.min===row.max?number(row.min):number(row.min)+' to '+number(row.max)} (${row.known}/${row.total} members recorded).`).join(' ');
  const policy = summary.rankingPolicy;
  const title = policy?.suppliedLineupKeptExact?'Fixed lineup.':policy?.active?'Mode-specific ranking.':policy?'Ranking limits.':'Development is not ranked.';
  return `<aside class="development-notice">${summary.importedVariantCount!=null?`<p><strong>Partial collection coverage:</strong> ${summary.importedVariantCount} imported exact variants. These options are provisional; missing champions or ability details can change them. Full-roster coverage is not established.</p>`:''}<p><strong>${title}</strong> ${esc(summary.notice)}</p>${ranges?`<p>${esc(ranges)} ${esc(summary.caution)}</p>`:''}${summary.missingCount?`<p>Level or power is unverified for ${summary.missingCount} member${summary.missingCount===1?'':'s'}; missing values are not zero.</p>`:''}<p class="subtle-note">Power reflects the captured build, including equipped gear. Moving legendary gear or changing skills, traits or iconic items can change it. These dated snapshots do not assume gear stays equipped or plan its allocation across teams. Check the battle's current builds in the game.</p>${policy?.limitations?.length?`<details class="development-sources"><summary>Ranking limits</summary>${policy.scoreMeaning?`<p>${esc(policy.scoreMeaning)}</p>`:''}<ul>${policy.limitations.map(text=>`<li>${esc(text)}</li>`).join('')}</ul></details>`:''}</aside>`;
}
