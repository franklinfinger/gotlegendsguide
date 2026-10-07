import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=path.resolve(import.meta.dirname,'..');
const env={...process.env};
const local=path.join(root,'.env.local');
if(fs.existsSync(local)) for(const line of fs.readFileSync(local,'utf8').split(/\r?\n/)) {
  const match=line.match(/^([A-Z_]+)=(.*)$/);
  if(match && !env[match[1]]) env[match[1]]=match[2];
}
const url=env.NEXT_PUBLIC_SUPABASE_URL;
const key=env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
assert.ok(url && key,'Publishable Supabase configuration is required.');
const endpoint=`${url.replace(/\/$/,'')}/rest/v1/player_roster`;
const headers={apikey:key,Accept:'application/json'};
const read=await fetch(`${endpoint}?select=variant_id&limit=1`,{headers});
assert.ok([200,401,403].includes(read.status),`Unexpected anonymous read status ${read.status}`);
if(read.ok) assert.deepEqual(await read.json(),[],'Anonymous access exposed private roster rows.');
const write=await fetch(endpoint,{method:'POST',headers:{...headers,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({user_id:'00000000-0000-4000-8000-000000000a51',variant_id:'sqlite-champion-48',owned:true})});
assert.ok([401,403].includes(write.status),`Anonymous roster write unexpectedly returned ${write.status}`);
console.log(`Anonymous roster access blocked: read ${read.status}, write ${write.status}.`);
