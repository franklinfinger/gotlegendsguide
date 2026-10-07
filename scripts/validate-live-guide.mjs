import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const env = {};
for (const line of fs.readFileSync(path.join(root, '.env.local'), 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) env[match[1]] = match[2];
}
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error('Missing local publishable Supabase configuration.');
const response = await fetch(`${url.replace(/\/$/,'')}/rest/v1/rpc/got_guide_data`, {headers:{apikey:key,Accept:'application/json'}});
if (!response.ok) throw new Error(`Live guide RPC failed: ${response.status}`);
const data = await response.json();
const checks = {
  championVariants: data.champions?.length,
  portraits: data.champions?.filter(row=>row.portrait).length,
  items: data.items?.length,
  connectedItems: data.items?.filter(row=>row.ownerVariantId && row.abilities.length).length,
  legendaryAssault: data.legendaryAssault?.length,
  warRules: data.warRules?.length,
  currentFactionBonuses: data.factions?.flatMap(row=>row.rules).filter(row=>row.kind==='current_bonus').length,
  factionPlayDescriptions: data.factions?.flatMap(row=>row.rules).filter(row=>row.kind==='how_to_play').length,
  observedTeams: data.teams?.length,
  observedTeamsWithClaimedOutcome: data.teams?.filter(row=>row.outcome!=='not_shown').length,
  raidRules: data.raidRules?.length,
  strategyTeams: data.strategyTeams?.length,
  raidAttackExamples: data.strategyTeams?.filter(row=>/attack/i.test(row.role||'')).length,
  raidDefenseExamples: data.strategyTeams?.filter(row=>/defen/i.test(row.role||'')).length,
};
const expected = {championVariants:108,portraits:96,items:31,connectedItems:31,legendaryAssault:4,warRules:9,currentFactionBonuses:12,factionPlayDescriptions:4,observedTeams:40,observedTeamsWithClaimedOutcome:0,raidRules:8,strategyTeams:15};
for (const [name,value] of Object.entries(expected)) if (checks[name] !== value) throw new Error(`${name}: expected ${value}, received ${checks[name]}`);
if (!checks.raidAttackExamples || !checks.raidDefenseExamples) throw new Error('Raid attack and defense examples must remain separately available.');
const icy = data.legendaryAssault.find(row=>row.name==='Icy Viserion');
if (!icy || icy.abilities.length !== 0) throw new Error('Icy Viserion must be present without invented ability cards.');
console.log(JSON.stringify(checks, null, 2));
