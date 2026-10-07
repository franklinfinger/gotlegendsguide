import { getGuideData, getStrategyData } from './supabase-client.js';
import { parseStrategyQuestion, recommendTeam } from './strategy-engine.js';

const root = document.querySelector('#guide-content');
const state = document.querySelector('#guide-state');
const view = document.body.dataset.view || 'home';
let snapshot;
let strategySnapshot;

const pages = [
  ['home','Home','index.html'], ['recommendations','Strategy','recommendations.html'], ['champions','Champions','champions.html'],
  ['items','Items','items.html'], ['teams','Teams','builder.html'],
  ['raid','Raid','raids.html'], ['war','War','war.html'],
  ['legendary-assault','Legendary Assault','dragons.html'],
  ['factions','Factions','factions.html'], ['glossary','Status & mechanics','status-effects.html']
];
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const slug = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const cleanName = value => String(value || '').split(' — ')[0].trim();
const badge = (text, tone='') => `<span class="badge ${tone}">${esc(text)}</span>`;
const empty = (title, copy) => `<div class="empty-state"><span class="empty-icon" aria-hidden="true">◇</span><h2>${esc(title)}</h2><p>${esc(copy)}</p></div>`;

function renderShell() {
  const desktop = pages.map(([id,label,href]) => `<a href="${href}" ${id===view?'aria-current="page"':''}>${esc(label)}</a>`).join('');
  document.querySelector('#site-header').innerHTML = `<div class="shell header-inner">
    <a class="wordmark" href="index.html" aria-label="GOT Legends Guide home"><span class="brand-mark" aria-hidden="true">G</span><span><strong>GOT LEGENDS GUIDE</strong><small>Old Peeps on Porches</small></span></a>
    <button class="menu-button" type="button" aria-expanded="false" aria-controls="site-menu"><span></span><span></span><span></span><span class="sr-only">Open guide menu</span></button>
    <nav id="site-menu" class="site-menu" aria-label="Guide sections">${desktop}</nav></div>`;
  const mobile = [pages[0],pages[2],pages[1],['battle','Battle','raids.html'],pages[9]];
  document.querySelector('#mobile-nav').innerHTML = mobile.map(([id,label,href]) => `<a href="${href}" ${id===view || (id==='battle'&&['raid','war','legendary-assault'].includes(view))?'aria-current="page"':''}><span class="mobile-icon" aria-hidden="true">${{home:'⌂',recommendations:'◇',champions:'♙',battle:'⚔',glossary:'≡'}[id]}</span><span>${esc(label)}</span></a>`).join('');
  document.querySelector('#site-footer').innerHTML = `<div class="shell footer-inner"><div><strong>GOT Legends Guide</strong><span>Practical battle reference for Old Peeps on Porches.</span></div><div class="system-links"><a href="health.html">System status</a><a href="strategy.html">Data notes</a></div></div>`;
  const button = document.querySelector('.menu-button');
  const menu = document.querySelector('#site-menu');
  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!open));
    menu.classList.toggle('open', !open);
  });
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
  const withPortraits = snapshot.champions.filter(c=>c.portrait).slice(0,5);
  const actions = [
    ['Raid','Choose attack and defense information quickly.','raids.html','ember'],
    ['War','Read every verified battlefield rule.','war.html','moss'],
    ['Legendary Assault','Prepare for all four represented encounters.','dragons.html','danger'],
    ['Champions','Find a variant, skill, trait, faction, or item.','champions.html','ice'],
    ['Teams','Browse observed lineups without victory claims.','builder.html','moss'],
    ['Status & mechanics','Look up exact mechanic wording.','status-effects.html','ice']
  ];
  return `<section class="home-hero"><div>${titleBlock('Old Peeps on Porches · Battle reference','Find the next right move.','Look up the champion, mode, rule, or mechanic you need while the battle is still in front of you.')}
    <form class="quick-find" action="champions.html"><label for="home-search">Find a champion</label><div><input id="home-search" name="q" type="search" placeholder="Name, color, or faction…" autocomplete="off"><button type="submit">Search</button></div></form>
    <div class="quick-links"><a href="dragons.html#drogon">Drogon</a><a href="war.html">War rules</a><a href="factions.html">Faction bonuses</a></div></div>
    <aside class="hero-panel"><p class="panel-label">Verified champion guide</p><div class="portrait-stack">${withPortraits.map(c=>portrait(c,'hero')).join('')}</div><p><strong>${snapshot.champions.length} variants</strong><span>Portrait-led details, exact abilities, and connected items.</span></p></aside></section>
    <section class="home-section"><div class="section-title"><h2>What are you trying to do?</h2><span>Choose a path</span></div><div class="action-grid">${actions.map(([title,copy,href,tone])=>`<a class="action-tile ${tone}" href="${href}"><span class="action-rule"></span><h3>${title}</h3><p>${copy}</p><span class="action-arrow" aria-hidden="true">→</span></a>`).join('')}</div></section>`;
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
  const subtle = champion.releaseState==='unverified' ? `<p class="subtle-note">This distinct variant is source-backed; current availability is not confirmed.</p>` : '';
  return `<details class="champion-card" data-search="${esc(`${champion.name} ${champion.gemColor||''} ${champion.rarity||''} ${champion.factions.join(' ')}`.toLowerCase())}" data-color="${esc((champion.gemColor||'unknown').toLowerCase())}" data-factions="${esc(champion.factions.join('|').toLowerCase())}" ${open?'open':''}>
    <summary><span class="champion-summary">${portrait(champion)}<span class="champion-identity"><strong>${esc(champion.name)}</strong><span>${esc([champion.rarity,champion.gemColor].filter(Boolean).join(' · ')||'Classification unavailable')}</span><span>${esc(champion.factions.join(' · ')||'Faction not recorded')}</span></span><span class="expand-mark" aria-hidden="true">＋</span></span></summary>
    <div class="champion-detail">${subtle}<div class="detail-grid"><section><h3>Skill</h3>${skills.length?skills.map(abilityBlock).join(''):unavailable('No verified skill card is available for this variant.')}</section><section><h3>Traits</h3>${traits.length?traits.map(abilityBlock).join(''):unavailable('No verified trait card is available for this variant.')}</section></div>
    <section class="linked-items"><h3>Iconic item</h3>${items.length?items.map(item=>`<a class="item-link" href="items.html#${esc(item.id)}"><strong>${esc(item.name)}</strong><span>${esc(item.abilities[0]?.name||'View item ability')}</span></a>`).join(''):unavailable('No verified champion-item relationship is available.')}</section></div></details>`;
}

function abilityBlock(ability) {
  const partial = ability.reviewStatus && ability.reviewStatus!=='complete';
  const name = /^title not visible/i.test(ability.name||'') ? 'Trait title unavailable' : ability.name;
  return `<article class="ability-block"><div><strong>${esc(name)}</strong>${partial?badge('Partial','quiet'):''}</div><p>${esc(ability.text||'Wording unavailable.')}</p></article>`;
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

function itemsPage() {
  return `${titleBlock('Champion equipment','Items','Browse every verified iconic item, its champion relationship, and its complete recorded ability wording.')}
    <label class="search-label" for="item-search">Search items or champions</label><input class="wide-search" id="item-search" type="search" placeholder="Item or champion name…"><p id="item-count" class="result-count"></p>
    <div id="item-list" class="item-grid">${snapshot.items.map(item=>{const owner=snapshot.champions.find(c=>c.id===item.ownerVariantId);return `<article class="item-card" id="${esc(item.id)}" data-search="${esc(`${item.name} ${item.ownerName||''}`.toLowerCase())}"><div class="item-owner">${portrait(owner,'small')}<span><small>Iconic item for</small>${championLink(owner,item.ownerName||'Champion unavailable')}</span></div><h2>${esc(item.name)}</h2>${item.abilities.length?item.abilities.map(abilityBlock).join(''):unavailable('Verified ability wording is unavailable.')}</article>`}).join('')}</div><div id="item-empty" hidden>${empty('No items match','Try another item or champion name.')}</div>`;
}
function mountSimpleSearch(inputSelector,cardSelector,countSelector,label,emptySelector) {
  const input=document.querySelector(inputSelector), cards=[...document.querySelectorAll(cardSelector)], count=document.querySelector(countSelector);
  const emptyState=document.querySelector(emptySelector);
  const render=()=>{const q=input.value.trim().toLowerCase();let shown=0;cards.forEach(card=>{const ok=!q||card.dataset.search.includes(q);card.hidden=!ok;if(ok)shown++;});count.textContent=`${shown} ${label}${shown===1?'':'s'}`;if(emptyState)emptyState.hidden=shown!==0;};input.addEventListener('input',render);render();
}

function teamPortrait(member) { const champ=championForName(member.name,member.gemColor); return `<div class="team-member">${portrait(champ,'team')}<strong>${esc(member.name)}</strong>${member.isLeader?badge('Leader','gold'):''}</div>`; }
function teamsPage() {
  return `${titleBlock('Community examples','Observed teams','These are source-backed team compositions. They are examples to study, not claims of proven victories.')}
    <div class="context-note"><strong>How to use this page</strong><span>Look for familiar cores and champion relationships. Battle outcomes were not shown in the source images.</span></div>
    <p class="result-count">${snapshot.teams.length} observed compositions</p><div class="team-grid">${snapshot.teams.map((team,index)=>`<article class="team-card"><header><span>Observed team ${String(index+1).padStart(2,'0')}</span>${badge('Community example','quiet')}</header><div class="team-lineup">${team.members.map(teamPortrait).join('')}</div></article>`).join('')}</div>`;
}

function raidPage() {
  const groups=Object.groupBy?Object.groupBy(snapshot.raidRules,r=>r.category):snapshot.raidRules.reduce((a,r)=>((a[r.category]??=[]).push(r),a),{});
  const attack=snapshot.strategyTeams.filter(t=>/attack/i.test(t.role||''));
  const defense=snapshot.strategyTeams.filter(t=>/defen/i.test(t.role||''));
  const groupCards=Object.entries(groups).map(([category,rules])=>`<section class="rule-group"><h2>${esc(category)}</h2>${rules.map(r=>`<p>${esc(r.text)}</p>`).join('')}</section>`).join('');
  return `${titleBlock('Battle mode','Raid','Use the verified rules to understand opponent choice, attacks, defense, points, rewards, refreshes, leaderboard zones, and team testing.')}
    <div class="raid-rule-grid">${groupCards||empty('Raid information unavailable','No verified Raid rules could be loaded.')}</div>
    <section class="split-section"><div><p class="eyebrow">Attacking</p><h2>Attack examples</h2><p>Your attacking team is the lineup you take into the selected opponent.</p>${teamExampleList(attack)}</div><div><p class="eyebrow">Defending</p><h2>Defense examples</h2><p>Your defensive team is the lineup other players face.</p>${teamExampleList(defense)}</div></section>
    <section class="reference-strip"><div><strong>Team testing</strong><span>${esc(snapshot.raidTeams[0]?.context||'No separate verified test-team context is available.')}</span></div>${snapshot.raidTeams[0]?`<div class="mini-lineup">${snapshot.raidTeams[0].members.map(teamPortrait).join('')}</div>`:''}</section>`;
}
function teamExampleList(teams) { return teams.length?teams.map(t=>`<article class="compact-team"><span>${esc(t.mode)} · ${esc(t.role)}</span><div>${t.members.map(m=>championLink(championForName(m.name,m.gemColor),m.name)).join(' · ')}</div></article>`).join(''):unavailable('No separately labeled examples are available for this role.'); }

function warPage() {
  return `${titleBlock('Alliance War','War battlefield rules','Scan the outpost value, battlefield effect, and the phase where each verified rule matters.')}
    <div class="war-grid">${snapshot.warRules.map(rule=>`<article class="war-card"><header><span>${esc(rule.points.toLocaleString())}</span><small>victory points</small></header><h2>${esc(rule.name)}</h2><dl><div><dt>Battlefield effect</dt><dd>${esc(rule.effect)}</dd></div><div><dt>When it matters</dt><dd>${esc(rule.phaseRule)}</dd></div></dl></article>`).join('')}</div>`;
}

function legendaryAssaultPage() {
  return `${titleBlock('Dragon battles','Legendary Assault','Choose an encounter for verified abilities and battle tips. Missing evidence stays visible without guessed mechanics.')}
    <nav class="encounter-tabs" aria-label="Legendary Assault encounters">${snapshot.legendaryAssault.map(e=>`<a href="#${slug(e.id)}">${esc(e.name)}</a>`).join('')}</nav>
    <div class="encounter-list">${snapshot.legendaryAssault.map(e=>`<section class="encounter" id="${slug(e.id)}"><header><div><p class="eyebrow">Legendary Assault</p><h2>${esc(e.name)}</h2><p>${esc(e.subtitle||'Dragon encounter')}</p></div><span class="dragon-mark" aria-hidden="true">♜</span></header><div class="encounter-columns"><div><h3>Abilities</h3>${e.abilities.length?e.abilities.map(abilityBlock).join(''):unavailable(`Ability cards for ${e.name} are not available in the verified sources.`)}</div><div><h3>Verified battle tips</h3>${e.tips.length?`<ul class="tip-list">${e.tips.map(t=>`<li>${esc(t.text)}</li>`).join('')}</ul>`:unavailable(`No verified encounter tips are available for ${e.name}.`)}</div></div></section>`).join('')}</div>`;
}

function factionsPage() {
  const current=snapshot.factions.filter(f=>f.rules.some(r=>r.kind==='current_bonus'));
  return `${titleBlock('Current team bonuses','Factions','Review current bonuses and play descriptions separately from announced future changes.')}
    <div class="faction-grid">${current.map(f=>{const bonus=f.rules.find(r=>r.kind==='current_bonus'),play=f.rules.find(r=>r.kind==='how_to_play');const members=f.memberVariantIds.map(id=>snapshot.champions.find(c=>c.id===id)).filter(Boolean);return `<article class="faction-card"><header><span class="faction-sigil" aria-hidden="true">${esc(f.name[0])}</span><div><h2>${esc(f.name)}</h2><span>${members.length} represented variant${members.length===1?'':'s'}</span></div></header><section><h3>Current bonus</h3><p>${esc(bonus?.text||'Current bonus unavailable.')}</p></section>${play?`<section><h3>How it plays</h3><p>${esc(play.text)}</p></section>`:''}<div class="member-row">${members.slice(0,8).map(c=>`<a href="champions.html?champion=${encodeURIComponent(c.id)}" title="${esc(c.name)}">${portrait(c,'tiny')}</a>`).join('')}</div></article>`}).join('')}</div>
    <section class="announced-section"><div class="section-title"><h2>Announced future changes</h2><span>Separate from current bonuses</span></div>${announcements()}</section>`;
}
function announcements() { const rows=snapshot.announcements.flatMap(update=>update.factions.map(f=>({update,f}))); return rows.length?`<div class="announced-grid">${rows.map(({update,f})=>`<article><header>${badge('Announced','announced')}<strong>${esc(f.name)}</strong></header>${f.playstyle?`<p>${esc(f.playstyle)}</p>`:''}${f.bonus?`<p><strong>Announced bonus:</strong> ${esc(f.bonus)}</p>`:''}<small>${esc(update.title)}${update.date?` · ${esc(update.date)}`:''}</small></article>`).join('')}</div>`:unavailable('No announced changes are available.'); }

function glossaryPage() {
  const entries=[...snapshot.statuses.map(x=>({...x,group:'Status'})),...snapshot.mechanics.map(x=>({...x,group:'Mechanic'}))];
  return `${titleBlock('Quick reference','Status & mechanics glossary','Search verified game wording without leaving the battle reference.')}
    <label class="search-label" for="glossary-search">Search the glossary</label><input class="wide-search" id="glossary-search" type="search" placeholder="Fire, Brittle, stamina…"><p id="glossary-count" class="result-count"></p>
    <div id="glossary-list" class="glossary-list">${entries.map(entry=>`<article data-search="${esc(`${entry.name} ${entry.text}`.toLowerCase())}"><header>${badge(entry.group,'quiet')}<h2>${esc(entry.name)}</h2></header><p>${esc(entry.text)}</p>${entry.reviewStatus&&entry.reviewStatus!=='complete'?`<small>Definition is incomplete in the available evidence.</small>`:''}</article>`).join('')}</div><div id="glossary-empty" hidden>${empty('No glossary entries match','Try another status or mechanic.')}</div>`;
}

function notesPage() {
  return `${titleBlock('Development reference','Verified data notes','The player guide uses the frozen, source-reconciled Supabase read model. These notes are kept outside primary navigation.')}
    <div class="admin-note-grid">
      <section><h2>Published guide coverage</h2><ul><li>${snapshot.champions.length} champion variants</li><li>${snapshot.items.length} connected iconic items</li><li>${snapshot.legendaryAssault.length} Legendary Assault encounters</li><li>${snapshot.warRules.length} War rules</li><li>${snapshot.teams.length} observed team compositions</li></ul></section>
      <section><h2>Known evidence gaps</h2><p>Five historical source files remain prioritized for resupply. Their missing evidence is represented with unavailable or partial states in the guide; no text or outcome is inferred.</p><p>The permanent source completeness report and prioritized resupply manifest remain in the repository.</p></section>
    </div>`;
}

function recommendationsPage() {
  const modes = [['legendary-assault','Legendary Assault'],['raid','Raid'],['war','War']];
  const targets = strategySnapshot.targets.filter(target=>target.battleMode==='legendary-assault');
  return `${titleBlock('Deterministic strategy engine','Strategy recommendations','Build a five-champion team from verified mechanics, explicit encounter rules, and reviewed battlefield effects.')}
    <section class="strategy-workbench">
      <form id="question-form" class="question-form"><label for="strategy-question">Ask a supported strategy question</label><div><input id="strategy-question" type="search" placeholder="What is the strongest team to fight Drogon?"><button type="submit">Use question</button></div><p id="question-feedback" class="form-feedback" role="status">Questions are parsed locally. Unsupported wording will return you to the selectors.</p></form>
      <div class="strategy-controls"><label>Battle mode<select id="strategy-mode">${modes.map(([id,label])=>`<option value="${id}">${label}</option>`).join('')}</select></label><label>Target or rule<select id="strategy-target">${targets.map(target=>`<option value="${esc(target.id)}">${esc(target.name)}</option>`).join('')}</select></label></div>
      <div class="exclusion-control"><label for="strategy-exclude">Exclude an exact champion variant <span>optional</span></label><div><input id="strategy-exclude" list="champion-options" placeholder="Search an exact variant…"><button id="add-exclusion" type="button">Exclude</button></div><datalist id="champion-options">${snapshot.champions.map(champion=>`<option value="${esc(champion.name)}"></option>`).join('')}</datalist><div id="exclusion-list" class="exclusion-list"></div><p id="exclusion-feedback" class="form-feedback" role="status"></p></div>
      <button id="recommend-team" class="recommend-button" type="button">Recommend Team</button>
      <p class="scope-note">“Strongest” means strongest verified strategic fit. Your owned champions, power, stars, levels, and gear are not included.</p>
    </section>
    <div id="recommendation-result" class="recommendation-result" aria-live="polite"></div>`;
}

function evidenceLabel(category) {
  return category==='community_observed'?'Observed example':category==='verified_fact'?'Verified fact':'Strategy inference';
}

function renderRecommendation(result) {
  const resultRoot=document.querySelector('#recommendation-result');
  if(result.status==='insufficient_evidence') {
    resultRoot.innerHTML=`<section class="recommendation-empty"><p class="eyebrow">Insufficient evidence</p><h2>${esc(result.target.name)}</h2><p>${esc(result.target.warning)}</p><p>No team was generated, because doing so would require inventing encounter mechanics.</p></section>`;
    return;
  }
  const teamCards=result.team.map((member,index)=>`<article class="recommendation-member"><header>${portrait(member.champion,'card')}<div><span>Selection ${index+1}</span><h3>${esc(member.champion.name)}</h3><p>${esc([member.champion.gemColor,...member.champion.factions].filter(Boolean).join(' · '))}</p></div>${result.leader?.champion.id===member.champion.id?badge('Leader','gold'):''}</header><p class="member-role">${esc(member.roles.join(' · '))}</p><div class="selection-score">Strategic fit ${esc(member.score)}</div><ul>${member.reasons.map(reason=>`<li><span>${esc(reason.text)}</span><small>+${esc(reason.score)} · ${evidenceLabel(reason.evidenceCategory)} · ${Math.round(reason.confidence*100)}% confidence</small></li>`).join('')}</ul>${member.item?`<a class="recommended-item" href="items.html#${esc(member.item.id)}">Iconic item: ${esc(member.item.name)}</a>`:''}${member.substitute?`<div class="member-substitute"><strong>If unavailable: ${esc(member.substitute.champion.name)}</strong><span>${esc(member.substitute.reason)}</span></div>`:''}${member.dangers.length?`<div class="member-warning">${member.dangers.map(row=>esc(row.text)).join(' ')}</div>`:''}</article>`).join('');
  const leader=result.leader?`<div class="leader-callout"><span>${portrait(result.leader.champion,'small')}</span><div><strong>Recommended leader: ${esc(result.leader.champion.name)}</strong><p>${esc(result.leader.evidence?.factText||'A reviewed Leader effect supports this choice.')}</p></div></div>`:unavailable('No Leader effect has enough supporting evidence for this team.');
  resultRoot.innerHTML=`<section class="recommendation-summary"><div><p class="eyebrow">${esc(result.target.name)}</p><h2>Recommended five</h2><p>${esc(result.approach)}</p></div><dl><div><dt>Team score</dt><dd>${esc(result.overallScore)}</dd></div><div><dt>Confidence</dt><dd>${esc(result.confidence)}</dd></div></dl></section>${leader}<div class="recommendation-team">${teamCards}</div>
    <section class="strategy-explanation-grid"><article><h2>Why the team works</h2><ul>${result.teamSynergy.map(row=>`<li>${esc(row.text)} <small>${evidenceLabel(row.evidenceCategory)}</small></li>`).join('')||'<li>Selections are driven by their individual target fit.</li>'}</ul></article><article><h2>Battle approach and timing</h2><p>${esc(result.approach)}</p><p>${esc(result.timing)}</p></article><article><h2>Important dangers</h2><ul>${result.dangers.map(row=>`<li>${esc(row)}</li>`).join('')}</ul></article><article><h2>Evidence used</h2><p>${result.evidenceSummary.verifiedFacts} verified fact links · ${result.evidenceSummary.strategyInferences} strategy inferences · ${result.evidenceSummary.communityObservations} observed composition links.</p><p>${result.candidateStats.considered} exact variants considered; ${result.candidateStats.eligible} eligible; ${result.candidateStats.pruned} scored in the final search pool.</p></article></section>
    <section class="substitute-section"><h2>Team-level alternatives</h2><div>${result.substitutes.map(row=>`<article>${portrait(row.champion,'small')}<span><strong>${esc(row.champion.name)}</strong><small>${esc(row.reason||'Provides the closest role-preserving verified fit.')}</small></span></article>`).join('')}</div></section>
    <section class="missing-data"><h2>Limits to keep in mind</h2><ul>${result.missingDataWarnings.map(row=>`<li>${esc(row)}</li>`).join('')}</ul></section>`;
}

function mountRecommendations() {
  const mode=document.querySelector('#strategy-mode'), target=document.querySelector('#strategy-target');
  const exclusions=new Set();
  const updateTargets=()=>{const rows=strategySnapshot.targets.filter(row=>row.battleMode===mode.value);target.innerHTML=rows.map(row=>`<option value="${esc(row.id)}">${esc(row.name)}</option>`).join('');};
  mode.addEventListener('change',updateTargets);
  const renderExclusions=()=>{document.querySelector('#exclusion-list').innerHTML=[...exclusions].map(id=>{const champion=snapshot.champions.find(row=>row.id===id);return `<button type="button" data-remove="${esc(id)}">${esc(champion?.name||id)} ×</button>`}).join('');document.querySelectorAll('[data-remove]').forEach(button=>button.addEventListener('click',()=>{exclusions.delete(button.dataset.remove);renderExclusions();}));};
  document.querySelector('#add-exclusion').addEventListener('click',()=>{const input=document.querySelector('#strategy-exclude');const matches=snapshot.champions.filter(champion=>champion.name.toLowerCase()===input.value.trim().toLowerCase());const feedback=document.querySelector('#exclusion-feedback');if(matches.length!==1){feedback.textContent='Choose one exact variant from the suggestions; no exclusion was added.';return;}exclusions.add(matches[0].id);input.value='';feedback.textContent=`Excluded ${matches[0].name}.`;renderExclusions();});
  const recommend=()=>{const result=recommendTeam({guideData:snapshot,strategyData:strategySnapshot,targetId:target.value,excludeVariantIds:[...exclusions]});renderRecommendation(result);document.querySelector('#recommendation-result').scrollIntoView({behavior:'smooth',block:'start'});};
  document.querySelector('#recommend-team').addEventListener('click',recommend);
  document.querySelector('#question-form').addEventListener('submit',event=>{event.preventDefault();const parsed=parseStrategyQuestion(document.querySelector('#strategy-question').value,strategySnapshot.targets);const feedback=document.querySelector('#question-feedback');if(!parsed){feedback.textContent='That question is not specific enough for a safe match. Choose the battle mode and target below.';return;}mode.value=parsed.battleMode;updateTargets();target.value=parsed.id;feedback.textContent=`Matched ${parsed.name}.`;recommend();});
}

function render() {
  const renderers={home:homePage,recommendations:recommendationsPage,champions:championsPage,items:itemsPage,teams:teamsPage,raid:raidPage,war:warPage,'legendary-assault':legendaryAssaultPage,factions:factionsPage,glossary:glossaryPage,notes:notesPage};
  root.innerHTML=(renderers[view]||homePage)();
  state.hidden=true;
  if(view==='champions') mountChampionFilters();
  if(view==='items') mountSimpleSearch('#item-search','.item-card','#item-count','item','#item-empty');
  if(view==='glossary') mountSimpleSearch('#glossary-search','.glossary-list article','#glossary-count','entry','#glossary-empty');
  if(view==='recommendations') mountRecommendations();
}

renderShell();
try {
  if(view==='recommendations') [snapshot,strategySnapshot]=await Promise.all([getGuideData(),getStrategyData()]);
  else snapshot=await getGuideData();
  render();
} catch(error) {
  state.hidden=true;
  root.innerHTML=`<div class="error-state" role="alert"><span aria-hidden="true">!</span><h1>The guide could not load</h1><p>${esc(error instanceof Error?error.message:'The guide database is unavailable.')}</p><button type="button" id="retry">Try again</button></div>`;
  document.querySelector('#retry')?.addEventListener('click',()=>location.reload());
}
