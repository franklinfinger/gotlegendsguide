import { createClient } from '@supabase/supabase-js';
import { createOwnerStore } from './client.js';
import { mountOwnerControls } from './controls.js';
import { privateGuideModel } from './guide-model.js';
import { readinessMarkup } from '../../data-readiness.js';

export async function mountPrivateGuide({anchor, content, requiresStrategy, onClear, onReady, config, createStore = createOwnerStore}) {
  const store = createStore({config, createClient});
  if (!store.enabled) throw Error('Private access was requested but the private client is disabled.');
  const panel = document.createElement('details'); panel.className = 'private-access-panel'; panel.open = true;
  const summary = document.createElement('summary'); summary.textContent = 'My saved collection';
  const controls = document.createElement('section');
  const status = document.createElement('p'); status.setAttribute('role','status'); status.setAttribute('aria-live','polite');
  panel.append(summary, status, controls); anchor.after(panel);
  const clearGuide = () => { onClear(); if(content) content.replaceChildren(); anchor.hidden=false; anchor.className='data-readiness data-loading'; anchor.textContent='Private guide locked while access and saved data are checked.'; };
  return mountOwnerControls({root:controls, state:status, store,
    loadCollection:() => store.readCollection({includeGameData:true,includeStrategy:requiresStrategy}),
    onClear:clearGuide,
    onCollection:(collection, {reviewingEvidence = false} = {}) => {
      const model = privateGuideModel(collection);
      if (!model.ready) {clearGuide(); anchor.className='data-readiness data-unavailable';anchor.textContent=model.reason;panel.open=true;return;}
      anchor.className='data-readiness data-ready';
      anchor.innerHTML=readinessMarkup({status:'ready',guide:model.guide,strategy:model.strategy,lastSuccess:{loadedAt:new Date().toISOString(),guideVersion:model.guide.version,strategyVersion:model.strategy?.version||null},error:''});
      // The collection panel owns refresh and session lifecycle in private mode.
      anchor.querySelector('[data-retry]')?.remove();
      onReady({guide:model.guide,strategy:model.strategy});
      panel.open=reviewingEvidence;
    }});
}
