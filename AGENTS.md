# Project Rules

## PRODUCT PHILOSOPHY

- The game manages the player's collection.
- This app teaches the player how to use that collection intelligently.
- Do not build a system that requires users to maintain their roster, gear, stars, levels, or champion development in this app.
- The primary goal is to help Old Peeps on Porches players make better decisions while actively playing GOT: Legends.
- Favor practical battle strategy over complicated features.

## CORE UX

- Mobile-first.
- A player should get from a question/problem to a useful answer in seconds.
- Hide complexity underneath a simple interface.
- Explain WHY recommendations work.
- Prefer alternatives and substitutions over rigid five-champion prescriptions.

## DATA

- Work toward one canonical source of truth for champion and strategy data.
- Preserve existing champion IDs wherever possible.
- Preserve important existing strategy knowledge even when old UI features are eventually replaced.
- Track provenance for game facts and strategy: Screenshot Verified, Official Current, Derived, or Community/Observed.
- Do not silently deduplicate or silently ignore invalid data.

## SAFETY

- Never push directly to main unless explicitly instructed.
- Never deploy production unless explicitly instructed.
- Preserve current public URLs unless an approved migration provides redirects.
- Do not delete old functionality until its replacement has been tested.
- Make changes incrementally so the current production version can always be restored.

## TECHNICAL DIRECTION

- Do not introduce a heavyweight framework, database, package ecosystem, or backend unless there is a demonstrated need.
- Prefer simple, maintainable solutions.
- Reuse proven open-source libraries when appropriate rather than recreating common functionality.
- Avoid unnecessary dependencies.
