import { reviewedEffects } from './conditional-catalog.js';

const KNOWN_REQUIREMENTS = new Set(['item','leader','resource','enemy_status','owner_applies_status','turn_window','ally_mark','hp_threshold','war_phase']);
const recipientMatches = (provider,outcome,consumer,assignments) =>
  outcome.target==='team' || (outcome.target==='self'&&provider.variantId===consumer.variantId)
  || (outcome.target==='target_ally'&&assignments[provider.id]===consumer.variantId);

/**
 * Structural dependency reasoning, not battle simulation. Source quantities are
 * never expected damage, proc probabilities, or current bank balances. Optional
 * structural ranking credit is bounded and separately gated below.
 * A supported setup means a source-linked prerequisite can be supplied; it does
 * not assert that a Skill fired, a critical strike occurred, or a target survived.
 */
export function evaluateConditionalEffects({
  variantIds,leaderVariantId=null,itemStates={},itemRanks={},enemyStatuses=null,
  enemyMechanics=[],treasuryCoins=null,effects=reviewedEffects,targetId=null,
  turn=null,targetAssignments={},buffAppliedTurns={},warPhase=null,winningAlliance=null,
  currentnessAssumptionSourceIds=[],flatMechanicIds=[],
}={}) {
  const selected=new Set(variantIds||[]);
  const included=effects.filter(effect=>effect.variantId?selected.has(effect.variantId):effect.targetId===targetId);
  const links=[];
  const base=new Map(included.map(effect=>{
    const reasons=[],unknowns=[],blockers=[],unresolvedRequirements=[];
    let quantityApplicability='source_values_only';
    for(const requirement of effect.requirements||[]) {
      if(!KNOWN_REQUIREMENTS.has(requirement.kind)){unknowns.push('An unmodeled prerequisite remains unresolved.');unresolvedRequirements.push(requirement.kind);continue;}
      if(requirement.kind==='leader'&&leaderVariantId!==effect.variantId)blockers.push('Only the explicitly selected Leader can supply this effect.');
      if(requirement.kind==='item') {
        const state=itemStates[effect.variantId]||'unknown';
        if(state==='disabled')blockers.push('The iconic item is disabled.');
        else if(state!=='enabled')unknowns.push('Item enabled state is unknown; its effects are not assumed.');
        const rank=itemRanks[effect.variantId];
        if(rank?.rank===requirement.rank&&rank?.level===requirement.level)quantityApplicability='confirmed_rank';
        else {
          quantityApplicability='source_rank_only';
          unknowns.push(`Source describes rank ${requirement.rank}, item level ${requirement.level}; applicability to the selected item rank is unconfirmed.`);
        }
      }
      if(requirement.kind==='turn_window') {
        if(turn!=null&&turn>requirement.through)blockers.push(`The sourced opening window ends after ${requirement.through} turns.`);
        else if(turn==null)unknowns.push(`Current turn is unknown; this opening effect lasts ${requirement.through} turns, not the whole battle.`);
      }
      if(requirement.kind==='war_phase') {
        if(warPhase!=null&&![3,4].includes(warPhase))blockers.push('This sourced War bonus applies only in Phase 3 or eligible Phase 4.');
        else if(warPhase===4&&winningAlliance===false)blockers.push('Phase 4 applies only to the winning Alliance.');
        else if(warPhase!==3&&!(warPhase===4&&winningAlliance===true))unknowns.push('War phase/Alliance eligibility is not confirmed (both teams in Phase 3, winning Alliance in Phase 4).');
      }
      if(requirement.kind==='resource'&&requirement.resource==='treasury_coins'&&treasuryCoins!=null&&treasuryCoins<requirement.amount)blockers.push(`Treasury has ${treasuryCoins} banked coins; this effect costs ${requirement.amount}.`);
      if(requirement.kind==='ally_mark')unresolvedRequirements.push('ally_mark');
      if(requirement.kind==='hp_threshold')unresolvedRequirements.push('hp_threshold');
      if(requirement.kind==='war_phase'&&warPhase==null)unresolvedRequirements.push('war_phase');
      if(requirement.kind==='turn_window'&&turn==null)unresolvedRequirements.push('turn_window');
      if(requirement.kind==='ally_mark')unknowns.push('The target must already have the specified ally mark before this reapplication.');
      if(requirement.kind==='hp_threshold')unknowns.push(`The HP Guard must activate at ${requirement.amount}% HP; this is not opening income.`);
    }
    return [effect.id,{...effect,status:'conditional_opportunity',reasons,unknowns,blockers,unresolvedRequirements,quantityApplicability,setupBy:[],scoringContribution:0}];
  }));
  // Providers must pass static gates. Conditional events never count as banked
  // resources, and board gems never match the treasury_coins resource.
  // Pure, order-independent provider eligibility. A provider with an unmet
  // prerequisite cannot unlock another effect; cycles never establish proof.
  const eligible=(effect,seen=new Set())=> {
    if(seen.has(effect.id))return false;
    const visited=new Set([...seen,effect.id]);
    return (effect.requirements||[]).every(requirement=>{
      if(requirement.kind==='leader')return leaderVariantId===effect.variantId;
      if(requirement.kind==='item')return itemStates[effect.variantId]==='enabled'&&itemRanks[effect.variantId]?.rank===requirement.rank&&itemRanks[effect.variantId]?.level===requirement.level;
      if(requirement.kind==='turn_window')return turn!=null&&turn<=requirement.through;
      if(requirement.kind==='war_phase')return warPhase===3||(warPhase===4&&winningAlliance===true);
      if(requirement.kind==='resource')return requirement.resource==='treasury_coins'&&treasuryCoins!=null&&treasuryCoins>=requirement.amount;
      if(requirement.kind==='enemy_status'||requirement.kind==='owner_applies_status') {
        if(requirement.kind==='enemy_status'&&enemyStatuses?.includes(requirement.status))return true;
        return included.some(provider=>provider.id!==effect.id&&eligible(provider,visited)&&provider.outcomes.some(outcome=>outcome.kind==='apply_status'&&outcome.status===requirement.status&&['enemy','all_enemies'].includes(outcome.target)&&(requirement.kind!=='owner_applies_status'||provider.variantId===effect.variantId)));
      }
      return false;
    });
  };
  const inWindow=(effect,outcome)=>{
    const applied=buffAppliedTurns[effect.id];
    return !(turn!=null&&applied!=null&&outcome.durationTurns!=null&&turn-applied>=outcome.durationTurns);
  };
  const connect=(provider,consumer,reason)=>{
    const row=base.get(consumer.id);
    if(!row.setupBy.includes(provider.id))row.setupBy.push(provider.id);
    if(!links.some(link=>link.providerEffectId===provider.id&&link.consumerEffectId===consumer.id&&link.reason===reason))links.push({providerEffectId:provider.id,consumerEffectId:consumer.id,reason});
    row.reasons.push(reason);
  };
  for(const effect of included) {
    const row=base.get(effect.id);
    if(!row.blockers.length) {
      if(effect.trigger.kind==='critical_skill_strike') {
        for(const provider of included.filter(effect=>eligible(effect)))for(const outcome of provider.outcomes) {
          if(outcome.kind!=='critical_chance'||!inWindow(provider,outcome))continue;
          if(recipientMatches(provider,outcome,effect,targetAssignments))connect(provider,effect,`${provider.name} can supply a critical-chance buff to this exact champion for ${outcome.durationTurns} turns; use it before the critical Skill trigger. A critical strike is not guaranteed or probability-calculated.`);
          else if(outcome.target==='target_ally'&&!targetAssignments[provider.id])row.unknowns.push(`${provider.name} needs an explicit target assignment to this champion.`);
        }
        if(!row.setupBy.length)row.unknowns.push('A critical Skill strike is required; no compatible applied critical-chance setup is established.');
      }
      for(const requirement of effect.requirements||[]) {
        if(requirement.kind==='resource') {
          if(requirement.resource!=='treasury_coins') {row.unknowns.push('This resource balance is not supplied.');continue;}
          if(treasuryCoins!=null) {
            if(treasuryCoins<requirement.amount)row.blockers.push(`Treasury has ${treasuryCoins} banked coins; this effect costs ${requirement.amount}.`);
            else row.reasons.push(`The supplied balance covers the ${requirement.amount}-coin cost, consumed only when the trigger occurs; other spending can change it.`);
          } else {
            for(const provider of included.filter(effect=>eligible(effect)))for(const outcome of provider.outcomes) {
              if(provider.trigger.kind==='battle_start'&&outcome.kind==='resource'&&outcome.resource===requirement.resource&&outcome.unit==='banked_coins'&&outcome.amount>=requirement.amount)
                connect(provider,effect,`${provider.name} supplies ${outcome.amount} opening banked coins, enough for the ${requirement.amount}-coin cost only if still unspent when the trigger occurs.`);
            }
            row.unknowns.push('Current Treasury balance is unknown. Coin Gems on the board are not banked Treasury coins; no conversion is modeled.');
          }
        }
        if(requirement.kind==='enemy_status'||requirement.kind==='owner_applies_status') {
          const known=requirement.kind==='enemy_status'&&enemyStatuses?.includes(requirement.status);
          if(known)row.reasons.push(`The supplied enemy state includes ${requirement.status.toUpperCase()}.`);
          for(const provider of included.filter(effect=>eligible(effect)))for(const outcome of provider.outcomes) {
            if(outcome.kind==='apply_status'&&outcome.status===requirement.status&&['enemy','all_enemies'].includes(outcome.target)
              &&(requirement.kind!=='owner_applies_status'||provider.variantId===effect.variantId)&&inWindow(provider,outcome))
              connect(provider,effect,`${provider.name} can apply ${requirement.status.toUpperCase()}${outcome.chance!=null?` with a sourced ${outcome.chance*100}% chance`:''}; the effect still requires that status on the correct target at the trigger.`);
          }
          if(!known&&!row.setupBy.some(id=>base.get(id).outcomes.some(outcome=>outcome.kind==='apply_status'&&outcome.status===requirement.status))) {
            if(requirement.kind==='enemy_status'&&Array.isArray(enemyStatuses))row.blockers.push(`No ${requirement.status.toUpperCase()} is present in the supplied enemy state or supported setup; unrelated buffs do not qualify.`);
            else {row.unknowns.push(`The required ${requirement.status.toUpperCase()} state is not established.`);row.unresolvedRequirements.push(requirement.kind);}
          }
        }
      }
      for(const outcome of effect.outcomes.filter(outcome=>outcome.kind==='immunity')) {
        if(enemyMechanics.includes('apply_'+outcome.status)||enemyMechanics.includes(outcome.status+'_payoff'))
          row.reasons.push(`If the item is enabled and matches the sourced rank, personal ${outcome.status.toUpperCase()} immunity could address the supplied enemy mechanic for this champion only, not the other four members.`);
      }
    }
    const triggerLabels={defeat:'Defeat must occur before this effect can spend Treasury and revive.',reapply_mark:'Reapplying to an already marked ally is required; the first cast does not grant these coins.',hp_guard:'HP Guard activation is required; these coins do not exist at battle start.',enemy_skill:'The enemy must use its Skill while the prerequisite holds.',battle_start:'This is an opening effect, not recurring income.'};
    if(triggerLabels[effect.trigger.kind])row.reasons.push(triggerLabels[effect.trigger.kind]);
    row.reasons.push(...row.blockers,...row.unknowns);
    row.status=row.blockers.length?'blocked':row.setupBy.length&&!row.unresolvedRequirements.length&&row.quantityApplicability!=='source_rank_only'&&!row.unknowns.some(text=>/enabled state/.test(text))?'supported_setup':'conditional_opportunity';
    row.reasons.push('Source transcription coverage is not fresh game verification. Quantities are source values, not predicted outcomes.');
  }
  // Optional, bounded derived ranking credit. Currentness and active buff timing must be explicit scenario assumptions;
  // caller assertions never change immutable source verification metadata.
  // One credit per consuming champion avoids double counting Helm's split outputs.
  const rankingContributions=[],creditedOwners=new Set();
  const overlaps=flatMechanicIds.some(id=>['critical','coin_gems','spawn_coin_gems','treasury'].includes(id));
  if(!overlaps&&turn!=null)for(const link of links) {
    const consumer=base.get(link.consumerEffectId),provider=base.get(link.providerEffectId);
    const output=provider.outcomes.find(outcome=>outcome.kind==='critical_chance');
    const applied=buffAppliedTurns[provider.id];
    if(consumer.status!=='supported_setup'||consumer.trigger.kind!=='critical_skill_strike'||consumer.quantityApplicability!=='confirmed_rank'||!output||applied==null||applied>turn||!inWindow(provider,output))continue;
    if(![consumer,provider].every(effect=>effect.source.reviewStatus==='complete'&&currentnessAssumptionSourceIds.includes(effect.source.sourceId)))continue;
    if(creditedOwners.has(consumer.variantId)||rankingContributions.length>=3)continue;
    creditedOwners.add(consumer.variantId);
    rankingContributions.push({id:'conditional-'+consumer.id,providerEffectId:provider.id,consumerEffectId:consumer.id,score:2,assumptionBased:true,sourceIds:[provider.source.sourceId,consumer.source.sourceId],reason:`${provider.name} supplies a scenario-timed critical setup for ${consumer.name}; +2 bounded heuristic points under explicitly assumed source currentness, not fresh verification, activation probability, or expected damage.`});
  }
  const scoringContribution=rankingContributions.reduce((sum,row)=>sum+row.score,0);
  const modeledVariantIds=[...new Set(included.map(effect=>effect.variantId).filter(Boolean))];
  return {effects:[...base.values()],links,rankingContributions,scoringContribution,coverage:{
    modeledVariantIds,unmodeledVariantIds:[...selected].filter(id=>!modeledVariantIds.includes(id)),
    label:'Partial reviewed effect subset; no selected champion portfolio is claimed fully interpreted.',
  }};
}
