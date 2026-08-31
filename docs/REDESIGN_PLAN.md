# GOT Legends Guide Redesign Plan

## Purpose

Evolve GOT Legends Guide into a mobile-first strategy command center for Old Peeps on Porches. The app should help a player move from an active-game question to a practical, explained recommendation in seconds. It should teach how to use a player's in-game collection; it must not become a second collection, gear, level, or progression tracker.

This is a planning document only. The current production behavior and public URLs remain the baseline until replacements have been tested.

## Current Architecture

- The production site is a static root-level HTML site, served by Vercel, with no framework, package manifest, build system, backend, database, automated tests, or checked-in deployment configuration.
- Pages include the home guide, My Roster, Team Builder, Dragons, Champions, Factions, Status Effects, Allies, and an unlinked avatar demo.
- Styling is duplicated across pages and depends on the Tailwind CDN at runtime.
- `champions-part1.json` and `champions-part2.json` are the functional champion library. `app.js` fetches, merges, and currently silently deduplicates the records.
- Browser-only roster selection is stored in `localStorage` under `gotlg_roster_v1`; existing champion IDs and this key must be treated as compatibility contracts.
- The Team Builder combines hard-coded proven team shapes in `builder.html` with a score/tag/role-based picker in `app.js`.
- Raid, War, and Dragon guidance is duplicated between the home page, Team Builder, Dragons page, and supporting static pages. Faction, ally, and status information also exists both as static prose and, in part, as champion data.
- Champion portrait data is embedded as base64 JPEGs across many ordered global JavaScript files.

## Main Technical Risks

1. There is no canonical source of truth. Champion, faction, ally, status, and strategy facts can disagree across JSON, HTML, and JavaScript.
2. The champion data currently contains duplicate IDs, stale count claims, missing strategy-referenced champions, orphan portraits, incomplete portrait coverage, and silently ignored duplicates.
3. Shared navigation, styles, portrait script lists, and avatar rendering are copied across pages. This creates drift and inconsistent mobile navigation.
4. Recommendation logic depends on manual scores, broad tags, and name matching. It needs explicit validation and provenance before it becomes more capable.
5. The existing roster picker can render incomplete War teams because it begins a four-team split with only five owned champions.
6. Deployment settings are external to Git. Vercel project, production branch, custom domain, preview policy, and rollback procedure must be documented before production changes.
7. The runtime Tailwind CDN and the many global base64 portrait scripts are external/performance/maintenance constraints that should be replaced only after visual and functional parity is established.

## Target Direction: Strategy Command Center

The redesigned app should lead with the player's immediate question, such as a boss, Raid role, War outpost, matchup, or team substitution. It should then provide:

- a concise recommendation;
- the reason it works;
- viable alternatives when a recommended champion is unavailable or under-invested;
- clear confidence and provenance for factual and observed guidance;
- optional access to deeper mechanics without forcing players through a roster-management workflow.

Champion data should support this direction through one validated schema that can represent identities, variants, factions, roles, statuses, allies, portraits, mode relevance, substitutions, rationale, and provenance. Facts and strategy guidance should be marked as Screenshot Verified, Official Current, Derived, or Community/Observed.

## Incremental Migration Order

1. **Protect the baseline.** Record Vercel production settings, domain configuration, branch policy, and rollback steps. Keep all current URLs and retain the current static site as a deployable rollback target.
2. **Add validation before migration.** Create read-only checks for JSON schema, duplicate IDs, required fields, strategy references, portrait coverage, local links, and mobile navigation. Validation must fail loudly; it must not silently discard invalid data.
3. **Define a canonical data model.** Consolidate champion records first while preserving current IDs and `gotlg_roster_v1` compatibility. Add provenance and source references. Keep legacy data readable during transition.
4. **Generate reference content from data.** Move faction lists, ally pairs, status definitions, portrait mappings, and champion filters to the canonical data model, verifying existing wording and confirmed facts as they are migrated.
5. **Extract shared static UI.** Introduce a small shared layout/navigation/style layer suitable for a static site. Fix mobile navigation and preserve page URLs. Do not add a framework unless the migration demonstrates that simple static tooling is insufficient.
6. **Separate strategy knowledge from rendering.** Represent mode guidance, team archetypes, substitutions, and explanations as validated strategy data. Preserve current proven shapes and caveats before refining recommendations.
7. **Improve the command-center flow.** Build question-first mobile interfaces alongside the existing pages, validate them in preview deployments, and replace old flows only when parity and usability are demonstrated.
8. **Modernize assets and deployment safely.** Move portraits out of ordered global scripts into a maintained asset manifest, pin or compile CSS if needed, add preview checks, and document production release and rollback procedures.

Each step should be implemented in small, reviewable commits on non-main branches. Production deployment and any migration that changes a public URL require explicit approval.
