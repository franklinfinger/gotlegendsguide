import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const source = (await fs.readFile(new URL('../src/controls.js', import.meta.url), 'utf8')).replace(/^export /gm, '') + '\nreturn await mountOwnerControls({root:document.querySelector(\"#app\"),state:document.querySelector(\"#status\"),store:createOwnerStore()});';
class Element {
  constructor(tag) { this.tag = tag; this.children = []; this.handlers = {}; this.dataset = {}; this.ownText = ''; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; this.ownText = ''; }
  set textContent(value) { this.ownText = value; this.children = []; }
  get textContent() { return this.ownText + this.children.map(child => child.textContent).join(''); }
  setAttribute(name, value) { this[name] = value; }
  addEventListener(name, fn) { this.handlers[name] = fn; }
  click() { this.clicked = true; }
  all() { return this.children.flatMap(child => [child, ...child.all()]); }
  querySelectorAll(selector) { return this.all().filter(child => selector.split(',').includes(child.tag)); }
}
async function mount(store) {
  const root = new Element('section'), status = new Element('p');
  const created = [], exports = [];
  const events = {}, windowEvents = {};
  const document = { hidden:false, querySelector: id => id === '#app' ? root : status, createElement: tag => {const element=new Element(tag);created.push(element);return element;}, addEventListener(name, fn) {events[name] = fn;} };
  const window = { addEventListener(name, fn) {windowEvents[name] = fn;} };
  const run = new (Object.getPrototypeOf(async function(){}).constructor)('document','window','globalThis','createClient','createOwnerStore','URL','Blob', source);
  const controller = await run(document, window, {GOT_PRIVATE_CONFIG:{enabled:true}}, () => {}, () => store, {createObjectURL(blob){exports.push(blob);return 'blob:synthetic';},revokeObjectURL(){}}, Blob);
  return { root, status, created, exports, controller, document, events, windowEvents }; 
}
const collection = () => ({ variantIds:['v1'], champions:[{id:'v1',name:'Private champion'}], evidenceRevision:0 });
for (const code of ['not_owner','signed_out','session_changed','access_unavailable','save_failed']) {
  test(`actual app DOM clears private rows on ${code} during save`, async () => {
    const store = {enabled:true,readCollection:async()=>collection(),watch(){},setOwned:async()=>{throw Object.assign(new Error('Blocked'),{code});}};
    const {root,status}=await mount(store);
    assert.match(root.textContent,/Private champion/);
    const checkbox=root.all().find(row=>row.tag==='input'&&row.type==='checkbox');
    checkbox.checked=false; await checkbox.handlers.change();
    assert.doesNotMatch(root.textContent,/Private champion|My champions/);
    assert.equal(root.all().filter(row=>row.type==='checkbox').length,0);
    assert.equal(status.textContent,'Blocked');
  });
}
test('actual app DOM rejects late successful save after SIGNED_OUT', async()=>{
  let callback,release;
  const store={enabled:true,readCollection:async()=>collection(),watch(fn){callback=fn;},setOwned:()=>new Promise(resolve=>{release=resolve;})};
  const {root,status}=await mount(store);
  const checkbox=root.all().find(row=>row.type==='checkbox');
  const pending=checkbox.handlers.change(); callback('SIGNED_OUT'); release(true); await pending;
  assert.equal(root.all().filter(row=>row.type==='checkbox').length,0);
  assert.doesNotMatch(status.textContent,/Saved\./);
});


test('recovery UI exports unchanged snapshot, requires reviewed links, and cancelled handlers cannot save',async()=>{
  const original={revision:7,payload:{format:'got-reviewed-evidence-v1',handoff:{verbatim:'Untouched private source'},identityMap:[{variantId:'local-verified:example',championName:'Example',exactVariant:'Exact'}]}};
  const before=JSON.stringify(original);let recovered=false,saves=0,reads=0;
  const candidate={...structuredClone(original.payload),identityLinks:[{variantId:'local-verified:example',canonicalVariantId:'c-new'}]};
  const store={enabled:true,watch(){},readCollection:async()=>{if(!recovered)throw Object.assign(new Error('Saved evidence needs review.'),{code:'evidence_reconciliation_required',reason:'Ambiguous exact identity.'});return collection();},
    readEvidenceForRecovery:async()=>{reads++;return structuredClone(original);},
    proposeEvidenceReconciliation:async revision=>{assert.equal(revision,7);return {snapshot:candidate,expectedRevision:7,changes:[{name:'Example — Exact',variantId:'local-verified:example',canonicalVariantId:'c-new'}]};},
    saveEvidence:async(snapshot,revision)=>{assert.deepEqual(snapshot,candidate);assert.equal(revision,7);saves++;recovered=true;}};
  const view=await mount(store),{root,status}=view;
  assert.match(root.textContent,/Review saved evidence/);assert.doesNotMatch(root.textContent,/My champions/);
  const find=text=>root.all().find(row=>row.tag==='button'&&row.textContent===text);
  await find('Export unchanged saved evidence').handlers.click();
  assert.equal(reads,2,'private export rechecks current access');
  assert.deepEqual(JSON.parse(await view.exports[0].text()),original.payload);
  assert.equal(view.created.find(row=>row.tag==='a').download,'got-evidence-revision-7.private.json');
  assert.equal(saves,0);
  await find('Review exact identity links').handlers.click();
  assert.match(root.textContent,/keep saved ID local-verified:example/);
  let save=find('Save reviewed identity links'),checked=root.all().find(row=>row.type==='checkbox');
  await save.handlers.click();assert.equal(saves,0,'unchecked review cannot write');
  checked.checked=true;checked.handlers.change();assert.equal(save.disabled,false);
  find('Cancel review').handlers.click();await save.handlers.click();assert.equal(saves,0,'cancel invalidates old handlers');
  assert.match(status.textContent,/unchanged/);assert.equal(JSON.stringify(original),before);
  await find('Review exact identity links').handlers.click();
  save=find('Save reviewed identity links');checked=root.all().find(row=>row.type==='checkbox');checked.checked=true;checked.handlers.change();
  await save.handlers.click();assert.equal(saves,1);assert.match(root.textContent,/My champions/);
  assert.equal(JSON.stringify(original),before,'recovery UI never mutates the prior record');
});
test('per-variant evidence gap and recommendation block are visible before collection actions',async()=>{
  const data={...collection(),champions:[{id:'v1',name:'Private champion',evidenceUnavailable:true}],recommendationsBlocked:true,unavailableOwnedVariantIds:['v1']};
  const {root}=await mount({enabled:true,watch(){},readCollection:async()=>data});
  assert.match(root.textContent,/Recommendations are blocked/);
  const row=root.all().find(element=>element.className?.includes('evidence-unavailable'));
  assert.ok(row);assert.match(row.textContent,/Reviewed evidence unavailable for this saved variant/);
  assert.match(row.textContent,/before using it for recommendations/);
});


const tick = () => new Promise(resolve => setTimeout(resolve, 15));
const picker = view => view.root.all().find(row => row.type === 'file');
const saveEvidenceButton = view => view.root.all().find(row => row.tag === 'button' && row.textContent === 'Save reviewed evidence to my account');
const choose = (input, value) => { input.files = [{size:2, text:async()=>JSON.stringify(value)}]; return input.handlers.change(); };
function evidenceStore() {
  const current = {ownerId:'synthetic-owner', ...collection()}, writes = [];
  let watched;
  const store = {enabled:true, readCollection:async()=>({...current}), watch(fn){watched=fn;},
    prepareEvidence:async snapshot=>({snapshot,result:{audit:{mappings:[{variantId:'v1'}]}}}),
    saveEvidence:async(snapshot,revision)=>{writes.push({snapshot,revision});current.evidenceRevision=revision+1;}};
  return {store,current,writes,emit:event=>watched(event)};
}
test('native chooser focus before change keeps the same input alive while access is reverified', async()=>{
  const fixture=evidenceStore(), view=await mount(fixture.store), input=picker(view);
  let release;
  fixture.store.readCollection=()=>new Promise(resolve=>{release=()=>resolve({...fixture.current});});
  view.windowEvents.focus();await tick();
  assert.equal(view.root.hidden,true,'uncertain private controls are hidden');
  assert.equal(picker(view),input,'focus did not remove the native input');
  await choose(input,{chosen:'first'});
  await saveEvidenceButton(view).handlers.click();assert.equal(fixture.writes.length,0,'cannot save while focus authorization is pending');
  release();await tick();
  assert.equal(view.root.hidden,false);assert.equal(picker(view),input);
  assert.match(view.root.textContent,/1 exact variants validated/);
  fixture.store.readCollection=async()=>({...fixture.current});
  await saveEvidenceButton(view).handlers.click();
  assert.deepEqual(fixture.writes,[{snapshot:{chosen:'first'},revision:0}]);
});
test('focus and repeated auth notifications preserve a reviewed draft and its original revision',async()=>{
  const fixture=evidenceStore(),view=await mount(fixture.store),input=picker(view);
  await choose(input,{chosen:'reviewed'});
  fixture.current.evidenceRevision=4;
  view.windowEvents.focus();fixture.emit('SIGNED_IN');fixture.emit('TOKEN_REFRESHED');await tick();
  assert.equal(picker(view),input);assert.equal(saveEvidenceButton(view).disabled,false);
  await saveEvidenceButton(view).handlers.click();
  assert.equal(fixture.writes[0].revision,0,'focus must not silently rebase an already reviewed draft');
});
test('stale reviewed evidence still reaches the revision conflict guard after focus',async()=>{
  const fixture=evidenceStore(),view=await mount(fixture.store),input=picker(view);
  await choose(input,{chosen:'stale'});fixture.current.evidenceRevision=2;
  fixture.store.saveEvidence=async(_snapshot,revision)=>{assert.equal(revision,0);throw Object.assign(Error('Saved evidence changed on another device.'),{code:'evidence_conflict'});};
  view.windowEvents.focus();await tick();await saveEvidenceButton(view).handlers.click();
  assert.match(view.status.textContent,/changed on another device/);assert.equal(picker(view),undefined);
  assert.equal(fixture.current.evidenceRevision,2);assert.equal(fixture.writes.length,0);
});
test('focus during file validation preserves the latest selection and ignores an older file read',async()=>{
  const fixture=evidenceStore(),view=await mount(fixture.store),input=picker(view);let release;
  input.files=[{size:2,text:()=>new Promise(resolve=>{release=()=>resolve('{"chosen":"old"}');})}];
  const first=input.handlers.change();
  view.windowEvents.focus();await tick();await choose(input,{chosen:'new'});release();await first;
  await saveEvidenceButton(view).handlers.click();
  assert.deepEqual(fixture.writes,[{snapshot:{chosen:'new'},revision:0}]);
});
for(const reason of ['background','pagehide','signed-out','owner-denied','owner-changed']) {
  test(`pending native chooser callbacks cannot revive evidence after ${reason}`,async()=>{
    const fixture=evidenceStore(),view=await mount(fixture.store),input=picker(view);let release;
    input.files=[{size:2,text:()=>new Promise(resolve=>{release=()=>resolve('{"chosen":"discard"}');})}];
    const pending=input.handlers.change();const oldSave=saveEvidenceButton(view);
    if(reason==='background'){view.document.hidden=true;view.events.visibilitychange();}
    if(reason==='pagehide')view.windowEvents.pagehide();
    if(reason==='signed-out')fixture.emit('SIGNED_OUT');
    if(reason==='owner-denied'){fixture.store.readCollection=async()=>{throw Object.assign(Error('Owner revoked'),{code:'not_owner'});};await view.controller.refresh();}
    if(reason==='owner-changed'){fixture.current.ownerId='different-synthetic-owner';await view.controller.refresh();}
    release();await pending;await oldSave.handlers.click();
    assert.equal(fixture.writes.length,0);assert.doesNotMatch(view.root.textContent,/exact variants validated/);
    if(reason==='signed-out')await tick();
  });
}
test('cancelled chooser keeps the existing draft; an empty changed selection disables saving',async()=>{
  const fixture=evidenceStore(),view=await mount(fixture.store),input=picker(view);
  await choose(input,{chosen:'existing'});
  view.windowEvents.focus();await tick(); // Native cancel leaves the FileList unchanged.
  assert.equal(saveEvidenceButton(view).disabled,false);assert.equal(fixture.writes.length,0);
  input.files=[];await input.handlers.change();assert.equal(saveEvidenceButton(view).disabled,true);
  await saveEvidenceButton(view).handlers.click();assert.equal(fixture.writes.length,0);
});
