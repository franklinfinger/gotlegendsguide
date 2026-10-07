# Phase 3 deterministic strategy engine

## Purpose

The engine ranks exact champion variants for a selected battle context. It uses the verified Supabase read model plus reviewed scoring rules. It does not use a paid AI API, account roster, power, stars, levels, or equipped gear.

## Data model

Migration `20261007020000_deterministic_strategy_engine.sql` adds five private `knowledge` tables and one fixed public RPC:

- `strategy_mechanics`: normalized effects such as FIRE, BLEED, RAID, healing, stamina, and reinforcement.
- `strategy_fact_patterns`: reviewed patterns that extract normalized mechanics from source backed champion text.
- `strategy_targets`: the four Legendary Assault encounters, Raid attack and defense, and nine War rules.
- `strategy_rules`: target fit and team synergy scores, each with rationale, evidence category, provenance, confidence, and review status.
- `strategy_champion_facts`: exact variant facts extracted from abilities, traits, colors, factions, and release state.
- `got_strategy_data()`: read only browser payload for the deterministic engine.

The committed catalog contains 57 mechanics and 93 rules: 80 target fit rules and 13 team synergy or coverage rules. The live RPC currently exposes 1,071 exact variant facts.

## Scoring

1. Remove explicit exclusions, unverified releases, and the encounter dragon itself.
2. Match each exact variant's verified facts to target rules.
3. Apply rewards for counters and useful mechanics and penalties for immunities or punished mechanics.
4. Keep the best 24 candidates, then use a deterministic beam search to assemble five variants.
5. Add reviewed team synergy, current shared faction context, and a small observed composition signal when names resolve to one exact variant.
6. Select a leader only when that exact variant has a source backed Leader fact.

Rule provenance and the verified fact provenance are returned separately. Community compositions receive weak support only and never imply a win.

## Supported questions

The local parser safely recognizes questions naming Drogon, Rhaegal, Viserion, Icy Viserion, Raid attack, Raid defense, or an exact verified War rule such as Ravenous Pack. Ambiguous Raid questions and unsupported wording do not guess; the structured selectors remain available.

## Known limits

- Icy Viserion has no verified ability cards, so the engine returns an insufficient evidence result and no team.
- Recommendations measure strategic fit, not account specific strength.
- Observed teams have no verified battle outcomes.
- Five prioritized historical source gaps remain recorded in the source audit and are not filled by inference.
