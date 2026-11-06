import { effectSpecFor } from './effect-definition-status.js';
// Pure escaped presentation for private, user-selected tooltip evidence.
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function tooltipEvidenceMarkup(row) {
  return `<p class="subtle-note">${row.evidenceKind==='trait_excerpt'?'Partial trait excerpt':'Complete tooltip'}, reviewed ${esc(row.reviewCompletedDate)}. Sources: ${esc((row.sourceFilenames||[]).join(', '))}. Reference only; no automatic strategy score.</p>${row.excerptNote?`<p class="subtle-note">Excerpt boundary: ${esc(row.excerptNote)}</p>`:''}${row.contextNote?`<p class="subtle-note">Source context: ${esc(row.contextNote)}</p>`:''}${row.remainingRules?.length?`<p>Separate rule questions, not a request to recapture this tooltip: ${esc(row.remainingRules.join(' '))}</p>`:''}${row.historicalDefinitions?.length?`<details><summary>Earlier catalog evidence, retained separately</summary>${row.historicalDefinitions.map(old=>`<p>${esc(old.name)}: ${esc(old.text)}</p><p class="subtle-note">Historical source: ${esc(old.provenanceRef||old.provenance||(old.id?'catalog:'+old.id:'unavailable'))}. Not newly verified by these screenshots. No older values are blended into the new definition.</p>`).join('')}</details>`:''}${row.scopeState==='standalone_reference'?'<p class="subtle-note">Standalone definition. No exact captured variant or ownership is inferred.</p>':''}`;
}
export function effectCoverageMarkup(rows=[]) {
  if (!rows.length) return '';
  return `<details><summary>Mechanics coverage · definitions and remaining rule questions</summary><ul>${rows.map(row=>`<li><strong>${esc(row.effectName)}: ${esc(row.definitionState.replaceAll('_',' '))}</strong><p>${row.definitionState==='captured_definition'?'Tooltip (verbatim)':'Known'}: ${esc(row.known)}</p>${row.definitionState==='captured_definition'?tooltipEvidenceMarkup(row):`<p>Unresolved: ${esc(row.unresolved)}</p>`}${row.referenceOnly?'<p class="subtle-note">Referenced inside another definition. This does not establish a champion ability application or define the referenced mechanic.</p>':''}</li>`).join('')}</ul></details>`;
}
export function tooltipGlossaryEntries(snapshot) {
  const definitions=snapshot.verifiedCollection?.effectDefinitionUpdates||[];
  const excerpts=snapshot.verifiedCollection?.effectDefinitionExcerpts||[];
  const normalize=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const historical=[...(snapshot.statuses||[]),...(snapshot.mechanics||[])];
  const matches=(definition,row)=>[normalize(definition.effectName),normalize(definition.title)].includes(normalize(row.name))||effectSpecFor(row.name)?.effectName===definition.effectName;
  const base=[...(snapshot.statuses||[]).map(row=>({...row,group:'Status'})),...(snapshot.mechanics||[]).map(row=>({...row,group:'Mechanic'}))].filter(row=>!definitions.some(definition=>matches(definition,row)));
  return [...definitions.map(row=>({name:row.title,text:row.text,group:'Local tooltip',reviewStatus:row.reviewStatus,tooltip:{...row,historicalDefinitions:historical.filter(old=>matches(row,old))}})),...excerpts.map(row=>({name:row.title,text:row.text,group:'Local trait excerpt',reviewStatus:'partial',tooltip:row})),...base];
}
