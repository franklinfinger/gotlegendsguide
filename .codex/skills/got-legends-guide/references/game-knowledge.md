# Game Knowledge and Provenance

## Canonical knowledge direction

Work toward one structured, validated source of truth covering champions and variants, factions, roles, skills, traits, leadership abilities, status effects, synergies, counters, vulnerabilities, allies, iconic gear, Raid Attack/Defense, Alliance War, dragon modes, and relevant mechanics.

Champion identity must support multiple variants of the same character. Preserve stable existing IDs whenever reasonable. Treat a variant as distinct unless evidence establishes otherwise.

Never silently deduplicate, discard invalid data, guess missing game facts, or merge distinct variants. Surface validation failures and source conflicts explicitly.

## Provenance

Use these labels when facts or strategy are added to structured knowledge:

- **Screenshot Verified** — directly supported by a game screenshot.
- **Official Current** — directly supported by current official material.
- **Derived** — reasoned from verified mechanics; include the reasoning basis.
- **Community/Observed** — player testing or community evidence; communicate uncertainty and conditions.

Do not imply that the external screenshot archive has been fully transcribed; it is not currently in this repository. When sources conflict, retain the conflict until reliable evidence resolves it.

## Knowledge changes

For a champion or variant, preserve compatibility identifiers; record identity/variant distinction, mechanics, roles, factions, relationships, source, provenance, and unresolved uncertainty. Validate references before the change can be consumed.

For a synergy, counter, faction, status, or strategy update, capture the relationship direction, applicable mode or conditions, explanation of why it works, alternatives/substitutions, evidence/provenance, and uncertainty. Do not promote an observed outcome to a universal rule.

For a game update, first identify which facts are new, changed, uncertain, or contradicted. Update only evidence-backed knowledge, preserve prior facts where historical context matters, run consistency checks, and call out unverified gaps.
