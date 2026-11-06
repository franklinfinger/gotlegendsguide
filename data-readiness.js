import { validateRequiredRows } from './data-validation.js';
import { getGuideData, getStrategyData } from './supabase-client.js';

export const resumeHelp = 'Check your connection, then retry. A paused project, an offline connection, or a service failure can look the same here; this app cannot confirm a pause or resume Supabase. If needed, open the Supabase dashboard, select got-legends-guide (project tstpqjungenftjukoqbu), and resume it if the dashboard says it is paused. Then retry here.';

/** @typedef {{loadedAt:string,guideVersion:string,strategyVersion:string|null}} LastSuccess */
/** @typedef {{status:'loading'|'ready'|'unavailable',guide:import('./supabase-client.js').GuideData|null,strategy:import('./supabase-client.js').StrategyData|null,lastSuccess:LastSuccess|null,error:string}} ReadinessState */
/** Fresh, all-or-nothing page loads. Keep only last-success metadata, never stale advice.
 * @param {{guide?:typeof getGuideData,strategy?:typeof getStrategyData,now?:()=>string,onChange?:(state:ReadinessState)=>void}} options
 */
export function createDataReadiness({ guide = getGuideData, strategy = getStrategyData, now = () => new Date().toISOString(), onChange = () => {} } = {}) {
  let generation = 0;
  /** @type {LastSuccess|null} */
  let lastSuccess = null;
  /** @type {ReadinessState} */
  let current = { status: 'loading', guide: null, strategy: null, lastSuccess, error: '' };
  /** @param {ReadinessState} value */
  const publish = value => { current = value; onChange(current); };
  return {
    get state() { return current; },
    async load(requireStrategy = true) {
      const request = ++generation;
      publish({ status: 'loading', guide: null, strategy: null, lastSuccess, error: '' });
      try {
        const [guideData, strategyData] = await Promise.all([guide(), requireStrategy ? strategy() : Promise.resolve(null)]);
        validateReadyData(guideData, strategyData, requireStrategy);
        if (request !== generation) return current;
        lastSuccess = { loadedAt: now(), guideVersion: guideData.version, strategyVersion: strategyData?.version || null };
        publish({ status: 'ready', guide: guideData, strategy: strategyData, lastSuccess, error: '' });
      } catch (error) {
        if (request !== generation) return current;
        publish({ status: 'unavailable', guide: null, strategy: null, lastSuccess, error: error instanceof Error ? error.message : 'Required data could not be loaded.' });
      }
      return current;
    }
  };
}

/** Validate the fresh base read model before applying any reviewed overlay.
 * @param {import('./supabase-client.js').GuideData} guideData
 * @param {import('./supabase-client.js').StrategyData|null} strategyData
 * @param {boolean} requireStrategy
 */
export function validateReadyData(guideData, strategyData, requireStrategy = true) {
  if (!guideData.champions?.length || !guideData.abilities?.length || !guideData.version?.trim()) throw new Error('The champion catalog is empty or missing required data.');
  if (!guideData.factionActivations?.length || !guideData.allyGems?.length) throw new Error('Required Raid synergy data is empty or missing.');
  if (requireStrategy && (!strategyData?.targets?.length || !strategyData?.rules?.length || !strategyData?.championFacts?.length || !strategyData?.version?.trim())) throw new Error('The strategy catalog is empty or missing required data.');
  validateRequiredRows(guideData, strategyData);
}

/** @param {unknown} value */
const escapeText = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char] || char));

/** @param {ReadinessState} state */
export function readinessMarkup(state) {
  const last = state.lastSuccess;
  const metadata = last ? `Loaded ${escapeText(new Date(last.loadedAt).toLocaleString())} · Guide ${escapeText(last.guideVersion)}${last.strategyVersion ? ` · Strategy ${escapeText(last.strategyVersion)}` : ''}` : '';
  const saved = state.guide?.privateCollection;
  const roster = saved ? `<span>Private saved collection: ${saved.ownedVariantIds.length} owned exact variants; evidence revision ${saved.evidenceRevision}, captured ${escapeText(state.guide?.verifiedCollection?.captureDate)}. Restored on this device from your account; not live game progression.</span>` : state.guide?.verifiedCollection ? `<span>Personal collection: ${state.guide.verifiedCollection.variantIds.length} exact variants captured ${escapeText(state.guide.verifiedCollection.captureDate)}. Local page only; not live ownership or progression.</span>` : '<span>Personal roster: not yet imported. Catalog guidance is not a check of your owned champions or items.</span>';
  const definitions=state.guide?.verifiedCollection?.audit?.effectDefinitionUpdates;
  const evidenceLimit=saved?.latestEvidenceOnly?'<span>Skills, traits and iconic items use only your latest saved evidence. Missing or incomplete details remain unavailable; older catalog records are not substituted. Ability review and battle modeling are still incomplete.</span>':'';
  const coverage=definitions?`<span>${saved ? 'Saved' : 'Local'} definition evidence: ${definitions.uniqueDefinitions} unique complete tooltips from ${definitions.tooltipSources} screenshots; ${definitions.duplicateSourcesRetained} repeat sources retained; ${definitions.traitExcerpts} partial trait excerpts. Reference evidence only, not complete battle-model coverage.</span>`:'';
  if (state.status === 'ready') return `<strong>${saved?.latestEvidenceOnly?'Saved evidence loaded · review incomplete':'Game data ready'}</strong><span>${metadata}</span>${roster}${evidenceLimit}${coverage}<button type="button" data-retry>Refresh data</button>`;
  if (state.status === 'loading') return '<strong>Checking required game data…</strong><span>Advice is unavailable until the required catalog and battle data finish loading.</span>';
  return `<strong>Game data unavailable — advice blocked</strong><span>${escapeText(state.error)}</span>${last ? `<span>Last successful load (stale; not used for advice): ${metadata}</span>` : '<span>No successful load in this session.</span>'}<details><summary>Connection or manual resume help</summary><p>${escapeText(resumeHelp)}</p><a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">Open Supabase dashboard</a></details>${roster}<button type="button" data-retry>Retry data</button>`;
}
