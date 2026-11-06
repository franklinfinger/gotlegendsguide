// Structural checks for the read model, not an audit of game facts or ownership.
/** @typedef {(value:unknown)=>boolean} Check */
/** @param {unknown} value */
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
/** @type {Check} */
const text = value => typeof value === 'string' && value.trim().length > 0;
/** @type {Check} */
const string = value => typeof value === 'string';
/** @type {Check} */
const number = value => typeof value === 'number' && Number.isFinite(value);
/** @type {Check} */
const id = value => text(value) || (number(value) && Number.isInteger(value));
/** @type {Check} */
const boolean = value => typeof value === 'boolean';
/** @param {Check} check @returns {Check} */
const nullable = check => value => value === null || check(value);
/** @param {Check} check @returns {Check} */
const array = check => value => Array.isArray(value) && value.every(check);
/** @param {Record<string,Check>} fields @returns {Check} */
const shape = fields => value => object(value) && Object.entries(fields).every(([key,check]) => check(/** @type {Record<string,unknown>} */(value)[key]));
const member = shape({name:text,isLeader:nullable(boolean)});
const named = shape({id,name:text});
const wording = shape({id,name:text,text:nullable(string)});
const champion = shape({id:text,name:text,releaseState:text,reviewStatus:text,factions:array(text),roles:array(text)});
const faction = shape({id:text,name:text,memberVariantIds:array(text),rules:array(shape({id,text:string,kind:text}))});
const fact = shape({id:text,variantId:text,mechanicId:text,effectRole:text,context:text,factText:string,evidenceCategory:text,provenanceRef:string,confidence:number,reviewStatus:text});
const rule = shape({id:text,kind:text,battleMode:text,targetId:nullable(text),subjectVariantId:nullable(text),mechanicId:text,pairedMechanicId:nullable(text),score:number,rationale:string,evidenceCategory:text,provenanceRef:string,confidence:number,reviewStatus:text});
const target = shape({id:text,battleMode:text,kind:text,name:text,evidenceState:text,approach:string,timing:string,warning:string,provenanceRef:string,reviewStatus:text});

/** @param {unknown} data @param {Record<string,Check>} collections @param {string} label */
function validateCollections(data, collections, label) {
  if (!object(data)) throw new Error(`${label} data is malformed.`);
  const record = /** @type {Record<string,unknown>} */ (data);
  for (const [key,check] of Object.entries(collections)) {
    if (!array(check)(record[key])) throw new Error(`${label} ${key} contains missing or malformed records.`);
    // IDs must be unique where the read model exposes them; never silently deduplicate.
    const rows = /** @type {Array<Record<string,unknown>>} */ (record[key]);
    const ids = rows.filter(row => row.id !== undefined).map(row => row.id);
    if (new Set(ids).size !== ids.length) throw new Error(`${label} ${key} contains duplicate IDs.`);
  }
}

/** @param {import('./supabase-client.js').GuideData} guide @param {import('./supabase-client.js').StrategyData|null} strategy */
export function validateRequiredRows(guide, strategy) {
  validateCollections(guide, {
    champions:champion,
    abilities:shape({id:text,kind:text,name:text,variantId:nullable(text),text:nullable(string)}),
    traits:shape({id:text,variantId:text,name:text,text:nullable(string)}),
    items:shape({id:text,name:text,ownerVariantId:nullable(text),abilities:array(wording)}),
    factions:faction,
    factionActivations:shape({factionId:text,factionName:text,requiredMembers:value=>number(value)&&Number.isInteger(value)&&Number(value)>0,sourceId:number}),
    allyGems:shape({id:text,ownerName:text,allyName:text,gemName:text,effect:text,reviewState:text,currentnessState:text,sourceId:number}),
    legendaryAssault:shape({id:text,name:text,abilities:array(wording),tips:array(shape({id,text:nullable(string)}))}),
    teams:shape({id,mode:text,members:array(member)}),
    raidTeams:shape({id,members:array(member)}),
    strategyTeams:shape({id,members:array(member)}),
    statuses:named,mechanics:named,companions:named,warRules:named,
    raidRules:shape({id,category:text,text:nullable(string)}),
    announcements:shape({id,title:text,factions:array(shape({name:text})),rules:array(shape({text:nullable(string)}))})
  }, 'Guide');
  const factions = new Set(guide.factions.map(row => row.id));
  if (guide.factionActivations.some(row => !factions.has(row.factionId))) throw new Error('Raid activation refers to a missing faction.');
  if (!strategy) return;
  validateCollections(strategy, {
    mechanics:shape({id:text,name:text,category:text}),targets:target,rules:rule,championFacts:fact,
    curatedRecommendations:shape({id:text,targetId:text,title:text,recommendationType:text,confidence:number,provenanceRef:string,notes:string,active:boolean,reviewStatus:text,leaderVariantId:nullable(text),members:array(shape({position:number,variantId:nullable(text),displayName:text,identityStatus:text,isLeader:boolean}))})
  }, 'Strategy');
  const mechanics = new Set(strategy.mechanics.map(row => row.id));
  const targets = new Set(strategy.targets.map(row => row.id));
  if (strategy.championFacts.some(row => !mechanics.has(row.mechanicId)) || strategy.rules.some(row => !mechanics.has(row.mechanicId) || (row.pairedMechanicId !== null && !mechanics.has(row.pairedMechanicId)))) throw new Error('Strategy refers to missing mechanic data.');
  if (strategy.rules.some(row => row.targetId !== null && !targets.has(row.targetId)) || strategy.curatedRecommendations.some(row => !targets.has(row.targetId))) throw new Error('Strategy refers to missing target data.');
}
