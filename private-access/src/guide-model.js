// One projection for all current guide pages. The saved source envelope is never
// rewritten to express ownership. Only the in-memory candidate pool is narrowed.
export function privateGuideModel(collection) {
  const captured = collection.guideData?.verifiedCollection;
  const owned = new Set(collection.variantIds);
  let reason = '';
  if (!captured || !collection.evidenceRevision) reason = 'Save reviewed screenshot evidence before using your private guide. No catalog-only advice is substituted.';
  else if (collection.recommendationsBlocked) reason = 'Some owned variants have no reviewed evidence in this snapshot. Restore their evidence or review your collection before using the guide.';
  else if (!owned.size) reason = 'Choose your owned variants, or add the captured variants to your collection, before using the private guide.';
  const candidates = (captured?.variantIds || []).filter(id => owned.has(id));
  // Unknown owned IDs must not disappear silently, even with corrupt imported rows.
  if (!reason && [...owned].some(id => !candidates.includes(id))) reason = 'An owned variant is missing from the reviewed evidence. The private guide is blocked until it is reviewed.';
  if (reason) return { ready:false, reason, guide:null, strategy:null };
  // The latest saved evidence is the only ability source for this private view.
  // Keep catalog identities available for exact-name resolution, but never use
  // an unmapped catalog Skill, trait, iconic item, or historical answer fallback.
  // This projection does not modify the saved envelope or public source history.
  const records = captured.records || [];
  const matches = (row, kind, variantId = row.variantId) => records.some(source =>
    source.kind === kind && source.variantId === variantId && source.id === row.id && source.text === row.text);
  const sourceFact = row => records.some(source => source.variantId === row.variantId &&
    row.id?.startsWith(source.id + ':') && row.fullSourceText === source.text && source.sourceFilenames?.length);
  const guide = { ...collection.guideData,
    abilities:collection.guideData.abilities.filter(row => matches(row, 'skill')),
    traits:(collection.guideData.traits || []).filter(row => matches(row, 'trait')),
    items:collection.guideData.items.map(item => ({...item, abilities:item.abilities.filter(row => matches(row, 'item', item.ownerVariantId))})).filter(item => item.abilities.length),
    companions:[], historicalEffectReferences:[], historicalAllyGems:[],
    privateCollection:{saved:true,evidenceRevision:collection.evidenceRevision,ownedVariantIds:[...owned],capturedVariantCount:captured.variantIds.length,latestEvidenceOnly:true},
    verifiedCollection:{...captured, variantIds:candidates} };
  const strategy = collection.strategyData ? {...collection.strategyData,
    championFacts:collection.strategyData.championFacts.filter(row => ['identity','faction'].includes(row.context) || sourceFact(row)),
    rules:collection.strategyData.rules.filter(row => !row.subjectVariantId || sourceFact(row)),
    curatedRecommendations:[]} : null;
  return { ready:true, reason:'', guide, strategy };
}
