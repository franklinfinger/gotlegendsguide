# Restored live guide

The player pages use the frozen, source-reconciled Supabase baseline through the typed `supabase-client.js` data layer. The read-only `public.got_guide_data()` function returns a curated application model and omits private source locators, raw audit rows, and database credentials. The browser receives only the Supabase project URL and publishable key.

## Player sections

| Section | Route | Live content |
| --- | --- | --- |
| Home | `index.html` | Fast paths to champions and battle modes |
| Champions | `champions.html` | 108 variants, portraits, colors, rarities, factions, skills, traits, and connected items |
| Items | `items.html` | 31 iconic items with champion relationships and recorded ability wording |
| Teams | `builder.html` | 40 observed community compositions with full membership and no claimed outcomes |
| Raid | `raids.html` | Eight verified rules plus separately labeled attack and defense examples |
| War | `war.html` | Nine verified battlefield rules |
| Legendary Assault | `dragons.html` | Four represented encounters with available abilities, rules, and tips |
| Factions | `factions.html` | 12 current bonuses, four play descriptions, member portraits, and separate announced changes |
| Status and mechanics | `status-effects.html` | Searchable verified glossary |

The shared interface restores the earlier black, gold, portrait-led identity while improving responsive navigation, content hierarchy, accessibility, and touch targets. All nine destinations are available in desktop navigation. The five primary mobile destinations remain visible in a fixed bottom bar; the complete list is available from the mobile menu.

## Evidence handling

- Current faction bonuses and announced future changes remain separate.
- Observed teams are labeled community examples. The interface does not claim that any observed lineup won.
- Missing portraits use a deliberate initial fallback.
- Partial traits use a subtle availability label without reconstructing cropped words.
- Icy Viserion remains visible as a Legendary Assault encounter while its unavailable ability cards are stated plainly.
- The five prioritized historical resupply files remain recorded in `data/audit/prioritized-historical-resupply.tsv` and `docs/SOURCE_COMPLETENESS_AUDIT_2026-10-06.md`. They do not prevent navigation or page rendering.

Loading, empty-result, missing-image, unavailable-evidence, and database-error states use the same player-facing visual system. Internal data notes and health checks remain available from the footer and are excluded from primary navigation.

## Preserved project sources

The legacy pages, local JSON, SQLite snapshots, source manifests, source images, imported portraits, provenance records, reconciliation reports, and import scripts remain in place. The build copies the existing `assets/` tree so attributed champion portraits are present in the deployable output.

## Validation and rollout

Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run db:validate`, `python3 scripts/validate-source-reconciliation.py`, `npm run test:live`, and `npm run build`. `test:live` checks the public Supabase read model and its fixed product counts. Vercel preview deployment is separate from production deployment; production still requires explicit approval.
