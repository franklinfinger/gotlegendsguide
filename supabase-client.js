// Read-only browser access to the curated player-facing Supabase model.
// The publishable key can call fixed RPCs but has no table write privileges.
/** @typedef {{url:string,publishableKey:string}} SupabaseConfig */
/** @typedef {{id:string,legacyId:number|null,name:string,rarity:string|null,gemColor:string|null,reviewStatus:string,releaseState:string,portrait:string|null,factions:string[],roles:string[]}} GuideChampion */
/** @typedef {{id:string,kind:string,name:string,variantId:string|null,championId:number|null,text:string,reviewStatus:string|null,provenance:string|null}} GuideAbility */
/** @typedef {{id:string,variantId:string,championId:number,name:string,type:string|null,scope:string|null,text:string,reviewStatus:string}} GuideTrait */
/** @typedef {{id:string,name:string,ownerVariantId:string|null,ownerName:string|null,reviewStatus:string,abilities:Array<{id:string,name:string,text:string,reviewStatus:string|null,provenance:string|null}>}} GuideItem */
/** @typedef {{id:string,name:string,memberVariantIds:string[],rules:Array<{id:string,text:string,kind:'current_bonus'|'how_to_play'}>}} GuideFaction */
/** @typedef {{name:string,isLeader:boolean,gemColor?:string|null}} GuideTeamMember */
/** @typedef {{id:string,mode:string,outcome:string,displayedPower:number|null,members:GuideTeamMember[]}} GuideObservedTeam */
/** @typedef {{id:string,name:string,subtitle:string|null,reviewStatus:string,releaseState:string,abilities:Array<{id:string,name:string,scope:string|null,text:string,reviewStatus:string}>,tips:Array<{id:string,text:string,reviewStatus:string}>}} GuideEncounter */
/** @typedef {{version:string,champions:GuideChampion[],abilities:GuideAbility[],traits:GuideTrait[],items:GuideItem[],factions:GuideFaction[],statuses:unknown[],mechanics:unknown[],companions:unknown[],legendaryAssault:GuideEncounter[],warRules:unknown[],raidRules:unknown[],raidTeams:unknown[],strategyTeams:unknown[],teams:GuideObservedTeam[],announcements:unknown[]}} GuideData */
/** @typedef {{id:string,battleMode:'legendary-assault'|'raid'|'war',kind:string,name:string,evidenceState:'verified'|'insufficient',approach:string,timing:string,warning:string,provenanceRef:string,reviewStatus:string}} StrategyTarget */
/** @typedef {{id:string,kind:'target_fit'|'team_synergy',battleMode:string,targetId:string|null,subjectVariantId:string|null,mechanicId:string,pairedMechanicId:string|null,score:number,rationale:string,evidenceCategory:'verified_fact'|'strategy_inference'|'community_observed',provenanceRef:string,sourceId:number|null,confidence:number,reviewStatus:string}} StrategyRule */
/** @typedef {{id:string,variantId:string,mechanicId:string,effectRole:string,context:string,factText:string,evidenceCategory:'verified_fact'|'strategy_inference'|'community_observed',provenanceRef:string,sourceId:number|null,confidence:number,reviewStatus:string}} StrategyChampionFact */
/** @typedef {{id:string,targetId:string,title:string,recommendationType:'best_known'|'verified'|'alternative',confidence:number,provenanceRef:string,sourceId:number|null,notes:string,active:boolean,effectiveDate:string|null,gameVersion:string|null,reviewStatus:string,leaderVariantId:string|null,members:Array<{position:number,variantId:string|null,displayName:string,identityStatus:'exact'|'unresolved',isLeader:boolean}>}} CuratedRecommendation */
/** @typedef {{version:string,mechanics:Array<{id:string,name:string,category:string}>,targets:StrategyTarget[],rules:StrategyRule[],championFacts:StrategyChampionFact[],curatedRecommendations:CuratedRecommendation[]}} StrategyData */

/** @type {SupabaseConfig | undefined} */
const config = /** @type {typeof globalThis & {GOT_SUPABASE_CONFIG?: SupabaseConfig}} */ (globalThis).GOT_SUPABASE_CONFIG;

/** @param {string} name */
async function rpc(name) {
  if (!config?.url || !config.publishableKey) throw new Error('The guide database is not configured for this build.');
  const response = await fetch(`${config.url.replace(/\/$/, '')}/rest/v1/rpc/${name}`, {
    headers: { apikey: config.publishableKey, Accept: 'application/json' }
  });
  if (!response.ok) throw new Error(`The guide database could not be reached (${response.status}).`);
  return response.json();
}

/** @returns {Promise<{total_champions:number,total_abilities:number,total_raid_bosses:number,total_factions:number,total_faction_memberships:number,total_announced_updates:number,data_version:string|null,imported_at:string|null}>} */
export async function getDataHealth() {
  const result = await rpc('got_data_health');
  const data = Array.isArray(result) ? result[0] : result;
  if (!data || typeof data.total_champions !== 'number') throw new Error('The database returned an incomplete health result.');
  return data;
}

/** @returns {Promise<GuideData>} */
export async function getGuideData() {
  const data = await rpc('got_guide_data');
  const collections = ['champions','abilities','traits','items','factions','statuses','mechanics','companions','legendaryAssault','warRules','raidRules','raidTeams','strategyTeams','teams','announcements'];
  if (!data || typeof data !== 'object' || collections.some(key => !Array.isArray(data[key]))) {
    throw new Error('The database returned an incomplete guide result.');
  }
  if (typeof data.version !== 'string') throw new Error('The guide data has no verified version.');
  return /** @type {GuideData} */ (data);
}

/** @returns {Promise<StrategyData>} */
export async function getStrategyData() {
  const data = await rpc('got_strategy_data');
  const collections = ['mechanics','targets','rules','championFacts','curatedRecommendations'];
  if (!data || typeof data !== 'object' || collections.some(key => !Array.isArray(data[key]))) {
    throw new Error('The database returned an incomplete strategy result.');
  }
  if (typeof data.version !== 'string') throw new Error('The strategy data has no verified version.');
  return /** @type {StrategyData} */ (data);
}
