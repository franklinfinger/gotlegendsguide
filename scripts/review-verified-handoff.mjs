// Local-only audit helper. Neither this tool nor the importer writes any database.
import fs from 'node:fs';
import path from 'node:path';
import { integrateVerifiedHandoff } from '../verified-handoff.js';
import { catalogIdentities } from '../champion-identities.js';
import { recommendTeam } from '../strategy-engine.js';

const [handoffPath,snapshotPath,outputPath]=process.argv.slice(2);
if (!handoffPath || !snapshotPath || !outputPath) throw Error('Usage: node scripts/review-verified-handoff.mjs HANDOFF_JSON BASE_SNAPSHOT_JSON OUTPUT_JSON');
const repo=path.resolve(import.meta.dirname,'..'),output=path.resolve(outputPath);
if(output===repo||output.startsWith(repo+path.sep))throw Error('Private audit output must be outside the repository and public build.');
const handoff=JSON.parse(fs.readFileSync(handoffPath,'utf8'));
const base=JSON.parse(fs.readFileSync(snapshotPath,'utf8'));
const result=integrateVerifiedHandoff({...base,handoff,identities:catalogIdentities});
const recommendations=[];
for(const targetId of ['legendary-assault:drogon','raid:attack','raid:defense']) {
  if(!result.strategyData.targets.some(row=>row.id===targetId))continue;
  const team=recommendTeam({...result,targetId});
  if(team.team.some(member=>!result.guideData.verifiedCollection.variantIds.includes(member.champion.id)))throw Error('A recommendation escaped the captured collection.');
  recommendations.push({targetId,status:team.status,variantIds:team.team.map(row=>row.champion.id),score:team.overallScore,coverage:team.candidateStats,warnings:team.missingDataWarnings});
}
fs.writeFileSync(output,JSON.stringify({baseSnapshotVersion:base.guideData.version,validationScope:'Supplied local snapshot only; not live API or production validation.',...result.audit,counts:{variants:result.guideData.verifiedCollection.variantIds.length,currentAbilities:result.guideData.verifiedCollection.records.length,currentSkillFacts:result.strategyData.championFacts.filter(row=>/^screenshot-(handoff|review):/.test(row.provenanceRef)).length},recommendations},null,2)+'\n',{mode:0o600});
console.log(`Validated ${result.guideData.verifiedCollection.variantIds.length} exact variants and ${result.guideData.verifiedCollection.records.length} current ability records. Audit saved outside the repository. No network, database, or production changes.`);
