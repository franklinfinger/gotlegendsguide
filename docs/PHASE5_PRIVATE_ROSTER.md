# Phase 5 private roster and strategy

## Scope

The public guide and first-party recommendations remain available without sign-in. A question that says “my,” “from my roster,” or “can I make” switches to the private roster path. The conversation parser never selects a champion itself: it passes owned exact variant IDs to the deterministic engine.

## Ownership and sign-in

`public.player_roster` has one row per `(user_id, variant_id)`. `user_id` references Supabase Auth `auth.users`; `variant_id` references `knowledge.champion_variants`. The row stores `owned`, nullable `level`, nullable `stars`, and timestamps. A removed champion is deleted from the roster. Two variants of one character remain separate rows. No account power or progression formula exists.

The static app uses the official Supabase JavaScript client for email magic-link sign-in. Only the publishable key is bundled. Auth redirects are allow-listed for the `got-app-redesign` preview roster page and local port 4174. Supabase Auth verifies the user; the browser sends the user's token to PostgREST. No service-role key is exposed.

RLS grants SELECT, INSERT, UPDATE, and DELETE only to `authenticated`, with separate `auth.uid() = user_id` policies for each operation. The compound key and foreign key enforce exact variant identity. The trigger updates `updated_at`. An anonymous read/write check is in `scripts/validate-roster-security.mjs`; a transactional two-user SQL test with rollback is in `scripts/validate-roster-rls.sql`.

## Player flow

My Roster shows portraits and exact names in a compact list. A player can search, filter by affinity or either current faction, tap Add or Owned, and edit level or stars inline. The app never asks them to open a separate detail page. A signed-out visitor can browse variants and is prompted to sign in before saving.

Home and Strategy answer ordinary “best” questions with the existing curated/engine hierarchy. A roster question loads only the signed-in user's entries. The final team must consist of five owned exact variants. If there are fewer than five eligible variants, it reports the shortage instead of borrowing unowned champions.

For a fully identified first-party lineup, owning all five preserves the official team and leader. If one is missing, the engine anchors the owned official members and chooses the best remaining owned fit. The result is labeled **Best team from your roster**, never the official lineup. Missing variants, completion count, and deterministic replacements are shown. Partial first-party lineups retain unresolved positions; a same-name variant is never treated as an exact match. “Who am I missing?”, “Who should I use instead?”, and “Which official team am I closest to completing?” keep target context.

Level and stars are saved and displayed, but have no effect on team ordering. Community-observed pairs remain zero-score context. The Icy Viserion ability-card gap still prevents an engine-derived substitute; its exact first-party lineup remains visible when owned.
