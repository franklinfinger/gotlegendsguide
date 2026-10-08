-- Source-backed supplement. The older verified baseline and raw screenshots are preserved.
CREATE TABLE IF NOT EXISTS knowledge.champion_associated_units (id text PRIMARY KEY, owner_variant_id text NOT NULL REFERENCES knowledge.champion_variants(id), name text NOT NULL, trait_name text NOT NULL, trait_text text NOT NULL, skill_name text NOT NULL, skill_text text NOT NULL, inheritance_text text NOT NULL, review_status text NOT NULL, source_id bigint NOT NULL REFERENCES knowledge.sources(source_id));
ALTER TABLE knowledge.champion_associated_units ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge.champion_associated_units FROM PUBLIC, anon, authenticated;
INSERT INTO knowledge.sources (source_id,filename,drive_file_id,drive_url,source_type,verification_state,notes) VALUES (103869,'IMG_3869.PNG','photos:IMG_3869.PNG','data/source-images/ormund-2026-10-08/IMG_3869.PNG','user_supplied_screenshot','visually_verified','Original from authorized Photos library; local source locator, not a Drive ID.') ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.source_images (source_id,external_id,source_url,original_filename,review_status,confidence) VALUES (103869,'photos:IMG_3869.PNG','data/source-images/ormund-2026-10-08/IMG_3869.PNG','IMG_3869.PNG','visually_verified',1) ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.source_image_fingerprints (source_id,sha256,byte_count,width,height,corpus,content_review_state) VALUES (103869,'e3675031b92ecc5a816999f879e2b1d8d6e3aa860c7b7b649bc0126e63e24baa',3163908,1260,2736,'ormund-photos-2026-10-08','individually_visually_reviewed') ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.sources (source_id,filename,drive_file_id,drive_url,source_type,verification_state,notes) VALUES (103870,'IMG_3870.PNG','photos:IMG_3870.PNG','data/source-images/ormund-2026-10-08/IMG_3870.PNG','user_supplied_screenshot','visually_verified','Original from authorized Photos library; local source locator, not a Drive ID.') ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.source_images (source_id,external_id,source_url,original_filename,review_status,confidence) VALUES (103870,'photos:IMG_3870.PNG','data/source-images/ormund-2026-10-08/IMG_3870.PNG','IMG_3870.PNG','visually_verified',1) ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.source_image_fingerprints (source_id,sha256,byte_count,width,height,corpus,content_review_state) VALUES (103870,'e46ce534b19fbd97d87d74ecf30385edd34f1b966f0b8b1c2f20abdc39ab9730',3087096,1260,2736,'ormund-photos-2026-10-08','individually_visually_reviewed') ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.sources (source_id,filename,drive_file_id,drive_url,source_type,verification_state,notes) VALUES (103871,'IMG_3871.PNG','photos:IMG_3871.PNG','data/source-images/ormund-2026-10-08/IMG_3871.PNG','user_supplied_screenshot','visually_verified','Original from authorized Photos library; local source locator, not a Drive ID.') ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.source_images (source_id,external_id,source_url,original_filename,review_status,confidence) VALUES (103871,'photos:IMG_3871.PNG','data/source-images/ormund-2026-10-08/IMG_3871.PNG','IMG_3871.PNG','visually_verified',1) ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.source_image_fingerprints (source_id,sha256,byte_count,width,height,corpus,content_review_state) VALUES (103871,'a0b81b28a13c7f71f3bfa7fef1fe76bb3fdd82695430628d24450ef6c864818f',3085788,1260,2736,'ormund-photos-2026-10-08','individually_visually_reviewed') ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.sources (source_id,filename,drive_file_id,drive_url,source_type,verification_state,notes) VALUES (103872,'IMG_3872.PNG','photos:IMG_3872.PNG','data/source-images/ormund-2026-10-08/IMG_3872.PNG','user_supplied_screenshot','visually_verified','Original from authorized Photos library; local source locator, not a Drive ID.') ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.source_images (source_id,external_id,source_url,original_filename,review_status,confidence) VALUES (103872,'photos:IMG_3872.PNG','data/source-images/ormund-2026-10-08/IMG_3872.PNG','IMG_3872.PNG','visually_verified',1) ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.source_image_fingerprints (source_id,sha256,byte_count,width,height,corpus,content_review_state) VALUES (103872,'65252def5eae2bd66df1b96a424d36722b95e403177ef2381a1192039da734ac',3085831,1260,2736,'ormund-photos-2026-10-08','individually_visually_reviewed') ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.sources (source_id,filename,drive_file_id,drive_url,source_type,verification_state,notes) VALUES (103873,'IMG_3873.PNG','photos:IMG_3873.PNG','data/source-images/ormund-2026-10-08/IMG_3873.PNG','user_supplied_screenshot','visually_verified','Original from authorized Photos library; local source locator, not a Drive ID.') ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.source_images (source_id,external_id,source_url,original_filename,review_status,confidence) VALUES (103873,'photos:IMG_3873.PNG','data/source-images/ormund-2026-10-08/IMG_3873.PNG','IMG_3873.PNG','visually_verified',1) ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.source_image_fingerprints (source_id,sha256,byte_count,width,height,corpus,content_review_state) VALUES (103873,'a3ba3347977a3d8088eaf13077db2037c15530144c52bfa9181bed1749d12f27',3083507,1260,2736,'ormund-photos-2026-10-08','individually_visually_reviewed') ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.sources (source_id,filename,drive_file_id,drive_url,source_type,verification_state,notes) VALUES (103874,'IMG_3874.PNG','photos:IMG_3874.PNG','data/source-images/ormund-2026-10-08/IMG_3874.PNG','user_supplied_screenshot','visually_verified','Original from authorized Photos library; local source locator, not a Drive ID.') ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.source_images (source_id,external_id,source_url,original_filename,review_status,confidence) VALUES (103874,'photos:IMG_3874.PNG','data/source-images/ormund-2026-10-08/IMG_3874.PNG','IMG_3874.PNG','visually_verified',1) ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.source_image_fingerprints (source_id,sha256,byte_count,width,height,corpus,content_review_state) VALUES (103874,'638b294a00beb33749b547c5cf6b6f4fb373033b2d6aecf099c3eca67df5ee01',2870662,1260,2736,'ormund-photos-2026-10-08','individually_visually_reviewed') ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.sources (source_id,filename,drive_file_id,drive_url,source_type,verification_state,notes) VALUES (103875,'IMG_3875.PNG','photos:IMG_3875.PNG','data/source-images/ormund-2026-10-08/IMG_3875.PNG','user_supplied_screenshot','visually_verified','Original from authorized Photos library; local source locator, not a Drive ID.') ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.source_images (source_id,external_id,source_url,original_filename,review_status,confidence) VALUES (103875,'photos:IMG_3875.PNG','data/source-images/ormund-2026-10-08/IMG_3875.PNG','IMG_3875.PNG','visually_verified',1) ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.source_image_fingerprints (source_id,sha256,byte_count,width,height,corpus,content_review_state) VALUES (103875,'195fb964975f0e35137d86061baf01477093f01db291019c50948fe4ffa16034',2619852,1260,2736,'ormund-photos-2026-10-08','individually_visually_reviewed') ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.sources (source_id,filename,drive_file_id,drive_url,source_type,verification_state,notes) VALUES (103876,'IMG_3876.PNG','photos:IMG_3876.PNG','data/source-images/ormund-2026-10-08/IMG_3876.PNG','user_supplied_screenshot','visually_verified','Original from authorized Photos library; local source locator, not a Drive ID.') ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.source_images (source_id,external_id,source_url,original_filename,review_status,confidence) VALUES (103876,'photos:IMG_3876.PNG','data/source-images/ormund-2026-10-08/IMG_3876.PNG','IMG_3876.PNG','visually_verified',1) ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.source_image_fingerprints (source_id,sha256,byte_count,width,height,corpus,content_review_state) VALUES (103876,'b20c9947e63ceb5e7ce8a4bfb5190fd263aea681d3c297ab1f47d77c25f03782',2618496,1260,2736,'ormund-photos-2026-10-08','individually_visually_reviewed') ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.sources (source_id,filename,drive_file_id,drive_url,source_type,verification_state,notes) VALUES (103877,'IMG_3877.PNG','photos:IMG_3877.PNG','data/source-images/ormund-2026-10-08/IMG_3877.PNG','user_supplied_screenshot','visually_verified','Original from authorized Photos library; local source locator, not a Drive ID.') ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.source_images (source_id,external_id,source_url,original_filename,review_status,confidence) VALUES (103877,'photos:IMG_3877.PNG','data/source-images/ormund-2026-10-08/IMG_3877.PNG','IMG_3877.PNG','visually_verified',1) ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.source_image_fingerprints (source_id,sha256,byte_count,width,height,corpus,content_review_state) VALUES (103877,'9643286158df567c3fe690ff5c983cef1c55385c27338dfc0055484355b54c23',2755458,1260,2736,'ormund-photos-2026-10-08','individually_visually_reviewed') ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.sources (source_id,filename,drive_file_id,drive_url,source_type,verification_state,notes) VALUES (103878,'IMG_3878.PNG','photos:IMG_3878.PNG','data/source-images/ormund-2026-10-08/IMG_3878.PNG','user_supplied_screenshot','visually_verified','Original from authorized Photos library; local source locator, not a Drive ID.') ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.source_images (source_id,external_id,source_url,original_filename,review_status,confidence) VALUES (103878,'photos:IMG_3878.PNG','data/source-images/ormund-2026-10-08/IMG_3878.PNG','IMG_3878.PNG','visually_verified',1) ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.source_image_fingerprints (source_id,sha256,byte_count,width,height,corpus,content_review_state) VALUES (103878,'a90d1711ec5c13d20ad6123e1fdd2945449930bc7a21c2bfe63b9c392db633af',2764236,1260,2736,'ormund-photos-2026-10-08','individually_visually_reviewed') ON CONFLICT (source_id) DO NOTHING;
INSERT INTO knowledge.characters (id,display_name) VALUES ('ormund-hightower','Ormund Hightower') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.champion_variants (id,character_id,display_name,rarity,gem_color,confidence,review_status,live_status) VALUES ('screenshot-variant-ormund-hightower-beacon-of-the-south','ormund-hightower','Ormund Hightower — Beacon of the South','Legendary','Yellow',1,'complete','live') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.champion_portraits (id,variant_id,legacy_key,asset_path,source_script,sha256,source_image_id,attribution,review_state) VALUES ('source-crop-ormund-hightower','screenshot-variant-ormund-hightower-beacon-of-the-south','photos:IMG_3869.PNG','assets/champion-portraits/ormund-hightower-source-crop.png','sips crop 540x540 offset 595x515; resize 512x512','03c67c9b1f62f52d4e3e449ec9c642d50e8816bc64a3157aa643b3eb114539ca',103869,'User supplied GOT: Legends game screenshot; game art remains with its rights holder.','source_profile_crop') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.abilities (id,kind,name,variant_id,source_id,provenance,confidence,review_status,exact_visible_text) VALUES ('ormund-leader-trait','trait','When Dealing With Those Beneath You II','screenshot-variant-ormund-hightower-beacon-of-the-south',103870,'Screenshot Verified',1,'complete','Leader · Once. When combat starts, Ormund grants 1 HOLY PURPOSE to 3 allies at random. Ormund grants his team 1 BIRTHRIGHT every time Treasury Coins are spent by the enemy team.') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.abilities (id,kind,name,variant_id,source_id,provenance,confidence,review_status,exact_visible_text) VALUES ('ormund-rightful-line-trait','trait','To Restore The Rightful Line III','screenshot-variant-ormund-hightower-beacon-of-the-south',103872,'Screenshot Verified',1,'complete','Once. For the first 10 turns of combat, Ormund grants all team members a +20% Critical Strike Chance and +15% Critical Strike Damage Buff. When Ormund drops to his HP Guard at 50% HP, all team members gain 8 BIRTHRIGHT, he deals 250% ATK Physical Damage to all enemies and REMOVES 2 Buffs from each enemy. Stats Bonus: +10% DEF, +5% HP, +10% ATK. Rank 7 locked bonus: +5% HP.') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.abilities (id,kind,name,variant_id,source_id,provenance,confidence,review_status,exact_visible_text) VALUES ('ormund-strength-honour-skill','champion_skill','Strength, Honour, Wisdom, and Justice','screenshot-variant-ormund-hightower-beacon-of-the-south',103877,'Screenshot Verified',1,'complete','Skill Level 9 · Slow · PHYSICAL DAMAGE · AoE · ADD DEBUFF · ADD BUFF. Ormund deals 225% ATK Physical Damage to all enemies. During the first 10 turns of combat, all enemies are dealt a -20% DEF Debuff for 3 turns. From turn 11 onwards, all allies gain a +20% DEF Buff for 3 turns. Level 10 upgrade shown: -10% DEF Debuff.') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.champion_associated_units (id,owner_variant_id,name,trait_name,trait_text,skill_name,skill_text,inheritance_text,review_status,source_id) VALUES ('ormund-hightower-guardsman','screenshot-variant-ormund-hightower-beacon-of-the-south','Hightower Guardsman','We Must Keep A Firm Grip III','Once. The Hightower Guardsman TAUNTS for 5 turns, has 5 BIRTHRIGHT, and 75% Stamina. The Guardsman grants all allies 2 BIRTHRIGHT every time he drops to a lower HP Guards at 75%, 50% and 25% each. Stats Bonus: +10% ATK, +5% Dodge. Rank 7 locked bonus: +5% Dodge.','Never Apologize For Victory','Skill Level 9 · Fast · PHYSICAL DAMAGE · AoE · ADD DEBUFF · ADD BUFF. The Guardsman deals 185% Physical Damage to one enemy and gains a 20% Dodge Chance Buff for 3 turns. Level 10 upgrade shown: +2% Dodge Chance.','Hightower Guardsman will inherit their Level, Star Rank, and Skill Level from Ormund Hightower.','complete',103875) ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.strategy_mechanics (id,name,category) VALUES ('holy_purpose','HOLY PURPOSE','identity') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.strategy_mechanics (id,name,category) VALUES ('dodge','Dodge Chance','survivability') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.strategy_mechanics (id,name,category) VALUES ('hp_guard','HP Guard threshold','survivability') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.strategy_mechanics (id,name,category) VALUES ('aoe','Area damage','damage') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.strategy_champion_facts (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status) VALUES ('ormund-leader-effect','screenshot-variant-ormund-hightower-beacon-of-the-south','leader_effect','grants','leader','When Dealing With Those Beneath You II: When combat starts, Ormund grants 1 HOLY PURPOSE to 3 allies at random; when the enemy team spends Treasury Coins, his team gains 1 BIRTHRIGHT.','verified_fact','source:103870',103870,1,'complete') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.strategy_champion_facts (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status) VALUES ('ormund-holy-purpose','screenshot-variant-ormund-hightower-beacon-of-the-south','holy_purpose','grants','leader','When Dealing With Those Beneath You II: When combat starts, Ormund grants 1 HOLY PURPOSE to 3 allies at random.','verified_fact','source:103870',103870,1,'complete') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.strategy_champion_facts (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status) VALUES ('ormund-leader-birthright','screenshot-variant-ormund-hightower-beacon-of-the-south','birthright','grants','leader','When Dealing With Those Beneath You II: Ormund grants his team 1 BIRTHRIGHT every time Treasury Coins are spent by the enemy team.','verified_fact','source:103871',103871,1,'complete') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.strategy_champion_facts (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status) VALUES ('ormund-treasury-trigger','screenshot-variant-ormund-hightower-beacon-of-the-south','treasury','reacts','leader','When Dealing With Those Beneath You II: Ormund grants his team 1 BIRTHRIGHT every time Treasury Coins are spent by the enemy team.','verified_fact','source:103871',103871,1,'complete') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.strategy_champion_facts (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status) VALUES ('ormund-critical','screenshot-variant-ormund-hightower-beacon-of-the-south','critical','supports','trait','To Restore The Rightful Line III: For the first 10 turns of combat, Ormund grants all team members a +20% Critical Strike Chance and +15% Critical Strike Damage Buff.','verified_fact','source:103872',103872,1,'complete') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.strategy_champion_facts (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status) VALUES ('ormund-birthright','screenshot-variant-ormund-hightower-beacon-of-the-south','birthright','grants','trait','To Restore The Rightful Line III: When Ormund drops to his HP Guard at 50% HP, all team members gain 8 BIRTHRIGHT.','verified_fact','source:103873',103873,1,'complete') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.strategy_champion_facts (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status) VALUES ('ormund-hp-guard','screenshot-variant-ormund-hightower-beacon-of-the-south','hp_guard','triggers','trait','To Restore The Rightful Line III: When Ormund drops to his HP Guard at 50% HP, all team members gain 8 BIRTHRIGHT.','verified_fact','source:103873',103873,1,'complete') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.strategy_champion_facts (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status) VALUES ('ormund-trait-physical','screenshot-variant-ormund-hightower-beacon-of-the-south','physical_damage','damages','trait','To Restore The Rightful Line III: At his 50% HP Guard, Ormund deals 250% ATK Physical Damage to all enemies.','verified_fact','source:103873',103873,1,'complete') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.strategy_champion_facts (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status) VALUES ('ormund-trait-buff-removal','screenshot-variant-ormund-hightower-beacon-of-the-south','buff_removal','controls','trait','To Restore The Rightful Line III: At his 50% HP Guard, Ormund REMOVES 2 Buffs from each enemy.','verified_fact','source:103873',103873,1,'complete') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.strategy_champion_facts (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status) VALUES ('ormund-skill-physical','screenshot-variant-ormund-hightower-beacon-of-the-south','physical_damage','damages','skill','Strength, Honour, Wisdom, and Justice: Ormund deals 225% ATK Physical Damage to all enemies.','verified_fact','source:103877',103877,1,'complete') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.strategy_champion_facts (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status) VALUES ('ormund-skill-aoe','screenshot-variant-ormund-hightower-beacon-of-the-south','aoe','damages','skill','Strength, Honour, Wisdom, and Justice: Ormund deals 225% ATK Physical Damage to all enemies.','verified_fact','source:103877',103877,1,'complete') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.strategy_champion_facts (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status) VALUES ('ormund-skill-defense','screenshot-variant-ormund-hightower-beacon-of-the-south','defense','controls','skill','Strength, Honour, Wisdom, and Justice: During the first 10 turns all enemies are dealt a -20% DEF Debuff for 3 turns; from turn 11 all allies gain a +20% DEF Buff for 3 turns.','verified_fact','source:103877',103877,1,'complete') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.strategy_champion_facts (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status) VALUES ('ormund-guard-taunt','screenshot-variant-ormund-hightower-beacon-of-the-south','taunt','uses','associated_unit','We Must Keep A Firm Grip III: The Hightower Guardsman TAUNTS for 5 turns.','verified_fact','source:103875',103875,1,'complete') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.strategy_champion_facts (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status) VALUES ('ormund-guard-birthright','screenshot-variant-ormund-hightower-beacon-of-the-south','birthright','grants','associated_unit','We Must Keep A Firm Grip III: The Guardsman grants all allies 2 BIRTHRIGHT at lower HP Guards of 75%, 50%, and 25%.','verified_fact','source:103876',103876,1,'complete') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.strategy_champion_facts (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status) VALUES ('ormund-guard-stamina','screenshot-variant-ormund-hightower-beacon-of-the-south','stamina','starts','associated_unit','We Must Keep A Firm Grip III: The Hightower Guardsman has 75% Stamina.','verified_fact','source:103875',103875,1,'complete') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.strategy_champion_facts (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status) VALUES ('ormund-guard-hp-guard','screenshot-variant-ormund-hightower-beacon-of-the-south','hp_guard','triggers','associated_unit','We Must Keep A Firm Grip III: The Guardsman grants all allies 2 BIRTHRIGHT at lower HP Guards of 75%, 50%, and 25%.','verified_fact','source:103876',103876,1,'complete') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.strategy_champion_facts (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status) VALUES ('ormund-guard-dodge','screenshot-variant-ormund-hightower-beacon-of-the-south','dodge','gains','associated_unit','Never Apologize For Victory: The Guardsman gains a 20% Dodge Chance Buff for 3 turns.','verified_fact','source:103878',103878,1,'complete') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.strategy_champion_facts (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status) VALUES ('ormund-guard-physical','screenshot-variant-ormund-hightower-beacon-of-the-south','physical_damage','damages','associated_unit','Never Apologize For Victory: The Guardsman deals 185% Physical Damage to one enemy.','verified_fact','source:103878',103878,1,'complete') ON CONFLICT (id) DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('champion_variant','screenshot-variant-ormund-hightower-beacon-of-the-south',103869,'exact_visible_card','visually_verified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('champion_portrait','source-crop-ormund-hightower',103869,'exact_visible_card','visually_verified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('ability','ormund-leader-trait',103870,'exact_visible_card','visually_verified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('ability','ormund-leader-trait',103871,'exact_visible_card','visually_verified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('ability','ormund-rightful-line-trait',103872,'exact_visible_card','visually_verified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('ability','ormund-rightful-line-trait',103873,'exact_visible_card','visually_verified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('ability','ormund-rightful-line-trait',103874,'exact_visible_card','visually_verified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('ability','ormund-strength-honour-skill',103877,'exact_visible_card','visually_verified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('associated_unit','ormund-hightower-guardsman',103875,'exact_visible_card','visually_verified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('associated_unit','ormund-hightower-guardsman',103876,'exact_visible_card','visually_verified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('associated_unit','ormund-hightower-guardsman',103878,'exact_visible_card','visually_verified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('strategy_fact','ormund-leader-effect',103870,'exact_visible_effect','visually_verified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('strategy_fact','ormund-holy-purpose',103870,'exact_visible_effect','visually_verified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('strategy_fact','ormund-leader-birthright',103871,'exact_visible_effect','visually_verified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('strategy_fact','ormund-treasury-trigger',103871,'exact_visible_effect','visually_verified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('strategy_fact','ormund-critical',103872,'exact_visible_effect','visually_verified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('strategy_fact','ormund-birthright',103873,'exact_visible_effect','visually_verified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('strategy_fact','ormund-hp-guard',103873,'exact_visible_effect','visually_verified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('strategy_fact','ormund-trait-physical',103873,'exact_visible_effect','visually_verified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('strategy_fact','ormund-trait-buff-removal',103873,'exact_visible_effect','visually_verified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('strategy_fact','ormund-skill-physical',103877,'exact_visible_effect','visually_verified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('strategy_fact','ormund-skill-aoe',103877,'exact_visible_effect','visually_verified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('strategy_fact','ormund-skill-defense',103877,'exact_visible_effect','visually_verified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('strategy_fact','ormund-guard-taunt',103875,'exact_visible_effect','visually_verified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('strategy_fact','ormund-guard-birthright',103876,'exact_visible_effect','visually_verified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('strategy_fact','ormund-guard-stamina',103875,'exact_visible_effect','visually_verified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('strategy_fact','ormund-guard-hp-guard',103876,'exact_visible_effect','visually_verified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('strategy_fact','ormund-guard-dodge',103878,'exact_visible_effect','visually_verified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.record_evidence (record_kind,record_id,source_id,evidence_role,review_state) VALUES ('strategy_fact','ormund-guard-physical',103878,'exact_visible_effect','visually_verified') ON CONFLICT DO NOTHING;
CREATE OR REPLACE FUNCTION public.got_guide_data()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT jsonb_build_object(
    'version', (SELECT source_version FROM knowledge.import_runs ORDER BY imported_at DESC LIMIT 1),
    'champions', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', v.id,
      'legacyId', v.sqlite_champion_id,
      'name', v.display_name,
      'rarity', v.rarity,
      'gemColor', v.gem_color,
      'reviewStatus', v.review_status,
      'releaseState', v.live_status,
      'portrait', (SELECT p.asset_path FROM knowledge.champion_portraits p
        WHERE p.variant_id = v.id ORDER BY (p.source_image_id IS NOT NULL) DESC, p.id LIMIT 1),
      'factions', coalesce((SELECT jsonb_agg(f.name ORDER BY f.name)
        FROM knowledge.faction_memberships fm
        JOIN knowledge.factions f ON f.id = fm.faction_id
        WHERE fm.variant_id = v.id AND fm.live_status = 'live' AND f.live_status = 'live'), '[]'::jsonb),
      'roles', coalesce(l.legacy_roles, '[]'::jsonb)
    ) ORDER BY v.display_name, v.id), '[]'::jsonb)
      FROM knowledge.champion_variants v
      LEFT JOIN knowledge.legacy_champion_metadata l ON l.variant_id = v.id
      WHERE v.live_status IN ('live','unverified')),
    'abilities', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', a.id, 'kind', a.kind, 'name', a.name,
      'variantId', a.variant_id, 'championId', v.sqlite_champion_id,
      'text', a.exact_visible_text, 'reviewStatus', a.review_status,
      'provenance', a.provenance
    ) ORDER BY a.kind, a.name, a.id), '[]'::jsonb)
      FROM knowledge.abilities a
      LEFT JOIN knowledge.champion_variants v ON v.id = a.variant_id),
    'traits', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', 'legacy-trait-' || t.trait_id, 'variantId', v.id,
      'championId', t.champion_id, 'name', t.trait_name,
      'type', t.trait_type, 'scope', t.scope,
      'text', t.exact_visible_text, 'reviewStatus', t.completion_state
    ) ORDER BY t.champion_id, t.trait_id), '[]'::jsonb)
      FROM knowledge.champion_traits t
      JOIN knowledge.champion_variants v ON v.sqlite_champion_id = t.champion_id),
    'items', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', i.id, 'name', i.display_name,
      'ownerVariantId', i.owner_variant_id,
      'ownerName', v.display_name,
      'reviewStatus', i.review_state,
      'abilities', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'id', a.id, 'name', a.name, 'text', a.exact_visible_text,
        'reviewStatus', a.review_status, 'provenance', a.provenance
      ) ORDER BY a.name) FROM knowledge.iconic_item_ability_links l
        JOIN knowledge.abilities a ON a.id = l.ability_id
        WHERE l.item_id = i.id), '[]'::jsonb)
    ) ORDER BY i.display_name), '[]'::jsonb)
      FROM knowledge.iconic_item_catalog i
      LEFT JOIN knowledge.champion_variants v ON v.id = i.owner_variant_id),
    'factions', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', f.id, 'name', f.name,
      'memberVariantIds', coalesce((SELECT jsonb_agg(fm.variant_id ORDER BY fm.variant_id)
        FROM knowledge.faction_memberships fm
        WHERE fm.faction_id=f.id AND fm.live_status='live'), '[]'::jsonb),
      'rules', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'id', r.id, 'text', r.exact_text,
        'kind', CASE WHEN r.id LIKE '%how-to-play' THEN 'how_to_play' ELSE 'current_bonus' END
      ) ORDER BY r.id) FROM knowledge.faction_rules r
        WHERE r.faction_id=f.id AND r.live_status='live'), '[]'::jsonb)
    ) ORDER BY f.name), '[]'::jsonb)
      FROM knowledge.factions f
      WHERE f.live_status='live' AND EXISTS (
        SELECT 1 FROM knowledge.faction_memberships fm WHERE fm.faction_id=f.id AND fm.live_status='live'
        UNION ALL SELECT 1 FROM knowledge.faction_rules fr WHERE fr.faction_id=f.id AND fr.live_status='live')),
    'statuses', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', d.status_id, 'name', d.status_name,
      'text', d.exact_visible_definition, 'reviewStatus', d.completion_state
    ) ORDER BY d.status_name), '[]'::jsonb) FROM knowledge.status_definitions d),
    'mechanics', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', a.id, 'name', a.name, 'text', a.exact_visible_text,
      'reviewStatus', a.review_status
    ) ORDER BY a.name), '[]'::jsonb) FROM knowledge.abilities a WHERE a.kind='definition'),
    'companions', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', cp.companion_id, 'championId', cp.champion_id,
      'name', cp.companion_name, 'skillName', cp.skill_name,
      'text', cp.exact_visible_text, 'reviewStatus', cp.completion_state
    ) ORDER BY cp.companion_id), '[]'::jsonb) FROM knowledge.champion_companions cp) ||
      (SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id',u.id,'variantId',u.owner_variant_id,'name',u.name,
        'traitName',u.trait_name,'traitText',u.trait_text,
        'skillName',u.skill_name,'skillText',u.skill_text,
        'inheritanceText',u.inheritance_text,'reviewStatus',u.review_status
      ) ORDER BY u.id),'[]'::jsonb) FROM knowledge.champion_associated_units u),
    'legendaryAssault', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', e.id, 'name', e.name, 'subtitle', e.subtitle,
      'reviewStatus', e.review_state, 'releaseState', e.release_state,
      'abilities', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'id', a.id, 'name', a.ability_name, 'scope', a.scope,
        'text', a.exact_visible_text, 'reviewStatus', a.completion_state
      ) ORDER BY a.id) FROM knowledge.legendary_assault_abilities a WHERE a.encounter_id=e.id), '[]'::jsonb),
      'tips', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'id', t.id, 'text', t.exact_visible_text, 'reviewStatus', t.review_state
      ) ORDER BY t.id) FROM knowledge.legendary_assault_tips t WHERE lower(t.encounter_name)=lower(e.name)), '[]'::jsonb)
    ) ORDER BY e.name), '[]'::jsonb) FROM knowledge.legendary_assault_encounters e),
    'warRules', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', r.id, 'name', r.name, 'points', r.outpost_victory_points,
      'effect', r.exact_visible_effect, 'phaseRule', r.exact_visible_phase_rule,
      'reviewStatus', r.review_state
    ) ORDER BY r.outpost_victory_points DESC, r.name), '[]'::jsonb) FROM knowledge.war_outpost_rules r),
    'raidRules', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', r.raid_rule_id, 'category', r.category, 'text', r.exact_text,
      'evidenceType', r.evidence_type
    ) ORDER BY r.raid_rule_id), '[]'::jsonb) FROM knowledge.raid_mode_rules r),
    'raidTeams', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', rt.raid_team_example_id, 'context', rt.team_context,
      'members', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'name', rm.champion_name, 'isLeader', rm.is_leader=1
      ) ORDER BY rm.position) FROM knowledge.raid_team_members rm
        WHERE rm.raid_team_example_id=rt.raid_team_example_id), '[]'::jsonb)
    ) ORDER BY rt.raid_team_example_id), '[]'::jsonb) FROM knowledge.raid_team_examples rt),
    'strategyTeams', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', t.strategy_team_example_id, 'mode', t.game_mode,
      'role', t.team_role, 'evidenceStatus', t.evidence_status,
      'members', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'name', m.champion_name, 'isLeader', m.is_leader=1, 'gemColor', m.gem_color
      ) ORDER BY m.position) FROM knowledge.strategy_team_members m
        WHERE m.strategy_team_example_id=t.strategy_team_example_id), '[]'::jsonb)
    ) ORDER BY t.strategy_team_example_id), '[]'::jsonb) FROM knowledge.strategy_team_examples t),
    'teams', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', t.id, 'mode', t.mode, 'outcome', t.outcome,
      'displayedPower', t.displayed_team_power,
      'members', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'name', m.observed_name, 'isLeader', m.position=t.leader_position
      ) ORDER BY m.position) FROM knowledge.community_team_members m WHERE m.example_id=t.id), '[]'::jsonb)
    ) ORDER BY t.id), '[]'::jsonb) FROM knowledge.community_team_examples t),
    'announcements', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', u.update_id, 'title', u.title, 'date', u.announcement_date,
      'status', u.live_status,
      'factions', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'name', fc.faction_name, 'change', fc.change_kind,
        'playstyle', fc.announced_playstyle, 'bonus', fc.announced_bonus
      ) ORDER BY fc.announced_faction_change_id)
        FROM knowledge.announced_faction_changes fc WHERE fc.update_id=u.update_id), '[]'::jsonb),
      'rules', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'text', ar.exact_text, 'category', ar.category
      ) ORDER BY ar.announced_strategy_rule_id)
        FROM knowledge.announced_strategy_rules ar WHERE ar.update_id=u.update_id), '[]'::jsonb)
    ) ORDER BY u.update_id), '[]'::jsonb) FROM knowledge.announced_game_updates u)
  );
$$;


REVOKE ALL ON FUNCTION public.got_guide_data() FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.got_guide_data() TO anon, authenticated;
DO $$ BEGIN IF (SELECT count(*) FROM knowledge.champion_variants WHERE id='screenshot-variant-ormund-hightower-beacon-of-the-south') <> 1 THEN RAISE EXCEPTION 'Ormund variant missing'; END IF; IF (SELECT count(*) FROM knowledge.strategy_champion_facts WHERE variant_id='screenshot-variant-ormund-hightower-beacon-of-the-south') <> 18 THEN RAISE EXCEPTION 'Ormund strategy facts incomplete'; END IF; IF (SELECT count(*) FROM knowledge.faction_memberships WHERE variant_id='screenshot-variant-ormund-hightower-beacon-of-the-south') <> 0 THEN RAISE EXCEPTION 'Unverified Ormund faction was assigned'; END IF; IF jsonb_array_length(public.got_guide_data()->'champions') <> 109 THEN RAISE EXCEPTION 'Expected 109 champion variants'; END IF; END $$;
