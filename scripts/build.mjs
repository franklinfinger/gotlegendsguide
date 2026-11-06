import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'dist');
const envPath = path.join(root, '.env.local');
const env = { ...process.env };
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match && !env[match[1]]) env[match[1]] = match[2];
  }
}

const privateConfig = env.GOT_PRIVATE_ENABLED === 'true' ? {
  enabled:true,
  url:env.GOT_PRIVATE_SUPABASE_URL || '',
  publishableKey:env.GOT_PRIVATE_PUBLISHABLE_KEY || '',
  allowHosted:env.GOT_PRIVATE_ALLOW_HOSTED === 'true'
} : {enabled:false};
let buildPrivateGuide;
if (privateConfig.enabled) {
  // No SDK dependency or private bundle is needed by the unchanged public build.
  const {validateConfiguration} = await import('../private-access/src/client.js');
  validateConfiguration(privateConfig);
  ({buildPrivateGuide} = await import('../private-access/build-guide.mjs'));
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
if (privateConfig.enabled) {
  // Explicit private output: no old catalog JSON, legacy scripts, third-party
  // script pages, package files, arbitrary root files, or private inputs.
  const pages = new Set(['index.html','recommendations.html','champions.html','items.html','builder.html','raids.html','war.html','dragons.html','factions.html','status-effects.html','strategy.html','health.html']);
  for (const name of [...pages,'guide.css']) fs.copyFileSync(path.join(root,name),path.join(out,name));
  for (const entry of fs.readdirSync(root,{withFileTypes:true})) {
    if (!entry.isFile() || !entry.name.endsWith('.html') || pages.has(entry.name)) continue;
    const candidate=entry.name.replace(/^legacy-/,'');
    const target=pages.has(candidate)?candidate:'index.html';
    // Preserve old HTML URLs without shipping their ungated data or remote scripts.
    fs.writeFileSync(path.join(out,entry.name),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${target}"><title>Open private guide</title></head><body><p><a href="${target}">Open the private guide</a></p></body></html>`);
  }
  const portraits=path.join(root,'assets/champion-portraits');
  if(fs.existsSync(portraits))fs.cpSync(portraits,path.join(out,'assets/champion-portraits'),{recursive:true});
} else {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isFile() && /\.(html|js|json|css)$/.test(entry.name) && !/(?:handoff.*|\.private)\.json$/i.test(entry.name)) {
      fs.copyFileSync(path.join(root, entry.name), path.join(out, entry.name));
    }
  }
  const assets = path.join(root, 'assets');
  if (fs.existsSync(assets)) fs.cpSync(assets, path.join(out, 'assets'), { recursive: true });
}
const config = {
  url: privateConfig.enabled ? '' : env.NEXT_PUBLIC_SUPABASE_URL || '',
  publishableKey: privateConfig.enabled ? '' : env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
};
fs.writeFileSync(path.join(out, 'supabase-config.js'),
  `globalThis.GOT_SUPABASE_CONFIG = ${JSON.stringify(config)};\nglobalThis.GOT_PRIVATE_CONFIG = ${JSON.stringify(privateConfig)};\n`);

if (buildPrivateGuide) await buildPrivateGuide(out, privateConfig);
console.log(`Static build complete: ${fs.readdirSync(out).length} files. Supabase config ${privateConfig.enabled ? 'private' : config.url && config.publishableKey ? 'present' : 'missing'}.`);
console.log(`Private guide mode ${privateConfig.enabled ? 'enabled (requires authorized database and hosting setup)' : 'disabled'}.`);
