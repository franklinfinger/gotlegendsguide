// The existing app is static. Supabase's read-only REST API is the browser client.
// Only the publishable key is used; the database grants no browser write access.
/** @typedef {{url:string,publishableKey:string}} SupabaseConfig */
/** @typedef {{id:number,name:string,rarity:string,gemColor:string|null,reviewStatus:'complete'|'partial',factions:string[]}} GuideChampion */
/** @typedef {{id:string,kind:string,name:string,championId:number|null,bossId:number|null,text:string,reviewStatus:string|null,sourceId:number|null,sourceState:string|null}} GuideAbility */
/** @typedef {{id:number,championId:number,name:string,type:string|null,scope:string|null,text:string,reviewStatus:string,sourceId:number|null,sourceState:string|null}} GuideTrait */
/** @typedef {{id:number,name:string,effectName:string|null,text:string,reviewStatus:string,sourceId:number|null,sourceState:string|null}} GuideItem */
/** @typedef {{id:string,name:string,memberIds:number[]}} GuideFaction */
/** @typedef {{id:number,name:string,text:string,reviewStatus:string,sourceId:number|null,sourceState:string|null}} GuideStatus */
/** @typedef {{id:number,championId:number,name:string,skillName:string|null,text:string|null,reviewStatus:string,sourceId:number|null,sourceState:string|null}} GuideCompanion */
/** @typedef {{id:number,name:string,scope:string|null,text:string,reviewStatus:string,verifiedSources:number}} GuideBossAbility */
/** @typedef {{text:string,reviewStatus:string,sourceId:number|null,sourceState:string|null}} GuideTip */
/** @typedef {{id:number,name:string,subtitle:string|null,reviewStatus:string,abilities:GuideBossAbility[],tips:GuideTip[]}} GuideBoss */
/** @typedef {{id:number,category:string,text:string,evidenceType:string,sourceId:number|null,sourceState:string|null}} GuideRaidRule */
/** @typedef {{id:number,context:string,sourceId:number|null,sourceState:string|null,members:GuideTeamMember[]}} GuideRaidTeam */
/** @typedef {{name:string,isLeader:boolean,gemColor:string|null}} GuideTeamMember */
/** @typedef {{text:string,evidenceType:string,sourceId:number|null,sourceState:string|null}} GuideAssessment */
/** @typedef {{id:number,mode:string,role:string,evidenceStatus:string,sourceId:number|null,sourceState:string|null,members:GuideTeamMember[],assessments:GuideAssessment[]}} GuideTeam */
/** @typedef {{name:string,change:string,playstyle:string|null,bonus:string|null}} GuideAnnouncedFaction */
/** @typedef {{text:string,category:string}} GuideAnnouncedRule */
/** @typedef {{id:number,title:string,date:string|null,status:string,sourceId:number|null,sourceState:string|null,factions:GuideAnnouncedFaction[],rules:GuideAnnouncedRule[]}} GuideAnnouncement */
/** @typedef {{version:string|null,champions:GuideChampion[],abilities:GuideAbility[],traits:GuideTrait[],items:GuideItem[],factions:GuideFaction[],statuses:GuideStatus[],companions:GuideCompanion[],bosses:GuideBoss[],raidRules:GuideRaidRule[],raidTeams:GuideRaidTeam[],teams:GuideTeam[],announcements:GuideAnnouncement[]}} GuideData */
/** @type {SupabaseConfig | undefined} */
const config = /** @type {typeof globalThis & {GOT_SUPABASE_CONFIG?: SupabaseConfig}} */ (globalThis).GOT_SUPABASE_CONFIG;

/** @param {string} name */
async function rpc(name) {
  if (!config?.url || !config.publishableKey) throw new Error('Supabase is not configured for this build.');
  const response = await fetch(`${config.url.replace(/\/$/, '')}/rest/v1/rpc/${name}`, {
    headers: { apikey: config.publishableKey, Accept: 'application/json' }
  });
  if (!response.ok) throw new Error(`Supabase request failed (${response.status}).`);
  return response.json();
}

/** @returns {Promise<{total_champions:number,total_abilities:number,total_raid_bosses:number,total_factions:number,total_faction_memberships:number,total_announced_updates:number,data_version:string|null,imported_at:string|null}>} */
export async function getDataHealth() {
  const data = await rpc('got_data_health');
  if (!data || typeof data.total_champions !== 'number') throw new Error('Supabase returned an incomplete health result.');
  return data;
}

/** @returns {Promise<GuideData>} */
export async function getGuideData() {
  const data = await rpc('got_guide_data');
  const collections = ['champions', 'abilities', 'traits', 'items', 'factions', 'statuses', 'companions', 'bosses', 'raidRules', 'raidTeams', 'teams', 'announcements'];
  if (!data || typeof data !== 'object' || collections.some(key => !Array.isArray(data[key]))) {
    throw new Error('Supabase returned an incomplete guide result.');
  }
  if (typeof data.version !== 'string') throw new Error('Supabase guide data has no verified import version.');
  return /** @type {GuideData} */ (data);
}
