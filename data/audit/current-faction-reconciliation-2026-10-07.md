# Current faction reconciliation — 2026-10-07

Current live Supabase state after profile-banner reconciliation. The 12 established faction bonuses and five live update factions are represented. Every added established membership is linked to its individual profile screenshot in `profile-faction-reconciliation.json`. The five newer factions and their 26 exact mapped members retain source 620.

**Totals:** 17 current factions; 129 memberships; 35 dual-faction variants.

| Faction | Members |
| --- | ---: |
| Baratheon | 11 |
| Beyond The Wall | 4 |
| Blacks | 8 |
| Bolton | 4 |
| Brotherhood | 4 |
| Free Cities | 11 |
| Free Folk | 6 |
| Greens | 8 |
| Greyjoy | 3 |
| Lannister | 15 |
| Lords Of The Tide | 4 |
| Night's Watch | 5 |
| Stark | 14 |
| Sun's Dominion | 8 |
| Targaryen | 14 |
| The Scattered Banners | 6 |
| The Way Of Whispers | 4 |

## Dual-faction variants

- Adolescent Drogon (`sqlite-champion-31`): Free Cities + Targaryen
- Aegon II Targaryen (`legacy-champion-aegonii`): Greens + Targaryen
- Aemond Targaryen (`legacy-champion-aemond`): Greens + The Way Of Whispers
- Alicent Hightower (`sqlite-champion-58`): Greens + Targaryen
- Arya Stark - Winterfell Returned (`sqlite-champion-24`): Brotherhood + Stark
- Benjen Stark (`sqlite-champion-48`): Night's Watch + Stark
- Bran Stark (`sqlite-champion-53`): Beyond The Wall + Stark
- Brienne of Tarth - True Knight (`sqlite-champion-51`): Baratheon + Stark
- Bronn (`sqlite-champion-73`): Lannister + The Scattered Banners
- Cersei Lannister - Queen of the Seven Kingdoms (`sqlite-champion-75`): Lannister + The Way Of Whispers
- Corlys Velaryon (`sqlite-champion-37`): Blacks + Lords Of The Tide
- Craster (`sqlite-champion-62`): Free Folk + Night's Watch
- Criston Cole — Kingmaker (`audit-variant-criston-kingmaker`): Greens + Sun's Dominion
- Criston Cole — Personal Escort (`sqlite-champion-65`): Sun's Dominion + Targaryen
- Daario Naharis (`sqlite-champion-13`): Free Cities + The Scattered Banners
- Daemon Targaryen (`sqlite-champion-1`): Blacks + Targaryen
- Egg (`sqlite-champion-47`): Targaryen + The Scattered Banners
- Euron Greyjoy (`sqlite-champion-36`): Greyjoy + Lannister
- Gendry (`sqlite-champion-57`): Baratheon + Brotherhood
- Jaqen H'ghar (`sqlite-champion-21`): Lannister + The Scattered Banners
- Joffrey Baratheon (`sqlite-champion-22`): Baratheon + Lannister
- Laenor Velaryon (`sqlite-champion-30`): Blacks + Lords Of The Tide
- Lord Varys (`sqlite-champion-50`): Baratheon + Free Cities
- Meleys (`sqlite-champion-25`): Blacks + Targaryen
- Osha (`sqlite-champion-63`): Free Folk + The Way Of Whispers
- Otto Hightower (`sqlite-champion-76`): Greens + Sun's Dominion
- Rhaenyra Targaryen (`sqlite-champion-9`): Blacks + Targaryen
- Rhaenys Targaryen (`sqlite-champion-8`): Blacks + Targaryen
- Rickard Karstark (`sqlite-champion-38`): Bolton + Stark
- Sandor Clegane (`sqlite-champion-10`): Baratheon + Lannister
- Talisa Stark (`sqlite-champion-84`): Stark + The Scattered Banners
- Theon Greyjoy (`legacy-champion-theon`): Greyjoy + Stark
- Thoros of Myr (`legacy-champion-thoros`): Brotherhood + Free Cities
- Tyland Lannister (`legacy-champion-tyland`): Greens + Lannister
- Viserys Targaryen III (`sqlite-champion-41`): Free Cities + Targaryen

## Normalization and limits

- Historical icon-label rows Martell, Tyrell, and Wildling were retained as superseded records and removed from the live read model. Areo Hotah and Olenna Tyrell retain their source-620 Sun's Dominion membership; Osha has the profile-supported Free Folk membership alongside The Way Of Whispers.
- Grey Wind was named on the archived faction page but has no verified variant ID among the 108 live variants; no champion record or relationship was invented.
- Source 620 also names Tyrion “Lord Of Casterly Rock” and Davos “Hand Of Stannis”. Those exact subtitles are not linked to verified variant IDs, so the two source-620 memberships remain unassigned.
- No champion has more than two current factions. The old roster and profile images do not establish whether every historical member remained playable in the present game build; this report describes current faction tags supported by the available sources and the update statement that existing tags remain.
