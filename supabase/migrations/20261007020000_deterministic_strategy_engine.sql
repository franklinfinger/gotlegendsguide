-- Deterministic strategy layer derived from the frozen verified baseline.
-- Direct facts, strategy inferences, and community observations remain separate.
CREATE TABLE IF NOT EXISTS knowledge.strategy_mechanics (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL
);
CREATE TABLE IF NOT EXISTS knowledge.strategy_fact_patterns (
  id text PRIMARY KEY,
  mechanic_id text NOT NULL REFERENCES knowledge.strategy_mechanics(id),
  effect_role text NOT NULL,
  text_pattern text NOT NULL
);
CREATE TABLE IF NOT EXISTS knowledge.strategy_targets (
  id text PRIMARY KEY,
  battle_mode text NOT NULL CHECK (battle_mode IN ('legendary-assault','raid','war')),
  target_kind text NOT NULL,
  display_name text NOT NULL,
  evidence_state text NOT NULL CHECK (evidence_state IN ('verified','insufficient')),
  approach text NOT NULL,
  timing text NOT NULL,
  warning text NOT NULL,
  provenance_ref text NOT NULL,
  review_status text NOT NULL
);
CREATE TABLE IF NOT EXISTS knowledge.strategy_rules (
  id text PRIMARY KEY,
  rule_kind text NOT NULL CHECK (rule_kind IN ('target_fit','team_synergy')),
  battle_mode text NOT NULL,
  target_id text REFERENCES knowledge.strategy_targets(id),
  subject_variant_id text REFERENCES knowledge.champion_variants(id),
  mechanic_id text NOT NULL REFERENCES knowledge.strategy_mechanics(id),
  paired_mechanic_id text REFERENCES knowledge.strategy_mechanics(id),
  score numeric(7,3) NOT NULL,
  rationale text NOT NULL,
  evidence_category text NOT NULL CHECK (evidence_category IN ('verified_fact','strategy_inference','community_observed')),
  provenance_ref text NOT NULL,
  source_id bigint REFERENCES knowledge.sources(source_id),
  confidence numeric(4,3) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  review_status text NOT NULL
);
CREATE TABLE IF NOT EXISTS knowledge.strategy_champion_facts (
  id text PRIMARY KEY,
  variant_id text NOT NULL REFERENCES knowledge.champion_variants(id),
  mechanic_id text NOT NULL REFERENCES knowledge.strategy_mechanics(id),
  effect_role text NOT NULL,
  context text NOT NULL,
  fact_text text NOT NULL,
  evidence_category text NOT NULL CHECK (evidence_category IN ('verified_fact','strategy_inference','community_observed')),
  provenance_ref text NOT NULL,
  source_id bigint REFERENCES knowledge.sources(source_id),
  confidence numeric(4,3) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  review_status text NOT NULL
);

ALTER TABLE knowledge.strategy_mechanics ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge.strategy_fact_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge.strategy_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge.strategy_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge.strategy_champion_facts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge.strategy_mechanics, knowledge.strategy_fact_patterns, knowledge.strategy_targets, knowledge.strategy_rules, knowledge.strategy_champion_facts FROM PUBLIC, anon, authenticated;

INSERT INTO knowledge.strategy_mechanics (id,name,category) VALUES
  ('fire_damage','Fire damage','damage'),
  ('physical_damage','Physical damage','damage'),
  ('unnatural_damage','Unnatural damage','damage'),
  ('true_damage','True damage','damage'),
  ('apply_fire','Apply FIRE','status'),
  ('apply_bleed','Apply BLEED','status'),
  ('apply_ice','Apply ICE','status'),
  ('apply_raid','Apply RAID','status'),
  ('apply_poison','Apply POISON','status'),
  ('apply_wound','Apply WOUND','status'),
  ('healing','Healing','support'),
  ('shield','Shields','support'),
  ('stamina','Stamina support','support'),
  ('treasury','Treasury effects','economy'),
  ('reinforce','Reinforcement effects','summon'),
  ('taunt','Taunt','survivability'),
  ('cleanse','Debuff removal','support'),
  ('buff_removal','Buff removal','control'),
  ('stun','STUN','control'),
  ('pacify','PACIFY','control'),
  ('deceive','DECEIVE','control'),
  ('birthright','BIRTHRIGHT','buff'),
  ('fury','FURY','buff'),
  ('critical','Critical support','support'),
  ('defense','Defense and durability','survivability'),
  ('unnatural_resistance','Unnatural resistance','survivability'),
  ('revive','Revive','support'),
  ('power_up','Power-Up effects','board'),
  ('stealth','STEALTH','survivability'),
  ('gem_damage','Gem damage','damage'),
  ('bleed_payoff','BLEED payoff','synergy'),
  ('raid_payoff','RAID payoff','synergy'),
  ('brittle_payoff','BRITTLE payoff','synergy'),
  ('fire_payoff','FIRE payoff','synergy'),
  ('shield_payoff','Shield payoff','synergy'),
  ('wound_payoff','WOUND payoff','synergy'),
  ('scout_payoff','SCOUTED payoff','synergy'),
  ('fast_start','Fast opening','tempo'),
  ('leader_effect','Leader effect','leadership'),
  ('unverified_release','Unverified availability','availability'),
  ('color_red','Red champion','identity'),
  ('color_blue','Blue champion','identity'),
  ('color_green','Green champion','identity'),
  ('color_purple','Purple champion','identity'),
  ('color_yellow','Yellow champion','identity'),
  ('faction_baratheon','Baratheon','faction'),
  ('faction_blacks','Blacks','faction'),
  ('faction_bolton','Bolton','faction'),
  ('faction_brotherhood','Brotherhood','faction'),
  ('faction_free_cities','Free Cities','faction'),
  ('faction_free_folk','Free Folk','faction'),
  ('faction_greens','Greens','faction'),
  ('faction_greyjoy','Greyjoy','faction'),
  ('faction_lannister','Lannister','faction'),
  ('faction_nights_watch','Night''s Watch','faction'),
  ('faction_stark','Stark','faction'),
  ('faction_targaryen','Targaryen','faction')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,category=EXCLUDED.category;

INSERT INTO knowledge.strategy_fact_patterns (id,mechanic_id,effect_role,text_pattern) VALUES
  ('pattern-01-fire_damage','fire_damage','deals','fire damage'),
  ('pattern-02-physical_damage','physical_damage','deals','physical damage'),
  ('pattern-03-unnatural_damage','unnatural_damage','deals','unnatural damage'),
  ('pattern-04-true_damage','true_damage','deals','true damage'),
  ('pattern-05-apply_fire','apply_fire','applies','(afflict|inflict|apply|begins? combat with|begin combat with)[^.]{0,100}fire'),
  ('pattern-06-apply_bleed','apply_bleed','applies','(afflict|inflict|apply|begins? combat with|begin combat with)[^.]{0,100}bleed'),
  ('pattern-07-apply_ice','apply_ice','applies','(afflict|inflict|apply|begins? combat with|begin combat with)[^.]{0,100}ice'),
  ('pattern-08-apply_raid','apply_raid','applies','(afflict|inflict|apply|raid(s|ed)? all)[^.]{0,100}raid'),
  ('pattern-09-apply_poison','apply_poison','applies','(afflict|inflict|apply)[^.]{0,100}poison'),
  ('pattern-10-apply_wound','apply_wound','applies','(afflict|inflict|apply|wounds?)[^.]{0,100}(wound|enem)'),
  ('pattern-11-healing','healing','supports','heal'),
  ('pattern-12-shield','shield','supports','shield'),
  ('pattern-13-stamina','stamina','supports','stamina'),
  ('pattern-14-treasury','treasury','uses','treasury|coin gem|coins'),
  ('pattern-15-reinforce','reinforce','uses','reinforc|raises the dead|replace[^.]{0,60}allies'),
  ('pattern-16-taunt','taunt','uses','taunt'),
  ('pattern-17-cleanse','cleanse','supports','remove[^.]{0,80}debuff'),
  ('pattern-18-buff_removal','buff_removal','controls','remove[^.]{0,80}buff'),
  ('pattern-19-stun','stun','controls','stun'),
  ('pattern-20-pacify','pacify','controls','pacif'),
  ('pattern-21-deceive','deceive','controls','deceiv'),
  ('pattern-22-birthright','birthright','uses','birthright'),
  ('pattern-23-fury','fury','uses','fury|enraged'),
  ('pattern-24-critical','critical','supports','critical'),
  ('pattern-25-defense','defense','supports','def buff|durability|physical resistance|fire resistance|block'),
  ('pattern-26-unnatural_resistance','unnatural_resistance','supports','unnatural resistance'),
  ('pattern-27-revive','revive','supports','reviv'),
  ('pattern-28-power_up','power_up','uses','power-up'),
  ('pattern-29-stealth','stealth','uses','stealth'),
  ('pattern-30-gem_damage','gem_damage','supports','gem damage'),
  ('pattern-31-bleed_payoff','bleed_payoff','exploits','(if|when|for each)[^.]{0,100}bleed|bleeding enem'),
  ('pattern-32-raid_payoff','raid_payoff','exploits','(if|when|for each|per)[^.]{0,100}raid|raided enemy'),
  ('pattern-33-brittle_payoff','brittle_payoff','exploits','(if|when)[^.]{0,100}brittle|brittle[^.]{0,60}(double|triple|bonus)'),
  ('pattern-34-fire_payoff','fire_payoff','exploits','(if|when|for each|per)[^.]{0,100}fire|afflicted with fire'),
  ('pattern-35-shield_payoff','shield_payoff','exploits','(if|when|for each)[^.]{0,100}shield|shield bonus'),
  ('pattern-36-wound_payoff','wound_payoff','exploits','(if|when)[^.]{0,100}wound|wounded enem'),
  ('pattern-37-scout_payoff','scout_payoff','exploits','(if|when)[^.]{0,100}scout|scouted enem'),
  ('pattern-38-fast_start','fast_start','tempo','(start|begin)[^.]{0,80}(stamina|skill|strike|stun|taunt|ice|fire|bleed|scout|deceiv)')
ON CONFLICT (id) DO UPDATE SET mechanic_id=EXCLUDED.mechanic_id,effect_role=EXCLUDED.effect_role,text_pattern=EXCLUDED.text_pattern;

INSERT INTO knowledge.strategy_targets (id,battle_mode,target_kind,display_name,evidence_state,approach,timing,warning,provenance_ref,review_status) VALUES
  ('legendary-assault:drogon','legendary-assault','encounter','Drogon','verified','Bring BIRTHRIGHT and fast Skill access, keep using Skills, and rely on damage Drogon does not ignore.','Use at least one Skill each turn when possible. Avoid making Power-Up destruction and shields the center of the plan.','Drogon is immune to FIRE and destroys shields; his attacks can also reduce the Treasury.','legendary_assault_encounter:drogon','reviewed'),
  ('legendary-assault:rhaegal','legendary-assault','encounter','Rhaegal','verified','Stack BLEED and FIRE while protecting and healing the champion Rhaegal forces to TAUNT.','Apply BLEED before Rhaegal uses his Skill and keep FIRE active. Do not reinforce into his 100% HP Pool retaliation.','Rhaegal consumes BIRTHRIGHT, FURY, shields, ICE, and BRITTLE; he cannot be STUNNED, PACIFIED, or DECEIVED.','legendary_assault_encounter:rhaegal','reviewed'),
  ('legendary-assault:viserion','legendary-assault','encounter','Viserion','verified','Use RAID to strip defense and ICE to deal true damage, then attack sleeping Viserion only after he is BRITTLE.','Build BRITTLE before striking through sleep. Stop attacking during PACIFY and avoid reinforcements that accelerate Patience.','Viserion is immune to FIRE and POISON, destroys shields on waking, and punishes REINFORCE, STUN, and DECEIVE.','legendary_assault_encounter:viserion','reviewed'),
  ('legendary-assault:icy-viserion','legendary-assault','encounter','Icy Viserion','insufficient','No team is generated until verified encounter abilities are available.','Unavailable.','The encounter is represented, but its ability cards and verified battle rules are unavailable.','legendary_assault_encounter:icy-viserion','reviewed'),
  ('raid:attack','raid','raid-role','Raid attack','verified','Prioritize fast pressure, control, buff removal, and enough sustain to finish the selected defense.','Use the opening turns to disable the highest-impact defender and preserve Stamina for coordinated Skills.','Opponent power, stars, gear, and exact defensive lineup are outside this recommendation.','raid_mode_rules:matchmaking','reviewed'),
  ('raid:defense','raid','raid-role','Raid defense','verified','Prioritize durable leaders, healing, shields, TAUNT, revive, and opening control that works without manual targeting.','Favor effects that trigger at battle start, on damage, or on ally defeat because another player controls the attack.','Observed teams are composition examples and do not prove defensive wins.','raid_mode_rules:strategy','reviewed'),
  ('war:baratheon-war-camp','war','war-rule','Baratheon War Camp','verified','Use Baratheon champions to receive the verified +25% ATK battlefield bonus.','Build around the bonus in the phases where the outpost applies.','The modifier applies according to the recorded Phase 3 and Phase 4 rule.','war_outpost_rule:baratheon-war-camp','reviewed'),
  ('war:crimson-bastion','war','war-rule','Crimson Bastion','verified','Red champions gain the verified +25% DEF bonus, favoring durable red cores.','Use the defensive bonus to survive enemy Skill cycles.','The modifier applies according to the recorded phase rule.','war_outpost_rule:crimson-bastion','reviewed'),
  ('war:ravenous-pack','war','war-rule','Ravenous Pack','verified','Exploit the WOUND applied to enemies every three turns with champions that gain value from WOUNDED targets.','Coordinate damage and WOUND-triggered effects during the three-turn window.','WOUND prevents healing but does not itself prove a team can finish the opponent.','war_outpost_rule:ravenous-pack','reviewed'),
  ('war:ashen-waste','war','war-rule','Ashen Waste','verified','Use champions that profit from enemies beginning the battle with two FIRE.','Trigger FIRE payoff effects early before the opening stacks expire or are removed.','The opening FIRE is a battlefield rule; additional FIRE application still depends on champion abilities.','war_outpost_rule:ashen-waste','reviewed'),
  ('war:barricade','war','war-rule','Barricade','verified','Combine the +15% Tenacity rule with durable protection and cleansing.','Preserve cleanses for debuffs that still land through the Tenacity bonus.','Tenacity reduces risk; it does not guarantee immunity.','war_outpost_rule:barricade','reviewed'),
  ('war:harpys-pit','war','war-rule','Harpy''s Pit','verified','Exploit enemies beginning battle WOUNDED for three turns.','Front-load WOUND payoff and focused damage during the opening turns.','The opening WOUND lasts three turns in the verified rule.','war_outpost_rule:harpys-pit','reviewed'),
  ('war:maesters-sigil','war','war-rule','Maester''s Sigil','verified','Layer sustain and Unnatural Resistance around the verified +20% resistance buff.','Use the opening resistance window to stabilize and build Stamina.','The rule supplies resistance; it does not add damage.','war_outpost_rule:maesters-sigil','reviewed'),
  ('war:scouts-post','war','war-rule','Scout''s Post','verified','Use champions whose abilities gain value from SCOUTED enemies during the two-turn opening.','Trigger SCOUTED payoff immediately before the opening mark expires.','The verified SCOUTED duration is two turns.','war_outpost_rule:scouts-post','reviewed'),
  ('war:stone-keep','war','war-rule','Stone Keep','verified','Build a durable team that compounds the verified +10% DEF bonus with shields and healing.','Absorb the first enemy cycle, then use the stable board to coordinate Skills.','The battlefield bonus improves DEF but does not replace healing or damage.','war_outpost_rule:stone-keep','reviewed')
ON CONFLICT (id) DO UPDATE SET battle_mode=EXCLUDED.battle_mode,target_kind=EXCLUDED.target_kind,display_name=EXCLUDED.display_name,evidence_state=EXCLUDED.evidence_state,approach=EXCLUDED.approach,timing=EXCLUDED.timing,warning=EXCLUDED.warning,provenance_ref=EXCLUDED.provenance_ref,review_status=EXCLUDED.review_status;

INSERT INTO knowledge.strategy_rules (id,rule_kind,battle_mode,target_id,subject_variant_id,mechanic_id,paired_mechanic_id,score,rationale,evidence_category,provenance_ref,source_id,confidence,review_status) VALUES
  ('global-unverified-release','target_fit','all',NULL,NULL,'unverified_release',NULL,-30,'Current availability for this exact variant is not verified, so it is not used as a primary recommendation.','strategy_inference','champion_variants.live_status',NULL,1,'reviewed'),
  ('drogon-birthright','target_fit','legendary-assault','legendary-assault:drogon',NULL,'birthright',NULL,22,'Drogon''s verified Daznak''s Fury makes allied BIRTHRIGHT deal direct HP damage to him.','strategy_inference','legendary_assault_tip:drogon-birthright',NULL,1,'reviewed'),
  ('drogon-stamina','target_fit','legendary-assault','legendary-assault:drogon',NULL,'stamina',NULL,8,'Reliable Stamina helps the team use a Skill every turn and suppress Brimstone Rain.','strategy_inference','legendary_assault_tip:drogon-fast-champions',NULL,0.9,'reviewed'),
  ('drogon-fast-start','target_fit','legendary-assault','legendary-assault:drogon',NULL,'fast_start',NULL,6,'Fast opening effects help prevent turns with no player Skill.','strategy_inference','legendary_assault_tip:drogon-fast-champions',NULL,0.85,'reviewed'),
  ('drogon-physical','target_fit','legendary-assault','legendary-assault:drogon',NULL,'physical_damage',NULL,4,'Physical damage remains usable while FIRE is ineffective.','strategy_inference','legendary_assault_ability:drogon-born-in-flames-ii',NULL,0.85,'reviewed'),
  ('drogon-true','target_fit','legendary-assault','legendary-assault:drogon',NULL,'true_damage',NULL,5,'True damage avoids relying on Drogon''s FIRE vulnerability, which does not exist.','strategy_inference','legendary_assault_ability:drogon-born-in-flames-ii',NULL,0.85,'reviewed'),
  ('drogon-fire-damage','target_fit','legendary-assault','legendary-assault:drogon',NULL,'fire_damage',NULL,-24,'Drogon is verified immune to FIRE, so Fire Damage is ineffective.','strategy_inference','legendary_assault_ability:drogon-born-in-flames-ii',NULL,1,'reviewed'),
  ('drogon-apply-fire','target_fit','legendary-assault','legendary-assault:drogon',NULL,'apply_fire',NULL,-18,'Drogon is verified immune to FIRE application.','strategy_inference','legendary_assault_ability:drogon-born-in-flames-ii',NULL,1,'reviewed'),
  ('drogon-shield','target_fit','legendary-assault','legendary-assault:drogon',NULL,'shield',NULL,-7,'Verified guidance warns that Drogon destroys shields.','strategy_inference','legendary_assault_tip:drogon-shields-fire',NULL,1,'reviewed'),
  ('drogon-power-up','target_fit','legendary-assault','legendary-assault:drogon',NULL,'power_up',NULL,-5,'Matching or destroying Power-Ups triggers Ember Storm II.','strategy_inference','legendary_assault_ability:drogon-ember-storm-ii',NULL,1,'reviewed'),
  ('drogon-treasury','target_fit','legendary-assault','legendary-assault:drogon',NULL,'treasury',NULL,-3,'Ember Storm II can reduce the player Treasury, making Treasury plans less reliable.','strategy_inference','legendary_assault_ability:drogon-ember-storm-ii',NULL,0.95,'reviewed'),
  ('drogon-free-cities','target_fit','legendary-assault','legendary-assault:drogon',NULL,'faction_free_cities',NULL,6,'Daznak''s Fury grants Free Cities allies ATK and Stamina after their Skills.','strategy_inference','legendary_assault_ability:drogon-daznaks-fury',NULL,1,'reviewed'),
  ('rhaegal-bleed','target_fit','legendary-assault','legendary-assault:rhaegal',NULL,'apply_bleed',NULL,24,'Rhaegal takes verified Max HP True Damage when he uses his Skill while BLEEDING.','strategy_inference','legendary_assault_tip:rhaegal-bleed',NULL,1,'reviewed'),
  ('rhaegal-bleed-payoff','target_fit','legendary-assault','legendary-assault:rhaegal',NULL,'bleed_payoff',NULL,7,'BLEED payoff supports the encounter''s strongest verified damage opening.','strategy_inference','legendary_assault_tip:rhaegal-bleed',NULL,0.9,'reviewed'),
  ('rhaegal-apply-fire','target_fit','legendary-assault','legendary-assault:rhaegal',NULL,'apply_fire',NULL,19,'Each FIRE mark deals verified flat True Damage to Rhaegal at turn start.','strategy_inference','legendary_assault_tip:rhaegal-fire',NULL,1,'reviewed'),
  ('rhaegal-fire-damage','target_fit','legendary-assault','legendary-assault:rhaegal',NULL,'fire_damage',NULL,10,'FIRE-oriented abilities help maintain the encounter''s verified FIRE pressure.','strategy_inference','legendary_assault_tip:rhaegal-fire',NULL,0.9,'reviewed'),
  ('rhaegal-healing','target_fit','legendary-assault','legendary-assault:rhaegal',NULL,'healing',NULL,15,'Verified guidance says to keep Rhaegal''s TAUNTING target alive; healing also triggers BLOCK and RENEW.','strategy_inference','legendary_assault_tip:rhaegal-taunt',NULL,1,'reviewed'),
  ('rhaegal-defense','target_fit','legendary-assault','legendary-assault:rhaegal',NULL,'defense',NULL,8,'Durability helps the forced TAUNT target survive repeated Skills and GRUDGE.','strategy_inference','legendary_assault_ability:rhaegal-wrathful-gaze',NULL,0.9,'reviewed'),
  ('rhaegal-targaryen','target_fit','legendary-assault','legendary-assault:rhaegal',NULL,'faction_targaryen',NULL,7,'Healing a TAUNTING Targaryen deals verified Max HP Physical Damage to Rhaegal.','strategy_inference','legendary_assault_ability:rhaegal-fuel-to-the-flames',NULL,1,'reviewed'),
  ('rhaegal-bolton','target_fit','legendary-assault','legendary-assault:rhaegal',NULL,'faction_bolton',NULL,7,'Healing a TAUNTING Bolton deals verified Max HP Physical Damage to Rhaegal.','strategy_inference','legendary_assault_ability:rhaegal-fuel-to-the-flames',NULL,1,'reviewed'),
  ('rhaegal-reinforce','target_fit','legendary-assault','legendary-assault:rhaegal',NULL,'reinforce',NULL,-30,'Rhaegal deals 100% HP Pool True Damage to a champion who REINFORCES.','strategy_inference','legendary_assault_ability:rhaegal-high-and-mighty',NULL,1,'reviewed'),
  ('rhaegal-ice','target_fit','legendary-assault','legendary-assault:rhaegal',NULL,'apply_ice',NULL,-13,'Rhaegal consumes ICE and retaliates with Fire Damage for every ICE eaten.','strategy_inference','legendary_assault_ability:rhaegal-opening-salvo',NULL,1,'reviewed'),
  ('rhaegal-brittle','target_fit','legendary-assault','legendary-assault:rhaegal',NULL,'brittle_payoff',NULL,-11,'Rhaegal consumes BRITTLE, undermining BRITTLE-dependent plans.','strategy_inference','legendary_assault_ability:rhaegal-opening-salvo',NULL,1,'reviewed'),
  ('rhaegal-shield','target_fit','legendary-assault','legendary-assault:rhaegal',NULL,'shield',NULL,-8,'Rhaegal consumes shields and replaces them with GRUDGE.','strategy_inference','legendary_assault_ability:rhaegal-opening-salvo',NULL,1,'reviewed'),
  ('rhaegal-birthright','target_fit','legendary-assault','legendary-assault:rhaegal',NULL,'birthright',NULL,-8,'Rhaegal consumes BIRTHRIGHT and replaces it with GRUDGE.','strategy_inference','legendary_assault_ability:rhaegal-opening-salvo',NULL,1,'reviewed'),
  ('rhaegal-fury','target_fit','legendary-assault','legendary-assault:rhaegal',NULL,'fury',NULL,-8,'Rhaegal consumes FURY and replaces it with GRUDGE.','strategy_inference','legendary_assault_ability:rhaegal-opening-salvo',NULL,1,'reviewed'),
  ('rhaegal-stun','target_fit','legendary-assault','legendary-assault:rhaegal',NULL,'stun',NULL,-12,'Rhaegal cannot be STUNNED.','strategy_inference','legendary_assault_ability:rhaegal-high-and-mighty',NULL,1,'reviewed'),
  ('rhaegal-pacify','target_fit','legendary-assault','legendary-assault:rhaegal',NULL,'pacify',NULL,-12,'Rhaegal cannot be PACIFIED.','strategy_inference','legendary_assault_ability:rhaegal-high-and-mighty',NULL,1,'reviewed'),
  ('rhaegal-deceive','target_fit','legendary-assault','legendary-assault:rhaegal',NULL,'deceive',NULL,-12,'Rhaegal cannot be DECEIVED.','strategy_inference','legendary_assault_ability:rhaegal-high-and-mighty',NULL,1,'reviewed'),
  ('viserion-raid','target_fit','legendary-assault','legendary-assault:viserion',NULL,'apply_raid',NULL,24,'Each RAID removes verified DEF and DURABILITY from Viserion.','strategy_inference','legendary_assault_tip:viserion-raid',NULL,1,'reviewed'),
  ('viserion-raid-payoff','target_fit','legendary-assault','legendary-assault:viserion',NULL,'raid_payoff',NULL,9,'RAID payoff capitalizes on Viserion''s verified defense loss.','strategy_inference','legendary_assault_tip:viserion-raid',NULL,0.9,'reviewed'),
  ('viserion-ice','target_fit','legendary-assault','legendary-assault:viserion',NULL,'apply_ice',NULL,19,'ICE deals verified Max HP True Damage to Viserion.','strategy_inference','legendary_assault_ability:viserion-patience-ii',NULL,1,'reviewed'),
  ('viserion-brittle','target_fit','legendary-assault','legendary-assault:viserion',NULL,'brittle_payoff',NULL,18,'BRITTLE allows the team to strike sleeping Viserion without Rude Awakening retaliation.','strategy_inference','legendary_assault_tip:viserion-brittle',NULL,1,'reviewed'),
  ('viserion-physical','target_fit','legendary-assault','legendary-assault:viserion',NULL,'physical_damage',NULL,4,'Physical damage remains usable while FIRE and POISON are immune.','strategy_inference','legendary_assault_ability:viserion-unchained-dragon',NULL,0.85,'reviewed'),
  ('viserion-true','target_fit','legendary-assault','legendary-assault:viserion',NULL,'true_damage',NULL,5,'True damage does not rely on FIRE or POISON.','strategy_inference','legendary_assault_ability:viserion-unchained-dragon',NULL,0.85,'reviewed'),
  ('viserion-fire-damage','target_fit','legendary-assault','legendary-assault:viserion',NULL,'fire_damage',NULL,-22,'Viserion is verified immune to FIRE.','strategy_inference','legendary_assault_ability:viserion-unchained-dragon',NULL,1,'reviewed'),
  ('viserion-apply-fire','target_fit','legendary-assault','legendary-assault:viserion',NULL,'apply_fire',NULL,-18,'Viserion is verified immune to FIRE application.','strategy_inference','legendary_assault_ability:viserion-unchained-dragon',NULL,1,'reviewed'),
  ('viserion-poison','target_fit','legendary-assault','legendary-assault:viserion',NULL,'apply_poison',NULL,-22,'Viserion is verified immune to POISON.','strategy_inference','legendary_assault_ability:viserion-unchained-dragon',NULL,1,'reviewed'),
  ('viserion-reinforce','target_fit','legendary-assault','legendary-assault:viserion',NULL,'reinforce',NULL,-30,'REINFORCE accelerates Patience and triggers 100% HP Pool True Damage.','strategy_inference','legendary_assault_ability:viserion-patience-ii',NULL,1,'reviewed'),
  ('viserion-shield','target_fit','legendary-assault','legendary-assault:viserion',NULL,'shield',NULL,-9,'Viserion destroys all shields whenever he wakes.','strategy_inference','legendary_assault_ability:viserion-rude-awakening-ii',NULL,1,'reviewed'),
  ('viserion-birthright','target_fit','legendary-assault','legendary-assault:viserion',NULL,'birthright',NULL,-8,'Claw Swipe II removes BIRTHRIGHT and converts removed Buffs into damage.','strategy_inference','legendary_assault_ability:viserion-claw-swipe-ii',NULL,1,'reviewed'),
  ('viserion-fury','target_fit','legendary-assault','legendary-assault:viserion',NULL,'fury',NULL,-8,'Claw Swipe II removes FURY and ENRAGED and converts removed Buffs into damage.','strategy_inference','legendary_assault_ability:viserion-claw-swipe-ii',NULL,1,'reviewed'),
  ('viserion-stun','target_fit','legendary-assault','legendary-assault:viserion',NULL,'stun',NULL,-9,'Viserion removes STUN at turn start and doubles Patience when he does.','strategy_inference','legendary_assault_ability:viserion-unchained-dragon',NULL,1,'reviewed'),
  ('viserion-deceive','target_fit','legendary-assault','legendary-assault:viserion',NULL,'deceive',NULL,-9,'Viserion removes DECEIVE at turn start and doubles Patience when he does.','strategy_inference','legendary_assault_ability:viserion-unchained-dragon',NULL,1,'reviewed'),
  ('raid-attack-physical','target_fit','raid','raid:attack',NULL,'physical_damage',NULL,8,'Direct Physical Damage supports focused Raid offense.','strategy_inference','raid_mode_rules:matchmaking',NULL,0.72,'reviewed'),
  ('raid-attack-true','target_fit','raid','raid:attack',NULL,'true_damage',NULL,9,'True Damage gives an attacking team reliable pressure into defenses.','strategy_inference','raid_mode_rules:matchmaking',NULL,0.72,'reviewed'),
  ('raid-attack-unnatural','target_fit','raid','raid:attack',NULL,'unnatural_damage',NULL,7,'Unnatural Damage broadens offensive damage coverage.','strategy_inference','raid_mode_rules:matchmaking',NULL,0.68,'reviewed'),
  ('raid-attack-fire','target_fit','raid','raid:attack',NULL,'fire_damage',NULL,6,'Sustained FIRE pressure can help an attacking team finish a chosen defense.','strategy_inference','raid_mode_rules:strategy',NULL,0.65,'reviewed'),
  ('raid-attack-remove','target_fit','raid','raid:attack',NULL,'buff_removal',NULL,7,'Buff removal helps an attacker dismantle defensive effects.','strategy_inference','raid_mode_rules:matchmaking',NULL,0.75,'reviewed'),
  ('raid-attack-stamina','target_fit','raid','raid:attack',NULL,'stamina',NULL,6,'Stamina support enables coordinated attacking Skills.','strategy_inference','raid_mode_rules:strategy',NULL,0.7,'reviewed'),
  ('raid-attack-control','target_fit','raid','raid:attack',NULL,'stun',NULL,6,'STUN creates an attacking tempo window.','strategy_inference','raid_mode_rules:strategy',NULL,0.7,'reviewed'),
  ('raid-attack-fast','target_fit','raid','raid:attack',NULL,'fast_start',NULL,6,'Fast opening effects help control the selected opponent before their rotation develops.','strategy_inference','raid_mode_rules:matchmaking',NULL,0.68,'reviewed'),
  ('raid-attack-heal','target_fit','raid','raid:attack',NULL,'healing',NULL,3,'Some healing protects the attack long enough to finish the defense.','strategy_inference','raid_mode_rules:rewards',NULL,0.65,'reviewed'),
  ('raid-defense-heal','target_fit','raid','raid:defense',NULL,'healing',NULL,10,'Automatic healing makes a defensive team harder to finish.','strategy_inference','raid_mode_rules:matchmaking',NULL,0.72,'reviewed'),
  ('raid-defense-shield','target_fit','raid','raid:defense',NULL,'shield',NULL,9,'Shields add defensive staying power.','strategy_inference','raid_mode_rules:matchmaking',NULL,0.72,'reviewed'),
  ('raid-defense-taunt','target_fit','raid','raid:defense',NULL,'taunt',NULL,9,'TAUNT redirects attacks and protects fragile allies on defense.','strategy_inference','raid_mode_rules:matchmaking',NULL,0.75,'reviewed'),
  ('raid-defense-defense','target_fit','raid','raid:defense',NULL,'defense',NULL,9,'DEF, Durability, Resistance, and BLOCK improve defensive survival.','strategy_inference','raid_mode_rules:matchmaking',NULL,0.75,'reviewed'),
  ('raid-defense-revive','target_fit','raid','raid:defense',NULL,'revive',NULL,8,'REVIVE forces the attacking team to secure another defeat.','strategy_inference','raid_mode_rules:matchmaking',NULL,0.72,'reviewed'),
  ('raid-defense-fast','target_fit','raid','raid:defense',NULL,'fast_start',NULL,9,'Battle-start effects are reliable when the defensive team is not manually controlled.','strategy_inference','raid_mode_rules:matchmaking',NULL,0.78,'reviewed'),
  ('raid-defense-stun','target_fit','raid','raid:defense',NULL,'stun',NULL,7,'STUN disrupts the attacker''s opening rotation.','strategy_inference','raid_mode_rules:strategy',NULL,0.7,'reviewed'),
  ('raid-defense-pacify','target_fit','raid','raid:defense',NULL,'pacify',NULL,7,'PACIFY delays attacking Skills.','strategy_inference','raid_mode_rules:strategy',NULL,0.7,'reviewed'),
  ('raid-defense-deceive','target_fit','raid','raid:defense',NULL,'deceive',NULL,7,'DECEIVE adds defensive disruption.','strategy_inference','raid_mode_rules:strategy',NULL,0.7,'reviewed'),
  ('war-baratheon-faction','target_fit','war','war:baratheon-war-camp',NULL,'faction_baratheon',NULL,24,'Baratheon champions receive the verified +25% ATK battlefield modifier.','strategy_inference','war_outpost_rule:baratheon-war-camp',NULL,1,'reviewed'),
  ('war-crimson-red','target_fit','war','war:crimson-bastion',NULL,'color_red',NULL,24,'Red champions receive the verified +25% DEF battlefield modifier.','strategy_inference','war_outpost_rule:crimson-bastion',NULL,1,'reviewed'),
  ('war-crimson-defense','target_fit','war','war:crimson-bastion',NULL,'defense',NULL,5,'Existing defensive tools compound Crimson Bastion''s DEF bonus.','strategy_inference','war_outpost_rule:crimson-bastion',NULL,0.8,'reviewed'),
  ('war-ravenous-wound-payoff','target_fit','war','war:ravenous-pack',NULL,'wound_payoff',NULL,20,'WOUND payoff uses the battlefield''s recurring three-turn WOUND window.','strategy_inference','war_outpost_rule:ravenous-pack',NULL,0.9,'reviewed'),
  ('war-ravenous-damage','target_fit','war','war:ravenous-pack',NULL,'physical_damage',NULL,3,'Direct damage helps capitalize while enemies cannot heal.','strategy_inference','war_outpost_rule:ravenous-pack',NULL,0.65,'reviewed'),
  ('war-ashen-fire-payoff','target_fit','war','war:ashen-waste',NULL,'fire_payoff',NULL,20,'FIRE payoff begins active because enemies start with two FIRE.','strategy_inference','war_outpost_rule:ashen-waste',NULL,0.95,'reviewed'),
  ('war-ashen-fire-damage','target_fit','war','war:ashen-waste',NULL,'fire_damage',NULL,6,'Fire-oriented damage supports the existing opening FIRE pressure.','strategy_inference','war_outpost_rule:ashen-waste',NULL,0.75,'reviewed'),
  ('war-barricade-defense','target_fit','war','war:barricade',NULL,'defense',NULL,9,'Durability compounds the battlefield''s +15% Tenacity.','strategy_inference','war_outpost_rule:barricade',NULL,0.76,'reviewed'),
  ('war-barricade-cleanse','target_fit','war','war:barricade',NULL,'cleanse',NULL,7,'Cleanse covers important debuffs that still land through Tenacity.','strategy_inference','war_outpost_rule:barricade',NULL,0.75,'reviewed'),
  ('war-harpy-wound-payoff','target_fit','war','war:harpys-pit',NULL,'wound_payoff',NULL,22,'WOUND payoff is immediately available while enemies begin WOUNDED.','strategy_inference','war_outpost_rule:harpys-pit',NULL,0.95,'reviewed'),
  ('war-harpy-fast','target_fit','war','war:harpys-pit',NULL,'fast_start',NULL,7,'Fast effects use the verified three-turn opening WOUND window.','strategy_inference','war_outpost_rule:harpys-pit',NULL,0.82,'reviewed'),
  ('war-maester-resistance','target_fit','war','war:maesters-sigil',NULL,'unnatural_resistance',NULL,18,'Recorded Unnatural Resistance effects compound the battlefield''s +20% buff.','strategy_inference','war_outpost_rule:maesters-sigil',NULL,0.85,'reviewed'),
  ('war-maester-heal','target_fit','war','war:maesters-sigil',NULL,'healing',NULL,6,'Healing converts the resistance window into sustained survival.','strategy_inference','war_outpost_rule:maesters-sigil',NULL,0.7,'reviewed'),
  ('war-scout-payoff','target_fit','war','war:scouts-post',NULL,'scout_payoff',NULL,24,'SCOUTED payoff is immediately active during the two-turn opening mark.','strategy_inference','war_outpost_rule:scouts-post',NULL,0.95,'reviewed'),
  ('war-scout-fast','target_fit','war','war:scouts-post',NULL,'fast_start',NULL,8,'Fast effects use SCOUTED before its verified two-turn duration expires.','strategy_inference','war_outpost_rule:scouts-post',NULL,0.82,'reviewed'),
  ('war-stone-defense','target_fit','war','war:stone-keep',NULL,'defense',NULL,18,'DEF and Durability compound Stone Keep''s verified +10% DEF.','strategy_inference','war_outpost_rule:stone-keep',NULL,0.9,'reviewed'),
  ('war-stone-shield','target_fit','war','war:stone-keep',NULL,'shield',NULL,8,'Shields add protection to the battlefield DEF bonus.','strategy_inference','war_outpost_rule:stone-keep',NULL,0.75,'reviewed'),
  ('war-stone-heal','target_fit','war','war:stone-keep',NULL,'healing',NULL,6,'Healing helps a DEF-focused team convert durability into a longer fight.','strategy_inference','war_outpost_rule:stone-keep',NULL,0.72,'reviewed'),
  ('synergy-ice-brittle','team_synergy','all',NULL,NULL,'apply_ice','brittle_payoff',6,'ICE setup enables a teammate''s BRITTLE payoff.','strategy_inference','derived:verified-mechanic-combination',NULL,0.75,'reviewed'),
  ('synergy-raid','team_synergy','all',NULL,NULL,'apply_raid','raid_payoff',6,'RAID setup enables a teammate''s RAID payoff.','strategy_inference','derived:verified-mechanic-combination',NULL,0.75,'reviewed'),
  ('synergy-bleed','team_synergy','all',NULL,NULL,'apply_bleed','bleed_payoff',6,'BLEED setup enables a teammate''s BLEED payoff.','strategy_inference','derived:verified-mechanic-combination',NULL,0.75,'reviewed'),
  ('synergy-fire','team_synergy','all',NULL,NULL,'apply_fire','fire_payoff',5,'FIRE setup enables a teammate''s FIRE payoff.','strategy_inference','derived:verified-mechanic-combination',NULL,0.75,'reviewed'),
  ('synergy-heal-taunt','team_synergy','all',NULL,NULL,'healing','taunt',5,'Healing helps a TAUNT protector keep absorbing pressure.','strategy_inference','derived:verified-mechanic-combination',NULL,0.75,'reviewed'),
  ('synergy-shield','team_synergy','all',NULL,NULL,'shield','shield_payoff',5,'Shield creation enables shield-dependent damage or support.','strategy_inference','derived:verified-mechanic-combination',NULL,0.75,'reviewed'),
  ('synergy-cleanse-taunt','team_synergy','all',NULL,NULL,'cleanse','taunt',4,'Cleanse protects a TAUNT champion from disabling debuffs.','strategy_inference','derived:verified-mechanic-combination',NULL,0.75,'reviewed'),
  ('synergy-treasury','team_synergy','all',NULL,NULL,'treasury','treasury',2,'Multiple Treasury effects can share coin generation and spending opportunities.','strategy_inference','derived:verified-mechanic-combination',NULL,0.75,'reviewed'),
  ('coverage-healing','team_synergy','all',NULL,NULL,'healing',NULL,4,'The team includes verified healing for sustained battles.','strategy_inference','derived:verified-mechanic-combination',NULL,0.75,'reviewed'),
  ('coverage-defense','team_synergy','all',NULL,NULL,'defense',NULL,4,'The team includes verified DEF, Durability, Resistance, or BLOCK support.','strategy_inference','derived:verified-mechanic-combination',NULL,0.75,'reviewed'),
  ('coverage-taunt','team_synergy','all',NULL,NULL,'taunt',NULL,3,'The team includes a verified TAUNT option for pressure control.','strategy_inference','derived:verified-mechanic-combination',NULL,0.75,'reviewed'),
  ('coverage-cleanse','team_synergy','all',NULL,NULL,'cleanse',NULL,3,'The team can remove verified debuffs from allies.','strategy_inference','derived:verified-mechanic-combination',NULL,0.75,'reviewed'),
  ('coverage-leader','team_synergy','all',NULL,NULL,'leader_effect',NULL,2,'The team includes at least one source-backed Leader effect.','strategy_inference','derived:verified-mechanic-combination',NULL,0.75,'reviewed')
ON CONFLICT (id) DO UPDATE SET rule_kind=EXCLUDED.rule_kind,battle_mode=EXCLUDED.battle_mode,target_id=EXCLUDED.target_id,subject_variant_id=EXCLUDED.subject_variant_id,mechanic_id=EXCLUDED.mechanic_id,paired_mechanic_id=EXCLUDED.paired_mechanic_id,score=EXCLUDED.score,rationale=EXCLUDED.rationale,evidence_category=EXCLUDED.evidence_category,provenance_ref=EXCLUDED.provenance_ref,source_id=EXCLUDED.source_id,confidence=EXCLUDED.confidence,review_status=EXCLUDED.review_status;

DELETE FROM knowledge.strategy_champion_facts;

-- Exact mechanic words are normalized from reviewed ability, trait, and item wording.
INSERT INTO knowledge.strategy_champion_facts
  (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status)
SELECT 'fact-' || md5(a.id || '|' || p.id), a.variant_id, p.mechanic_id, p.effect_role,
  CASE WHEN a.kind='iconic' THEN 'item' WHEN a.kind IN ('champion_skill','skill') THEN 'skill' ELSE 'ability' END,
  a.name || ': ' || a.exact_visible_text, 'verified_fact', 'ability:' || a.id, a.source_id,
  coalesce(a.confidence, CASE WHEN a.review_status='complete' THEN 1.0 ELSE 0.7 END), coalesce(a.review_status,'reviewed')
FROM knowledge.abilities a
CROSS JOIN knowledge.strategy_fact_patterns p
WHERE a.variant_id IS NOT NULL
  AND a.kind NOT IN ('definition','boss','champion_trait')
  AND lower(a.exact_visible_text) ~ p.text_pattern
ON CONFLICT (id) DO NOTHING;

-- Original trait rows retain the Leader/Passive distinction needed for leader selection.
INSERT INTO knowledge.strategy_champion_facts
  (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status)
SELECT 'fact-' || md5('trait|' || t.trait_id || '|' || p.id), v.id, p.mechanic_id, p.effect_role,
  CASE WHEN lower(coalesce(t.trait_type,''))='leader' THEN 'leader' ELSE 'trait' END,
  t.trait_name || ': ' || t.exact_visible_text, 'verified_fact', 'champion_trait:' || t.trait_id, t.source_id,
  CASE WHEN t.completion_state='complete' THEN 1.0 ELSE 0.7 END, t.completion_state
FROM knowledge.champion_traits t
JOIN knowledge.champion_variants v ON v.sqlite_champion_id=t.champion_id
CROSS JOIN knowledge.strategy_fact_patterns p
WHERE lower(t.exact_visible_text) ~ p.text_pattern
ON CONFLICT (id) DO NOTHING;

INSERT INTO knowledge.strategy_champion_facts
  (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status)
SELECT 'leader-' || t.trait_id, v.id, 'leader_effect', 'leads', 'leader',
  t.trait_name || ': ' || t.exact_visible_text, 'verified_fact', 'champion_trait:' || t.trait_id, t.source_id,
  CASE WHEN t.completion_state='complete' THEN 1.0 ELSE 0.7 END, t.completion_state
FROM knowledge.champion_traits t
JOIN knowledge.champion_variants v ON v.sqlite_champion_id=t.champion_id
WHERE lower(coalesce(t.trait_type,''))='leader'
ON CONFLICT (id) DO UPDATE SET fact_text=EXCLUDED.fact_text,confidence=EXCLUDED.confidence,review_status=EXCLUDED.review_status;

-- Identity facts allow battlefield modifiers to match exact colors and normalized factions.
INSERT INTO knowledge.strategy_champion_facts
  (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status)
SELECT 'color-' || v.id, v.id, 'color_' || lower(v.gem_color), 'is', 'metadata',
  v.display_name || ' is ' || v.gem_color || '.', 'verified_fact', 'champion_variant:' || v.id, NULL, 1.0, v.review_status
FROM knowledge.champion_variants v
WHERE lower(coalesce(v.gem_color,'')) IN ('red','blue','green','purple','yellow')
ON CONFLICT (id) DO UPDATE SET mechanic_id=EXCLUDED.mechanic_id,fact_text=EXCLUDED.fact_text,review_status=EXCLUDED.review_status;

INSERT INTO knowledge.strategy_champion_facts
  (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status)
SELECT 'faction-' || md5(v.id || '|' || f.id), v.id,
  CASE f.name
    WHEN 'Night''s Watch' THEN 'faction_nights_watch'
    WHEN 'Free Cities' THEN 'faction_free_cities'
    WHEN 'Free Folk' THEN 'faction_free_folk'
    ELSE 'faction_' || replace(lower(f.name),' ','_') END,
  'member', 'metadata', v.display_name || ' belongs to ' || f.name || '.', 'verified_fact',
  'faction_membership:' || f.id || ':' || v.id, NULL, 1.0, 'reviewed'
FROM knowledge.faction_memberships fm
JOIN knowledge.champion_variants v ON v.id=fm.variant_id
JOIN knowledge.factions f ON f.id=fm.faction_id
WHERE fm.live_status='live' AND f.live_status='live'
  AND (CASE f.name WHEN 'Night''s Watch' THEN 'faction_nights_watch' WHEN 'Free Cities' THEN 'faction_free_cities' WHEN 'Free Folk' THEN 'faction_free_folk' ELSE 'faction_' || replace(lower(f.name),' ','_') END)
    IN (SELECT id FROM knowledge.strategy_mechanics)
ON CONFLICT (id) DO NOTHING;

INSERT INTO knowledge.strategy_champion_facts
  (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status)
SELECT 'availability-' || v.id, v.id, 'unverified_release', 'limits', 'metadata',
  'Current availability for ' || v.display_name || ' is not verified.', 'verified_fact',
  'champion_variant:' || v.id, NULL, 1.0, v.review_status
FROM knowledge.champion_variants v WHERE v.live_status <> 'live'
ON CONFLICT (id) DO UPDATE SET fact_text=EXCLUDED.fact_text,review_status=EXCLUDED.review_status;

CREATE INDEX IF NOT EXISTS strategy_facts_variant_idx ON knowledge.strategy_champion_facts(variant_id);
CREATE INDEX IF NOT EXISTS strategy_facts_mechanic_idx ON knowledge.strategy_champion_facts(mechanic_id);
CREATE INDEX IF NOT EXISTS strategy_rules_target_idx ON knowledge.strategy_rules(target_id);

CREATE OR REPLACE FUNCTION public.got_strategy_data()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT jsonb_build_object(
    'version', '2026-10-07.1',
    'mechanics', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id',m.id,'name',m.name,'category',m.category) ORDER BY m.id),'[]'::jsonb) FROM knowledge.strategy_mechanics m),
    'targets', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id',t.id,'battleMode',t.battle_mode,'kind',t.target_kind,'name',t.display_name,
      'evidenceState',t.evidence_state,'approach',t.approach,'timing',t.timing,'warning',t.warning,
      'provenanceRef',t.provenance_ref,'reviewStatus',t.review_status) ORDER BY t.battle_mode,t.display_name),'[]'::jsonb)
      FROM knowledge.strategy_targets t),
    'rules', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id',r.id,'kind',r.rule_kind,'battleMode',r.battle_mode,'targetId',r.target_id,
      'subjectVariantId',r.subject_variant_id,'mechanicId',r.mechanic_id,'pairedMechanicId',r.paired_mechanic_id,
      'score',r.score,'rationale',r.rationale,'evidenceCategory',r.evidence_category,
      'provenanceRef',r.provenance_ref,'sourceId',r.source_id,'confidence',r.confidence,'reviewStatus',r.review_status)
      ORDER BY r.id),'[]'::jsonb) FROM knowledge.strategy_rules r),
    'championFacts', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id',f.id,'variantId',f.variant_id,'mechanicId',f.mechanic_id,'effectRole',f.effect_role,
      'context',f.context,'factText',f.fact_text,'evidenceCategory',f.evidence_category,
      'provenanceRef',f.provenance_ref,'sourceId',f.source_id,'confidence',f.confidence,'reviewStatus',f.review_status)
      ORDER BY f.variant_id,f.mechanic_id,f.id),'[]'::jsonb) FROM knowledge.strategy_champion_facts f)
  );
$$;
REVOKE ALL ON FUNCTION public.got_strategy_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.got_strategy_data() TO anon, authenticated;

DO $$
BEGIN
  IF (SELECT count(*) FROM knowledge.strategy_targets) <> 15 THEN RAISE EXCEPTION 'Strategy target count mismatch'; END IF;
  IF (SELECT count(*) FROM knowledge.strategy_rules) <> 93 THEN RAISE EXCEPTION 'Strategy rule count mismatch'; END IF;
  IF (SELECT count(*) FROM knowledge.strategy_champion_facts) < 500 THEN RAISE EXCEPTION 'Strategy champion fact extraction is unexpectedly small'; END IF;
  IF (SELECT count(*) FROM knowledge.strategy_champion_facts WHERE context='leader') < 70 THEN RAISE EXCEPTION 'Leader fact extraction is incomplete'; END IF;
  IF (SELECT evidence_state FROM knowledge.strategy_targets WHERE id='legendary-assault:icy-viserion') <> 'insufficient' THEN RAISE EXCEPTION 'Icy Viserion must remain insufficient evidence'; END IF;
END $$;
