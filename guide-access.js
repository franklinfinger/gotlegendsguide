/** @typedef {{enabled?:boolean}} PrivateSwitch */
/** @typedef {{anchor:HTMLElement,content?:HTMLElement|null,requiresStrategy:boolean,onClear:()=>void,onReady:(result:{guide:import('./supabase-client.js').GuideData,strategy:import('./supabase-client.js').StrategyData|null})=>void}} GuideMount */
const runtimePath = './private-guide-runtime.js';
/** Fail closed on an enabled build. Never fall through to public RPCs on error.
 * The SDK/runtime chunk is emitted and loaded only for an explicitly enabled build.
 * @param {GuideMount} options
 * @param {{config?:PrivateSwitch,loadRuntime?:()=>Promise<any>}} dependencies
 */
export async function mountPrivateGuideIfEnabled(options, {config = /** @type {typeof globalThis & {GOT_PRIVATE_CONFIG?:PrivateSwitch}} */(globalThis).GOT_PRIVATE_CONFIG, loadRuntime = () => import(runtimePath)} = {}) {
  if (config?.enabled !== true) return false;
  options.onClear();
  if(options.content) options.content.replaceChildren();
  options.anchor.hidden=false;
  options.anchor.textContent='Checking private sign-in…';
  try {
    const runtime=await loadRuntime();
    await runtime.mountPrivateGuide({...options,config});
  } catch (error) {
    options.onClear();
    if(options.content) options.content.replaceChildren();
    options.anchor.className='data-readiness data-unavailable';
    options.anchor.textContent='Private guide unavailable. '+(error instanceof Error ? error.message : 'Private access could not be verified.')+' No public fallback was loaded.';
  }
  return true;
}
