import { getGuideData } from './supabase-client.js';

const root = document.querySelector('#guide-content');
const state = document.querySelector('#guide-state');
const view = document.body.dataset.view || 'home';
let snapshot;

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const tag = (label, tone = '') => `<span class="tag ${tone}">${esc(label)}</span>`;
const empty = message => `<div class="empty">${esc(message)}</div>`;
const source = id => id ? `<span class="meta">Source #${esc(id)}</span>` : '';
const reviewed = status => status === 'complete' ? tag('Reviewed profile', 'good') : tag('Incomplete profile', 'warn');
const evidence = (review, sourceState) => review === 'complete' && sourceState === 'verified_visible'
  ? tag('Screenshot verified', 'good') : tag('Review incomplete', 'warn');
const championName = (data, id) => data.champions.find(champion => champion.id === id)?.name || `Champion #${id}`;
const heading = (title, intro) => `<p class="eyebrow">Source snapshot · ${esc(snapshot.version)}</p><h1>${esc(title)}</h1><p class="intro">${esc(intro)}</p>`;
const paragraph = text => `<p class="text">${esc(text)}</p>`;

function abilityCard(ability) {
  const label = ability.kind.replaceAll('_', ' ');
  const proof = ability.kind === 'boss' ? tag('See boss source review', 'warn') : evidence(ability.reviewStatus, ability.sourceState);
  return `<article class="card"><h3>${esc(ability.name)}</h3><div>${tag(label)}${proof}</div>${paragraph(ability.text || 'Visible text was not captured.')}${source(ability.sourceId)}</article>`;
}

function championCard(data, champion) {
  const abilities = data.abilities.filter(ability => ability.championId === champion.id);
  const traits = data.traits.filter(trait => trait.championId === champion.id);
  return `<article class="card"><h3>${esc(champion.name)}</h3>
    <div>${reviewed(champion.reviewStatus)}${tag(champion.gemColor || 'Color unrecorded')}</div>
    <p class="meta">${champion.factions.length ? champion.factions.map(esc).join(' · ') : 'Faction unrecorded'}</p>
    <details><summary>Visible abilities (${abilities.length})</summary>
    ${abilities.length ? abilities.map(abilityCard).join('') : empty('No ability text is recorded for this champion yet.')}
    </details><details><summary>Visible traits (${traits.length})</summary>
    ${traits.length ? traits.map(trait => `<div class="card"><h3>${esc(trait.name)}</h3>
    ${evidence(trait.reviewStatus, trait.sourceState)}${trait.type ? tag(trait.type) : ''}${paragraph(trait.text || 'Visible text was not captured.')}${source(trait.sourceId)}</div>`).join('') : empty('No trait text is recorded for this champion yet.')}
    </details></article>`;
}

function mountChampionSearch(data, container) {
  const search = container.querySelector('#champion-search');
  const results = container.querySelector('#champion-results');
  const count = container.querySelector('#result-count');
  const render = () => {
    const query = search.value.trim().toLowerCase();
    const champions = data.champions.filter(champion =>
      `${champion.name} ${champion.gemColor || ''} ${champion.factions.join(' ')}`.toLowerCase().includes(query));
    count.textContent = `${champions.length} of ${data.champions.length} champion records`;
    results.innerHTML = champions.length ? champions.map(champion => championCard(data, champion)).join('') : empty('No champions match that search.');
  };
  search.addEventListener('input', render);
  render();
}

function championsPage(data) {
  return `${heading('Champions', 'Search the live champion directory. A complete profile is reviewed; an incomplete profile may still have verified ability text.')}
    <label for="champion-search" class="meta">Search by name, color, or faction</label><br>
    <input class="search" id="champion-search" type="search" placeholder="Search champions…" autocomplete="off">
    <p class="result-count" id="result-count"></p><div class="grid" id="champion-results"></div>`;
}

function factionsPage(data) {
  return `${heading('Factions', 'These are the exact faction labels recorded on champion screens. Combined names and icon descriptions have not been split or normalized. No current faction bonus rules are verified in this snapshot.')}
    <div class="notice">Faction labels are source observations. The announced update below is not confirmed as live guidance in this snapshot.</div>
    <div class="grid">${data.factions.length ? data.factions.map(faction => `<article class="card"><h3>${esc(faction.name)}</h3>
      ${tag('Recorded faction label')}<p>${faction.memberIds.length} recorded members</p>
      <p class="meta">${faction.memberIds.map(id => esc(championName(data, id))).join(' · ') || 'No recorded members'}</p></article>`).join('') : empty('No current faction records are available.')}</div>
    <section class="section"><h2>Announced changes</h2>${announcements(data)}</section>`;
}

function announcements(data) {
  const changes = data.announcements.flatMap(update => update.factions.map(faction => ({ update, faction })));
  return changes.length ? `<div class="grid">${changes.map(({ update, faction }) => `<article class="card">
    <h3>${esc(faction.name)}</h3>${tag('Announced in snapshot', 'announced')}${tag(faction.change)}
    ${faction.playstyle ? paragraph(faction.playstyle) : ''}${faction.bonus ? paragraph(`Proposed bonus: ${faction.bonus}`) : ''}
    <p class="meta">${esc(update.title)} · ${esc(update.date || 'Date unrecorded')} · ${source(update.sourceId)}</p></article>`).join('')}</div>` : empty('No announced changes are recorded.');
}

function statusesPage(data) {
  return `${heading('Status effects', 'These are exact visible definitions from source screenshots. Review status is shown for each entry.')}
    <div class="grid">${data.statuses.length ? data.statuses.map(status => `<article class="card"><h3>${esc(status.name)}</h3>
    ${evidence(status.reviewStatus, status.sourceState)}${paragraph(status.text)}${source(status.sourceId)}</article>`).join('') : empty('No status definitions are recorded.')}</div>
    <p class="notice">For other visible mechanic definitions, use the <a href="abilities.html">ability reference</a>.</p>`;
}

function abilitiesPage(data) {
  const definitions = data.abilities.filter(ability => ability.kind === 'definition');
  return `${heading('Ability reference', 'Search exact visible ability and mechanic text. Labels distinguish screenshot-verified entries from incomplete ones.')}
    <label for="ability-search" class="meta">Search visible text</label><br>
    <input class="search" id="ability-search" type="search" placeholder="Search abilities…" autocomplete="off">
    <p class="result-count" id="ability-count"></p><div class="grid" id="ability-results"></div>
    <section class="section"><h2>Iconic items</h2><div class="grid">${data.items.length ? data.items.map(item => `<article class="card"><h3>${esc(item.name)}</h3>
    ${evidence(item.reviewStatus, item.sourceState)}${item.effectName ? tag(item.effectName) : ''}${paragraph(item.text)}${source(item.sourceId)}</article>`).join('') : empty('No iconic item text is recorded.')}</div></section>
    <section class="section"><h2>Champion skills</h2><p class="muted">Open a champion in the <a href="champions.html">directory</a> for its recorded skills, traits, and iconic abilities.</p></section>`;
}

function mountAbilitySearch(data, container) {
  const definitions = data.abilities.filter(ability => ability.kind === 'definition');
  const search = container.querySelector('#ability-search');
  const results = container.querySelector('#ability-results');
  const count = container.querySelector('#ability-count');
  const render = () => {
    const query = search.value.trim().toLowerCase();
    const matches = definitions.filter(ability => `${ability.name} ${ability.text}`.toLowerCase().includes(query));
    count.textContent = `${matches.length} of ${definitions.length} definitions`;
    results.innerHTML = matches.length ? matches.map(abilityCard).join('') : empty('No definitions match that search.');
  };
  search.addEventListener('input', render);
  render();
}

function alliesPage(data) {
  return `${heading('Companions & allies', 'The verified snapshot records companion abilities. It does not yet establish general ally-pair synergy or substitution rules.')}
    <div class="grid">${data.companions.length ? data.companions.map(companion => `<article class="card">
    <h3>${esc(companion.name)}</h3><p class="meta">Companion of ${esc(championName(data, companion.championId))}</p>
    ${evidence(companion.reviewStatus, companion.sourceState)}<p><strong>${esc(companion.skillName || 'Skill name unrecorded')}</strong></p>
    ${paragraph(companion.text || 'Visible ability text was not captured.')}${source(companion.sourceId)}</article>`).join('') : empty('No companions are recorded.')}</div>
    <div class="notice">Ally combinations in the archived guide have not been validated as confirmed strategy.</div>`;
}

function dragonsPage(data) {
  return `${heading('Dragon & boss battles', 'Boss mechanics and official tips are shown only where the verified snapshot has records. A partial boss profile is labeled incomplete.')}
    ${data.bosses.length ? data.bosses.map(boss => `<section class="section"><h2>${esc(boss.name)} ${boss.subtitle ? `· ${esc(boss.subtitle)}` : ''}</h2>
      ${reviewed(boss.reviewStatus)}<div class="grid">${boss.abilities.map(ability => `<article class="card"><h3>${esc(ability.name)}</h3>
      ${ability.reviewStatus === 'complete' && ability.verifiedSources > 0 ? tag('Screenshot verified', 'good') : tag('Review incomplete', 'warn')}
      ${ability.scope ? `<p class="meta">${esc(ability.scope)}</p>` : ''}${paragraph(ability.text)}</article>`).join('') || empty('No boss abilities are recorded.')}</div>
      <h3 class="section">Visible battle tips</h3><div class="grid">${boss.tips.length ? boss.tips.map(tip => `<article class="card">
      ${evidence(tip.reviewStatus, tip.sourceState)}${paragraph(tip.text)}${source(tip.sourceId)}</article>`).join('') : empty('No boss tips are recorded.')}</div></section>`).join('') : empty('No boss records are available.')}
    <div class="notice">Other dragons from the archived guide are awaiting verified records. Observed battle compositions appear on the <a href="builder.html">team examples</a> page.</div>`;
}

function teamCard(team) {
  const verified = team.evidenceStatus === 'visible_composition' && team.sourceState === 'verified_visible';
  return `<article class="card" data-mode="${esc(team.mode.toLowerCase())}">
    <h3>${esc(team.mode)} · example #${esc(team.id)}</h3>
    ${verified ? tag('Screenshot verified composition', 'good') : tag('Composition review incomplete', 'warn')}
    ${tag(team.role)}
    <p class="meta">This shows a visible lineup, not a proven win or universal recommendation.</p>
    <ol>${team.members.map(member => `<li>${esc(member.name)}${member.isLeader ? ' · leader' : ''}${member.gemColor ? ` · ${esc(member.gemColor)}` : ''}</li>`).join('')}</ol>
    ${team.assessments.map(assessment => `<div class="notice">${tag('Community/Observed', 'warn')}${paragraph(assessment.text)}${source(assessment.sourceId)}</div>`).join('')}
    ${source(team.sourceId)}</article>`;
}

function teamsPage(data) {
  return `${heading('Team examples', 'Inspect recorded Raid, War, and dragon compositions. A screenshot establishes who was on a team; it does not prove matchup success.')}
    <div class="filters" id="team-filters"><button type="button" data-filter="all" aria-pressed="true">All</button>
    <button type="button" data-filter="raid" aria-pressed="false">Raid</button><button type="button" data-filter="war" aria-pressed="false">War</button>
    <button type="button" data-filter="battle" aria-pressed="false">Dragon battle</button></div>
    <p class="result-count" id="team-count"></p><div class="grid" id="team-results">${data.teams.length ? data.teams.map(teamCard).join('') : empty('No team examples are recorded.')}</div>`;
}

function mountTeamFilters(data, container) {
  const buttons = [...container.querySelectorAll('#team-filters button')];
  const cards = [...container.querySelectorAll('#team-results [data-mode]')];
  const count = container.querySelector('#team-count');
  buttons.forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    let visible = 0;
    cards.forEach(card => {
      const show = filter === 'all' || card.dataset.mode.includes(filter);
      card.hidden = !show;
      if (show) visible++;
    });
    count.textContent = `${visible} of ${data.teams.length} observed teams`;
  }));
  count.textContent = `${data.teams.length} observed teams`;
}

function raidsPage(data) {
  return `${heading('Raid strategy evidence', 'Use these recorded Raid rules and observed lineups to inspect options. User-provided rules and team observations are conditional.')}
    <section><h2>Raid rules</h2><div class="grid">${data.raidRules.length ? data.raidRules.map(rule => `<article class="card">
    <h3>${esc(rule.category)}</h3>${rule.evidenceType === 'verified_visible' && rule.sourceState === 'verified_visible'
      ? tag('Screenshot verified', 'good') : tag('Community/Observed', 'warn')}
    ${paragraph(rule.text)}${source(rule.sourceId)}</article>`).join('') : empty('No Raid rules are recorded.')}</div></section>
    <section class="section"><h2>Observed Raid teams</h2><div class="grid">${data.teams.filter(team => team.mode.includes('Raid')).map(teamCard).join('') || empty('No strategy team examples are recorded.')}</div></section>
    <section class="section"><h2>Separate Raid defense snapshot</h2><div class="grid">${data.raidTeams.length ? data.raidTeams.map(team => `<article class="card">
      <h3>Raid ${esc(team.context)} · source example #${esc(team.id)}</h3>
      ${team.sourceState === 'verified_visible' ? tag('Screenshot verified composition', 'good') : tag('Composition review incomplete', 'warn')}
      <p class="meta">This is a separately recorded lineup, with no proven matchup result.</p><ol>${team.members.map(member => `<li>${esc(member.name)}${member.isLeader ? ' · leader' : ''}</li>`).join('')}</ol>${source(team.sourceId)}</article>`).join('') : empty('No separate Raid team snapshot is recorded.')}</div></section>`;
}

function strategyPage(data) {
  return `${heading('Strategy evidence', 'Choose a question, then inspect exactly what the verified snapshot supports. Observed teams are examples, not fixed prescriptions.')}
    <div class="grid">
      <a class="card" href="raids.html"><h2>Raid</h2><p>Rules and observed attacks or defenses.</p></a>
      <a class="card" href="builder.html"><h2>Teams</h2><p>Observed Raid, War, and dragon lineups.</p></a>
      <a class="card" href="dragons.html"><h2>Boss</h2><p>Visible boss mechanics and battle tips.</p></a>
      <a class="card" href="abilities.html"><h2>Abilities</h2><p>Exact visible skill and mechanic text.</p></a>
    </div><section class="section"><h2>Evidence available now</h2><p class="muted">${data.champions.length} champion records, ${data.abilities.length} ability records, ${data.teams.length} observed strategy teams, and ${data.bosses.length} boss record.</p></section>
    <section class="section"><h2>Announced in the snapshot</h2>${announcements(data)}
    <h3 class="section">Announced rule text</h3><div class="grid">${data.announcements.flatMap(update => update.rules.map(rule => `<article class="card">${tag('Announced in snapshot', 'announced')}${tag(rule.category)}${paragraph(rule.text)}${source(update.sourceId)}</article>`)).join('') || empty('No announced rules are recorded.')}</div></section>`;
}

function homePage(data) {
  const complete = data.champions.filter(champion => champion.reviewStatus === 'complete').length;
  return `${heading('Make the next battle decision', 'Live, source-aware GOT: Legends knowledge for Old Peeps on Porches. Start with the question you have right now.')}
    <div class="actions"><a class="btn" href="raids.html">Plan a Raid</a><a class="btn secondary" href="dragons.html">Fight a boss</a><a class="btn secondary" href="champions.html">Find a champion</a></div>
    <section class="section"><h2>Explore the guide</h2><div class="grid">
      <a class="card" href="builder.html"><h3>Team examples</h3><p>${data.teams.length} observed compositions with evidence labels.</p></a>
      <a class="card" href="abilities.html"><h3>Abilities</h3><p>${data.abilities.length} visible ability records.</p></a>
      <a class="card" href="factions.html"><h3>Factions</h3><p>${data.factions.length} recorded faction labels plus announced changes.</p></a>
      <a class="card" href="status-effects.html"><h3>Status effects</h3><p>${data.statuses.length} visible definitions.</p></a>
    </div></section>
    <section class="section"><div class="notice">${complete} of ${data.champions.length} champion profiles are complete. Partial profiles and announced content are clearly labeled throughout this preview.</div></section>`;
}

function rosterPage(data) {
  return `${heading('Use your collection in the game', 'The game already manages champions, gear, stars, and levels. This guide helps you inspect what each champion can do.')}
    <div class="actions"><a class="btn" href="champions.html">Browse ${data.champions.length} champions</a><a class="btn secondary" href="builder.html">Inspect team examples</a></div>
    <div class="notice">The previous device-only roster tracker remains available in the archived legacy page for rollback. This live guide does not require maintaining a second roster.</div>`;
}

function render(data) {
  snapshot = data;
  const pages = {home:homePage,champions:championsPage,factions:factionsPage,statuses:statusesPage,abilities:abilitiesPage,
    allies:alliesPage,dragons:dragonsPage,teams:teamsPage,raids:raidsPage,strategy:strategyPage,roster:rosterPage};
  root.innerHTML = (pages[view] || homePage)(data);
  state.hidden = true;
  if (view === 'champions') mountChampionSearch(data, root);
  if (view === 'abilities') mountAbilitySearch(data, root);
  if (view === 'teams') mountTeamFilters(data, root);
}

async function load() {
  state.hidden = false;
  state.className = 'notice';
  state.textContent = 'Loading verified guide data…';
  root.replaceChildren();
  try { render(await getGuideData()); }
  catch (error) {
    state.className = 'notice error';
    state.textContent = error instanceof Error ? `Database unavailable: ${error.message}` : 'Database unavailable.';
    const retry = document.createElement('button');
    retry.className = 'btn secondary';
    retry.type = 'button';
    retry.textContent = 'Retry';
    retry.addEventListener('click', load);
    root.append(retry);
  }
}

load();
