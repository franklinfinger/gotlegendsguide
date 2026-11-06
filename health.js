import { mountPrivateGuideIfEnabled } from './guide-access.js';
import { createDataReadiness, readinessMarkup } from './data-readiness.js';

const status = document.querySelector('#status');
const readiness = createDataReadiness({ onChange: result => {
  if (!status) return;
  status.className = `data-readiness data-${result.status}`;
  status.innerHTML = readinessMarkup(result);
  status.querySelector('[data-retry]')?.addEventListener('click', () => readiness.load(true));
} });
if (status instanceof HTMLElement && !await mountPrivateGuideIfEnabled({anchor:status,requiresStrategy:true,onClear:()=>{},onReady:()=>{}})) await readiness.load(true);
