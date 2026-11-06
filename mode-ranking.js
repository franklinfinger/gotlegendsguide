import { capturedDevelopment } from './captured-development.js';
import { mechanicCurrentnessIssue } from './mechanics-currentness.js';

// A declared selection preference, not a game rule, strength model or score.
export const usesSevenStarPreference = battleMode => ['raid','war'].includes(battleMode);
const currentEvidence = fact => !fact.historical && !fact.currentnessIssue && !mechanicCurrentnessIssue(fact) &&
  ![fact.currentness, fact.currentnessState, fact.sourceState, fact.source?.currentness].some(value => /historical|stale|superseded|unconfirmed|needs.review|unverified|partial|conflict/i.test(String(value || '')));
export const isPreferenceCombatFact = fact => fact && fact.reviewStatus === 'complete' &&
  ['ability','skill','trait','passive','item','associated_unit','leader'].includes(fact.context) &&
  typeof fact.provenanceRef === 'string' && fact.provenanceRef.trim() && typeof fact.mechanicId === 'string' && fact.mechanicId && currentEvidence(fact) &&
  !fact.mechanicId.startsWith('faction_') && !['unverified_release','legendary_assault_only'].includes(fact.mechanicId);
export const isPreferenceRule = rule => !!rule?.provenanceRef && !['partial','unreviewed'].includes(rule.reviewStatus) && currentEvidence(rule);
const activeCombatFacts = (member, leaderId = null) => member.facts.filter(fact => isPreferenceCombatFact(fact) && (fact.context !== 'leader' || member.champion.id === leaderId));

export function canPreferSevenStar(member) {
  return member.development?.stars === 7 && member.score >= 0 && member.facts.some(isPreferenceCombatFact);
}

export function sevenStarContributors(team, evaluation) {
  const leaderId = evaluation.leader?.champion.id;
  return team.filter(member => {
    if (!canPreferSevenStar(member) || !activeCombatFacts(member, leaderId).length) return false;
    const direct = member.score > 0 && member.contributions.some(row => row.score > 0 && isPreferenceCombatFact(row.fact) && isPreferenceRule(row.rule));
    const leader = member.champion.id === leaderId && member.leaderPotential > 0 && member.leaderFacts.some(fact => fact.mechanicId === 'leader_effect' && isPreferenceCombatFact(fact));
    const synergy = evaluation.explanations.some(row => row.score > 0 && row.provenanceRef && row.preferenceContributorIds?.includes(member.champion.id));
    return direct || leader || synergy;
  }).map(member => member.champion.id).sort();
}

export function compareModeTeams(left, right, battleMode) {
  return (usesSevenStarPreference(battleMode) ? (right.sevenStarContributorIds?.length || 0) - (left.sevenStarContributorIds?.length || 0) : 0) || right.score - left.score;
}

export function rankingPolicy({battleMode, team = [], sevenStarContributorIds = [], suppliedLineupKeptExact = false}) {
  const observations = team.map(row => capturedDevelopment(row.champion || row));
  const preferenceMode = usesSevenStarPreference(battleMode);
  const active = preferenceMode && !suppliedLineupKeptExact;
  return {
    id: suppliedLineupKeptExact ? 'supplied-exact-lineup' : preferenceMode ? 'seven-star-viable-then-mechanics' : 'mechanics-and-synergy',
    active, suppliedLineupKeptExact,
    summary: suppliedLineupKeptExact
      ? 'The supplied lineup and Leader are kept exact, not reranked by development.'
      : preferenceMode
        ? 'Raid and War prefer more source-confirmed seven-star contributors, then modeled target fit and team synergy. This is your selection preference, not a verified strength formula.'
        : 'This mode ranks modeled target fit and synergy without a stars, level or displayed-power preference.',
    viabilityRule: 'Seven-star preference requires current source-linked combat evidence, a nonnegative direct target-fit score, and positive direct fit, selected-Leader fit or an active source-linked team synergy. A star-only profile or net-negative direct fit receives no preference.',
    scoreMeaning: 'The numeric score is unchanged modeled mechanics fit, not champion power, predicted damage or win probability. Development preference is a separate ordering rule.',
    limitations: [
      'Only complete, current source-linked combat evidence can support the seven-star preference. Direct fit must be nonnegative, with positive direct fit, selected-Leader fit or an active source-linked synergy; star-only and net-negative-fit filler gets no preference.',
      'Seven stars are a preference, not a guarantee of strength. Other known star ranks are not ordered; unknown stars receive no preference and are not treated as zero stars.',
      'Level and displayed power are not used for ranking. Power is a dated, gear-dependent snapshot; no gear allocation or persistent equipment is assumed.',
      'Synergy and target rules still determine mechanics scores. Explicit required/excluded variants and supplied lineups remain binding.',
      'Only supplied, source-covered candidate evidence is compared. Missing champions or incomplete ability portfolios can change the choices.',
      'Search is bounded and heuristic, not an exhaustive proof of the strongest team.',
    ],
    sevenStarContributorIds: [...sevenStarContributorIds],
    knownStarCount: observations.filter(row => row?.stars != null).length,
    unknownStarCount: observations.filter(row => row?.stars == null).length,
    sourceRefs: [...new Set(observations.map(row => row?.provenanceRef).filter(Boolean))],
  };
}
