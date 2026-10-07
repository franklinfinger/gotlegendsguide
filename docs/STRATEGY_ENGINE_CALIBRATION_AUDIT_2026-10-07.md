# Final Strategy Calibration Audit — 2026-10-07

## Acceptance judgment

**B. PHASE 3 CALIBRATION PASSED AFTER FIXES**

The final five for Drogon is unchanged under all requested perturbations. The audit did find and correct identifiable double counting and fact-extraction defects. No target-fit weight was tuned to force a composition, and community observations remain zero-score context.

## Drogon decomposition

**Final team score:** 189. **Leader:** Alicent Hightower. Direct member scores total 157; positive direct rules total 163; two Treasury penalties total -6; team effects total +18; selected Leader effect +14.

| Champion | Individual fit | Positive rules | Negative rules | Team/faction/leader effects | Marginal contribution |
|---|---:|---|---|---|---:|
| Tywin Lannister | 23 | `drogon-birthright` (birthright +22); `drogon-physical` (physical_damage +4) | `drogon-treasury` (treasury -3) | Enables +2 Treasury pair; no faction points; inactive Leader score 0. | 25 |
| Gwayne Hightower | 39 | `drogon-birthright` (birthright +22); `drogon-physical` (physical_damage +4); `drogon-stamina` (stamina +8); `drogon-true` (true_damage +5) | none | No unique team bonus; no faction points; inactive Leader score 0. | 39 |
| Meryn Trant | 15 | `drogon-fast-start` (fast_start +6); `drogon-physical` (physical_damage +4); `drogon-stamina` (stamina +8) | `drogon-treasury` (treasury -3) | Uniquely preserves defense +4, taunt +3, heal/taunt +5, and Treasury pair +2 in this five; no faction points. | 29 |
| Alicent Hightower | 40 | `drogon-birthright` (birthright +22); `drogon-fast-start` (fast_start +6); `drogon-physical` (physical_damage +4); `drogon-stamina` (stamina +8) | none | Selected Leader +14. If removed, Otto supplies +10, so net Leader marginal is +4; no faction points. | 44 |
| Otto Hightower | 40 | `drogon-birthright` (birthright +22); `drogon-fast-start` (fast_start +6); `drogon-physical` (physical_damage +4); `drogon-stamina` (stamina +8) | none | No unique team bonus; no faction points; inactive Leader score 0. | 40 |

Applied team effects: defense coverage +4, healing coverage +4, taunt coverage +3, healing plus taunt +5, and the two-member Treasury interaction +2. The model has no explicit redundancy penalty; redundant mechanics lose only the opportunity to add new coverage or a complementary setup/payoff bonus. The former generic faction bonus was removed during calibration.

### Ten highest near misses

| Rank | Candidate | Individual | Best replacement | Projected team | Delta | Mechanics and team effects lost/gained |
|---:|---|---:|---|---:|---:|---|
| 1 | Adolescent Rhaegal | 18 | Tywin Lannister | 182 | -7 | Loses BIRTHRIGHT and Tywin’s second Treasury source; gains fast opening and Stamina. |
| 2 | Adolescent Viserion | 18 | Tywin Lannister | 182 | -7 | Loses BIRTHRIGHT and the Treasury pair; gains Free Cities and Stamina. |
| 3 | Arya Stark - Winterfell Returned | 18 | Tywin Lannister | 182 | -7 | Loses BIRTHRIGHT and the Treasury pair; gains fast opening and Stamina. |
| 4 | Daario Naharis | 18 | Meryn Trant | 186 | -3 | Loses fast opening, defense coverage, and the Treasury pair; gains Free Cities. His higher individual score cannot recover the lost team effects. |
| 5 | Ygritte | 18 | Tywin Lannister | 182 | -7 | Loses BIRTHRIGHT and the Treasury pair; gains fast opening and Stamina. |
| 6 | Cersei Lannister | 15 | Tywin Lannister | 181 | -8 | Loses BIRTHRIGHT; gains fast opening and Stamina. Treasury coverage remains, but direct fit is eight points lower. |
| 7 | Daenerys Targaryen - Khaleesi of the Great Grass Sea | 14 | Tywin Lannister | 178 | -11 | Loses BIRTHRIGHT, Physical Damage, and the Treasury pair; gains Free Cities and Stamina. |
| 8 | Brienne of Tarth - True Knight | 12 | Tywin Lannister | 176 | -13 | Loses BIRTHRIGHT and the Treasury pair; gains Stamina. |
| 9 | Ghost | 12 | Tywin Lannister | 176 | -13 | Loses BIRTHRIGHT and the Treasury pair; gains Stamina. |
| 10 | Jon Snow — King in the North | 12 | Tywin Lannister | 176 | -13 | Loses BIRTHRIGHT and the Treasury pair; gains Stamina. |

## Drogon sensitivity

All adjustments below were in memory only. Every test returned the same exact five and Alicent as Leader.

| Perturbation | Score | Team changed? |
|---|---:|---|
| BIRTHRIGHT -10% | 179.1 | No |
| BIRTHRIGHT -20% | 169.2 | No |
| Stamina -10% | 185.8 | No |
| Fast opening -10% | 187.2 | No |
| Physical Damage +10% | 191 | No |
| True Damage +10% | 189.5 | No |
| Free Cities +10% | 189 | No |

BIRTHRIGHT is 88 of 163 positive direct points (54.0%), so it is intentionally the largest Drogon signal. Its dominance is supported by the verified encounter rule and does not make the composition brittle: a 20% reduction leaves the same team.

## Plausible Drogon alternatives

| Score | Exact variants | Concept | Better | Worse and rejection reason |
|---:|---|---|---|---|
| 186 | Tywin; Gwayne; Daario; Alicent; Otto | Four BIRTHRIGHT sources with Free Cities pressure | Daario adds explicit Free Cities fit and raises the replacement slot’s individual score | Replacing Meryn loses fast opening, defense coverage, and the Treasury pair; net -3 |
| 182 | Adolescent Rhaegal; Gwayne; Meryn; Alicent; Otto | Faster Skill rotation and Stamina | Adds fast opening and Stamina in Tywin’s slot | Loses one BIRTHRIGHT source and the Treasury pair; net -7 |
| 181 | Cersei; Gwayne; Meryn; Alicent; Otto | Opening control and Treasury tempo | Adds fast opening and Stamina while keeping the Treasury interaction | Loses Tywin’s BIRTHRIGHT contribution; net -8 |

## Raid Attack

The originally reported five scores **162.5** after correction: Icy Viserion, Gwayne, Meryn, Rhaenys, Lyanna; Gwayne Leader. The accepted result is now **163.5**: Icy Viserion, Meryn, Cersei, Rhaenys, Lyanna; Lyanna Leader. This one-point change follows from removing inactive and repeated Leader scoring; it was not weight tuning.

| Selected champion | Individual score | Main direct fit | Marginal |
|---|---:|---|---:|
| Icy Viserion | 20 | buff_removal +7, stamina +6, unnatural_damage +7 | 33 |
| Meryn Trant | 26 | stun +6, fast_start +6, physical_damage +8, stamina +6 | 44 |
| Cersei Lannister | 26 | stun +6, fast_start +6, physical_damage +8, stamina +6 | 28 |
| Rhaenys Targaryen | 27 | stun +6, physical_damage +8, buff_removal +7, stamina +6 | 33 |
| Lyanna Mormont | 17 | healing +3, physical_damage +8, stamina +6 | 42.5 |

Strategic identity: Meryn and Cersei provide opening STUN, fast effects, Physical Damage, and Stamina; Rhaenys adds STUN plus buff removal; Icy Viserion adds buff removal, Stamina, and Unnatural Damage; Lyanna supplies sustain and the selected Leader package. Active verified facts also provide cleanse, defense, taunt, ICE/BRITTLE, and RAID/payoff coverage. Physical Damage is the largest direct mechanic at 32 of 116 positive points (27.6%); no faction, status, Stamina, Leader, or role weight dominates.

### Five Raid Attack misses

| Candidate | Individual | Best replacement | Projected | Delta | Why it loses |
|---|---:|---|---:|---:|---|
| Adolescent Rhaegal | 26 | Cersei Lannister | 161.5 | -2 | Same direct mechanics as Cersei in the comparison, but supplies one fewer team interaction. |
| Gwayne Hightower | 26 | Cersei Lannister | 162.5 | -1 | Trades STUN and fast opening for healing and True Damage. Direct score ties Cersei, but the team loses the +2 Treasury interaction and gains one Leader point, net -1. |
| Adolescent Viserion | 24 | Cersei Lannister | 159.5 | -4 | Trades STUN and fast opening for healing and buff removal; those roles are already covered. |
| Alicent Hightower | 23 | Cersei Lannister | 158.5 | -5 | Trades STUN for healing, which is already covered, and is five points lower as a team. |
| Margaery Tyrell | 23 | Cersei Lannister | 160.5 | -3 | Adds healing, buff removal, and Unnatural Damage but loses STUN, fast opening, and Physical Damage; net -3. |

## Four target spot checks

### Rhaegal

**Recommended:** Rhaenyra Targaryen - The King's Chosen Heir; Osha; Alicent Hightower (Queen Dowager); Walder Frey; Rhaenyra Targaryen. **Leader:** Osha. **Score:** 253.5.

**Next three:** Ramsay Bolton (31 individual; 250 best team); Roose Bolton (31 individual; 250 best team); Adolescent Drogon (29 individual; 245.5 best team).

BLEED application/payoff, FIRE application, healing, and the chosen Leader’s active mechanics decide the result. Healing is largest at 60/221 positive direct points (27.1%), so no rule dominates. Ramsay and Roose tie Osha’s direct 31 but score 3.5 lower after Leader and team effects. Adolescent Drogon replaces Alicent but loses healing for Fire Damage.

### Viserion

**Recommended:** Ned Stark; Arya Stark - Winterfell Returned; Rickard Karstark; Tormund Giantsbane; Lyanna Mormont. **Leader:** Ned Stark. **Score:** 302.5.

**Next three:** Brienne of Tarth - True Knight (41 individual; 302.5 best team); Ghost (41 individual; 302.5 best team); Robb Stark (32 individual; 293.5 best team).

ICE and BRITTLE plus RAID and RAID payoff decide the result. Apply ICE is largest at 95/271 (35.1%). Brienne and Ghost are exact score ties with Arya at 302.5 and are resolved by deterministic variant ordering; Robb is nine points lower. These are interchangeable mechanics, not a weight instability.

### Raid Defense

**Recommended:** Sandor Clegane; Ser Duncan the Tall; Adolescent Rhaegal; Samwell Tarly; Meryn Trant. **Leader:** Ser Duncan the Tall. **Score:** 207.

**Next three:** Ned Stark (28 individual; 205 best team); Cersei Lannister (23 individual; 200 best team); Petyr Baelish (23 individual; 205 best team).

Defense, shields, healing, taunt, and automatic opening control form the result. Defense is largest at 36/161 (22.4%). Ned and Petyr each reach 205 through different sustain packages, two points short. Cersei is seven points short because Adolescent Rhaegal adds PACIFY.

### Ashen Waste

**Recommended:** Daenerys Targaryen - Mother Of Dragons; Stannis Baratheon — Lord of Storm's End; Rhaenyra Targaryen - The King's Chosen Heir; Adolescent Drogon; Daenerys Targaryen - Conqueror Of Qarth. **Leader:** Rhaenyra Targaryen - The King's Chosen Heir. **Score:** 136.

**Next three:** Beric Dondarrion (6 individual; 124 best team); Jacaerys Velaryon (6 individual; 131 best team); Meleys (6 individual; 124 best team).

Enemy-starting FIRE makes verified enemy-FIRE payoff the intended primary rule. It supplies 60/90 positive direct points (66.7%). Jacaerys reaches 131, five points short; Beric and Meleys reach 124, twelve short. Their direct Fire Damage ties, but the chosen fifth slots preserve more complementary coverage and Leader value.

## Concentration and double counting

The direct-score concentration scan covered all 14 targets with sufficient evidence. High War percentages reflect explicit battlefield rules that deliberately make one mechanic decisive: Baratheon War Camp 100% faction Baratheon, Crimson Bastion 92.3% red, Scout’s Post 92.3% SCOUT payoff, Ravenous Pack 87.0% WOUND payoff, Barricade 86.5% defense, Harpy’s Pit 80.7% WOUND payoff, Stone Keep 64.3% defense, and Maester’s Sigil 60.0% Unnatural Resistance. These are target definitions rather than duplicate rewards.

The shared-source scan found 93 cases where one verified card supports multiple distinct mechanics. Inspection showed explicit multi-effect wording, such as Gwayne’s Skill containing both Physical and True Damage, Meryn’s trait containing STUN, fast start, and Stamina, or Lyanna’s Skill containing ICE, RAID, Physical Damage, and RAID payoff. A champion is still scored at most once per mechanic, so duplicate screenshots or repeated facts do not multiply a rule.

### Corrected defects

1. **Leader score repeated across candidates.** Old: each candidate received 25% of positive Leader potential, the selected Leader received the full value, and a generic Leader coverage rule added +2. New: only the selected Leader receives Leader potential; the generic +2 rule was removed.
2. **Inactive Leader mechanics enabled synergies.** Old: every Leader trait was included in team mechanics. New: ordinary mechanics always apply, and Leader mechanics apply only for the selected Leader.
3. **Generic faction points.** Old: every second through fifth same-faction member received arbitrary shared-faction points, overlapping explicit faction target rules. New: only source-backed target rules and verified mechanics score faction identity.
4. **Defense direction false positives.** Old: any DEF, Durability, Resistance, or BLOCK phrase matched, including reductions applied to enemies. New: extraction requires positive gain, grant, start, possession, immunity, or TAUNT durability wording.
5. **FIRE payoff false positives.** Old: ordinary Fire Damage and FIRE application could match payoff. New: payoff requires verified benefit from FIRE already present on an enemy or target. Valid FIRE-payoff facts fell to six.

No target-fit weights were changed. Community-observed compositions remain score 0 and were not used as an optimization target.

## Updated recommendations

Drogon and Viserion remain unchanged. Raid Attack, Rhaegal, Raid Defense, and Ashen Waste changed after the modeling fixes:

- Raid Attack: Icy Viserion; Meryn Trant; Cersei Lannister; Rhaenys Targaryen; Lyanna Mormont. Leader: Lyanna.
- Rhaegal: Rhaenyra — The King’s Chosen Heir; Osha; Alicent Queen Dowager; Walder Frey; Rhaenyra. Leader: Osha.
- Raid Defense: Sandor; Ser Duncan; Adolescent Rhaegal; Samwell; Meryn. Leader: Ser Duncan.
- Ashen Waste: Daenerys Mother of Dragons; Stannis Lord of Storm’s End; Rhaenyra King’s Chosen Heir; Adolescent Drogon; Daenerys Conqueror of Qarth. Leader: Rhaenyra King’s Chosen Heir.

## Verification summary

Live strategy read model after migration: 1048 champion facts, 92 rules, and 108 exact variants. Full command results are recorded in the completion report for the commit.
