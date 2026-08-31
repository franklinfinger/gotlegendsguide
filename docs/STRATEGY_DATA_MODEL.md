# GOT Legends Guide Strategy Data Model

## Purpose

This is the proposed canonical, static-first model for strategy knowledge. It is designed to answer practical battle questions without becoming a player roster or progression tracker. The game remains the source of a player's champions, stars, gear, levels, power, and development.

The model must preserve stable champion IDs where practical, keep character variants distinct, represent uncertainty honestly, and support deterministic retrieval before any AI-assisted interpretation.

## Design principles

- Keep **identity**, **game facts**, **strategy relationships**, and **rendering assets** separate.
- Separate a lore **character**, a playable **champion variant**, and a battle-mode **encounter actor**. Shared names do not make them the same entity.
- Never merge two variants because their names match. A variant is its own record unless evidence establishes an explicit relationship.
- Store game facts as atomic, versionable claims. A champion-level provenance label is not enough when individual fields may have different or conflicting sources.
- Every fact and recommendation carries evidence references, provenance, currentness, and a confidence/status value.
- Retain conflicts and invalid records as validation output; never silently deduplicate or discard them.
- A battle recommendation is a set of conditional, explained relationships—not a score derived from opaque tags.
- Recommendations describe options, roles, mechanics, and substitutions. They do not assume a player's collection.

The repository-wide findings and the complete reconciliation plan are in `docs/CANONICAL_DATA_AUDIT.md`.

## Static package layout

The initial model can live as versioned JSON under a `strategy-data/` directory, generated or validated by small static-site-compatible scripts later. It does not require a framework or database.

```text
strategy-data/
  manifest.json
  characters.json
  champion-variants.json
  legacy-id-aliases.json
  evidence.json
  claims.json
  conflicts.json
  factions.json
  statuses.json
  traits.json
  roles.json
  skills.json
  gear.json
  battle-modes.json
  encounters.json
  relationships.json
  alternative-groups.json
  team-cores.json
  strategy-scenarios.json
  assets.json
  source-records.json
  validation-report.json
```

`manifest.json` records schema version, source-package version, generated time, and compatibility mappings. `validation-report.json` is an explicit artifact for duplicate IDs, unresolved references, conflicts, missing portraits, and incomplete provenance.

## Core entities

### Character, champion variant, and encounter actor

`Character` is the lore identity. `ChampionVariant` is one exact playable card/release. `EncounterActor` is a versioned boss or opponent used by a mode. For example, Adolescent Viserion, an Icy Viserion champion candidate, and a Viserion boss encounter must not be collapsed into one record merely because their names are related.

Legacy IDs live in an alias registry with `confirmed`, `ambiguous`, or `retired` status. A generic legacy ID must not be assigned to one variant while its identity is unresolved.

### Champion variant

One record represents one playable in-game variant.

```json
{
  "id": "daenerys-blue",
  "character_key": "daenerys-targaryen",
  "display_name": "Daenerys Targaryen",
  "variant_label": "Blue",
  "identity": { "rarity": "legendary", "gem_color_id": "blue" },
  "faction_ids": ["free-cities"],
  "role_ids": ["support", "leader", "dragon"],
  "trait_ids": ["fire", "wrath", "stamina"],
  "skill_ids": ["skill-daenerys-blue-primary"],
  "applies_status_ids": [],
  "resists_status_ids": [],
  "portrait": { "asset_key": "daenerys-blue", "status": "mapped" },
  "mode_usefulness": { "raid_attack": null, "raid_defense": null, "war": null, "dragons": {} },
  "identity_claim_refs": ["claim-daenerys-blue-title", "claim-daenerys-blue-color"],
  "record_state": "candidate",
  "notes": []
}
```

`mode_usefulness` may hold a structured assessment only when there is sufficient evidence. It must not become a universal 1–5 score without source, context, and explanation.

The current JSON `color` and `text` fields are presentation hex values. They are not canonical gem colors and should migrate to asset/theme metadata rather than `gem_color_id`.

### Faction, status, trait, role, skill, and ally relationship

These are separately addressable records, each with definitions and evidence. A status record includes its mechanic, application/removal/resistance conditions when known, and unknown fields when not known. A skill record is versionable because game text can change. Ally pairs are directional relationships only when their effect is directional; otherwise they are a symmetric relation with an explicit effect record.

### Atomic claim

An atomic claim connects one subject, predicate, and object/value. It has its own validity, evidence links, state, and conflicts. Examples include “variant X belongs to faction Y,” “skill A applies Wound,” and “encounter version B is immune to Fire.” Conflicting claims remain side by side until adjudicated.

Derived claims additionally reference ordered basis claim IDs and explain the inference. A relationship's player-facing `why` must be supported by its factual/derived mechanism steps.

### Evidence

```json
{
  "id": "ev-001",
  "provenance": "Screenshot Verified",
  "source_type": "in-game-screenshot",
  "source_ref": "exact-archive-filename-or-official-reference",
  "content_checksum": "sha256-if-available",
  "locator": "screen region or crop reference",
  "captured_at": "2026-08-31",
  "verified_at": "2026-08-31",
  "game_update": null,
  "locale": null,
  "excerpt": "Optional concise factual note",
  "claim_links": [{ "claim_id": "claim-daenerys-blue-title", "direction": "supports" }],
  "verification_state": "verified",
  "currentness": "unknown",
  "superseded_by_evidence_id": null
}
```

Allowed provenance values remain exactly: **Screenshot Verified**, **Official Current**, **Derived**, and **Community/Observed**. These are top-level provenance classes, not substitutes for source type, exact reference, verification state, currentness, game version, confidence, or conflict status. Derived records require basis claim/evidence IDs and an explanation of the reasoning.

Legacy repository statements enter staging as `source_type: legacy-repository`; they do not become Screenshot Verified until the exact screenshot evidence is attached and reviewed.

### Strategy relationship

This is the central record for synergies, counters, threats, vulnerabilities, target priority, and substitutions.

```json
{
  "id": "rel-meryn-skill-punish",
  "kind": "threat",
  "subject": { "type": "champion_variant", "id": "pending-meryn-variant" },
  "object": { "type": "mechanic", "id": "enemy-skill-use" },
  "modes": ["raid_defense"],
  "conditions": [{ "type": "subject_state", "state": "alive" }],
  "mechanism_steps": [
    { "order": 1, "claim_ref": "claim-meryn-punishes-skill-use" },
    { "order": 2, "claim_ref": "claim-stun-wound-disrupt-attacker" }
  ],
  "claim": "Meryn punishes enemy skill use with Stun and Wound.",
  "why": "The punishment loop can turn aggressive skill use into a defensive advantage.",
  "alternative_group_ids": [],
  "evidence_refs": ["ev-legacy-raid-meryn"],
  "provenance": "Community/Observed",
  "confidence": "needs-validation",
  "valid_from": null,
  "valid_to": null,
  "conflict_ids": [],
  "record_state": "staging-only"
}
```

`kind` is an enum such as `synergy`, `counter`, `threat`, `vulnerability`, `target_priority`, `substitution`, `mode_use`, or `team_core`. A record can refer to a champion, variant, status, skill, faction, role, trait, or another relationship. It must state its mode and conditions before it can appear in a live recommendation.

A counter also records the exact target mechanic, counter method, conditions, failure modes, and strength/confidence. A substitution belongs to an alternative group whose members satisfy explicit role/mechanic requirements; it is not an unqualified replacement name.

### Strategy scenario

Scenarios make explainable battle retrieval possible without a fake matchup engine.

```json
{
  "id": "raid-defense-meryn-lannister-hold",
  "mode": "raid_defense",
  "opponent_signature": {
    "required_champion_variant_ids": [],
    "unresolved_legacy_ids": ["meryn", "sandor", "tywin", "olenna", "joffrey"],
    "match_rule": "blocked-until-resolved"
  },
  "summary": "A known defensive hold built around skill-punish, protection, and Lannister control.",
  "relationship_ids": ["rel-meryn-skill-punish"],
  "result_sections": ["approach", "biggest_threat", "target_priority", "vulnerabilities", "mechanics", "options", "alternatives"],
  "evidence_refs": ["ev-legacy-raid-meryn"],
  "provenance": "Community/Observed",
  "confidence": "needs-validation",
  "record_state": "staging-only"
}
```

This example remains staging-only because its legacy IDs do not yet resolve to exact variants. A published UI may retrieve a scenario only when exact variant IDs are resolved and its `match_rule` is satisfied. If no suitable scenario or evidence-backed relationship exists, it should say so and offer reference content rather than manufacture advice.

## Recommendation assembly

For a Raid Counter result:

1. Resolve selected champion IDs and variant labels.
2. Validate IDs, portrait mappings, and selection cardinality.
3. Match evidence-backed scenarios and relationships for `raid_defense`.
4. Present claims by priority: opponent approach, biggest threat, target priority, vulnerabilities, mechanics, counter options, alternatives.
5. Include a reason, conditions, provenance, confidence, and source references for every displayed claim.
6. If a claimed alternative lacks a direct matchup relationship, label it as a legacy/reference option rather than a counter recommendation.

## Current-source mapping and gaps

Current functional champion records are split across `champions-part1.json` and `champions-part2.json`. They provide IDs, names, factions, roles, tags, ally text, scores, and a short `why`; they do not provide enough validated strategy relationships or provenance for arbitrary five-champion matchmaking.

Existing HTML pages contain useful strategy prose, faction descriptions, status definitions, ally notes, and hard-coded Raid shapes. They are source material to migrate and cite, not yet canonical records. Portraits are embedded in ordered global JavaScript files and must be moved to an explicit asset manifest only after compatibility is established.

Known migration blockers include:

- 90 champion records but only 88 unique IDs across the two functional JSON files.
- Legacy Raid guidance references Meryn Trant, while `meryn` is absent from the functional champion JSON.
- Strategy prose has no consistent evidence ID, provenance, confidence, version, or applicability conditions.
- Same-character variants are not consistently represented with a shared character key and variant label.
- Portrait mapping, static page prose, and JSON data can disagree or be incomplete.
- Current manual score fields are not a sufficient basis for a counter engine.
- Manual faction pages distinguish multiple exact variants that generic functional IDs collapse, including Daenerys, Stannis, Joffrey, Cersei, Tyrion, Jon Snow, Rhaenyra, and two different Viserys characters.
- Portrait reconciliation currently has missing, orphaned, and duplicate keys; load order can choose a portrait implicitly.
- Factual claims, strategy interpretations, Derived claims, and Community/Observed outcomes are mixed within the same prose and JSON fields.

## Future Database Migration

The static model maps directly to a relational system such as Supabase/Postgres without changing its identifiers or semantics. Use tables for `characters`, `champion_variants`, `legacy_id_aliases`, `factions`, `traits`, `roles`, `statuses`, `skills`, `skill_versions`, `gear`, `battle_modes`, `encounters`, `encounter_versions`, `claims`, `evidence`, `conflicts`, `relationships`, `relationship_steps`, `team_cores`, `alternative_groups`, `scenarios`, `assets`, `source_imports`, and `validation_runs`. Use join tables for variant facts, claim evidence (including support/contradict direction), conflict members, relationship conditions/modes/evidence, alternatives, and scenario sections. Store flexible but typed condition payloads and source snapshots in `jsonb`; keep stable IDs, state, provenance, confidence, validity, mode, and relationship direction as indexed columns. Source records and validation conflicts remain first-class so imports are auditable and no conflict is silently overwritten.
