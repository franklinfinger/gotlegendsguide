// Real Chromium, real pinned SDK, local HTTP with wholly synthetic Auth responses.
// No real email, production network, password, or user session is used.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {chromium} from 'playwright-core';
const dist=path.resolve(import.meta.dirname,'../../dist');
const server=http.createServer(async(req,res)=>{const url=new URL(req.url,'http://localhost');const file=url.pathname==='/'?'index.html':url.pathname.slice(1);if(!/^[\w./-]+$/.test(file)||file.includes('..')){res.writeHead(404);res.end();return;}try{res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'text/javascript');res.end(await fs.readFile(path.join(dist,file)));}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const user={id:'11111111-1111-4111-8111-111111111111',email:'owner@example.test',aud:'authenticated',role:'authenticated',is_anonymous:false};
const token=`e30.${Buffer.from(JSON.stringify({sub:user.id,role:user.role,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.synthetic`;
const calls=[],errors=[];let expired=false,denyOwner=false,weak=false;
async function context(){const ctx=await browser.newContext({viewport:{width:390,height:844}});await ctx.route('**/*',async route=>{const r=route.request(),url=new URL(r.url());if(url.origin===origin)return route.continue();if(url.origin!=='http://127.0.0.1:54321'){errors.push(`Unexpected network ${url.origin}`);return route.abort();}calls.push({path:url.pathname,method:r.method(),query:url.search,body:r.postDataJSON()});const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS','Content-Type':'application/json'};const send=(body,status=200)=>route.fulfill({status,headers,body:JSON.stringify(body)});if(r.method()==='OPTIONS')return route.fulfill({status:204,headers,body:''});if(url.pathname==='/auth/v1/recover')return send({});if(url.pathname==='/auth/v1/token'){assert.equal(url.searchParams.get('grant_type'),'pkce');assert.ok(r.postDataJSON().code_verifier);return expired?send({code:'otp_expired',message:'expired'},403):send({access_token:token,refresh_token:'synthetic_refresh',expires_in:3600,token_type:'bearer',user});}if(url.pathname==='/auth/v1/user')return weak&&r.method()==='PUT'?send({code:'weak_password',message:'synthetic policy'},422):send(user);if(url.pathname==='/auth/v1/logout')return send({});if(url.pathname==='/rest/v1/got_owner_access')return send(denyOwner?null:{user_id:user.id});errors.push(`Unexpected private read ${url.pathname}`);return send({},403);});return ctx;}
async function requestLink(page){await page.goto(origin);await page.getByRole('button',{name:'Set or reset password',exact:true}).click();await page.getByLabel('App account email').fill(user.email);await page.getByRole('button',{name:'Email password link',exact:true}).click();await page.getByText(/If this email has an account/).waitFor();const call=calls.findLast(row=>row.path.endsWith('/recover'));assert.equal(new URLSearchParams(call.query).get('redirect_to'),`${origin}/?password=recovery`);assert.equal(call.body.code_challenge_method,'s256');assert.ok(call.body.code_challenge);}
try{
 const a=await context(),page=await a.newPage();page.on('pageerror',e=>errors.push(e.message));
 await requestLink(page);await page.screenshot({path:'/tmp/got-password-request-mobile.png',fullPage:true});
 await page.goto(`${origin}/?password=recovery&code=synthetic_code`);await page.getByRole('heading',{name:'Choose your password'}).waitFor();
 assert.equal(new URL(page.url()).search,'?password=recovery');assert.equal(calls.some(r=>r.path.includes('/rpc/')),false);
 await page.getByLabel('New password',{exact:true}).fill('Synthetic_secret_123!');await page.getByLabel('Confirm new password').fill('different_password');await page.getByRole('button',{name:'Save new password'}).click();await page.getByText('The two passwords do not match.').waitFor();assert.equal(calls.some(r=>r.method==='PUT'),false);
 await page.getByLabel('Confirm new password').fill('Synthetic_secret_123!');weak=true;await page.getByRole('button',{name:'Save new password'}).click();await page.getByText(/does not meet the account security requirements/).waitFor();assert.equal(await page.getByLabel('New password',{exact:true}).inputValue(),'');
 weak=false;await page.getByLabel('New password',{exact:true}).fill('Synthetic_secret_123!');await page.getByLabel('Confirm new password').fill('Synthetic_secret_123!');await page.screenshot({path:'/tmp/got-password-choose-mobile.png',fullPage:true});await page.getByRole('button',{name:'Save new password'}).click();await page.getByRole('button',{name:'Sign in',exact:true}).waitFor();assert.equal(await page.locator('input[type=password]').inputValue(),'');
 assert.equal(calls.filter(r=>r.method==='PUT').length,2);assert.equal(calls.filter(r=>r.path.endsWith('/recover')).length,1);
 // Reused link and same marker without code may never unlock a password form.
 await page.goto(`${origin}/?password=recovery&code=used_code`);await page.getByText(/This password link is expired/).waitFor();assert.equal(await page.getByRole('button',{name:'Save new password'}).count(),0);
 await page.goto(`${origin}/?password=recovery`);await page.getByText(/This password link is expired/).waitFor();
 // A new browser lacks the verifier, even if another browser requested the email.
 const b=await context(),other=await b.newPage();await other.goto(`${origin}/?password=recovery&code=synthetic_other_device`);await other.getByText(/different browser/).waitFor();assert.equal(await other.getByRole('button',{name:'Save new password'}).count(),0);await b.close();
 // Expired server code and a valid non-owner session both fail closed.
 for(const scenario of ['expired','nonowner']){const c=await context(),p=await c.newPage();await requestLink(p);expired=scenario==='expired';denyOwner=scenario==='nonowner';await p.goto(`${origin}/?password=recovery&code=synthetic_bad`);await p.getByRole('heading',{name:'Set or reset your password'}).waitFor();assert.equal(await p.getByRole('button',{name:'Save new password'}).count(),0);await c.close();expired=false;denyOwner=false;}
 assert.deepEqual(errors,[]);await a.close();
 console.log('PASS: real SDK PKCE request/exchange, callback scrubbing, owner check, mismatch, weak password, update, local signout, replay, missing code, cross-browser and expired/nonowner rejection. No guide RPC or hosted network; no real email or credentials.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
