# GOT Legends Guide UX Design Specification

## Status and scope

This specification defines the approved direction for the GOT Legends Guide strategy-command-center redesign. The first implementation is limited to an isolated Home visual prototype. Existing pages, data, URLs, and production behavior remain the baseline until replacement flows have been tested and approved.

## Product north star

The game manages a player's collection. GOT Legends Guide teaches the player how to use that collection intelligently while they are playing GOT: Legends. The product should take an Old Peeps on Porches player from an immediate question to an explained, practical strategy in seconds.

The app is a battle-decision tool, not a roster, gear, stars, level, power, or progression tracker. Recommendations should teach mechanics, complementary roles, flexible cores, counters, and substitutions rather than prescribe a mandatory five-champion roster.

## Information architecture

### Primary mobile navigation

Use five persistent mobile destinations:

1. **Home** — question-first entry point and primary intents.
2. **Champions** — portrait-led champion discovery, relationships, counters, and modes.
3. **Battle** — Raid, War, and Dragon strategy.
4. **Teams** — team construction, synergies, cores, complementary champions, and substitutions.
5. **Learn** — Status Effects, Factions, Synergies, Mechanics, and Tips/Guides.

Search does not occupy a persistent navigation position. It remains immediately available from the prominent **Ask GOT Legends...** field on Home, and later from a compact search control in interior-page headers.

On desktop, expose the same primary concepts through compact header navigation. Existing public routes, including the current roster and team-builder pages, remain available during transition and are not removed or rerouted by this specification.

## Home experience

### Purpose

Home has one job: get the player from “I need help” to a useful strategic path immediately.

### Content order

1. Compact identity: **GOT LEGENDS GUIDE** with **Old Peeps on Porches · Strategy Command Center**.
2. Prominent question/search interaction: **Ask GOT Legends...**.
3. Example prompts: **Counter Night King**, **Best partners for Drogo**, and **Drogon strategy**.
4. Intent heading: **What are you trying to do?**
5. Six compact action treatments:
   - **Win a Raid** — See an opponent and figure out how to beat them.
   - **Prepare for War** — Build smarter attack and defense strategies.
   - **Fight a Dragon** — Drogon, Rhaegal, Viserion, and Icy Viserion.
   - **Find a Champion** — Skills, synergies, counters, and best uses.
   - **Counter Someone** — Choose an enemy champion and learn how to attack them.
   - **Build Better Teams** — Find champion combinations that actually work together.

The actions are dense tactical controls, not a collection of oversized generic cards. On a phone, the brand, search control, and the major actions should be understandable in the first viewport without excessive scrolling.

### Search behavior

The interface may use natural-language phrasing, but its first retrieval architecture should be structured and deterministic:

1. Identify recognized entities and intents (champion, dragon, enemy counter, Raid, War, status, faction, or synergy).
2. Show exact and close entity matches first, keeping variants distinct.
3. Show grounded strategy guidance: concise recommendation, why it works, alternatives, and provenance.
4. Ask a narrowing question only when the input is genuinely ambiguous.

Search must not imply AI certainty or invent strategy. It should work from validated strategy knowledge before requiring paid AI.

## Battle

Battle begins with Raid, War, and Dragons.

### Raid flow

The player identifies the five enemies they are facing through a quick portrait-led picker:

`[ + Enemy ] [ + Enemy ] [ + Enemy ] [ + Enemy ] [ + Enemy ]`

The resulting guidance is ordered for an active battle:

1. How this team is trying to beat you.
2. Biggest threat.
3. Target priority and why that priority matters.
4. What breaks this team.
5. Relevant mechanics and status counters.
6. Strong counter champions.
7. Other viable alternatives.

The output teaches types of champions and mechanics that solve the matchup. It must not require users to maintain a second roster in the guide or claim a single mandatory five-champion answer.

### Dragons

Players choose Drogon, Rhaegal, Viserion, or Icy Viserion. Each dragon page starts with **The 30-second answer**, then progressively discloses Best Champion Types, Strong Champions, Useful Synergies, What Not To Do, Boss Mechanics, and Full Strategy.

## Champions and Teams

Champion discovery is portrait-first and highly searchable. A detail view prioritizes identity, portrait, exact variant classification, and a plain-English explanation of what the champion does. It then organizes Overview, Synergies, Counters, Skills, and Modes around:

- Best Used For
- Works Well With and why
- Strong Against
- Watch Out For
- Team Ideas: Core Pair, Core Three, and Other Options

Teams is the home for construction and relationship guidance. It should surface team cores, complementary roles, substitutions, and the reason a relationship works. It must preserve multiple variants as distinct records.

## Learn

Learn is the reference layer, not the primary Home experience. It provides concise, searchable Status Effects, Factions, Synergies, Mechanics, and Tips/Guides, with links back to relevant champions and battle situations.

## Visual and interaction system

- Design for an iPhone during an active battle first; desktop is an intentional wider composition, not a stretched phone screen.
- Use dark near-black and charcoal surfaces, high-contrast type, subtle dividers, compact spacing, and restrained warm/metallic accents.
- Use champion portraits where they improve recognition. Use color only for meaningful state, faction, status, threat, or interaction feedback.
- Favor tactical density, scannable headings, strong type hierarchy, clear focus treatment, and 44px-or-larger tap targets.
- Avoid generic AI/SaaS conventions: gradients, glassmorphism, oversized heroes, large empty areas, endless rounded-card grids, purple/blue AI palettes, decorative widgets, excessive pills, unnecessary motion, and fake complexity.
- Do not copy Zynga's UI or imply an official affiliation. Do not use unlicensed external artwork.

## Prototype acceptance criteria

The isolated Home prototype must:

- retain the existing `index.html` and all current production routes unchanged;
- use Home, Champions, Battle, Teams, and Learn as its mobile navigation labels;
- make the search input, action controls, and navigation visibly interactive and keyboard accessible;
- support approximately 390px and 430px phones, tablet, and 1440px desktop without horizontal overflow or compromised readability;
- use existing local assets only where appropriate;
- avoid implementing live search, recommendation logic, roster storage, or destination-page redesigns;
- remain static-site compatible and require no packages, framework, database, production deployment, commit, or push.

## Future implementation sequence

After review of the Home prototype, apply the approved visual language to one representative flow at a time. Preserve existing public URLs and working behavior, validate data and strategy references before rendering recommendation logic, and expand only after preview-based usability and parity checks.
