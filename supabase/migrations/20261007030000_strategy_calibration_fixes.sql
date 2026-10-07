-- Remove three sources of deterministic score inflation found by the final
-- calibration audit: directional false positives, generic faction points,
-- and leadership points awarded more than once by the client.

UPDATE knowledge.strategy_fact_patterns
SET text_pattern = '(gain|gains|gained|grant|grants|granted)[^,.;]{0,35}(def buff|durability|physical resistance|fire resistance|block)|(begin|begins|start|starts|have|has|immune)[^.;]{0,100}(def buff|durability|physical resistance|fire resistance|block)|(def buff|durability|physical resistance|fire resistance|block)[^,.;]{0,35}(gain|gains|gained|grant|grants|granted)|(def buff|durability|physical resistance|fire resistance|block)[^.;]{0,100}(begin|begins|start|starts|have|has|immune)|taunt(s|ing)?[^.]{0,60}durability'
WHERE mechanic_id = 'defense';

UPDATE knowledge.strategy_fact_patterns
SET text_pattern = '(when|if)[^,.]{0,100}(enemy|foe|target|champion)[^,.]{0,100}(becomes |is )?afflicted with fire|(each target|enemy|foe)[^,.]{0,50}(becomes |is )?afflicted with fire|(for each|per)[^,.]{0,40}fire (they|the enemy|the target|on (an )?(enemy|target))'
WHERE mechanic_id = 'fire_payoff';

DELETE FROM knowledge.strategy_rules WHERE id = 'coverage-leader';
DELETE FROM knowledge.strategy_champion_facts WHERE mechanic_id IN ('defense','fire_payoff');

INSERT INTO knowledge.strategy_champion_facts
  (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status)
SELECT 'fact-' || md5(a.id || '|' || p.id), a.variant_id, p.mechanic_id, p.effect_role,
  CASE WHEN a.kind='iconic' THEN 'item' WHEN a.kind IN ('champion_skill','skill') THEN 'skill' ELSE 'ability' END,
  a.name || ': ' || a.exact_visible_text, 'verified_fact', 'ability:' || a.id, a.source_id,
  coalesce(a.confidence, CASE WHEN a.review_status='complete' THEN 1.0 ELSE 0.7 END), coalesce(a.review_status,'reviewed')
FROM knowledge.abilities a
JOIN knowledge.strategy_fact_patterns p ON p.mechanic_id IN ('defense','fire_payoff')
WHERE a.variant_id IS NOT NULL
  AND a.kind NOT IN ('definition','boss','champion_trait')
  AND lower(a.exact_visible_text) ~ p.text_pattern
ON CONFLICT (id) DO NOTHING;

INSERT INTO knowledge.strategy_champion_facts
  (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status)
SELECT 'fact-' || md5('trait|' || t.trait_id || '|' || p.id), v.id, p.mechanic_id, p.effect_role,
  CASE WHEN lower(coalesce(t.trait_type,''))='leader' THEN 'leader' ELSE 'trait' END,
  t.trait_name || ': ' || t.exact_visible_text, 'verified_fact', 'champion_trait:' || t.trait_id, t.source_id,
  CASE WHEN t.completion_state='complete' THEN 1.0 ELSE 0.7 END, t.completion_state
FROM knowledge.champion_traits t
JOIN knowledge.champion_variants v ON v.sqlite_champion_id=t.champion_id
JOIN knowledge.strategy_fact_patterns p ON p.mechanic_id IN ('defense','fire_payoff')
WHERE lower(t.exact_visible_text) ~ p.text_pattern
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.got_strategy_data()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT jsonb_build_object(
    'version', '2026-10-07.2',
    'mechanics', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id',m.id,'name',m.name,'category',m.category) ORDER BY m.id),'[]'::jsonb) FROM knowledge.strategy_mechanics m),
    'targets', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id',t.id,'battleMode',t.battle_mode,'kind',t.target_kind,'name',t.display_name,
      'evidenceState',t.evidence_state,'approach',t.approach,'timing',t.timing,'warning',t.warning,
      'provenanceRef',t.provenance_ref,'reviewStatus',t.review_status) ORDER BY t.battle_mode,t.display_name),'[]'::jsonb)
      FROM knowledge.strategy_targets t),
    'rules', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id',r.id,'kind',r.rule_kind,'battleMode',r.battle_mode,'targetId',r.target_id,
      'subjectVariantId',r.subject_variant_id,'mechanicId',r.mechanic_id,'pairedMechanicId',r.paired_mechanic_id,
      'score',r.score,'rationale',r.rationale,'evidenceCategory',r.evidence_category,
      'provenanceRef',r.provenance_ref,'sourceId',r.source_id,'confidence',r.confidence,'reviewStatus',r.review_status)
      ORDER BY r.id),'[]'::jsonb) FROM knowledge.strategy_rules r),
    'championFacts', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id',f.id,'variantId',f.variant_id,'mechanicId',f.mechanic_id,'effectRole',f.effect_role,
      'context',f.context,'factText',f.fact_text,'evidenceCategory',f.evidence_category,
      'provenanceRef',f.provenance_ref,'sourceId',f.source_id,'confidence',f.confidence,'reviewStatus',f.review_status)
      ORDER BY f.variant_id,f.mechanic_id,f.id),'[]'::jsonb) FROM knowledge.strategy_champion_facts f)
  );
$$;
REVOKE ALL ON FUNCTION public.got_strategy_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.got_strategy_data() TO anon, authenticated;

DO $$
BEGIN
  IF (SELECT count(*) FROM knowledge.strategy_rules) <> 92 THEN RAISE EXCEPTION 'Strategy rule count mismatch'; END IF;
  IF EXISTS (
    SELECT 1 FROM knowledge.strategy_champion_facts
    WHERE mechanic_id='defense'
      AND provenance_ref IN ('champion_trait:22','ability:sqlite-champion_skills-41','ability:sqlite-champion_skills-55','champion_trait:68','champion_trait:148')
  ) THEN RAISE EXCEPTION 'Directional defense false positives remain'; END IF;
  IF (SELECT count(*) FROM knowledge.strategy_champion_facts WHERE mechanic_id='fire_payoff') <> 6 THEN
    RAISE EXCEPTION 'FIRE payoff extraction count mismatch';
  END IF;
END $$;
