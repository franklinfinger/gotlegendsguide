# Phase 4 conversational strategy

## Decision path

1. `conversation-engine.js` converts player wording into a structured target, intent, exact exclusion, and optional future roster envelope.
2. A current, reviewed curated recommendation with confidence of at least 0.9 takes precedence.
3. Otherwise `strategy-engine.js` assembles the team from verified champion facts and deterministic target rules.
4. Community-observed compositions can appear in evidence context with zero score. They cannot select or rank a team.
5. Ambiguous variant names return a clarification state. They are never resolved silently.

The future roster envelope accepts owned variant IDs, levels, stars, gear, and equipped item IDs. Phase 4 carries these fields without using them to rank recommendations.

## Curated Drogon benchmark

Source `102791` (`IMG_2791.PNG`, Drive ID `1oHATOebHyarXy3fbYev2cJScnFeL85qz`) shows the following exact portrait and affinity matches:

1. Leader: `sqlite-champion-19` — Daenerys Targaryen, Khaleesi of the Great Grass Sea (Yellow)
2. `sqlite-champion-5` — Khal Drogo (Red)
3. `sqlite-champion-6` — Daenerys Targaryen, Conqueror Of Qarth (Blue)
4. `sqlite-champion-58` — Alicent Hightower (Blue)
5. `sqlite-champion-9` — Rhaenyra Targaryen (Purple)

The source supports the best-known current lineup when sufficiently developed. It does not establish that other teams cannot perform well.

## Current faction update

The sourced September faction update is marked live. Five current faction definitions, their bonuses, play descriptions, and 26 exact variant relationships were added without removing earlier memberships. The interface supports up to two current factions per champion.

Two sourced relationships remain unassigned because the exact variant title is absent from the verified variant table:

- Tyrion Lannister — Lord Of Casterly Rock
- Davos Seaworth — Hand Of Stannis

The five prioritized historical resupply files in the source completeness audit remain known evidence gaps and do not block Phase 4.
