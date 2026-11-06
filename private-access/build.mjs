import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import { validateConfiguration } from './src/client.js';
const root = import.meta.dirname;
const out = path.join(root, 'dist');
const config = {
  enabled: process.env.GOT_PRIVATE_ENABLED === 'true',
  url: process.env.GOT_PRIVATE_SUPABASE_URL || '',
  publishableKey: process.env.GOT_PRIVATE_PUBLISHABLE_KEY || '',
  allowHosted: process.env.GOT_PRIVATE_ALLOW_HOSTED === 'true',
};
validateConfiguration(config);
fs.mkdirSync(out, { recursive: true });
for (const file of ['index.html', 'style.css']) fs.copyFileSync(path.join(root, file), path.join(out, file));
fs.writeFileSync(path.join(out, 'config.js'), `globalThis.GOT_PRIVATE_CONFIG = ${JSON.stringify(config.enabled ? config : { enabled: false })};\n`);
await build({ entryPoints: [path.join(root, 'src/app.js')], outfile: path.join(out, 'app.js'), bundle: true, format: 'esm', platform: 'browser', target: ['es2022'], minify: true, sourcemap: false });
console.log(`Isolated preview built. Private access ${config.enabled ? 'enabled' : 'disabled'}. No hosted settings changed.`);
