// Local browser exercise with real SDK + mocked localhost HTTP API only.
// Never points at Supabase production, and uses no real user or token.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright-core';
const dist = path.resolve(import.meta.dirname, '../dist');
const server = http.createServer(async (request, response) => {
  const name = request.url === '/' ? 'index.html' : request.url.slice(1);
  if (!['index.html','app.js','config.js','style.css'].includes(name)) { response.writeHead(404); response.end(); return; }
  response.setHeader('Content-Type', name.endsWith('.html') ? 'text/html' : name.endsWith('.css') ? 'text/css' : 'text/javascript');
  response.end(await fs.readFile(path.join(dist, name)));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const user = { id: '11111111-1111-4111-8111-111111111111', email: 'owner@example.test', is_anonymous: false, aud: 'authenticated', role: 'authenticated' };
const token = `e30.${Buffer.from(JSON.stringify({ sub: user.id, role: 'authenticated', exp: Math.floor(Date.now()/1000)+3600 })).toString('base64url')}.not-a-real-signature`;
const owned = new Set(); const variants = new Map(); const calls = []; const errors = []; let denyOwner = false; let failSave = false;
async function routeContext(context, enabled) {
  await context.route('**/*', async route => {
    const request = route.request(); const url = new URL(request.url());
    if (url.origin === origin) {
      if (url.pathname === '/config.js' && enabled) return route.fulfill({ contentType: 'text/javascript', body: 'globalThis.GOT_PRIVATE_CONFIG = '+JSON.stringify({ enabled:true, url:'http://127.0.0.1:54321', publishableKey:'sb_publishable_mock' }) });
      return route.continue();
    }
    if (url.origin !== 'http://127.0.0.1:54321') { errors.push(`Unexpected external request: ${url.origin}`); return route.abort(); }
    calls.push({ path: url.pathname, method: request.method() });
    const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS', 'Content-Type': 'application/json' };
    if (request.method() === 'OPTIONS') return route.fulfill({ status:204, headers, body:'' });
    const send = (body, status = 200) => route.fulfill({ status, headers, body: JSON.stringify(body) });
    if (url.pathname === '/auth/v1/token') return send({ access_token:token, refresh_token:'mock-refresh-only', expires_in:3600, expires_at:Math.floor(Date.now()/1000)+3600, token_type:'bearer', user });
    if (url.pathname === '/auth/v1/user') return send(user);
    if (url.pathname === '/auth/v1/logout') return send({});
    if (url.pathname === '/rest/v1/got_owner_access') return send(denyOwner ? null : { user_id:user.id });
    if (url.pathname === '/rest/v1/got_owner_evidence') return send(null);
    if (url.pathname === '/rest/v1/got_owner_variants') { if (request.method() === 'POST') { const value=request.postDataJSON(); variants.set(value.variant_id,value); return send(null,201); } return send([...variants.values()]); }
    if (url.pathname === '/rest/v1/rpc/got_guide_data') return send({ champions:[{id:'v1', name:'Arya Stark', gemColor:'Blue', rarity:'Legendary'},{id:'v2', name:'Jon Snow', gemColor:'Red', rarity:'Legendary'}] });
    if (url.pathname === '/rest/v1/got_owner_roster') {
      if (request.method() === 'POST') {
        if (failSave) return send({ code:'offline', message:'Mock failure' }, 503);
        owned.add(request.postDataJSON().variant_id); return send(null, 201);
      }
      if (request.method() === 'DELETE') { owned.delete(url.searchParams.get('variant_id')?.replace(/^eq\./,'')); return send(null); }
      const variant = url.searchParams.get('variant_id')?.replace(/^eq\./,'');
      return send(variant ? (owned.has(variant) ? {variant_id:variant} : null) : [...owned].map(variant_id => ({ variant_id })));
    }
    errors.push('Unexpected local API: '+url.pathname); return send({}, 404);
  });
}
async function signedInPage(context) {
  const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
  await page.goto(origin);
  await page.getByLabel('Email', { exact:true }).fill('owner@example.test');
  await page.getByLabel('Password', { exact:true }).fill('mock-password-only');
  await page.getByRole('button', {name:'Sign in', exact:true}).click();
  await page.getByRole('heading', {name:'My champions'}).waitFor(); return page;
}
try {
  const disabled = await browser.newContext({viewport:{width:390,height:844}}); await routeContext(disabled, false);
  const disabledPage = await disabled.newPage(); await disabledPage.goto(origin);
  await disabledPage.getByText('Private access preview is disabled.').waitFor();
  assert.equal(calls.length, 0, 'disabled UI must not contact API');
  await disabledPage.screenshot({path:'/tmp/got-private-preview-disabled.png',fullPage:true});
  await disabled.close();
  const deviceA = await browser.newContext({viewport:{width:390,height:844}}); await routeContext(deviceA,true);
  const a = await signedInPage(deviceA);
  assert.equal(await a.locator('body').evaluate(el => el.scrollWidth > innerWidth), false, 'mobile layout must not overflow');
  await a.getByLabel('Arya Stark · Blue · Legendary').check();
  await a.getByText('Saved. This change will be available on your other devices when they refresh.').waitFor();
  assert.equal(owned.has('v1'), true);
  await a.reload(); await a.getByRole('heading',{name:'My champions'}).waitFor();
  assert.equal(await a.getByLabel('Arya Stark · Blue · Legendary').isChecked(), true);
  assert.equal(calls.filter(row => row.path === '/auth/v1/token').length, 1, 'reload restores session without password login');
  const deviceB = await browser.newContext({viewport:{width:1200,height:900}}); await routeContext(deviceB,true);
  const b = await signedInPage(deviceB);
  assert.equal(await b.getByLabel('Arya Stark · Blue · Legendary').isChecked(),true,'second simulated device reads saved collection');
  failSave = true;
  await b.getByLabel('Jon Snow · Red · Legendary').check();
  await b.getByText('Could not confirm this change. Refresh before trying again.').waitFor();
  assert.equal(await b.getByRole('checkbox').count(),0,'failed save clears private rows');
  assert.equal(owned.has('v2'),false); failSave = false;
  await b.getByRole('button',{name:'Try again'}).click(); await b.getByRole('heading',{name:'My champions'}).waitFor();
  await a.screenshot({path:'/tmp/got-private-preview-collection-mobile.png',fullPage:true});
  await a.getByRole('button',{name:'Sign out on this device'}).click();
  await a.getByRole('button',{name:'Sign in',exact:true}).waitFor();
  assert.equal(await a.getByRole('checkbox').count(),0,'private state is cleared on sign out');
  await a.reload(); await a.getByRole('button',{name:'Sign in',exact:true}).waitFor();
  await b.reload(); await b.getByRole('heading',{name:'My champions'}).waitFor();
  denyOwner = true;
  await b.getByRole('button',{name:'Refresh from saved collection'}).click();
  await b.getByText('This account does not have access.').waitFor();
  assert.equal(await b.getByRole('checkbox').count(),0,'revoked owner cannot see stale collection');
  assert.deepEqual(errors,[]);
  console.log('Browser smoke passed: disabled/no network, mobile layout, password login, saved session reload, two simulated devices, failed save, local sign-out, owner revocation. No hosted requests.');
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
