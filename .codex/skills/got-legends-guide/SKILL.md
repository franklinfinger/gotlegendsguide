---
name: got-legends-guide
description: Safely evolve GOT Legends Guide into a mobile-first strategy command center for Old Peeps on Porches. Use for game-knowledge, strategy, UI, validation, preview, and release work in this repository; not for unrelated coding tasks.
---

# GOT Legends Guide Development

Use this skill for work in this repository that affects product direction, game knowledge, strategy guidance, player-facing UI, validation, Vercel previews, or release preparation.

## Outcome

Help an Old Peeps on Porches player make a better GOT: Legends decision quickly. The game owns collection and progression state; this app explains how to use that collection through practical strategy, reasons, counters, and substitutions.

Treat [AGENTS.md](../../../AGENTS.md) as the repository rulebook. Read it before making changes. Also read the relevant implementation and current data before changing a feature. If this skill conflicts with `AGENTS.md`, stop and surface the conflict.

## Route by task

- For product intent, mobile UX, visual design, or UI implementation, read [product-experience.md](references/product-experience.md).
- For champions, variants, factions, skills, statuses, synergies, counters, allies, strategy facts, or game updates, read [game-knowledge.md](references/game-knowledge.md).
- For any meaningful change, validation, preview, release preparation, or repeated maintenance task, read [workflows.md](references/workflows.md).

## Essential constraints

- Do not turn the app into a roster, gear, stars, levels, power, or champion-development tracker.
- Preserve existing public URLs, champion IDs, important strategy knowledge, and viable rollback paths unless an approved migration says otherwise.
- Do not silently deduplicate, discard invalid records, merge distinct variants, or present uncertain game knowledge as confirmed fact.
- Prefer simple static-site-compatible solutions. Do not introduce a framework, backend, database, package ecosystem, or build infrastructure without a demonstrated need and approval.
- Never push or merge to `main`, or deploy production, without explicit instruction.
- Keep changes incremental. Do not replace working behavior until its tested replacement is approved.

## Before declaring work complete

Report the actual checks run and their results. For meaningful work, assess data integrity, affected existing behavior, mobile and desktop usability, documentation, preview status, and unresolved assumptions. Do not claim visual inspection, deployment, or verification that did not occur.
