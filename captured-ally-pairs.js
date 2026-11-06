// Local reviewed-popup evidence only. Pair presence is not a Gem activation,
// a source of new collection members, or a combat/ranking contribution.
const identity=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const wording=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/’/g,"'").replace(/\s+/g,' ').trim();
const unique=values=>[...new Set(values)];
const plain=value=>String(value||'').replace(/\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/\*\*/g,'').trim();
const sourceNames=value=>unique(String(value||'').match(/IMG_\d+\.(?:PNG|JPE?G)/gi)||[]);
const identityPattern=/^(.+?)\s+[—–]\s+([^,\n]+),\s*owned\./i;
const bodyPattern=/^\s*(?:“([^”]+)”|([^“”]+?))\s+replaces\s+(Color Clear|Area Clear|Vertical Clear|Horizontal Clear|Seeker) Power-Ups\.\s*(?:“([^”]+)”|([^“”]+?)):\s*“(When activated,[^”]+)”/i;
function supportedTail(value) {
  // Only the two known editorial notes and source citations may follow the
  // complete quote. Any new qualifier, contradiction or preview needs review.
  return !value.replace(/This popup is evidence of the ally['’]s \*?exact variant\*?, not a replacement for that variant['’]s own ability panels\./gi,'')
    .replace(/This matches the reciprocal link in IMG_\d+\.(?:PNG|JPE?G)\./gi,'')
    .replace(/\b(?:IMG_\d+\.(?:PNG|JPE?G)|Sources?)\b/gi,'').replace(/[\s.,;:]/g,'');
}

/** Parse only the reviewed handoff's two explicit ally-popup fields. Unknown
 * formats are audited, not recovered by guessing titles or quoted previews. */
export function prepareCapturedAllyPairs({handoff,mappings}) {
  const issues=[],records=[],mapped=new Map(mappings.map(row=>[row.groupId,row]));
  const byName=new Map();
  for(const row of mappings) {
    const key=identity(row.name);
    if(!byName.has(key))byName.set(key,[]);
    byName.get(key).push(row);
  }
  for(const group of handoff.champion_capture_groups) {
    if(group.duplicate_of_group_id)continue;
    for(const field of ['linked_ally_popup','ally']) {
      if(group.fields_as_recorded[field]==null)continue;
      const raw=group.fields_as_recorded[field],value=plain(raw),owner=mapped.get(group.capture_group_id);
      const sourceFilenames=sourceNames(raw);
      if(sourceFilenames.some(name=>!handoff.all_reviewed_source_filenames.includes(name)))throw Error(`Unreviewed Ally Gem source in ${group.capture_group_id}/${field}.`);
      const match=identityPattern.exec(value);
      const allyName=match?`${match[1].trim()} — ${match[2].trim()}`:null;
      const candidates=allyName?byName.get(identity(allyName))||[]:[];
      const ally=candidates.length===1?candidates[0]:null;
      const body=match?bodyPattern.exec(value.slice(match[0].length)):null;
      const tail=body?value.slice(match[0].length+body[0].length):'';
      const reason=!owner?'The popup owner has no captured exact identity.':!match?'The popup must name its ally and exact variant explicitly.':candidates.length>1?'The ally exact identity is ambiguous.':!sourceFilenames.length?'The popup is missing a reviewed source filename.':!body?'The replacement Power-Up and one complete activated Gem effect must be explicit.':/…|\.\.\./.test(body[6])||!/[.!?]$/.test(body[6])?'Clipped or unfinished Gem wording cannot establish a complete pair effect.':!supportedTail(tail)?'Unrecognized trailing wording needs review before choosing a pair effect; no qualifier or additional quotation is discarded.':null;
      const record={ownerVariantId:owner?.variantId||null,ownerName:owner?.name||`${group.champion} — ${group.exact_variant}`,allyVariantId:ally?.variantId||null,allyName,
        pairName:body?(body[1]||body[2]).trim():null,replaces:body?body[3]+' Power-Ups':null,gemName:body?(body[4]||body[5]).trim().replace(/:$/,''):null,effect:body?body[6]:null,
        reviewStatus:reason?'partial':'complete',captureDate:handoff.capture_date,reviewCompletedDate:handoff.review_completed_date||null,sourceFilenames,
        provenanceRef:`screenshot-handoff:${handoff.capture_date}:${group.capture_group_id}:${field}`,captureGroupId:group.capture_group_id,field};
      records.push(record);
      if(reason)issues.push({groupId:group.capture_group_id,field,sourceFilenames,reason});
    }
  }
  const grouped=new Map();
  for(const record of records) {
    const key=record.allyVariantId?[record.ownerVariantId,record.allyVariantId].sort().join('|'):`${record.ownerVariantId}|uncaptured:${identity(record.allyName)}`;
    if(!grouped.has(key))grouped.set(key,[]);
    grouped.get(key).push(record);
  }
  const pairs=[...grouped].map(([key,sources])=>{
    const first=sources[0],variantIds=unique([first.ownerVariantId,first.allyVariantId].filter(Boolean));
    const conflict=sources.some(row=>['pairName','replaces','gemName','effect'].some(field=>wording(row[field])!==wording(first[field])));
    const status=sources.some(row=>row.reviewStatus!=='complete')?'source_incomplete':conflict?'source_conflict':!first.allyVariantId?'partner_not_captured':variantIds.length!==2?'invalid_pair':'captured_pair';
    if(status==='source_conflict'||status==='invalid_pair')issues.push({field:'ally_pair',sourceFilenames:unique(sources.flatMap(row=>row.sourceFilenames)),reason:status==='source_conflict'?'Captured sources disagree for the same exact pair; no Gem effect is selected.':'An Ally Gem needs two distinct exact variants.'});
    return {id:'captured-ally:'+key,status,variantIds,ownerName:first.ownerName,allyName:first.allyName,pairName:first.pairName,replaces:first.replaces,gemName:first.gemName,effect:first.effect,sources,sourceRefs:sources.map(row=>row.provenanceRef+':'+row.sourceFilenames.join(','))};
  });
  return {pairs,issues,audit:{popupRecords:records.length,completePairs:pairs.filter(row=>row.status==='captured_pair').length,uncapturedPartners:pairs.filter(row=>row.status==='partner_not_captured').length,blockedPairs:pairs.filter(row=>!['captured_pair','partner_not_captured'].includes(row.status)).length,reciprocalPairs:pairs.filter(row=>row.status==='captured_pair'&&new Set(row.sources.map(source=>source.ownerVariantId)).size===2).length}};
}

/** Presence and available substitutions are descriptive, never scored. */
export function evaluateCapturedAllyPairs({guideData,battleMode,variantIds=[],excludeVariantIds=[]}) {
  const empty={status:'not_applicable',score:0,present:[],options:[],blocked:[],limitations:[]};
  const collection=guideData?.verifiedCollection;
  if(!collection||!['raid','war'].includes(battleMode))return empty;
  if(new Set(variantIds).size!==variantIds.length||variantIds.length>5||variantIds.some(id=>!collection.variantIds.includes(id)||!guideData.champions.some(row=>row.id===id&&row.releaseState==='live')))return {...empty,status:'invalid_selection',limitations:['Use distinct, captured exact variants before checking Ally Gem pairs.']};
  const selected=new Set(variantIds),present=[],options=[],blocked=[];
  for(const pair of collection.capturedAllyPairs||[]) {
    if(!pair.variantIds.some(id=>selected.has(id))||pair.variantIds.some(id=>excludeVariantIds.includes(id)))continue;
    if(pair.status!=='captured_pair'){blocked.push(pair);continue;}
    if(pair.variantIds.some(id=>!collection.variantIds.includes(id)||!guideData.champions.some(row=>row.id===id&&row.releaseState==='live')))continue;
    if(pair.variantIds.every(id=>selected.has(id)))present.push(pair);
    else options.push({...pair,missingVariantId:pair.variantIds.find(id=>!selected.has(id))});
  }
  const sort=(a,b)=>a.gemName.localeCompare(b.gemName)||a.id.localeCompare(b.id);
  return {...empty,status:'reviewed',present:present.sort(sort),options:options.sort(sort),blocked,limitations:[
    'These are captured pair requirements and Gem wording, not active buffs. The replaced Power-Up must be created and the resulting Ally Gem activated before its stated effect can occur.',
    'No board availability, activation frequency, damage totals or extra ranking points are inferred. Named statuses, targets, random choices and other conditions keep their captured wording.',
    'Pair options are alphabetical, not ranked upgrades. Replacing a team member can lose a faction threshold, Leader effect or role; reassess the full lineup before substituting.',
    'Popup-only partners do not become collection members. Captured ownership and pairing evidence are dated snapshots, not live game state.',
  ]};
}

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function capturedAllyPairsMarkup(result) {
  const model=result.capturedAllyPairs;
  if(!model||model.status==='not_applicable'||!model.present.length&&!model.options.length&&!model.blocked.length&&model.status!=='invalid_selection')return '';
  const card=(pair,option=false)=>`<li><strong>${esc(pair.ownerName)} + ${esc(pair.allyName)} · ${esc(pair.gemName)}</strong><p>${option?'Available captured partner, not in this lineup.':'Both exact variants are in this lineup.'} ${esc(pair.pairName)} replaces ${esc(pair.replaces)}.</p><p>${esc(pair.effect)}</p><details><summary>Captured pair sources</summary>${pair.sources.map(row=>`<p>${esc(row.ownerName)} → ${esc(row.allyName)}: ${esc(row.effect)}</p><p class="subtle-note">${esc(row.provenanceRef)} · ${esc(row.sourceFilenames.join(', '))} · captured ${esc(row.captureDate)}${row.reviewCompletedDate?' · reviewed '+esc(row.reviewCompletedDate):''}</p>`).join('')}</details></li>`;
  return `<section class="team-plan"><div><h3>Captured Ally Gems · conditional options</h3><p>No additional score. Pair presence does not mean the Gem has activated.</p>${model.present.length?`<ul>${model.present.map(row=>card(row)).join('')}</ul>`:'<p>No complete captured pair is present in this lineup.</p>'}${model.options.length?`<details><summary>Other captured pair options (${model.options.length})</summary><ul>${model.options.map(row=>card(row,true)).join('')}</ul></details>`:''}${model.blocked.length?`<details><summary>Pair evidence not used (${model.blocked.length})</summary><ul>${model.blocked.map(row=>`<li>${esc(row.ownerName)} + ${esc(row.allyName||'Unresolved exact ally')}: ${esc(row.status.replaceAll('_',' '))}. No pair effect assumed. ${esc(row.sourceRefs.join(' · '))}</li>`).join('')}</ul></details>`:''}<ul>${model.limitations.map(note=>`<li>${esc(note)}</li>`).join('')}</ul></div></section>`;
}
