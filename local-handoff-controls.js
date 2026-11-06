import { integrateVerifiedHandoff } from './verified-handoff.js';
import { catalogIdentities } from './champion-identities.js';

export const isLocalHandoffHost = hostname => ['localhost','127.0.0.1','[::1]','::1'].includes(hostname);

/** Explicit file selection only, in loopback development sessions. No storage,
 * upload, URL import or automatic inference from a file elsewhere on disk. */
export function mountLocalHandoffControls({anchor, guideData, strategyData, onApply, onReset, hostname=location.hostname}) {
  if (!isLocalHandoffHost(hostname) || !guideData) return () => {};
  const panel = document.createElement('details');
  panel.className = 'local-handoff-controls';
  panel.innerHTML = '<summary>Local screenshot handoff</summary><p>Select a reviewed JSON handoff to view captured builds and current abilities on this page. On strategy pages, recommendations are limited to the captured champions. The file stays in this page’s memory and is cleared by navigation or refresh. Nothing is uploaded or saved.</p><label>Reviewed handoff JSON <input type="file" accept=".json,application/json"></label><button type="button">Clear handoff</button><p role="status" aria-live="polite">No handoff selected. Catalog guidance remains active.</p>';
  anchor.after(panel);
  const input = panel.querySelector('input'), clear = panel.querySelector('button'), status = panel.querySelector('[role="status"]');
  let generation = 0;
  const reset = () => { generation++; input.value=''; onReset(); status.textContent='Handoff cleared. Catalog guidance is active.'; };
  clear.addEventListener('click', reset);
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    const request = ++generation;
    onReset();
    status.textContent = 'Reading the selected handoff. Catalog guidance remains active until validation succeeds.';
    try {
      if (file.size > 5 * 1024 * 1024) throw Error('The handoff exceeds the 5 MB local import limit.');
      const text = await file.text();
      if (request !== generation) return;
      const result = integrateVerifiedHandoff({handoff:JSON.parse(text),guideData,strategyData,identities:catalogIdentities});
      onApply(result);
      const groups = result.guideData.verifiedCollection.variantIds.length;
      status.textContent = `${groups} exact variants from ${result.audit.captureDate} are active for this page. ${result.audit.duplicates.length} declared duplicate capture(s) merged; ${result.audit.missingSkills.length} missing skill panel(s); ${result.audit.extractionIssues.length} parsing or clipped-wording warning(s); ${result.audit.effectDefinitionUpdates.uniqueDefinitions} unique complete tooltip definition(s) from ${result.audit.effectDefinitionUpdates.tooltipSources} screenshots, ${result.audit.effectDefinitionUpdates.duplicateSourcesRetained} repeat source(s) retained, ${result.audit.effectDefinitionUpdates.traitExcerpts} partial trait excerpt(s); ${result.audit.effectDefinitionUpdates.standalone.length} standalone without a captured variant. Locked previews are excluded. Item effects still require explicit enablement. Ownership and progression are not live.`;
    } catch (error) {
      if (request !== generation) return;
      onReset();
      status.textContent = 'Import not applied: ' + (error instanceof Error ? error.message : 'Invalid handoff.') + ' Catalog guidance is active.';
    }
  });
  return () => { generation++; panel.remove(); };
}
