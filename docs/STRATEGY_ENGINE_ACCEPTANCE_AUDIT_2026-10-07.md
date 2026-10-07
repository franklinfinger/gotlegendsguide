# Strategy Engine Acceptance Audit — 2026-10-07

This report records the live deterministic result for every supported target after the strategy-quality acceptance fixes. “Strongest” means strongest strategic fit from verified mechanics unless a player later supplies roster levels, stars, gear, and items. Rarity, stars, raw power, popularity, and generic strength are not scoring inputs.

Community-observed compositions are displayed as context with a score contribution of zero. They do not override verified mechanics or imply a victory.

## Audit summary

- Targets evaluated: 15
- Targets returning five exact variants: 14
- Insufficient-evidence targets: 1
- Live normalized mechanics: 57
- Live strategy rules: 92
- Live exact-variant facts: 1048

## Compact result matrix

| Target | Exact five | Leader |
|---|---|---|
| Drogon | Tywin Lannister; Gwayne Hightower; Meryn Trant; Alicent Hightower; Otto Hightower | Alicent Hightower |
| Icy Viserion | Insufficient evidence — no team generated | — |
| Rhaegal | Rhaenyra Targaryen - The King's Chosen Heir; Osha; Alicent Hightower (Queen Dowager); Walder Frey; Rhaenyra Targaryen | Osha |
| Viserion | Ned Stark; Arya Stark - Winterfell Returned; Rickard Karstark; Tormund Giantsbane; Lyanna Mormont | Ned Stark |
| Raid attack | Icy Viserion; Meryn Trant; Cersei Lannister; Rhaenys Targaryen; Lyanna Mormont | Lyanna Mormont |
| Raid defense | Sandor Clegane; Ser Duncan the Tall; Adolescent Rhaegal; Samwell Tarly; Meryn Trant | Ser Duncan the Tall |
| Ashen Waste | Daenerys Targaryen - Mother Of Dragons; Stannis Baratheon — Lord of Storm's End; Rhaenyra Targaryen - The King's Chosen Heir; Adolescent Drogon; Daenerys Targaryen - Conqueror Of Qarth | Rhaenyra Targaryen - The King's Chosen Heir |
| Baratheon War Camp | Sandor Clegane; Stannis Baratheon — Lord of Storm's End; Joffrey Baratheon; Gendry; Davos Seaworth | Davos Seaworth |
| Barricade | Ser Duncan the Tall; Ned Stark; Brienne of Tarth; Samwell Tarly; Brienne of Tarth - True Knight | Ser Duncan the Tall |
| Crimson Bastion | Daemon Targaryen; Stannis Baratheon — Lord of Storm's End; Meleys; Meryn Trant; Tyrion Lannister - The Half Man | Tyrion Lannister - The Half Man |
| Harpy's Pit | Margaery Tyrell; Euron Greyjoy; Meryn Trant; Cersei Lannister; Seasmoke | Meryn Trant |
| Maester's Sigil | Ned Stark; Laenor Velaryon; Samwell Tarly; Jorah Mormont; Lyanna Mormont | Laenor Velaryon |
| Ravenous Pack | Margaery Tyrell; Euron Greyjoy; Benjen Stark; Meryn Trant; Cersei Lannister | Meryn Trant |
| Scout's Post | Joffrey Baratheon; Jaime Lannister; Lord Varys; Davos Seaworth; Barristan Selmy | Jaime Lannister |
| Stone Keep | Sandor Clegane; Ser Duncan the Tall; Rhaenyra Targaryen - The King's Chosen Heir; Brienne of Tarth; Samwell Tarly | Ser Duncan the Tall |

## Drogon

- **Target:** `legendary-assault:drogon`
- **Status:** ready
- **Confidence:** medium-high

- **Leader:** Alicent Hightower
- **Overall team score:** 189

### Exact five and role-preserving substitutes

#### Tywin Lannister (`sqlite-champion-15`)

- Role: Buff enabler / Damage dealer
- Individual strategic-fit score: 23
- Verified scoring contributions: BIRTHRIGHT +22 from `champion_trait:31`; inference rule `drogon-birthright` / `legendary_assault_tip:drogon-birthright` | Physical damage +4 from `ability:sqlite-champion_skills-12`; inference rule `drogon-physical` / `legendary_assault_ability:drogon-born-in-flames-ii` | Treasury effects -3 from `ability:sqlite-champion_skills-12`; inference rule `drogon-treasury` / `legendary_assault_ability:drogon-ember-storm-ii`
- Iconic item: No supported connected item shown
- Primary substitute: Sunfyre (`sqlite-champion-56`) — Preserves BIRTHRIGHT, the main verified function supplied by Tywin Lannister. Projected team score 176.
- Important conflict: -3: Ember Storm II can reduce the player Treasury, making Treasury plans less reliable.

#### Gwayne Hightower (`sqlite-champion-43`)

- Role: Buff enabler / Support
- Individual strategic-fit score: 39
- Verified scoring contributions: BIRTHRIGHT +22 from `champion_trait:92`; inference rule `drogon-birthright` / `legendary_assault_tip:drogon-birthright` | Stamina support +8 from `champion_trait:92`; inference rule `drogon-stamina` / `legendary_assault_tip:drogon-fast-champions` | True damage +5 from `ability:sqlite-champion_skills-42`; inference rule `drogon-true` / `legendary_assault_ability:drogon-born-in-flames-ii` | Physical damage +4 from `ability:sqlite-champion_skills-42`; inference rule `drogon-physical` / `legendary_assault_ability:drogon-born-in-flames-ii`
- Iconic item: No supported connected item shown
- Primary substitute: Sunfyre (`sqlite-champion-56`) — Preserves BIRTHRIGHT and STAMINA, the main verified function supplied by Gwayne Hightower. Projected team score 162.
- Important conflict: None identified by the target rules.

#### Meryn Trant (`sqlite-champion-49`)

- Role: Support / Tempo control
- Individual strategic-fit score: 15
- Verified scoring contributions: Stamina support +8 from `champion_trait:105`; inference rule `drogon-stamina` / `legendary_assault_tip:drogon-fast-champions` | Fast opening +6 from `champion_trait:105`; inference rule `drogon-fast-start` / `legendary_assault_tip:drogon-fast-champions` | Physical damage +4 from `ability:sqlite-champion_skills-48`; inference rule `drogon-physical` / `legendary_assault_ability:drogon-born-in-flames-ii` | Treasury effects -3 from `ability:sqlite-champion_skills-48`; inference rule `drogon-treasury` / `legendary_assault_ability:drogon-ember-storm-ii`
- Iconic item: No supported connected item shown
- Primary substitute: Adolescent Rhaegal (`sqlite-champion-33`) — Preserves FAST START and PHYSICAL DAMAGE and STAMINA, the main verified function supplied by Meryn Trant. Projected team score 178.
- Important conflict: -3: Ember Storm II can reduce the player Treasury, making Treasury plans less reliable.

#### Alicent Hightower (`sqlite-champion-58`)

- Role: Buff enabler / Support
- Individual strategic-fit score: 40
- Verified scoring contributions: BIRTHRIGHT +22 from `ability:sqlite-iconic_abilities-26`; inference rule `drogon-birthright` / `legendary_assault_tip:drogon-birthright` | Stamina support +8 from `champion_trait:123`; inference rule `drogon-stamina` / `legendary_assault_tip:drogon-fast-champions` | Fast opening +6 from `champion_trait:123`; inference rule `drogon-fast-start` / `legendary_assault_tip:drogon-fast-champions` | Physical damage +4 from `ability:sqlite-champion_skills-57`; inference rule `drogon-physical` / `legendary_assault_ability:drogon-born-in-flames-ii`
- Iconic item: CatsPaw Dagger
- Primary substitute: Sunfyre (`sqlite-champion-56`) — Preserves BIRTHRIGHT and FAST START and STAMINA, the main verified function supplied by Alicent Hightower. Projected team score 157.
- Important conflict: None identified by the target rules.

#### Otto Hightower (`sqlite-champion-76`)

- Role: Buff enabler / Support
- Individual strategic-fit score: 40
- Verified scoring contributions: BIRTHRIGHT +22 from `ability:sqlite-champion_skills-74`; inference rule `drogon-birthright` / `legendary_assault_tip:drogon-birthright` | Stamina support +8 from `champion_trait:164`; inference rule `drogon-stamina` / `legendary_assault_tip:drogon-fast-champions` | Fast opening +6 from `champion_trait:164`; inference rule `drogon-fast-start` / `legendary_assault_tip:drogon-fast-champions` | Physical damage +4 from `ability:sqlite-champion_skills-74`; inference rule `drogon-physical` / `legendary_assault_ability:drogon-born-in-flames-ii`
- Iconic item: No supported connected item shown
- Primary substitute: Sunfyre (`sqlite-champion-56`) — Preserves BIRTHRIGHT and FAST START and STAMINA, the main verified function supplied by Otto Hightower. Projected team score 161.
- Important conflict: None identified by the target rules.

### Team composition effects

- +4: The team includes verified DEF, Durability, Resistance, or BLOCK support. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified healing for sustained battles. [strategy_inference; `derived:verified-mechanic-combination`]
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
- Strategy inferences shown: 21
- Community observations shown: 3; score contribution is always zero.
- Warning: Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- Warning: 22 exact variants with unverified current availability were considered and excluded from primary recommendations.
- Warning: Some selected profiles have incomplete non-strategy metadata: Tywin Lannister, Gwayne Hightower, Meryn Trant, Otto Hightower.

## Icy Viserion

- **Target:** `legendary-assault:icy-viserion`
- **Status:** insufficient_evidence
- **Confidence:** insufficient

No team was generated. The encounter is represented, but its ability cards and verified battle rules are unavailable.

### Missing-data warnings

- Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- The encounter is represented, but its ability cards and verified battle rules are unavailable.

## Rhaegal

- **Target:** `legendary-assault:rhaegal`
- **Status:** ready
- **Confidence:** medium-high

- **Leader:** Osha
- **Overall team score:** 253.5

### Exact five and role-preserving substitutes

#### Rhaenyra Targaryen - The King's Chosen Heir (`sqlite-champion-18`)

- Role: Status setup / Support
- Individual strategic-fit score: 59
- Verified scoring contributions: Apply FIRE +19 from `ability:sqlite-champion_skills-15`; inference rule `rhaegal-apply-fire` / `legendary_assault_tip:rhaegal-fire` | Healing +15 from `champion_trait:38`; inference rule `rhaegal-healing` / `legendary_assault_tip:rhaegal-taunt` | Fire damage +10 from `ability:sqlite-champion_skills-15`; inference rule `rhaegal-fire-damage` / `legendary_assault_tip:rhaegal-fire` | Defense and durability +8 from `ability:sqlite-iconic_abilities-11`; inference rule `rhaegal-defense` / `legendary_assault_ability:rhaegal-wrathful-gaze` | Targaryen +7 from `faction_membership:sqlite-faction-54617267617279656e:sqlite-champion-18`; inference rule `rhaegal-targaryen` / `legendary_assault_ability:rhaegal-fuel-to-the-flames`
- Iconic item: Valyrian Steel Necklace
- Primary substitute: Daenerys Targaryen - Mother Of Dragons (`sqlite-champion-11`) — Preserves APPLY FIRE and FIRE DAMAGE and FACTION TARGARYEN, the main verified function supplied by Rhaenyra Targaryen - The King's Chosen Heir. Projected team score 218.5.
- Important conflict: None identified by the target rules.

#### Osha (`sqlite-champion-63`)

- Role: Status setup / Status payoff
- Individual strategic-fit score: 31
- Verified scoring contributions: Apply BLEED +24 from `ability:sqlite-champion_skills-62`; inference rule `rhaegal-bleed` / `legendary_assault_tip:rhaegal-bleed` | BLEED payoff +7 from `ability:sqlite-champion_skills-62`; inference rule `rhaegal-bleed-payoff` / `legendary_assault_tip:rhaegal-bleed`
- Iconic item: No supported connected item shown
- Primary substitute: Ramsay Bolton (`sqlite-champion-69`) — Preserves APPLY BLEED and BLEED PAYOFF, the main verified function supplied by Osha. Projected team score 250.
- Important conflict: None identified by the target rules.

#### Alicent Hightower (Queen Dowager) (`sqlite-champion-78`)

- Role: Status setup / Support
- Individual strategic-fit score: 34
- Verified scoring contributions: Apply FIRE +19 from `ability:sqlite-champion_skills-76`; inference rule `rhaegal-apply-fire` / `legendary_assault_tip:rhaegal-fire` | Healing +15 from `ability:sqlite-champion_skills-76`; inference rule `rhaegal-healing` / `legendary_assault_tip:rhaegal-taunt`
- Iconic item: No supported connected item shown
- Primary substitute: Viserys Targaryen I (`sqlite-champion-68`) — Preserves APPLY FIRE and HEALING, the main verified function supplied by Alicent Hightower (Queen Dowager). Projected team score 241.5.
- Important conflict: None identified by the target rules.

#### Walder Frey (`sqlite-champion-85`)

- Role: Status setup / Support
- Individual strategic-fit score: 46
- Verified scoring contributions: Apply BLEED +24 from `champion_trait:183`; inference rule `rhaegal-bleed` / `legendary_assault_tip:rhaegal-bleed` | Healing +15 from `ability:sqlite-champion_skills-83`; inference rule `rhaegal-healing` / `legendary_assault_tip:rhaegal-taunt` | BLEED payoff +7 from `champion_trait:183`; inference rule `rhaegal-bleed-payoff` / `legendary_assault_tip:rhaegal-bleed`
- Iconic item: Red Wedding Chalice
- Primary substitute: Ramsay Bolton (`sqlite-champion-69`) — Preserves APPLY BLEED and BLEED PAYOFF, the main verified function supplied by Walder Frey. Projected team score 238.5.
- Important conflict: None identified by the target rules.

#### Rhaenyra Targaryen (`sqlite-champion-9`)

- Role: Status setup / Support
- Individual strategic-fit score: 43
- Verified scoring contributions: Apply FIRE +19 from `ability:sqlite-champion_skills-6`; inference rule `rhaegal-apply-fire` / `legendary_assault_tip:rhaegal-fire` | Healing +15 from `champion_trait:17`; inference rule `rhaegal-healing` / `legendary_assault_tip:rhaegal-taunt` | Fire damage +10 from `ability:sqlite-champion_skills-6`; inference rule `rhaegal-fire-damage` / `legendary_assault_tip:rhaegal-fire` | Targaryen +7 from `faction_membership:sqlite-faction-54617267617279656e:sqlite-champion-9`; inference rule `rhaegal-targaryen` / `legendary_assault_ability:rhaegal-fuel-to-the-flames` | FURY -8 from `champion_trait:17`; inference rule `rhaegal-fury` / `legendary_assault_ability:rhaegal-opening-salvo`
- Iconic item: Old King's Crown
- Primary substitute: Daenerys Targaryen - Mother Of Dragons (`sqlite-champion-11`) — Preserves APPLY FIRE and FIRE DAMAGE and FACTION TARGARYEN, the main verified function supplied by Rhaenyra Targaryen. Projected team score 238.5.
- Important conflict: -8: Rhaegal consumes FURY and replaces it with GRUDGE.

### Team composition effects

- +3: The team can remove verified debuffs from allies. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified DEF, Durability, Resistance, or BLOCK support. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified healing for sustained battles. [strategy_inference; `derived:verified-mechanic-combination`]
- +6: BLEED setup enables a teammate's BLEED payoff. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: FIRE setup enables a teammate's FIRE payoff. [strategy_inference; `derived:verified-mechanic-combination`]
- 0: Walder Frey and Rhaenyra Targaryen appeared together in 1 observed composition; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-2561`]

### Battle plan

- Overall strategy: Stack BLEED and FIRE while protecting and healing the champion Rhaegal forces to TAUNT.
- Timing and sequence: Apply BLEED before Rhaegal uses his Skill and keep FIRE active. Do not reinforce into his 100% HP Pool retaliation.
- Major dangers: Rhaegal consumes BIRTHRIGHT, FURY, shields, ICE, and BRITTLE; he cannot be STUNNED, PACIFIED, or DECEIVED. | Rhaenyra Targaryen: Rhaegal consumes FURY and replaces it with GRUDGE.

### Evidence and limits

- Verified fact links used: 8
- Strategy inferences shown: 19
- Community observations shown: 1; score contribution is always zero.
- Warning: Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- Warning: 22 exact variants with unverified current availability were considered and excluded from primary recommendations.
- Warning: Some selected profiles have incomplete non-strategy metadata: Osha, Alicent Hightower (Queen Dowager), Walder Frey.

## Viserion

- **Target:** `legendary-assault:viserion`
- **Status:** ready
- **Confidence:** medium-high

- **Leader:** Ned Stark
- **Overall team score:** 302.5

### Exact five and role-preserving substitutes

#### Ned Stark (`sqlite-champion-2`)

- Role: Status setup / Status payoff
- Individual strategic-fit score: 41
- Verified scoring contributions: Apply ICE +19 from `ability:sqlite-champion_skills-36`; inference rule `viserion-ice` / `legendary_assault_ability:viserion-patience-ii` | BRITTLE payoff +18 from `champion_trait:80`; inference rule `viserion-brittle` / `legendary_assault_tip:viserion-brittle` | Physical damage +4 from `ability:sqlite-champion_skills-36`; inference rule `viserion-physical` / `legendary_assault_ability:viserion-unchained-dragon`
- Iconic item: Ice
- Primary substitute: Brienne of Tarth - True Knight (`sqlite-champion-51`) — Preserves BRITTLE PAYOFF and APPLY ICE and PHYSICAL DAMAGE, the main verified function supplied by Ned Stark. Projected team score 287.
- Important conflict: None identified by the target rules.

#### Arya Stark - Winterfell Returned (`sqlite-champion-24`)

- Role: Status setup / Status payoff
- Individual strategic-fit score: 41
- Verified scoring contributions: Apply ICE +19 from `champion_trait:52`; inference rule `viserion-ice` / `legendary_assault_ability:viserion-patience-ii` | BRITTLE payoff +18 from `ability:sqlite-iconic_abilities-14`; inference rule `viserion-brittle` / `legendary_assault_tip:viserion-brittle` | Physical damage +4 from `champion_trait:52`; inference rule `viserion-physical` / `legendary_assault_ability:viserion-unchained-dragon`
- Iconic item: Needle
- Primary substitute: Brienne of Tarth - True Knight (`sqlite-champion-51`) — Preserves BRITTLE PAYOFF and APPLY ICE and PHYSICAL DAMAGE, the main verified function supplied by Arya Stark - Winterfell Returned. Projected team score 302.5.
- Important conflict: None identified by the target rules.

#### Rickard Karstark (`sqlite-champion-38`)

- Role: Status setup / Status payoff
- Individual strategic-fit score: 41
- Verified scoring contributions: Apply ICE +19 from `ability:sqlite-champion_skills-37`; inference rule `viserion-ice` / `legendary_assault_ability:viserion-patience-ii` | BRITTLE payoff +18 from `ability:sqlite-champion_skills-37`; inference rule `viserion-brittle` / `legendary_assault_tip:viserion-brittle` | Physical damage +4 from `ability:sqlite-champion_skills-37`; inference rule `viserion-physical` / `legendary_assault_ability:viserion-unchained-dragon`
- Iconic item: No supported connected item shown
- Primary substitute: Brienne of Tarth - True Knight (`sqlite-champion-51`) — Preserves BRITTLE PAYOFF and APPLY ICE and PHYSICAL DAMAGE, the main verified function supplied by Rickard Karstark. Projected team score 302.5.
- Important conflict: None identified by the target rules.

#### Tormund Giantsbane (`sqlite-champion-61`)

- Role: Status setup / Status payoff
- Individual strategic-fit score: 65
- Verified scoring contributions: Apply RAID +24 from `ability:sqlite-iconic_abilities-28`; inference rule `viserion-raid` / `legendary_assault_tip:viserion-raid` | Apply ICE +19 from `ability:sqlite-iconic_abilities-28`; inference rule `viserion-ice` / `legendary_assault_ability:viserion-patience-ii` | BRITTLE payoff +18 from `ability:sqlite-iconic_abilities-28`; inference rule `viserion-brittle` / `legendary_assault_tip:viserion-brittle` | RAID payoff +9 from `ability:sqlite-iconic_abilities-28`; inference rule `viserion-raid-payoff` / `legendary_assault_tip:viserion-raid` | Physical damage +4 from `ability:sqlite-champion_skills-60`; inference rule `viserion-physical` / `legendary_assault_ability:viserion-unchained-dragon` | Shields -9 from `champion_trait:129`; inference rule `viserion-shield` / `legendary_assault_ability:viserion-rude-awakening-ii`
- Iconic item: Hardhome Blade
- Primary substitute: Brienne of Tarth - True Knight (`sqlite-champion-51`) — Preserves BRITTLE PAYOFF and APPLY ICE and PHYSICAL DAMAGE, the main verified function supplied by Tormund Giantsbane. Projected team score 272.5.
- Important conflict: -9: Viserion destroys all shields whenever he wakes.

#### Lyanna Mormont (`sqlite-champion-86`)

- Role: Status setup / Status payoff
- Individual strategic-fit score: 74
- Verified scoring contributions: Apply RAID +24 from `ability:sqlite-champion_skills-84`; inference rule `viserion-raid` / `legendary_assault_tip:viserion-raid` | Apply ICE +19 from `ability:sqlite-champion_skills-84`; inference rule `viserion-ice` / `legendary_assault_ability:viserion-patience-ii` | BRITTLE payoff +18 from `champion_trait:185`; inference rule `viserion-brittle` / `legendary_assault_tip:viserion-brittle` | RAID payoff +9 from `ability:sqlite-champion_skills-84`; inference rule `viserion-raid-payoff` / `legendary_assault_tip:viserion-raid` | Physical damage +4 from `ability:sqlite-champion_skills-84`; inference rule `viserion-physical` / `legendary_assault_ability:viserion-unchained-dragon`
- Iconic item: No supported connected item shown
- Primary substitute: Ghost (`sqlite-champion-52`) — Preserves BRITTLE PAYOFF and APPLY ICE and PHYSICAL DAMAGE, the main verified function supplied by Lyanna Mormont. Projected team score 263.5.
- Important conflict: None identified by the target rules.

### Team composition effects

- +4: The team includes verified DEF, Durability, Resistance, or BLOCK support. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified healing for sustained battles. [strategy_inference; `derived:verified-mechanic-combination`]
- +3: The team includes a verified TAUNT option for pressure control. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Healing helps a TAUNT protector keep absorbing pressure. [strategy_inference; `derived:verified-mechanic-combination`]
- +6: ICE setup enables a teammate's BRITTLE payoff. [strategy_inference; `derived:verified-mechanic-combination`]
- +6: RAID setup enables a teammate's RAID payoff. [strategy_inference; `derived:verified-mechanic-combination`]
- 0: Ned Stark and Arya Stark - Winterfell Returned appeared together in 1 observed composition; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-2765`]

### Battle plan

- Overall strategy: Use RAID to strip defense and ICE to deal true damage, then attack sleeping Viserion only after he is BRITTLE.
- Timing and sequence: Build BRITTLE before striking through sleep. Stop attacking during PACIFY and avoid reinforcements that accelerate Patience.
- Major dangers: Viserion is immune to FIRE and POISON, destroys shields on waking, and punishes REINFORCE, STUN, and DECEIVE. | Tormund Giantsbane: Viserion destroys all shields whenever he wakes.

### Evidence and limits

- Verified fact links used: 8
- Strategy inferences shown: 22
- Community observations shown: 1; score contribution is always zero.
- Warning: Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- Warning: 22 exact variants with unverified current availability were considered and excluded from primary recommendations.
- Warning: Some selected profiles have incomplete non-strategy metadata: Rickard Karstark, Lyanna Mormont.

## Raid attack

- **Target:** `raid:attack`
- **Status:** ready
- **Confidence:** medium

- **Leader:** Lyanna Mormont
- **Overall team score:** 163.5

### Exact five and role-preserving substitutes

#### Icy Viserion (`sqlite-champion-35`)

- Role: Control / Damage dealer
- Individual strategic-fit score: 20
- Verified scoring contributions: Buff removal +7 from `champion_trait:74`; inference rule `raid-attack-remove` / `raid_mode_rules:matchmaking` | Unnatural damage +7 from `champion_trait:73`; inference rule `raid-attack-unnatural` / `raid_mode_rules:matchmaking` | Stamina support +6 from `champion_trait:74`; inference rule `raid-attack-stamina` / `raid_mode_rules:strategy`
- Iconic item: No supported connected item shown
- Primary substitute: Margaery Tyrell (`sqlite-champion-34`) — Preserves BUFF REMOVAL and STAMINA and UNNATURAL DAMAGE, the main verified function supplied by Icy Viserion. Projected team score 153.5.
- Important conflict: None identified by the target rules.

#### Meryn Trant (`sqlite-champion-49`)

- Role: Damage dealer / Control
- Individual strategic-fit score: 26
- Verified scoring contributions: Physical damage +8 from `ability:sqlite-champion_skills-48`; inference rule `raid-attack-physical` / `raid_mode_rules:matchmaking` | STUN +6 from `champion_trait:105`; inference rule `raid-attack-control` / `raid_mode_rules:strategy` | Fast opening +6 from `champion_trait:105`; inference rule `raid-attack-fast` / `raid_mode_rules:matchmaking` | Stamina support +6 from `champion_trait:105`; inference rule `raid-attack-stamina` / `raid_mode_rules:strategy`
- Iconic item: No supported connected item shown
- Primary substitute: Adolescent Rhaegal (`sqlite-champion-33`) — Preserves STUN and FAST START and PHYSICAL DAMAGE and STAMINA, the main verified function supplied by Meryn Trant. Projected team score 145.5.
- Important conflict: None identified by the target rules.

#### Cersei Lannister (`sqlite-champion-70`)

- Role: Damage dealer / Control
- Individual strategic-fit score: 26
- Verified scoring contributions: Physical damage +8 from `ability:sqlite-champion_skills-68`; inference rule `raid-attack-physical` / `raid_mode_rules:matchmaking` | STUN +6 from `ability:sqlite-champion_skills-68`; inference rule `raid-attack-control` / `raid_mode_rules:strategy` | Fast opening +6 from `champion_trait:148`; inference rule `raid-attack-fast` / `raid_mode_rules:matchmaking` | Stamina support +6 from `champion_trait:148`; inference rule `raid-attack-stamina` / `raid_mode_rules:strategy`
- Iconic item: No supported connected item shown
- Primary substitute: Adolescent Rhaegal (`sqlite-champion-33`) — Preserves STUN and FAST START and PHYSICAL DAMAGE and STAMINA, the main verified function supplied by Cersei Lannister. Projected team score 161.5.
- Important conflict: None identified by the target rules.

#### Rhaenys Targaryen (`sqlite-champion-8`)

- Role: Damage dealer / Control
- Individual strategic-fit score: 27
- Verified scoring contributions: Physical damage +8 from `ability:sqlite-champion_skills-5`; inference rule `raid-attack-physical` / `raid_mode_rules:matchmaking` | Buff removal +7 from `ability:sqlite-champion_skills-5`; inference rule `raid-attack-remove` / `raid_mode_rules:matchmaking` | STUN +6 from `ability:sqlite-champion_skills-5`; inference rule `raid-attack-control` / `raid_mode_rules:strategy` | Stamina support +6 from `ability:sqlite-iconic_abilities-5`; inference rule `raid-attack-stamina` / `raid_mode_rules:strategy`
- Iconic item: Red Queen's Battle Crown
- Primary substitute: Adolescent Viserion (`sqlite-champion-26`) — Preserves PHYSICAL DAMAGE and BUFF REMOVAL and STAMINA, the main verified function supplied by Rhaenys Targaryen. Projected team score 154.5.
- Important conflict: None identified by the target rules.

#### Lyanna Mormont (`sqlite-champion-86`)

- Role: Damage dealer / Support
- Individual strategic-fit score: 17
- Verified scoring contributions: Physical damage +8 from `ability:sqlite-champion_skills-84`; inference rule `raid-attack-physical` / `raid_mode_rules:matchmaking` | Stamina support +6 from `champion_trait:185`; inference rule `raid-attack-stamina` / `raid_mode_rules:strategy` | Healing +3 from `champion_trait:185`; inference rule `raid-attack-heal` / `raid_mode_rules:rewards`
- Iconic item: No supported connected item shown
- Primary substitute: Gwayne Hightower (`sqlite-champion-43`) — Preserves HEALING and PHYSICAL DAMAGE and STAMINA, the main verified function supplied by Lyanna Mormont. Projected team score 161.5.
- Important conflict: None identified by the target rules.

### Team composition effects

- +3: The team can remove verified debuffs from allies. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified DEF, Durability, Resistance, or BLOCK support. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified healing for sustained battles. [strategy_inference; `derived:verified-mechanic-combination`]
- +3: The team includes a verified TAUNT option for pressure control. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: Cleanse protects a TAUNT champion from disabling debuffs. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Healing helps a TAUNT protector keep absorbing pressure. [strategy_inference; `derived:verified-mechanic-combination`]
- +6: ICE setup enables a teammate's BRITTLE payoff. [strategy_inference; `derived:verified-mechanic-combination`]
- +6: RAID setup enables a teammate's RAID payoff. [strategy_inference; `derived:verified-mechanic-combination`]
- +2: Multiple Treasury effects can share coin generation and spending opportunities. [strategy_inference; `derived:verified-mechanic-combination`]
- 0: Meryn Trant and Cersei Lannister appeared together in 2 observed compositions; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-1882,drive-observed-2745`]

### Battle plan

- Overall strategy: Prioritize fast pressure, control, buff removal, and enough sustain to finish the selected defense.
- Timing and sequence: Use the opening turns to disable the highest-impact defender and preserve Stamina for coordinated Skills.
- Major dangers: Opponent power, stars, gear, and exact defensive lineup are outside this recommendation.

### Evidence and limits

- Verified fact links used: 9
- Strategy inferences shown: 24
- Community observations shown: 1; score contribution is always zero.
- Warning: Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- Warning: 22 exact variants with unverified current availability were considered and excluded from primary recommendations.
- Warning: Some selected profiles have incomplete non-strategy metadata: Icy Viserion, Meryn Trant, Cersei Lannister, Rhaenys Targaryen, Lyanna Mormont.
- Warning: Cersei Lannister has partial source wording for Treasury Generator; only the visible verified mechanic was used.

## Raid defense

- **Target:** `raid:defense`
- **Status:** ready
- **Confidence:** medium

- **Leader:** Ser Duncan the Tall
- **Overall team score:** 207

### Exact five and role-preserving substitutes

#### Sandor Clegane (`sqlite-champion-10`)

- Role: Support / Protector
- Individual strategic-fit score: 35
- Verified scoring contributions: Healing +10 from `champion_trait:19`; inference rule `raid-defense-heal` / `raid_mode_rules:matchmaking` | Defense and durability +9 from `ability:sqlite-iconic_abilities-7`; inference rule `raid-defense-defense` / `raid_mode_rules:matchmaking` | Shields +9 from `ability:sqlite-champion_skills-7`; inference rule `raid-defense-shield` / `raid_mode_rules:matchmaking` | DECEIVE +7 from `ability:sqlite-champion_skills-7`; inference rule `raid-defense-deceive` / `raid_mode_rules:strategy`
- Iconic item: White Cloak
- Primary substitute: Ned Stark (`sqlite-champion-2`) — Preserves DEFENSE and HEALING, the main verified function supplied by Sandor Clegane. Projected team score 198.
- Important conflict: None identified by the target rules.

#### Ser Duncan the Tall (`sqlite-champion-14`)

- Role: Protector / Support
- Individual strategic-fit score: 27
- Verified scoring contributions: Defense and durability +9 from `champion_trait:29`; inference rule `raid-defense-defense` / `raid_mode_rules:matchmaking` | Shields +9 from `ability:sqlite-champion_skills-11`; inference rule `raid-defense-shield` / `raid_mode_rules:matchmaking` | Taunt +9 from `ability:sqlite-champion_skills-11`; inference rule `raid-defense-taunt` / `raid_mode_rules:matchmaking`
- Iconic item: No supported connected item shown
- Primary substitute: Ned Stark (`sqlite-champion-2`) — Preserves DEFENSE and TAUNT, the main verified function supplied by Ser Duncan the Tall. Projected team score 195.
- Important conflict: None identified by the target rules.

#### Adolescent Rhaegal (`sqlite-champion-33`)

- Role: Tempo control / Control
- Individual strategic-fit score: 30
- Verified scoring contributions: Fast opening +9 from `champion_trait:69`; inference rule `raid-defense-fast` / `raid_mode_rules:matchmaking` | DECEIVE +7 from `champion_trait:70`; inference rule `raid-defense-deceive` / `raid_mode_rules:strategy` | PACIFY +7 from `champion_trait:70`; inference rule `raid-defense-pacify` / `raid_mode_rules:strategy` | STUN +7 from `champion_trait:70`; inference rule `raid-defense-stun` / `raid_mode_rules:strategy`
- Iconic item: No supported connected item shown
- Primary substitute: Cersei Lannister (`sqlite-champion-70`) — Preserves DECEIVE and FAST START and STUN, the main verified function supplied by Adolescent Rhaegal. Projected team score 200.
- Important conflict: None identified by the target rules.

#### Samwell Tarly (`sqlite-champion-39`)

- Role: Support / Protector
- Individual strategic-fit score: 28
- Verified scoring contributions: Healing +10 from `champion_trait:84`; inference rule `raid-defense-heal` / `raid_mode_rules:matchmaking` | Defense and durability +9 from `ability:sqlite-iconic_abilities-20`; inference rule `raid-defense-defense` / `raid_mode_rules:matchmaking` | Shields +9 from `ability:sqlite-iconic_abilities-20`; inference rule `raid-defense-shield` / `raid_mode_rules:matchmaking`
- Iconic item: Dragonglass Dagger
- Primary substitute: Ned Stark (`sqlite-champion-2`) — Preserves DEFENSE and HEALING, the main verified function supplied by Samwell Tarly. Projected team score 200.
- Important conflict: None identified by the target rules.

#### Meryn Trant (`sqlite-champion-49`)

- Role: Protector / Tempo control
- Individual strategic-fit score: 41
- Verified scoring contributions: Defense and durability +9 from `ability:sqlite-champion_skills-48`; inference rule `raid-defense-defense` / `raid_mode_rules:matchmaking` | Fast opening +9 from `champion_trait:105`; inference rule `raid-defense-fast` / `raid_mode_rules:matchmaking` | Taunt +9 from `ability:sqlite-champion_skills-48`; inference rule `raid-defense-taunt` / `raid_mode_rules:matchmaking` | DECEIVE +7 from `champion_trait:105`; inference rule `raid-defense-deceive` / `raid_mode_rules:strategy` | STUN +7 from `champion_trait:105`; inference rule `raid-defense-stun` / `raid_mode_rules:strategy`
- Iconic item: No supported connected item shown
- Primary substitute: Cersei Lannister (`sqlite-champion-70`) — Preserves DECEIVE and FAST START and STUN, the main verified function supplied by Meryn Trant. Projected team score 189.
- Important conflict: None identified by the target rules.

### Team composition effects

- +3: The team can remove verified debuffs from allies. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified DEF, Durability, Resistance, or BLOCK support. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified healing for sustained battles. [strategy_inference; `derived:verified-mechanic-combination`]
- +3: The team includes a verified TAUNT option for pressure control. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: Cleanse protects a TAUNT champion from disabling debuffs. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Healing helps a TAUNT protector keep absorbing pressure. [strategy_inference; `derived:verified-mechanic-combination`]
- +2: Multiple Treasury effects can share coin generation and spending opportunities. [strategy_inference; `derived:verified-mechanic-combination`]
- 0: Sandor Clegane and Ser Duncan the Tall appeared together in 1 observed composition; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-1834`]
- 0: Sandor Clegane and Meryn Trant appeared together in 1 observed composition; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-2740`]

### Battle plan

- Overall strategy: Prioritize durable leaders, healing, shields, TAUNT, revive, and opening control that works without manual targeting.
- Timing and sequence: Favor effects that trigger at battle start, on damage, or on ally defeat because another player controls the attack.
- Major dangers: Observed teams are composition examples and do not prove defensive wins.

### Evidence and limits

- Verified fact links used: 11
- Strategy inferences shown: 22
- Community observations shown: 2; score contribution is always zero.
- Warning: Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- Warning: 22 exact variants with unverified current availability were considered and excluded from primary recommendations.
- Warning: Some selected profiles have incomplete non-strategy metadata: Ser Duncan the Tall, Adolescent Rhaegal, Meryn Trant.

## Ashen Waste

- **Target:** `war:ashen-waste`
- **Status:** ready
- **Confidence:** medium

- **Leader:** Rhaenyra Targaryen - The King's Chosen Heir
- **Overall team score:** 136

### Exact five and role-preserving substitutes

#### Daenerys Targaryen - Mother Of Dragons (`sqlite-champion-11`)

- Role: Status payoff / Damage dealer
- Individual strategic-fit score: 26
- Verified scoring contributions: FIRE payoff +20 from `ability:sqlite-champion_skills-8`; inference rule `war-ashen-fire-payoff` / `war_outpost_rule:ashen-waste` | Fire damage +6 from `ability:sqlite-iconic_abilities-8`; inference rule `war-ashen-fire-damage` / `war_outpost_rule:ashen-waste`
- Iconic item: Chain Of Dragons
- Primary substitute: Beric Dondarrion (`sqlite-champion-59`) — Preserves FIRE DAMAGE, the main verified function supplied by Daenerys Targaryen - Mother Of Dragons. Projected team score 116.
- Important conflict: None identified by the target rules.

#### Stannis Baratheon — Lord of Storm's End (`sqlite-champion-16`)

- Role: Damage dealer
- Individual strategic-fit score: 6
- Verified scoring contributions: Fire damage +6 from `ability:sqlite-iconic_abilities-10`; inference rule `war-ashen-fire-damage` / `war_outpost_rule:ashen-waste`
- Iconic item: Blackwater Blade
- Primary substitute: Beric Dondarrion (`sqlite-champion-59`) — Preserves FIRE DAMAGE, the main verified function supplied by Stannis Baratheon — Lord of Storm's End. Projected team score 124.
- Important conflict: None identified by the target rules.

#### Rhaenyra Targaryen - The King's Chosen Heir (`sqlite-champion-18`)

- Role: Status payoff / Damage dealer
- Individual strategic-fit score: 26
- Verified scoring contributions: FIRE payoff +20 from `ability:sqlite-iconic_abilities-11`; inference rule `war-ashen-fire-payoff` / `war_outpost_rule:ashen-waste` | Fire damage +6 from `ability:sqlite-champion_skills-15`; inference rule `war-ashen-fire-damage` / `war_outpost_rule:ashen-waste`
- Iconic item: Valyrian Steel Necklace
- Primary substitute: Rhaenyra Targaryen (`sqlite-champion-9`) — Preserves FIRE DAMAGE, the main verified function supplied by Rhaenyra Targaryen - The King's Chosen Heir. Projected team score 102.
- Important conflict: None identified by the target rules.

#### Adolescent Drogon (`sqlite-champion-31`)

- Role: Status payoff / Damage dealer
- Individual strategic-fit score: 26
- Verified scoring contributions: FIRE payoff +20 from `champion_trait:66`; inference rule `war-ashen-fire-payoff` / `war_outpost_rule:ashen-waste` | Fire damage +6 from `champion_trait:65`; inference rule `war-ashen-fire-damage` / `war_outpost_rule:ashen-waste`
- Iconic item: No supported connected item shown
- Primary substitute: Beric Dondarrion (`sqlite-champion-59`) — Preserves FIRE DAMAGE, the main verified function supplied by Adolescent Drogon. Projected team score 116.
- Important conflict: None identified by the target rules.

#### Daenerys Targaryen - Conqueror Of Qarth (`sqlite-champion-6`)

- Role: Damage dealer
- Individual strategic-fit score: 6
- Verified scoring contributions: Fire damage +6 from `ability:sqlite-champion_skills-3`; inference rule `war-ashen-fire-damage` / `war_outpost_rule:ashen-waste`
- Iconic item: Hatchling Dragons
- Primary substitute: Jacaerys Velaryon (`sqlite-champion-32`) — Preserves FIRE DAMAGE, the main verified function supplied by Daenerys Targaryen - Conqueror Of Qarth. Projected team score 131.
- Important conflict: None identified by the target rules.

### Team composition effects

- +3: The team can remove verified debuffs from allies. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified DEF, Durability, Resistance, or BLOCK support. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified healing for sustained battles. [strategy_inference; `derived:verified-mechanic-combination`]
- +3: The team includes a verified TAUNT option for pressure control. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: Cleanse protects a TAUNT champion from disabling debuffs. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: FIRE setup enables a teammate's FIRE payoff. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Healing helps a TAUNT protector keep absorbing pressure. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Shield creation enables shield-dependent damage or support. [strategy_inference; `derived:verified-mechanic-combination`]

### Battle plan

- Overall strategy: Use champions that profit from enemies beginning the battle with two FIRE.
- Timing and sequence: Trigger FIRE payoff effects early before the opening stacks expire or are removed.
- Major dangers: The opening FIRE is a battlefield rule; additional FIRE application still depends on champion abilities.

### Evidence and limits

- Verified fact links used: 8
- Strategy inferences shown: 16
- Community observations shown: 0; score contribution is always zero.
- Warning: Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- Warning: 22 exact variants with unverified current availability were considered and excluded from primary recommendations.
- Warning: Some selected profiles have incomplete non-strategy metadata: Adolescent Drogon.

## Baratheon War Camp

- **Target:** `war:baratheon-war-camp`
- **Status:** ready
- **Confidence:** medium

- **Leader:** Davos Seaworth
- **Overall team score:** 141

### Exact five and role-preserving substitutes

#### Sandor Clegane (`sqlite-champion-10`)

- Role: Faction specialist
- Individual strategic-fit score: 24
- Verified scoring contributions: Baratheon +24 from `faction_membership:sqlite-faction-426172617468656f6e:sqlite-champion-10`; inference rule `war-baratheon-faction` / `war_outpost_rule:baratheon-war-camp`
- Iconic item: White Cloak
- Primary substitute: Barristan Selmy (`sqlite-champion-77`) — Provides the closest deterministic team score when Sandor Clegane is unavailable, but no exact primary-mechanic match is verified. Projected team score 127.
- Important conflict: None identified by the target rules.

#### Stannis Baratheon — Lord of Storm's End (`sqlite-champion-16`)

- Role: Faction specialist
- Individual strategic-fit score: 24
- Verified scoring contributions: Baratheon +24 from `faction_membership:sqlite-faction-426172617468656f6e:sqlite-champion-16`; inference rule `war-baratheon-faction` / `war_outpost_rule:baratheon-war-camp`
- Iconic item: Blackwater Blade
- Primary substitute: Barristan Selmy (`sqlite-champion-77`) — Provides the closest deterministic team score when Stannis Baratheon — Lord of Storm's End is unavailable, but no exact primary-mechanic match is verified. Projected team score 122.
- Important conflict: None identified by the target rules.

#### Joffrey Baratheon (`sqlite-champion-22`)

- Role: Faction specialist
- Individual strategic-fit score: 24
- Verified scoring contributions: Baratheon +24 from `faction_membership:sqlite-faction-426172617468656f6e:sqlite-champion-22`; inference rule `war-baratheon-faction` / `war_outpost_rule:baratheon-war-camp`
- Iconic item: Widow's Wail
- Primary substitute: Meryn Trant (`sqlite-champion-49`) — Provides the closest deterministic team score when Joffrey Baratheon is unavailable, but no exact primary-mechanic match is verified. Projected team score 129.
- Important conflict: None identified by the target rules.

#### Gendry (`sqlite-champion-57`)

- Role: Faction specialist
- Individual strategic-fit score: 24
- Verified scoring contributions: Baratheon +24 from `faction_membership:sqlite-faction-426172617468656f6e:sqlite-champion-57`; inference rule `war-baratheon-faction` / `war_outpost_rule:baratheon-war-camp`
- Iconic item: No supported connected item shown
- Primary substitute: Barristan Selmy (`sqlite-champion-77`) — Provides the closest deterministic team score when Gendry is unavailable, but no exact primary-mechanic match is verified. Projected team score 129.
- Important conflict: None identified by the target rules.

#### Davos Seaworth (`sqlite-champion-7`)

- Role: Faction specialist
- Individual strategic-fit score: 24
- Verified scoring contributions: Baratheon +24 from `faction_membership:sqlite-faction-426172617468656f6e:sqlite-champion-7`; inference rule `war-baratheon-faction` / `war_outpost_rule:baratheon-war-camp`
- Iconic item: Pouch Of Fingers
- Primary substitute: Barristan Selmy (`sqlite-champion-77`) — Provides the closest deterministic team score when Davos Seaworth is unavailable, but no exact primary-mechanic match is verified. Projected team score 129.
- Important conflict: None identified by the target rules.

### Team composition effects

- +3: The team can remove verified debuffs from allies. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified DEF, Durability, Resistance, or BLOCK support. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified healing for sustained battles. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Shield creation enables shield-dependent damage or support. [strategy_inference; `derived:verified-mechanic-combination`]
- +2: Multiple Treasury effects can share coin generation and spending opportunities. [strategy_inference; `derived:verified-mechanic-combination`]
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
- Strategy inferences shown: 10
- Community observations shown: 4; score contribution is always zero.
- Warning: Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- Warning: 22 exact variants with unverified current availability were considered and excluded from primary recommendations.
- Warning: Some selected profiles have incomplete non-strategy metadata: Joffrey Baratheon, Gendry, Davos Seaworth.

## Barricade

- **Target:** `war:barricade`
- **Status:** ready
- **Confidence:** medium

- **Leader:** Ser Duncan the Tall
- **Overall team score:** 93.5

### Exact five and role-preserving substitutes

#### Ser Duncan the Tall (`sqlite-champion-14`)

- Role: Protector
- Individual strategic-fit score: 9
- Verified scoring contributions: Defense and durability +9 from `champion_trait:29`; inference rule `war-barricade-defense` / `war_outpost_rule:barricade`
- Iconic item: No supported connected item shown
- Primary substitute: Jorah Mormont (`sqlite-champion-46`) — Preserves DEFENSE, the main verified function supplied by Ser Duncan the Tall. Projected team score 93.5.
- Important conflict: None identified by the target rules.

#### Ned Stark (`sqlite-champion-2`)

- Role: Protector
- Individual strategic-fit score: 9
- Verified scoring contributions: Defense and durability +9 from `champion_trait:80`; inference rule `war-barricade-defense` / `war_outpost_rule:barricade`
- Iconic item: Ice
- Primary substitute: Craghas Drahar (`sqlite-champion-82`) — Preserves DEFENSE, the main verified function supplied by Ned Stark. Projected team score 87.5.
- Important conflict: None identified by the target rules.

#### Brienne of Tarth (`sqlite-champion-29`)

- Role: Protector
- Individual strategic-fit score: 9
- Verified scoring contributions: Defense and durability +9 from `ability:sqlite-iconic_abilities-15`; inference rule `war-barricade-defense` / `war_outpost_rule:barricade`
- Iconic item: Oathkeeper
- Primary substitute: Craghas Drahar (`sqlite-champion-82`) — Preserves DEFENSE, the main verified function supplied by Brienne of Tarth. Projected team score 88.5.
- Important conflict: None identified by the target rules.

#### Samwell Tarly (`sqlite-champion-39`)

- Role: Protector / Support
- Individual strategic-fit score: 16
- Verified scoring contributions: Defense and durability +9 from `ability:sqlite-iconic_abilities-20`; inference rule `war-barricade-defense` / `war_outpost_rule:barricade` | Debuff removal +7 from `ability:sqlite-iconic_abilities-20`; inference rule `war-barricade-cleanse` / `war_outpost_rule:barricade`
- Iconic item: Dragonglass Dagger
- Primary substitute: Craghas Drahar (`sqlite-champion-82`) — Preserves DEFENSE, the main verified function supplied by Samwell Tarly. Projected team score 79.5.
- Important conflict: None identified by the target rules.

#### Brienne of Tarth - True Knight (`sqlite-champion-51`)

- Role: Protector
- Individual strategic-fit score: 9
- Verified scoring contributions: Defense and durability +9 from `champion_trait:109`; inference rule `war-barricade-defense` / `war_outpost_rule:barricade`
- Iconic item: No supported connected item shown
- Primary substitute: Craghas Drahar (`sqlite-champion-82`) — Preserves DEFENSE, the main verified function supplied by Brienne of Tarth - True Knight. Projected team score 87.5.
- Important conflict: None identified by the target rules.

### Team composition effects

- +3: The team can remove verified debuffs from allies. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified DEF, Durability, Resistance, or BLOCK support. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified healing for sustained battles. [strategy_inference; `derived:verified-mechanic-combination`]
- +3: The team includes a verified TAUNT option for pressure control. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: Cleanse protects a TAUNT champion from disabling debuffs. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Healing helps a TAUNT protector keep absorbing pressure. [strategy_inference; `derived:verified-mechanic-combination`]
- +6: ICE setup enables a teammate's BRITTLE payoff. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Shield creation enables shield-dependent damage or support. [strategy_inference; `derived:verified-mechanic-combination`]
- 0: Ned Stark and Brienne of Tarth appeared together in 1 observed composition; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-2765`]
- 0: Ned Stark and Samwell Tarly appeared together in 2 observed compositions; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-2738,drive-observed-2739`]

### Battle plan

- Overall strategy: Combine the +15% Tenacity rule with durable protection and cleansing.
- Timing and sequence: Preserve cleanses for debuffs that still land through the Tenacity bonus.
- Major dangers: Tenacity reduces risk; it does not guarantee immunity.

### Evidence and limits

- Verified fact links used: 5
- Strategy inferences shown: 14
- Community observations shown: 2; score contribution is always zero.
- Warning: Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- Warning: 22 exact variants with unverified current availability were considered and excluded from primary recommendations.
- Warning: Some selected profiles have incomplete non-strategy metadata: Ser Duncan the Tall, Brienne of Tarth - True Knight.

## Crimson Bastion

- **Target:** `war:crimson-bastion`
- **Status:** ready
- **Confidence:** medium

- **Leader:** Tyrion Lannister - The Half Man
- **Overall team score:** 165.5

### Exact five and role-preserving substitutes

#### Daemon Targaryen (`sqlite-champion-1`)

- Role: Battlefield specialist
- Individual strategic-fit score: 24
- Verified scoring contributions: Red champion +24 from `champion_variant:sqlite-champion-1`; inference rule `war-crimson-red` / `war_outpost_rule:crimson-bastion`
- Iconic item: No supported connected item shown
- Primary substitute: Craster (`sqlite-champion-62`) — Preserves COLOR RED, the main verified function supplied by Daemon Targaryen. Projected team score 165.5.
- Important conflict: None identified by the target rules.

#### Stannis Baratheon — Lord of Storm's End (`sqlite-champion-16`)

- Role: Battlefield specialist
- Individual strategic-fit score: 24
- Verified scoring contributions: Red champion +24 from `champion_variant:sqlite-champion-16`; inference rule `war-crimson-red` / `war_outpost_rule:crimson-bastion`
- Iconic item: Blackwater Blade
- Primary substitute: Alliser Thorne (`sqlite-champion-54`) — Preserves COLOR RED, the main verified function supplied by Stannis Baratheon — Lord of Storm's End. Projected team score 158.5.
- Important conflict: None identified by the target rules.

#### Meleys (`sqlite-champion-25`)

- Role: Battlefield specialist / Protector
- Individual strategic-fit score: 29
- Verified scoring contributions: Red champion +24 from `champion_variant:sqlite-champion-25`; inference rule `war-crimson-red` / `war_outpost_rule:crimson-bastion` | Defense and durability +5 from `ability:sqlite-champion_skills-21`; inference rule `war-crimson-defense` / `war_outpost_rule:crimson-bastion`
- Iconic item: No supported connected item shown
- Primary substitute: Adolescent Drogon (`sqlite-champion-31`) — Preserves COLOR RED, the main verified function supplied by Meleys. Projected team score 160.5.
- Important conflict: None identified by the target rules.

#### Meryn Trant (`sqlite-champion-49`)

- Role: Battlefield specialist / Protector
- Individual strategic-fit score: 29
- Verified scoring contributions: Red champion +24 from `champion_variant:sqlite-champion-49`; inference rule `war-crimson-red` / `war_outpost_rule:crimson-bastion` | Defense and durability +5 from `ability:sqlite-champion_skills-48`; inference rule `war-crimson-defense` / `war_outpost_rule:crimson-bastion`
- Iconic item: No supported connected item shown
- Primary substitute: Craster (`sqlite-champion-62`) — Preserves COLOR RED, the main verified function supplied by Meryn Trant. Projected team score 158.5.
- Important conflict: None identified by the target rules.

#### Tyrion Lannister - The Half Man (`sqlite-champion-74`)

- Role: Battlefield specialist
- Individual strategic-fit score: 24
- Verified scoring contributions: Red champion +24 from `champion_variant:sqlite-champion-74`; inference rule `war-crimson-red` / `war_outpost_rule:crimson-bastion`
- Iconic item: No supported connected item shown
- Primary substitute: Alliser Thorne (`sqlite-champion-54`) — Preserves COLOR RED, the main verified function supplied by Tyrion Lannister - The Half Man. Projected team score 161.
- Important conflict: None identified by the target rules.

### Team composition effects

- +3: The team can remove verified debuffs from allies. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified DEF, Durability, Resistance, or BLOCK support. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified healing for sustained battles. [strategy_inference; `derived:verified-mechanic-combination`]
- +3: The team includes a verified TAUNT option for pressure control. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: Cleanse protects a TAUNT champion from disabling debuffs. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Healing helps a TAUNT protector keep absorbing pressure. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Shield creation enables shield-dependent damage or support. [strategy_inference; `derived:verified-mechanic-combination`]
- +2: Multiple Treasury effects can share coin generation and spending opportunities. [strategy_inference; `derived:verified-mechanic-combination`]

### Battle plan

- Overall strategy: Red champions gain the verified +25% DEF bonus, favoring durable red cores.
- Timing and sequence: Use the defensive bonus to survive enemy Skill cycles.
- Major dangers: The modifier applies according to the recorded phase rule.

### Evidence and limits

- Verified fact links used: 7
- Strategy inferences shown: 15
- Community observations shown: 0; score contribution is always zero.
- Warning: Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- Warning: 22 exact variants with unverified current availability were considered and excluded from primary recommendations.
- Warning: Some selected profiles have incomplete non-strategy metadata: Daemon Targaryen, Meleys, Meryn Trant, Tyrion Lannister - The Half Man.

## Harpy's Pit

- **Target:** `war:harpys-pit`
- **Status:** ready
- **Confidence:** medium

- **Leader:** Meryn Trant
- **Overall team score:** 147

### Exact five and role-preserving substitutes

#### Margaery Tyrell (`sqlite-champion-34`)

- Role: Status payoff
- Individual strategic-fit score: 22
- Verified scoring contributions: WOUND payoff +22 from `ability:sqlite-iconic_abilities-17`; inference rule `war-harpy-wound-payoff` / `war_outpost_rule:harpys-pit`
- Iconic item: Rose Gold Pendant
- Primary substitute: Alicent Hightower (`sqlite-champion-58`) — Provides the closest deterministic team score when Margaery Tyrell is unavailable, but no exact primary-mechanic match is verified. Projected team score 132.
- Important conflict: None identified by the target rules.

#### Euron Greyjoy (`sqlite-champion-36`)

- Role: Status payoff
- Individual strategic-fit score: 22
- Verified scoring contributions: WOUND payoff +22 from `ability:sqlite-iconic_abilities-18`; inference rule `war-harpy-wound-payoff` / `war_outpost_rule:harpys-pit`
- Iconic item: Massive Scorpion
- Primary substitute: Adolescent Rhaegal (`sqlite-champion-33`) — Provides the closest deterministic team score when Euron Greyjoy is unavailable, but no exact primary-mechanic match is verified. Projected team score 126.
- Important conflict: None identified by the target rules.

#### Meryn Trant (`sqlite-champion-49`)

- Role: Status payoff / Tempo control
- Individual strategic-fit score: 29
- Verified scoring contributions: WOUND payoff +22 from `champion_trait:105`; inference rule `war-harpy-wound-payoff` / `war_outpost_rule:harpys-pit` | Fast opening +7 from `champion_trait:105`; inference rule `war-harpy-fast` / `war_outpost_rule:harpys-pit`
- Iconic item: No supported connected item shown
- Primary substitute: Viserys Targaryen III (`sqlite-champion-41`) — Preserves FAST START, the main verified function supplied by Meryn Trant. Projected team score 109.5.
- Important conflict: None identified by the target rules.

#### Cersei Lannister (`sqlite-champion-70`)

- Role: Status payoff / Tempo control
- Individual strategic-fit score: 29
- Verified scoring contributions: WOUND payoff +22 from `ability:sqlite-champion_skills-68`; inference rule `war-harpy-wound-payoff` / `war_outpost_rule:harpys-pit` | Fast opening +7 from `champion_trait:148`; inference rule `war-harpy-fast` / `war_outpost_rule:harpys-pit`
- Iconic item: No supported connected item shown
- Primary substitute: Adolescent Rhaegal (`sqlite-champion-33`) — Preserves FAST START, the main verified function supplied by Cersei Lannister. Projected team score 125.
- Important conflict: None identified by the target rules.

#### Seasmoke (`sqlite-champion-72`)

- Role: Tempo control
- Individual strategic-fit score: 7
- Verified scoring contributions: Fast opening +7 from `champion_trait:153`; inference rule `war-harpy-fast` / `war_outpost_rule:harpys-pit`
- Iconic item: No supported connected item shown
- Primary substitute: Adolescent Rhaegal (`sqlite-champion-33`) — Preserves FAST START, the main verified function supplied by Seasmoke. Projected team score 141.
- Important conflict: None identified by the target rules.

### Team composition effects

- +4: The team includes verified DEF, Durability, Resistance, or BLOCK support. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified healing for sustained battles. [strategy_inference; `derived:verified-mechanic-combination`]
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
- Strategy inferences shown: 13
- Community observations shown: 3; score contribution is always zero.
- Warning: Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- Warning: 22 exact variants with unverified current availability were considered and excluded from primary recommendations.
- Warning: Some selected profiles have incomplete non-strategy metadata: Meryn Trant, Cersei Lannister, Seasmoke.
- Warning: Cersei Lannister has partial source wording for Treasury Generator; only the visible verified mechanic was used.

## Maester's Sigil

- **Target:** `war:maesters-sigil`
- **Status:** ready
- **Confidence:** medium

- **Leader:** Laenor Velaryon
- **Overall team score:** 101

### Exact five and role-preserving substitutes

#### Ned Stark (`sqlite-champion-2`)

- Role: Support
- Individual strategic-fit score: 6
- Verified scoring contributions: Healing +6 from `champion_trait:80`; inference rule `war-maester-heal` / `war_outpost_rule:maesters-sigil`
- Iconic item: Ice
- Primary substitute: Catelyn Stark (`sqlite-champion-71`) — Preserves HEALING, the main verified function supplied by Ned Stark. Projected team score 101.
- Important conflict: None identified by the target rules.

#### Laenor Velaryon (`sqlite-champion-30`)

- Role: Support
- Individual strategic-fit score: 6
- Verified scoring contributions: Healing +6 from `champion_trait:64`; inference rule `war-maester-heal` / `war_outpost_rule:maesters-sigil`
- Iconic item: No supported connected item shown
- Primary substitute: Corlys Velaryon (`sqlite-champion-37`) — Preserves HEALING, the main verified function supplied by Laenor Velaryon. Projected team score 101.
- Important conflict: None identified by the target rules.

#### Samwell Tarly (`sqlite-champion-39`)

- Role: Protector / Support
- Individual strategic-fit score: 24
- Verified scoring contributions: Unnatural resistance +18 from `ability:sqlite-iconic_abilities-20`; inference rule `war-maester-resistance` / `war_outpost_rule:maesters-sigil` | Healing +6 from `champion_trait:84`; inference rule `war-maester-heal` / `war_outpost_rule:maesters-sigil`
- Iconic item: Dragonglass Dagger
- Primary substitute: Alicent Hightower (Queen Dowager) (`sqlite-champion-78`) — Preserves HEALING, the main verified function supplied by Samwell Tarly. Projected team score 83.
- Important conflict: None identified by the target rules.

#### Jorah Mormont (`sqlite-champion-46`)

- Role: Protector
- Individual strategic-fit score: 18
- Verified scoring contributions: Unnatural resistance +18 from `champion_trait:99`; inference rule `war-maester-resistance` / `war_outpost_rule:maesters-sigil`
- Iconic item: No supported connected item shown
- Primary substitute: Adolescent Viserion (`sqlite-champion-26`) — Provides the closest deterministic team score when Jorah Mormont is unavailable, but no exact primary-mechanic match is verified. Projected team score 89.
- Important conflict: None identified by the target rules.

#### Lyanna Mormont (`sqlite-champion-86`)

- Role: Support
- Individual strategic-fit score: 6
- Verified scoring contributions: Healing +6 from `champion_trait:185`; inference rule `war-maester-heal` / `war_outpost_rule:maesters-sigil`
- Iconic item: No supported connected item shown
- Primary substitute: Catelyn Stark (`sqlite-champion-71`) — Preserves HEALING, the main verified function supplied by Lyanna Mormont. Projected team score 95.
- Important conflict: None identified by the target rules.

### Team composition effects

- +3: The team can remove verified debuffs from allies. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified DEF, Durability, Resistance, or BLOCK support. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified healing for sustained battles. [strategy_inference; `derived:verified-mechanic-combination`]
- +3: The team includes a verified TAUNT option for pressure control. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: Cleanse protects a TAUNT champion from disabling debuffs. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Healing helps a TAUNT protector keep absorbing pressure. [strategy_inference; `derived:verified-mechanic-combination`]
- +6: ICE setup enables a teammate's BRITTLE payoff. [strategy_inference; `derived:verified-mechanic-combination`]
- +6: RAID setup enables a teammate's RAID payoff. [strategy_inference; `derived:verified-mechanic-combination`]
- 0: Ned Stark and Samwell Tarly appeared together in 2 observed compositions; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-2738,drive-observed-2739`]

### Battle plan

- Overall strategy: Layer sustain and Unnatural Resistance around the verified +20% resistance buff.
- Timing and sequence: Use the opening resistance window to stabilize and build Stamina.
- Major dangers: The rule supplies resistance; it does not add damage.

### Evidence and limits

- Verified fact links used: 6
- Strategy inferences shown: 14
- Community observations shown: 1; score contribution is always zero.
- Warning: Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- Warning: 22 exact variants with unverified current availability were considered and excluded from primary recommendations.
- Warning: Some selected profiles have incomplete non-strategy metadata: Laenor Velaryon, Jorah Mormont, Lyanna Mormont.

## Ravenous Pack

- **Target:** `war:ravenous-pack`
- **Status:** ready
- **Confidence:** medium

- **Leader:** Meryn Trant
- **Overall team score:** 130

### Exact five and role-preserving substitutes

#### Margaery Tyrell (`sqlite-champion-34`)

- Role: Status payoff
- Individual strategic-fit score: 20
- Verified scoring contributions: WOUND payoff +20 from `ability:sqlite-iconic_abilities-17`; inference rule `war-ravenous-wound-payoff` / `war_outpost_rule:ravenous-pack`
- Iconic item: Rose Gold Pendant
- Primary substitute: Corlys Velaryon (`sqlite-champion-37`) — Provides the closest deterministic team score when Margaery Tyrell is unavailable, but no exact primary-mechanic match is verified. Projected team score 119.
- Important conflict: None identified by the target rules.

#### Euron Greyjoy (`sqlite-champion-36`)

- Role: Status payoff / Damage dealer
- Individual strategic-fit score: 23
- Verified scoring contributions: WOUND payoff +20 from `ability:sqlite-iconic_abilities-18`; inference rule `war-ravenous-wound-payoff` / `war_outpost_rule:ravenous-pack` | Physical damage +3 from `ability:sqlite-champion_skills-33`; inference rule `war-ravenous-damage` / `war_outpost_rule:ravenous-pack`
- Iconic item: Massive Scorpion
- Primary substitute: Barristan Selmy (`sqlite-champion-77`) — Preserves PHYSICAL DAMAGE, the main verified function supplied by Euron Greyjoy. Projected team score 115.
- Important conflict: None identified by the target rules.

#### Benjen Stark (`sqlite-champion-48`)

- Role: Damage dealer
- Individual strategic-fit score: 3
- Verified scoring contributions: Physical damage +3 from `ability:sqlite-champion_skills-47`; inference rule `war-ravenous-damage` / `war_outpost_rule:ravenous-pack`
- Iconic item: No supported connected item shown
- Primary substitute: Viserys Targaryen I (`sqlite-champion-68`) — Preserves PHYSICAL DAMAGE, the main verified function supplied by Benjen Stark. Projected team score 130.
- Important conflict: None identified by the target rules.

#### Meryn Trant (`sqlite-champion-49`)

- Role: Status payoff / Damage dealer
- Individual strategic-fit score: 23
- Verified scoring contributions: WOUND payoff +20 from `champion_trait:105`; inference rule `war-ravenous-wound-payoff` / `war_outpost_rule:ravenous-pack` | Physical damage +3 from `ability:sqlite-champion_skills-48`; inference rule `war-ravenous-damage` / `war_outpost_rule:ravenous-pack`
- Iconic item: No supported connected item shown
- Primary substitute: Daario Naharis (`sqlite-champion-13`) — Preserves PHYSICAL DAMAGE, the main verified function supplied by Meryn Trant. Projected team score 102.5.
- Important conflict: None identified by the target rules.

#### Cersei Lannister (`sqlite-champion-70`)

- Role: Status payoff / Damage dealer
- Individual strategic-fit score: 23
- Verified scoring contributions: WOUND payoff +20 from `ability:sqlite-champion_skills-68`; inference rule `war-ravenous-wound-payoff` / `war_outpost_rule:ravenous-pack` | Physical damage +3 from `ability:sqlite-champion_skills-68`; inference rule `war-ravenous-damage` / `war_outpost_rule:ravenous-pack`
- Iconic item: No supported connected item shown
- Primary substitute: Tormund Giantsbane (`sqlite-champion-61`) — Preserves PHYSICAL DAMAGE, the main verified function supplied by Cersei Lannister. Projected team score 121.
- Important conflict: None identified by the target rules.

### Team composition effects

- +3: The team can remove verified debuffs from allies. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified DEF, Durability, Resistance, or BLOCK support. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified healing for sustained battles. [strategy_inference; `derived:verified-mechanic-combination`]
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
- Strategy inferences shown: 15
- Community observations shown: 3; score contribution is always zero.
- Warning: Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- Warning: 22 exact variants with unverified current availability were considered and excluded from primary recommendations.
- Warning: Some selected profiles have incomplete non-strategy metadata: Benjen Stark, Meryn Trant, Cersei Lannister.
- Warning: Cersei Lannister has partial source wording for Treasury Generator; only the visible verified mechanic was used.

## Scout's Post

- **Target:** `war:scouts-post`
- **Status:** ready
- **Confidence:** medium

- **Leader:** Jaime Lannister
- **Overall team score:** 136

### Exact five and role-preserving substitutes

#### Joffrey Baratheon (`sqlite-champion-22`)

- Role: Status payoff
- Individual strategic-fit score: 24
- Verified scoring contributions: SCOUTED payoff +24 from `champion_trait:47`; inference rule `war-scout-payoff` / `war_outpost_rule:scouts-post`
- Iconic item: Widow's Wail
- Primary substitute: Cersei Lannister (`sqlite-champion-70`) — Provides the closest deterministic team score when Joffrey Baratheon is unavailable, but no exact primary-mechanic match is verified. Projected team score 120.
- Important conflict: None identified by the target rules.

#### Jaime Lannister (`sqlite-champion-45`)

- Role: Tempo control
- Individual strategic-fit score: 8
- Verified scoring contributions: Fast opening +8 from `champion_trait:96`; inference rule `war-scout-fast` / `war_outpost_rule:scouts-post`
- Iconic item: The Kingslayer's Blade
- Primary substitute: Cersei Lannister (`sqlite-champion-70`) — Preserves FAST START, the main verified function supplied by Jaime Lannister. Projected team score 136.
- Important conflict: None identified by the target rules.

#### Lord Varys (`sqlite-champion-50`)

- Role: Status payoff
- Individual strategic-fit score: 24
- Verified scoring contributions: SCOUTED payoff +24 from `champion_trait:108`; inference rule `war-scout-payoff` / `war_outpost_rule:scouts-post`
- Iconic item: No supported connected item shown
- Primary substitute: Benjen Stark (`sqlite-champion-48`) — Provides the closest deterministic team score when Lord Varys is unavailable, but no exact primary-mechanic match is verified. Projected team score 117.
- Important conflict: None identified by the target rules.

#### Davos Seaworth (`sqlite-champion-7`)

- Role: Status payoff
- Individual strategic-fit score: 24
- Verified scoring contributions: SCOUTED payoff +24 from `champion_trait:13`; inference rule `war-scout-payoff` / `war_outpost_rule:scouts-post`
- Iconic item: Pouch Of Fingers
- Primary substitute: Alicent Hightower (`sqlite-champion-58`) — Provides the closest deterministic team score when Davos Seaworth is unavailable, but no exact primary-mechanic match is verified. Projected team score 120.
- Important conflict: None identified by the target rules.

#### Barristan Selmy (`sqlite-champion-77`)

- Role: Status payoff
- Individual strategic-fit score: 24
- Verified scoring contributions: SCOUTED payoff +24 from `ability:sqlite-champion_skills-75`; inference rule `war-scout-payoff` / `war_outpost_rule:scouts-post`
- Iconic item: No supported connected item shown
- Primary substitute: Meryn Trant (`sqlite-champion-49`) — Provides the closest deterministic team score when Barristan Selmy is unavailable, but no exact primary-mechanic match is verified. Projected team score 120.
- Important conflict: None identified by the target rules.

### Team composition effects

- +3: The team can remove verified debuffs from allies. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified DEF, Durability, Resistance, or BLOCK support. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified healing for sustained battles. [strategy_inference; `derived:verified-mechanic-combination`]
- +3: The team includes a verified TAUNT option for pressure control. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: Cleanse protects a TAUNT champion from disabling debuffs. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Healing helps a TAUNT protector keep absorbing pressure. [strategy_inference; `derived:verified-mechanic-combination`]
- +2: Multiple Treasury effects can share coin generation and spending opportunities. [strategy_inference; `derived:verified-mechanic-combination`]
- 0: Joffrey Baratheon and Lord Varys appeared together in 1 observed composition; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-2744`]
- 0: Joffrey Baratheon and Davos Seaworth appeared together in 3 observed compositions; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-2651,drive-observed-2736,drive-observed-2744`]
- 0: Lord Varys and Davos Seaworth appeared together in 3 observed compositions; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-1872-player,drive-observed-2644,drive-observed-2744`]

### Battle plan

- Overall strategy: Use champions whose abilities gain value from SCOUTED enemies during the two-turn opening.
- Timing and sequence: Trigger SCOUTED payoff immediately before the opening mark expires.
- Major dangers: The verified SCOUTED duration is two turns.

### Evidence and limits

- Verified fact links used: 5
- Strategy inferences shown: 12
- Community observations shown: 3; score contribution is always zero.
- Warning: Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- Warning: 22 exact variants with unverified current availability were considered and excluded from primary recommendations.
- Warning: Some selected profiles have incomplete non-strategy metadata: Joffrey Baratheon, Jaime Lannister, Lord Varys, Davos Seaworth, Barristan Selmy.

## Stone Keep

- **Target:** `war:stone-keep`
- **Status:** ready
- **Confidence:** medium

- **Leader:** Ser Duncan the Tall
- **Overall team score:** 184

### Exact five and role-preserving substitutes

#### Sandor Clegane (`sqlite-champion-10`)

- Role: Protector / Support
- Individual strategic-fit score: 32
- Verified scoring contributions: Defense and durability +18 from `ability:sqlite-iconic_abilities-7`; inference rule `war-stone-defense` / `war_outpost_rule:stone-keep` | Shields +8 from `ability:sqlite-champion_skills-7`; inference rule `war-stone-shield` / `war_outpost_rule:stone-keep` | Healing +6 from `champion_trait:19`; inference rule `war-stone-heal` / `war_outpost_rule:stone-keep`
- Iconic item: White Cloak
- Primary substitute: Davos Seaworth (`sqlite-champion-7`) — Preserves DEFENSE and HEALING, the main verified function supplied by Sandor Clegane. Projected team score 176.
- Important conflict: None identified by the target rules.

#### Ser Duncan the Tall (`sqlite-champion-14`)

- Role: Protector / Support
- Individual strategic-fit score: 26
- Verified scoring contributions: Defense and durability +18 from `champion_trait:29`; inference rule `war-stone-defense` / `war_outpost_rule:stone-keep` | Shields +8 from `ability:sqlite-champion_skills-11`; inference rule `war-stone-shield` / `war_outpost_rule:stone-keep`
- Iconic item: No supported connected item shown
- Primary substitute: Ned Stark (`sqlite-champion-2`) — Preserves DEFENSE, the main verified function supplied by Ser Duncan the Tall. Projected team score 173.
- Important conflict: None identified by the target rules.

#### Rhaenyra Targaryen - The King's Chosen Heir (`sqlite-champion-18`)

- Role: Protector / Support
- Individual strategic-fit score: 24
- Verified scoring contributions: Defense and durability +18 from `ability:sqlite-iconic_abilities-11`; inference rule `war-stone-defense` / `war_outpost_rule:stone-keep` | Healing +6 from `champion_trait:38`; inference rule `war-stone-heal` / `war_outpost_rule:stone-keep`
- Iconic item: Valyrian Steel Necklace
- Primary substitute: Davos Seaworth (`sqlite-champion-7`) — Preserves DEFENSE and HEALING, the main verified function supplied by Rhaenyra Targaryen - The King's Chosen Heir. Projected team score 184.
- Important conflict: None identified by the target rules.

#### Brienne of Tarth (`sqlite-champion-29`)

- Role: Protector / Support
- Individual strategic-fit score: 26
- Verified scoring contributions: Defense and durability +18 from `ability:sqlite-iconic_abilities-15`; inference rule `war-stone-defense` / `war_outpost_rule:stone-keep` | Shields +8 from `ability:sqlite-champion_skills-25`; inference rule `war-stone-shield` / `war_outpost_rule:stone-keep`
- Iconic item: Oathkeeper
- Primary substitute: Davos Seaworth (`sqlite-champion-7`) — Preserves DEFENSE, the main verified function supplied by Brienne of Tarth. Projected team score 177.
- Important conflict: None identified by the target rules.

#### Samwell Tarly (`sqlite-champion-39`)

- Role: Protector / Support
- Individual strategic-fit score: 32
- Verified scoring contributions: Defense and durability +18 from `ability:sqlite-iconic_abilities-20`; inference rule `war-stone-defense` / `war_outpost_rule:stone-keep` | Shields +8 from `ability:sqlite-iconic_abilities-20`; inference rule `war-stone-shield` / `war_outpost_rule:stone-keep` | Healing +6 from `champion_trait:84`; inference rule `war-stone-heal` / `war_outpost_rule:stone-keep`
- Iconic item: Dragonglass Dagger
- Primary substitute: Davos Seaworth (`sqlite-champion-7`) — Preserves DEFENSE and HEALING, the main verified function supplied by Samwell Tarly. Projected team score 169.
- Important conflict: None identified by the target rules.

### Team composition effects

- +3: The team can remove verified debuffs from allies. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified DEF, Durability, Resistance, or BLOCK support. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: The team includes verified healing for sustained battles. [strategy_inference; `derived:verified-mechanic-combination`]
- +3: The team includes a verified TAUNT option for pressure control. [strategy_inference; `derived:verified-mechanic-combination`]
- +4: Cleanse protects a TAUNT champion from disabling debuffs. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Healing helps a TAUNT protector keep absorbing pressure. [strategy_inference; `derived:verified-mechanic-combination`]
- +5: Shield creation enables shield-dependent damage or support. [strategy_inference; `derived:verified-mechanic-combination`]
- 0: Sandor Clegane and Ser Duncan the Tall appeared together in 1 observed composition; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-1834`]
- 0: Sandor Clegane and Brienne of Tarth appeared together in 2 observed compositions; no outcome was shown and this does not change the score. [community_observed; `community_team:drive-observed-2643,drive-observed-2651`]

### Battle plan

- Overall strategy: Build a durable team that compounds the verified +10% DEF bonus with shields and healing.
- Timing and sequence: Absorb the first enemy cycle, then use the stable board to coordinate Skills.
- Major dangers: The battlefield bonus improves DEF but does not replace healing or damage.

### Evidence and limits

- Verified fact links used: 11
- Strategy inferences shown: 19
- Community observations shown: 2; score contribution is always zero.
- Warning: Strategic fit uses verified mechanics only; account power, stars, levels, gear, and owned champions are not included.
- Warning: 22 exact variants with unverified current availability were considered and excluded from primary recommendations.
- Warning: Some selected profiles have incomplete non-strategy metadata: Ser Duncan the Tall.

## Five historical source gaps

1. **Teaching Me This Lesson III ending** — exact variant `sqlite-champion-6`; selected targets: Ashen Waste; primary-substitute appearances: none. The cropped ending is not used to create an unverified mechanic.
2. **Joffrey Protector Treasury Generator ending** — exact variant `sqlite-champion-66`; selected targets: none; primary-substitute appearances: none. Only visible wording may be normalized.
3. **Cersei Treasury Generator ending** — exact variant `sqlite-champion-70`; selected targets: Raid attack, Harpy's Pit, Ravenous Pack; primary-substitute appearances: Raid defense for Adolescent Rhaegal, Raid defense for Meryn Trant, Scout's Post for Joffrey Baratheon, Scout's Post for Jaime Lannister. When her visible Treasury mechanic contributes to a team synergy, the result emits a partial-source warning.
4. **Crownlands Knight identity** — no exact variant ID exists. Ambiguous observed names are discarded before pair construction, so this position never affects selection or score.
5. **Red Woman’s Ruby Necklace image** — Melisandre (`sqlite-champion-42`) selected targets: none; primary-substitute appearances: none. The verified item relationship and wording remain usable; the absent image has no score effect.

## Acceptance findings and corrections

- Community co-occurrence previously added a small bonus for every observed pair; ten pair bonuses could collectively outweigh a verified mechanical difference. Community observations now contribute zero points and remain explanatory context only.
- Substitutes previously came from the next global candidate scores. Every selected member now receives a primary substitute chosen first by overlap with that member’s positive target mechanics, then by the projected replacement-team score.
- Leader selection previously accepted any source-backed Leader row. It now requires complete review status and at least 0.8 confidence.
- Final calibration removed candidate-level fractions of Leader scores and the separate generic Leader-coverage bonus. Leadership now scores exactly once for the selected Leader.
- Team synergies now use ordinary Skill, Trait, and item mechanics plus the selected Leader’s Leader mechanics. Inactive Leader traits cannot create team coverage or setup/payoff bonuses.
- The generic shared-faction bonus was removed because faction membership alone does not prove a battle bonus. Explicit encounter and battlefield faction rules remain active.
- DEF and FIRE-payoff extraction was narrowed so enemy resistance reductions and ordinary FIRE application no longer masquerade as defensive support or payoff.
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

