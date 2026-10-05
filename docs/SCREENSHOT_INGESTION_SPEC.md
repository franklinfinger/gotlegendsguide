# Screenshot Evidence Ingestion Specification

## Purpose and scope

This specification turns the external GOT: Legends screenshot archive into traceable evidence metadata without copying, OCR-processing, or committing any screenshot. The archive is primary-source material, but a screenshot does not become an application fact until a human-reviewed extraction has passed validation and canonical acceptance.

This process creates no database and does not alter production pages, champion JSON, or existing strategy content. Existing repository knowledge is treated as legacy source material, not automatically authoritative evidence.

## Core model

Four things remain distinct throughout ingestion:

1. **Character** — a lore identity.
2. **Champion variant** — one exact playable card, with title, subtitle/release identity, and explicit gem color when known.
3. **Encounter actor** — a versioned boss/encounter, not a champion variant merely because it shares a name.
4. **Evidence source** — an external screenshot or other source represented by metadata only.

Facts are atomic claims about those subjects. Claim-to-evidence links say whether a source supports, contradicts, or only contextualizes a claim. Strategy relationships consume accepted claims later; they are not extracted merely by recognizing names in a screenshot.

## End-to-end workflow

```text
External screenshot archive
  → source registration
  → screen/subject identification
  → exact champion-variant or encounter resolution
  → atomic claim extraction
  → evidence attachment
  → validation
  → conflict detection and review
  → canonical acceptance
  → future relational import
```

### 1. Source registration

An operator registers only metadata in `data/canonical/staged/`. The screenshot remains outside Git.

Required registration fields:

- stable evidence source ID;
- original filename exactly as it exists in the archive;
- SHA-256 checksum computed from the external file;
- external archive locator or archive-relative path;
- dimensions;
- source type;
- screen type/classification;
- optional capture timestamp, game version, and locale when known;
- initial identified-subject candidates, review status, and reviewer notes.

`source_type` describes origin—for example `in-game-screenshot`, `official-material`, `legacy-repository`, or `community-observation`. It is separate from provenance. The project’s allowed claim provenance classes remain **Screenshot Verified**, **Official Current**, **Derived**, and **Community/Observed**.

The checksum protects against filename changes and detects accidental duplicate registrations. A source is not copied, renamed, resized, or embedded in this repository.

### 2. Screen and subject identification

Classify the screen without claiming facts it does not visibly establish. Recommended screen types include:

- `champion_card`, `champion_skill`, `champion_trait`, `champion_gear`;
- `faction`, `status_or_mechanic`, `encounter`, `tips_and_tricks`;
- `raid`, `alliance_war`, `campaign_or_trial`, `team_recommendation`;
- `unknown` when classification is not yet reliable.

An identified subject is an explicit reference with an entity type and either a resolved canonical ID or an unresolved legacy label. Example: a screenshot may be staged as “candidate champion variant, display text transcribed manually, resolution state unresolved.” It must not be guessed into a known generic ID because its name resembles a current record.

When the screen may concern a playable champion and an encounter actor with the same name, register both possibilities or leave the subject unresolved. This protects known ambiguities such as playable dragon variants versus Dragon Boss encounters.

### 3. Exact identity resolution

Resolve a champion only after human review establishes the exact playable variant. Resolution must distinguish:

- lore character from card variant;
- variant subtitle/release identity;
- game gem color from a repository UI color;
- champion card from boss/encounter version;
- a confirmed legacy alias from an ambiguous one.

Required evidence for canonical champion-variant resolution is the exact visible identifier available in the screenshot: title, subtitle if present, color, and enough card context to rule out other variants. If the screenshot is cropped, obscured, or does not show a distinguishing field, retain a candidate with `resolution_state: unresolved` or `candidate`.

No identity is automatically reconciled from a portrait, filename, existing JSON ID, or strategy prose.

### 4. Atomic claim extraction

Extract a claim only when the source supports a bounded statement. A claim contains:

- stable claim ID;
- class: factual, strategy, derived, or community-observed;
- exact subject type and ID/candidate;
- predicate and object/value;
- optional context: skill, mode, encounter version, condition, locale, or validity window;
- provenance class;
- confidence and verification/currentness state;
- evidence requirement;
- reviewer notes and conflict IDs when relevant.

Examples of claim shapes, not game facts:

- variant X `belongs_to_faction` faction Y;
- skill X `applies_status` status Y under condition Z;
- encounter version X `is_immune_to` status Y;
- screen text `recommends_team_core` only when the screenshot actually makes that recommendation.

Do not collapse multiple fields into “champion facts.” A screenshot proving a title does not prove current faction, skill text, gear, or strategic usefulness. No OCR is performed in this task; any later transcription must be manually reviewed and recorded as such.

### 5. Evidence attachment

Create an explicit `claim_evidence` record for each claim/source relation. It stores:

- claim ID and evidence source ID;
- direction: `supports`, `contradicts`, or `context_only`;
- a screen locator/crop description;
- a short, manually reviewed transcription or excerpt when useful;
- review state.

The source metadata retains the filename and hash. The claim link retains exactly what the source establishes. Derived claims must additionally record their basis claim IDs and the reasoning step; they do not become Screenshot Verified merely because their inputs are screenshot-backed.

### 6. Validation

Run `node scripts/validate-canonical-data.mjs` before promotion and before any eventual export. The validator is intentionally dependency-free and checks schema envelopes, IDs, references, provenance classes, evidence links, duplicate hashes, unresolved canonical variants, malformed JSON, basic contradictions, and prohibited non-metadata file types.

The validator is a guardrail, not a truth engine. It cannot determine whether a transcribed skill is correct, whether a screenshot is current, or whether two visually similar cards are the same variant. Those remain human review decisions.

### 7. Conflict detection and review

Create a conflict record whenever active evidence supports incompatible facts or the same identity cannot be resolved safely. A conflict records:

- affected claim IDs and evidence source IDs;
- current state and exact contradiction;
- reviewer notes;
- proposed resolution, confidence, and validation still needed;
- `open`, `resolved`, or `superseded` status.

Conflicting evidence remains visible. The system never uses last-write-wins, silently replaces an old source, or infers a winner from a score, portrait, or filename.

### 8. Canonical acceptance

Only accepted records move into `data/canonical/canonical/`. A canonical factual claim requires all of the following:

1. Exact resolved subject ID, or an explicitly approved non-champion subject ID.
2. Allowed provenance class and appropriate verification state.
3. At least one supporting evidence link when evidence is required.
4. Exact evidence filename, hash, archive locator, and review metadata for screenshot evidence.
5. Game version/currentness recorded as known or explicitly unknown.
6. No unresolved identity and no blocking open conflict.
7. Successful lightweight validation.

Canonical acceptance does not mean permanent truth. Newer evidence may supersede a claim while preserving the old claim, source, reason, and validity history.

## State boundaries and promotion requirements

| State | May contain | Cannot do | Promotion requirement |
|---|---|---|---|
| `staged` | Source registrations, candidate subjects, unreviewed manual extractions, unresolved variants | Feed UI, make canonical claims, imply game fact | Required metadata is complete; source can be located by filename/hash; reviewer begins review |
| `reviewed` | Human-checked classification/transcription, candidate or resolved identities, explicit conflicts | Feed UI, auto-resolve conflicts, assert currency without evidence | Identity and claim review complete; evidence links and notes exist; conflict status assessed |
| `canonical` | Resolved, evidence-backed facts and accepted relationships | Contain unresolved variants, missing required evidence, blocking conflicts, or screenshot binaries | All acceptance conditions pass and validation succeeds |

Move records forward; do not duplicate the same active record across state directories. A rejected record remains traceable through source metadata and review notes rather than being deleted. A superseded record retains its original ID and links to its successor.

## Screenshot manifest format

The format lives in [screenshot-manifest.example.json](/Users/frankfinger/Projects/gotlegendsguide/data/canonical/staged/screenshot-manifest.example.json). It is deliberately synthetic, non-loadable, and represents one format example—not one of the 833 recovered screenshots.

Each future manifest entry includes:

```json
{
  "id": "source-id",
  "source_type": "in-game-screenshot",
  "original_filename": "exact-file-name-in-external-archive.png",
  "archive_locator": "external-archive://archive-relative-location",
  "sha256": "64-lower-case-hex-characters",
  "dimensions": { "width": 0, "height": 0 },
  "captured_at": null,
  "game_version": null,
  "screen_type": "unknown",
  "identified_subjects": [],
  "review_status": "staged",
  "reviewer_notes": [],
  "superseded_by": null
}
```

`captured_at`, `game_version`, and resolved subject IDs are optional because the archive may not expose them. Their absence must be recorded as unknown, not manufactured. Dimensions and SHA-256 are required for a real registration.

## Supersession and currentness

Evidence sources and claims are append-only in practical terms:

- A new source with newer game context may supersede an older source.
- The older source remains queryable with `superseded_by` and a reviewer rationale.
- A claim’s currentness is `current`, `historical`, `unknown`, or `expired` independently of provenance.
- Official Current requires a checked date and official reference; Screenshot Verified means only that the screenshot was verified, not that it is current.

## Future relational migration

The static collections map one-to-one to relational entities: characters, champion variants, evidence sources, claims, claim-evidence joins, relationships, and conflicts. IDs are stable string primary keys; joins are explicit; flexible conditions and source snapshots can later become typed JSON columns. Details are in [DATABASE_MAPPING.md](/Users/frankfinger/Projects/gotlegendsguide/docs/DATABASE_MAPPING.md).

## Non-goals for this task

- No screenshot archive ingestion, copying, OCR, or image processing.
- No broad extraction of champions, skills, gear, or strategy facts.
- No identity resolution for known ambiguous variants.
- No database, backend, framework, package installation, production modification, push, merge, or deployment.

