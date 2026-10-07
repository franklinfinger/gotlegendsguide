import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const routes = ['index.html','recommendations.html','champions.html','items.html','builder.html','raids.html','war.html','dragons.html','factions.html','status-effects.html'];

test('all restored product routes use the shared live guide shell', () => {
  for (const route of routes) {
    const html = fs.readFileSync(path.join(root, route), 'utf8');
    assert.match(html, /guide\.js/);
    assert.match(html, /guide-state/);
    assert.doesNotMatch(html, />Bosses</i);
  }
});

test('player navigation uses Legendary Assault terminology', () => {
  const source = fs.readFileSync(path.join(root, 'guide.js'), 'utf8');
  assert.match(source, /Legendary Assault/);
  assert.doesNotMatch(source, /['"`]Bosses['"`]/);
  assert.match(source, /battle outcomes were not shown/i);
  assert.match(source, /Ask the guide/);
  assert.match(source, /Team Option/);
  assert.match(source, /Key Battle Rule/);
});

test('Phase 5 roster controls and sign-in are absent from the public interface',()=>{
  const source=fs.readFileSync(path.join(root,'guide.js'),'utf8');
  assert.doesNotMatch(source,/My Roster|roster-own-button|roster-client|sign-in link/);
  assert.match(fs.readFileSync(path.join(root,'roster.html'),'utf8'),/url=recommendations\.html/);
});

test('Home strategy questions render in place and champion search stays separate',()=>{
  const source=fs.readFileSync(path.join(root,'guide.js'),'utf8');
  assert.match(source,/id="home-strategy-form"/);
  assert.match(source,/What battle are you preparing for/);
  assert.match(source,/Raid Attack/);
  assert.match(source,/Raid Defense/);
  assert.match(source,/id="home-strategy-result"/);
  assert.doesNotMatch(source,/quick-find" action="champions\.html"/);
  assert.match(source,/if\(view==='champions'\) mountChampionFilters/);
  assert.match(source,/encounter-strategy/);
});

test('Strategy exposes battle selection before the follow-up question',()=>{
  const source=fs.readFileSync(path.join(root,'guide.js'),'utf8');
  const page=source.slice(source.indexOf('function recommendationsPage()'),source.indexOf('function conversationPanel()'));
  assert.match(page,/strategy-battle-grid/);
  assert.ok(page.indexOf('strategy-battle-grid') < page.indexOf('conversationPanel()'));
  assert.match(page,/war\.html\?rule=/);
});
