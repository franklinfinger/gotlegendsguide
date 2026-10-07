# Battle-first UI check — 2026-10-07

This pass changed the Home, Strategy, War, Legendary Assault, Factions, and shared team presentation. The recommendation scoring and verified game facts were unchanged.

## Official lineup identity review

The accessible reconciliation corpus contains roster and encounter-tip images, but no identified first-party lineup screenshot that ties these supplied positions to an exact variant portrait or affinity. The curated records themselves say the original recommendation images are not attached. Therefore the exact IDs remain unresolved:

- Rhaegal position 1: Criston Cole (two source-backed variants).
- Rhaegal position 2: Daenerys Targaryen (variant not established).
- Rhaegal position 4 and Leader: Daenerys Targaryen (variant not established).
- Viserion position 3: Jon Snow (two source-backed variants).

The player UI now shows the supplied name and “Exact variant being verified” in each slot. It does not assign an affinity, faction, or portrait from another variant.

## Meryn Trant portrait

The legacy 72×72 asset `meryn--portraits-lan-4.jpg` has damaged pixels. `IMG_2242.PNG` was fetched from its connected Drive record, verified against the reconciliation SHA-256, and cropped with the existing fixed profile crop method. The original asset remains untouched. The derived 512×512 portrait, source ID, hash, crop dimensions, and attribution are recorded in `data/audit/meryn-portrait-repair.json`; the Supabase mapping is in migration `20261007160000_repair_meryn_portrait.sql`.

The live validation now requires every selected portrait path to exist locally and each recommendation card's exact variant ID and portrait to agree with the canonical read model.

## Faction artwork

No verified faction emblem asset exists under the repository assets. The updated faction sections use typography and verified champion portraits, including dual-faction labels, without fabricated sigils.
