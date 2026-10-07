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

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (entry.isFile() && /\.(html|js|json|css)$/.test(entry.name)) {
    fs.copyFileSync(path.join(root, entry.name), path.join(out, entry.name));
  }
}
const assets = path.join(root, 'assets');
if (fs.existsSync(assets)) fs.cpSync(assets, path.join(out, 'assets'), { recursive: true });
const config = {
  url: env.NEXT_PUBLIC_SUPABASE_URL || '',
  publishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
};
fs.writeFileSync(path.join(out, 'supabase-config.js'),
  `globalThis.GOT_SUPABASE_CONFIG = ${JSON.stringify(config)};\n`);
console.log(`Static build complete: ${fs.readdirSync(out).length} files. Supabase config ${config.url && config.publishableKey ? 'present' : 'missing'}.`);
