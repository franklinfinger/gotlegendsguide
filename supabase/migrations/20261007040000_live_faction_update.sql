-- The September faction update is live. Promote its sourced faction definitions
-- without removing any existing memberships; the source explicitly says no
-- champion loses a current faction and permits up to two memberships.
UPDATE knowledge.announced_game_updates
SET live_status = 'live',
    notes = 'Live faction update. Original announcement wording is retained as source evidence; the Scattered Banners keyword remains unavailable.'
WHERE update_id = 1;

INSERT INTO knowledge.factions (id,name,live_status) VALUES
  ('current-faction-suns-dominion','Sun''s Dominion','live'),
  ('current-faction-way-of-whispers','The Way Of Whispers','live'),
  ('current-faction-beyond-the-wall','Beyond The Wall','live'),
  ('current-faction-lords-of-the-tide','Lords Of The Tide','live'),
  ('current-faction-scattered-banners','The Scattered Banners','live')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,live_status='live';

INSERT INTO knowledge.faction_rules (id,faction_id,exact_text,live_status,source_id,announced_update_id) VALUES
  ('suns-dominion-bonus','current-faction-suns-dominion','25% Gem Resistance AND Unnatural Resistance','live',620,1),
  ('suns-dominion-how-to-play','current-faction-suns-dominion','POISON and RENEW, damaging and healing over time as they outlast foes.','live',620,1),
  ('way-of-whispers-bonus','current-faction-way-of-whispers','25% Dodge','live',620,1),
  ('way-of-whispers-how-to-play','current-faction-way-of-whispers','Stacking BLEED and dodging attacks as enemies defeat themselves.','live',620,1),
  ('beyond-the-wall-bonus','current-faction-beyond-the-wall','25% Durability','live',620,1),
  ('beyond-the-wall-how-to-play','current-faction-beyond-the-wall','Premier REINFORCE faction.','live',620,1),
  ('lords-of-the-tide-bonus','current-faction-lords-of-the-tide','-25% Stamina Cost','live',620,1),
  ('lords-of-the-tide-how-to-play','current-faction-lords-of-the-tide','Combos and RAID to deal massive damage and heal when enemies are defeated.','live',620,1),
  ('scattered-banners-bonus','current-faction-scattered-banners','25% Crit Chance AND Crit Resistance','live',620,1),
  ('scattered-banners-how-to-play','current-faction-scattered-banners','The faction''s additional keyword is not yet available in the verified evidence.','live',620,1)
ON CONFLICT (id) DO UPDATE SET exact_text=EXCLUDED.exact_text,live_status='live',source_id=EXCLUDED.source_id,announced_update_id=EXCLUDED.announced_update_id;

-- Global live bonus changes stated in the same source.
UPDATE knowledge.faction_rules
SET exact_text = replace(replace(exact_text, '+25% Gem Damage', '+20% Gem Damage'), '+30% ATK', '+25% ATK')
WHERE live_status='live' AND id LIKE '%-bonus';
UPDATE knowledge.faction_rules
SET exact_text = replace(exact_text, '+30% DEF', '+25% DEF')
WHERE live_status='live' AND id LIKE '%-bonus';
UPDATE knowledge.faction_rules
SET exact_text = replace(exact_text, '+30% Critical Strike Chance', '+25% Critical Strike Chance')
WHERE live_status='live' AND id LIKE '%-bonus';

-- Exact, unambiguous variant matches from the sourced current-faction roster.
INSERT INTO knowledge.faction_memberships (variant_id,faction_id,live_status,confidence,source_id) VALUES
  ('sqlite-champion-79','current-faction-suns-dominion','live',1,620),
  ('sqlite-champion-65','current-faction-suns-dominion','live',1,620),
  ('audit-variant-criston-kingmaker','current-faction-suns-dominion','live',1,620),
  ('sqlite-champion-34','current-faction-suns-dominion','live',1,620),
  ('sqlite-champion-28','current-faction-suns-dominion','live',1,620),
  ('sqlite-champion-20','current-faction-suns-dominion','live',1,620),
  ('sqlite-champion-17','current-faction-suns-dominion','live',1,620),
  ('sqlite-champion-76','current-faction-suns-dominion','live',1,620),
  ('legacy-champion-aemond','current-faction-way-of-whispers','live',1,620),
  ('sqlite-champion-75','current-faction-way-of-whispers','live',1,620),
  ('sqlite-champion-63','current-faction-way-of-whispers','live',1,620),
  ('sqlite-champion-80','current-faction-way-of-whispers','live',1,620),
  ('sqlite-champion-53','current-faction-beyond-the-wall','live',1,620),
  ('sqlite-champion-55','current-faction-beyond-the-wall','live',1,620),
  ('sqlite-champion-23','current-faction-beyond-the-wall','live',1,620),
  ('sqlite-champion-35','current-faction-beyond-the-wall','live',1,620),
  ('sqlite-champion-37','current-faction-lords-of-the-tide','live',1,620),
  ('sqlite-champion-30','current-faction-lords-of-the-tide','live',1,620),
  ('sqlite-champion-72','current-faction-lords-of-the-tide','live',1,620),
  ('sqlite-champion-82','current-faction-lords-of-the-tide','live',1,620),
  ('sqlite-champion-73','current-faction-scattered-banners','live',1,620),
  ('sqlite-champion-14','current-faction-scattered-banners','live',1,620),
  ('sqlite-champion-47','current-faction-scattered-banners','live',1,620),
  ('sqlite-champion-84','current-faction-scattered-banners','live',1,620),
  ('sqlite-champion-13','current-faction-scattered-banners','live',1,620),
  ('sqlite-champion-21','current-faction-scattered-banners','live',1,620)
ON CONFLICT (variant_id,faction_id) DO UPDATE SET live_status='live',confidence=1,source_id=620;

-- The source names Tyrion "Lord Of Casterly Rock" and Davos "Hand Of Stannis".
-- Neither exact variant title exists in the verified variant table, so those two
-- relationships remain deliberately unassigned rather than guessed.

DO $$
BEGIN
  IF (SELECT live_status FROM knowledge.announced_game_updates WHERE update_id=1) <> 'live' THEN RAISE EXCEPTION 'Faction update was not promoted'; END IF;
  IF (SELECT count(*) FROM knowledge.factions WHERE id LIKE 'current-faction-%' AND live_status='live') <> 5 THEN RAISE EXCEPTION 'Current faction count mismatch'; END IF;
  IF (SELECT count(*) FROM knowledge.faction_memberships WHERE source_id=620 AND live_status='live') <> 26 THEN RAISE EXCEPTION 'Current faction membership count mismatch'; END IF;
  IF EXISTS (SELECT 1 FROM knowledge.faction_memberships WHERE live_status='live' GROUP BY variant_id HAVING count(*) > 2) THEN RAISE EXCEPTION 'A champion exceeds the verified two-faction limit'; END IF;
END $$;
