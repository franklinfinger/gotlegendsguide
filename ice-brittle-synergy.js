// A source-bounded sequence, not a score, combat simulation or fixed five-person team.
const CORE={ned:'sqlite-champion-2',brienne:'sqlite-champion-51',rickard:'sqlite-champion-38'};
export const iceBrittleCore=Object.freeze([
  Object.freeze({id:CORE.ned,name:'Ned Stark — Warden Of The North',shortName:'Ned'}),
  Object.freeze({id:CORE.brienne,name:'Brienne Of Tarth — True Knight',shortName:'Brienne'}),
  Object.freeze({id:CORE.rickard,name:'Rickard Karstark — Lord Of Karhold',shortName:'Rickard'}),
]);
const identity=value=>String(value||'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const text=value=>String(value||'').replace(/\s+/g,' ').trim();
const names={ned:'ned stark warden of the north',brienne:'brienne of tarth true knight',rickard:'rickard karstark lord of karhold'};
const wording={
  ned:/^At the start of combat and each new wave, all enemies are afflicted with 1 ICE\. Ned is immune to BRITTLE\.$/,
  brienne:/^Brienne strikes an enemy for \d+% ATK Physical Damage and strikes adjacent enemies for \d+% ATK Physical Damage\. Each of these enemies become afflicted with 2 ICE\.$/,
  rickard:/^Rickard afflicts an enemy with 2 ICE and 1 BLEED\. If his target was already BRITTLE, they are afflicted with 3 BLEED instead\. He then strikes them for \d+% ATK Physical Damage\. If Rickard defeats his target, he refunds \d+% Stamina\.$/,
  brittle:/^Applied when 5 ICE accumulate\. BRITTLE targets take 2x damage from champion Skills and Traits\. Cannot be REMOVED\.$/i,
};
const verified=row=>row?.reviewStatus==='complete'&&!row.historicalReference&&!!(row.captureDate||row.reviewCompletedDate)&&!!row.provenanceRef&&row.sourceFilenames?.length>0&&!/…|\.\.\./.test(row.text||'');
const reference=row=>row.provenanceRef+':'+row.sourceFilenames.join(',');

/** Only the captured trio and a selected Warden Leader establish the proposed
 * opening 1 + two Skill applications of 2. No chance-based ICE is counted. */
export function evaluateIceBrittleSynergy({guideData,battleMode,variantIds=[],leaderVariantId=null}) {
  const empty={status:'not_applicable',score:0,steps:[],limitations:[],sourceRefs:[],sourceEvidence:[]};
  const collection=guideData?.verifiedCollection;
  if(!collection||!['raid','war'].includes(battleMode)||!Object.values(CORE).every(id=>variantIds.includes(id)))return empty;
  if(new Set(variantIds).size!==variantIds.length||variantIds.length>5||variantIds.some(id=>!collection.variantIds?.includes(id)||!guideData.champions.some(row=>row.id===id&&row.releaseState==='live'))||leaderVariantId&&!variantIds.includes(leaderVariantId))return {...empty,status:'invalid_selection',limitations:['Select distinct, captured exact variants and a Leader belonging to this lineup. No setup is inferred.']};
  const matched={};
  for(const [key,id] of Object.entries(CORE)) {
    const champion=guideData.champions.find(row=>row.id===id);
    if(identity(champion?.name)!==names[key])return {...empty,status:'source_incomplete',limitations:['The exact Warden Ned, True Knight Brienne and Lord of Karhold Rickard identities must match the captured sources. No same-character substitution is made.']};
    const rows=(collection.records||[]).filter(row=>row.variantId===id&&(key==='ned'?row.kind==='trait'&&row.context==='leader':row.kind==='skill'));
    if(rows.length!==1||!verified(rows[0])||!wording[key].test(text(rows[0].text)))return {...empty,status:'source_incomplete',limitations:['A unique complete, source-matched current opening Leader trait and both Skills are required. Partial, changed, historical or ambiguous records do not establish this sequence.']};
    matched[key]=rows[0];
  }
  const definitions=(collection.effectDefinitionUpdates||[]).filter(row=>row.effectName==='BRITTLE');
  if(!definitions.length||definitions.some(row=>!verified(row)||!row.reviewCompletedDate||!wording.brittle.test(text(row.text))))return {...empty,status:'definition_unverified',limitations:['The complete captured BRITTLE definition must explicitly establish the five-ICE threshold. Missing, partial or conflicting definitions, historical wording and bare ICE tags do not activate this plan.']};
  const evidence=[matched.ned,matched.brienne,matched.rickard,...definitions];
  const sources={sourceRefs:[...new Set(evidence.map(reference))],sourceEvidence:evidence.map(row=>({name:row.name||row.title,text:row.text,provenanceRef:reference(row),captureDate:row.captureDate||null,reviewCompletedDate:row.reviewCompletedDate||null}))};
  if(leaderVariantId!==CORE.ned)return {...empty,...sources,status:'leader_not_selected',limitations:['Ned — Warden Of The North must be selected as Leader for his opening ICE. The two cited Skills supply 2 + 2 ICE, only four from zero; do not assume the fifth mark from a different Leader, an item, a random proc or a previous turn.']};
  return {...empty,...sources,status:'conditional_plan',coreVariantIds:Object.values(CORE),leaderVariantId:CORE.ned,setupIce:5,thresholdIce:5,
    steps:[
      {id:'opening-ice',variantId:CORE.ned,ice:1,sourceRefs:[reference(matched.ned)],text:'At combat start or a new wave, Warden Ned as Leader supplies the recorded 1 ICE to eligible enemies. This is an opening condition, not a once-per-turn application.'},
      {id:'brienne-ice',variantId:CORE.brienne,ice:2,sourceRefs:[reference(matched.brienne)],text:'When True Knight Brienne can use her Skill, choose the intended target. Her Skill applies 2 ICE after its strikes, including to that target. If the opening mark remains and the application succeeds, the target now has 3 ICE.'},
      {id:'rickard-ice',variantId:CORE.rickard,ice:2,sourceRefs:[reference(matched.rickard),...definitions.map(reference)],text:'When Rickard can use his Skill, target that same surviving enemy. The recorded 2 ICE brings the conditional setup to 5 ICE, the captured BRITTLE threshold. Rickard places the ICE clause before his damage; this model does not resolve intra-Skill trigger ordering.'},
      {id:'confirm-payoff',variantId:null,ice:0,sourceRefs:definitions.map(reference),text:'Confirm that the target is BRITTLE before relying on subsequent Skill or trait damage. The popup states 2x damage from Champion Skills and Traits; it does not establish a further multiplier for Gems, basic attacks or stacking with a champion-specific damage bonus.'},
    ],
    limitations:[
      'This is a conditional three-champion setup core, not a best-team claim. The other two slots remain free and the model adds no ranking points.',
      'The 1 + 2 + 2 arithmetic assumes a fresh, non-BRITTLE target with no ICE before Ned’s opening mark and no other ICE changes. If it is already BRITTLE, Rickard’s separate BLEED clause must be considered instead.',
      'The target must survive both setup Skills, remain targetable, and be able to receive ICE and BRITTLE. Check immunity, prevention and other protections before attempting the sequence.',
      'All three applications must succeed and the opening ICE must remain. No unshown accuracy, resistance, removal timing, proc probability or extra stack is assumed.',
      'No starting Stamina, exact turn, repeated rotation or enemy response is modeled. Use the order only when the required Skills are available; do not assume both can fire in one turn.',
      'No damage totals or compounded multipliers are calculated. ICE’s 5% Stamina and 20% BRITTLE wording is not turned into an unshown per-stack equation.',
      'No iconic item, Ally Gem, faction bonus, chance-based bonus ICE or locked upgrade is required or credited. Captured values are dated source evidence, not live game state.',
    ]};
}

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function iceBrittleSynergyMarkup(result) {
  const model=result.iceBrittleSynergy;
  if(!model||model.status==='not_applicable')return '';
  return `<section class="team-plan"><div><h3>ICE to BRITTLE · conditional setup</h3><p>No additional score. ${esc(model.status.replaceAll('_',' '))}.</p>${model.steps.length?`<ol>${model.steps.map(row=>`<li>${esc(row.text)}</li>`).join('')}</ol>`:''}<ul>${model.limitations.map(note=>`<li>${esc(note)}</li>`).join('')}</ul><details><summary>Exact setup sources</summary>${model.sourceEvidence.map(row=>`<p><strong>${esc(row.name)}</strong>: ${esc(row.text)}</p><p class="subtle-note">${esc(row.provenanceRef)}${row.captureDate?' · captured '+esc(row.captureDate):''}${row.reviewCompletedDate?' · reviewed '+esc(row.reviewCompletedDate):''}</p>`).join('')}</details></div></section>`;
}
