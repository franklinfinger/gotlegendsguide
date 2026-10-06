# Phase 1 verified strategy database

The existing app remains static HTML and JavaScript. Its historical champion JSON and pages are preserved. The protected `knowledge` schema mirrors every row and column in the verified SQLite snapshot, including source IDs, Drive image references, all completion/review fields, announced update tables, raid rules, and team examples. The additional identity tables use stable IDs derived from SQLite primary keys; they do not merge cards by name or filename.

## Source and import

The source is `got_legends_verified_knowledge.db`, held outside Git. `supabase/source-manifest.json` pins its SHA-256 and the exact count of all 27 tables. Run:

```sh
python3 scripts/import-verified-sqlite.py --sqlite /absolute/path/got_legends_verified_knowledge.db --check-migration
```

This validates SQLite integrity, foreign keys, checksum, every table count, and generation of the full seed. It makes no network request. The importer uses primary-key upserts and a transaction. It asserts all raw and derived counts inside Postgres before commit. Re-running it against the same snapshot is safe.

To apply to the empty Supabase project, obtain the project's **Postgres connection URI** from Supabase's Connect panel, then run this single command from the repository root (with `psql` installed):

```sh
SUPABASE_DB_URL='postgresql://...' python3 scripts/import-verified-sqlite.py --apply --sqlite /absolute/path/got_legends_verified_knowledge.db
```

The publishable key cannot execute database DDL or seed writes. Keep the connection URI outside Git and terminal history where practical. The command does not print it. It applies the migration, imports all rows, and fails on a count mismatch. No service-role key is used.

## Data boundaries

- All 27 source tables are copied without name-based deduplication. `sources` retains Drive IDs, URLs, filenames and verification state; `source_images` is a protected metadata index, not copied image binaries.
- `champion_variants.id` uses `sqlite-champion-<champion_id>`. `characters.id` is intentionally one-to-one for this snapshot because the SQLite database does not prove which cards share a lore identity. Later reviewed records may establish relationships without changing the variant IDs.
- Current champion faction membership comes only from `champions.faction`. The one announced update, five announced faction changes, 28 announced champion associations, and 13 announced strategy rules stay in separate source tables. They are not treated as live.
- `abilities` and `ability_effects` retain exact visible text from definitions, champion skills, iconic abilities, boss abilities and companions. `effect_kind = unparsed_visible_text` means no mechanic was inferred from prose. Detailed stats remain in the source mirror.
- There are no live faction-rule records in the source; the normalized `faction_rules` table is ready for reviewed rules.

## Browser access

The `knowledge` schema has RLS enabled on every table. Browser roles have no insert, update or delete grants. They can select only reviewed live champion identities, factions and memberships, with matching RLS policies. Supabase's public API exposes two fixed read-only functions: `got_data_health()` and `got_current_champions()`. Raw source URLs, announced records and unreviewed rows are not exposed by these functions.

The static build reads `.env.local` or the build environment and writes a generated `dist/supabase-config.js` containing only the publishable URL and key. Both `.env.local` and `dist/` are ignored by Git. Add these exact names to Vercel later:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

`health.html` reports connection, champion/ability/boss/faction/announcement counts, version and import time. The source mirror remains the audit record; existing app pages continue to use their previous JSON until a reviewed UI migration is ready.

## Validation

Run `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run db:validate`. The last command validates the source and generated seed locally. The seed checks every Postgres mirror count against SQLite and checks the derived identity/effect/image counts inside the import transaction. Independently query live table counts after each import.

## Live setup verified on 2026-10-06

The `got-legends-guide` Supabase project (`tstpqjungenftjukoqbu`) is connected. The committed migration was applied through the authenticated Supabase CLI Management API, and version `20261005000000` is recorded as applied in Supabase migration history. The SHA-256-checked SQLite snapshot was imported in one transaction with the seed's count assertions. No database password or service-role key was required or placed in Git.

An independent live query matched the expected counts for all 36 tables: all 27 source tables plus nine derived/import tables. Key counts are 86 champions, 86 characters and variants, 188 abilities and effects, 18 factions, 36 current faction memberships, 620 sources and source images, and one import run. The import run's source hash matches `supabase/source-manifest.json`. The public `got_data_health()` API returns those expected summary counts and version `verified-sqlite-2026-10-05`; `got_current_champions()` returns 24 reviewed, complete champions.

The browser configuration in `.env.local` was already present and remains ignored by Git. No production deployment or existing page data-source migration was performed.
