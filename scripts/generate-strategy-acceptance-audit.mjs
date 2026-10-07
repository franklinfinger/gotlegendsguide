import fs from 'node:fs';
import path from 'node:path';
import { recommendTeam } from '../strategy-engine.js';

const root = path.resolve(import.meta.dirname, '..');
const env = {};
for (const line of fs.readFileSync(path.join(root,'.env.local'),'utf8').split(/\r?\n/)) {
  const match=line.match(/^([A-Z_]+)=(.*)$/); if(match) env[match[1]]=match[2];
}
const url=env.NEXT_PUBLIC_SUPABASE_URL, key=env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if(!url||!key) throw new Error('Missing publishable Supabase configuration.');
const headers={apikey:key,Accept:'application/json'};
const [guideData,strategyData]=await Promise.all(['got_guide_data','got_strategy_data'].map(async name=>{
  const response=await fetch(`${url.replace(/\/$/,'')}/rest/v1/rpc/${name}`,{headers});
  if(!response.ok) throw new Error(`${name} failed: ${response.status}`);
  return response.json();
}));
const results=strategyData.targets.map(target=>recommendTeam({guideData,strategyData,targetId:target.id}));
const lines=[];
const push=(...rows)=>lines.push(...rows);
push('# Strategy Engine Acceptance Audit — 2026-10-07','',
  'This report records the live deterministic result for every supported target after the strategy-quality acceptance fixes. “Strongest” means strongest strategic fit from verified mechanics unless a player later supplies roster levels, stars, gear, and items. Rarity, stars, raw power, popularity, and generic strength are not scoring inputs.','',
  'Community-observed compositions are displayed as context with a score contribution of zero. They do not override verified mechanics or imply a victory.','',
  '## Audit summary','',
  `- Targets evaluated: ${results.length}`,
  `- Targets returning five exact variants: ${results.filter(row=>row.status==='ready').length}`,
  `- Insufficient-evidence targets: ${results.filter(row=>row.status!=='ready').length}`,
  `- Live normalized mechanics: ${strategyData.mechanics.length}`,
  `- Live strategy rules: ${strategyData.rules.length}`,
  `- Live exact-variant facts: ${strategyData.championFacts.length}`,'',
  '## Compact result matrix','',
  '| Target | Exact five | Leader |',
  '|---|---|---|',
  ...results.map(result=>`| ${result.target.name} | ${result.status==='ready'?result.team.map(member=>member.champion.name).join('; '):'Insufficient evidence — no team generated'} | ${result.leader?.champion.name||'—'} |`),'');

for(const result of results){
  push(`## ${result.target.name}`,'',`**Target:** \`${result.target.id}\`  `,`**Status:** ${result.status}  `,`**Confidence:** ${result.confidence}`,'');
  if(result.status!=='ready'){
    push(`No team was generated. ${result.target.warning}`,'','### Missing-data warnings','',...result.missingDataWarnings.map(row=>`- ${row}`),'');
    continue;
  }
  push(`**Leader:** ${result.leader?.champion.name||'No sufficiently supported leader'}  `,`**Overall team score:** ${result.overallScore}`,'','### Exact five and role-preserving substitutes','');
  for(const member of result.team){
    push(`#### ${member.champion.name} (\`${member.champion.id}\`)`,'',
      `- Role: ${member.roles.join(' / ')}`,
      `- Individual strategic-fit score: ${member.score}`,
      `- Verified scoring contributions: ${member.scoringContributions.length?member.scoringContributions.map(row=>`${row.mechanicName} ${row.score>0?'+':''}${row.score} from \`${row.factProvenanceRef}\`; inference rule \`${row.ruleId}\` / \`${row.ruleProvenanceRef}\``).join(' | '):'No direct target contribution; selected for team composition coverage.'}`,
      `- Iconic item: ${member.item?.name||'No supported connected item shown'}`,
      `- Primary substitute: ${member.substitute?`${member.substitute.champion.name} (\`${member.substitute.champion.id}\`) — ${member.substitute.reason} Projected team score ${member.substitute.projectedTeamScore}.`:'No eligible substitute.'}`,
      `- Important conflict: ${member.dangers.length?member.dangers.map(row=>`${row.score}: ${row.text}`).join(' | '):'None identified by the target rules.'}`,'');
  }
  push('### Team composition effects','',...(result.teamSynergy.length?result.teamSynergy.map(row=>`- ${row.score>0?'+':''}${row.score}: ${row.text} [${row.evidenceCategory}; \`${row.provenanceRef}\`]`):['- No additional team synergy rule applied.']),'',
    '### Battle plan','',`- Overall strategy: ${result.approach}`,`- Timing and sequence: ${result.timing}`,`- Major dangers: ${result.dangers.join(' | ')}`,'',
    '### Evidence and limits','',`- Verified fact links used: ${result.evidenceSummary.verifiedFacts}`,`- Strategy inferences shown: ${result.evidenceSummary.strategyInferences}`,`- Community observations shown: ${result.evidenceSummary.communityObservations}; score contribution is always zero.`,...result.missingDataWarnings.map(row=>`- Warning: ${row}`),'');
}

const selectedByVariant=new Map();
for(const result of results) if(result.status==='ready') for(const member of result.team){if(!selectedByVariant.has(member.champion.id))selectedByVariant.set(member.champion.id,[]);selectedByVariant.get(member.champion.id).push(result.target.name);}
const substituteByVariant=new Map();
for(const result of results) if(result.status==='ready') for(const member of result.team) if(member.substitute){const id=member.substitute.champion.id;if(!substituteByVariant.has(id))substituteByVariant.set(id,[]);substituteByVariant.get(id).push(`${result.target.name} for ${member.champion.name}`);}
const list=id=>(selectedByVariant.get(id)||[]).join(', ')||'none';
const sublist=id=>(substituteByVariant.get(id)||[]).join(', ')||'none';
push('## Five historical source gaps','',
  `1. **Teaching Me This Lesson III ending** — exact variant \`sqlite-champion-6\`; selected targets: ${list('sqlite-champion-6')}; primary-substitute appearances: ${sublist('sqlite-champion-6')}. The cropped ending is not used to create an unverified mechanic.`,
  `2. **Joffrey Protector Treasury Generator ending** — exact variant \`sqlite-champion-66\`; selected targets: ${list('sqlite-champion-66')}; primary-substitute appearances: ${sublist('sqlite-champion-66')}. Only visible wording may be normalized.`,
  `3. **Cersei Treasury Generator ending** — exact variant \`sqlite-champion-70\`; selected targets: ${list('sqlite-champion-70')}; primary-substitute appearances: ${sublist('sqlite-champion-70')}. When her visible Treasury mechanic contributes to a team synergy, the result emits a partial-source warning.`,
  '4. **Crownlands Knight identity** — no exact variant ID exists. Ambiguous observed names are discarded before pair construction, so this position never affects selection or score.',
  `5. **Red Woman’s Ruby Necklace image** — Melisandre (\`sqlite-champion-42\`) selected targets: ${list('sqlite-champion-42')}; primary-substitute appearances: ${sublist('sqlite-champion-42')}. The verified item relationship and wording remain usable; the absent image has no score effect.`,'');

push('## Acceptance findings and corrections','',
  '- Community co-occurrence previously added a small bonus for every observed pair; ten pair bonuses could collectively outweigh a verified mechanical difference. Community observations now contribute zero points and remain explanatory context only.',
  '- Substitutes previously came from the next global candidate scores. Every selected member now receives a primary substitute chosen first by overlap with that member’s positive target mechanics, then by the projected replacement-team score.',
  '- Leader selection previously accepted any source-backed Leader row. It now requires complete review status and at least 0.8 confidence.',
  '- The result contract and UI previously omitted explicit roles and individual score contributions. Both are now returned and displayed.',
  '- Beam search already evaluated the full team at every expansion. New tests prove complementary setup/payoff mechanics can displace a higher individual score, redundant candidates lose marginal value relative to complementarity, exclusions produce role-appropriate replacements, and tie-breaking is repeatable.','');

push('## Natural-language parser acceptance','',
  '- “What is the strongest team to fight Drogon?” → `legendary-assault:drogon`',
  '- “Build a Raid attack team.” → `raid:attack`',
  '- “What team should I use for Raid defense?” → `raid:defense`',
  '- “Who works best under Ravenous Pack?” → `war:ravenous-pack`',
  '- “Build for Maester’s Sigil.” → `war:maesters-sigil`',
  '- “What works at Scout’s Post?” → `war:scouts-post`',
  '- Ambiguous or unsupported questions return no parsed target and leave the structured selectors available.','');

const output=path.join(root,'docs/STRATEGY_ENGINE_ACCEPTANCE_AUDIT_2026-10-07.md');
fs.writeFileSync(output,`${lines.join('\n')}\n`);
console.log(`Wrote ${path.relative(root,output)} for ${results.length} targets.`);
