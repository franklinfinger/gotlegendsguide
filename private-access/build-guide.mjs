import path from 'node:path';
import { build } from 'esbuild';
import { validateConfiguration } from './src/client.js';
// Invoked by the main static builder only for an explicitly enabled private build.
export async function buildPrivateGuide(out, config) {
  validateConfiguration(config);
  await build({entryPoints:{'private-guide-runtime':path.join(import.meta.dirname,'src/guide-entry.js'),guide:path.join(import.meta.dirname,'../guide.js'),health:path.join(import.meta.dirname,'../health.js')},outdir:out,bundle:true,format:'esm',platform:'browser',target:['es2022'],minify:true,sourcemap:false});
}
