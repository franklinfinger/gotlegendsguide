import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {createOwnerStore,OWNER_TABLE,ROSTER_TABLE,EVIDENCE_TABLE,VARIANT_TABLE} from '../src/client.js';
import {prepareEvidenceSnapshot} from '../src/evidence.js';
import {gameFixture} from './fixtures/game.mjs';

test('real pinned SDK restores saved session and sends bearer auth on every guide/collection RPC without OTP',async()=>{
  const fixture=gameFixture(),snapshot=prepareEvidenceSnapshot({handoff:fixture.handoff,guideData:fixture.guide}).snapshot;
  const calls=[],storageRows=new Map(),clients=[];
  const user={id:'00000000-0000-4000-8000-000000000001',aud:'authenticated',role:'authenticated',email:'owner@example.test',is_anonymous:false};
  const token='synthetic_owner_access_token';
  const storage={getItem:key=>storageRows.get(key)||null,setItem:(key,value)=>storageRows.set(key,value),removeItem:key=>storageRows.delete(key)};
  const mockFetch=async(input,options={})=>{
    const url=new URL(String(input)),headers=new Headers(options.headers);calls.push({path:url.pathname,query:url.search,authorization:headers.get('authorization')});
    let data;
    if(url.pathname==='/auth/v1/token'){
      assert.equal(url.searchParams.get('grant_type'),'password');
      assert.deepEqual(JSON.parse(options.body),{email:user.email,password:'synthetic_password_only',gotrue_meta_security:{}});
      data={access_token:token,refresh_token:'synthetic_refresh_token',expires_in:3600,token_type:'bearer',user};
    }else{
      assert.equal(headers.get('authorization'),`Bearer ${token}`,'no anonymous fallback transport');
      if(url.pathname==='/auth/v1/user')data=user;
      else if(url.pathname.endsWith('/rpc/got_guide_data'))data=fixture.guide;
      else if(url.pathname.endsWith('/rpc/got_raid_synergy_data'))data=fixture.synergy;
      else if(url.pathname.endsWith('/rpc/got_strategy_data'))data=fixture.strategy;
      else if(url.pathname.endsWith('/'+OWNER_TABLE))data=[{user_id:user.id}];
      else if(url.pathname.endsWith('/'+ROSTER_TABLE))data=Array.from({length:6},(_,i)=>({variant_id:`v${i}`}));
      else if(url.pathname.endsWith('/'+EVIDENCE_TABLE))data=[{revision:1,payload:snapshot}];
      else if(url.pathname.endsWith('/'+VARIANT_TABLE))data=[];
      else throw Error(`Unexpected synthetic endpoint: ${url.pathname}`);
    }
    return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
  };
  const make=()=>createOwnerStore({config:{enabled:true,url:'http://localhost:54321',publishableKey:'sb_publishable_synthetic'},createClient:(url,key,options)=>{const client=createClient(url,key,{...options,auth:{...options.auth,storage},global:{...options.global,fetch:mockFetch}});clients.push(client);return client;}});
  try{
    const one=make();await one.signIn(user.email,'synthetic_password_only');
    const first=await one.readCollection({includeGameData:true,includeStrategy:true});assert.equal(first.evidenceRevision,1);
    assert.ok(storageRows.size,'SDK saved the synthetic session');
    const two=make();const restored=await two.readCollection({includeGameData:true,includeStrategy:true});
    assert.deepEqual(restored.guideData,first.guideData);assert.deepEqual(restored.strategyData,first.strategyData);
    assert.equal(calls.filter(row=>row.path==='/auth/v1/token').length,1,'fresh page restores saved session without another login');
    assert.equal(calls.some(row=>/otp|magiclink|verify/.test(row.path)),false);
    for(const endpoint of ['got_guide_data','got_raid_synergy_data','got_strategy_data'])assert.ok(calls.some(row=>row.path.endsWith('/rpc/'+endpoint)));
  }finally{for(const client of clients)await client.auth.stopAutoRefresh();storageRows.clear();}
});
