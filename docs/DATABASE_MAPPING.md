# Canonical Evidence Data: Future Database Mapping

## Goal

The static metadata structures under `data/canonical/` are designed to move into a relational database without changing semantics. This document specifies entities, keys, references, versioning, and indexes only. It does not choose a database provider, create a database, or configure a service.

## Identity tables

| Static collection | Future table | Primary key | Key references |
|---|---|---|---|
| `characters` | `characters` | `characters.id` | Lore identity only |
| `champion_variants` | `champion_variants` | `champion_variants.id` | `character_id → characters.id` |
| Future encounter records | `encounters`, `encounter_versions` | Stable encounter ID / version ID | Optional `character_id → characters.id`; never a champion-variant substitute |
| Future assets | `assets` | `assets.id` | `subject_type` + subject ID, source evidence ID |
| Future aliases | `legacy_id_aliases` | `legacy_id_aliases.id` | Candidate/confirmed `champion_variant_id`; ambiguity state |

Recommended uniqueness:

- `characters.id`, `champion_variants.id`, and encounter/version IDs are primary keys.
- `(character_id, normalized_title, normalized_subtitle, gem_color_id)` is a review-oriented uniqueness check, not a replacement for stable IDs.
- A confirmed active legacy alias may map to only one variant; ambiguous aliases remain separate rows.

## Evidence and claim tables

| Static collection | Future table | Primary key | Foreign keys / behavior |
|---|---|---|---|
| `evidence_sources` | `evidence_sources` | `id` | Unique `sha256`; external filename and locator are metadata only |
| `claims` | `claims` | `id` | Typed polymorphic subject reference, provenance, version/currentness, verification state |
| `claim_evidence` | `claim_evidence` | `id` | `claim_id → claims.id`; `evidence_source_id → evidence_sources.id` |
| `conflicts` | `conflicts` | `id` | Open/resolved/superseded state |
| Future conflict joins | `conflict_claims`, `conflict_evidence_sources` | Composite keys | Preserve every side of a disagreement |

`claim_evidence` is many-to-many. One screenshot can support several claims; one claim can have several supporting or contradicting sources. Store direction (`supports`, `contradicts`, `context_only`), locator, excerpt/transcription, reviewer, and link state on the join—not on the source alone.

## Strategy relationship tables

| Static collection | Future table | Primary key | Foreign keys / behavior |
|---|---|---|---|
| `relationships` | `relationships` | `id` | Typed subject/object references; kind, why, state |
| `mechanism_steps` in a relationship | `relationship_steps` | `id` | `relationship_id → relationships.id`; `claim_id → claims.id` |
| `conditions` in a relationship | `relationship_conditions` | `id` | `relationship_id → relationships.id`; typed condition payload |
| future mode links | `relationship_modes` | composite | `relationship_id`, `battle_mode_id` |
| future alternatives | `alternative_groups`, `alternative_members` | stable IDs | Explicit substitution capabilities rather than roster assumptions |

Relationships should not hold unsourced mechanic text as their only proof. `relationship_steps` make the reason inspectable: a supported factual claim establishes a mechanic, another establishes a benefit/vulnerability, and the relationship records the conditional conclusion.

## Reference and taxonomy tables

Use normalized tables for reusable things likely to receive direct references: factions, roles, traits, statuses, skills, skill versions, gear, gear versions, battle modes, and encounter versions. Use join tables for variant factions, traits, roles, skills, statuses applied/resisted, gear, and mode usefulness.

Structured values that can evolve without exploding the table count—screen locators, typed conditions, source snapshots, and limited result-section payloads—may use JSON columns with a documented schema. Stable identity, provenance, validity, state, direction, and foreign-key references remain relational columns and indexed.

## Versioning and supersession

Do not overwrite game facts in place.

- `evidence_sources.superseded_by_id` points to a newer source when appropriate.
- Claims carry validity/update context, currentness, verification state, and optional `superseded_by_claim_id`.
- `claim_evidence` preserves both support and contradiction links.
- Conflicts remain first-class until a recorded resolution names the winning evidence and rationale.
- Database history/audit columns should include `created_at`, `reviewed_at`, `accepted_at`, `superseded_at`, actor IDs where available, and immutable source checksum.

This permits a current application query to select accepted/current claims while still retaining historical screenshots and prior facts for audit.

## Important indexes

- Unique B-tree index on `evidence_sources.sha256`.
- Index on `evidence_sources.original_filename` and an archive-locator prefix/search strategy.
- Composite index on `claims(subject_type, subject_id, predicate, verification_state, currentness)`.
- Index on `claim_evidence(claim_id)` and `claim_evidence(evidence_source_id, direction)`.
- Partial index for canonical/current claims and open conflicts.
- Index on `champion_variants(character_id, gem_color_id)` plus normalized display/subtitle search fields.
- Index on relationship subject/object/mode/kind/state.
- Full-text or trigram-style search indexes later for display name, subtitle, manually reviewed excerpts, reviewer notes, and original screenshot filename. Exact ID and checksum lookup remain primary.

Search must return uncertainty and conflict state. A text match is never identity resolution.

## Import sequence

1. Import stable taxonomies and identity rows first.
2. Import external-source metadata without binary files.
3. Import claims and claim-evidence joins.
4. Import conflicts before enabling canonical/current claim views.
5. Import relationships only after their referenced claims resolve.
6. Expose application read models from canonical/current views, not raw staged or reviewed tables.

The static validator’s constraints should become database constraints, foreign keys, unique indexes, and acceptance-state checks. The database should reject the same unsafe states: unresolved canonical variants, unknown provenance, duplicate hashes, broken references, evidence-less factual claims, and contradictory active facts without a conflict record.

