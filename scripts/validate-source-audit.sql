-- Read-only independent recount. These counts describe what was imported;
-- they do not establish that the original image corpus is fully extracted.
SELECT jsonb_pretty(jsonb_build_object(
  'source_metadata', (SELECT count(*) FROM knowledge.sources),
  'original_image_fingerprints', (SELECT count(*) FROM knowledge.source_image_fingerprints),
  'original_image_bytes_unavailable', (SELECT count(*) FROM knowledge.sources s LEFT JOIN knowledge.source_image_fingerprints f USING(source_id) WHERE f.source_id IS NULL),
  'evidence_links', (SELECT count(*) FROM knowledge.record_evidence),
  'champion_variants', (SELECT count(*) FROM knowledge.champion_variants),
  'legacy_candidate_variants', (SELECT count(*) FROM knowledge.legacy_champion_metadata),
  'champion_variants_with_no_portrait', (SELECT count(*) FROM knowledge.champion_variants v WHERE NOT EXISTS (SELECT 1 FROM knowledge.champion_portraits p WHERE p.variant_id=v.id)),
  'valid_portrait_assets', (SELECT count(*) FROM knowledge.champion_portraits),
  'linked_portrait_assets', (SELECT count(*) FROM knowledge.champion_portraits WHERE variant_id IS NOT NULL),
  'canonical_abilities', (SELECT count(*) FROM knowledge.abilities),
  'canonical_ability_effects', (SELECT count(*) FROM knowledge.ability_effects),
  'canonical_abilities_without_effects', (SELECT count(*) FROM knowledge.abilities a WHERE NOT EXISTS (SELECT 1 FROM knowledge.ability_effects e WHERE e.ability_id=a.id)),
  'legacy_candidates_without_skill', (SELECT jsonb_agg(v.display_name ORDER BY v.display_name) FROM knowledge.legacy_champion_metadata m JOIN knowledge.champion_variants v ON v.id=m.variant_id WHERE NOT EXISTS (SELECT 1 FROM knowledge.abilities a WHERE a.variant_id=v.id AND a.kind='champion_skill')),
  'item_catalog', (SELECT count(*) FROM knowledge.iconic_item_catalog),
  'items_without_ability', (SELECT count(*) FROM knowledge.iconic_item_catalog i WHERE NOT EXISTS (SELECT 1 FROM knowledge.iconic_item_ability_links l WHERE l.item_id=i.id)),
  'live_factions', (SELECT count(*) FROM knowledge.factions WHERE live_status='live'),
  'live_memberships', (SELECT count(*) FROM knowledge.faction_memberships WHERE live_status='live'),
  'legendary_assault_encounters', (SELECT count(*) FROM knowledge.legendary_assault_encounters),
  'legendary_assault_abilities', (SELECT count(*) FROM knowledge.legendary_assault_abilities),
  'dragon_abilities_without_source', (SELECT count(*) FROM knowledge.legendary_assault_abilities a WHERE NOT EXISTS (SELECT 1 FROM knowledge.legendary_assault_ability_sources s WHERE s.ability_id=a.id)),
  'team_member_links', (SELECT count(*) FROM knowledge.team_member_variant_links),
  'team_member_exact_links', (SELECT count(*) FROM knowledge.team_member_variant_links WHERE resolution_state='exact_name'),
  'team_member_unresolved_names', (SELECT jsonb_agg(DISTINCT original_champion_name) FROM knowledge.team_member_variant_links WHERE resolution_state='unresolved_name'),
  'observed_teams_mislabeled_wins', (SELECT count(*) FROM knowledge.strategy_team_examples WHERE evidence_status='outcome_verified')
)) AS audit_validation;
