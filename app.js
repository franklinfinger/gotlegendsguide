/* GOT Legends Guide — roster + team builder v3
   Leader selection follows mode needs, not highest leader skill number.
   Scores rebalanced toward teams seen in real raid/war screenshots. */
const STORAGE_KEY = 'gotlg_roster_v1';

function loadRoster() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
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
  if (owned) {
    champs.forEach(c => { next[c.id] = { owned: true }; });
  }
  saveRoster(next);
  return next;
}

function ownedChampions(all, roster) {
  return all.filter(c => isOwned(roster, c.id));
}

function hasRole(c, role) {
  return (c.roles || []).includes(role);
}

function hasTag(c, tag) {
  return (c.tags || []).includes(tag);
}

/* Mode scores dominate. Leader skill is a small tie-break only — not a free pass to lead every team. */
function scoreChamp(c, modeKey) {
  const base = (c.scores && c.scores[modeKey]) || 0;
  let bonus = (c.leader || 0); // was *2 — that made Daemon win every sort
  if (c.rarity === 'legendary') bonus += 1;
  const tags = c.tags || [];
  if (modeKey === 'viserion' && (tags.includes('raid') || tags.includes('ice') || tags.includes('brittle'))) bonus += 3;
  if (modeKey === 'icy' && (tags.includes('reinforce') || tags.includes('ice'))) bonus += 3;
  if ((modeKey === 'raidAtk' || modeKey === 'war') && tags.includes('raid')) bonus += 3;
  if (modeKey === 'raidDef' && (tags.includes('taunt') || hasRole(c, 'taunt'))) bonus += 3;
  if (modeKey === 'rhaegal' && (tags.includes('bleed') || tags.includes('fire') || tags.includes('taunt'))) bonus += 2;
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

/**
 * preferredLeader: optional (champ) => bool
 * If set, Leader is chosen among matching champs on the team (highest leader skill among them).
 * If none match, the FIRST filled slot stays Leader (that slot is the mode's primary tool).
 * Never promotes a high-leader-skill damage champ over the mode's intended leader type.
 */
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
    let leaderIdx = 0; // default: first slot = mode's primary role
    if (typeof preferredLeader === 'function') {
      let best = -1;
      let bestLeaderVal = -1;
      for (let i = 0; i < team.length; i++) {
        if (preferredLeader(team[i].champ)) {
          const lv = team[i].champ.leader || 0;
          if (lv > bestLeaderVal) {
            bestLeaderVal = lv;
            best = i;
          }
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

  // Team 1 — Offense: Lannister / real damage cores seen in screenshots (Gregor, Jaime, Arya, Oberyn)
  // NOT auto-Daemon. Prefer damage + control openers.
  let r = fillTeam(pool, [
    { label: 'Damage', prefer: c => hasRole(c, 'damage') && !hasRole(c, 'dragon') },
    { label: 'Damage', prefer: c => hasRole(c, 'damage') || hasRole(c, 'pressure') },
    { label: 'Control', prefer: c => hasRole(c, 'control') || hasRole(c, 'utility') || hasTag(c, 'poison') },
    { label: 'Support', prefer: c => hasRole(c, 'support') || hasRole(c, 'heal') || hasRole(c, 'utility') },
  ], 'war', c => hasRole(c, 'leader') && (hasRole(c, 'damage') || hasRole(c, 'control') || hasTag(c, 'treasury') || hasTag(c, 'wound')));
  teams.push({
    name: 'Team 1 — Offense',
    purpose: 'Primary damage and pressure. Place where the fight is hardest.',
    how: 'Open with control (Poison / Wound / strip), then finish. Composition beats raw might.',
    ...r
  });
  pool = r.remaining;

  // Team 2 — Hold: Taunt + sustain (Brienne, Meryn, Sandor, Cersei, Corlys)
  r = fillTeam(pool, [
    { label: 'Taunt', prefer: c => hasRole(c, 'taunt') || hasRole(c, 'protect') || hasTag(c, 'taunt') },
    { label: 'Sustain', prefer: c => hasRole(c, 'sustain') || hasRole(c, 'heal') || hasRole(c, 'shields') },
    { label: 'Control', prefer: c => hasRole(c, 'control') || hasRole(c, 'utility') },
    { label: 'Flex', prefer: c => true },
  ], 'war', c => hasRole(c, 'taunt') || hasRole(c, 'protect') || hasTag(c, 'taunt'));
  teams.push({
    name: 'Team 2 — Hold',
    purpose: 'Taunt + sustain to outlast contested outposts.',
    how: 'Keep Taunt up. Let sustain do the work. Do not chase glass-cannon trades.',
    ...r
  });
  pool = r.remaining;

  // Team 3 — Raid / Burst: Euron leads when available
  r = fillTeam(pool, [
    { label: 'Raid', prefer: c => hasRole(c, 'raid') || hasTag(c, 'raid') },
    { label: 'Damage', prefer: c => hasRole(c, 'damage') || hasRole(c, 'pressure') },
    { label: 'Control', prefer: c => hasRole(c, 'control') || hasRole(c, 'utility') },
    { label: 'Support', prefer: c => hasRole(c, 'support') || hasRole(c, 'heal') || true },
  ], 'war', c => hasRole(c, 'raid') || hasTag(c, 'raid'));
  teams.push({
    name: 'Team 3 — Raid / Burst',
    purpose: 'Apply Raid and burst tanky defenses.',
    how: 'Land Raid first (Euron when you have him), then dump damage.',
    ...r
  });
  pool = r.remaining;

  // Team 4 — Flex / Ice / leftovers
  r = fillTeam(pool, [
    { label: 'Control', prefer: c => hasRole(c, 'reinforce') || hasRole(c, 'control') || hasTag(c, 'ice') },
    { label: 'Utility', prefer: c => hasRole(c, 'utility') || hasRole(c, 'flex') || hasRole(c, 'support') },
    { label: 'Flex', prefer: c => true },
    { label: 'Flex', prefer: c => true },
  ], 'war', c => hasRole(c, 'reinforce') || hasTag(c, 'ice') || hasRole(c, 'control'));
  teams.push({
    name: 'Team 4 — Flex',
    purpose: 'Leftovers with a job — reinforce, control, or pure depth.',
    how: 'Use for secondary outposts or as the plan B lineup.',
    ...r
  });

  return teams;
}

function buildSingleTeam(owned, modeKey, profile) {
  const r = fillTeam(owned.slice(), profile.slots, modeKey, profile.preferredLeader);
  return {
    name: profile.name,
    purpose: profile.purpose,
    how: profile.how,
    team: r.team,
    remaining: r.remaining
  };
}

const MODE_PROFILES = {
  raidAtk: {
    name: 'Raid Attack',
    purpose: 'Raid pressure into enemy defenses.',
    how: 'Apply Raid (Euron when available), then damage + control. Screenshot metas often use Lannister damage or Greyjoy Raid cores.',
    preferredLeader: c => hasRole(c, 'raid') || hasTag(c, 'raid'),
    slots: [
      { label: 'Raid', prefer: c => hasRole(c, 'raid') || hasTag(c, 'raid') },
      { label: 'Damage', prefer: c => hasRole(c, 'damage') && !hasRole(c, 'dragon') },
      { label: 'Control', prefer: c => hasRole(c, 'control') || hasTag(c, 'poison') || hasTag(c, 'wound') },
      { label: 'Support', prefer: c => hasRole(c, 'support') || hasRole(c, 'heal') || hasRole(c, 'utility') },
    ]
  },
  raidDef: {
    name: 'Raid Defense',
    purpose: 'Taunt hold and punish attackers.',
    how: 'Taunt first (Brienne / Meryn / Sandor). Sustain second. Screenshot defenses often stack Taunt + Lannister sustain + control.',
    preferredLeader: c => hasRole(c, 'taunt') || hasRole(c, 'protect') || hasTag(c, 'taunt'),
    slots: [
      { label: 'Taunt', prefer: c => hasRole(c, 'taunt') || hasRole(c, 'protect') || hasTag(c, 'taunt') },
      { label: 'Sustain', prefer: c => hasRole(c, 'sustain') || hasRole(c, 'heal') || hasRole(c, 'shields') },
      { label: 'Control', prefer: c => hasRole(c, 'control') || hasTag(c, 'poison') },
      { label: 'Damage', prefer: c => hasRole(c, 'damage') || hasRole(c, 'flex') },
    ]
  },
  viserion: {
    name: 'Viserion',
    purpose: 'Raid + Brittle pressure. Avoid feeding Reinforces.',
    how: 'Do not hit while Pacified. Stack Raid (Euron). Prefer Ice/Brittle tools. Skip pure Shield walls.',
    preferredLeader: c => hasRole(c, 'raid') || hasTag(c, 'raid'),
    slots: [
      { label: 'Raid', prefer: c => hasRole(c, 'raid') || hasTag(c, 'raid') },
      { label: 'Control', prefer: c => hasRole(c, 'control') || hasTag(c, 'ice') || hasTag(c, 'brittle') },
      { label: 'Damage', prefer: c => hasRole(c, 'damage') || hasTag(c, 'brittle') },
      { label: 'Utility', prefer: c => hasRole(c, 'utility') || hasRole(c, 'flex') || hasRole(c, 'support') },
    ]
  },
  drogon: {
    name: 'Drogon',
    purpose: 'Speed and real damage. Shields can be erased.',
    how: 'Favor fast pressure. Raid helps open. Fire lines help — Daemon only shines with multiple dragons, not as a default solo carry.',
    preferredLeader: c => (hasRole(c, 'damage') || hasRole(c, 'pressure')) && (hasTag(c, 'fire') || hasRole(c, 'raid') || hasTag(c, 'raid')),
    slots: [
      { label: 'Damage', prefer: c => hasRole(c, 'damage') && !hasRole(c, 'dragon') },
      { label: 'Raid', prefer: c => hasRole(c, 'raid') || hasTag(c, 'raid') || hasRole(c, 'pressure') },
      { label: 'Damage', prefer: c => hasRole(c, 'damage') || hasRole(c, 'dragon') || hasTag(c, 'fire') },
      { label: 'Utility', prefer: c => hasRole(c, 'utility') || hasRole(c, 'support') || hasRole(c, 'control') },
    ]
  },
  rhaegal: {
    name: 'Rhaegal',
    purpose: 'Bleed / Fire pressure with a protected Taunter.',
    how: 'Protect Taunt (Brienne / Sandor / Jorah). Skill when rewarded. Bleed/Fire/Poison (Oberyn, Olenna) help grind.',
    preferredLeader: c => hasRole(c, 'taunt') || hasRole(c, 'protect') || hasTag(c, 'taunt'),
    slots: [
      { label: 'Taunt', prefer: c => hasRole(c, 'taunt') || hasRole(c, 'protect') },
      { label: 'Damage', prefer: c => hasTag(c, 'bleed') || hasTag(c, 'fire') || hasTag(c, 'poison') || hasRole(c, 'damage') },
      { label: 'Sustain', prefer: c => hasRole(c, 'sustain') || hasRole(c, 'heal') || hasRole(c, 'support') },
      { label: 'Control', prefer: c => hasRole(c, 'control') || hasRole(c, 'pressure') || hasRole(c, 'damage') },
    ]
  },
  icy: {
    name: 'Icy Viserion',
    purpose: 'Ice / control with careful Reinforce use.',
    how: 'Night King / Ice lines help — do not blind-spam Reinforce. Control skill cadence.',
    preferredLeader: c => hasRole(c, 'reinforce') || hasTag(c, 'ice') || hasRole(c, 'control'),
    slots: [
      { label: 'Reinforce', prefer: c => hasRole(c, 'reinforce') || hasTag(c, 'reinforce') || hasTag(c, 'ice') },
      { label: 'Control', prefer: c => hasRole(c, 'control') || hasRole(c, 'reinforce') },
      { label: 'Damage', prefer: c => hasRole(c, 'damage') },
      { label: 'Support', prefer: c => hasRole(c, 'support') || hasRole(c, 'utility') || hasRole(c, 'sustain') },
    ]
  }
};

function avatarHTML(c, size) {
  const s = size || 40;
  return `<div style="width:${s}px;height:${s}px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${s < 40 ? 10 : 12}px;flex-shrink:0;border:2px solid #c9a22733;background:${c.color || '#333'};color:${c.text || '#fff'}">${c.initials || '?'}</div>`;
}

async function fetchChampions() {
  const res = await fetch('champions.json');
  const data = await res.json();
  return data.champions || [];
}
