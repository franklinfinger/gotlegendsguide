import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {mountPrivateGuide} from '../src/guide-entry.js';
import {mountPrivateGuideIfEnabled} from '../../guide-access.js';
import {gameService,gameFixture} from './fixtures/game.mjs';
class Element {
  constructor(tag){this.tag=tag;this.children=[];this.handlers={};this.dataset={};this.ownText='';this.html='';this.value='';this.classList={toggle(){}};}
  append(...children){this.children.push(...children);}
  after(child){this.afterElement=child;}
  replaceChildren(...children){this.children=children;this.ownText='';this.html='';}
  set textContent(value){this.ownText=value;this.children=[];this.html='';}get textContent(){return this.ownText+this.children.map(row=>row.textContent).join('');}
  set innerHTML(value){this.html=value;this.children=[];this.ownText='';}get innerHTML(){return this.html;}
  setAttribute(name,value){this[name]=value;}getAttribute(name){return this[name];}
  addEventListener(name,fn){this.handlers[name]=fn;}
  all(){return this.children.flatMap(row=>[row,...row.all()]);}
  querySelectorAll(selector){return this.all().filter(row=>selector.split(',').includes(row.tag));}
  querySelector(){return null;}
  insertAdjacentHTML(_position,html){this.html+=html;}
  scrollIntoView(){}
  remove(){}
}
async function mountActualGuide(device,{view='recommendations',enabled=true}={}){
  const elements=new Map();const get=id=>{if(!elements.has(id))elements.set(id,new Element('div'));return elements.get(id);};
  const events={},windowEvents={};
  const document={body:{dataset:{view}},hidden:false,querySelector:get,querySelectorAll:()=>[],createElement:tag=>new Element(tag),addEventListener:(name,fn)=>{events[name]=fn;}};
  const window={addEventListener:(name,fn)=>{windowEvents[name]=fn;}};
  const oldDocument=globalThis.document,oldWindow=globalThis.window;globalThis.document=document;globalThis.window=window;
  let controller,publicLoads=0;
  try{
    const source=await fs.readFile(new URL('../../guide.js',import.meta.url),'utf8');
    const bindings={};
    for(const match of source.matchAll(/^import \{([^}]+)\} from '([^']+)';$/gm)){
      const imported=await import(new URL('../../'+match[2].replace(/^\.\//,''),import.meta.url));
      for(const name of match[1].split(',').map(row=>row.trim()))bindings[name]=imported[name];
    }
    bindings.mountPrivateGuideIfEnabled=options=>mountPrivateGuideIfEnabled(options,{config:{enabled},loadRuntime:async()=>({mountPrivateGuide:async args=>{controller=await mountPrivateGuide({...args,createStore:()=>device.store});}})});
    bindings.createDataReadiness=()=>({load:async()=>{publicLoads++;}});
    const run=new (Object.getPrototypeOf(async function(){}).constructor)(...Object.keys(bindings),'document','window','location',source.replace(/^import .*;\n/gm,''));
    await run(...Object.values(bindings),document,window,{search:'',hash:'',hostname:'localhost'});
    return {get,controller,document,events,windowEvents,publicLoads,restore(){globalThis.document=oldDocument;globalThis.window=oldWindow;}};
  }catch(error){globalThis.document=oldDocument;globalThis.window=oldWindow;throw error;}
}
async function seed(fixture){const service=gameService(fixture),device=service.device();const prepared=await device.store.prepareEvidence(service.fixture.handoff);await device.store.saveEvidence(prepared.snapshot,0);await device.store.addCapturedVariants(1);return {...service,primary:device};}
const tick=()=>new Promise(resolve=>setTimeout(resolve,15));
test('actual guide bootstrap renders saved strategy, applies collection edit, clears during save and on revoked refresh',async()=>{
  const service=await seed(),app=await mountActualGuide(service.primary);
  try{
    const content=app.get('#guide-content'),state=app.get('#guide-state'),panel=state.afterElement;
    assert.match(content.innerHTML,/Choose your battle/);assert.match(state.innerHTML,/Private saved collection: 6 owned/);assert.equal(app.publicLoads,0);
    const ask=()=>{app.get('#strategy-question').value='Build a Raid Defense team.';app.get('#conversation-form').handlers.submit({preventDefault(){}});};
    ask();assert.match(app.get('#conversation-log').innerHTML,/Fixture Champion/);assert.match(app.get('#conversation-log').innerHTML,/Current Heal/);
    let release;const original=service.primary.store.setOwned;service.primary.store.setOwned=async(...args)=>{await new Promise(resolve=>{release=resolve;});return original(...args);};
    const checkbox=panel.all().filter(row=>row.type==='checkbox')[5];checkbox.checked=false;
    const pending=checkbox.handlers.change();assert.equal(content.innerHTML,'','advice is synchronously erased before a roster write');release();await pending;
    assert.match(state.innerHTML,/Private saved collection: 5 owned/);assert.match(content.innerHTML,/Choose your battle/);
    service.remote.allowed=false;await app.controller.refresh();
    assert.equal(content.innerHTML,'');assert.doesNotMatch(panel.textContent,/Fixture Champion/);assert.match(panel.textContent,/This account does not have access/);assert.equal(app.publicLoads,0);
  }finally{app.restore();}
});
test('actual page navigation uses saved source data and no local-only file handoff controls',async()=>{
  const service=await seed();const one=await mountActualGuide(service.primary,{view:'champions'});
  try{assert.match(one.get('#guide-content').innerHTML,/Current Heal 0/,one.get('#guide-state').afterElement.textContent);assert.match(one.get('#guide-content').innerHTML,/Captured build/);assert.equal(one.publicLoads,0);}finally{one.restore();}
  const two=await mountActualGuide(service.device(),{view:'glossary'});
  try{assert.match(two.get('#guide-content').innerHTML,/Synthetic exact tooltip wording/);assert.match(two.get('#guide-state').innerHTML,/Private saved collection/);assert.equal(two.publicLoads,0);}finally{two.restore();}
});
test('actual private Champion and Items pages hide old catalog ability text and show the review limit',async()=>{
  const fixture=gameFixture();
  fixture.guide.traits.push({id:'old-trait',variantId:'v6',name:'Retired Trait',text:'OLD TRAIT WORDING',reviewStatus:'complete'});
  fixture.guide.items.push({id:'old-item',ownerVariantId:'v6',name:'Retired Iconic',abilities:[{id:'old-iconic',name:'Retired Power',text:'OLD ICONIC WORDING',reviewStatus:'complete'}]});
  const service=await seed(fixture);
  for(const view of ['champions','items']){
    const app=await mountActualGuide(service.primary,{view});
    try{
      assert.doesNotMatch(app.get('#guide-content').innerHTML,/999%|OLD TRAIT|OLD ICONIC|Retired Iconic/);
      assert.match(app.get('#guide-state').innerHTML,/latest saved evidence/);
      assert.match(app.get('#guide-state').innerHTML,/review incomplete/);
      if(view==='champions')assert.match(app.get('#guide-content').innerHTML,/No verified skill card is available/);
    }finally{app.restore();}
  }
});
test('signed-out actual guide shows password login only, then restores after login and clears on signout',async()=>{
  const service=await seed(),signedOut=service.device({signedIn:false}),app=await mountActualGuide(signedOut);
  try{
    const content=app.get('#guide-content'),panel=app.get('#guide-state').afterElement;
    assert.equal(content.innerHTML,'');assert.match(panel.textContent,/Sign in with your app account/);
    const form=panel.all().find(row=>row.tag==='form'),email=panel.all().find(row=>row.name==='email'),password=panel.all().find(row=>row.name==='password');
    email.value='owner@example.test';password.value='synthetic';await form.handlers.submit({preventDefault(){}});await tick();
    assert.equal(password.value,'');assert.match(content.innerHTML,/Choose your battle/);
    await panel.all().find(row=>row.tag==='button'&&row.textContent==='Sign out on this device').handlers.click();
    assert.equal(content.innerHTML,'');assert.doesNotMatch(panel.textContent,/Fixture Champion/);await tick();
  }finally{app.restore();}
});
test('pagehide and backgrounding lock actual private content before restoring on next page activation',async()=>{
  const service=await seed(),app=await mountActualGuide(service.primary);
  try{const content=app.get('#guide-content');app.windowEvents.pagehide();assert.equal(content.innerHTML,'');app.windowEvents.pageshow();await tick();assert.match(content.innerHTML,/Choose your battle/);app.document.hidden=true;app.events.visibilitychange();assert.equal(content.innerHTML,'');app.document.hidden=false;app.events.visibilitychange();await tick();assert.match(content.innerHTML,/Choose your battle/);}finally{app.restore();}
});
test('default actual guide bootstrap keeps the existing public readiness path without owner UI',async()=>{
  const app=await mountActualGuide({store:null},{enabled:false});
  try{assert.equal(app.publicLoads,1);assert.equal(app.get('#guide-state').afterElement,undefined);}finally{app.restore();}
});

test('background auth events and explicit refresh cannot repopulate locked private pages',async()=>{
  const service=await seed(),app=await mountActualGuide(service.primary);
  try {
    const content=app.get('#guide-content'),panel=app.get('#guide-state').afterElement;
    app.document.hidden=true;app.events.visibilitychange();
    const reads=service.remote.events.length;
    service.primary.emit('TOKEN_REFRESHED');service.primary.emit('SIGNED_IN');await app.controller.refresh();await tick();
    assert.equal(content.innerHTML,'');assert.doesNotMatch(panel.textContent,/Fixture Champion/);assert.equal(service.remote.events.length,reads,'no reads start while hidden');
    app.document.hidden=false;app.events.visibilitychange();await tick();assert.match(content.innerHTML,/Choose your battle/);
    app.windowEvents.pagehide();const hiddenReads=service.remote.events.length;
    service.primary.emit('TOKEN_REFRESHED');app.windowEvents.focus();await app.controller.refresh();await tick();
    assert.equal(content.innerHTML,'');assert.equal(service.remote.events.length,hiddenReads,'pagehide stays locked despite visible document state');
    app.windowEvents.pageshow();await tick();assert.match(content.innerHTML,/Choose your battle/);
  }finally{app.restore();}
});


test('actual guide keeps an open evidence review expanded through focus refresh',async()=>{
  const service=await seed(),app=await mountActualGuide(service.primary);
  try {
    const panel=app.get('#guide-state').afterElement;
    const evidence=panel.all().find(row=>row.className==='evidence-panel');
    panel.open=true;evidence.open=true;
    const input=evidence.all().find(row=>row.type==='file');
    app.windowEvents.focus();await tick();
    assert.equal(panel.open,true);assert.equal(panel.all().find(row=>row.type==='file'),input);
    assert.match(app.get('#guide-content').innerHTML,/Choose your battle/);
  }finally{app.restore();}
});
