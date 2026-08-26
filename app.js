/* GOT Legends Guide — logic. Legendary roster from champions-part1.json + champions-part2.json (78 from user roster screenshots). */
const STORAGE_KEY = 'gotlg_roster_v1';

function loadRoster() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function saveRoster(roster) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(roster));
}
function isOwned(roster, id) {
  return !!(roster[id] && roster[id].owned);
}
function toggleOwned(roster, id) {
  if (!roster[id]) roster[id] = { owned: true };
  else roster[id].owned = !roster[id].owned;
  if (!roster[id].owned) delete roster[id];
  saveRoster(roster);
  return roster;
}
function setAllOwned(roster, champs, owned) {
  const next = {};
  if (owned) champs.forEach(c => { next[c.id] = { owned: true }; });
  saveRoster(next);
  return next;
}
function ownedChampions(all, roster) {
  return all.filter(c => isOwned(roster, c.id));
}
function hasRole(c, role) { return (c.roles || []).includes(role); }
function hasTag(c, tag) { return (c.tags || []).includes(tag); }
function hasFaction(c, name) {
  const n = (name || '').toLowerCase();
  return (c.factions || []).some(f => String(f).toLowerCase() === n);
}

function scoreChamp(c, modeKey) {
  const base = (c.scores && c.scores[modeKey]) || 0;
  let bonus = (c.leader || 0);
  if (c.rarity === 'legendary') bonus += 1;
  const tags = c.tags || [];
  if (modeKey === 'viserion' && (tags.includes('raid') || tags.includes('ice') || tags.includes('brittle'))) bonus += 3;
  if (modeKey === 'icy' && (tags.includes('reinforce') || tags.includes('ice'))) bonus += 3;
  if ((modeKey === 'raidAtk' || modeKey === 'war') && tags.includes('raid')) bonus += 3;
  if (modeKey === 'raidDef' && (tags.includes('taunt') || hasRole(c, 'taunt'))) bonus += 3;
  if (modeKey === 'rhaegal' && (tags.includes('bleed') || tags.includes('fire') || tags.includes('taunt') || tags.includes('poison'))) bonus += 2;
  if (modeKey === 'drogon' && (tags.includes('fire') || hasRole(c, 'pressure'))) bonus += 2;
  return base * 10 + bonus;
}
function pickBest(pool, pred, modeKey) {
  const candidates = pool.filter(pred);
  if (!candidates.length) return null;
  candidates.sort((a, b) => scoreChamp(b, modeKey) - scoreChamp(a, modeKey));
  return candidates[0];
}
function removeFrom(pool, champ) {
  if (!champ) return pool;
  return pool.filter(c => c.id !== champ.id);
}
function fillTeam(pool, slots, modeKey, preferredLeader) {
  const team = [];
  let remaining = pool.slice();
  for (const slot of slots) {
    const pick = pickBest(remaining, slot.prefer, modeKey);
    if (pick) {
      team.push({ champ: pick, roleLabel: slot.label });
      remaining = removeFrom(remaining, pick);
    }
  }
  while (team.length < 5 && remaining.length) {
    remaining.sort((a, b) => scoreChamp(b, modeKey) - scoreChamp(a, modeKey));
    const pick = remaining[0];
    team.push({ champ: pick, roleLabel: 'Flex' });
    remaining = removeFrom(remaining, pick);
  }
  if (team.length) {
    let leaderIdx = 0;
    if (typeof preferredLeader === 'function') {
      let best = -1, bestLeaderVal = -1;
      for (let i = 0; i < team.length; i++) {
        if (preferredLeader(team[i].champ)) {
          const lv = team[i].champ.leader || 0;
          if (lv > bestLeaderVal) { bestLeaderVal = lv; best = i; }
        }
      }
      if (best >= 0) leaderIdx = best;
    }
    const leader = team.splice(leaderIdx, 1)[0];
    team.unshift({ ...leader, roleLabel: 'Leader' });
  }
  return { team, remaining };
}
function buildWarTeams(owned) {
  let pool = owned.slice();
  const teams = [];
  let r = fillTeam(pool, [
    { label: 'Damage', prefer: c => hasFaction(c, 'Lannister') && hasRole(c, 'damage') },
    { label: 'Support', prefer: c => hasFaction(c, 'Lannister') && (hasRole(c, 'support') || hasRole(c, 'control') || hasRole(c, 'utility')) },
    { label: 'Control', prefer: c => hasRole(c, 'control') || hasTag(c, 'poison') || hasTag(c, 'treasury') },
    { label: 'Flex', prefer: c => hasFaction(c, 'Lannister') || hasRole(c, 'damage') },
  ], 'war', c => hasFaction(c, 'Lannister') && ((c.name && (c.name.includes('Tywin') || c.name.includes('Cersei') || c.name.includes('Gregor') || c.name.includes('Meryn'))) || hasTag(c, 'treasury')));
  teams.push({ name: 'Team 1 — Lannister core', purpose: 'Faction: Lannister. Default attack or hybrid hold.', how: 'Tywin / Cersei / Gregor lead. Treasury + Mountain pressure. Use vs unknown or tanky defenses.', ...r });
  pool = r.remaining;
  r = fillTeam(pool, [
    { label: 'Damage', prefer: c => hasFaction(c, 'Free Cities') && (hasRole(c, 'damage') || hasRole(c, 'pressure')) },
    { label: 'Pressure', prefer: c => hasFaction(c, 'Free Cities') || hasRole(c, 'pressure') },
    { label: 'Support', prefer: c => hasRole(c, 'support') || hasRole(c, 'utility') || (c.name && c.name.includes('Daenerys')) },
    { label: 'Flex', prefer: c => hasFaction(c, 'Free Cities') || hasRole(c, 'damage') },
  ], 'war', c => hasFaction(c, 'Free Cities') && (hasTag(c, 'stamina') || (c.name && (c.name.includes('Drogo') || c.name.includes('Daenerys') || c.name.includes('Varys')))));
  teams.push({ name: 'Team 2 — Free Cities speed', purpose: 'Faction: Free Cities. Highest-ceiling offense.', how: 'Keep Drogo + Blue Dany together when both are marked. Race. Place on a generic outpost or vs slow walls.', ...r });
  pool = r.remaining;
  r = fillTeam(pool, [
    { label: 'Support', prefer: c => hasFaction(c, 'Baratheon') && (hasRole(c, 'support') || hasRole(c, 'utility')) },
    { label: 'Damage', prefer: c => hasFaction(c, 'Baratheon') && (hasRole(c, 'damage') || hasRole(c, 'pressure')) },
    { label: 'Taunt', prefer: c => hasFaction(c, 'Baratheon') && (hasRole(c, 'taunt') || hasRole(c, 'protect')) },
    { label: 'Flex', prefer: c => hasFaction(c, 'Baratheon') || hasRole(c, 'control') },
  ], 'war', c => hasFaction(c, 'Baratheon') && (c.name && (c.name.includes('Davos') || c.name.includes('Varys') || c.name.includes('Stannis') || c.name.includes('Brienne'))));
  teams.push({ name: 'Team 3 — Baratheon camp / Scout', purpose: 'On Baratheon Camp: 3–4 real Baratheons. Off-camp: Scout/Crit or leftover Baratheons.', how: 'Do not pad with underleveled Robert. Varys + Davos can delete Stark walls that look stronger on paper.', ...r });
  pool = r.remaining;
  r = fillTeam(pool, [
    { label: 'Taunt', prefer: c => hasRole(c, 'taunt') || hasRole(c, 'protect') || hasTag(c, 'taunt') },
    { label: 'Control', prefer: c => hasRole(c, 'control') || hasTag(c, 'poison') },
    { label: 'Sustain', prefer: c => hasRole(c, 'sustain') || hasRole(c, 'heal') || hasRole(c, 'utility') },
    { label: 'Flex', prefer: c => true },
  ], 'war', c => hasRole(c, 'taunt') || hasRole(c, 'protect') || hasTag(c, 'taunt') || (c.name && c.name.includes('Meryn')));
  teams.push({ name: 'Team 4 — Meryn hold', purpose: 'Sit on a DEF / Tenacity outpost and refuse to die.', how: 'Defense is harder because the attacker owns the gems. Keep the Taunter alive. Leftovers still need a job.', ...r });
  return teams;
}
function buildSingleTeam(owned, modeKey, profile) {
  const r = fillTeam(owned.slice(), profile.slots, modeKey, profile.preferredLeader);
  return { name: profile.name, purpose: profile.purpose, how: profile.how, team: r.team, remaining: r.remaining };
}
const MODE_PROFILES = {
  raidAtk: {
    name: 'Raid Attack', purpose: 'Free Cities speed or Raid pressure. Highest ceiling is Drogo stamina loop.',
    how: 'Primary shape: Drogo + Daario + high Dany + Nymeria + Jorah. Alternative: Euron skill Raid into damage. Play for fast clears.',
    preferredLeader: c => hasTag(c, 'stamina') || hasRole(c, 'pressure') || hasRole(c, 'raid') || hasTag(c, 'raid') || (c.name && c.name.includes('Drogo')),
    slots: [
      { label: 'Damage', prefer: c => hasRole(c, 'damage') || hasRole(c, 'pressure') },
      { label: 'Pressure', prefer: c => hasRole(c, 'pressure') || hasRole(c, 'raid') || hasTag(c, 'raid') || hasTag(c, 'crit') },
      { label: 'Damage', prefer: c => hasRole(c, 'damage') || hasTag(c, 'wound') },
      { label: 'Support', prefer: c => hasRole(c, 'support') || hasRole(c, 'heal') || hasRole(c, 'utility') },
    ]
  },
  raidDef: {
    name: 'Raid Defense', purpose: 'Meryn Control Core — Stun + Wound on every enemy skill.',
    how: 'Meryn Trant leader + Sandor + Olenna + Tywin/Cersei + Joffrey. Extremely hard to break. Meryn punishes skill spam.',
    preferredLeader: c => hasRole(c, 'taunt') || hasRole(c, 'protect') || hasTag(c, 'taunt') || (c.name && c.name.includes('Meryn')),
    slots: [
      { label: 'Taunt', prefer: c => hasRole(c, 'taunt') || hasRole(c, 'protect') || hasTag(c, 'taunt') },
      { label: 'Sustain', prefer: c => hasRole(c, 'sustain') || hasRole(c, 'heal') || hasRole(c, 'shields') || hasRole(c, 'control') },
      { label: 'Control', prefer: c => hasRole(c, 'control') || hasTag(c, 'poison') },
      { label: 'Damage', prefer: c => hasRole(c, 'damage') || hasRole(c, 'flex') },
    ]
  },
  viserion: {
    name: 'Viserion', purpose: 'Skill Raid + Brittle. Golden Scales rewards Raid; Brittle shuts down Rude Awakening.',
    how: 'Never skill while Pacified unless Brittle. Stack skill Raid (Euron). Do not Reinforce (feeds Patience). Avoid Birthright/Fury (Claw Swipe strips them). Mixed colors help vs –50% Gem Damage.',
    preferredLeader: c => hasRole(c, 'raid') || hasTag(c, 'raid') || (c.name && c.name.includes('Euron')),
    slots: [
      { label: 'Raid', prefer: c => hasRole(c, 'raid') || hasTag(c, 'raid') || (c.name && c.name.includes('Euron')) },
      { label: 'Control', prefer: c => hasTag(c, 'brittle') || hasTag(c, 'ice') || hasRole(c, 'control') },
      { label: 'Pressure', prefer: c => hasRole(c, 'pressure') || hasRole(c, 'raid') || hasTag(c, 'raid') || hasRole(c, 'damage') },
      { label: 'Damage', prefer: c => hasRole(c, 'damage') || hasTag(c, 'wound') || hasRole(c, 'flex') },
    ]
  },
  drogon: {
    name: 'Drogon', purpose: 'Speed race. Free Cities stamina + real damage.',
    how: 'Play aggressively. Dump skills fast. Protect damage dealers. This is a race, not a stall.',
    preferredLeader: c => hasTag(c, 'stamina') || (c.name && (c.name.includes('Drogo') || c.name.includes('Euron'))) || hasRole(c, 'pressure') || hasRole(c, 'damage'),
    slots: [
      { label: 'Damage', prefer: c => hasRole(c, 'damage') && !hasRole(c, 'dragon') },
      { label: 'Pressure', prefer: c => hasRole(c, 'pressure') || hasRole(c, 'raid') || hasTag(c, 'raid') },
      { label: 'Damage', prefer: c => hasRole(c, 'damage') || hasTag(c, 'crit') || hasTag(c, 'fire') },
      { label: 'Utility', prefer: c => hasRole(c, 'utility') || hasRole(c, 'support') || hasRole(c, 'control') },
    ]
  },
  rhaegal: {
    name: 'Rhaegal', purpose: 'Protected Taunt. Free Folk pressure OR Targ/Blue Dany cores often beat pure Bleed theory packages.',
    how: 'Real Taunter required — keep him alive. Prefer Free Folk/Greyjoy pressure or high-investment Blue Dany. Classic Oberyn/Olenna Bleed can underperform. Do not Reinforce. Avoid Birthright/Fury/Shield walls. –50% Gem Damage.',
    preferredLeader: c => hasRole(c, 'taunt') || hasRole(c, 'protect') || hasTag(c, 'taunt') || (c.name && (c.name.includes('Ygritte') || c.name.includes('Drogo') || c.name.includes('Brienne') || c.name.includes('Sandor') || c.name.includes('Areo'))),
    slots: [
      { label: 'Taunt', prefer: c => hasRole(c, 'taunt') || hasRole(c, 'protect') || hasTag(c, 'taunt') },
      { label: 'Damage', prefer: c => hasRole(c, 'damage') || hasRole(c, 'pressure') || hasTag(c, 'raid') },
      { label: 'Support', prefer: c => hasRole(c, 'support') || hasRole(c, 'utility') || hasRole(c, 'sustain') },
      { label: 'Flex', prefer: c => hasRole(c, 'damage') || hasRole(c, 'pressure') || hasTag(c, 'fire') || true },
    ]
  },
  icy: {
    name: 'Icy Viserion', purpose: 'Night King controlled Ice or speed race. Do not mindlessly Reinforce. Keep Night King alive.',
    how: 'Prefer Night King lead + defensive body. Control Reinforce timing carefully. Free Cities hybrid works when you can end the fight early.',
    preferredLeader: c => (c.name && c.name.includes('Night King')) || hasRole(c, 'reinforce') || hasTag(c, 'ice') || hasRole(c, 'control'),
    slots: [
      { label: 'Control', prefer: c => hasRole(c, 'control') || hasTag(c, 'ice') || hasRole(c, 'reinforce') },
      { label: 'Support', prefer: c => hasRole(c, 'support') || hasRole(c, 'sustain') || hasRole(c, 'utility') || (c.name && (c.name.includes('Ice Warden') || c.name.includes('Ned'))) },
      { label: 'Damage', prefer: c => hasRole(c, 'damage') || hasRole(c, 'pressure') },
      { label: 'Body', prefer: c => hasRole(c, 'taunt') || hasRole(c, 'protect') || hasRole(c, 'sustain') || hasRole(c, 'control') },
    ]
  }
};
function avatarHTML(c, size) {
  const s = size || 40;
  const initials = `<div style="width:${s}px;height:${s}px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${s < 40 ? 10 : 12}px;flex-shrink:0;border:2px solid #c9a22733;background:${(c && c.color) || '#333'};color:${(c && c.text) || '#fff'}">${(c && c.initials) || '?'}</div>`;
  const portrait = (typeof CHAMPION_PORTRAITS !== 'undefined' && c && c.id && CHAMPION_PORTRAITS[c.id]) ? CHAMPION_PORTRAITS[c.id] : null;
  if (!portrait) return initials;
  return `<img src="data:image/jpeg;base64,${portrait}" alt="" width="${s}" height="${s}" style="width:${s}px;height:${s}px;border-radius:9999px;object-fit:cover;flex-shrink:0;border:2px solid #c9a22766;background:#1a1a20" onerror="this.outerHTML='${initials.replace(/'/g, "\\'")}'" />`;
}
async function fetchChampions() {
  try {
    const [a, b] = await Promise.all([
      fetch('champions-part1.json').then(r => r.json()),
      fetch('champions-part2.json').then(r => r.json())
    ]);
    const list = [...(a.champions || []), ...(b.champions || [])];
    const seen = new Set();
    return list.filter(c => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  } catch (e) {
    if (typeof EMBEDDED_CHAMPIONS !== 'undefined' && EMBEDDED_CHAMPIONS.length) {
      return EMBEDDED_CHAMPIONS.slice();
    }
    return [];
  }
}
