const normalize=value=>String(value||'').replace(/\s+/g,' ').trim();
const reference=row=>row.provenanceRef+':'+row.sourceFilenames.join(',');
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

/** Preserve complete captured wording that the bounded planner does not model.
 * These are reference notes, never scoring inputs or promises of activation.
 */
export function capturedPrebattleNotes({guideData,variantIds,leaderVariantId,capabilities=[],itemStates={}}) {
  const selected=new Set(variantIds),owned=new Set(guideData.verifiedCollection?.variantIds||[]);
  return (guideData.verifiedCollection?.records||[]).filter(row=>
    selected.has(row.variantId)&&owned.has(row.variantId)&&row.reviewStatus==='complete'&&typeof row.text==='string'&&normalize(row.text)&&row.provenanceRef&&row.sourceFilenames?.length&&!/…|\.\.\./.test(row.text)&&
    ['skill','trait','item'].includes(row.kind)&&
    (row.context!=='leader'||row.variantId===leaderVariantId)&&
    (row.kind!=='item'||itemStates[row.variantId]==='enabled')&&
    !capabilities.some(cap=>cap.variantId===row.variantId&&cap.sourceMatched&&cap.status==='feasible'&&normalize(cap.source.exactText)===normalize(row.text))
  ).map(row=>({
    variantId:row.variantId,championName:guideData.champions.find(champion=>champion.id===row.variantId)?.name,
    name:row.name,kind:row.kind,context:row.context,text:row.text,sourceRefs:[reference(row)],
    sourceBadgeText:row.sourceBadgeText||(row.sourceBadges||[]).join(' '),
    status:'reference_only',score:0,
    limitation:row.kind==='item'?'Item enabled, but this captured wording is not modeled as a dependable effect here. Rank, level and each trigger must still match.':'Captured wording is not included in planning points. Its stated trigger and conditions still apply; no opening state, self-trigger, repeat rate, stacking, CHARGE percentage or damage forecast is inferred.',
  }));
}

export function prebattleSourceNotesMarkup(result) {
  const notes=result.prebattlePlan?.sourceReferenceNotes||[];
  if(!notes.length)return '';
  return `<details class="evidence-details"><summary>Captured effects outside the scoring model</summary><p>These captured clauses can matter to this lineup, but receive zero planning points. A missing modeled effect is not evidence that the champion lacks it.</p>${notes.map(row=>`<section><h3>${esc(row.championName)} · ${esc(row.name||row.kind)}${row.context==='leader'?' · Selected Leader':''}</h3><p>${esc(row.text)}</p>${row.sourceBadgeText?`<p>Source badge: ${esc(row.sourceBadgeText)}. Trigger-limit semantics are not inferred from the badge alone.</p>`:''}<p>${esc(row.limitation)}</p><p class="subtle-note">${esc(row.sourceRefs.join(' · '))}</p></section>`).join('')}</details>`;
}
