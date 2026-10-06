# Phase 2 live guide

The public pages now read the verified SQLite import from Supabase through the typed `supabase-client.js` data layer. The database performs the read-only query in `public.got_guide_data()` and returns a curated read model. This fits the static site: no service-role key, database password, or server runtime is needed in Vercel. The only browser credential is Supabase's publishable key. The function omits raw source URLs, Drive IDs, image references, and detailed source mirror rows; source IDs and review states remain visible for provenance.

## Previous data-source inventory

| Interface | Previous source | Phase 2 route |
| --- | --- | --- |
| Home and strategy | Hard-coded Raid, War, dragon and team guidance in `index.html` | Live intent navigation and evidence counts at `index.html` and `strategy.html` |
| Champion directory | `champions-part1.json`, `champions-part2.json`, embedded portraits and `app.js` | Live champions, exact visible abilities and traits at `champions.html` |
| Roster | Split JSON and browser `localStorage` | `roster.html` points to live champion knowledge; the game remains the collection tracker |
| Team builder | Split JSON, browser roster, hard-coded shapes and scoring | Observed, source-labeled compositions at `builder.html` |
| Factions | Hard-coded groups and bonuses | Recorded faction labels and separately labeled announced changes at `factions.html` |
| Status and allies | Hard-coded definitions and pair suggestions | Source-labeled definitions and companions at `status-effects.html`, `abilities.html`, and `allies.html` |
| Dragons and Raid | Hard-coded boss, Raid and lineup advice | Recorded boss abilities/tips, Raid rules, separate Raid defense snapshot and observed teams at `dragons.html` and `raids.html` |
| Prototypes | Static mockups and hard-coded example matchups | The same URLs show the live home/Raid evidence; old mockups are archived |
| Health | Supabase health RPC | Continues to use its existing live RPC |
| Avatar demo | Embedded local portrait test data | Development fixture; no strategy claims |

The previous pages are retained at `legacy-*.html` with an archive banner. They still use their original local data for rollback and must not be treated as confirmed strategy. `app.js`, champion JSON, portrait assets, the external SQLite snapshot, `supabase/source-manifest.json`, source-image references, provenance rows, and import scripts have not been removed. Existing public URLs remain unchanged.

## Evidence rules in the UI

- Champion profiles show `Reviewed profile` only when the imported profile is complete; the other profiles show `Incomplete profile`.
- Ability and status text shows `Screenshot verified` only when the visible text is complete and its source is `verified_visible`. The exact source ID is retained.
- Boss abilities require complete visible text and at least one verified source. The Rhaegal boss profile itself remains incomplete. Other dragons have no verified boss records in this snapshot.
- A screenshot-verified team is a **composition observation**, not proof of a win. User assessments are labeled `Community/Observed`.
- Announced faction changes are separate from recorded current labels. The imported faction strings are shown literally because combined labels and icon descriptors have not been adjudicated. No current faction bonus rule is presented as verified.
- The database has no reviewed general counter relationships, ally-pair rules, or substitutions yet. Those recommendations are not invented by the live guide.

The guide shows loading, empty-result and database-error states, with a retry action on errors. Search and team filters operate on the returned live records.

The read model currently contains 86 champions, 188 abilities, 185 traits, two iconic items, 18 literal faction labels, five status definitions, two companions, one boss, eight Raid rules, one separate Raid team snapshot, 15 strategy team examples, and one announced update. These are source records, not all confirmed strategy recommendations.

## Validation and rollout

Run `npm run lint`, `npm run typecheck`, `npm run db:validate`, and `npm run build`. The build copies the static routes and CSS into `dist/` and writes only the public URL and publishable key into ignored `dist/supabase-config.js`. The Phase 2 SQL migration is recorded in Supabase migration history. Vercel preview configuration is limited to the Preview environment; production deployment requires separate approval.
