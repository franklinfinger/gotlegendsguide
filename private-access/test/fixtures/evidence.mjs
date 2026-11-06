export function evidenceFixture() {
  const handoff = {
    capture_date:'2026-11-04',review_completed_date:'2026-11-05',
    all_reviewed_source_filenames:['IMG_100.PNG'],
    champion_capture_groups:[{capture_group_id:'G1',champion:'Private Example',exact_variant:'Exact Local Variant',profile_anchor:'IMG_100.PNG',group_source_filenames:['IMG_100.PNG'],fields_as_recorded:{profile:'Level 1; skill level 1.',current_skill:'**Current Strike** — level 1, Slow. “Example strikes an enemy for 25% ATK Physical Damage.” IMG_100.PNG',traits:'**Current Leader** — Leader, Once. “When an ally is defeated, gain 1 Coin Gem.” Five-star locked upgrade: “All allies gain 80% Stamina.” IMG_100.PNG'} }],
    review_updates:[{character:'Private Example',variant:'Exact Local Variant',review_date:'2026-11-05',current_build:{level:1,stars:3,defense_display:'5.5K'},source_files:[{file_name:'IMG_200.jpeg',library_file_id:'synthetic-reviewed-file',local_path:'/private/device/path.jpeg'}],skill:{name:'New Shield',level:1,text:'Example grants a team member a 75% DEF SHIELD and REMOVES 1 Debuffs from them.',next_level_upgrade:'+5% SHIELD power',sources:['IMG_200.jpeg']},traits:[{name:'Complete Leader',badges:['Leader'],current_text:'When an ally uses a Skill, spawn 1 Coin Gem.',sources:['IMG_200.jpeg'],locked_upgrades:[{star_rank:5,text:'Gain 80% Stamina.'}]}]}],
    effect_definition_updates:[{effect:'ENRAGED',title:'Enraged',definition:'Synthetic exact tooltip wording.',readability:'complete_popup_visually_readable',review_date:'2026-11-05',remaining:['Source-bounded rule note.'],applies_to:[],sources:[{file_name:'synthetic-tooltip.png',library_file_id:'synthetic-tooltip-file',message_id:'synthetic-message',sha256:'a'.repeat(64),local_path:'/private/device/tooltip.png'}],reconciliation:{kind:'single_source',source_count:1}}],
    faction_panels:[],supplemental_panels:[{text:'Captured source note',source_files:['IMG_100.PNG']}],material_conflicts_and_gaps:[],interpretation_rules:['Locked previews are not current effects.'],
  };
  const guideData={version:'base',champions:[{id:'v1',name:'Catalog Variant',factions:[],roles:[]}],abilities:[],traits:[],items:[],factions:[],factionActivations:[],teams:[],allyGems:[]};
  return {handoff,guideData};
}
