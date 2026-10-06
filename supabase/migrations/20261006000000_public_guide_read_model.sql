-- Curated, read-only guide data. Raw source URLs and private mirror rows stay in knowledge.
CREATE OR REPLACE FUNCTION public.got_guide_data()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT jsonb_build_object(
    'version', (SELECT source_version FROM knowledge.import_runs ORDER BY imported_at DESC LIMIT 1),
    'champions', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', c.champion_id, 'name', c.name, 'rarity', c.rarity,
      'gemColor', c.gem_color, 'reviewStatus', c.record_state,
      'factions', coalesce((SELECT jsonb_agg(f.name ORDER BY f.name)
        FROM knowledge.faction_memberships fm
        JOIN knowledge.champion_variants v ON v.id = fm.variant_id
        JOIN knowledge.factions f ON f.id = fm.faction_id
        WHERE v.sqlite_champion_id = c.champion_id AND fm.live_status = 'live'
          AND f.live_status = 'live'), '[]'::jsonb)
    ) ORDER BY c.name, c.champion_id), '[]'::jsonb) FROM knowledge.champions c),
    'abilities', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', a.id, 'kind', a.kind, 'name', a.name,
      'championId', v.sqlite_champion_id, 'bossId', a.raid_boss_id,
      'text', a.exact_visible_text, 'reviewStatus', a.review_status,
      'sourceId', a.source_id, 'sourceState', s.verification_state
    ) ORDER BY a.kind, a.name, a.id), '[]'::jsonb)
      FROM knowledge.abilities a
      LEFT JOIN knowledge.champion_variants v ON v.id = a.variant_id
      LEFT JOIN knowledge.sources s ON s.source_id = a.source_id),
    'traits', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', t.trait_id, 'championId', t.champion_id, 'name', t.trait_name,
      'type', t.trait_type, 'scope', t.scope, 'text', t.exact_visible_text,
      'reviewStatus', t.completion_state, 'sourceId', t.source_id,
      'sourceState', s.verification_state
    ) ORDER BY t.champion_id, t.trait_id), '[]'::jsonb)
      FROM knowledge.champion_traits t
      LEFT JOIN knowledge.sources s ON s.source_id = t.source_id),
    'items', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', i.item_id, 'name', i.item_name, 'effectName', i.effect_name,
      'text', i.exact_visible_text, 'reviewStatus', i.completion_state,
      'sourceId', i.source_id, 'sourceState', s.verification_state
    ) ORDER BY i.item_id), '[]'::jsonb)
      FROM knowledge.iconic_items i
      LEFT JOIN knowledge.sources s ON s.source_id = i.source_id),
    'factions', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', f.id, 'name', f.name,
      'memberIds', coalesce((SELECT jsonb_agg(v.sqlite_champion_id ORDER BY v.sqlite_champion_id)
        FROM knowledge.faction_memberships fm
        JOIN knowledge.champion_variants v ON v.id = fm.variant_id
        WHERE fm.faction_id = f.id AND fm.live_status = 'live'), '[]'::jsonb)
    ) ORDER BY f.name), '[]'::jsonb) FROM knowledge.factions f WHERE f.live_status = 'live'),
    'statuses', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', d.status_id, 'name', d.status_name, 'text', d.exact_visible_definition,
      'reviewStatus', d.completion_state, 'sourceId', d.source_id,
      'sourceState', s.verification_state
    ) ORDER BY d.status_name), '[]'::jsonb)
      FROM knowledge.status_definitions d
      LEFT JOIN knowledge.sources s ON s.source_id = d.source_id),
    'companions', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', cp.companion_id, 'championId', cp.champion_id,
      'name', cp.companion_name, 'skillName', cp.skill_name,
      'text', cp.exact_visible_text, 'reviewStatus', cp.completion_state,
      'sourceId', cp.source_id, 'sourceState', s.verification_state
    ) ORDER BY cp.companion_id), '[]'::jsonb)
      FROM knowledge.champion_companions cp
      LEFT JOIN knowledge.sources s ON s.source_id = cp.source_id),
    'bosses', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', b.raid_boss_id, 'name', b.name, 'subtitle', b.subtitle,
      'reviewStatus', b.record_state,
      'abilities', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'id', ba.raid_boss_ability_id, 'name', ba.ability_name,
        'scope', ba.scope, 'text', ba.exact_visible_text,
        'reviewStatus', ba.completion_state,
        'verifiedSources', (SELECT count(*) FROM knowledge.raid_boss_ability_sources bas
          JOIN knowledge.sources s ON s.source_id = bas.source_id
          WHERE bas.raid_boss_ability_id = ba.raid_boss_ability_id
            AND s.verification_state = 'verified_visible')
      ) ORDER BY ba.raid_boss_ability_id)
        FROM knowledge.raid_boss_abilities ba WHERE ba.raid_boss_id = b.raid_boss_id), '[]'::jsonb),
      'tips', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'text', bt.exact_visible_text, 'reviewStatus', bt.completion_state,
        'sourceId', bt.source_id, 'sourceState', s.verification_state
      ) ORDER BY bt.tip_id) FROM knowledge.raid_boss_tips bt
        LEFT JOIN knowledge.sources s ON s.source_id = bt.source_id
        WHERE bt.raid_boss_id = b.raid_boss_id), '[]'::jsonb)
    ) ORDER BY b.name), '[]'::jsonb) FROM knowledge.raid_bosses b),
    'raidRules', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', r.raid_rule_id, 'category', r.category, 'text', r.exact_text,
      'evidenceType', r.evidence_type, 'sourceId', r.source_id,
      'sourceState', s.verification_state
    ) ORDER BY r.raid_rule_id), '[]'::jsonb) FROM knowledge.raid_mode_rules r
      LEFT JOIN knowledge.sources s ON s.source_id = r.source_id),
    'raidTeams', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', rt.raid_team_example_id, 'context', rt.team_context,
      'sourceId', rt.source_id, 'sourceState', s.verification_state,
      'members', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'name', rm.champion_name, 'isLeader', rm.is_leader = 1
      ) ORDER BY rm.position) FROM knowledge.raid_team_members rm
        WHERE rm.raid_team_example_id = rt.raid_team_example_id), '[]'::jsonb)
    ) ORDER BY rt.raid_team_example_id), '[]'::jsonb)
      FROM knowledge.raid_team_examples rt
      LEFT JOIN knowledge.sources s ON s.source_id = rt.source_id),
    'teams', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', t.strategy_team_example_id,
      'mode', t.game_mode, 'role', t.team_role,
      'evidenceStatus', t.evidence_status,
      'sourceId', t.source_id, 'sourceState', s.verification_state,
      'members', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'name', m.champion_name, 'isLeader', m.is_leader = 1,
        'gemColor', m.gem_color
      ) ORDER BY m.position) FROM knowledge.strategy_team_members m
        WHERE m.strategy_team_example_id = t.strategy_team_example_id), '[]'::jsonb),
      'assessments', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'text', a.assessment_text, 'evidenceType', a.evidence_type,
        'sourceId', a.source_id, 'sourceState', ass.verification_state
      ) ORDER BY a.assessment_id) FROM knowledge.strategy_team_assessments a
        LEFT JOIN knowledge.sources ass ON ass.source_id = a.source_id
        WHERE a.strategy_team_example_id = t.strategy_team_example_id), '[]'::jsonb)
    ) ORDER BY t.strategy_team_example_id), '[]'::jsonb)
      FROM knowledge.strategy_team_examples t
      LEFT JOIN knowledge.sources s ON s.source_id = t.source_id),
    'announcements', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id', u.update_id, 'title', u.title, 'date', u.announcement_date,
      'status', u.live_status, 'sourceId', u.source_id,
      'sourceState', s.verification_state,
      'factions', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'name', fc.faction_name, 'change', fc.change_kind,
        'playstyle', fc.announced_playstyle, 'bonus', fc.announced_bonus
      ) ORDER BY fc.announced_faction_change_id)
        FROM knowledge.announced_faction_changes fc WHERE fc.update_id = u.update_id), '[]'::jsonb),
      'rules', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'text', ar.exact_text, 'category', ar.category
      ) ORDER BY ar.announced_strategy_rule_id)
        FROM knowledge.announced_strategy_rules ar WHERE ar.update_id = u.update_id), '[]'::jsonb)
    ) ORDER BY u.update_id), '[]'::jsonb)
      FROM knowledge.announced_game_updates u
      LEFT JOIN knowledge.sources s ON s.source_id = u.source_id)
  );
$$;
REVOKE ALL ON FUNCTION public.got_guide_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.got_guide_data() TO anon, authenticated;
