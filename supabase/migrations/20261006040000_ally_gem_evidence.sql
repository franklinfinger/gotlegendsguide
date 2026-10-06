-- Private source-backed ally gem candidates. Raw OCR is not confirmed game wording.
-- Summoned champion companions remain a separate game mechanic.
CREATE TABLE IF NOT EXISTS knowledge.ally_gem_cards (
  id text PRIMARY KEY,
  source_id bigint NOT NULL UNIQUE REFERENCES knowledge.sources(source_id),
  owner_name_candidate text NOT NULL,
  ally_name_candidate text NOT NULL,
  gem_title_candidate text NOT NULL,
  raw_ocr text NOT NULL,
  review_state text NOT NULL CHECK (review_state IN ('image_identified_ocr_wording_unverified', 'visually_verified')),
  source_sha256 text NOT NULL CHECK (source_sha256 ~ '^[0-9a-f]{64}$')
);
ALTER TABLE knowledge.ally_gem_cards ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge.ally_gem_cards FROM PUBLIC, anon, authenticated;

INSERT INTO knowledge.ally_gem_cards (id, source_id, owner_name_candidate, ally_name_candidate, gem_title_candidate, raw_ocr, review_state, source_sha256) VALUES ('ally-gem-2537', 102537, 'Khal Drogo', 'Daenerys Targaryen - Khaleesi of the Great Grass Sea', 'Sun and Stars Gem', 'KHAL DROGO''S ALLY
DAENERYS TARGARYEN - KHALEESI
 - OF THE GREAT GRASS SEA
4 iz J Y Owned
\ POWER OF LOVE
NN . ess Replaces Area Clear Power-Ups
2 ae
SUN AND STARS GEM SAG
When activated, this Gem grants the =A —
team Leader +10% Stamina and pA
HEALS them for5% MaxHP. “JY >
Together, Daenerys and Khal Drogo drew
strength from one another, their bond fueling
vitality and unwavering resolve. |', 'image_identified_ocr_wording_unverified', '4e5a91e9e7ef9cbcefa721ecf4d2e97a08b31f9edf212112c544f41bc0f58f74') ON CONFLICT (id) DO UPDATE SET raw_ocr=EXCLUDED.raw_ocr, source_sha256=EXCLUDED.source_sha256;
INSERT INTO knowledge.record_evidence (record_kind, record_id, source_id, evidence_role, review_state) VALUES ('ally_gem_card', 'ally-gem-2537', 102537, 'original_card_visible', 'image_identified_ocr_wording_unverified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.ally_gem_cards (id, source_id, owner_name_candidate, ally_name_candidate, gem_title_candidate, raw_ocr, review_state, source_sha256) VALUES ('ally-gem-2538', 102538, 'Davos Seaworth', 'Stannis Baratheon - The One True King', 'Law and Justice', 'DAVOS SEAWORTH''S ALLY
ey, | STANNIS BARATHEON - THE ONE
SEUTRUEKING
‘9 4 Y Owned
/4 NS OATHSWORN
Ne} Replaces Vertical Clear Power-Ups
LAW AND JUSTICE ¥7/  \
When activated, this Gem REMOVES (/(75¢)))
up to 2 Buffs from 2 random CN Dye
enemies. vA
Despite a contentious start, Davos has sworn
himself to Stannis, vowing to help him claim
Ais rightful throne for the good of the realm.', 'image_identified_ocr_wording_unverified', 'b5231dd3d971da652705c1b58fc3e32c39578ce68f409f6b3052bd96ddfbd648') ON CONFLICT (id) DO UPDATE SET raw_ocr=EXCLUDED.raw_ocr, source_sha256=EXCLUDED.source_sha256;
INSERT INTO knowledge.record_evidence (record_kind, record_id, source_id, evidence_role, review_state) VALUES ('ally_gem_card', 'ally-gem-2538', 102538, 'original_card_visible', 'image_identified_ocr_wording_unverified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.ally_gem_cards (id, source_id, owner_name_candidate, ally_name_candidate, gem_title_candidate, raw_ocr, review_state, source_sha256) VALUES ('ally-gem-2539', 102539, 'Rhaenys Targaryen', 'Meleys - The Red Queen', 'Off to Battle Again, Old Girl', 'RHAENYS TARGARYEN''S ALLY
. 7 MELEYS - THE RED QUEEN
: ye Y Owned
4
y, X&
j SN MONSTERS AND MEN
WW > Replaces Color Clear Power-Ups |
a ell
OFF TO BATTLE AGAIN, OLD GIRL Xf
When activated, this gem STUNS all Sys
enemies for 1 turn and WOUNDS \
them for 3 turns.
Meleys was faster than Vhagar, Rhaenys
could''ve turned and fled, but the Queen Who
| Never Was was made of sterner stuff. |', 'image_identified_ocr_wording_unverified', '77ce85376992cf8fa5944f511f239a440a83e2816bd658c35d1e7328c6169202') ON CONFLICT (id) DO UPDATE SET raw_ocr=EXCLUDED.raw_ocr, source_sha256=EXCLUDED.source_sha256;
INSERT INTO knowledge.record_evidence (record_kind, record_id, source_id, evidence_role, review_state) VALUES ('ally_gem_card', 'ally-gem-2539', 102539, 'original_card_visible', 'image_identified_ocr_wording_unverified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.ally_gem_cards (id, source_id, owner_name_candidate, ally_name_candidate, gem_title_candidate, raw_ocr, review_state, source_sha256) VALUES ('ally-gem-2540', 102540, 'Daenerys Targaryen', 'Grey Worm - Leader of the Unsullied', 'Breaker of Chains', 'DAENERYS TARGARYEN''S ALLY
je GREY WORM - LEADER OF THE
| |UNSULLIED
'' ref
ee a Y Owned
, \ OATHSWORN
. Ae} Replaces Vertical Clear Power-Ups
a 89 TT
BREAKER OF CHAINS VAY
When activated, this Gem afflicts up Geigy
to 2 random enemies with FIRE. aoe
Daenerys and Grey Worm fought side by side
to shatter the chains of the Free Cities, turning
| liberation into lasting freedom. |', 'image_identified_ocr_wording_unverified', 'e3dce995688b1cd1470a692b5481d00196062828898190ae71f669b980b18c7c') ON CONFLICT (id) DO UPDATE SET raw_ocr=EXCLUDED.raw_ocr, source_sha256=EXCLUDED.source_sha256;
INSERT INTO knowledge.record_evidence (record_kind, record_id, source_id, evidence_role, review_state) VALUES ('ally_gem_card', 'ally-gem-2540', 102540, 'original_card_visible', 'image_identified_ocr_wording_unverified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.ally_gem_cards (id, source_id, owner_name_candidate, ally_name_candidate, gem_title_candidate, raw_ocr, review_state, source_sha256) VALUES ('ally-gem-2541', 102541, 'Tyrion Lannister', 'Bronn - Sellsword for Hire', 'Paid to Kill Gem', 'TYRION LANNISTER''S ALLY
BRONN - SELLSWORD FOR HIRE
B 2s bs Y Owned
/4 NS OATHSWORN
. Ae} Replaces Vertical Clear Power-Ups
PAID TO KILL GEM AYN
When activated, this Gem deals 25% eS >
ATK Physical Damage to an enemy Spee
marked with BRONN''S DAGGER. "®S2V%
With Tyrion''s gold filling his purse, Bronn /et
his blade do the talking - proving that skill and
ruthlessness are worth every coin.', 'image_identified_ocr_wording_unverified', '74a4ea9aadf0e1512aaf75bae5bed4c563d573a0b0d849da5eb456a2066620f8') ON CONFLICT (id) DO UPDATE SET raw_ocr=EXCLUDED.raw_ocr, source_sha256=EXCLUDED.source_sha256;
INSERT INTO knowledge.record_evidence (record_kind, record_id, source_id, evidence_role, review_state) VALUES ('ally_gem_card', 'ally-gem-2541', 102541, 'original_card_visible', 'image_identified_ocr_wording_unverified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.ally_gem_cards (id, source_id, owner_name_candidate, ally_name_candidate, gem_title_candidate, raw_ocr, review_state, source_sha256) VALUES ('ally-gem-2542', 102542, 'Stannis Baratheon', 'Melisandre - The Red Woman', 'Azor Ahai Proclaimed', 'STANNIS BARATHEON''S ALLY
x =< MELISANDRE - THE RED WOMAN
5) Y Owned
/ NS OATHSWORN
WS y=) Replaces Vertical Clear Power-Ups
a cl
AZOR AHAI PROCLAIMED MN
When activated, this Gem grants all ea
allies +15% Gem Damage for 3 Ney
turns. YA
/n Stannis, Melisandre sees the chosen one of
prophecy. Together, they forge a destiny in
fire and shadow. |', 'image_identified_ocr_wording_unverified', '4d590bbb6b8689d65a4d8ab0a6c919f787d2ed3f7173ce27b504062c6d4ea35b') ON CONFLICT (id) DO UPDATE SET raw_ocr=EXCLUDED.raw_ocr, source_sha256=EXCLUDED.source_sha256;
INSERT INTO knowledge.record_evidence (record_kind, record_id, source_id, evidence_role, review_state) VALUES ('ally_gem_card', 'ally-gem-2542', 102542, 'original_card_visible', 'image_identified_ocr_wording_unverified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.ally_gem_cards (id, source_id, owner_name_candidate, ally_name_candidate, gem_title_candidate, raw_ocr, review_state, source_sha256) VALUES ('ally-gem-2543', 102543, 'Rhaenyra Targaryen', 'Criston Cole - Personal Escort', 'Love and Duty Gem', 'RHAENYRA TARGARYEN''S ALLY
CRISTON COLE - PERSONAL
ze ESCORT
~/; Y Owned
/ NS OATHSWORN
WS Ae} Replaces Vertical Clear Power-Ups
a cl
LOVE AND DUTY GEM \ fx /
When activated, this Gem provides a _eay(@\am !
+15% DEF Buff to the ally marked 4 w. ~
with CRISTON''S CHARGE for 3turns. ~W~7
Ser Criston stood as a steadfast shield, sworn
to protect his Princess with unwavering
loyalty. |', 'image_identified_ocr_wording_unverified', 'bfe748b578c968afabd3bd38712a8b2119abb85a2ba9810416e7858c50a3576f') ON CONFLICT (id) DO UPDATE SET raw_ocr=EXCLUDED.raw_ocr, source_sha256=EXCLUDED.source_sha256;
INSERT INTO knowledge.record_evidence (record_kind, record_id, source_id, evidence_role, review_state) VALUES ('ally_gem_card', 'ally-gem-2543', 102543, 'original_card_visible', 'image_identified_ocr_wording_unverified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.ally_gem_cards (id, source_id, owner_name_candidate, ally_name_candidate, gem_title_candidate, raw_ocr, review_state, source_sha256) VALUES ('ally-gem-2544', 102544, 'The Night King', 'Icy Viserion - Dragon of the Night King', 'Awakened Horror', 'THE NIGHT KING''S ALLY
, WY ICY VISERION - DRAGON OF THE
i oN ~ NIGHT KING
, XQ MONSTERS AND MEN
. yy o Replaces Color Clear Power-Ups
AWAKENED HORROR
When activated, this gem afflicts all enemies
with TICE, 3 FIRE and -15% Unnatural
Resistance. Dragons take double the effects.
With a resurrected dragon, the Night King
brought down the wall. Nothing remained
| between him and the realm of the living. |', 'image_identified_ocr_wording_unverified', '870bf9f4a5256f9329c3527102519b7f55ba1ca48635e149ec6c192bee8da4f2') ON CONFLICT (id) DO UPDATE SET raw_ocr=EXCLUDED.raw_ocr, source_sha256=EXCLUDED.source_sha256;
INSERT INTO knowledge.record_evidence (record_kind, record_id, source_id, evidence_role, review_state) VALUES ('ally_gem_card', 'ally-gem-2544', 102544, 'original_card_visible', 'image_identified_ocr_wording_unverified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.ally_gem_cards (id, source_id, owner_name_candidate, ally_name_candidate, gem_title_candidate, raw_ocr, review_state, source_sha256) VALUES ('ally-gem-2545', 102545, 'Laenor Velaryon', 'Corlys Velaryon - Lord of the Tides', 'United in Blood', 'LAENOR VELARYON''S ALLY
Ns CORLYS VELARYON - LORD OF THE
rea TIDES
ye \S YY Owned

NX FLESH AND BLOOD
N SE Replaces Horizontal Clear Power-Ups

UNITED IN BLOOD “ —

When activated, this gem afflicts 2 | <i,
random enemies with 1 RAID. «“ st
Corlys and Laenor Velaryon led the War for
the Stepstones against the Triarchy,
| eventually gaining control of the Narrow Sea. |', 'image_identified_ocr_wording_unverified', '24d580c680d30d3b6f4e72614201ceca6ee2a7052d7bf0bd6411c2f6d9a5dd82') ON CONFLICT (id) DO UPDATE SET raw_ocr=EXCLUDED.raw_ocr, source_sha256=EXCLUDED.source_sha256;
INSERT INTO knowledge.record_evidence (record_kind, record_id, source_id, evidence_role, review_state) VALUES ('ally_gem_card', 'ally-gem-2545', 102545, 'original_card_visible', 'image_identified_ocr_wording_unverified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.ally_gem_cards (id, source_id, owner_name_candidate, ally_name_candidate, gem_title_candidate, raw_ocr, review_state, source_sha256) VALUES ('ally-gem-2546', 102546, 'Arya Stark', 'Sansa Stark - Lady of Winterfell', 'Sisters Reunited Gem', 'y ra)
ARYA STARK''S ALLY
= SANSA STARK - LADY OF
be || WINTERFELL
SY Owned
2
‘
\ FLESH AND BLOOD
\W4e% Replaces Horizontal Clear Power-Ups
SISTERS REUNITED GEM 4 x or.
When activated, this Gem grants all allies yy, x
+25% Tenacity for 3 turns, and marks the S&@ © Ze
enemy struck with ARYA''S LIST for 3 turns. Qa”
Through hardship and exile, the Stark sisters’
unbreakable will led them back to Winterfel/ -
stronger together, ready to strike down their
foes.', 'image_identified_ocr_wording_unverified', '1d3abf9465055da83a3df6ca6778614a518d8370e63a5f2d91dc586180ead943') ON CONFLICT (id) DO UPDATE SET raw_ocr=EXCLUDED.raw_ocr, source_sha256=EXCLUDED.source_sha256;
INSERT INTO knowledge.record_evidence (record_kind, record_id, source_id, evidence_role, review_state) VALUES ('ally_gem_card', 'ally-gem-2546', 102546, 'original_card_visible', 'image_identified_ocr_wording_unverified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.ally_gem_cards (id, source_id, owner_name_candidate, ally_name_candidate, gem_title_candidate, raw_ocr, review_state, source_sha256) VALUES ('ally-gem-2547', 102547, 'Daemon Targaryen', 'Caraxes - The Blood Wyrm', 'Dragons Made Us Kings', 'DAEMON TARGARYEN''S ALLY
\ ''2@  CARAXES- THE BLOOD WYRM
he Y Owned
, XQ MONSTERS AND MEN
>. yo) Replaces Color Clear Power-Ups
a ret
DRAGONS MADE US KINGS Ae a).
When activated, this gem grants all f. )
team members 1 FURY and all Coy
Dragons gain 20% Stamina. Se
Daemon and Caraxes rule the skies, using
their combined might to defeat any
| challengers to their power. |', 'image_identified_ocr_wording_unverified', '131a679caa322de87d6c0cacb0cbcd35af5a3bfdbf681064bb859d7126cdbcd6') ON CONFLICT (id) DO UPDATE SET raw_ocr=EXCLUDED.raw_ocr, source_sha256=EXCLUDED.source_sha256;
INSERT INTO knowledge.record_evidence (record_kind, record_id, source_id, evidence_role, review_state) VALUES ('ally_gem_card', 'ally-gem-2547', 102547, 'original_card_visible', 'image_identified_ocr_wording_unverified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.ally_gem_cards (id, source_id, owner_name_candidate, ally_name_candidate, gem_title_candidate, raw_ocr, review_state, source_sha256) VALUES ('ally-gem-2548', 102548, 'Ned Stark', 'Catelyn Stark - The Lady of Winterfell', 'Wardens of the North Gem', 'NED STARK''S ALLY
2 | CATELYN STARK - THE LADY OF
4 WINTERFELL
Dy . Y Owned
‘
\ FLESH AND BLOOD
N pas Replaces Horizontal Clear Power-Ups
i
WARDENS OF THE NORTH GEM Rie. is
When activated, this Gem grants all {@ Yo
Stark allies +10% Physical =» “(sy
Resistance for 3 turns.
Ned and Catelyn instilled strength and honor
In their children, preparing them to face the
trials of a harsh world. |', 'image_identified_ocr_wording_unverified', '34a982435385bbc1d8b038098f8371592bdcdaa168a3b68e1cf270feee18d943') ON CONFLICT (id) DO UPDATE SET raw_ocr=EXCLUDED.raw_ocr, source_sha256=EXCLUDED.source_sha256;
INSERT INTO knowledge.record_evidence (record_kind, record_id, source_id, evidence_role, review_state) VALUES ('ally_gem_card', 'ally-gem-2548', 102548, 'original_card_visible', 'image_identified_ocr_wording_unverified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.ally_gem_cards (id, source_id, owner_name_candidate, ally_name_candidate, gem_title_candidate, raw_ocr, review_state, source_sha256) VALUES ('ally-gem-2549', 102549, 'Jon Snow', 'Ghost - Jon Snow''s Direwolf', 'A King and His Wolf Gem', ': —
JON SNOW''S ALLY
iA GHOST - JON SNOW''S DIREWOLF
~— 2 Y Owned
, XQ MONSTERS AND MEN
>. yo) Replaces Color Clear Power-Ups
a ll
A KING AND HIS WOLF GEM rien
When activated, this Gem deals a (m=)
bonus 25% ATK Physical Damage _\ wf
to BRITTLE enemies. — Oe |
Forged in the relentless cold, Jon and Ghost
honed their strength in the unforgiving wilds of
| the North. |', 'image_identified_ocr_wording_unverified', '2a6cb13d83328b2fba9c5cf5a3b7ef8e6fc88a59f023abaa989e27cbc2fb718d') ON CONFLICT (id) DO UPDATE SET raw_ocr=EXCLUDED.raw_ocr, source_sha256=EXCLUDED.source_sha256;
INSERT INTO knowledge.record_evidence (record_kind, record_id, source_id, evidence_role, review_state) VALUES ('ally_gem_card', 'ally-gem-2549', 102549, 'original_card_visible', 'image_identified_ocr_wording_unverified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.ally_gem_cards (id, source_id, owner_name_candidate, ally_name_candidate, gem_title_candidate, raw_ocr, review_state, source_sha256) VALUES ('ally-gem-2550', 102550, 'Jaime Lannister', 'Cersei Lannister - Queen of the Andals and the First Men', 'Anything for Love Gem', 'JAIME LANNISTER''S ALLY
e. CERSEI LANNISTER - QUEEN OF THE
“Ry OANDALS AND THE FIRST MEN
io , Y Owned
/alea POWER OF LOVE
>. fess Replaces Area Clear Power-Ups
2 ee
ANYTHING FOR LOVE GEM 3 oxXN
When activated, this Gem WOUNDS oy
and DECEIVES all enemies for 1turn. W277
— WY
Bound by love and secrecy, Cerse/ and Jaime
concealed their forbidden bond from prying
eyes. |', 'image_identified_ocr_wording_unverified', '043026ddb698c99661c713e199e4b9780ea2f43d36150d81f8d6b095d58bc545') ON CONFLICT (id) DO UPDATE SET raw_ocr=EXCLUDED.raw_ocr, source_sha256=EXCLUDED.source_sha256;
INSERT INTO knowledge.record_evidence (record_kind, record_id, source_id, evidence_role, review_state) VALUES ('ally_gem_card', 'ally-gem-2550', 102550, 'original_card_visible', 'image_identified_ocr_wording_unverified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.ally_gem_cards (id, source_id, owner_name_candidate, ally_name_candidate, gem_title_candidate, raw_ocr, review_state, source_sha256) VALUES ('ally-gem-2551', 102551, 'Benjen Stark', 'Yoren - Recruiter of the Night''s Watch', 'Southern Crows', 'BENJEN STARK’''S ALLY
mm. YOREN - RECRUITER OF THE
-=} NIGHT''S WATCH
“qr \ Y Owned

be BROTHERS IN ARMS
ey Replaces Seeker Power-Ups
J) p p
SOUTHERN CROWS ra
When activated, this Gem grants the | (o''%) |
Weakest ally 2 5% HP Pool SHIELD. \/as\\/
From the frozen Wall to the King''s roads of
Westeros, Benjen and Yoren upheld the
Watch''s oath, no matter where it led them. |', 'image_identified_ocr_wording_unverified', '3a1634e2f90d6adec953a956f811cb0e8a9663a93eb02187f7be59184f234bf7') ON CONFLICT (id) DO UPDATE SET raw_ocr=EXCLUDED.raw_ocr, source_sha256=EXCLUDED.source_sha256;
INSERT INTO knowledge.record_evidence (record_kind, record_id, source_id, evidence_role, review_state) VALUES ('ally_gem_card', 'ally-gem-2551', 102551, 'original_card_visible', 'image_identified_ocr_wording_unverified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.ally_gem_cards (id, source_id, owner_name_candidate, ally_name_candidate, gem_title_candidate, raw_ocr, review_state, source_sha256) VALUES ('ally-gem-2552', 102552, 'Tormund Giantsbane', 'Wun Wun - The Last of His Kind', 'Giant Slayers', 'TORMUND GIANTSBANE''S ALLY
C \ WUN WUN - THE LAST OF HIS KIND
Oo
NS) YW Owned
BROTHERS IN ARMS
\ Ki eplaces Seeker Power-Ups
AS) p p
GIANT SLAYERS
When activated, this Gem deals 50% @ y
Current Stamina damage to target. Sy,
Through icy storms and countless battles,
Tormund and Wun Wun have stood against
foes of all sizes. Together, no enemy /s too
great.', 'image_identified_ocr_wording_unverified', '239f141010307135eab6ee28c8d55d93f90e4f57c9745d775b5fa5f1f58986fe') ON CONFLICT (id) DO UPDATE SET raw_ocr=EXCLUDED.raw_ocr, source_sha256=EXCLUDED.source_sha256;
INSERT INTO knowledge.record_evidence (record_kind, record_id, source_id, evidence_role, review_state) VALUES ('ally_gem_card', 'ally-gem-2552', 102552, 'original_card_visible', 'image_identified_ocr_wording_unverified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.ally_gem_cards (id, source_id, owner_name_candidate, ally_name_candidate, gem_title_candidate, raw_ocr, review_state, source_sha256) VALUES ('ally-gem-2553', 102553, 'Beric Dondarrion', 'Thoros of Myr - The Red Priest Warrior', 'The Brotherhood Gem', 'BERIC DONDARRION''S ALLY
(>. | THOROS OF MyR- THE RED PRIEST
| sha) WARRIOR
Lk) W Owned
BROTHERS IN ARMS
\ Kt) Replaces Seeker Power-Ups
AS) p p
THE BROTHERHOOD GEM ZO
When activated, this Gem HEALS the ((@ Le
Weakest member of the team by 5% \_.\.Y
Max HP. ZT
On countless battlefields, Thoros has called
upon the Lord of Light to restore Beric,
keeping him in the fight when death should
have claimed him.', 'image_identified_ocr_wording_unverified', 'bf61e4200ef392bcca0cf2ba339035d75d74d8dab86f7c75a15b8d3c5b7698e2') ON CONFLICT (id) DO UPDATE SET raw_ocr=EXCLUDED.raw_ocr, source_sha256=EXCLUDED.source_sha256;
INSERT INTO knowledge.record_evidence (record_kind, record_id, source_id, evidence_role, review_state) VALUES ('ally_gem_card', 'ally-gem-2553', 102553, 'original_card_visible', 'image_identified_ocr_wording_unverified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.ally_gem_cards (id, source_id, owner_name_candidate, ally_name_candidate, gem_title_candidate, raw_ocr, review_state, source_sha256) VALUES ('ally-gem-2554', 102554, 'Roose Bolton', 'Walder Frey - Lord of the Riverlands', 'Malevolent Conspirators', 'ROOSE BOLTON''S ALLY
mS WALDER FREY- LORD OF THE
a. RIVERLANDS
j \ Y Owned
BROTHERS IN ARMS
\. 1) Replaces Seeker Power-Ups
AS) p p
MALEVOLENT CONSPIRATORS = ay
When activated, this Gem afflicts 2 ye }
random enemies with BLEED. ><
With steel and treachery, Roose Bolton and
Walder Frey orchestrated a night of betrayal,
| drowning the Starks in blood. |', 'image_identified_ocr_wording_unverified', '6aa34bea7eed5a41bbaba4d998a0c09a83da1bf575ebac2706ca3e21122653cc') ON CONFLICT (id) DO UPDATE SET raw_ocr=EXCLUDED.raw_ocr, source_sha256=EXCLUDED.source_sha256;
INSERT INTO knowledge.record_evidence (record_kind, record_id, source_id, evidence_role, review_state) VALUES ('ally_gem_card', 'ally-gem-2554', 102554, 'original_card_visible', 'image_identified_ocr_wording_unverified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.ally_gem_cards (id, source_id, owner_name_candidate, ally_name_candidate, gem_title_candidate, raw_ocr, review_state, source_sha256) VALUES ('ally-gem-2555', 102555, 'Joffrey Baratheon', 'Margaery Tyrell - The Lady of House Tyrell', 'Royal Couple', 'JOFFREY BARATHEON''S ALLY
(22 MARGAERY TYRELL - THE LADY OF
\ HOUSE TYRELL

\ Y Owned
, \ POWER OF LOVE
NN Aor Replaces Area Clear Power-Ups
2 ee
ROYAL COUPLE ;
When activated, this gem HEALS the Weakest Coy
member of the team by 5% Current HP, grants eC iN
them 1 RENEW, and adds 1 Gold to the SQL
TREASURY. al
As Joffrey ''s queen, Margaery skillfully wove
alliances, earning the love of the people while
securing her place in the realm. |', 'image_identified_ocr_wording_unverified', '2d6db7ab57dedc095e0e42f4e118b87d01c4a896bf4f367468acf4f49b0def6e') ON CONFLICT (id) DO UPDATE SET raw_ocr=EXCLUDED.raw_ocr, source_sha256=EXCLUDED.source_sha256;
INSERT INTO knowledge.record_evidence (record_kind, record_id, source_id, evidence_role, review_state) VALUES ('ally_gem_card', 'ally-gem-2555', 102555, 'original_card_visible', 'image_identified_ocr_wording_unverified') ON CONFLICT DO NOTHING;
INSERT INTO knowledge.ally_gem_cards (id, source_id, owner_name_candidate, ally_name_candidate, gem_title_candidate, raw_ocr, review_state, source_sha256) VALUES ('ally-gem-2556', 102556, 'Viserys Targaryen I', 'Alicent Hightower - Queen Dowager', 'Political Marriage', 'VISERYS TARGARYEN I''S ALLY
TZ ALICENT HIGHTOWER- QUEEN
-’ DOWAGER
= Y Owned
é
‘
\ FLESH AND BLOOD
N Eas Replaces Horizontal Clear Power-Ups
POLITICAL MARRIAGE a yA
When activated, this gem will PACIFY Pe
a random enemy and Viserys for 2 3 Tel. "
turns. Viserys also gains 1 RENEW. = |
Encouraged by his advisors to find a new wife,
Viserys rejected the proposed political
marriage, instead finding comfort and common
interests with Alicent Hightower.', 'image_identified_ocr_wording_unverified', 'c0e4ef5303343dfa0c6557a5cd01c85b05037f3e1e5751b5e0599ed8a2f807d6') ON CONFLICT (id) DO UPDATE SET raw_ocr=EXCLUDED.raw_ocr, source_sha256=EXCLUDED.source_sha256;
INSERT INTO knowledge.record_evidence (record_kind, record_id, source_id, evidence_role, review_state) VALUES ('ally_gem_card', 'ally-gem-2556', 102556, 'original_card_visible', 'image_identified_ocr_wording_unverified') ON CONFLICT DO NOTHING;
