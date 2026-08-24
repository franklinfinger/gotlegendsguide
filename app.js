/* GOT Legends Guide — roster + team builder */
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

function ownedChampions(all, roster) {
  return all.filter(c => isOwned(roster, c.id));
}

function scoreChamp(c, modeKey) {
  const base = (c.scores && c.scores[modeKey]) || 0;
  return base * 10 + (c.leader || 0) * 2 + (c.rarity === 'legendary' ? 3 : 0);
}

function hasRole(c, role) {
  return (c.roles || []).includes(role);
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

function fillTeam(pool, slots, modeKey) {
  // slots: array of { prefer: fn, label }
  const team = [];
  let remaining = pool.slice();
  for (const slot of slots) {
    const pick = pickBest(remaining, slot.prefer, modeKey);
    if (pick) {
      team.push({ champ: pick, roleLabel: slot.label });
      remaining = removeFrom(remaining, pick);
    }
  }
  // fill to 5 with best remaining
  while (team.length < 5 && remaining.length) {
    remaining.sort((a, b) => scoreChamp(b, modeKey) - scoreChamp(a, modeKey));
    const pick = remaining[0];
    team.push({ champ: pick, roleLabel: 'Flex' });
    remaining = removeFrom(remaining, pick);
  }
  // ensure highest leader skill is marked leader if present
  if (team.length) {
    let bestIdx = 0;
    for (let i = 1; i < team.length; i++) {
      if ((team[i].champ.leader || 0) > (team[bestIdx].champ.leader || 0)) bestIdx = i;
    }
    // prefer explicit leader-role champs
    for (let i = 0; i < team.length; i++) {
      if (hasRole(team[i].champ, 'leader') && (team[i].champ.leader || 0) >= (team[bestIdx].champ.leader || 0)) {
        bestIdx = i;
      }
    }
    const leader = team.splice(bestIdx, 1)[0];
    team.unshift({ ...leader, roleLabel: 'Leader' });
  }
  return { team, remaining };
}

function buildWarTeams(owned) {
  let pool = owned.slice();
  const teams = [];

  // Team 1 — Offense
  let r = fillTeam(pool, [
    { label: 'Damage', prefer: c => hasRole(c, 'damage') || hasRole(c, 'dragon') },
    { label: 'Damage', prefer: c => hasRole(c, 'damage') || hasRole(c, 'dragon') || hasRole(c, 'pressure') },
    { label: 'Utility', prefer: c => hasRole(c, 'utility') || hasRole(c, 'control') || hasRole(c, 'flex') },
    { label: 'Support', prefer: c => hasRole(c, 'support') || hasRole(c, 'heal') || hasRole(c, 'fury') },
  ], 'war');
  teams.push({
    name: 'Team 1 — Offense',
    purpose: 'Primary damage and pressure. Place where the fight is hardest.',
    how: 'Lead with your strongest damage threat. Use utility to open, then finish.',
    ...r
  });
  pool = r.remaining;

  // Team 2 — Hold
  r = fillTeam(pool, [
    { label: 'Taunt', prefer: c => hasRole(c, 'taunt') || hasRole(c, 'protect') },
    { label: 'Sustain', prefer: c => hasRole(c, 'sustain') || hasRole(c, 'heal') || hasRole(c, 'shields') },
    { label: 'Control', prefer: c => hasRole(c, 'control') || hasRole(c, 'utility') },
    { label: 'Flex', prefer: c => true },
  ], 'war');
  teams.push({
    name: 'Team 2 — Hold',
    purpose: 'Taunt + sustain to outlast contested outposts.',
    how: 'Keep Taunt up. Let sustain do the work. Do not chase glass-cannon trades.',
    ...r
  });
  pool = r.remaining;

  // Team 3 — Raid / Burst
  r = fillTeam(pool, [
    { label: 'Raid', prefer: c => hasRole(c, 'raid') || (c.tags || []).includes('raid') },
    { label: 'Damage', prefer: c => hasRole(c, 'damage') || hasRole(c, 'pressure') || hasRole(c, 'dragon') },
    { label: 'Control', prefer: c => hasRole(c, 'control') || hasRole(c, 'utility') },
    { label: 'Support', prefer: c => hasRole(c, 'support') || hasRole(c, 'heal') || true },
  ], 'war');
  teams.push({
    name: 'Team 3 — Raid / Burst',
    purpose: 'Apply Raid and burst tanky defenses.',
    how: 'Land Raid first, then dump damage. Good into heavy Taunt / sustain walls.',
    ...r
  });
  pool = r.remaining;

  // Team 4 — Flex
  r = fillTeam(pool, [
    { label: 'Control', prefer: c => hasRole(c, 'reinforce') || hasRole(c, 'control') },
    { label: 'Utility', prefer: c => hasRole(c, 'utility') || hasRole(c, 'flex') || hasRole(c, 'support') },
    { label: 'Flex', prefer: c => true },
    { label: 'Flex', prefer: c => true },
  ], 'war');
  teams.push({
    name: 'Team 4 — Flex',
    purpose: 'Leftovers with a job — reinforce, control, or pure depth.',
    how: 'Use for secondary outposts or as the plan B lineup. Still field five with clear roles.',
    ...r
  });

  return teams;
}

function buildSingleTeam(owned, modeKey, profile) {
  const r = fillTeam(owned.slice(), profile.slots, modeKey);
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
    how: 'Apply Raid, then damage. Control keeps the fight clean.',
    slots: [
      { label: 'Raid', prefer: c => hasRole(c, 'raid') || (c.tags || []).includes('raid') },
      { label: 'Damage', prefer: c => hasRole(c, 'damage') || hasRole(c, 'dragon') },
      { label: 'Damage', prefer: c => hasRole(c, 'damage') || hasRole(c, 'pressure') },
      { label: 'Control', prefer: c => hasRole(c, 'control') || hasRole(c, 'utility') },
    ]
  },
  raidDef: {
    name: 'Raid Defense',
    purpose: 'Taunt hold and punish attackers.',
    how: 'Taunt first. Sustain second. Keep a damage threat to punish.',
    slots: [
      { label: 'Taunt', prefer: c => hasRole(c, 'taunt') || hasRole(c, 'protect') },
      { label: 'Sustain', prefer: c => hasRole(c, 'sustain') || hasRole(c, 'heal') || hasRole(c, 'shields') },
      { label: 'Control', prefer: c => hasRole(c, 'control') || hasRole(c, 'reinforce') },
      { label: 'Damage', prefer: c => hasRole(c, 'damage') || hasRole(c, 'flex') },
    ]
  },
  viserion: {
    name: 'Viserion',
    purpose: 'Raid + Brittle pressure. Avoid feeding Reinforces.',
    how: 'Do not hit while Pacified. Stack Raid. Prefer Brittle tools. Skip pure Shield walls.',
    slots: [
      { label: 'Raid', prefer: c => hasRole(c, 'raid') || (c.tags || []).includes('raid') },
      { label: 'Damage', prefer: c => hasRole(c, 'damage') || hasRole(c, 'dragon') },
      { label: 'Control', prefer: c => hasRole(c, 'control') || hasRole(c, 'utility') },
      { label: 'Damage', prefer: c => hasRole(c, 'damage') || hasRole(c, 'pressure') },
    ]
  },
  drogon: {
    name: 'Drogon',
    purpose: 'Speed and real damage. Shields can be erased.',
    how: 'Favor fast pressure over pure tanks. Bring Raid if you have it.',
    slots: [
      { label: 'Damage', prefer: c => hasRole(c, 'damage') || hasRole(c, 'dragon') || hasRole(c, 'pressure') },
      { label: 'Raid', prefer: c => hasRole(c, 'raid') || hasRole(c, 'pressure') },
      { label: 'Damage', prefer: c => hasRole(c, 'damage') || hasRole(c, 'dragon') },
      { label: 'Utility', prefer: c => hasRole(c, 'utility') || hasRole(c, 'support') },
    ]
  },
  rhaegal: {
    name: 'Rhaegal',
    purpose: 'Bleed / Fire pressure with a protected Taunter.',
    how: 'Protect Taunt. Skill every turn when rewarded. Fire/Bleed help.',
    slots: [
      { label: 'Taunt', prefer: c => hasRole(c, 'taunt') || hasRole(c, 'protect') },
      { label: 'Damage', prefer: c => hasRole(c, 'damage') || hasRole(c, 'dragon') },
      { label: 'Sustain', prefer: c => hasRole(c, 'sustain') || hasRole(c, 'heal') || hasRole(c, 'support') },
      { label: 'Pressure', prefer: c => hasRole(c, 'pressure') || hasRole(c, 'fury') || hasRole(c, 'damage') },
    ]
  },
  icy: {
    name: 'Icy Viserion',
    purpose: 'Reinforce engines punish this boss.',
    how: 'Lean Night King / Ice / Bran lines. Control skill cadence.',
    slots: [
      { label: 'Reinforce', prefer: c => hasRole(c, 'reinforce') || (c.tags || []).includes('reinforce') },
      { label: 'Reinforce', prefer: c => hasRole(c, 'reinforce') || hasRole(c, 'control') },
      { label: 'Damage', prefer: c => hasRole(c, 'damage') || hasRole(c, 'dragon') },
      { label: 'Support', prefer: c => hasRole(c, 'support') || hasRole(c, 'utility') || hasRole(c, 'sustain') },
    ]
  }
};

function avatarHTML(c, size) {
  const s = size || 40;
  return `<div style="width:${s}px;height:${s}px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${s < 40 ? 10 : 12}px;flex-shrink:0;border:2px solid #c9a22733;background:${c.color};color:${c.text}">${c.initials}</div>`;
}

async function fetchChampions() {
  const res = await fetch('champions.json');
  const data = await res.json();
  return data.champions || [];
}