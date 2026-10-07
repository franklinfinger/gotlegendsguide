# Phase 4 Home and Legendary Assault integration

The Home hero now accepts strategy questions and renders the existing deterministic conversation on the same page. The Champions page keeps its own name, variant, color, rarity, and faction search. A question sent from Home no longer becomes a champion-name query.

Each Legendary Assault encounter displays its recommended lineup and battle guidance above the ability and tip reference. The encounter link opens the same strategy conversation with its target already selected. Drogon retains its screenshot-matched exact lineup.

The player supplied three additional current first-party lineups on 2026-10-07. The original recommendation images are not attached to these new records, so the database preserves that provenance precisely:

| Encounter | Exact identities | Pending identities | Leader |
| --- | ---: | --- | --- |
| Viserion | 4 of 5 | Jon Snow variant | Benjen Stark |
| Rhaegal | 2 of 5 | Criston Cole variant; both Daenerys Targaryen variants | second Daenerys slot, exact variant pending |
| Icy Viserion | 5 of 5 | none | Jaqen H'ghar |

The Viserion and Rhaegal lineups appear as first-party recommendations with unresolved slots. They are never converted to exact IDs by name matching. Players can request a separately labeled deterministic alternative. Icy Viserion's lineup is exact, while its encounter ability cards and champion-specific battle interactions remain unavailable.

The original `IMG_2125.PNG`–`IMG_2127.PNG` Tips and Tricks screenshots visibly contain three Icy Viserion tips that had been omitted from the structured read model. The exact lines and nine screenshot links are now present in SQLite and Supabase. This corrects a missing relationship without fabricating ability cards. The source reconciliation manifest identifies the newly connected tip records.
