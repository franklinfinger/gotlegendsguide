// Narrow denylist of source wordings contradicted by the released September
// update. Keep historical records intact; do not infer replacement quantities.
export const septemberFactionUpdate = Object.freeze({
  releasedOn: '2026-09-29',
  reviewedOn: '2026-11-03',
  releaseUrl: 'https://www.gameofthroneslegends.com/news/release-1-0-634-patch-notes',
  detailsUrl: 'https://www.gameofthroneslegends.com/news/the-broader-factions-update',
});

const issue = (id, message) => Object.freeze({id, state:'superseded', message,
  replacementState:'needs_review', sourceUrls:[septemberFactionUpdate.releaseUrl,septemberFactionUpdate.detailsUrl]});
const khaleesiLeader = issue('khaleesi-leader-charge', 'Khaleesi: the old percentage-Stamina Leader wording was superseded by the September faction release. Current CHARGE wording and quantities need review; no Leader refund credit is assigned.');
const khaleesiPassive = issue('khaleesi-passive-charge', 'Khaleesi: the old passive percentage-Stamina wording needs replacement review after the September faction release. No old HP-Guard or defeat Stamina quantity is used.');
const drogoLeader = issue('drogo-leader-charge', 'Khal Drogo: the old Leader record includes the superseded 50% opening Stamina. Current CHARGE wording and quantities need review; this historical Leader record receives no credit.');
const freeCitiesBonus = issue('free-cities-faction-bonus', 'Free Cities: the stored 35% Stamina-cost faction bonus conflicts with the September faction release. Its replacement and activation evidence need review; no faction bonus credit is assigned.');

/** A complete transcription is not proof that its mechanics remain current.
 * Exact variant and trait wording scope this guard, leaving Skills, items and
 * independent encounter effects alone. It also covers legacy flat-score facts. */
export function mechanicCurrentnessIssue(record) {
  const trait = record.source?.table === 'champion_traits' || ['leader','trait'].includes(record.context);
  if (!trait) return null;
  const text = String(record.source?.exactText || record.factText || '').replace(/\s+/g,' ');
  if (record.variantId === 'sqlite-champion-19') {
    if (/After a team member uses their Skill, Daenerys grants them \+10% Stamina/i.test(text)) return khaleesiLeader;
    if (/When the HP Guard is activated, she gains 100% Stamina/i.test(text)) return khaleesiPassive;
  }
  if (record.variantId === 'sqlite-champion-5' && /All Free Cities team members begin combat with \+50% Stamina/i.test(text)) return drogoLeader;
  return null;
}

export function factionCurrentnessIssue(faction) {
  const bonus = faction.rules?.find(row=>row.kind==='current_bonus');
  return faction.name === 'Free Cities' && /stamina cost reduced 35%/i.test(bonus?.text || '') ? freeCitiesBonus : null;
}
