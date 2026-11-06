import { abilityDisplayName } from './reviewed-ability-sections.js';
import { capturedDevelopmentMarkup, describeTeamDevelopment, developmentNoticeMarkup } from './captured-development.js';
import { mountPrivateGuideIfEnabled } from './guide-access.js';
import { capturedAllyPairsMarkup } from './captured-ally-pairs.js';
import { teamExplanationIntro, teamExplanationMarkup } from './team-explanation.js';
import { prebattleSourceNotesMarkup } from './prebattle-source-notes.js';
import { iceBrittleSynergyMarkup } from './ice-brittle-synergy.js';
import { effectCoverageMarkup, tooltipEvidenceMarkup, tooltipGlossaryEntries } from './effect-definition-view.js';
import { mountLocalHandoffControls } from './local-handoff-controls.js';
import { createDataReadiness, readinessMarkup } from './data-readiness.js';
import { answerStrategyQuestion, buildTeamOptions, selectConversationOption } from './conversation-engine.js';
import { answerGuideQuestion } from './knowledge-engine.js';
import { analyzeRaidDefense, raidSelectionTransition, resetRaidSelection } from './raid-engine.js';

const root = document.querySelector('#guide-content');
const state = document.querySelector('#guide-state');
// Old Items bookmarks now open the champion reference; item evidence stays attached to its champion.
const view = document.body.dataset.view === 'items' ? 'champions' : document.body.dataset.view || 'home';
let snapshot;
let strategySnapshot;
let conversationContext = {};
let clearLocalHandoffControls = () => {};

const pages = [
  ['home','Home','index.html'], ['raid','Raid Attack','raids.html#raid-attack'],
  ['war','War Teams','war.html'], ['legendary-assault','Dragons','dragons.html'],
  ['recommendations','Ask the guide','recommendations.html'], ['champions','Champions','champions.html'],
  ['teams','Team library','builder.html'], ['factions','Factions','factions.html'],
  ['glossary','Status & mechanics','status-effects.html']
];
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const slug = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const cleanName = value => String(value || '').split(' — ')[0].trim();
const badge = (text, tone='') => `<span class="badge ${tone}">${esc(text)}</span>`;
const empty = (title, copy) => `<div class="empty-state"><span class="empty-icon" aria-hidden="true">◇</span><h2>${esc(title)}</h2><p>${esc(copy)}</p></div>`;

function renderShell() {
  const link = ([id,label,href]) => `<a href="${href}" ${id===view?'aria-current="page"':''}>${esc(label)}</a>`;
  document.querySelector('#site-header').innerHTML = `<div class="shell header-inner">
    <a class="wordmark" href="index.html" aria-label="GOT Legends Guide home"><span class="brand-mark" aria-hidden="true">G</span><span><strong>GOT LEGENDS GUIDE</strong><small>Your battle companion</small></span></a>
    <button class="menu-button" type="button" aria-expanded="false" aria-controls="site-menu"><span></span><span></span><span></span><span class="sr-only">Open guide menu</span></button>
    <nav id="site-menu" class="site-menu" aria-label="Guide sections">${pages.slice(0,4).map(link).join('')}<details class="more-navigation"><summary ${pages.slice(4).some(([id])=>id===view)?'class="is-current"':''}>Guide & references</summary><div>${pages.slice(4).map(link).join('')}</div></details></nav></div>`;
  const mobile = [...pages.slice(0,4),['recommendations','Guide','recommendations.html']];
  document.querySelector('#mobile-nav').innerHTML = mobile.map(([id,label,href]) => `<a href="${href}" ${id===view?'aria-current="page"':''}><span class="mobile-icon" aria-hidden="true">${{home:'⌂',raid:'⚔',war:'⚑','legendary-assault':'♜',recommendations:'◇'}[id]}</span><span>${esc(label)}</span></a>`).join('');
  document.querySelector('#site-footer').innerHTML = `<div class="shell footer-inner"><div><strong>GOT Legends Guide</strong><span>Your collection. A clearer battle plan.</span></div><div class="system-links"><a href="health.html">System status</a><a href="strategy.html">Data notes</a></div></div>`;
  const button = document.querySelector('.menu-button');
  const menu = document.querySelector('#site-menu');
  const closeMenu = () => {button.setAttribute('aria-expanded','false');menu.classList.toggle('open',false);};
  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!open));
    menu.classList.toggle('open', !open);
  });
  document.addEventListener('keydown', event => {if(event.key==='Escape'){closeMenu();document.querySelector('.more-navigation')?.removeAttribute('open');button.focus?.();}});
  menu.addEventListener('click', event => {if(event.target.closest?.('a'))closeMenu();});
  window.addEventListener('pageshow', closeMenu);
}

function titleBlock(kicker,title,copy) {
  return `<header class="page-heading"><p class="eyebrow">${esc(kicker)}</p><h1>${esc(title)}</h1><p>${esc(copy)}</p></header>`;
}

function portrait(champion, size='card') {
  const initials = champion?.name?.split(/\s|—/).filter(Boolean).slice(0,2).map(part=>part[0]).join('') || '?';
  const src = champion?.portrait;
  return `<span class="portrait portrait-${size} ${src?'':'portrait-missing'}">${src?`<img src="${esc(src)}" alt="" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false">`:''}<span class="portrait-fallback" ${src?'hidden':''}>${esc(initials)}</span></span>`;
}

function championForName(name, gemColor=null) {
  const target = cleanName(name).toLowerCase();
  const matches = snapshot.champions.filter(champion => cleanName(champion.name).toLowerCase() === target);
  return matches.find(champion => gemColor && champion.gemColor?.toLowerCase()===gemColor.toLowerCase() && champion.portrait)
    || matches.find(champion => gemColor && champion.gemColor?.toLowerCase()===gemColor.toLowerCase())
    || matches.find(champion => champion.portrait) || matches[0] || null;
}

function championLink(champion, label=null) {
  if (!champion) return esc(label || 'Unknown champion');
  return `<a href="champions.html?champion=${encodeURIComponent(champion.id)}">${esc(label || champion.name)}</a>`;
}

function homePage() {
  const battles=[
    ['Raid Attack','Counter the five defenders in front of you.','raids.html#raid-attack','raid','⚔','Build a counter team'],
    ['War Teams','Choose the battlefield rule. Find a team that fits.','war.html','war','⚑','Choose a battlefield'],
    ['Dragons','Plan your Legendary Assault, dragon by dragon.','dragons.html','dragon','♜','Choose a dragon']
  ];
  const references=[['Champions','champions.html'],['Team library','builder.html'],['Factions','factions.html'],['Status & mechanics','status-effects.html']];
  return `<section class="battle-home">${titleBlock('Ready for battle','What’s the plan?','Choose your battle. Find your team. Know why it works.')}
    <div class="battle-home-grid">${battles.map(([title,copy,href,tone,icon,action],index)=>`<a class="action-tile battle-${tone}" href="${href}"><div class="battle-tile-top"><span class="battle-symbol" aria-hidden="true">${icon}</span><span class="battle-number">0${index+1}</span></div><h2>${title}</h2><p>${copy}</p><span class="battle-cta">${action}<span aria-hidden="true">→</span></span></a>`).join('')}</div>
    <a class="defense-link" href="raids.html#raid-defense"><span><strong>Raid Defense</strong><span>Set the team other players face.</span></span><span aria-hidden="true">→</span></a>
    ${snapshot.privateCollection?.latestEvidenceOnly?'<p class="home-evidence-note">Team suggestions use your saved evidence. Ability review is incomplete; any limits stay with the recommendation.</p>':''}</section>
    <section class="home-question"><div><p class="eyebrow">Need a specific answer?</p><h2>Ask the guide</h2><p>Battle plans, champions, mechanics and gear.</p></div><form class="quick-find" id="home-strategy-form"><label for="home-search">Your question</label><div><input id="home-search" type="search" placeholder="Who can use POISON?" autocomplete="off" required><button type="submit">Ask →</button></div></form></section>
    <section id="home-strategy-result" class="home-strategy-result" hidden><div class="section-title"><h2>Guide answer</h2></div>${conversationPanel()}</section>
    <section class="home-section"><div class="section-title"><h2>Your reference shelf</h2></div><nav class="reference-links" aria-label="Guide references">${references.map(([title,href])=>`<a href="${href}">${title}<span aria-hidden="true">→</span></a>`).join('')}</nav></section>`;
}

function championFacts(champion) {
  const skills = snapshot.abilities.filter(a=>a.variantId===champion.id && ['skill','champion_skill'].includes(a.kind));
  const normalizedTraits = snapshot.abilities.filter(a=>a.variantId===champion.id && a.kind==='trait');
  const traits = [...snapshot.traits.filter(t=>t.variantId===champion.id), ...normalizedTraits];
  const items = snapshot.items.filter(item=>item.ownerVariantId===champion.id);
  return {skills,traits,items};
}

function championCard(champion, open=false) {
  const {skills,traits,items} = championFacts(champion);
  const subtle = champion.releaseState==='unverified' ? `<p class="subtle-note">This variant's current availability is not confirmed.</p>` : '';
  return `<details class="champion-card" data-search="${esc(`${champion.name} ${champion.gemColor||''} ${champion.rarity||''} ${champion.factions.join(' ')}`.toLowerCase())}" data-color="${esc((champion.gemColor||'unknown').toLowerCase())}" data-factions="${esc(champion.factions.join('|').toLowerCase())}" ${open?'open':''}>
    <summary><span class="champion-summary">${portrait(champion)}<span class="champion-identity"><strong>${esc(champion.name)}</strong><span>${esc([champion.rarity,champion.gemColor].filter(Boolean).join(' · ')||'Classification unavailable')}</span><span>${esc(champion.factions.join(' · ')||'Faction not recorded')}</span></span><span class="expand-mark" aria-hidden="true">＋</span></span></summary>
    <div class="champion-detail">${subtle}${champion.screenshotState?`<section class="screenshot-build"><h3>Captured build</h3><p>${esc(champion.screenshotState.profileText)}</p><p class="subtle-note">${champion.screenshotState.reviewedOn?'Reviewed '+esc(champion.screenshotState.reviewedOn):'Captured '+esc(champion.screenshotState.captureDate)}. Not live progression or universal base stats.</p>${champion.screenshotState.resolvedIssue?`<p>${esc(champion.screenshotState.resolvedIssue)}</p>`:''}${champion.screenshotState.definitionGaps?.length?`<p class="subtle-note">Unverified effect definitions: ${esc(champion.screenshotState.definitionGaps.map(row=>row.effectName).join(', '))}. Special effects are not scored or treated as fully understood.</p>`:''}${effectCoverageMarkup(champion.screenshotState.effectDefinitions)}${champion.screenshotState.conflicts.filter(row=>!row.state?.startsWith('resolved')).map(row=>`<p class="subtle-note">Unresolved: ${esc(row.conflict)}</p>`).join('')}</section>`:''}<div class="detail-grid"><section><h3>Skill</h3>${skills.length?skills.map(abilityBlock).join(''):unavailable('No verified skill card is available for this variant.')}</section><section><h3>Traits</h3>${traits.length?traits.map(abilityBlock).join(''):unavailable('No verified trait card is available for this variant.')}</section></div>
    <section class="linked-items"><h3>Iconic item</h3>${items.length?items.map(item=>`<article class="champion-item" id="${esc(item.id)}"><h4>${esc(item.name)}</h4>${item.abilities.length?item.abilities.map(abilityBlock).join(''):unavailable('Verified item ability wording is unavailable.')}</article>`).join(''):unavailable('No iconic item is listed for this variant.')}</section></div></details>`;
}

function abilityBlock(ability) {
  const partial = ability.reviewStatus && ability.reviewStatus!=='complete';
  const name = /^title not visible/i.test(ability.name||'') ? 'Trait title unavailable' : abilityDisplayName(ability);
  return `<article class="ability-block"><div><strong>${esc(name)}</strong>${partial?badge('Partial','quiet'):''}</div><p>${esc(ability.text||'Wording unavailable.')}</p>${ability.sourceFilenames?.length?`<p class="subtle-note">${ability.displayedSkillLevel?'Shown skill level '+esc(ability.displayedSkillLevel)+' · ':''}${ability.inferredSkillLevel?'Inferred skill level '+esc(ability.inferredSkillLevel)+' ('+esc(ability.levelInferenceBasis)+') · ':''}${ability.itemLevel?'Shown item level '+esc(ability.itemLevel)+' · ':''}Screenshot evidence ${esc(ability.reviewCompletedDate||ability.captureDate)}: ${esc(ability.sourceFilenames.join(', '))}</p>`:''}${ability.reviewNotes?.length?`<p class="subtle-note">${ability.reviewNotes.map(esc).join(' ')}</p>`:''}</article>`;
}
function unavailable(message) { return `<div class="unavailable">${esc(message)}</div>`; }

function championsPage() {
  const query = new URLSearchParams(location.search);
  const selected = query.get('champion');
  const initialSearch = query.get('q') || '';
  const colors = [...new Set(snapshot.champions.map(c=>c.gemColor).filter(Boolean))].sort();
  return `${titleBlock('Champion library','Champions','Search exact variants and open a card for its skill, traits, factions, and connected item.')}
    <section class="filter-panel" aria-label="Champion filters"><label for="champion-search">Search champions</label><input id="champion-search" type="search" value="${esc(initialSearch)}" placeholder="Name, color, rarity, or faction…" autocomplete="off"><div class="filter-row" id="color-filters"><button type="button" class="filter-chip active" data-color="all" aria-pressed="true">All colors</button>${colors.map(color=>`<button type="button" class="filter-chip color-${slug(color)}" data-color="${esc(color.toLowerCase())}" aria-pressed="false">${esc(color)}</button>`).join('')}</div><p id="champion-count" class="result-count"></p></section>
    <div id="champion-list" class="champion-grid">${snapshot.champions.map(c=>championCard(c,c.id===selected)).join('')}</div><div id="champion-empty" hidden>${empty('No champions match','Try another name, color, rarity, or faction.')}</div>`;
}

function mountChampionFilters() {
  const input = document.querySelector('#champion-search');
  const cards = [...document.querySelectorAll('.champion-card')];
  const count = document.querySelector('#champion-count');
  const emptyState = document.querySelector('#champion-empty');
  let color='all';
  const render=()=>{
    const q=input.value.trim().toLowerCase(); let shown=0;
    cards.forEach(card=>{ const match=(!q||card.dataset.search.includes(q))&&(color==='all'||card.dataset.color===color); card.hidden=!match; if(match) shown++; });
    count.textContent=`${shown} champion variant${shown===1?'':'s'}`;
    emptyState.hidden=shown!==0;
  };
  input.addEventListener('input',render);
  document.querySelectorAll('#color-filters [data-color]').forEach(button=>button.addEventListener('click',()=>{color=button.dataset.color;document.querySelectorAll('#color-filters [data-color]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});render();}));
  render();
  document.querySelector('.champion-card[open]')?.scrollIntoView({block:'start'});
}

function mountSimpleSearch(inputSelector,cardSelector,countSelector,label,emptySelector) {
  const input=document.querySelector(inputSelector), cards=[...document.querySelectorAll(cardSelector)], count=document.querySelector(countSelector);
  const emptyState=document.querySelector(emptySelector);
  const render=()=>{const q=input.value.trim().toLowerCase();let shown=0;cards.forEach(card=>{const ok=!q||card.dataset.search.includes(q);card.hidden=!ok;if(ok)shown++;});count.textContent=`${shown} ${label}${shown===1?'':'s'}`;if(emptyState)emptyState.hidden=shown!==0;};input.addEventListener('input',render);render();
}

function teamPortrait(member) { const champ=championForName(member.name,member.gemColor); return `<div class="team-member">${portrait(champ,'team')}<strong>${esc(member.name)}</strong>${member.isLeader?badge('Leader','gold'):''}</div>`; }
function teamsPage() {
  return `${titleBlock('Battle strategy','Team library','Choose a battle to compare teams and decide what to field in the game.')}
    ${battleTargetPicker('library-target','Choose a battle')}
    <div class="library-filters"><label>Mechanic<select id="library-mechanic"><option value="">All mechanics</option>${strategySnapshot.mechanics.map(row=>`<option value="${esc(row.id)}">${esc(row.name)}</option>`).join('')}</select></label><label>Faction<select id="library-faction"><option value="">All factions</option>${snapshot.factions.map(row=>`<option value="${esc(row.name)}">${esc(row.name)}</option>`).join('')}</select></label></div>
    <div id="library-options" aria-live="polite"></div>
    <div class="section-title"><h2>Community team examples</h2></div><div class="context-note"><strong>Observed lineups</strong><span>These show teams players used. Battle outcomes were not shown.</span></div>
    <p class="result-count">${snapshot.teams.length} observed compositions</p><div class="team-grid">${snapshot.teams.map((team,index)=>`<article class="team-card"><header><span>Observed team ${String(index+1).padStart(2,'0')}</span>${badge('Community example','quiet')}</header><div class="team-lineup">${team.members.map(teamPortrait).join('')}</div></article>`).join('')}</div>`;
}

function battleTargetPicker(id,label,mode=null) {
  const groups=[['Legendary Assault',strategySnapshot.targets.filter(row=>row.battleMode==='legendary-assault')],['War',strategySnapshot.targets.filter(row=>row.battleMode==='war')],['Raid',strategySnapshot.targets.filter(row=>row.battleMode==='raid')]].filter(([name])=>!mode || name.toLowerCase()===mode);
  return `<label class="battle-picker">${esc(label)}<select id="${esc(id)}">${groups.map(([name,rows])=>`<optgroup label="${esc(name)}">${rows.map(row=>`<option value="${esc(row.id)}">${esc(row.name)}</option>`).join('')}</optgroup>`).join('')}</select></label>`;
}

function raidPage() {
  const groups=Object.groupBy?Object.groupBy(snapshot.raidRules,r=>r.category):snapshot.raidRules.reduce((a,r)=>((a[r.category]??=[]).push(r),a),{});
  const attack=snapshot.strategyTeams.filter(t=>/attack/i.test(t.role||''));
  const defense=snapshot.strategyTeams.filter(t=>/defen/i.test(t.role||''));
  const groupCards=Object.entries(groups).map(([category,rules])=>`<section class="rule-group"><h2>${esc(category)}</h2>${rules.map(r=>`<p>${esc(r.text)}</p>`).join('')}</section>`).join('');
  const variants=snapshot.champions.filter(row=>row.releaseState==='live').sort((a,b)=>a.name.localeCompare(b.name));
  const enemyPicker=Array.from({length:5},(_,index)=>`<label>Enemy ${index+1}<select class="enemy-select" aria-label="Enemy champion ${index+1}"><option value="">Choose variant</option>${variants.map(row=>`<option value="${esc(row.id)}">${esc(row.name)}${row.gemColor?` · ${esc(row.gemColor)}`:''}</option>`).join('')}</select></label>`).join('');
  return `${titleBlock('Raid battles','Raid Attack','Choose the five defenders and their Leader to compare counter teams.')}
    <section class="battle-advisor" id="raid-attack"><div class="section-title"><h2>Raid Attack · opposing team</h2><button class="reset-raid" id="reset-raid" type="button">Reset Raid</button></div><p>Select five exact defenders and mark their Leader to compare complete teams.</p><div class="enemy-picker">${enemyPicker}</div><label class="enemy-leader-picker">Enemy Leader<select id="enemy-leader"><option value="">Select the enemy Leader</option></select></label><p id="enemy-input-status" role="status"></p><div id="raid-enemy-team"></div><div id="raid-attack-options" aria-live="polite"></div></section>
    <section class="battle-advisor" id="raid-defense"><div class="section-title"><h2>Raid Defense · recommended teams</h2></div><div id="raid-defense-options">${teamOptionsMarkup(buildTeamOptions({guideData:snapshot,strategyData:strategySnapshot,targetId:'raid:defense'}))}</div></section>
    <div class="raid-rule-grid">${groupCards||empty('Raid information unavailable','No verified Raid rules could be loaded.')}</div>
    <section class="split-section"><div><p class="eyebrow">Attacking</p><h2>Attack examples</h2><p>Your attacking team is the lineup you take into the selected opponent.</p>${teamExampleList(attack)}</div><div><p class="eyebrow">Defending</p><h2>Defense examples</h2><p>Your defensive team is the lineup other players face.</p>${teamExampleList(defense)}</div></section>
    <section class="reference-strip"><div><strong>Team testing</strong><span>${esc(snapshot.raidTeams[0]?.context||'No separate verified test-team context is available.')}</span></div>${snapshot.raidTeams[0]?`<div class="mini-lineup">${snapshot.raidTeams[0].members.map(teamPortrait).join('')}</div>`:''}</section>`;
}
function teamExampleList(teams) { return teams.length?teams.map(t=>`<article class="compact-team"><span>${esc(t.mode)} · ${esc(t.role)}</span><div>${t.members.map(m=>championLink(championForName(m.name,m.gemColor),m.name)).join(' · ')}</div></article>`).join(''):unavailable('No separately labeled examples are available for this role.'); }

function warPage() {
  return `${titleBlock('Alliance War','War Teams','Choose a battlefield. Read its rule and key mechanics before comparing teams.')}
    ${battleTargetPicker('war-target','Choose a War battlefield','war')}<div id="war-team-options" aria-live="polite"></div>
    <div class="war-grid">${snapshot.warRules.map(rule=>`<article class="war-card"><header><span>${esc(rule.points.toLocaleString())}</span><small>victory points</small></header><h2>${esc(rule.name)}</h2><dl><div><dt>Battlefield effect</dt><dd>${esc(rule.effect)}</dd></div><div><dt>When it matters</dt><dd>${esc(rule.phaseRule)}</dd></div></dl></article>`).join('')}</div>`;
}

function legendaryAssaultPage() {
  return `${titleBlock('Legendary Assault','Dragons','Choose an encounter to compare recommended teams, battle plans, abilities, and battle tips.')}
    <nav class="encounter-tabs" aria-label="Legendary Assault encounters">${snapshot.legendaryAssault.map(e=>`<a href="#${slug(e.id)}">${esc(e.name)}</a>`).join('')}</nav>
    <div class="encounter-list">${snapshot.legendaryAssault.map(e=>{const targetId=`legendary-assault:${slug(e.name)}`,options=buildTeamOptions({guideData:snapshot,strategyData:strategySnapshot,targetId}),target=strategySnapshot.targets.find(row=>row.id===targetId);return `<section class="encounter" id="${slug(e.id)}"><header><div><p class="eyebrow">Legendary Assault</p><h2>${esc(e.name)}</h2><p>${esc(e.subtitle||'Dragon encounter')}</p>${e.tips[0]?`<p class="encounter-key">${esc(e.tips[0].text)}</p>`:''}</div><span class="dragon-mark" aria-hidden="true">♜</span></header><div class="encounter-strategy"><h3>Recommended Teams</h3>${teamOptionsMarkup(options)}<a class="encounter-ask" href="recommendations.html?q=${encodeURIComponent(`Give me teams for ${e.name}`)}">Ask a follow-up about ${esc(e.name)} →</a></div><div class="encounter-mechanics"><h3>Encounter Mechanics</h3><p>${esc(target?.warning||'See the abilities and tips below.')}</p></div><div class="encounter-columns"><div><h3>Abilities</h3>${e.abilities.length?e.abilities.map(abilityBlock).join(''):unavailable(`Ability cards for ${e.name} are not available yet.`)}</div><div><h3>Battle Tips</h3>${e.tips.length?`<ul class="tip-list">${e.tips.map(t=>`<li>${esc(t.text)}</li>`).join('')}</ul>`:unavailable(`Battle tips are not available for ${e.name}.`)}</div></div></section>`}).join('')}</div>`;
}

function factionsPage() {
  const current=snapshot.factions.filter(f=>f.rules.some(r=>r.kind==='current_bonus')||f.memberVariantIds.length);
  const championsById=new Map(snapshot.champions.map(c=>[c.id,c]));
  return `${titleBlock('Battle bonuses','Factions','See each faction bonus, how it plays, and which champions can use it.')}
    <div class="faction-grid">${current.map(f=>{
      const bonus=f.rules.find(r=>r.kind==='current_bonus'),play=f.rules.find(r=>r.kind==='how_to_play');
      const members=f.memberVariantIds.map(id=>championsById.get(id)).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name));
      return `<article class="faction-card" id="${slug(f.name)}"><header><div><p class="eyebrow">Faction</p><h2>${esc(f.name)}</h2></div><span class="faction-count">${members.length} champion${members.length===1?'':'s'}</span></header>
        <div class="faction-bonus"><span>Team bonus</span><strong>${esc(bonus?.text||'Bonus details not available')}</strong></div>
        ${play&& !/not yet available/i.test(play.text)?`<p class="faction-play"><strong>How it plays</strong>${esc(play.text)}</p>`:''}
        <section class="faction-members"><h3>Champions</h3>${members.length?`<div class="member-row">${members.map(c=>`<a href="champions.html?champion=${encodeURIComponent(c.id)}">${portrait(c,'small')}<span><strong>${esc(c.name)}</strong><small>${esc(c.gemColor||'Affinity not listed')}${c.factions.length>1?` · Also ${esc(c.factions.filter(name=>name!==f.name).join(' & '))}`:''}</small></span></a>`).join('')}</div>`:'<p>No champion variants are listed for this faction yet.</p>'}</section></article>`;
    }).join('')}</div>${currentFactionNotes()}`;
}
function currentFactionNotes() { const rules=snapshot.announcements.filter(update=>update.status==='live').flatMap(update=>update.rules).filter(rule=>rule.category==='factions'||rule.category==='faction_bonuses'); return rules.length?`<section class="announced-section"><div class="section-title"><h2>Current faction system</h2><span>Live rules</span></div><div class="current-rule-list">${rules.map(rule=>`<p>${esc(rule.text)}</p>`).join('')}</div></section>`:''; }

function glossaryPage() {
  const entries=tooltipGlossaryEntries(snapshot);
  return `${titleBlock('Quick reference','Status & mechanics glossary','Search verified game wording without leaving the battle reference.')}
    <label class="search-label" for="glossary-search">Search the glossary</label><input class="wide-search" id="glossary-search" type="search" placeholder="Fire, Brittle, stamina…"><p id="glossary-count" class="result-count"></p>
    <div id="glossary-list" class="glossary-list">${entries.map(entry=>`<article data-search="${esc(`${entry.name} ${entry.text}`.toLowerCase())}"><header>${badge(entry.group,'quiet')}<h2>${esc(entry.name)}</h2></header><p>${esc(entry.text)}</p>${entry.tooltip?tooltipEvidenceMarkup(entry.tooltip):''}${entry.reviewStatus&&entry.reviewStatus!=='complete'?`<small>Definition is incomplete in the available evidence.</small>`:''}</article>`).join('')}</div><div id="glossary-empty" hidden>${empty('No glossary entries match','Try another status or mechanic.')}</div>`;
}

function notesPage() {
  return `${titleBlock('Development reference','Verified data notes','The player guide uses the frozen, source-reconciled Supabase read model. These notes are kept outside primary navigation.')}
    <div class="admin-note-grid">
      <section><h2>Published guide coverage</h2><ul><li>${snapshot.champions.length} champion variants</li><li>${snapshot.items.length} connected iconic items</li><li>${snapshot.legendaryAssault.length} Legendary Assault encounters</li><li>${snapshot.warRules.length} War rules</li><li>${snapshot.teams.length} observed team compositions</li></ul></section>
      <section><h2>Known evidence gaps</h2><p>Five historical source files remain prioritized for resupply. Their missing evidence is represented with unavailable or partial states in the guide; no text or outcome is inferred.</p><p>The permanent source completeness report and prioritized resupply manifest remain in the repository.</p></section>
    </div>`;
}

function recommendationsPage() {
  const dragons=strategySnapshot.targets.filter(row=>row.battleMode==='legendary-assault');
  const wars=strategySnapshot.targets.filter(row=>row.battleMode==='war');
  return `${titleBlock('Battle strategy','Choose your battle','Start with the fight in front of you. Each battle page explains its mechanics before the teams.')}
    <div class="strategy-battle-grid"><a class="strategy-mode battle-raid" href="raids.html#raid-attack"><h2>Raid Attack</h2><p>Choose the defense you face →</p></a><details class="strategy-mode-group battle-war"><summary><strong>War Teams</strong><span>Choose a battlefield rule</span></summary><div class="strategy-targets">${wars.map(row=>`<a href="war.html?rule=${encodeURIComponent(row.id)}">${esc(row.name)} →</a>`).join('')}</div></details><details class="strategy-mode-group battle-dragon"><summary><strong>Dragons</strong><span>Choose a Legendary Assault encounter</span></summary><div class="strategy-targets">${dragons.map(row=>`<a href="dragons.html#${slug(row.name)}">${esc(row.name)} →</a>`).join('')}</div></details><a class="strategy-mode battle-defense" href="raids.html#raid-defense"><h2>Raid Defense</h2><p>Compare defensive teams →</p></a></div>
    <section class="strategy-followup"><h2>Ask the guide</h2><p>Ask about a battle plan, champion, mechanic, faction, or item.</p>${conversationPanel()}</section>`;
}

function conversationPanel() {
  return `<section class="conversation-shell">
      <form id="conversation-form" class="conversation-form"><label class="sr-only" for="strategy-question">Ask GOT Legends Guide</label><textarea id="strategy-question" rows="2" placeholder="Who can use POISON? Or ask for a team against Drogon."></textarea><button type="submit">Ask guide</button></form>
      <div id="conversation-log" class="conversation-log" aria-live="polite" hidden></div>
    </section>`;
}

function teamOptionsMarkup(options,conversationTurn=null) {
  if(!options.length)return unavailable('The available mechanics do not support a five-person team recommendation for this battle yet.');
  return `<div class="team-options">${options.map((option,index)=>{const official=option.recommendationSource==='curated'||option.recommendationSource==='curated_partial';return `<details class="team-option" ${conversationTurn===null?'':`data-conversation-turn="${conversationTurn}" data-option-index="${index}"`} ${index===0?'open':''}><summary><span>Team Option ${index+1}</span><strong>${official?'Official In-Game Team':esc(option.strategyLabel||'Alternative Team')}</strong><small>${official?'Official recommendation':option.prebattlePlan?(option.referenceRecommendation?'Recorded reference':'Examined potential plan'):'Alternative team'}</small></summary>${recommendationMarkup(option)}</details>`;}).join('')}</div>`;
}

function raidOpponentMarkup(analysis) {
  const cards=analysis.members.map(champion=>`<article class="raid-enemy-member ${analysis.leader?.id===champion.id?'is-leader':''}">${portrait(champion,'card')}<div><strong>${esc(champion.name)}</strong><span>${esc([champion.gemColor,...champion.factions].filter(Boolean).join(' · '))}</span></div>${analysis.leader?.id===champion.id?badge('Leader','gold'):''}</article>`).join('');
  const factions=analysis.factionBonuses.map(row=>`<li><strong>${esc(row.factionName)} faction bonus:</strong> ${esc(row.bonusText)} <small>(${row.contributors.length} members: ${esc(row.contributors.map(champion=>champion.name).join(', '))})</small></li>`).join('');
  const allies=analysis.allyPairs.map(row=>`<li><strong>${esc(row.owner.name)} + ${esc(row.ally.name)} · ${esc(row.gemName)}:</strong> ${esc(row.effect)} <small>Verified card; current availability has not been rechecked.</small></li>`).join('');
  const leader=analysis.leaderFact?`<li><strong>${esc(analysis.leader.name)} · Leader:</strong> ${esc(analysis.leaderFact.factText)}</li>`:analysis.leader?`<li><strong>${esc(analysis.leader.name)} · Leader:</strong> No complete Leader wording is available.</li>`:'<li>Select the enemy Leader for complete matchup analysis.</li>';
  const highlights=analysis.highlights.map(row=>`<li><strong>${esc(row.title)}:</strong> ${esc(row.text)}</li>`).join('');
  const details=analysis.facts.map(fact=>`<li><strong>${esc(analysis.members.find(row=>row.id===fact.variantId)?.name)}:</strong> ${esc(fact.factText)}</li>`).join('');
  return `<section class="raid-opponent"><h3>Enemy Raid Defense</h3><div class="raid-enemy-team">${cards}</div><h3>Why this defense is strong</h3><ul class="raid-strengths">${factions||'<li>No documented faction threshold is met by this lineup.</li>'}${allies}${leader}${highlights}</ul><details class="enemy-facts"><summary>Opponent details</summary><ul>${details}</ul></details></section>`;
}

function recommendationMarkup(result) {
  if(result.status==='partial_curated') return partialRecommendationMarkup(result);
  if(result.status==='insufficient_evidence') return `<section class="recommendation-empty"><p class="eyebrow">Information unavailable</p><h2>${esc(result.target.name)}</h2><p>${esc(result.target.warning)}</p><p>I cannot build a team until the encounter mechanics are verified.</p></section>`;
  const teamCards=result.team.map((member,index)=>`<article class="recommendation-member"><header>${portrait(member.champion,'card')}<div><span>Position ${index+1}</span><h3>${esc(member.champion.name)}</h3><p>${esc([member.champion.gemColor,...member.champion.factions].filter(Boolean).join(' · '))}</p></div>${result.leader?.champion.id===member.champion.id?badge('Leader','gold'):''}</header>${capturedDevelopmentMarkup(member.champion)}<div class="member-contribution">${member.reasons.length?`<p>${esc(member.champion.name)}: ${member.reasons.map(row=>esc(row.fact||row.text)).join(' ')}</p>`:'<p>No separate source-backed battle contribution is established.</p>'}${member.item?`<p><strong>${esc(member.item.name)} · ${esc(member.itemState||'unknown')}</strong> ${member.itemState==='enabled'?'Enabled for this plan; effects still require their stated triggers.':'Not credited in this plan.'}</p>${member.itemState==='enabled'?`<p>${(member.item.abilities||[]).map(row=>esc(row.description||row.effect||row.text||'')).join(' ')}</p><p>Only documented mechanic matches are modeled; no additional item interaction with the other four champions is assumed.</p>`:''}`:''}</div></article>`).join('');
  const leader=result.leader?`<p class="team-leader">Leader: <strong>${esc(result.leader.champion.name)}</strong></p>`:'';
  const faction=result.factionBonuses?.length?`<p><strong>Faction bonus:</strong> ${result.factionBonuses.map(row=>`${esc(row.factionName)} — ${esc(row.bonusText)}`).join(' · ')}</p>`:'<p><strong>Faction bonus:</strong> No source-confirmed bonus activated.</p>';
  const allies=result.allyPairs?.length?`<p><strong>Ally pair:</strong> ${result.allyPairs.map(row=>`${esc(row.owner.name)} + ${esc(row.ally.name)} · ${esc(row.gemName)} (historical card; current availability unconfirmed)`).join(' · ')}</p>`:'';
  const leaderEffect=result.leader?.evidence?.factText?`<p><strong>Leader effect:</strong> ${esc(result.leader.evidence.factText)}</p>`:'';
  const synergy=['raid','war'].includes(result.target.battleMode)&&result.matchupReasons?`<div class="raid-team-synergy">${faction}${allies}${leaderEffect}<p>${esc(result.missingDataWarnings.find(row=>row.startsWith('This team ')||row.startsWith('This lineup '))||'')}</p></div>`:'';
  return `${snapshot.privateCollection?.latestEvidenceOnly?'<p class="recommendation-limit"><strong>Evidence limit:</strong> Ability review and battle modeling are incomplete. This is a supported suggestion, not a verified best team; unverified abilities and gear effects are not credited.</p>':''}${developmentNoticeMarkup(describeTeamDevelopment(result.team.map(member=>member.champion),result.rankingPolicy,snapshot.verifiedCollection))}<div class="recommendation-team">${teamCards}</div>${leader}${synergy}
    <section class="team-plan"><div><h3>Why It Works</h3><p>${esc(result.approach)}</p>${result.teamSynergy?.length?`<ul>${result.teamSynergy.filter(row=>row.score>0).map(row=>`<li>${esc(row.text)}</li>`).join('')}</ul>`:''}</div><div><h3>How to Play</h3><p>${esc(result.timing)}</p></div>${result.dangers.length?`<div><h3>Watch Out For</h3><p>${esc(result.dangers[0])}</p></div>`:''}</section>
    ${prebattlePlanMarkup(result)}
    ${wrathSynergyMarkup(result)}
    ${iceBrittleSynergyMarkup(result)}
    ${capturedAllyPairsMarkup(result)}
    ${conditionalEffectsMarkup(result)}
    <details class="team-secondary"><summary>Substitutes and alternatives</summary>${result.target.evidenceState==='insufficient'?'<p>No encounter-specific substitution is verified while the ability cards are unavailable.</p>':result.substitutes.length?`<ul>${result.substitutes.map(row=>`<li><strong>${esc(row.champion.name)}</strong> — ${esc(row.reason)}${capturedDevelopmentMarkup(row.champion)}</li>`).join('')}</ul>`:'<p>No role-preserving substitute is verified yet.</p>'}</details>
    <details class="evidence-details"><summary>Evidence and recommendation details</summary><p>${result.evidenceSummary.verifiedFacts} verified fact links · ${result.evidenceSummary.strategyInferences} deterministic inferences · ${result.evidenceSummary.communityObservations} community observations used as context only.</p>${result.curatedRecommendation?`<p><strong>Curated source:</strong> ${esc(result.curatedRecommendation.provenanceRef)} · ${Math.round(Number(result.curatedRecommendation.confidence)*100)}% confidence</p><p>${esc(result.curatedRecommendation.notes)}</p>`:''}<ul>${result.missingDataWarnings.map(row=>`<li>${esc(row)}</li>`).join('')}</ul></details>`;
}

function prebattlePlanMarkup(result) {
  const plan=result.prebattlePlan;
  if(!plan)return '';
  const comparison=result.comparison;
  const reference=result.referenceRecommendation;
  return `<section class="team-plan prebattle-summary"><div><h3>Prebattle comparison</h3><p>${comparison?esc(`${comparison.examinedTeamCount} complete candidate teams examined from ${comparison.candidateCount} eligible candidate variants (${comparison.modeledCandidateCount} with reviewed capability coverage; requested unmodeled variants stay flagged). ${comparison.scope}`):'This exact lineup is evaluated as a proposed sequence, not simulated combat.'}</p><p><strong>${esc(result.overallScore)} planning points</strong> · capped, auditable heuristics; not damage, victory chance, or a roster/development-aware verdict.</p>${reference?`<p>Recorded reference: ${esc(reference.provenanceRef)}. Preserved for comparison, not treated as proof of optimality.</p>`:''}<ol>${plan.steps.map(step=>`<li>${esc(step)}</li>`).join('')}</ol></div></section>
  <details class="evidence-details"><summary>Setup links, tradeoffs and score audit</summary><ul>${plan.dependencies.map(row=>`<li>${esc(row.text)} <small>${esc(row.sourceRefs.join(' · '))}</small></li>`).join('')}</ul><h3>Planning contributions</h3><ul>${plan.contributions.map(row=>`<li><strong>${row.score>0?'+':''}${esc(row.score)}</strong> ${esc(row.text)} <small>${esc(row.sourceRefs.join(' · '))}</small></li>`).join('')}</ul><h3>Tradeoffs</h3><ul>${plan.risks.map(row=>`<li>${esc(row.text)}</li>`).join('')}</ul><h3>Faction and Ally evidence</h3><ul>${plan.factions.map(row=>`<li>${esc(row.name)}: ${esc(row.status.replaceAll('_',' '))}${row.requiredMembers?` (${row.contributors.length}/${row.requiredMembers} source threshold)`:''}. ${esc(row.bonusText||'No complete bonus wording.')}</li>`).join('')}${plan.allyPairs.map(row=>`<li>${esc(row.gemName)}: ${esc(row.reason)}</li>`).join('')}</ul><p>${esc(plan.coverage.label)} Currentness: ${esc(plan.currentness)}. Unknowns remain visible; no active buff assumptions are needed to form this plan.</p></details>${prebattleSourceNotesMarkup(result)}`;
}

function wrathSynergyMarkup(result) {
  const model=result.wrathSynergy;
  if(!model||model.status==='not_applicable')return '';
  return `<details class="evidence-details"><summary>WRATH and shield triggers · narrow model</summary><p>${esc(model.score)} bounded structural-fit points. Shield, destruction, defeat and Leader events receive no inferred activation credit.</p>${model.opportunities.map(row=>`<article><strong>${esc(row.status.replaceAll('_',' '))}</strong><p>${esc(row.text)}</p><p class="subtle-note">${esc(row.sourceRefs.join(' · '))}</p></article>`).join('')}<ul>${model.limitations.map(text=>`<li>${esc(text)}</li>`).join('')}</ul></details>`;
}

function conditionalEffectsMarkup(result) {
  const evaluation=result.conditionalEffects;
  if(!evaluation)return '';
  const names=new Map(result.team.map(row=>[row.champion.id,row.champion.name]));
  return `<details class="evidence-details conditional-effects"><summary>Conditional effects and setup · partial source coverage</summary><p>${esc(evaluation.coverage.label)} Conditional setup contributes ${esc(evaluation.scoringContribution)} bounded heuristic points (zero unless source-currentness assumptions, source rank, recipient and timing are explicitly supplied for a scenario); this does not predict activation or victory.</p>
    ${evaluation.effects.map(effect=>`<article class="knowledge-fact"><strong>${esc(effect.name)} — ${esc(effect.status.replaceAll('_',' '))}</strong><p>${esc(effect.variantId?names.get(effect.variantId)||effect.variantId:result.target.name)}</p><p>${esc(effect.source.exactText)}</p><ul>${effect.reasons.map(reason=>`<li>${esc(reason)}</li>`).join('')}</ul><small>Source ${esc(effect.source.sourceId)} · ${esc(effect.source.table)} / ${esc(effect.source.recordId)} · source coverage ${esc(effect.source.reviewStatus)} · currentness not reverified · ${esc(effect.quantityApplicability.replaceAll('_',' '))}</small></article>`).join('')}
    ${evaluation.coverage.unmodeledVariantIds.length?`<p>No structured effects modeled yet for: ${evaluation.coverage.unmodeledVariantIds.map(id=>esc(names.get(id)||id)).join(', ')}.</p>`:''}</details>`;
}

function partialRecommendationMarkup(result) {
  const curated=result.curatedRecommendation;
  const members=curated.members.map(member=>{
    const champion=member.variantId?snapshot.champions.find(row=>row.id===member.variantId):null;
    return `<article class="recommendation-member ${champion?'':'unresolved-member'}"><header>${champion?portrait(champion,'card'):'<span class="portrait portrait-card portrait-unresolved" aria-hidden="true"></span>'}<div><span>Position ${member.position}</span><h3>${esc(champion?.name||member.displayName)}</h3><p>${champion?esc([champion.gemColor,...champion.factions].filter(Boolean).join(' · ')):'Variant not yet confirmed'}</p></div>${member.isLeader?badge('Leader','gold'):''}</header>${capturedDevelopmentMarkup(champion)}</article>`;
  }).join('');
  const unresolved=curated.members.filter(member=>member.identityStatus==='unresolved').map(member=>`${member.displayName} (position ${member.position})`);
  return `${snapshot.privateCollection?.latestEvidenceOnly?'<p class="recommendation-limit"><strong>Evidence limit:</strong> Ability review and battle modeling are incomplete. This is a supported suggestion, not a verified best team; unverified abilities and gear effects are not credited.</p>':''}${developmentNoticeMarkup(describeTeamDevelopment(curated.members.map(member=>snapshot.champions.find(row=>row.id===member.variantId)),{suppliedLineupKeptExact:true,summary:'This official lineup is kept exactly as recorded, not reranked for captured development. Level and power are dated build context.'},snapshot.verifiedCollection))}<div class="recommendation-team">${members}</div><p class="team-leader">Leader: <strong>${esc(curated.members.find(member=>member.isLeader)?.displayName||'Not recorded')}</strong></p><section class="team-plan"><div><h3>Why It Works</h3><p>${esc(result.target.approach)}</p></div><div><h3>How to Play</h3><p>${esc(result.target.timing)}</p></div><div><h3>Watch Out For</h3><p>${esc(result.target.warning)}</p></div></section><details class="team-secondary"><summary>Substitutes and alternatives</summary><p>Lineup-specific substitutes are not established. <a href="recommendations.html?q=${encodeURIComponent(`Give me another team for ${result.target.name}`)}">Compare another team</a>.</p></details><details class="evidence-details"><summary>Evidence and variant details</summary><p>Official in-game lineup supplied by the player. The original recommendation image is not connected to this record.</p><p>${esc(curated.notes)}</p>${unresolved.length?`<p>Unconfirmed positions: ${esc(unresolved.join(', '))}.</p>`:''}</details>`;
}

function knowledgeMarkup(answer) {
  const facts=(answer.facts||[]).map(row=>`<article class="knowledge-fact"><strong>${esc(row.title)}</strong><p>${esc(row.wording)}</p></article>`).join('');
  const entries=(answer.entries||[]).map(row=>`<article class="knowledge-card"><header>${portrait(row.champion,'team')}<div><h3>${championLink(row.champion)}</h3><p>${esc([row.champion.gemColor,...row.champion.factions].filter(Boolean).join(' · ')||'Affinity or faction unavailable')}</p></div></header>${row.facts.length?`<div class="knowledge-card-facts">${row.facts.map(fact=>`<section><strong>${fact.href?`<a href="${esc(fact.href)}">${esc(fact.title)}</a>`:esc(fact.title)}</strong><small>${esc(fact.kind||'Verified guidance')}</small><p>${esc(fact.wording)}</p></section>`).join('')}</div>`:''}</article>`).join('');
  return `<section class="knowledge-answer"><p class="eyebrow">Guide answer</p><h2>${esc(answer.title)}</h2><p>${esc(answer.summary)}</p>${facts?`<div class="knowledge-facts">${facts}</div>`:''}${iceBrittleSynergyMarkup(answer)}${entries?`<div class="knowledge-grid">${entries}</div>`:answer.showEmpty||!facts?`<p class="knowledge-empty">${esc(answer.emptyMessage)}</p>`:''}</section>`;
}

function mountRecommendations() {
  const form=document.querySelector('#conversation-form'),input=document.querySelector('#strategy-question'),log=document.querySelector('#conversation-log');
  let turn=0,optionsTurn=null;
  // Only a current option group can change follow-up focus. Nested evidence
  // details and older result groups must not silently switch the active team.
  log.addEventListener('toggle',event=>{
    const option=event.target;
    if(!option.matches?.('.team-option')||!option.open||optionsTurn===null||option.dataset.conversationTurn!==String(optionsTurn))return;
    conversationContext=selectConversationOption(conversationContext,Number(option.dataset.optionIndex));
    for(const sibling of option.parentElement.querySelectorAll('.team-option'))if(sibling!==option)sibling.open=false;
  },true);
  const ask=question=>{
    const text=question.trim(); if(!text)return;
    log.hidden=false;
    log.insertAdjacentHTML('beforeend',`<article class="player-message"><p>${esc(text)}</p></article>`);
    const knowledge=answerGuideQuestion({question:text,guideData:snapshot,strategyData:strategySnapshot,context:conversationContext});
    if(knowledge.status==='ready') log.insertAdjacentHTML('beforeend',`<article class="guide-message knowledge-message"><span class="guide-avatar" aria-hidden="true">G</span><div>${knowledgeMarkup(knowledge)}</div></article>`);
    else if(knowledge.status==='needs_clarification') log.insertAdjacentHTML('beforeend',`<article class="guide-message"><span class="guide-avatar" aria-hidden="true">G</span><div><strong>One quick detail</strong><p>${esc(knowledge.message)}</p></div></article>`);
    else {
      const answer=answerStrategyQuestion({question:text,guideData:snapshot,strategyData:strategySnapshot,context:conversationContext});
      if(answer.status!=='ready') {log.insertAdjacentHTML('beforeend',`<article class="guide-message"><span class="guide-avatar" aria-hidden="true">G</span><div><strong>One quick detail</strong><p>${esc(answer.message)}</p></div></article>`);input.value='';return;}
      if(answer.context.options!==conversationContext.options)optionsTurn=null;
      conversationContext=answer.context;
      if(answer.request.intent==='recommendation')optionsTurn=++turn;
      let intro=`${answer.options.length} team option${answer.options.length===1?'':'s'} for this battle.`;
      if(answer.result.recommendationSource==='curated')intro='The official in-game team appears first. Other approaches follow where supported.';
      if(answer.result.status==='partial_curated')intro='Here is the official in-game team.';
      if(answer.request.intent==='substitution')intro=answer.replacementPlan?'I replaced that exact variant and kept the other four champions.':'I rebuilt the team without that exact variant.';
      if(answer.request.intent==='alternate')intro=`Another approach: ${esc(answer.result.strategyLabel||'Team option')}.`;
      if(answer.request.intent==='leader')intro=`Use ${esc(answer.result.leader?.champion.name||answer.result.curatedRecommendation?.members.find(member=>member.isLeader)?.displayName||'the Leader shown below')}.`;
      if(answer.request.intent==='how_to')intro=`${esc(answer.result.approach||answer.result.target.approach)} ${esc(answer.result.timing||answer.result.target.timing)}`;
      if(answer.request.intent==='explanation')intro=esc(teamExplanationIntro(answer));
      const showTeam=answer.result.status==='partial_curated'||['recommendation','substitution','alternate'].includes(answer.request.intent);
      const details=answer.enemyThreats?.length?`<details class="enemy-facts"><summary>Verified opposing champion facts</summary><ul>${answer.enemyThreats.map(row=>`<li><strong>${esc(row.champion)}:</strong> ${esc(row.text)}</li>`).join('')}</ul><p>Exact counter priority is not established by the verified rules. The attack teams below are general Raid options, not matchup-proven victories.</p></details>`:'';
      log.insertAdjacentHTML('beforeend',`<article class="guide-message strategy-answer"><span class="guide-avatar" aria-hidden="true">G</span><div><p class="answer-intro">${intro}</p>${details}${teamExplanationMarkup(answer)}${showTeam?(answer.request.intent==='recommendation'?teamOptionsMarkup(answer.options,optionsTurn):recommendationMarkup(answer.result)):(prebattlePlanMarkup(answer.result)+iceBrittleSynergyMarkup(answer.result)+capturedAllyPairsMarkup(answer.result)+conditionalEffectsMarkup(answer.result))}</div></article>`);
    }
    input.value=''; log.lastElementChild?.scrollIntoView({behavior:'smooth',block:'start'});
  };
  form.addEventListener('submit',event=>{event.preventDefault();ask(input.value);});
  document.querySelectorAll('[data-prompt]').forEach(button=>button.addEventListener('click',()=>ask(button.dataset.prompt)));
  return ask;
}

function mountBattleSections() {
  if(view==='teams') {
    const target=document.querySelector('#library-target'),mechanic=document.querySelector('#library-mechanic'),faction=document.querySelector('#library-faction'),output=document.querySelector('#library-options');
    const update=()=>{
      const options=buildTeamOptions({guideData:snapshot,strategyData:strategySnapshot,targetId:target.value});
      const filtered=options.filter(row=>{
        if(row.status==='partial_curated')return !mechanic.value&&!faction.value;
        return (!mechanic.value||row.team.some(member=>member.scoringContributions.some(fact=>fact.mechanicId===mechanic.value)))&&(!faction.value||row.team.some(member=>member.champion.factions.includes(faction.value)));
      });
      output.innerHTML=filtered.length?teamOptionsMarkup(filtered):empty('No teams match these filters','Clear a mechanic or faction to see more supported teams.');
    };
    for(const control of [target,mechanic,faction])control.addEventListener('change',update);
    update();
  }
  if(view==='war') {
    const target=document.querySelector('#war-target'),output=document.querySelector('#war-team-options');
    const update=()=>{
      const selected=strategySnapshot.targets.find(row=>row.id===target.value);
      const rule=snapshot.warRules.find(row=>row.name===selected?.name);
      const mechanics=[...new Set(strategySnapshot.rules.filter(row=>row.targetId===target.value&&row.mechanicId).map(row=>strategySnapshot.mechanics.find(mechanic=>mechanic.id===row.mechanicId)?.name).filter(Boolean))].slice(0,5);
      output.innerHTML=`<section class="war-battle-context"><p class="eyebrow">War</p><h2>${esc(selected?.name||'War battlefield')}</h2><div><h3>Key Battle Rule</h3><p>${esc(rule?.effect||'Verified rule wording is unavailable.')}</p></div><div><h3>What It Changes</h3><p>${esc(selected?.approach||'Battle guidance is unavailable.')}</p></div><div><h3>Key Mechanics</h3>${mechanics.length?`<p>${esc(mechanics.join(' · '))}</p>`:'<p>See the verified battlefield rule above.</p>'}</div>${rule?.phaseRule?`<p class="war-phase"><strong>When it matters:</strong> ${esc(rule.phaseRule)}</p>`:''}</section><h2 class="recommendations-heading">Recommended Teams</h2>${teamOptionsMarkup(buildTeamOptions({guideData:snapshot,strategyData:strategySnapshot,targetId:target.value}))}`;
    };
    const requested=new URLSearchParams(location.search).get('rule');
    if(requested&&[...target.options].some(option=>option.value===requested))target.value=requested;
    target.addEventListener('change',update);update();
  }
  if(view==='raid') {
    const controls=[...document.querySelectorAll('.enemy-select')],leaderSelect=document.querySelector('#enemy-leader'),status=document.querySelector('#enemy-input-status'),enemyTeam=document.querySelector('#raid-enemy-team'),output=document.querySelector('#raid-attack-options');
    let selection=resetRaidSelection();
    const update=()=>{
      const ids=controls.map(row=>row.value).filter(Boolean),unique=new Set(ids);
      selection=raidSelectionTransition(selection,{enemyVariantIds:controls.map(row=>row.value),leaderVariantId:leaderSelect.value});
      enemyTeam.replaceChildren();output.replaceChildren();output.removeAttribute('data-defense-signature');
      const chosen=ids.map(id=>snapshot.champions.find(row=>row.id===id));
      leaderSelect.innerHTML=`<option value="">Select the enemy Leader</option>${chosen.map(row=>`<option value="${esc(row.id)}">${esc(row.name)}</option>`).join('')}`;
      leaderSelect.value=selection.leaderVariantId||'';
      if(ids.length!==unique.size){status.textContent='Choose five different exact champion variants.';return;}
      if(ids.length!==5){status.textContent=`${ids.length} of 5 opposing variants selected.`;return;}
      const analysis=analyzeRaidDefense({guideData:snapshot,strategyData:strategySnapshot,enemyVariantIds:ids,leaderVariantId:selection.leaderVariantId});
      selection.analysis=analysis;
      enemyTeam.innerHTML=raidOpponentMarkup(analysis);
      if(!selection.leaderVariantId){status.textContent='Select the enemy Leader for complete matchup analysis.';return;}
      status.textContent='Matchup recalculated for these five defenders and the selected Leader.';
      selection.recommendations=buildTeamOptions({guideData:snapshot,strategyData:strategySnapshot,targetId:'raid:attack',raidDefense:analysis,limit:3});
      output.dataset.defenseSignature=analysis.signature;
      output.innerHTML=`<h3 class="recommendations-heading">Recommended Counter Teams</h3>${teamOptionsMarkup(selection.recommendations)}`;
    };
    controls.forEach(row=>row.addEventListener('change',update));
    leaderSelect.addEventListener('change',update);
    document.querySelector('#reset-raid').addEventListener('click',()=>{controls.forEach(row=>{row.value='';});leaderSelect.value='';selection=resetRaidSelection();update();});
    update();
  }
}

function render() {
  const renderers={home:homePage,recommendations:recommendationsPage,champions:championsPage,teams:teamsPage,raid:raidPage,war:warPage,'legendary-assault':legendaryAssaultPage,factions:factionsPage,glossary:glossaryPage,notes:notesPage};
  root.innerHTML=(renderers[view]||homePage)();

  if(view==='champions') mountChampionFilters();
  if(view==='glossary') mountSimpleSearch('#glossary-search','.glossary-list article','#glossary-count','entry','#glossary-empty');
  if(['teams','war','raid'].includes(view))mountBattleSections();
  if(view==='recommendations') {
    const ask=mountRecommendations();
    const initialQuestion=new URLSearchParams(location.search).get('q');
    if(initialQuestion) ask(initialQuestion);
  }
  if(view==='home') {
    const ask=mountRecommendations();
    document.querySelector('#home-strategy-form').addEventListener('submit',event=>{
      event.preventDefault();
      const input=document.querySelector('#home-search');
      const question=input.value.trim();
      if(!question)return;
      document.querySelector('#home-strategy-result').hidden=false;
      ask(question);
      document.querySelector('#home-strategy-result').scrollIntoView({behavior:'smooth',block:'start'});
    });
  }
  if(view==='legendary-assault' && location.hash) {
    const encounter=document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if(encounter) requestAnimationFrame(()=>encounter.scrollIntoView({block:'start'}));
  }
}

renderShell();
const requiresStrategy = ['home','recommendations','legendary-assault','teams','war','raid'].includes(view);
const readiness = createDataReadiness({ onChange: result => {
  // Remove previous advice before every refresh; stale catalog data never drives recommendations.
  clearLocalHandoffControls();
  snapshot = result.guide;
  strategySnapshot = result.strategy;
  conversationContext = {};
  root.innerHTML = '';
  state.hidden = false;
  state.className = `data-readiness data-${result.status}`;
  state.innerHTML = readinessMarkup(result);
  state.querySelector('[data-retry]')?.addEventListener('click', () => readiness.load(requiresStrategy));
  const details = document.querySelector('#guide-details');
  if(details) details.open = result.status !== 'ready';
  if (result.status === 'ready') render();
  if (result.status === 'ready') clearLocalHandoffControls = mountLocalHandoffControls({anchor:state,guideData:result.guide,strategyData:result.strategy,onApply:imported=>{snapshot=imported.guideData;strategySnapshot=imported.strategyData;conversationContext={};render();state.innerHTML=readinessMarkup({...result,guide:snapshot});state.querySelector('[data-retry]')?.addEventListener('click',()=>readiness.load(requiresStrategy));},onReset:()=>{snapshot=result.guide;strategySnapshot=result.strategy;conversationContext={};render();state.innerHTML=readinessMarkup(result);state.querySelector('[data-retry]')?.addEventListener('click',()=>readiness.load(requiresStrategy));}});
} });
if (!await mountPrivateGuideIfEnabled({anchor:state, content:root, requiresStrategy, onClear:()=>{clearLocalHandoffControls();snapshot=null;strategySnapshot=null;conversationContext={};root.innerHTML='';},onReady:result=>{snapshot=result.guide;strategySnapshot=result.strategy;conversationContext={};render();}})) await readiness.load(requiresStrategy);
