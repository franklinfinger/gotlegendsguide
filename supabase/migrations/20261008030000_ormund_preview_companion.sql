-- Include Ormund’s associated Guardsman in the preview read model.
CREATE OR REPLACE FUNCTION public.got_guide_data_preview()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT jsonb_build_object(
    'version', (SELECT source_version FROM knowledge.import_runs ORDER BY imported_at DESC LIMIT 1),
    'champions', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', v.id,
      'legacyId', v.sqlite_champion_id,
      'name', v.display_name,
      'rarity', v.rarity,
      'gemColor', v.gem_color,
      'reviewStatus', v.review_status,
      'releaseState', v.live_status,
      'portrait', (SELECT p.asset_path FROM knowledge.champion_portraits p
        WHERE p.variant_id = v.id ORDER BY (p.source_image_id IS NOT NULL) DESC, p.id LIMIT 1),
      'factions', coalesce((SELECT jsonb_agg(f.name ORDER BY f.name)
        FROM knowledge.faction_memberships fm
        JOIN knowledge.factions f ON f.id = fm.faction_id
        WHERE fm.variant_id = v.id AND fm.live_status = 'live' AND f.live_status = 'live'), '[]'::jsonb),
      'roles', coalesce(l.legacy_roles, '[]'::jsonb)
    ) ORDER BY v.display_name, v.id), '[]'::jsonb)
      FROM knowledge.champion_variants v
      LEFT JOIN knowledge.legacy_champion_metadata l ON l.variant_id = v.id
      WHERE v.live_status IN ('live','unverified')),
    'abilities', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', a.id, 'kind', a.kind, 'name', a.name,
      'variantId', a.variant_id, 'championId', v.sqlite_champion_id,
      'text', a.exact_visible_text, 'reviewStatus', a.review_status,
      'provenance', a.provenance
    ) ORDER BY a.kind, a.name, a.id), '[]'::jsonb)
      FROM knowledge.abilities a
      LEFT JOIN knowledge.champion_variants v ON v.id = a.variant_id),
    'traits', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', 'legacy-trait-' || t.trait_id, 'variantId', v.id,
      'championId', t.champion_id, 'name', t.trait_name,
      'type', t.trait_type, 'scope', t.scope,
      'text', t.exact_visible_text, 'reviewStatus', t.completion_state
    ) ORDER BY t.champion_id, t.trait_id), '[]'::jsonb)
      FROM knowledge.champion_traits t
      JOIN knowledge.champion_variants v ON v.sqlite_champion_id = t.champion_id),
    'items', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', i.id, 'name', i.display_name,
      'ownerVariantId', i.owner_variant_id,
      'ownerName', v.display_name,
      'reviewStatus', i.review_state,
      'abilities', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'id', a.id, 'name', a.name, 'text', a.exact_visible_text,
        'reviewStatus', a.review_status, 'provenance', a.provenance
      ) ORDER BY a.name) FROM knowledge.iconic_item_ability_links l
        JOIN knowledge.abilities a ON a.id = l.ability_id
        WHERE l.item_id = i.id), '[]'::jsonb)
    ) ORDER BY i.display_name), '[]'::jsonb)
      FROM knowledge.iconic_item_catalog i
      LEFT JOIN knowledge.champion_variants v ON v.id = i.owner_variant_id),
    'factions', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', f.id, 'name', f.name,
      'memberVariantIds', coalesce((SELECT jsonb_agg(fm.variant_id ORDER BY fm.variant_id)
        FROM knowledge.faction_memberships fm
        WHERE fm.faction_id=f.id AND fm.live_status='live'), '[]'::jsonb),
      'rules', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'id', r.id, 'text', r.exact_text,
        'kind', CASE WHEN r.id LIKE '%how-to-play' THEN 'how_to_play' ELSE 'current_bonus' END
      ) ORDER BY r.id) FROM knowledge.faction_rules r
        WHERE r.faction_id=f.id AND r.live_status='live'), '[]'::jsonb)
    ) ORDER BY f.name), '[]'::jsonb)
      FROM knowledge.factions f
      WHERE f.live_status='live' AND EXISTS (
        SELECT 1 FROM knowledge.faction_memberships fm WHERE fm.faction_id=f.id AND fm.live_status='live'
        UNION ALL SELECT 1 FROM knowledge.faction_rules fr WHERE fr.faction_id=f.id AND fr.live_status='live')),
    'statuses', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', d.status_id, 'name', d.status_name,
      'text', d.exact_visible_definition, 'reviewStatus', d.completion_state
    ) ORDER BY d.status_name), '[]'::jsonb) FROM knowledge.status_definitions d),
    'mechanics', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', a.id, 'name', a.name, 'text', a.exact_visible_text,
      'reviewStatus', a.review_status
    ) ORDER BY a.name), '[]'::jsonb) FROM knowledge.abilities a WHERE a.kind='definition'),
    'companions', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', cp.companion_id, 'championId', cp.champion_id,
      'name', cp.companion_name, 'skillName', cp.skill_name,
      'text', cp.exact_visible_text, 'reviewStatus', cp.completion_state
    ) ORDER BY cp.companion_id), '[]'::jsonb) FROM knowledge.champion_companions cp) ||
      (SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id',u.id,'variantId',u.owner_variant_id,'name',u.name,
        'traitName',u.trait_name,'traitText',u.trait_text,
        'skillName',u.skill_name,'skillText',u.skill_text,
        'inheritanceText',u.inheritance_text,'reviewStatus',u.review_status
      ) ORDER BY u.id),'[]'::jsonb) FROM knowledge.champion_associated_units u),
    'legendaryAssault', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', e.id, 'name', e.name, 'subtitle', e.subtitle,
      'reviewStatus', e.review_state, 'releaseState', e.release_state,
      'abilities', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'id', a.id, 'name', a.ability_name, 'scope', a.scope,
        'text', a.exact_visible_text, 'reviewStatus', a.completion_state
      ) ORDER BY a.id) FROM knowledge.legendary_assault_abilities a WHERE a.encounter_id=e.id), '[]'::jsonb),
      'tips', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'id', t.id, 'text', t.exact_visible_text, 'reviewStatus', t.review_state
      ) ORDER BY t.id) FROM knowledge.legendary_assault_tips t WHERE lower(t.encounter_name)=lower(e.name)), '[]'::jsonb)
    ) ORDER BY e.name), '[]'::jsonb) FROM knowledge.legendary_assault_encounters e),
    'warRules', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', r.id, 'name', r.name, 'points', r.outpost_victory_points,
      'effect', r.exact_visible_effect, 'phaseRule', r.exact_visible_phase_rule,
      'reviewStatus', r.review_state
    ) ORDER BY r.outpost_victory_points DESC, r.name), '[]'::jsonb) FROM knowledge.war_outpost_rules r),
    'raidRules', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', r.raid_rule_id, 'category', r.category, 'text', r.exact_text,
      'evidenceType', r.evidence_type
    ) ORDER BY r.raid_rule_id), '[]'::jsonb) FROM knowledge.raid_mode_rules r),
    'raidTeams', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', rt.raid_team_example_id, 'context', rt.team_context,
      'members', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'name', rm.champion_name, 'isLeader', rm.is_leader=1
      ) ORDER BY rm.position) FROM knowledge.raid_team_members rm
        WHERE rm.raid_team_example_id=rt.raid_team_example_id), '[]'::jsonb)
    ) ORDER BY rt.raid_team_example_id), '[]'::jsonb) FROM knowledge.raid_team_examples rt),
    'strategyTeams', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', t.strategy_team_example_id, 'mode', t.game_mode,
      'role', t.team_role, 'evidenceStatus', t.evidence_status,
      'members', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'name', m.champion_name, 'isLeader', m.is_leader=1, 'gemColor', m.gem_color
      ) ORDER BY m.position) FROM knowledge.strategy_team_members m
        WHERE m.strategy_team_example_id=t.strategy_team_example_id), '[]'::jsonb)
    ) ORDER BY t.strategy_team_example_id), '[]'::jsonb) FROM knowledge.strategy_team_examples t),
    'teams', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', t.id, 'mode', t.mode, 'outcome', t.outcome,
      'displayedPower', t.displayed_team_power,
      'members', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'name', m.observed_name, 'isLeader', m.position=t.leader_position
      ) ORDER BY m.position) FROM knowledge.community_team_members m WHERE m.example_id=t.id), '[]'::jsonb)
    ) ORDER BY t.id), '[]'::jsonb) FROM knowledge.community_team_examples t),
    'announcements', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', u.update_id, 'title', u.title, 'date', u.announcement_date,
      'status', u.live_status,
      'factions', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'name', fc.faction_name, 'change', fc.change_kind,
        'playstyle', fc.announced_playstyle, 'bonus', fc.announced_bonus
      ) ORDER BY fc.announced_faction_change_id)
        FROM knowledge.announced_faction_changes fc WHERE fc.update_id=u.update_id), '[]'::jsonb),
      'rules', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'text', ar.exact_text, 'category', ar.category
      ) ORDER BY ar.announced_strategy_rule_id)
        FROM knowledge.announced_strategy_rules ar WHERE ar.update_id=u.update_id), '[]'::jsonb)
    ) ORDER BY u.update_id), '[]'::jsonb) FROM knowledge.announced_game_updates u)
  );
$$;


REVOKE ALL ON FUNCTION public.got_guide_data_preview() FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.got_guide_data_preview() TO anon, authenticated;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(public.got_guide_data_preview()->'companions') unit WHERE unit->>'id'='ormund-hightower-guardsman') THEN RAISE EXCEPTION 'Preview associated unit missing'; END IF; END $$;
