# GOT Legends Guide Canonical Data Audit

## Scope and ground rules

This is a repository inventory and reconciliation plan, not a correction of game data. It does not alter champion JSON, portrait mappings, application behavior, or production. The external archive of 833 recovered screenshots is not in this repository and was not inspected. Any repository statement that refers to screenshots remains unverified until it is linked to the exact evidence.

For this audit, **functional champion data** means the ordered merge performed by `app.js`: `champions-part1.json` followed by `champions-part2.json`. The current code silently keeps the first record for each ID. The audit reports both the raw source and the effective result because silently discarding duplicates is not acceptable canonical behavior.

## Executive inventory

| Measure | Exact result |
|---|---:|
| `champions-part1.json` records | 50 |
| `champions-part2.json` records | 40 |
| Raw functional records | 90 |
| Unique functional IDs | 88 |
| Unique exact names | 88 |
| Duplicate IDs | 2: `khaldrogo`, `laenor` |
| Duplicate exact names | 2: Khal Drogo, Laenor Velaryon |
| Portrait definitions | 93 |
| Unique portrait keys | 83 |
| Functional IDs without a portrait key | 12 |
| Portrait keys without a functional ID | 7 |
| Portrait keys defined more than once | 9 |

Repository count labels already drift: `app.js` says 78 champions, `champions.json` says 134 total, and the actual split files contain 90 raw records / 88 unique IDs.

## 1. Champion identity reconciliation

### Duplicate functional IDs

#### `khaldrogo`

- **Current state:** One record appears at part 1 index 46 and another at part 2 index 1. Identity, faction, roles, tags, ally, leader value, and mode scores agree. The part 1 `why` is `Crit pressure. Ally with Daenerys.`; part 2 says `Crit pressure.`. `app.js` silently retains the part 1 record.
- **Evidence:** `champions-part1.json`, `champions-part2.json`, and the first-wins filter in `app.js::fetchChampions()`.
- **Proposed resolution:** Stage both source rows under separate import-row IDs. After identity evidence confirms they describe the same playable variant, retain `khaldrogo` as the compatibility ID, create one canonical variant, and link both source rows. Do not choose or merge the differing `why` text without evidence; strategy prose belongs in claims/relationships, not identity.
- **Confidence:** High that this is a duplicate identity; low that either strategy sentence is authoritative.
- **Validation needed:** Exact screenshot/card identity, variant/subtitle and gem color, current ally mechanic, and provenance for the strategy description.

#### `laenor`

- **Current state:** One record appears at part 1 index 47 and another at part 2 index 2. The first has tags `fleet`, `raid` and `why: Healing + Raid.`; the second has only `raid` and `why: Heal + Raid.`. Other fields agree. `app.js` silently retains the part 1 record.
- **Evidence:** `champions-part1.json`, `champions-part2.json`, and `app.js::fetchChampions()`.
- **Proposed resolution:** Stage both rows independently. Preserve `laenor` only after evidence confirms one playable variant. Treat `fleet` and the healing wording as disputed assertions until verified.
- **Confidence:** High that the rows intend the same identity; medium that `fleet` is a real current mechanic.
- **Validation needed:** Exact card/subtitle/color, current skills and traits, and screenshot evidence for `fleet`, healing, and Raid.

### Same-character and variant ambiguity

The current `id` often represents a character name, while manual pages distinguish multiple playable variants. A canonical system must separate a story character from each playable champion variant and from a battle-mode boss.

| Character/family | Current state | Evidence | Proposed resolution | Confidence | Validation needed |
|---|---|---|---|---|---|
| Daenerys Targaryen | Functional data has only `daenerys`, explicitly named Blue. Manual pages also reference Yellow/Khaleesi and Red, plus “dual Dany” and “second Dany.” | JSON; `index.html`; `builder.html`; `dragons.html`; `factions.html` | Create one character record and distinct variant records. Preserve `daenerys` as a legacy alias for Blue only after confirmation. | High that multiple variants exist | Exact subtitle, gem color, factions, skills, portrait, and ally pair for each variant |
| Stannis Baratheon | One generic functional `stannis`; faction page names Red and Purple variants. | JSON; `factions.html` | Do not assign the generic ID to either color yet. Create variant candidates and map the legacy ID after evidence. | High ambiguity | Determine which variant the JSON/portrait represents and validate both cards |
| Joffrey Baratheon | One generic functional `joffrey`; faction page distinguishes Blue and Yellow. | JSON; `factions.html`; two different portrait files use key `joffrey` | Split variants; one shared portrait key cannot identify both. | High ambiguity | Match each portrait and all faction/ally/skill claims to a color/subtitle |
| Cersei Lannister | One generic functional `cersei`; faction page distinguishes Yellow and Blue. | JSON; `factions.html` | Split variants and map legacy `cersei` only after identifying it. | High ambiguity | Card titles, colors, factions, skills, and portrait assignment |
| Tyrion Lannister | One generic functional `tyrion`; faction page distinguishes Purple and Red. | JSON; `factions.html` | Split variants; make ally relationships variant-specific where required. | High ambiguity | Which Tyrion pairs with Bronn and which strategy claims apply to each |
| Jon Snow | One generic functional `jon`; faction page names two Blue variants with distinct subtitles: King of the North and Battle of the Bastards. | JSON; `factions.html` | Use subtitle/release identity, not name+color alone, to distinguish variants. | High ambiguity | Match legacy ID and portrait to the correct subtitle; verify Ghost relationship |
| Rhaenyra Targaryen | One generic functional `rhaenyra`; faction page names Purple and Yellow. | JSON; `factions.html` | Split variants and attach factions/skills per card. | High ambiguity | Identify current JSON/portrait variant and verify both cards |
| Viserys Targaryen | One functional record combines Free Cities + Targaryen and an Alicent ally. Manual sources separately name Viserys III and Viserys I. These are different characters, not variants of one character. | JSON `viserys` and Alicent ally text; `factions.html`; `allies.html` | Create separate character records for Viserys I and Viserys III. Quarantine legacy `viserys` until each field is assigned to the correct person. | Very high conflict | Exact portrait identity, faction, skills, gem color, and ally relationship for both |
| Drogon | Functional `drogon`, a portrait/manual reference to Adolescent Drogon, and a Drogon boss strategy coexist. | JSON; `p-adolescentdrogon.js`; `factions.html`; `dragons.html` | Separate character, playable variants/forms, and boss encounter identity. | High structural ambiguity | Confirm whether each asset/reference is playable champion or encounter boss |
| Viserion | Functional Adolescent Viserion, portrait/manual Icy Viserion, and Viserion/Icy boss strategy coexist. | JSON; `p-icyviserion.js`; `factions.html`; `dragons.html` | Separate playable variants from encounter bosses; relate them through a shared lore character only if useful. | High structural ambiguity | Confirm playable status and exact identity of Icy Viserion; version boss encounters |
| Rhaegal | Functional Adolescent Rhaegal and a Rhaegal boss encounter share the name family. | JSON; `dragons.html` | Keep playable variant and encounter boss as separate entity types. | High | Confirm variant identity and boss encounter version |

Additional color labels in `factions.html`—Arya Purple, Criston Purple, and Alicent Green—are not represented in structured fields. Brienne is named Yellow in JSON, but the JSON `color` value is a CSS hex used for presentation. Only Daenerys has `displayColor`. The current `color`/`text` fields must not be treated as game gem color.

### Referenced identities absent from functional champion data

These exact identities have no record in either functional JSON file. Generic variant collisions are listed separately below.

| Missing functional identity | Repository evidence | Reconciliation status |
|---|---|---|
| Adolescent Drogon | `factions.html`; `p-adolescentdrogon.js` | Candidate playable variant; evidence required |
| Alliser Thorne | `factions.html`; `builder.html`; `p-alliser.js` | Candidate champion; evidence required |
| Craghas Drahar | `factions.html`; `p-craghas.js` | Candidate champion; evidence required |
| Craster | `factions.html`; `p-craster.js` | Candidate champion; evidence required |
| Grey Wind | `factions.html` | Candidate champion; no portrait mapping found |
| Icy Viserion | `factions.html`; `status-effects.html`; `dragons.html`; `p-icyviserion.js` | Identity type ambiguous: champion reference and encounter boss both exist |
| Meryn Trant | `index.html`; `builder.html`; `dragons.html`; `factions.html`; `app.js`; `prototype-raid-counter.html`; `portraits-lan-4.js` | Highest-priority missing champion because live strategy depends on it |
| Osha | `factions.html`; `builder.html`; `dragons.html`; `p-osha.js` | Candidate champion; evidence required |

The following exact variant references also lack exact variant records, although one generic same-character record exists and may represent one of them: Daenerys Yellow/Khaleesi; Daenerys Red; Stannis Red; Stannis Purple; Joffrey Blue; Joffrey Yellow; Cersei Yellow; Cersei Blue; Tyrion Purple; Tyrion Red; Jon Snow Blue—King of the North; Jon Snow Blue—Battle of the Bastards; Rhaenyra Purple; Rhaenyra Yellow; Viserys I; and Viserys III. Arya Purple, Criston Purple, and Alicent Green are unresolved color labels on otherwise single generic records.

### Portrait reconciliation

#### Functional champion IDs without portrait mappings

`baela`, `balon`, `doran`, `drogon`, `ellaria`, `harwin`, `helaena`, `hizdahr`, `illyrio`, `jeor`, `larys`, `loras`.

#### Portrait keys without functional champion records

`adolescentdrogon`, `alliser`, `craghas`, `craster`, `icyviserion`, `meryn`, `osha`.

Grey Wind is referenced in `factions.html` but has neither a functional record nor a portrait key.

#### Portrait keys defined more than once

All nine duplicate keys have conflicting binary definitions in at least one file. For Adolescent Viserion, two of the three payloads are identical, but the third differs. Script load order therefore chooses assets implicitly and can yield page-specific results.

| Key | Definitions | Proposed resolution / validation |
|---|---|---|
| `adolescentrhaegal` | `p-adolescentrhaegal.js`, `portraits-fc-1a.js` | Visually identify both, choose an evidence-linked asset, retain the other as a source candidate |
| `adolescentviserion` | `p-adolescentviserion.js`, `portraits-fc-1.js`, `portraits-fc-1a.js` | Two payloads match and one differs; validate subject/crop and remove load-order authority |
| `brienne` | `p-brienne.js`, `portraits-bara-1.js` | Match each asset to exact variant; current pages load different winners |
| `euron` | `portraits-greyjoy.js`, `portraits-lan-4.js` | Validate exact variant/faction context; do not let later script win silently |
| `gendry` | `p-gendry.js`, `portraits-bara-2.js` | Validate subject and preferred crop |
| `joffrey` | `portraits-bara-1.js`, `portraits-lan-3.js` | Likely variant-sensitive; assign assets to explicit variant IDs |
| `sandor` | `portraits-bara-0.js`, `portraits-lan-1.js` | Validate subject/variant/crop and assign explicitly |
| `tyland` | `p-tyland.js`, `portraits-lan-5.js` | Validate subject and preferred crop |
| `varys` | `p-varys.js`, `portraits-bara-1.js` | Validate subject/variant/crop; current page load order differs |

### Identity conflict register

Every unresolved identity conflict must be migrated as a conflict, not normalized away.

| Conflict | Current state | Evidence | Proposed resolution | Confidence | Validation needed |
|---|---|---|---|---|---|
| Counts | Comments claim 78 and 134; source contains 90/88 | `app.js`; `champions.json`; split JSON | Generate counts from validated data; never hand-maintain totals | Confirmed | None for repository count; game completeness remains unknown |
| Duplicate IDs | `khaldrogo`, `laenor` are silently first-wins | Split JSON; `app.js` | Stage/import all rows, block canonical publish until adjudicated | Confirmed | See duplicate sections |
| Missing Meryn | Strategy and portrait use `meryn`; functional JSON does not | Multiple pages/code; portrait file | Add only after exact identity evidence; link all legacy claims as unverified | Confirmed repository mismatch | Champion card and skill evidence |
| Viserys conflation | One generic record appears to mix I and III | JSON; faction/allies pages | Split characters; quarantine legacy mapping | Very high | Exact cards and portrait |
| Variant groups | Generic IDs collide with color/subtitle variants | JSON; faction and strategy pages | Character + variant model with legacy aliases | High | Exact variant evidence |
| Color semantics | CSS hex is the only general `color` field | JSON and avatar rendering | Rename UI palette fields in canonical import; add explicit `gem_color_id` | Confirmed schema problem | Verify every variant's gem color |
| Portrait mismatch | 12 missing, 7 orphan keys, 9 duplicate keys | All portrait scripts vs functional IDs | Asset manifest keyed to variant ID with evidence and active status | Confirmed | Visual/evidence review |
| Ally target ambiguity | Name strings, slash-delimited targets, and generic variants | JSON `ally`; `allies.html` | Normalize relationships to variant IDs; stage unresolved name references | Confirmed schema problem | Verify direction, exact pair, effect, and variant |
| Faction drift | Manual lists and JSON disagree on membership and variants | `factions.html` vs JSON | Treat both as source claims; verify per variant before canonical activation | Confirmed | Screenshot/official faction evidence |
| Strategy identity matching | `builder.html` finds champions by fuzzy name fragments | `builder.html::findChamp()` | Canonical strategy must use exact variant IDs; no fuzzy resolution | Confirmed | Resolve all lineup members before migration |

## 2. Knowledge-source inventory

### Source catalog

| Source | Knowledge held | Authority/problems |
|---|---|---|
| `champions-part1.json` (v6), `champions-part2.json` (v7) | Functional identity, UI colors, rarity, factions, roles, tags, free-text ally, leader score, mode scores, short “why” | No field-level evidence; duplicates; variant ambiguity; strategy and facts mixed |
| `champions.json` (v5) | Empty compatibility/manifest-like file | Stale “134 total” note; not data |
| `champions-embed.js` | Empty fallback | Stale “78 legendaries” note |
| `app.js` | Merge/dedup behavior, roster state, opaque scoring heuristics, War/Raid/Dragon profiles and strategy | Silently discards duplicate IDs; converts undocumented scores/tags into recommendations; duplicates page prose |
| `builder.html` | Hard-coded mode shapes, lineups, explanations, alternatives and alliance-observed claims | Duplicates `app.js`, `index.html`, and `dragons.html`; fuzzy name matching; missing identities become fallbacks |
| `index.html` | Raid shapes, War shapes/outpost advice, dragon quick reference, role glossary, tips | Manual prose with no per-claim evidence; variants not consistently identified |
| `dragons.html` | Richest boss mechanics, named abilities, teams, alternatives, “why,” strategy, War/Raid summaries | Mixes purported screenshot facts, official tips, leaderboard inference, and alliance tests in one document without atomic provenance |
| `factions.html` | Faction bonuses, manual champion lists, color/subtitle variants, dual-faction list | Substantial drift from JSON; no evidence references or version |
| `status-effects.html` | Short status/mechanic definitions and champion examples | Says definitions came from tooltips but has no screenshot IDs; fact and strategy are combined |
| `allies.html` | Twelve named ally pairs and effect summaries | Names rather than IDs; incomplete versus JSON; mostly no exact effect text/evidence |
| `champions.html`, `roster.html` | Render functional records and portraits | No independent knowledge; expose first-wins deduped view |
| Portrait scripts and `avatar-fix.js` | Base64 assets keyed by legacy champion-like strings | Orphan/missing/duplicate keys; load-order behavior; no source/evidence metadata |
| `prototype-raid-counter.html` | A deliberately bounded legacy Meryn scenario and Derived target-priority example | Useful staging example, explicitly not canonical evidence |
| `avatar-demo.html` | Notes one Gregor crop came from a profile screenshot | No filename or archive reference |
| Product/design documents | Product intent and future UX | Not game-knowledge evidence |

### Category-to-source map

| Knowledge category | Current locations | Drift risk |
|---|---|---|
| Champion identity | Split JSON; faction lists; portrait keys; hard-coded lineups | Critical: generic IDs, missing records, variants, bosses |
| Champion classification/rarity | Split JSON; page text says Legendary only | High: count labels disagree and completeness is unknown |
| Gem color | Variant labels in names/faction prose; one `displayColor`; CSS hex `color` | Critical: UI color and game color are conflated |
| Faction | Split JSON and `factions.html`; strategy prose | Critical: membership differs and manual lists include variants absent from JSON |
| Roles | JSON roles; role glossary; builder/app lineup labels | High: factual mechanics and editorial team jobs are mixed |
| Traits | JSON tags; dragon ability prose; status page | High: `tags` combines traits, statuses, mechanics, faction words, and strategy labels |
| Skills | Primarily `dragons.html`; isolated `why` fields/tags | Critical: no reusable skill records, versions, or evidence links |
| Leader abilities | Numeric JSON `leader`; prose/heuristics across app/pages | Critical: number semantics undocumented; ability text absent |
| Status effects | `status-effects.html`; JSON tags; dragon mechanics; strategy prose | High: definitions and champion application claims can disagree |
| Synergies | JSON `ally`; `allies.html`; team shapes; `why` fields | Critical: name strings, no conditions, variants unresolved |
| Allies | JSON `ally`; `allies.html` | High: manual list omits several JSON relationships and variants |
| Counters | Dragon pages; Raid/War prose; prototype | Critical: mostly interpretation without structured target/mechanism/evidence |
| Raid strategy | `index.html`; `builder.html`; `app.js`; `dragons.html`; prototype | Critical duplication and drift |
| War strategy | `index.html`; `builder.html`; `app.js`; `dragons.html` | Critical duplication and drift |
| Dragon strategy | `dragons.html`; `builder.html`; `app.js`; `index.html` | Critical duplication; source classes mixed |
| Team cores | `index.html`; `builder.html`; `dragons.html`; `app.js` | High duplication; rigid names can hide role substitutions |
| Gear/iconic gear | No game-knowledge record found | Complete gap |
| Mode usefulness | JSON scores; app heuristics; prose | Critical: exact scores lack provenance/context and are treated as executable truth |
| Strategy explanations | `why`; page `purpose`/`how`; prose | High duplication; no atomic evidence or applicability windows |

### Major duplicated and conflicting knowledge

1. **Raid, War, and Dragon guidance is maintained four times.** `index.html`, `builder.html`, `app.js`, and `dragons.html` each encode overlapping teams, mechanics, and explanations. Changes in one source do not propagate.
2. **Faction membership is independently maintained.** The split JSON contains Martell, Strong, and Tyrell factions that have no section in `factions.html`. The manual page includes missing champions and variants. Examples: Free Folk is 4 functional IDs versus 6 manual names; Greyjoy is 4 functional IDs but the manual list omits Balon; Night's Watch swaps functional Jeor for missing Alliser and Craster; No Faction adds missing Icy Viserion and Craghas.
3. **Variant-rich manual lists collapse into generic functional IDs.** Lannister alone lists separate Joffrey, Cersei, and Tyrion colors plus Meryn, while functional JSON has one generic ID for each and no Meryn.
4. **Ally relationships drift.** The JSON contains relationships absent from `allies.html`: Benjen/Yoren, Joffrey/Margaery, Roose/Walder, Davos→Stannis, Criston→Rhaenyra, and Drogo/Daenerys. The manual page may be incomplete rather than contradictory, but there is no status field to say so. Daenerys has two slash-delimited ally targets in one string.
5. **Status examples and tags are not reliably aligned.** `status-effects.html` calls Poison an Olenna/Oberyn/Nymeria tool, but functional Nymeria has only `stun`. It calls Wound core to Gregor/Tywin lines, while Tywin has `treasury` and `ruin` tags but no `wound`. These may reflect incomplete tags, not false prose, so both must remain disputed until skills are verified.
6. **Mode scores and recommendations are opaque.** Every JSON record has 1–5 mode scores and `app.js` adds heuristic bonuses. No evidence, conditions, update version, or explanation establishes these values.
7. **Source language overstates certainty.** Phrases such as “four proven war shapes,” “hardest common hold,” and “best-fit lead” coexist with “alliance-tested,” “official tips,” and partially visible screenshot text. These are different evidence classes and cannot share one blanket confidence.

## 3. Fact versus strategy classification

Canonical publication should classify each atomic claim, not each whole page or champion record.

| Class | Meaning | Repository examples | Publication requirement |
|---|---|---|---|
| Factual game data | Directly observable game identity or mechanic | exact champion subtitle/color/faction; skill text; status definition; iconic gear; boss ability text | Exact current evidence and version/context |
| Strategy / interpretation | A recommendation or judgment | “strong Raid defender,” “target first,” team shape, mode score, “keep Meryn alive” | Conditions, mode, explanation, alternatives, evidence, uncertainty |
| Derived knowledge | A stated inference from other supported claims | Meryn is a priority because removing him should break the documented punish engine | Explicit inference steps and all basis claim/evidence IDs |
| Community / Observed | Player/alliance outcome | Rhaegal team reportedly scoring ~5.5k versus ~2.3k; “seen on top boards” | Observation date/version, team variants, encounter, sample/context, recorder, confidence |

Identity, skill text, and status application are not made factual merely because they appear in JSON. Conversely, a screenshot proves what it shows at its capture time; it does not by itself prove that the fact is current.

## 4. Provenance model review

The four project labels—**Screenshot Verified**, **Official Current**, **Derived**, and **Community/Observed**—are sufficient as top-level provenance classes. They are not sufficient as the complete provenance model because they conflate source type, verification, currentness, and confidence.

Every evidence record should also carry:

- stable `evidence_id`;
- `source_type` such as in-game screenshot, official page/post, repository legacy text, alliance observation, or derived analysis;
- exact `source_ref`; for the future archive, this must include the screenshot filename and optionally archive-relative path;
- content checksum so a renamed screenshot can still be recognized;
- locator/crop/region describing where the fact appears;
- capture/observation date, ingestion date, and verification date;
- game version/update/season/event and locale when known;
- contributor and independent verifier when available;
- support direction: `supports`, `contradicts`, or `context_only`;
- scoped claim IDs rather than a blanket champion-level link;
- transcription/excerpt plus notes about cropped, obscured, or inferred text;
- verification state: `unreviewed`, `verified`, `disputed`, `superseded`, or `rejected`;
- currentness state: `current`, `historical`, `unknown`, or `expired`;
- confidence with a defined rubric;
- `superseded_by_evidence_id` and reason when applicable.

Repository legacy statements should enter a staging area with `source_type: legacy-repository`. They must not be labeled Screenshot Verified merely because a page says screenshots existed. Community strategy can use Community/Observed with low/unknown confidence until exact observation evidence is attached. Derived claims require ordered basis claim IDs and a written inference.

## 5. Canonical record design

### Identity hierarchy

1. **Character** — lore identity, such as Daenerys Targaryen, Viserys I, or Viserys III.
2. **Champion variant** — one playable in-game card/release, with stable variant ID, exact title/subtitle, explicit gem color, rarity, availability/version, and legacy aliases.
3. **Encounter actor** — a battle-mode boss/version such as a specific Rhaegal encounter. It is not a champion variant even if it shares a character.
4. **Asset** — portrait or screenshot linked to an exact variant/encounter and evidence, never authoritative solely because its filename matches.

Legacy IDs should be preserved in an alias table with status (`confirmed`, `ambiguous`, `retired`) rather than copied into multiple variants.

### Atomic claims

Entity rows identify things. Facts about them should be stored as atomic, versionable claims:

```json
{
  "id": "claim-example-001",
  "subject": { "type": "champion_variant", "id": "pending-variant-id" },
  "predicate": "applies_status",
  "object": { "type": "status", "id": "wound" },
  "context": { "skill_id": "pending-skill-id", "mode_ids": [] },
  "validity": { "from_update": null, "to_update": null },
  "state": "disputed",
  "confidence": "unknown",
  "evidence_links": [
    { "evidence_id": "ev-legacy-source", "direction": "supports" }
  ],
  "conflict_ids": []
}
```

This permits one evidence item to support only the fields it actually proves and allows contradictory claims to coexist until adjudication.

### Explainable relationships

A relationship must state a mechanism chain, not only an edge:

```json
{
  "id": "relationship-example",
  "kind": "synergy",
  "subject_ref": { "type": "champion_variant", "id": "champion-a" },
  "object_ref": { "type": "champion_variant", "id": "champion-b" },
  "mode_ids": ["raid_attack"],
  "conditions": [{ "type": "status_present", "status_id": "x", "target": "enemy" }],
  "mechanism_steps": [
    { "order": 1, "claim_ref": "claim-a-applies-x", "summary": "Champion A applies X." },
    { "order": 2, "claim_ref": "claim-b-benefits-x", "summary": "Champion B benefits when X is present." },
    { "order": 3, "inference": "Together they improve outcome Z under the stated condition." }
  ],
  "why": "Player-facing explanation derived from the mechanism steps.",
  "strength": "unknown",
  "confidence": "needs-validation",
  "evidence_refs": [],
  "alternative_group_ids": []
}
```

Counters additionally require `countered_target`, `countered_mechanic`, `counter_method`, failure conditions, mode/encounter version, and evidence. A substitution belongs to an alternative group with required role/mechanic capabilities; it is not merely another name in a five-champion list.

### Static-first package

The proposed package should expand to:

```text
strategy-data/
  manifest.json
  characters.json
  champion-variants.json
  legacy-id-aliases.json
  factions.json
  traits.json
  roles.json
  skills.json
  statuses.json
  gear.json
  battle-modes.json
  encounters.json
  claims.json
  evidence.json
  conflicts.json
  relationships.json
  alternative-groups.json
  team-cores.json
  strategy-scenarios.json
  assets.json
  source-records.json
  validation-report.json
```

## 6. Future relational database readiness

The model maps cleanly to Postgres/Supabase if IDs and atomic claims are established before migration.

Likely entity tables:

- `characters`, `champion_variants`, `legacy_id_aliases`;
- `factions`, `traits`, `roles`, `skills`, `skill_versions`, `statuses`, `gear`, `gear_versions`;
- `battle_modes`, `encounters`, `encounter_versions`;
- `claims`, `evidence`, `conflicts`, `sources`, `assets`;
- `relationships`, `relationship_steps`, `relationship_conditions`;
- `team_cores`, `team_core_slots`, `alternative_groups`, `alternative_members`;
- `strategy_scenarios`, `scenario_signatures`, `strategy_explanations`;
- `source_imports`, `source_records`, `validation_runs`, `validation_issues`.

Likely joins:

- variant factions/traits/roles/skills/status applications/gear;
- claim evidence with support direction;
- conflict claims and conflict evidence;
- relationship modes, evidence, conditions, and alternatives;
- encounter mechanics and evidence;
- scenario relationships and result sections.

Use relational columns for stable IDs, direction, state, provenance class, confidence, validity, mode, and foreign keys. Use `jsonb` only for bounded typed values such as condition payloads or source snapshots, not as a substitute for identities or references. Source imports and conflicts must remain first-class and immutable enough to audit.

## 7. Validation system requirements

Before any static package is accepted for migration or consumed by recommendations, validation must enforce:

### Identity and schema

1. Unique canonical IDs by entity type.
2. No duplicate active legacy alias for more than one variant unless explicitly marked ambiguous.
3. Exact title/subtitle/color requirements for a variant; no generic identity when multiple candidates exist.
4. Different character identities cannot share a character key (especially Viserys I/III).
5. Required fields, enums, types, schema version, and source-import lineage.
6. UI palette values cannot populate game gem-color fields.

### References and assets

7. Every faction, trait, role, skill, status, gear, mode, encounter, champion, and relationship reference resolves.
8. Every lineup/scenario member resolves to an exact variant or is explicitly staged as unresolved.
9. No fuzzy name match is permitted in canonical data.
10. Every active champion variant has an asset status (`mapped`, `intentionally_missing`, or `not_expected`).
11. Every active portrait maps to exactly one intended subject/version; duplicate active mappings fail validation.
12. Portrait-only identities and champion-without-portrait cases are reported, never dropped.

### Evidence, conflicts, and currentness

13. Every active factual claim has supporting evidence and a provenance class.
14. Every strategy claim has mode, conditions, explanation, confidence, evidence, and currentness.
15. Derived claims have basis claim IDs and a non-empty inference chain.
16. Screenshot Verified claims have exact filename/source reference and verification date.
17. Official Current claims have official source reference, checked date, and currentness policy.
18. Community/Observed claims record observation context; score anecdotes cannot become universal rules.
19. Contradictory active canonical facts create a blocking conflict rather than last-write-wins behavior.
20. Superseded evidence and claims remain traceable and cannot be selected as current.

### Strategy integrity

21. Relationship direction and subject/object types are valid for the relationship kind.
22. Counter relationships name the target mechanic, counter method, conditions, and failure modes.
23. Synergy relationships contain evidence-backed mechanism steps that support the `why` explanation.
24. Scenario signatures use exact IDs and explicit matching rules.
25. Alternatives satisfy declared role/mechanic requirements and do not imply player ownership.
26. Mode-usefulness scores without evidence, rubric, date, and conditions are rejected from canonical recommendations.
27. Rigid five-champion prescriptions must expose slot purposes and alternatives where evidence permits.

### Reconciliation controls

28. Source counts and canonical counts are generated, not copied into prose.
29. Every source row is imported or explicitly rejected with a recorded reason.
30. Validation output includes severity, affected IDs, source references, suggested action, and adjudication state.
31. A release manifest records the exact schema version, data version, validation run, and unresolved non-blocking issues.

## Reconciliation sequence

1. Freeze the current files as named source imports; compute stable source-row IDs and checksums.
2. Create the identity staging register for all 90 rows, manual-only references, and portrait-only keys.
3. Process screenshot evidence identity-first: exact card title/subtitle, gem color, rarity, faction(s), portrait subject, and game/update context.
4. Resolve Viserys and the multi-variant groups before assigning legacy aliases.
5. Adjudicate Khal Drogo and Laenor duplicate rows without discarding their lineage.
6. Create canonical factions, statuses, skills, and encounter versions from evidence-backed facts.
7. Convert legacy prose into atomic factual, strategy, derived, or community claims with source references and uncertainty.
8. Build relationships and team-core slots only from resolved variant IDs and supported mechanics.
9. Run blocking validation; publish a static package only when no identity/reference/provenance blocker remains.
10. Consider database migration after the static schema and reconciliation workflow have proven stable.

## Five highest-risk problems to fix first

1. **Viserys I/III conflation and generic multi-variant IDs.** Wrong identity propagation would corrupt factions, allies, skills, portraits, and every relationship downstream.
2. **Meryn is absent while major Raid/War guidance depends on him.** Strategy cannot be made canonical until his exact identity and skill mechanics are evidenced.
3. **Silent duplicate and fuzzy-name behavior.** `app.js` drops duplicate rows, while `builder.html` resolves prose names approximately; both conceal data failures.
4. **No field-level evidence or versioning for factual mechanics.** The rich dragon/status prose includes official, screenshot, inferred, and observed claims without reliable separation.
5. **Portrait/faction/manual-source drift.** Orphan assets, duplicate portrait keys, missing portraits, variant-rich manual lists, and JSON membership differences make identity errors likely during migration.

