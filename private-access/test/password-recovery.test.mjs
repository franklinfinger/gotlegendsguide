import test from 'node:test';
import assert from 'node:assert/strict';
import {createPasswordRecovery, RECOVERY_REDIRECT_URL} from '../src/password-recovery.js';
function fixture({href=RECOVERY_REDIRECT_URL+'&code=synthetic', ownerId='owner', exchangeError=false, redirectType='recovery', updateError=null}={}) {
  const calls=[]; let signedOutError=false, now=0;
  const location={href}, history={replaceState(_state,_title,path){calls.push(['clean',path]);location.href=new URL(path,location.href).href;}};
  const auth={
    async resetPasswordForEmail(email,options){calls.push(['request',email,options]);return {};},
    async exchangeCodeForSession(code,options){calls.push(['exchange',code,options]);return {error:exchangeError?{}:null,data:{session:{},user:{id:'owner'},redirectType}};},
    async signOut(options){calls.push(['logout',options]);return {error:signedOutError?{}:null};},
    async updateUser(input){calls.push(['update',input]);return {error:updateError,data:{user:{id:'owner'}}};},
  };
  const api=createPasswordRecovery({auth,owner:async()=>{calls.push(['owner']);if(!ownerId)throw Object.assign(new Error('No access'),{code:'not_owner'});return {id:ownerId};},sessionChanged:()=>calls.push(['changed']),location,history,now:()=>now});
  return {api,auth,calls,location,setNow:value=>now=value,setLogoutError:value=>signedOutError=value};
}
test('requests only fixed same-origin callback, trims email, generic result and throttles repeat clicks',async()=>{
  const f=fixture({href:'https://www.gotlegendsguide.com/champions.html?next=https://evil.example'});
  const message=await f.api.requestPasswordReset(' owner@example.test ');
  assert.match(message,/If this email has an account/);
  assert.deepEqual(f.calls[0],['request','owner@example.test',{redirectTo:RECOVERY_REDIRECT_URL}]);
  await assert.rejects(f.api.requestPasswordReset('owner@example.test'),{code:'recovery_rate_limit'});
  f.setNow(60000);await f.api.requestPasswordReset('owner@example.test');assert.equal(f.calls.length,2);
});
test('invalid email and non-production hosted origin cannot send email',async()=>{
  const f=fixture({href:'https://preview.example/'});
  await assert.rejects(f.api.requestPasswordReset('invalid'),{code:'email_required'});
  await assert.rejects(f.api.requestPasswordReset('owner@example.test'),{code:'recovery_unavailable'});
  assert.equal(f.calls.length,0);
});
test('normal pages never consume URL tokens or establish a recovery session',async()=>{
  const f=fixture({href:'https://www.gotlegendsguide.com/?code=unrelated#access_token=unrelated'});
  assert.equal(await f.api.consumePasswordRecovery(),false);assert.equal(f.calls.length,0);
  await assert.rejects(f.api.finishPasswordRecovery('unique_password_123','unique_password_123'),{code:'recovery_invalid'});
});
test('recovery code is scrubbed before exchange; real recovery and owner required, code used once',async()=>{
  const f=fixture();await f.api.consumePasswordRecovery();await f.api.consumePasswordRecovery();
  assert.deepEqual(f.calls[0],['clean','/?password=recovery']);
  assert.equal(f.calls.filter(x=>x[0]==='exchange').length,1);
  assert.equal(f.api.passwordRecoveryStatus(),'ready');assert.equal(f.location.href,RECOVERY_REDIRECT_URL);
});
for(const [label,options] of [['missing code',{href:RECOVERY_REDIRECT_URL}],['expired code',{exchangeError:true}],['wrong flow',{redirectType:'signup'}],['wrong owner',{ownerId:'different'}],['unapproved owner',{ownerId:null}],['provider error',{href:RECOVERY_REDIRECT_URL+'#error=access_denied&error_description=untrusted'}]]){
  test(`${label} blocks password form and signs out locally`,async()=>{
    const f=fixture(options);await assert.rejects(f.api.consumePasswordRecovery());
    assert.equal(f.api.passwordRecoveryStatus(),'invalid');assert.equal(f.calls.some(x=>x[0]==='update'),false);
    assert.deepEqual(f.calls.at(-1),['logout',{scope:'local'}]);assert.doesNotMatch(f.location.href,/code=|error=/);
  });
}
test('validates password locally, updates only after fresh owner check and signs out',async()=>{
  const f=fixture();await f.api.consumePasswordRecovery();
  await assert.rejects(f.api.finishPasswordRecovery('short','short'),{code:'weak_password'});
  await assert.rejects(f.api.finishPasswordRecovery('unique_password_123','different'),{code:'password_mismatch'});
  assert.equal(f.calls.some(x=>x[0]==='update'),false);
  const result=await f.api.finishPasswordRecovery('unique_password_123','unique_password_123');
  assert.equal(result.signedOut,true);assert.deepEqual(f.calls.at(-3),['update',{password:'unique_password_123'}]);
  assert.deepEqual(f.calls.at(-4),['owner']);assert.equal(f.api.passwordRecoveryStatus(),'complete');
  await assert.rejects(f.api.finishPasswordRecovery('unique_password_123','unique_password_123'),{code:'recovery_invalid'});
});
test('server weak-password rejection stays editable without echoing provider message',async()=>{
  const f=fixture({updateError:{code:'weak_password',message:'secret provider detail'}});await f.api.consumePasswordRecovery();
  await assert.rejects(f.api.finishPasswordRecovery('unique_password_123','unique_password_123'),error=>error.code==='weak_password'&&!error.message.includes('secret'));
  assert.equal(f.api.passwordRecoveryStatus(),'ready');
});
test('uncertain update is not retried automatically',async()=>{
  const f=fixture();await f.api.consumePasswordRecovery();f.auth.updateUser=async()=>{f.calls.push(['update']);throw new Error('Network dropped');};
  await assert.rejects(f.api.finishPasswordRecovery('unique_password_123','unique_password_123'),{code:'password_update_failed'});
  assert.equal(f.api.passwordRecoveryStatus(),'invalid');assert.equal(f.calls.filter(x=>x[0]==='update').length,1);
});
test('password success with signout failure is reported separately without repeating update',async()=>{
  const f=fixture();await f.api.consumePasswordRecovery();f.setLogoutError(true);
  assert.deepEqual(await f.api.finishPasswordRecovery('unique_password_123','unique_password_123'),{signedOut:false});
  assert.equal(f.api.passwordRecoveryStatus(),'complete');
});
test('cancel rejects any later password write',async()=>{
  const f=fixture();await f.api.consumePasswordRecovery();await f.api.cancelPasswordRecovery();
  assert.equal(f.api.passwordRecoveryStatus(),'none');assert.equal(f.location.href,'https://www.gotlegendsguide.com/');
  await assert.rejects(f.api.finishPasswordRecovery('unique_password_123','unique_password_123'),{code:'recovery_invalid'});
});
