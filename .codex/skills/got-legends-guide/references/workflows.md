# Development, Validation, and Release Workflows

## Safe change loop

1. Confirm the current branch and working-tree state; never work directly on `main` without explicit instruction.
2. Read `AGENTS.md`, the relevant skill reference, the affected implementation, and the affected data before editing.
3. State any material assumption. Stop for a decision if the work changes product philosophy, canonical IDs, public navigation/information architecture, production deployment behavior, significant infrastructure, external APIs/costs, substantial functionality removal, IP/licensing risk, secret handling, or an irreversible migration.
4. Make the smallest reversible change that meets the approved task.
5. Run relevant deterministic validation and inspect the changed behavior proportionally to risk.
6. For meaningful UI or production-candidate work, use a Vercel preview and report its status. Never deploy production without explicit approval.

## Repeatable knowledge workflows

### Add or revise a champion or variant

Preserve or deliberately map the stable ID; distinguish variants explicitly; attach provenance; validate uniqueness, required fields, faction/status/ally references, portrait mapping, and any affected strategy references. Surface conflicts instead of resolving them by guesswork.

### Add or revise a synergy, counter, status, faction, Raid, War, or dragon strategy

Record the applicable context, mechanism, recommendation, why it works, alternatives, vulnerabilities, provenance, and confidence. Validate every champion and mechanic reference. Keep observations conditional and retain source conflicts.

### Process a game update

Inventory evidence first. Identify affected facts and modes, apply only verified changes, maintain provenance, validate impacted relationships and guidance, and report unresolved or conflicting information.

## UI workflows

### Implement a UI feature

Start from the player's decision and the smallest relevant screen. Read `product-experience.md`, preserve existing URLs and working behavior, make the mobile path primary, explain recommendations, and favor substitutions over rigid lineups. Check affected navigation, loading behavior, small-screen layout, desktop layout, and existing flows.

### Perform a UI quality review

Evaluate actual player questions, hierarchy, readability, tap targets, thumb reach, density, horizontal overflow, search/navigation, loading state, portrait/status clarity, and visual consistency. Identify concrete defects and evidence rather than generic aesthetic preferences.

## Validation checklist

Select checks that fit the task; compilation alone is not completion. Relevant checks include:

- unique champion IDs and schema validity;
- champion, portrait, faction, ally/synergy, and status-effect references;
- local links and existing URL behavior;
- JavaScript parsing and affected functional behavior;
- mobile and desktop layout/usability;
- regressions in existing functionality;
- Vercel preview behavior for meaningful changes.

Report what was actually tested and what was not.

## Preview and approved release preparation

For a preview, push only the approved non-main branch, wait for Vercel, verify the preview URL and access state, and inspect the relevant behavior. A protected preview is still useful, but report that access limitation.

For an eventual production release, prepare a concise change summary, validation evidence, URL/compatibility impact, rollback path, and preview link. Stop for explicit approval before merging to `main` or deploying production.
