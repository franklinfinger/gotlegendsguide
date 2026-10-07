# Public multi-team strategy correction

Phase 5's personal roster was removed. Strategy requires no account, ownership entry, level, stars, gear, or other player-maintained collection data. The retired `roster.html` address forwards to the public Strategy page so an old link still reaches a useful page.

The forward migration `20261007150000_remove_player_roster.sql` refuses to drop a nonempty `public.player_roster` table. It then removes only that table and its dedicated timestamp function. The applied Phase 5 migration stays in history, and Supabase Auth remains untouched.

## Recommendation order

1. A current, high-confidence first-party in-game lineup appears first when all exact variants are identified. A partial first-party lineup remains visible with unresolved positions clearly marked.
2. The deterministic engine searches for additional five-variant teams using the same verified target fit, synergy, leader, and provenance rules as before.
3. Alternative teams must contain at least three different exact variants from every previously selected engine team, have positive supported fit and at least one verified fact link, and retain at least 55% of the strongest engine score. The search stops at five total options, or earlier when the available evidence cannot support another distinct option.
4. Community-observed pairs remain zero-score context. No AI component chooses or alters a lineup.

Strategy labels come from positive source-linked mechanics in each lineup. The options show champion portraits and exact variants, supported leader, mechanics, timing, substitutes, warnings, confidence, and expandable evidence. A player compares the options against their collection inside the game.

## Raid Attack limit

The player can identify five exact opposing variants. The page shows selected verified mechanic facts for each opponent and multiple deterministic general Raid Attack lineups. The current source corpus does not verify specific champion-versus-champion counter rules or target priority, so the selected opponent does not change team ranking. The interface says this explicitly. It does not claim matchup-proven counters.

The five prioritized historical evidence gaps remain recorded in the source audit. Icy Viserion's official lineup stays visible; missing ability cards still block engine-generated encounter alternatives.
