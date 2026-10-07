# Strategy Engine Acceptance Audit — 2026-10-07

This report records the live deterministic result for every supported target after the strategy-quality acceptance fixes. “Strongest” means strongest strategic fit from verified mechanics unless a player later supplies roster levels, stars, gear, and items. Rarity, stars, raw power, popularity, and generic strength are not scoring inputs.

Community-observed compositions are displayed as context with a score contribution of zero. They do not override verified mechanics or imply a victory.

## Audit summary

- Targets evaluated: 15
- Targets returning five exact variants: 14
- Insufficient-evidence targets: 1
- Live normalized mechanics: 57
- Live strategy rules: 93
- Live exact-variant facts: 1071

## Compact result matrix

| Target | Exact five | Leader |
|---|---|---|
| Drogon | Tywin Lannister; Gwayne Hightower; Meryn Trant; Alicent Hightower; Otto Hightower | Alicent Hightower |
| Icy Viserion | Insufficient evidence — no team generated | — |
| Rhaegal | Daenerys Targaryen - Mother Of Dragons; Rhaenyra Targaryen - The King's Chosen Heir; Roose Bolton; Walder Frey; Rhaenyra Targaryen | Daenerys Targaryen - Mother Of Dragons |
| Viserion | Ned Stark; Arya Stark - Winterfell Returned; Rickard Karstark; Tormund Giantsbane; Lyanna Mormont | Ned Stark |
| Raid attack | Icy Viserion; Gwayne Hightower; Meryn Trant; Rhaenys Targaryen; Lyanna Mormont | Gwayne Hightower |
| Raid defense | Sandor Clegane; Ser Duncan the Tall; Samwell Tarly; Meryn Trant; Cersei Lannister | Ser Duncan the Tall |
| Ashen Waste | Daenerys Targaryen - Mother Of Dragons; Rhaenyra Targaryen - The King's Chosen Heir; Meleys; Grey Worm; Rhaenyra Targaryen | Grey Worm |
| Baratheon War Camp | Sandor Clegane; Stannis Baratheon — Lord of Storm's End; Joffrey Baratheon; Gendry; Davos Seaworth | Davos Seaworth |
| Barricade | Daenerys Targaryen - Mother Of Dragons; Ser Duncan the Tall; Rhaenyra Targaryen - The King's Chosen Heir; Brienne of Tarth; Samwell Tarly | Daenerys Targaryen - Mother Of Dragons |
| Crimson Bastion | Daenerys Targaryen - Mother Of Dragons; Melisandre; Meryn Trant; Craster; Tyrion Lannister - The Half Man | Daenerys Targaryen - Mother Of Dragons |
| Harpy's Pit | Margaery Tyrell; Euron Greyjoy; Meryn Trant; Cersei Lannister; Seasmoke | Meryn Trant |
| Maester's Sigil | Laenor Velaryon; Samwell Tarly; Jorah Mormont; Catelyn Stark; Lyanna Mormont | Catelyn Stark |
| Ravenous Pack | Margaery Tyrell; Euron Greyjoy; Benjen Stark; Meryn Trant; Cersei Lannister | Meryn Trant |
| Scout's Post | Joffrey Baratheon; Jaime Lannister; Lord Varys; Davos Seaworth; Barristan Selmy | Jaime Lannister |
| Stone Keep | Sandor Clegane; Ser Duncan the Tall; Brienne of Tarth; Samwell Tarly; Davos Seaworth | Ser Duncan the Tall |

## Drogon

**Target:** `legendary-assault:drogon`  
**Status:** ready  
**Confidence:** medium-high

**Leader:** Alicent Hightower  
**Overall team score:** 199.6

### Exact five and role-preserving substitutes

#### Tywin Lannister (`sqlite-champion-15`)

- Role: Buff enabler / Damage dealer
- Individual strategic-fit score: 23.4
- Verified scoring contributions: BIRTHRIGHT +22 from `champion_trait:31`; inference rule `drogon-birthright` / `legendary_assault_tip:drogon-birthright` | Physical damage +4 from `ability:sqlite-champion_skills-12`; inference rule `drogon-physical` / `legendary_assault_ability:drogon-born-in-flames-ii` | Treasury effects -3 from `ability:sqlite-champion_skills-12`; inference rule `drogon-treasury` / `legendary_assault_ability:drogon-ember-storm-ii`
- Iconic item: No supported connected item shown
- Primary substitute: Sunfyre (`sqlite-champion-56`) — Preserves BIRTHRIGHT, the main verified function supplied by Tywin Lannister. Projected team score 186.3.
- Important conflict: -3: Ember Storm II can reduce the player Treasury, making Treasury plans less reliable.

#### Gwayne Hightower (`sqlite-champion-43`)

- Role: Buff enabler / Support
- Individual strategic-fit score: 40.9
- Verified scoring contributions: BIRTHRIGHT +22 from `champion_trait:92`; inference rule `drogon-birthright` / `legendary_assault_tip:drogon-birthright` | Stamina support +8 from `champion_trait:92`; inference rule `drogon-stamina` / `legendary_assault_tip:drogon-fast-champions` | True damage +5 from `ability:sqlite-champion_skills-42`; inference rule `drogon-true` / `legendary_assault_ability:drogon-born-in-flames-ii` | Physical damage +4 from `ability:sqlite-champion_skills-42`; inference rule `drogon-physical` / `legendary_assault_ability:drogon-born-in-flames-ii`
- Iconic item: No supported connected item shown
- Primary substitute: Sunfyre (`sqlite-champion-56`) — Preserves BIRTHRIGHT and STAMINA, the main verified function supplied by Gwayne Hightower. Projected team score 170.8.
- Important conflict: None identified by the target rules.

#### Meryn Trant (`sqlite-champion-49`)

- Role: Support / Tempo control
- Individual strategic-fit score: 15.4
- Verified scoring contributions: Stamina support +8 from `champion_trait:105`; inference rule `drogon-stamina` / `legendary_assault_tip:drogon-fast-champions` | Fast opening +6 from `champion_trait:105`; inference rule `drogon-fast-start` / `legendary_assault_tip:drogon-fast-champions` | Physical damage +4 from `ability:sqlite-champion_skills-48`; inference rule `drogon-physical` / `legendary_assault_ability:drogon-born-in-flames-ii` | Treasury effects -3 from `ability:sqlite-champion_skills-48`; inference rule `drogon-treasury` / `legendary_assault_ability:drogon-ember-storm-ii`
- Iconic item: No supported connected item shown
- Primary substitute: Cersei Lannister (`sqlite-champion-70`) — Preserves FAST START and PHYSICAL DAMAGE and STAMINA, the main verified function supplied by Meryn Trant. Projected team score 192.4.
- Important conflict: -3: Ember Storm II can reduce the player Treasury, making Treasury plans less reliable.

#### Alicent Hightower (`sqlite-champion-58`)

- Role: Buff enabler / Support
- Individual strategic-fit score: 43.5
- Verified scoring contributions: BIRTHRIGHT +22 from `ability:sqlite-iconic_abilities-26`; inference rule `drogon-birthright` / `legendary_assault_tip:drogon-birthright` | Stamina support +8 from `champion_trait:123`; inference rule `drogon-stamina` / `legendary_assault_tip:drogon-fast-champions` | Fast opening +6 from `champion_trait:123`; inference rule `drogon-fast-start` / `legendary_assault_tip:drogon-fast-champions` | Physical damage +4 from `ability:sqlite-champion_skills-57`; inference rule `drogon-physical` / `legendary_assault_ability:drogon-born-in-flames-ii`
- Iconic item: CatsPaw Dagger
- Primary substitute: Sunfyre (`sqlite-champion-56`) — Preserves BIRTHRIGHT and FAST START and STAMINA, the main verified function supplied by Alicent Hightower. Projected team score 164.1.
- Important conflict: None identified by the target rules.

#### Otto Hightower (`sqlite-champion-76`)

- Role: Buff enabler / Support
- Individual strategic-fit score: 42.5
- Verified scoring contributions: BIRTHRIGHT +22 from `ability:sqlite-champion_skills-74`; inference rule `drogon-birthright` / `legendary_assault_tip:drogon-birthright` | Stamina support +8 from `champion_trait:164`; inference rule `drogon-stamina` / `legendary_assault_tip:drogon-fast-champions` | Fast opening +6 from `champion_trait:164`; inference rule `drogon-fast-start` / `legendary_assault_tip:drogon-fast-champions` | Physical damage +4 from `ability:sqlite-champion_skills-74`; inference rule `drogon-physical` / `legendary_assault_ability:drogon-born-in-flames-ii`
- Iconic item: No supported connected item shown
- Primary substitute: Sunfyre (`sqlite-champion-56`) — Preserves BIRTHRIGHT and FAST START and STAMINA, the main verified function supplied by Otto Hightower. Projected team score 169.1.
- Important conflict: None identified by the target rules.

### Team composition effects

- +4: The team includes verified DEF, Durability, Resistance, or BLOCK support. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified healing for sustained battles. [strategy_inference; `derived:verified-mechanic-combination`]
- +2: The team includes at least one source-backed Leader effect. [strategy_inference; `derived:verified-mechanic-combination`]
- +3: The team includes a verified TAUNT option for pressure control. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Healing helps a TAUNT protector keep absorbing pressure. [strategy_inference; `derived:verified-mechanic-combination`]
- +2: Multiple Treasury effects can share coin generation and spending opportunities. [strategy_inference; `derived:verified-mechanic-combination`]
- 0: Tywin Lannister and Meryn Trant appeared together in 1 observed composition; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-2740`]
- 0: Tywin Lannister and Alicent Hightower appeared together in 1 observed composition; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-2742`]
- 0: Alicent Hightower and Otto Hightower appeared together in 1 observed composition; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-2764`]

### Battle plan

- Overall strategy: Bring BIRTHRIGHT and fast Skill access, keep using Skills, and rely on damage Drogon does not ignore.
- Timing and sequence: Use at least one Skill each turn when possible. Avoid making Power-Up destruction and shields the center of the plan.
- Major dangers: Drogon is immune to FIRE and destroys shields; his attacks can also reduce the Treasury. | Tywin Lannister: Ember Storm II can reduce the player Treasury, making Treasury plans less reliable. | Meryn Trant: Ember Storm II can reduce the player Treasury, making Treasury plans less reliable.

### Evidence and limits

- Verified fact links used: 10
- Strategy inferences shown: 22
- Community observations shown: 3; score contribution is always zero.
- Warning: Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- Warning: 22 exact variants with unverified current availability were considered and excluded from primary recommendations.
- Warning: Some selected profiles have incomplete non-strategy metadata: Tywin Lannister, Gwayne Hightower, Meryn Trant, Otto Hightower.

## Icy Viserion

**Target:** `legendary-assault:icy-viserion`  
**Status:** insufficient_evidence  
**Confidence:** insufficient

No team was generated. The encounter is represented, but its ability cards and verified battle rules are unavailable.

### Missing-data warnings

- Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- The encounter is represented, but its ability cards and verified battle rules are unavailable.

## Rhaegal

**Target:** `legendary-assault:rhaegal`  
**Status:** ready  
**Confidence:** medium-high

**Leader:** Daenerys Targaryen - Mother Of Dragons  
**Overall team score:** 282.6

### Exact five and role-preserving substitutes

#### Daenerys Targaryen - Mother Of Dragons (`sqlite-champion-11`)

- Role: Status setup / Damage dealer
- Individual strategic-fit score: 40.1
- Verified scoring contributions: Apply FIRE +19 from `champion_trait:22`; inference rule `rhaegal-apply-fire` / `legendary_assault_tip:rhaegal-fire` | Fire damage +10 from `ability:sqlite-iconic_abilities-8`; inference rule `rhaegal-fire-damage` / `legendary_assault_tip:rhaegal-fire` | Defense and durability +8 from `champion_trait:22`; inference rule `rhaegal-defense` / `legendary_assault_ability:rhaegal-wrathful-gaze` | Targaryen +7 from `faction_membership:sqlite-faction-54617267617279656e:sqlite-champion-11`; inference rule `rhaegal-targaryen` / `legendary_assault_ability:rhaegal-fuel-to-the-flames` | FURY -8 from `ability:sqlite-iconic_abilities-8`; inference rule `rhaegal-fury` / `legendary_assault_ability:rhaegal-opening-salvo`
- Iconic item: Chain Of Dragons
- Primary substitute: Melisandre (`sqlite-champion-42`) — Preserves APPLY FIRE and DEFENSE and FIRE DAMAGE, the main verified function supplied by Daenerys Targaryen - Mother Of Dragons. Projected team score 277.8.
- Important conflict: -8: Rhaegal consumes FURY and replaces it with GRUDGE.

#### Rhaenyra Targaryen - The King's Chosen Heir (`sqlite-champion-18`)

- Role: Status setup / Support
- Individual strategic-fit score: 61.1
- Verified scoring contributions: Apply FIRE +19 from `ability:sqlite-champion_skills-15`; inference rule `rhaegal-apply-fire` / `legendary_assault_tip:rhaegal-fire` | Healing +15 from `champion_trait:38`; inference rule `rhaegal-healing` / `legendary_assault_tip:rhaegal-taunt` | Fire damage +10 from `ability:sqlite-champion_skills-15`; inference rule `rhaegal-fire-damage` / `legendary_assault_tip:rhaegal-fire` | Defense and durability +8 from `ability:sqlite-iconic_abilities-11`; inference rule `rhaegal-defense` / `legendary_assault_ability:rhaegal-wrathful-gaze` | Targaryen +7 from `faction_membership:sqlite-faction-54617267617279656e:sqlite-champion-18`; inference rule `rhaegal-targaryen` / `legendary_assault_ability:rhaegal-fuel-to-the-flames`
- Iconic item: Valyrian Steel Necklace
- Primary substitute: Melisandre (`sqlite-champion-42`) — Preserves APPLY FIRE and DEFENSE and FIRE DAMAGE, the main verified function supplied by Rhaenyra Targaryen - The King's Chosen Heir. Projected team score 258.3.
- Important conflict: None identified by the target rules.

#### Roose Bolton (`sqlite-champion-64`)

- Role: Status setup / Status payoff
- Individual strategic-fit score: 34.1
- Verified scoring contributions: Apply BLEED +24 from `ability:audit-champion-skill-roose-bolton`; inference rule `rhaegal-bleed` / `legendary_assault_tip:rhaegal-bleed` | BLEED payoff +7 from `ability:audit-champion-skill-roose-bolton`; inference rule `rhaegal-bleed-payoff` / `legendary_assault_tip:rhaegal-bleed`
- Iconic item: No supported connected item shown
- Primary substitute: Osha (`sqlite-champion-63`) — Preserves APPLY BLEED and BLEED PAYOFF, the main verified function supplied by Roose Bolton. Projected team score 274.1.
- Important conflict: None identified by the target rules.

#### Walder Frey (`sqlite-champion-85`)

- Role: Status setup / Support
- Individual strategic-fit score: 49.8
- Verified scoring contributions: Apply BLEED +24 from `champion_trait:183`; inference rule `rhaegal-bleed` / `legendary_assault_tip:rhaegal-bleed` | Healing +15 from `ability:sqlite-champion_skills-83`; inference rule `rhaegal-healing` / `legendary_assault_tip:rhaegal-taunt` | BLEED payoff +7 from `champion_trait:183`; inference rule `rhaegal-bleed-payoff` / `legendary_assault_tip:rhaegal-bleed`
- Iconic item: Red Wedding Chalice
- Primary substitute: Osha (`sqlite-champion-63`) — Preserves APPLY BLEED and BLEED PAYOFF, the main verified function supplied by Walder Frey. Projected team score 270.5.
- Important conflict: None identified by the target rules.

#### Rhaenyra Targaryen (`sqlite-champion-9`)

- Role: Status setup / Support
- Individual strategic-fit score: 43
- Verified scoring contributions: Apply FIRE +19 from `ability:sqlite-champion_skills-6`; inference rule `rhaegal-apply-fire` / `legendary_assault_tip:rhaegal-fire` | Healing +15 from `champion_trait:17`; inference rule `rhaegal-healing` / `legendary_assault_tip:rhaegal-taunt` | Fire damage +10 from `ability:sqlite-champion_skills-6`; inference rule `rhaegal-fire-damage` / `legendary_assault_tip:rhaegal-fire` | Targaryen +7 from `faction_membership:sqlite-faction-54617267617279656e:sqlite-champion-9`; inference rule `rhaegal-targaryen` / `legendary_assault_ability:rhaegal-fuel-to-the-flames` | FURY -8 from `champion_trait:17`; inference rule `rhaegal-fury` / `legendary_assault_ability:rhaegal-opening-salvo`
- Iconic item: Old King's Crown
- Primary substitute: Alicent Hightower (Queen Dowager) (`sqlite-champion-78`) — Preserves APPLY FIRE and HEALING, the main verified function supplied by Rhaenyra Targaryen. Projected team score 274.4.
- Important conflict: -8: Rhaegal consumes FURY and replaces it with GRUDGE.

### Team composition effects

- +3: The team can remove verified debuffs from allies. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified DEF, Durability, Resistance, or BLOCK support. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified healing for sustained battles. [strategy_inference; `derived:verified-mechanic-combination`]
- +2: The team includes at least one source-backed Leader effect. [strategy_inference; `derived:verified-mechanic-combination`]
- +3: The team includes a verified TAUNT option for pressure control. [strategy_inference; `derived:verified-mechanic-combination`]
- +6: BLEED setup enables a teammate's BLEED payoff. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: Cleanse protects a TAUNT champion from disabling debuffs. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: FIRE setup enables a teammate's FIRE payoff. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Healing helps a TAUNT protector keep absorbing pressure. [strategy_inference; `derived:verified-mechanic-combination`]
- +2: 3 Targaryen members share a verified current faction context. [strategy_inference; `faction:Targaryen`]
- 0: Walder Frey and Rhaenyra Targaryen appeared together in 1 observed composition; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-2561`]

### Battle plan

- Overall strategy: Stack BLEED and FIRE while protecting and healing the champion Rhaegal forces to TAUNT.
- Timing and sequence: Apply BLEED before Rhaegal uses his Skill and keep FIRE active. Do not reinforce into his 100% HP Pool retaliation.
- Major dangers: Rhaegal consumes BIRTHRIGHT, FURY, shields, ICE, and BRITTLE; he cannot be STUNNED, PACIFIED, or DECEIVED. | Daenerys Targaryen - Mother Of Dragons: Rhaegal consumes FURY and replaces it with GRUDGE. | Rhaenyra Targaryen: Rhaegal consumes FURY and replaces it with GRUDGE.

### Evidence and limits

- Verified fact links used: 9
- Strategy inferences shown: 26
- Community observations shown: 1; score contribution is always zero.
- Warning: Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- Warning: 22 exact variants with unverified current availability were considered and excluded from primary recommendations.
- Warning: Some selected profiles have incomplete non-strategy metadata: Roose Bolton, Walder Frey.

## Viserion

**Target:** `legendary-assault:viserion`  
**Status:** ready  
**Confidence:** medium-high

**Leader:** Ned Stark  
**Overall team score:** 311.4

### Exact five and role-preserving substitutes

#### Ned Stark (`sqlite-champion-2`)

- Role: Status setup / Status payoff
- Individual strategic-fit score: 44.1
- Verified scoring contributions: Apply ICE +19 from `ability:sqlite-champion_skills-36`; inference rule `viserion-ice` / `legendary_assault_ability:viserion-patience-ii` | BRITTLE payoff +18 from `champion_trait:80`; inference rule `viserion-brittle` / `legendary_assault_tip:viserion-brittle` | Physical damage +4 from `ability:sqlite-champion_skills-36`; inference rule `viserion-physical` / `legendary_assault_ability:viserion-unchained-dragon`
- Iconic item: Ice
- Primary substitute: Brienne of Tarth - True Knight (`sqlite-champion-51`) — Preserves BRITTLE PAYOFF and APPLY ICE and PHYSICAL DAMAGE, the main verified function supplied by Ned Stark. Projected team score 291.8.
- Important conflict: None identified by the target rules.

#### Arya Stark - Winterfell Returned (`sqlite-champion-24`)

- Role: Status setup / Status payoff
- Individual strategic-fit score: 41.8
- Verified scoring contributions: Apply ICE +19 from `champion_trait:52`; inference rule `viserion-ice` / `legendary_assault_ability:viserion-patience-ii` | BRITTLE payoff +18 from `ability:sqlite-iconic_abilities-14`; inference rule `viserion-brittle` / `legendary_assault_tip:viserion-brittle` | Physical damage +4 from `champion_trait:52`; inference rule `viserion-physical` / `legendary_assault_ability:viserion-unchained-dragon`
- Iconic item: Needle
- Primary substitute: Brienne of Tarth - True Knight (`sqlite-champion-51`) — Preserves BRITTLE PAYOFF and APPLY ICE and PHYSICAL DAMAGE, the main verified function supplied by Arya Stark - Winterfell Returned. Projected team score 309.6.
- Important conflict: None identified by the target rules.

#### Rickard Karstark (`sqlite-champion-38`)

- Role: Status setup / Status payoff
- Individual strategic-fit score: 41.8
- Verified scoring contributions: Apply ICE +19 from `ability:sqlite-champion_skills-37`; inference rule `viserion-ice` / `legendary_assault_ability:viserion-patience-ii` | BRITTLE payoff +18 from `ability:sqlite-champion_skills-37`; inference rule `viserion-brittle` / `legendary_assault_tip:viserion-brittle` | Physical damage +4 from `ability:sqlite-champion_skills-37`; inference rule `viserion-physical` / `legendary_assault_ability:viserion-unchained-dragon`
- Iconic item: No supported connected item shown
- Primary substitute: Brienne of Tarth - True Knight (`sqlite-champion-51`) — Preserves BRITTLE PAYOFF and APPLY ICE and PHYSICAL DAMAGE, the main verified function supplied by Rickard Karstark. Projected team score 310.6.
- Important conflict: None identified by the target rules.

#### Tormund Giantsbane (`sqlite-champion-61`)

- Role: Status setup / Status payoff
- Individual strategic-fit score: 66.3
- Verified scoring contributions: Apply RAID +24 from `ability:sqlite-iconic_abilities-28`; inference rule `viserion-raid` / `legendary_assault_tip:viserion-raid` | Apply ICE +19 from `ability:sqlite-iconic_abilities-28`; inference rule `viserion-ice` / `legendary_assault_ability:viserion-patience-ii` | BRITTLE payoff +18 from `ability:sqlite-iconic_abilities-28`; inference rule `viserion-brittle` / `legendary_assault_tip:viserion-brittle` | RAID payoff +9 from `ability:sqlite-iconic_abilities-28`; inference rule `viserion-raid-payoff` / `legendary_assault_tip:viserion-raid` | Physical damage +4 from `ability:sqlite-champion_skills-60`; inference rule `viserion-physical` / `legendary_assault_ability:viserion-unchained-dragon` | Shields -9 from `champion_trait:129`; inference rule `viserion-shield` / `legendary_assault_ability:viserion-rude-awakening-ii`
- Iconic item: Hardhome Blade
- Primary substitute: Brienne of Tarth - True Knight (`sqlite-champion-51`) — Preserves BRITTLE PAYOFF and APPLY ICE and PHYSICAL DAMAGE, the main verified function supplied by Tormund Giantsbane. Projected team score 280.1.
- Important conflict: -9: Viserion destroys all shields whenever he wakes.

#### Lyanna Mormont (`sqlite-champion-86`)

- Role: Status setup / Status payoff
- Individual strategic-fit score: 74
- Verified scoring contributions: Apply RAID +24 from `ability:sqlite-champion_skills-84`; inference rule `viserion-raid` / `legendary_assault_tip:viserion-raid` | Apply ICE +19 from `ability:sqlite-champion_skills-84`; inference rule `viserion-ice` / `legendary_assault_ability:viserion-patience-ii` | BRITTLE payoff +18 from `champion_trait:185`; inference rule `viserion-brittle` / `legendary_assault_tip:viserion-brittle` | RAID payoff +9 from `ability:sqlite-champion_skills-84`; inference rule `viserion-raid-payoff` / `legendary_assault_tip:viserion-raid` | Physical damage +4 from `ability:sqlite-champion_skills-84`; inference rule `viserion-physical` / `legendary_assault_ability:viserion-unchained-dragon`
- Iconic item: No supported connected item shown
- Primary substitute: Ghost (`sqlite-champion-52`) — Preserves BRITTLE PAYOFF and APPLY ICE and PHYSICAL DAMAGE, the main verified function supplied by Lyanna Mormont. Projected team score 272.4.
- Important conflict: None identified by the target rules.

### Team composition effects

- +4: The team includes verified DEF, Durability, Resistance, or BLOCK support. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified healing for sustained battles. [strategy_inference; `derived:verified-mechanic-combination`]
- +2: The team includes at least one source-backed Leader effect. [strategy_inference; `derived:verified-mechanic-combination`]
- +3: The team includes a verified TAUNT option for pressure control. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Healing helps a TAUNT protector keep absorbing pressure. [strategy_inference; `derived:verified-mechanic-combination`]
- +6: ICE setup enables a teammate's BRITTLE payoff. [strategy_inference; `derived:verified-mechanic-combination`]
- +6: RAID setup enables a teammate's RAID payoff. [strategy_inference; `derived:verified-mechanic-combination`]
- +1: 2 Stark members share a verified current faction context. [strategy_inference; `faction:Stark`]
- 0: Ned Stark and Arya Stark - Winterfell Returned appeared together in 1 observed composition; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-2765`]

### Battle plan

- Overall strategy: Use RAID to strip defense and ICE to deal true damage, then attack sleeping Viserion only after he is BRITTLE.
- Timing and sequence: Build BRITTLE before striking through sleep. Stop attacking during PACIFY and avoid reinforcements that accelerate Patience.
- Major dangers: Viserion is immune to FIRE and POISON, destroys shields on waking, and punishes REINFORCE, STUN, and DECEIVE. | Tormund Giantsbane: Viserion destroys all shields whenever he wakes.

### Evidence and limits

- Verified fact links used: 8
- Strategy inferences shown: 24
- Community observations shown: 1; score contribution is always zero.
- Warning: Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- Warning: 22 exact variants with unverified current availability were considered and excluded from primary recommendations.
- Warning: Some selected profiles have incomplete non-strategy metadata: Rickard Karstark, Lyanna Mormont.

## Raid attack

**Target:** `raid:attack`  
**Status:** ready  
**Confidence:** medium

**Leader:** Gwayne Hightower  
**Overall team score:** 177.3

### Exact five and role-preserving substitutes

#### Icy Viserion (`sqlite-champion-35`)

- Role: Control / Damage dealer
- Individual strategic-fit score: 20
- Verified scoring contributions: Buff removal +7 from `champion_trait:74`; inference rule `raid-attack-remove` / `raid_mode_rules:matchmaking` | Unnatural damage +7 from `champion_trait:73`; inference rule `raid-attack-unnatural` / `raid_mode_rules:matchmaking` | Stamina support +6 from `champion_trait:74`; inference rule `raid-attack-stamina` / `raid_mode_rules:strategy`
- Iconic item: No supported connected item shown
- Primary substitute: Margaery Tyrell (`sqlite-champion-34`) — Preserves BUFF REMOVAL and STAMINA and UNNATURAL DAMAGE, the main verified function supplied by Icy Viserion. Projected team score 165.
- Important conflict: None identified by the target rules.

#### Gwayne Hightower (`sqlite-champion-43`)

- Role: Damage dealer / Support
- Individual strategic-fit score: 28.9
- Verified scoring contributions: True damage +9 from `ability:sqlite-champion_skills-42`; inference rule `raid-attack-true` / `raid_mode_rules:matchmaking` | Physical damage +8 from `ability:sqlite-champion_skills-42`; inference rule `raid-attack-physical` / `raid_mode_rules:matchmaking` | Stamina support +6 from `champion_trait:92`; inference rule `raid-attack-stamina` / `raid_mode_rules:strategy` | Healing +3 from `champion_trait:92`; inference rule `raid-attack-heal` / `raid_mode_rules:rewards`
- Iconic item: No supported connected item shown
- Primary substitute: Daemon Targaryen (`sqlite-champion-1`) — Preserves HEALING and PHYSICAL DAMAGE and TRUE DAMAGE, the main verified function supplied by Gwayne Hightower. Projected team score 169.1.
- Important conflict: None identified by the target rules.

#### Meryn Trant (`sqlite-champion-49`)

- Role: Damage dealer / Control
- Individual strategic-fit score: 27.5
- Verified scoring contributions: Physical damage +8 from `ability:sqlite-champion_skills-48`; inference rule `raid-attack-physical` / `raid_mode_rules:matchmaking` | STUN +6 from `champion_trait:105`; inference rule `raid-attack-control` / `raid_mode_rules:strategy` | Fast opening +6 from `champion_trait:105`; inference rule `raid-attack-fast` / `raid_mode_rules:matchmaking` | Stamina support +6 from `champion_trait:105`; inference rule `raid-attack-stamina` / `raid_mode_rules:strategy`
- Iconic item: No supported connected item shown
- Primary substitute: Cersei Lannister (`sqlite-champion-70`) — Preserves STUN and FAST START and PHYSICAL DAMAGE and STAMINA, the main verified function supplied by Meryn Trant. Projected team score 165.3.
- Important conflict: None identified by the target rules.

#### Rhaenys Targaryen (`sqlite-champion-8`)

- Role: Damage dealer / Control
- Individual strategic-fit score: 27.8
- Verified scoring contributions: Physical damage +8 from `ability:sqlite-champion_skills-5`; inference rule `raid-attack-physical` / `raid_mode_rules:matchmaking` | Buff removal +7 from `ability:sqlite-champion_skills-5`; inference rule `raid-attack-remove` / `raid_mode_rules:matchmaking` | STUN +6 from `ability:sqlite-champion_skills-5`; inference rule `raid-attack-control` / `raid_mode_rules:strategy` | Stamina support +6 from `ability:sqlite-iconic_abilities-5`; inference rule `raid-attack-stamina` / `raid_mode_rules:strategy`
- Iconic item: Red Queen's Battle Crown
- Primary substitute: Adolescent Viserion (`sqlite-champion-26`) — Preserves PHYSICAL DAMAGE and BUFF REMOVAL and STAMINA, the main verified function supplied by Rhaenys Targaryen. Projected team score 162.5.
- Important conflict: None identified by the target rules.

#### Lyanna Mormont (`sqlite-champion-86`)

- Role: Damage dealer / Support
- Individual strategic-fit score: 19.6
- Verified scoring contributions: Physical damage +8 from `ability:sqlite-champion_skills-84`; inference rule `raid-attack-physical` / `raid_mode_rules:matchmaking` | Stamina support +6 from `champion_trait:185`; inference rule `raid-attack-stamina` / `raid_mode_rules:strategy` | Healing +3 from `champion_trait:185`; inference rule `raid-attack-heal` / `raid_mode_rules:rewards`
- Iconic item: No supported connected item shown
- Primary substitute: Alicent Hightower (`sqlite-champion-58`) — Preserves HEALING and PHYSICAL DAMAGE and STAMINA, the main verified function supplied by Lyanna Mormont. Projected team score 169.8.
- Important conflict: None identified by the target rules.

### Team composition effects

- +3: The team can remove verified debuffs from allies. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified DEF, Durability, Resistance, or BLOCK support. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified healing for sustained battles. [strategy_inference; `derived:verified-mechanic-combination`]
- +2: The team includes at least one source-backed Leader effect. [strategy_inference; `derived:verified-mechanic-combination`]
- +3: The team includes a verified TAUNT option for pressure control. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: Cleanse protects a TAUNT champion from disabling debuffs. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: FIRE setup enables a teammate's FIRE payoff. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Healing helps a TAUNT protector keep absorbing pressure. [strategy_inference; `derived:verified-mechanic-combination`]
- +6: ICE setup enables a teammate's BRITTLE payoff. [strategy_inference; `derived:verified-mechanic-combination`]
- +6: RAID setup enables a teammate's RAID payoff. [strategy_inference; `derived:verified-mechanic-combination`]

### Battle plan

- Overall strategy: Prioritize fast pressure, control, buff removal, and enough sustain to finish the selected defense.
- Timing and sequence: Use the opening turns to disable the highest-impact defender and preserve Stamina for coordinated Skills.
- Major dangers: Opponent power, stars, gear, and exact defensive lineup are outside this recommendation.

### Evidence and limits

- Verified fact links used: 9
- Strategy inferences shown: 25
- Community observations shown: 0; score contribution is always zero.
- Warning: Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- Warning: 22 exact variants with unverified current availability were considered and excluded from primary recommendations.
- Warning: Some selected profiles have incomplete non-strategy metadata: Icy Viserion, Gwayne Hightower, Meryn Trant, Rhaenys Targaryen, Lyanna Mormont.

## Raid defense

**Target:** `raid:defense`  
**Status:** ready  
**Confidence:** medium

**Leader:** Ser Duncan the Tall  
**Overall team score:** 224.5

### Exact five and role-preserving substitutes

#### Sandor Clegane (`sqlite-champion-10`)

- Role: Support / Protector
- Individual strategic-fit score: 37
- Verified scoring contributions: Healing +10 from `champion_trait:19`; inference rule `raid-defense-heal` / `raid_mode_rules:matchmaking` | Defense and durability +9 from `ability:sqlite-iconic_abilities-7`; inference rule `raid-defense-defense` / `raid_mode_rules:matchmaking` | Shields +9 from `ability:sqlite-champion_skills-7`; inference rule `raid-defense-shield` / `raid_mode_rules:matchmaking` | DECEIVE +7 from `ability:sqlite-champion_skills-7`; inference rule `raid-defense-deceive` / `raid_mode_rules:strategy`
- Iconic item: White Cloak
- Primary substitute: Ned Stark (`sqlite-champion-2`) — Preserves DEFENSE and HEALING, the main verified function supplied by Sandor Clegane. Projected team score 217.4.
- Important conflict: None identified by the target rules.

#### Ser Duncan the Tall (`sqlite-champion-14`)

- Role: Protector / Support
- Individual strategic-fit score: 32.3
- Verified scoring contributions: Defense and durability +9 from `champion_trait:29`; inference rule `raid-defense-defense` / `raid_mode_rules:matchmaking` | Shields +9 from `ability:sqlite-champion_skills-11`; inference rule `raid-defense-shield` / `raid_mode_rules:matchmaking` | Taunt +9 from `ability:sqlite-champion_skills-11`; inference rule `raid-defense-taunt` / `raid_mode_rules:matchmaking`
- Iconic item: No supported connected item shown
- Primary substitute: Ned Stark (`sqlite-champion-2`) — Preserves DEFENSE and TAUNT, the main verified function supplied by Ser Duncan the Tall. Projected team score 212.1.
- Important conflict: None identified by the target rules.

#### Samwell Tarly (`sqlite-champion-39`)

- Role: Support / Protector
- Individual strategic-fit score: 29.9
- Verified scoring contributions: Healing +10 from `champion_trait:84`; inference rule `raid-defense-heal` / `raid_mode_rules:matchmaking` | Defense and durability +9 from `ability:sqlite-iconic_abilities-20`; inference rule `raid-defense-defense` / `raid_mode_rules:matchmaking` | Shields +9 from `ability:sqlite-iconic_abilities-20`; inference rule `raid-defense-shield` / `raid_mode_rules:matchmaking`
- Iconic item: Dragonglass Dagger
- Primary substitute: Ned Stark (`sqlite-champion-2`) — Preserves DEFENSE and HEALING, the main verified function supplied by Samwell Tarly. Projected team score 217.5.
- Important conflict: None identified by the target rules.

#### Meryn Trant (`sqlite-champion-49`)

- Role: Protector / Tempo control
- Individual strategic-fit score: 42.6
- Verified scoring contributions: Defense and durability +9 from `ability:sqlite-champion_skills-48`; inference rule `raid-defense-defense` / `raid_mode_rules:matchmaking` | Fast opening +9 from `champion_trait:105`; inference rule `raid-defense-fast` / `raid_mode_rules:matchmaking` | Taunt +9 from `ability:sqlite-champion_skills-48`; inference rule `raid-defense-taunt` / `raid_mode_rules:matchmaking` | DECEIVE +7 from `champion_trait:105`; inference rule `raid-defense-deceive` / `raid_mode_rules:strategy` | STUN +7 from `champion_trait:105`; inference rule `raid-defense-stun` / `raid_mode_rules:strategy`
- Iconic item: No supported connected item shown
- Primary substitute: Adolescent Rhaegal (`sqlite-champion-33`) — Preserves DECEIVE and FAST START and STUN, the main verified function supplied by Meryn Trant. Projected team score 211.9.
- Important conflict: None identified by the target rules.

#### Cersei Lannister (`sqlite-champion-70`)

- Role: Protector / Tempo control
- Individual strategic-fit score: 34.8
- Verified scoring contributions: Defense and durability +9 from `champion_trait:148`; inference rule `raid-defense-defense` / `raid_mode_rules:matchmaking` | Fast opening +9 from `champion_trait:148`; inference rule `raid-defense-fast` / `raid_mode_rules:matchmaking` | DECEIVE +7 from `ability:sqlite-champion_skills-68`; inference rule `raid-defense-deceive` / `raid_mode_rules:strategy` | STUN +7 from `ability:sqlite-champion_skills-68`; inference rule `raid-defense-stun` / `raid_mode_rules:strategy`
- Iconic item: No supported connected item shown
- Primary substitute: Adolescent Rhaegal (`sqlite-champion-33`) — Preserves DECEIVE and FAST START and STUN, the main verified function supplied by Cersei Lannister. Projected team score 219.8.
- Important conflict: None identified by the target rules.

### Team composition effects

- +3: The team can remove verified debuffs from allies. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified DEF, Durability, Resistance, or BLOCK support. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified healing for sustained battles. [strategy_inference; `derived:verified-mechanic-combination`]
- +2: The team includes at least one source-backed Leader effect. [strategy_inference; `derived:verified-mechanic-combination`]
- +3: The team includes a verified TAUNT option for pressure control. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: Cleanse protects a TAUNT champion from disabling debuffs. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Healing helps a TAUNT protector keep absorbing pressure. [strategy_inference; `derived:verified-mechanic-combination`]
- +2: Multiple Treasury effects can share coin generation and spending opportunities. [strategy_inference; `derived:verified-mechanic-combination`]
- 0: Sandor Clegane and Ser Duncan the Tall appeared together in 1 observed composition; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-1834`]
- 0: Sandor Clegane and Meryn Trant appeared together in 1 observed composition; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-2740`]
- 0: Meryn Trant and Cersei Lannister appeared together in 2 observed compositions; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-1882,drive-observed-2745`]

### Battle plan

- Overall strategy: Prioritize durable leaders, healing, shields, TAUNT, revive, and opening control that works without manual targeting.
- Timing and sequence: Favor effects that trigger at battle start, on damage, or on ally defeat because another player controls the attack.
- Major dangers: Observed teams are composition examples and do not prove defensive wins.

### Evidence and limits

- Verified fact links used: 11
- Strategy inferences shown: 23
- Community observations shown: 3; score contribution is always zero.
- Warning: Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- Warning: 22 exact variants with unverified current availability were considered and excluded from primary recommendations.
- Warning: Some selected profiles have incomplete non-strategy metadata: Ser Duncan the Tall, Meryn Trant, Cersei Lannister.
- Warning: Cersei Lannister has partial source wording for Treasury Generator; only the visible verified mechanic was used.

## Ashen Waste

**Target:** `war:ashen-waste`  
**Status:** ready  
**Confidence:** medium

**Leader:** Grey Worm  
**Overall team score:** 178

### Exact five and role-preserving substitutes

#### Daenerys Targaryen - Mother Of Dragons (`sqlite-champion-11`)

- Role: Status payoff / Damage dealer
- Individual strategic-fit score: 26.8
- Verified scoring contributions: FIRE payoff +20 from `ability:sqlite-champion_skills-8`; inference rule `war-ashen-fire-payoff` / `war_outpost_rule:ashen-waste` | Fire damage +6 from `ability:sqlite-iconic_abilities-8`; inference rule `war-ashen-fire-damage` / `war_outpost_rule:ashen-waste`
- Iconic item: Chain Of Dragons
- Primary substitute: Stannis Baratheon — Lord of Storm's End (`sqlite-champion-16`) — Preserves FIRE DAMAGE and FIRE PAYOFF, the main verified function supplied by Daenerys Targaryen - Mother Of Dragons. Projected team score 177.
- Important conflict: None identified by the target rules.

#### Rhaenyra Targaryen - The King's Chosen Heir (`sqlite-champion-18`)

- Role: Status payoff / Damage dealer
- Individual strategic-fit score: 29.3
- Verified scoring contributions: FIRE payoff +20 from `ability:sqlite-iconic_abilities-11`; inference rule `war-ashen-fire-payoff` / `war_outpost_rule:ashen-waste` | Fire damage +6 from `ability:sqlite-champion_skills-15`; inference rule `war-ashen-fire-damage` / `war_outpost_rule:ashen-waste`
- Iconic item: Valyrian Steel Necklace
- Primary substitute: Stannis Baratheon — Lord of Storm's End (`sqlite-champion-16`) — Preserves FIRE DAMAGE and FIRE PAYOFF, the main verified function supplied by Rhaenyra Targaryen - The King's Chosen Heir. Projected team score 174.5.
- Important conflict: None identified by the target rules.

#### Meleys (`sqlite-champion-25`)

- Role: Status payoff / Damage dealer
- Individual strategic-fit score: 26
- Verified scoring contributions: FIRE payoff +20 from `champion_trait:53`; inference rule `war-ashen-fire-payoff` / `war_outpost_rule:ashen-waste` | Fire damage +6 from `ability:sqlite-champion_skills-21`; inference rule `war-ashen-fire-damage` / `war_outpost_rule:ashen-waste`
- Iconic item: No supported connected item shown
- Primary substitute: Stannis Baratheon — Lord of Storm's End (`sqlite-champion-16`) — Preserves FIRE DAMAGE and FIRE PAYOFF, the main verified function supplied by Meleys. Projected team score 177.8.
- Important conflict: None identified by the target rules.

#### Grey Worm (`sqlite-champion-44`)

- Role: Status payoff
- Individual strategic-fit score: 23.3
- Verified scoring contributions: FIRE payoff +20 from `ability:sqlite-champion_skills-43`; inference rule `war-ashen-fire-payoff` / `war_outpost_rule:ashen-waste`
- Iconic item: No supported connected item shown
- Primary substitute: Criston Cole — Personal Escort (`sqlite-champion-65`) — Preserves FIRE PAYOFF, the main verified function supplied by Grey Worm. Projected team score 175.5.
- Important conflict: None identified by the target rules.

#### Rhaenyra Targaryen (`sqlite-champion-9`)

- Role: Status payoff / Damage dealer
- Individual strategic-fit score: 26.8
- Verified scoring contributions: FIRE payoff +20 from `ability:sqlite-champion_skills-6`; inference rule `war-ashen-fire-payoff` / `war_outpost_rule:ashen-waste` | Fire damage +6 from `ability:sqlite-champion_skills-6`; inference rule `war-ashen-fire-damage` / `war_outpost_rule:ashen-waste`
- Iconic item: Old King's Crown
- Primary substitute: Stannis Baratheon — Lord of Storm's End (`sqlite-champion-16`) — Preserves FIRE DAMAGE and FIRE PAYOFF, the main verified function supplied by Rhaenyra Targaryen. Projected team score 177.
- Important conflict: None identified by the target rules.

### Team composition effects

- +3: The team can remove verified debuffs from allies. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified DEF, Durability, Resistance, or BLOCK support. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified healing for sustained battles. [strategy_inference; `derived:verified-mechanic-combination`]
- +2: The team includes at least one source-backed Leader effect. [strategy_inference; `derived:verified-mechanic-combination`]
- +3: The team includes a verified TAUNT option for pressure control. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: Cleanse protects a TAUNT champion from disabling debuffs. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: FIRE setup enables a teammate's FIRE payoff. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Healing helps a TAUNT protector keep absorbing pressure. [strategy_inference; `derived:verified-mechanic-combination`]
- +3: 4 Targaryen members share a verified current faction context. [strategy_inference; `faction:Targaryen`]
- 0: Grey Worm and Rhaenyra Targaryen appeared together in 1 observed composition; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-2737`]

### Battle plan

- Overall strategy: Use champions that profit from enemies beginning the battle with two FIRE.
- Timing and sequence: Trigger FIRE payoff effects early before the opening stacks expire or are removed.
- Major dangers: The opening FIRE is a battlefield rule; additional FIRE application still depends on champion abilities.

### Evidence and limits

- Verified fact links used: 8
- Strategy inferences shown: 18
- Community observations shown: 1; score contribution is always zero.
- Warning: Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- Warning: 22 exact variants with unverified current availability were considered and excluded from primary recommendations.
- Warning: Some selected profiles have incomplete non-strategy metadata: Meleys, Grey Worm.

## Baratheon War Camp

**Target:** `war:baratheon-war-camp`  
**Status:** ready  
**Confidence:** medium

**Leader:** Davos Seaworth  
**Overall team score:** 151.8

### Exact five and role-preserving substitutes

#### Sandor Clegane (`sqlite-champion-10`)

- Role: Faction specialist
- Individual strategic-fit score: 24.8
- Verified scoring contributions: Baratheon +24 from `faction_membership:sqlite-faction-426172617468656f6e:sqlite-champion-10`; inference rule `war-baratheon-faction` / `war_outpost_rule:baratheon-war-camp`
- Iconic item: White Cloak
- Primary substitute: Barristan Selmy (`sqlite-champion-77`) — Provides the closest deterministic team score when Sandor Clegane is unavailable, but no exact primary-mechanic match is verified. Projected team score 135.8.
- Important conflict: None identified by the target rules.

#### Stannis Baratheon — Lord of Storm's End (`sqlite-champion-16`)

- Role: Faction specialist
- Individual strategic-fit score: 24.8
- Verified scoring contributions: Baratheon +24 from `faction_membership:sqlite-faction-426172617468656f6e:sqlite-champion-16`; inference rule `war-baratheon-faction` / `war_outpost_rule:baratheon-war-camp`
- Iconic item: Blackwater Blade
- Primary substitute: Barristan Selmy (`sqlite-champion-77`) — Provides the closest deterministic team score when Stannis Baratheon — Lord of Storm's End is unavailable, but no exact primary-mechanic match is verified. Projected team score 138.8.
- Important conflict: None identified by the target rules.

#### Joffrey Baratheon (`sqlite-champion-22`)

- Role: Faction specialist
- Individual strategic-fit score: 24.8
- Verified scoring contributions: Baratheon +24 from `faction_membership:sqlite-faction-426172617468656f6e:sqlite-champion-22`; inference rule `war-baratheon-faction` / `war_outpost_rule:baratheon-war-camp`
- Iconic item: Widow's Wail
- Primary substitute: Beric Dondarrion (`sqlite-champion-59`) — Provides the closest deterministic team score when Joffrey Baratheon is unavailable, but no exact primary-mechanic match is verified. Projected team score 140.8.
- Important conflict: None identified by the target rules.

#### Gendry (`sqlite-champion-57`)

- Role: Faction specialist
- Individual strategic-fit score: 24.8
- Verified scoring contributions: Baratheon +24 from `faction_membership:sqlite-faction-426172617468656f6e:sqlite-champion-57`; inference rule `war-baratheon-faction` / `war_outpost_rule:baratheon-war-camp`
- Iconic item: No supported connected item shown
- Primary substitute: Beric Dondarrion (`sqlite-champion-59`) — Provides the closest deterministic team score when Gendry is unavailable, but no exact primary-mechanic match is verified. Projected team score 143.8.
- Important conflict: None identified by the target rules.

#### Davos Seaworth (`sqlite-champion-7`)

- Role: Faction specialist
- Individual strategic-fit score: 24.8
- Verified scoring contributions: Baratheon +24 from `faction_membership:sqlite-faction-426172617468656f6e:sqlite-champion-7`; inference rule `war-baratheon-faction` / `war_outpost_rule:baratheon-war-camp`
- Iconic item: Pouch Of Fingers
- Primary substitute: Beric Dondarrion (`sqlite-champion-59`) — Provides the closest deterministic team score when Davos Seaworth is unavailable, but no exact primary-mechanic match is verified. Projected team score 143.8.
- Important conflict: None identified by the target rules.

### Team composition effects

- +3: The team can remove verified debuffs from allies. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified DEF, Durability, Resistance, or BLOCK support. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified healing for sustained battles. [strategy_inference; `derived:verified-mechanic-combination`]
- +2: The team includes at least one source-backed Leader effect. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Shield creation enables shield-dependent damage or support. [strategy_inference; `derived:verified-mechanic-combination`]
- +2: Multiple Treasury effects can share coin generation and spending opportunities. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: 5 Baratheon members share a verified current faction context. [strategy_inference; `faction:Baratheon`]
- +1: 2 Lannister members share a verified current faction context. [strategy_inference; `faction:Lannister`]
- 0: Sandor Clegane and Joffrey Baratheon appeared together in 3 observed compositions; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-2643,drive-observed-2651,drive-observed-2740`]
- 0: Sandor Clegane and Davos Seaworth appeared together in 1 observed composition; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-2651`]
- 0: Joffrey Baratheon and Gendry appeared together in 1 observed composition; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-2646`]
- 0: Joffrey Baratheon and Davos Seaworth appeared together in 3 observed compositions; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-2651,drive-observed-2736,drive-observed-2744`]

### Battle plan

- Overall strategy: Use Baratheon champions to receive the verified +25% ATK battlefield bonus.
- Timing and sequence: Build around the bonus in the phases where the outpost applies.
- Major dangers: The modifier applies according to the recorded Phase 3 and Phase 4 rule.

### Evidence and limits

- Verified fact links used: 5
- Strategy inferences shown: 13
- Community observations shown: 4; score contribution is always zero.
- Warning: Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- Warning: 22 exact variants with unverified current availability were considered and excluded from primary recommendations.
- Warning: Some selected profiles have incomplete non-strategy metadata: Joffrey Baratheon, Gendry, Davos Seaworth.

## Barricade

**Target:** `war:barricade`  
**Status:** ready  
**Confidence:** medium

**Leader:** Daenerys Targaryen - Mother Of Dragons  
**Overall team score:** 101.5

### Exact five and role-preserving substitutes

#### Daenerys Targaryen - Mother Of Dragons (`sqlite-champion-11`)

- Role: Protector
- Individual strategic-fit score: 10.9
- Verified scoring contributions: Defense and durability +9 from `champion_trait:22`; inference rule `war-barricade-defense` / `war_outpost_rule:barricade`
- Iconic item: Chain Of Dragons
- Primary substitute: Melisandre (`sqlite-champion-42`) — Preserves DEFENSE, the main verified function supplied by Daenerys Targaryen - Mother Of Dragons. Projected team score 100.3.
- Important conflict: None identified by the target rules.

#### Ser Duncan the Tall (`sqlite-champion-14`)

- Role: Protector
- Individual strategic-fit score: 10.9
- Verified scoring contributions: Defense and durability +9 from `champion_trait:29`; inference rule `war-barricade-defense` / `war_outpost_rule:barricade`
- Iconic item: No supported connected item shown
- Primary substitute: Jorah Mormont (`sqlite-champion-46`) — Preserves DEFENSE, the main verified function supplied by Ser Duncan the Tall. Projected team score 101.5.
- Important conflict: None identified by the target rules.

#### Rhaenyra Targaryen - The King's Chosen Heir (`sqlite-champion-18`)

- Role: Protector
- Individual strategic-fit score: 9.8
- Verified scoring contributions: Defense and durability +9 from `ability:sqlite-iconic_abilities-11`; inference rule `war-barricade-defense` / `war_outpost_rule:barricade`
- Iconic item: Valyrian Steel Necklace
- Primary substitute: Melisandre (`sqlite-champion-42`) — Preserves DEFENSE, the main verified function supplied by Rhaenyra Targaryen - The King's Chosen Heir. Projected team score 101.4.
- Important conflict: None identified by the target rules.

#### Brienne of Tarth (`sqlite-champion-29`)

- Role: Protector
- Individual strategic-fit score: 9.8
- Verified scoring contributions: Defense and durability +9 from `ability:sqlite-iconic_abilities-15`; inference rule `war-barricade-defense` / `war_outpost_rule:barricade`
- Iconic item: Oathkeeper
- Primary substitute: Jorah Mormont (`sqlite-champion-46`) — Preserves DEFENSE, the main verified function supplied by Brienne of Tarth. Projected team score 97.6.
- Important conflict: None identified by the target rules.

#### Samwell Tarly (`sqlite-champion-39`)

- Role: Protector / Support
- Individual strategic-fit score: 16.8
- Verified scoring contributions: Defense and durability +9 from `ability:sqlite-iconic_abilities-20`; inference rule `war-barricade-defense` / `war_outpost_rule:barricade` | Debuff removal +7 from `ability:sqlite-iconic_abilities-20`; inference rule `war-barricade-cleanse` / `war_outpost_rule:barricade`
- Iconic item: Dragonglass Dagger
- Primary substitute: Melisandre (`sqlite-champion-42`) — Preserves DEFENSE, the main verified function supplied by Samwell Tarly. Projected team score 95.4.
- Important conflict: None identified by the target rules.

### Team composition effects

- +3: The team can remove verified debuffs from allies. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified DEF, Durability, Resistance, or BLOCK support. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified healing for sustained battles. [strategy_inference; `derived:verified-mechanic-combination`]
- +2: The team includes at least one source-backed Leader effect. [strategy_inference; `derived:verified-mechanic-combination`]
- +3: The team includes a verified TAUNT option for pressure control. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: Cleanse protects a TAUNT champion from disabling debuffs. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: FIRE setup enables a teammate's FIRE payoff. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Healing helps a TAUNT protector keep absorbing pressure. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Shield creation enables shield-dependent damage or support. [strategy_inference; `derived:verified-mechanic-combination`]
- +1: 2 Targaryen members share a verified current faction context. [strategy_inference; `faction:Targaryen`]

### Battle plan

- Overall strategy: Combine the +15% Tenacity rule with durable protection and cleansing.
- Timing and sequence: Preserve cleanses for debuffs that still land through the Tenacity bonus.
- Major dangers: Tenacity reduces risk; it does not guarantee immunity.

### Evidence and limits

- Verified fact links used: 5
- Strategy inferences shown: 16
- Community observations shown: 0; score contribution is always zero.
- Warning: Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- Warning: 22 exact variants with unverified current availability were considered and excluded from primary recommendations.
- Warning: Some selected profiles have incomplete non-strategy metadata: Ser Duncan the Tall.

## Crimson Bastion

**Target:** `war:crimson-bastion`  
**Status:** ready  
**Confidence:** medium

**Leader:** Daenerys Targaryen - Mother Of Dragons  
**Overall team score:** 182.5

### Exact five and role-preserving substitutes

#### Daenerys Targaryen - Mother Of Dragons (`sqlite-champion-11`)

- Role: Battlefield specialist / Protector
- Individual strategic-fit score: 30.4
- Verified scoring contributions: Red champion +24 from `champion_variant:sqlite-champion-11`; inference rule `war-crimson-red` / `war_outpost_rule:crimson-bastion` | Defense and durability +5 from `champion_trait:22`; inference rule `war-crimson-defense` / `war_outpost_rule:crimson-bastion`
- Iconic item: Chain Of Dragons
- Primary substitute: Meleys (`sqlite-champion-25`) — Preserves DEFENSE and COLOR RED, the main verified function supplied by Daenerys Targaryen - Mother Of Dragons. Projected team score 181.1.
- Important conflict: None identified by the target rules.

#### Melisandre (`sqlite-champion-42`)

- Role: Battlefield specialist / Protector
- Individual strategic-fit score: 29.8
- Verified scoring contributions: Red champion +24 from `champion_variant:sqlite-champion-42`; inference rule `war-crimson-red` / `war_outpost_rule:crimson-bastion` | Defense and durability +5 from `ability:sqlite-champion_skills-41`; inference rule `war-crimson-defense` / `war_outpost_rule:crimson-bastion`
- Iconic item: Red Woman's Ruby Necklace
- Primary substitute: Meleys (`sqlite-champion-25`) — Preserves DEFENSE and COLOR RED, the main verified function supplied by Melisandre. Projected team score 175.8.
- Important conflict: None identified by the target rules.

#### Meryn Trant (`sqlite-champion-49`)

- Role: Battlefield specialist / Protector
- Individual strategic-fit score: 29.8
- Verified scoring contributions: Red champion +24 from `champion_variant:sqlite-champion-49`; inference rule `war-crimson-red` / `war_outpost_rule:crimson-bastion` | Defense and durability +5 from `ability:sqlite-champion_skills-48`; inference rule `war-crimson-defense` / `war_outpost_rule:crimson-bastion`
- Iconic item: No supported connected item shown
- Primary substitute: Meleys (`sqlite-champion-25`) — Preserves DEFENSE and COLOR RED, the main verified function supplied by Meryn Trant. Projected team score 168.8.
- Important conflict: None identified by the target rules.

#### Craster (`sqlite-champion-62`)

- Role: Battlefield specialist
- Individual strategic-fit score: 24.8
- Verified scoring contributions: Red champion +24 from `champion_variant:sqlite-champion-62`; inference rule `war-crimson-red` / `war_outpost_rule:crimson-bastion`
- Iconic item: No supported connected item shown
- Primary substitute: Daemon Targaryen (`sqlite-champion-1`) — Preserves COLOR RED, the main verified function supplied by Craster. Projected team score 178.5.
- Important conflict: None identified by the target rules.

#### Tyrion Lannister - The Half Man (`sqlite-champion-74`)

- Role: Battlefield specialist
- Individual strategic-fit score: 25.4
- Verified scoring contributions: Red champion +24 from `champion_variant:sqlite-champion-74`; inference rule `war-crimson-red` / `war_outpost_rule:crimson-bastion`
- Iconic item: No supported connected item shown
- Primary substitute: Meleys (`sqlite-champion-25`) — Preserves COLOR RED, the main verified function supplied by Tyrion Lannister - The Half Man. Projected team score 180.1.
- Important conflict: None identified by the target rules.

### Team composition effects

- +3: The team can remove verified debuffs from allies. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified DEF, Durability, Resistance, or BLOCK support. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified healing for sustained battles. [strategy_inference; `derived:verified-mechanic-combination`]
- +2: The team includes at least one source-backed Leader effect. [strategy_inference; `derived:verified-mechanic-combination`]
- +3: The team includes a verified TAUNT option for pressure control. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: Cleanse protects a TAUNT champion from disabling debuffs. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: FIRE setup enables a teammate's FIRE payoff. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Healing helps a TAUNT protector keep absorbing pressure. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Shield creation enables shield-dependent damage or support. [strategy_inference; `derived:verified-mechanic-combination`]
- +2: Multiple Treasury effects can share coin generation and spending opportunities. [strategy_inference; `derived:verified-mechanic-combination`]

### Battle plan

- Overall strategy: Red champions gain the verified +25% DEF bonus, favoring durable red cores.
- Timing and sequence: Use the defensive bonus to survive enemy Skill cycles.
- Major dangers: The modifier applies according to the recorded phase rule.

### Evidence and limits

- Verified fact links used: 8
- Strategy inferences shown: 18
- Community observations shown: 0; score contribution is always zero.
- Warning: Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- Warning: 22 exact variants with unverified current availability were considered and excluded from primary recommendations.
- Warning: Some selected profiles have incomplete non-strategy metadata: Meryn Trant, Craster, Tyrion Lannister - The Half Man.

## Harpy's Pit

**Target:** `war:harpys-pit`  
**Status:** ready  
**Confidence:** medium

**Leader:** Meryn Trant  
**Overall team score:** 155.6

### Exact five and role-preserving substitutes

#### Margaery Tyrell (`sqlite-champion-34`)

- Role: Status payoff
- Individual strategic-fit score: 22.8
- Verified scoring contributions: WOUND payoff +22 from `ability:sqlite-iconic_abilities-17`; inference rule `war-harpy-wound-payoff` / `war_outpost_rule:harpys-pit`
- Iconic item: Rose Gold Pendant
- Primary substitute: Alicent Hightower (Queen Dowager) (`sqlite-champion-78`) — Provides the closest deterministic team score when Margaery Tyrell is unavailable, but no exact primary-mechanic match is verified. Projected team score 146.5.
- Important conflict: None identified by the target rules.

#### Euron Greyjoy (`sqlite-champion-36`)

- Role: Status payoff
- Individual strategic-fit score: 22.8
- Verified scoring contributions: WOUND payoff +22 from `ability:sqlite-iconic_abilities-18`; inference rule `war-harpy-wound-payoff` / `war_outpost_rule:harpys-pit`
- Iconic item: Massive Scorpion
- Primary substitute: Mance Rayder (`sqlite-champion-27`) — Provides the closest deterministic team score when Euron Greyjoy is unavailable, but no exact primary-mechanic match is verified. Projected team score 145.6.
- Important conflict: None identified by the target rules.

#### Meryn Trant (`sqlite-champion-49`)

- Role: Status payoff / Tempo control
- Individual strategic-fit score: 32.5
- Verified scoring contributions: WOUND payoff +22 from `champion_trait:105`; inference rule `war-harpy-wound-payoff` / `war_outpost_rule:harpys-pit` | Fast opening +7 from `champion_trait:105`; inference rule `war-harpy-fast` / `war_outpost_rule:harpys-pit`
- Iconic item: No supported connected item shown
- Primary substitute: Viserys Targaryen III (`sqlite-champion-41`) — Preserves FAST START, the main verified function supplied by Meryn Trant. Projected team score 120.4.
- Important conflict: None identified by the target rules.

#### Cersei Lannister (`sqlite-champion-70`)

- Role: Status payoff / Tempo control
- Individual strategic-fit score: 30.6
- Verified scoring contributions: WOUND payoff +22 from `ability:sqlite-champion_skills-68`; inference rule `war-harpy-wound-payoff` / `war_outpost_rule:harpys-pit` | Fast opening +7 from `champion_trait:148`; inference rule `war-harpy-fast` / `war_outpost_rule:harpys-pit`
- Iconic item: No supported connected item shown
- Primary substitute: Viserys Targaryen III (`sqlite-champion-41`) — Preserves FAST START, the main verified function supplied by Cersei Lannister. Projected team score 137.8.
- Important conflict: None identified by the target rules.

#### Seasmoke (`sqlite-champion-72`)

- Role: Tempo control
- Individual strategic-fit score: 7
- Verified scoring contributions: Fast opening +7 from `champion_trait:153`; inference rule `war-harpy-fast` / `war_outpost_rule:harpys-pit`
- Iconic item: No supported connected item shown
- Primary substitute: Jaime Lannister (`sqlite-champion-45`) — Preserves FAST START, the main verified function supplied by Seasmoke. Projected team score 151.3.
- Important conflict: None identified by the target rules.

### Team composition effects

- +4: The team includes verified DEF, Durability, Resistance, or BLOCK support. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified healing for sustained battles. [strategy_inference; `derived:verified-mechanic-combination`]
- +2: The team includes at least one source-backed Leader effect. [strategy_inference; `derived:verified-mechanic-combination`]
- +3: The team includes a verified TAUNT option for pressure control. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Healing helps a TAUNT protector keep absorbing pressure. [strategy_inference; `derived:verified-mechanic-combination`]
- +6: RAID setup enables a teammate's RAID payoff. [strategy_inference; `derived:verified-mechanic-combination`]
- +2: Multiple Treasury effects can share coin generation and spending opportunities. [strategy_inference; `derived:verified-mechanic-combination`]
- 0: Margaery Tyrell and Meryn Trant appeared together in 4 observed compositions; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-1872-enemy,drive-observed-1882,drive-observed-1887,drive-observed-2745`]
- 0: Margaery Tyrell and Cersei Lannister appeared together in 2 observed compositions; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-1882,drive-observed-2745`]
- 0: Meryn Trant and Cersei Lannister appeared together in 2 observed compositions; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-1882,drive-observed-2745`]

### Battle plan

- Overall strategy: Exploit enemies beginning battle WOUNDED for three turns.
- Timing and sequence: Front-load WOUND payoff and focused damage during the opening turns.
- Major dangers: The opening WOUND lasts three turns in the verified rule.

### Evidence and limits

- Verified fact links used: 6
- Strategy inferences shown: 14
- Community observations shown: 3; score contribution is always zero.
- Warning: Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- Warning: 22 exact variants with unverified current availability were considered and excluded from primary recommendations.
- Warning: Some selected profiles have incomplete non-strategy metadata: Meryn Trant, Cersei Lannister, Seasmoke.
- Warning: Cersei Lannister has partial source wording for Treasury Generator; only the visible verified mechanic was used.

## Maester's Sigil

**Target:** `war:maesters-sigil`  
**Status:** ready  
**Confidence:** medium

**Leader:** Catelyn Stark  
**Overall team score:** 109

### Exact five and role-preserving substitutes

#### Laenor Velaryon (`sqlite-champion-30`)

- Role: Support
- Individual strategic-fit score: 7.5
- Verified scoring contributions: Healing +6 from `champion_trait:64`; inference rule `war-maester-heal` / `war_outpost_rule:maesters-sigil`
- Iconic item: No supported connected item shown
- Primary substitute: Corlys Velaryon (`sqlite-champion-37`) — Preserves HEALING, the main verified function supplied by Laenor Velaryon. Projected team score 108.3.
- Important conflict: None identified by the target rules.

#### Samwell Tarly (`sqlite-champion-39`)

- Role: Protector / Support
- Individual strategic-fit score: 24.8
- Verified scoring contributions: Unnatural resistance +18 from `ability:sqlite-iconic_abilities-20`; inference rule `war-maester-resistance` / `war_outpost_rule:maesters-sigil` | Healing +6 from `champion_trait:84`; inference rule `war-maester-heal` / `war_outpost_rule:maesters-sigil`
- Iconic item: Dragonglass Dagger
- Primary substitute: Alicent Hightower (Queen Dowager) (`sqlite-champion-78`) — Preserves HEALING, the main verified function supplied by Samwell Tarly. Projected team score 91.
- Important conflict: None identified by the target rules.

#### Jorah Mormont (`sqlite-champion-46`)

- Role: Protector
- Individual strategic-fit score: 18.8
- Verified scoring contributions: Unnatural resistance +18 from `champion_trait:99`; inference rule `war-maester-resistance` / `war_outpost_rule:maesters-sigil`
- Iconic item: No supported connected item shown
- Primary substitute: Corlys Velaryon (`sqlite-champion-37`) — Provides the closest deterministic team score when Jorah Mormont is unavailable, but no exact primary-mechanic match is verified. Projected team score 97.
- Important conflict: None identified by the target rules.

#### Catelyn Stark (`sqlite-champion-71`)

- Role: Support
- Individual strategic-fit score: 7.5
- Verified scoring contributions: Healing +6 from `champion_trait:151`; inference rule `war-maester-heal` / `war_outpost_rule:maesters-sigil`
- Iconic item: No supported connected item shown
- Primary substitute: Ned Stark (`sqlite-champion-2`) — Preserves HEALING, the main verified function supplied by Catelyn Stark. Projected team score 108.3.
- Important conflict: None identified by the target rules.

#### Lyanna Mormont (`sqlite-champion-86`)

- Role: Support
- Individual strategic-fit score: 7.5
- Verified scoring contributions: Healing +6 from `champion_trait:185`; inference rule `war-maester-heal` / `war_outpost_rule:maesters-sigil`
- Iconic item: No supported connected item shown
- Primary substitute: Corlys Velaryon (`sqlite-champion-37`) — Preserves HEALING, the main verified function supplied by Lyanna Mormont. Projected team score 102.3.
- Important conflict: None identified by the target rules.

### Team composition effects

- +3: The team can remove verified debuffs from allies. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified DEF, Durability, Resistance, or BLOCK support. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified healing for sustained battles. [strategy_inference; `derived:verified-mechanic-combination`]
- +2: The team includes at least one source-backed Leader effect. [strategy_inference; `derived:verified-mechanic-combination`]
- +3: The team includes a verified TAUNT option for pressure control. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: Cleanse protects a TAUNT champion from disabling debuffs. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Healing helps a TAUNT protector keep absorbing pressure. [strategy_inference; `derived:verified-mechanic-combination`]
- +6: ICE setup enables a teammate's BRITTLE payoff. [strategy_inference; `derived:verified-mechanic-combination`]
- +6: RAID setup enables a teammate's RAID payoff. [strategy_inference; `derived:verified-mechanic-combination`]

### Battle plan

- Overall strategy: Layer sustain and Unnatural Resistance around the verified +20% resistance buff.
- Timing and sequence: Use the opening resistance window to stabilize and build Stamina.
- Major dangers: The rule supplies resistance; it does not add damage.

### Evidence and limits

- Verified fact links used: 6
- Strategy inferences shown: 15
- Community observations shown: 0; score contribution is always zero.
- Warning: Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- Warning: 22 exact variants with unverified current availability were considered and excluded from primary recommendations.
- Warning: Some selected profiles have incomplete non-strategy metadata: Laenor Velaryon, Jorah Mormont, Catelyn Stark, Lyanna Mormont.

## Ravenous Pack

**Target:** `war:ravenous-pack`  
**Status:** ready  
**Confidence:** medium

**Leader:** Meryn Trant  
**Overall team score:** 138.3

### Exact five and role-preserving substitutes

#### Margaery Tyrell (`sqlite-champion-34`)

- Role: Status payoff
- Individual strategic-fit score: 20.8
- Verified scoring contributions: WOUND payoff +20 from `ability:sqlite-iconic_abilities-17`; inference rule `war-ravenous-wound-payoff` / `war_outpost_rule:ravenous-pack`
- Iconic item: Rose Gold Pendant
- Primary substitute: Corlys Velaryon (`sqlite-champion-37`) — Provides the closest deterministic team score when Margaery Tyrell is unavailable, but no exact primary-mechanic match is verified. Projected team score 127.3.
- Important conflict: None identified by the target rules.

#### Euron Greyjoy (`sqlite-champion-36`)

- Role: Status payoff / Damage dealer
- Individual strategic-fit score: 23.8
- Verified scoring contributions: WOUND payoff +20 from `ability:sqlite-iconic_abilities-18`; inference rule `war-ravenous-wound-payoff` / `war_outpost_rule:ravenous-pack` | Physical damage +3 from `ability:sqlite-champion_skills-33`; inference rule `war-ravenous-damage` / `war_outpost_rule:ravenous-pack`
- Iconic item: Massive Scorpion
- Primary substitute: Daario Naharis (`sqlite-champion-13`) — Preserves PHYSICAL DAMAGE, the main verified function supplied by Euron Greyjoy. Projected team score 123.6.
- Important conflict: None identified by the target rules.

#### Benjen Stark (`sqlite-champion-48`)

- Role: Damage dealer
- Individual strategic-fit score: 3.8
- Verified scoring contributions: Physical damage +3 from `ability:sqlite-champion_skills-47`; inference rule `war-ravenous-damage` / `war_outpost_rule:ravenous-pack`
- Iconic item: No supported connected item shown
- Primary substitute: Mance Rayder (`sqlite-champion-27`) — Preserves PHYSICAL DAMAGE, the main verified function supplied by Benjen Stark. Projected team score 144.3.
- Important conflict: None identified by the target rules.

#### Meryn Trant (`sqlite-champion-49`)

- Role: Status payoff / Damage dealer
- Individual strategic-fit score: 26.3
- Verified scoring contributions: WOUND payoff +20 from `champion_trait:105`; inference rule `war-ravenous-wound-payoff` / `war_outpost_rule:ravenous-pack` | Physical damage +3 from `ability:sqlite-champion_skills-48`; inference rule `war-ravenous-damage` / `war_outpost_rule:ravenous-pack`
- Iconic item: No supported connected item shown
- Primary substitute: Daario Naharis (`sqlite-champion-13`) — Preserves PHYSICAL DAMAGE, the main verified function supplied by Meryn Trant. Projected team score 112.6.
- Important conflict: None identified by the target rules.

#### Cersei Lannister (`sqlite-champion-70`)

- Role: Status payoff / Damage dealer
- Individual strategic-fit score: 23.8
- Verified scoring contributions: WOUND payoff +20 from `ability:sqlite-champion_skills-68`; inference rule `war-ravenous-wound-payoff` / `war_outpost_rule:ravenous-pack` | Physical damage +3 from `ability:sqlite-champion_skills-68`; inference rule `war-ravenous-damage` / `war_outpost_rule:ravenous-pack`
- Iconic item: No supported connected item shown
- Primary substitute: Tormund Giantsbane (`sqlite-champion-61`) — Preserves PHYSICAL DAMAGE, the main verified function supplied by Cersei Lannister. Projected team score 129.6.
- Important conflict: None identified by the target rules.

### Team composition effects

- +3: The team can remove verified debuffs from allies. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified DEF, Durability, Resistance, or BLOCK support. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified healing for sustained battles. [strategy_inference; `derived:verified-mechanic-combination`]
- +2: The team includes at least one source-backed Leader effect. [strategy_inference; `derived:verified-mechanic-combination`]
- +3: The team includes a verified TAUNT option for pressure control. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: Cleanse protects a TAUNT champion from disabling debuffs. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Healing helps a TAUNT protector keep absorbing pressure. [strategy_inference; `derived:verified-mechanic-combination`]
- +2: Multiple Treasury effects can share coin generation and spending opportunities. [strategy_inference; `derived:verified-mechanic-combination`]
- 0: Margaery Tyrell and Meryn Trant appeared together in 4 observed compositions; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-1872-enemy,drive-observed-1882,drive-observed-1887,drive-observed-2745`]
- 0: Margaery Tyrell and Cersei Lannister appeared together in 2 observed compositions; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-1882,drive-observed-2745`]
- 0: Meryn Trant and Cersei Lannister appeared together in 2 observed compositions; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-1882,drive-observed-2745`]

### Battle plan

- Overall strategy: Exploit the WOUND applied to enemies every three turns with champions that gain value from WOUNDED targets.
- Timing and sequence: Coordinate damage and WOUND-triggered effects during the three-turn window.
- Major dangers: WOUND prevents healing but does not itself prove a team can finish the opponent.

### Evidence and limits

- Verified fact links used: 7
- Strategy inferences shown: 16
- Community observations shown: 3; score contribution is always zero.
- Warning: Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- Warning: 22 exact variants with unverified current availability were considered and excluded from primary recommendations.
- Warning: Some selected profiles have incomplete non-strategy metadata: Benjen Stark, Meryn Trant, Cersei Lannister.
- Warning: Cersei Lannister has partial source wording for Treasury Generator; only the visible verified mechanic was used.

## Scout's Post

**Target:** `war:scouts-post`  
**Status:** ready  
**Confidence:** medium

**Leader:** Jaime Lannister  
**Overall team score:** 144.8

### Exact five and role-preserving substitutes

#### Joffrey Baratheon (`sqlite-champion-22`)

- Role: Status payoff
- Individual strategic-fit score: 24.8
- Verified scoring contributions: SCOUTED payoff +24 from `champion_trait:47`; inference rule `war-scout-payoff` / `war_outpost_rule:scouts-post`
- Iconic item: Widow's Wail
- Primary substitute: Cersei Lannister (`sqlite-champion-70`) — Provides the closest deterministic team score when Joffrey Baratheon is unavailable, but no exact primary-mechanic match is verified. Projected team score 128.8.
- Important conflict: None identified by the target rules.

#### Jaime Lannister (`sqlite-champion-45`)

- Role: Tempo control
- Individual strategic-fit score: 9.8
- Verified scoring contributions: Fast opening +8 from `champion_trait:96`; inference rule `war-scout-fast` / `war_outpost_rule:scouts-post`
- Iconic item: The Kingslayer's Blade
- Primary substitute: Cersei Lannister (`sqlite-champion-70`) — Preserves FAST START, the main verified function supplied by Jaime Lannister. Projected team score 144.8.
- Important conflict: None identified by the target rules.

#### Lord Varys (`sqlite-champion-50`)

- Role: Status payoff
- Individual strategic-fit score: 25.8
- Verified scoring contributions: SCOUTED payoff +24 from `champion_trait:108`; inference rule `war-scout-payoff` / `war_outpost_rule:scouts-post`
- Iconic item: No supported connected item shown
- Primary substitute: Stannis Baratheon — Lord of Storm's End (`sqlite-champion-16`) — Provides the closest deterministic team score when Lord Varys is unavailable, but no exact primary-mechanic match is verified. Projected team score 125.8.
- Important conflict: None identified by the target rules.

#### Davos Seaworth (`sqlite-champion-7`)

- Role: Status payoff
- Individual strategic-fit score: 24.8
- Verified scoring contributions: SCOUTED payoff +24 from `champion_trait:13`; inference rule `war-scout-payoff` / `war_outpost_rule:scouts-post`
- Iconic item: Pouch Of Fingers
- Primary substitute: Alicent Hightower (`sqlite-champion-58`) — Provides the closest deterministic team score when Davos Seaworth is unavailable, but no exact primary-mechanic match is verified. Projected team score 127.8.
- Important conflict: None identified by the target rules.

#### Barristan Selmy (`sqlite-champion-77`)

- Role: Status payoff
- Individual strategic-fit score: 24.8
- Verified scoring contributions: SCOUTED payoff +24 from `ability:sqlite-champion_skills-75`; inference rule `war-scout-payoff` / `war_outpost_rule:scouts-post`
- Iconic item: No supported connected item shown
- Primary substitute: Meryn Trant (`sqlite-champion-49`) — Provides the closest deterministic team score when Barristan Selmy is unavailable, but no exact primary-mechanic match is verified. Projected team score 128.8.
- Important conflict: None identified by the target rules.

### Team composition effects

- +3: The team can remove verified debuffs from allies. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified DEF, Durability, Resistance, or BLOCK support. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified healing for sustained battles. [strategy_inference; `derived:verified-mechanic-combination`]
- +2: The team includes at least one source-backed Leader effect. [strategy_inference; `derived:verified-mechanic-combination`]
- +3: The team includes a verified TAUNT option for pressure control. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: Cleanse protects a TAUNT champion from disabling debuffs. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Healing helps a TAUNT protector keep absorbing pressure. [strategy_inference; `derived:verified-mechanic-combination`]
- +2: Multiple Treasury effects can share coin generation and spending opportunities. [strategy_inference; `derived:verified-mechanic-combination`]
- +1: 2 Baratheon members share a verified current faction context. [strategy_inference; `faction:Baratheon`]
- 0: Joffrey Baratheon and Lord Varys appeared together in 1 observed composition; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-2744`]
- 0: Joffrey Baratheon and Davos Seaworth appeared together in 3 observed compositions; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-2651,drive-observed-2736,drive-observed-2744`]
- 0: Lord Varys and Davos Seaworth appeared together in 3 observed compositions; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-1872-player,drive-observed-2644,drive-observed-2744`]

### Battle plan

- Overall strategy: Use champions whose abilities gain value from SCOUTED enemies during the two-turn opening.
- Timing and sequence: Trigger SCOUTED payoff immediately before the opening mark expires.
- Major dangers: The verified SCOUTED duration is two turns.

### Evidence and limits

- Verified fact links used: 5
- Strategy inferences shown: 14
- Community observations shown: 3; score contribution is always zero.
- Warning: Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- Warning: 22 exact variants with unverified current availability were considered and excluded from primary recommendations.
- Warning: Some selected profiles have incomplete non-strategy metadata: Joffrey Baratheon, Jaime Lannister, Lord Varys, Davos Seaworth, Barristan Selmy.

## Stone Keep

**Target:** `war:stone-keep`  
**Status:** ready  
**Confidence:** medium

**Leader:** Ser Duncan the Tall  
**Overall team score:** 196.8

### Exact five and role-preserving substitutes

#### Sandor Clegane (`sqlite-champion-10`)

- Role: Protector / Support
- Individual strategic-fit score: 33.5
- Verified scoring contributions: Defense and durability +18 from `ability:sqlite-iconic_abilities-7`; inference rule `war-stone-defense` / `war_outpost_rule:stone-keep` | Shields +8 from `ability:sqlite-champion_skills-7`; inference rule `war-stone-shield` / `war_outpost_rule:stone-keep` | Healing +6 from `champion_trait:19`; inference rule `war-stone-heal` / `war_outpost_rule:stone-keep`
- Iconic item: White Cloak
- Primary substitute: Catelyn Stark (`sqlite-champion-71`) — Preserves DEFENSE and HEALING, the main verified function supplied by Sandor Clegane. Projected team score 187.8.
- Important conflict: None identified by the target rules.

#### Ser Duncan the Tall (`sqlite-champion-14`)

- Role: Protector / Support
- Individual strategic-fit score: 30
- Verified scoring contributions: Defense and durability +18 from `champion_trait:29`; inference rule `war-stone-defense` / `war_outpost_rule:stone-keep` | Shields +8 from `ability:sqlite-champion_skills-11`; inference rule `war-stone-shield` / `war_outpost_rule:stone-keep`
- Iconic item: No supported connected item shown
- Primary substitute: Jorah Mormont (`sqlite-champion-46`) — Preserves DEFENSE, the main verified function supplied by Ser Duncan the Tall. Projected team score 183.8.
- Important conflict: None identified by the target rules.

#### Brienne of Tarth (`sqlite-champion-29`)

- Role: Protector / Support
- Individual strategic-fit score: 27.8
- Verified scoring contributions: Defense and durability +18 from `ability:sqlite-iconic_abilities-15`; inference rule `war-stone-defense` / `war_outpost_rule:stone-keep` | Shields +8 from `ability:sqlite-champion_skills-25`; inference rule `war-stone-shield` / `war_outpost_rule:stone-keep`
- Iconic item: Oathkeeper
- Primary substitute: Catelyn Stark (`sqlite-champion-71`) — Preserves DEFENSE, the main verified function supplied by Brienne of Tarth. Projected team score 189.5.
- Important conflict: None identified by the target rules.

#### Samwell Tarly (`sqlite-champion-39`)

- Role: Protector / Support
- Individual strategic-fit score: 33.8
- Verified scoring contributions: Defense and durability +18 from `ability:sqlite-iconic_abilities-20`; inference rule `war-stone-defense` / `war_outpost_rule:stone-keep` | Shields +8 from `ability:sqlite-iconic_abilities-20`; inference rule `war-stone-shield` / `war_outpost_rule:stone-keep` | Healing +6 from `champion_trait:84`; inference rule `war-stone-heal` / `war_outpost_rule:stone-keep`
- Iconic item: Dragonglass Dagger
- Primary substitute: Catelyn Stark (`sqlite-champion-71`) — Preserves DEFENSE and HEALING, the main verified function supplied by Samwell Tarly. Projected team score 181.5.
- Important conflict: None identified by the target rules.

#### Davos Seaworth (`sqlite-champion-7`)

- Role: Protector / Support
- Individual strategic-fit score: 24.8
- Verified scoring contributions: Defense and durability +18 from `ability:sqlite-iconic_abilities-4`; inference rule `war-stone-defense` / `war_outpost_rule:stone-keep` | Healing +6 from `ability:sqlite-iconic_abilities-4`; inference rule `war-stone-heal` / `war_outpost_rule:stone-keep`
- Iconic item: Pouch Of Fingers
- Primary substitute: Catelyn Stark (`sqlite-champion-71`) — Preserves DEFENSE and HEALING, the main verified function supplied by Davos Seaworth. Projected team score 196.5.
- Important conflict: None identified by the target rules.

### Team composition effects

- +3: The team can remove verified debuffs from allies. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified DEF, Durability, Resistance, or BLOCK support. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified healing for sustained battles. [strategy_inference; `derived:verified-mechanic-combination`]
- +2: The team includes at least one source-backed Leader effect. [strategy_inference; `derived:verified-mechanic-combination`]
- +3: The team includes a verified TAUNT option for pressure control. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: Cleanse protects a TAUNT champion from disabling debuffs. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Healing helps a TAUNT protector keep absorbing pressure. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Shield creation enables shield-dependent damage or support. [strategy_inference; `derived:verified-mechanic-combination`]
- +1: 2 Baratheon members share a verified current faction context. [strategy_inference; `faction:Baratheon`]
- 0: Sandor Clegane and Ser Duncan the Tall appeared together in 1 observed composition; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-1834`]
- 0: Sandor Clegane and Brienne of Tarth appeared together in 2 observed compositions; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-2643,drive-observed-2651`]
- 0: Sandor Clegane and Davos Seaworth appeared together in 1 observed composition; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-2651`]
- 0: Brienne of Tarth and Davos Seaworth appeared together in 1 observed composition; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-2651`]

### Battle plan

- Overall strategy: Build a durable team that compounds the verified +10% DEF bonus with shields and healing.
- Timing and sequence: Absorb the first enemy cycle, then use the stable board to coordinate Skills.
- Major dangers: The battlefield bonus improves DEF but does not replace healing or damage.

### Evidence and limits

- Verified fact links used: 10
- Strategy inferences shown: 21
- Community observations shown: 4; score contribution is always zero.
- Warning: Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- Warning: 22 exact variants with unverified current availability were considered and excluded from primary recommendations.
- Warning: Some selected profiles have incomplete non-strategy metadata: Ser Duncan the Tall, Davos Seaworth.

## Five historical source gaps

1. **Teaching Me This Lesson III ending** — exact variant `sqlite-champion-6`; selected targets: none; primary-substitute appearances: none. The cropped ending is not used to create an unverified mechanic.
2. **Joffrey Protector Treasury Generator ending** — exact variant `sqlite-champion-66`; selected targets: none; primary-substitute appearances: none. Only visible wording may be normalized.
3. **Cersei Treasury Generator ending** — exact variant `sqlite-champion-70`; selected targets: Raid defense, Harpy's Pit, Ravenous Pack; primary-substitute appearances: Drogon for Meryn Trant, Raid attack for Meryn Trant, Scout's Post for Joffrey Baratheon, Scout's Post for Jaime Lannister. When her visible Treasury mechanic contributes to a team synergy, the result emits a partial-source warning.
4. **Crownlands Knight identity** — no exact variant ID exists. Ambiguous observed names are discarded before pair construction, so this position never affects selection or score.
5. **Red Woman’s Ruby Necklace image** — Melisandre (`sqlite-champion-42`) selected targets: Crimson Bastion; primary-substitute appearances: Rhaegal for Daenerys Targaryen - Mother Of Dragons, Rhaegal for Rhaenyra Targaryen - The King's Chosen Heir, Barricade for Daenerys Targaryen - Mother Of Dragons, Barricade for Rhaenyra Targaryen - The King's Chosen Heir, Barricade for Samwell Tarly. The verified item relationship and wording remain usable; the absent image has no score effect.

## Acceptance findings and corrections

- Community co-occurrence previously added a small bonus for every observed pair; ten pair bonuses could collectively outweigh a verified mechanical difference. Community observations now contribute zero points and remain explanatory context only.
- Substitutes previously came from the next global candidate scores. Every selected member now receives a primary substitute chosen first by overlap with that member’s positive target mechanics, then by the projected replacement-team score.
- Leader selection previously accepted any source-backed Leader row. It now requires complete review status and at least 0.8 confidence.
- The result contract and UI previously omitted explicit roles and individual score contributions. Both are now returned and displayed.
- Beam search already evaluated the full team at every expansion. New tests prove complementary setup/payoff mechanics can displace a higher individual score, redundant candidates lose marginal value relative to complementarity, exclusions produce role-appropriate replacements, and tie-breaking is repeatable.

## Natural-language parser acceptance

- “What is the strongest team to fight Drogon?” → `legendary-assault:drogon`
- “Build a Raid attack team.” → `raid:attack`
- “What team should I use for Raid defense?” → `raid:defense`
- “Who works best under Ravenous Pack?” → `war:ravenous-pack`
- “Build for Maester’s Sigil.” → `war:maesters-sigil`
- “What works at Scout’s Post?” → `war:scouts-post`
- Ambiguous or unsupported questions return no parsed target and leave the structured selectors available.

