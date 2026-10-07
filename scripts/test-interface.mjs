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
  assert.match(source, /not claims of proven victories/);
  assert.match(source, /Ask the guide/);
  assert.match(source, /verified curated recommendation or the deterministic strategy engine/);
});
