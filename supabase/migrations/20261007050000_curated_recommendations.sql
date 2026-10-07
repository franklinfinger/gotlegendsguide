-- Curated recommendations are authoritative product knowledge and remain
-- separate from community-observed compositions and deterministic scoring.
CREATE TABLE IF NOT EXISTS knowledge.curated_recommendations (
  id text PRIMARY KEY,
  target_id text NOT NULL REFERENCES knowledge.strategy_targets(id),
  title text NOT NULL,
  recommendation_type text NOT NULL CHECK (recommendation_type IN ('best_known','verified','alternative')),
  confidence numeric(4,3) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  provenance_ref text NOT NULL,
  source_id bigint REFERENCES knowledge.sources(source_id),
  notes text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  effective_date date,
  game_version text,
  review_status text NOT NULL CHECK (review_status IN ('reviewed','partial')),
  leader_variant_id text NOT NULL REFERENCES knowledge.champion_variants(id)
);
CREATE TABLE IF NOT EXISTS knowledge.curated_recommendation_members (
  recommendation_id text NOT NULL REFERENCES knowledge.curated_recommendations(id) ON DELETE CASCADE,
  position smallint NOT NULL CHECK (position BETWEEN 1 AND 5),
  variant_id text NOT NULL REFERENCES knowledge.champion_variants(id),
  PRIMARY KEY (recommendation_id,position),
  UNIQUE (recommendation_id,variant_id)
);

ALTER TABLE knowledge.curated_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge.curated_recommendation_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge.curated_recommendations, knowledge.curated_recommendation_members FROM PUBLIC, anon, authenticated;

INSERT INTO knowledge.curated_recommendations
  (id,target_id,title,recommendation_type,confidence,provenance_ref,source_id,notes,active,effective_date,game_version,review_status,leader_variant_id)
VALUES
  ('curated-drogon-best-2026-10','legendary-assault:drogon','Best known Drogon team','best_known',1,
   'source:102791',102791,
   'Authoritative gameplay screenshot supplied by the user. Exact variants were matched from portrait and affinity. The screenshot establishes this as the current best-known lineup when sufficiently developed; it does not prove other lineups cannot perform well.',
   true,'2026-10-07','2026-10','reviewed','sqlite-champion-19')
ON CONFLICT (id) DO UPDATE SET target_id=EXCLUDED.target_id,title=EXCLUDED.title,recommendation_type=EXCLUDED.recommendation_type,
 confidence=EXCLUDED.confidence,provenance_ref=EXCLUDED.provenance_ref,source_id=EXCLUDED.source_id,notes=EXCLUDED.notes,
 active=EXCLUDED.active,effective_date=EXCLUDED.effective_date,game_version=EXCLUDED.game_version,review_status=EXCLUDED.review_status,
 leader_variant_id=EXCLUDED.leader_variant_id;

INSERT INTO knowledge.curated_recommendation_members (recommendation_id,position,variant_id) VALUES
  ('curated-drogon-best-2026-10',1,'sqlite-champion-19'),
  ('curated-drogon-best-2026-10',2,'sqlite-champion-5'),
  ('curated-drogon-best-2026-10',3,'sqlite-champion-6'),
  ('curated-drogon-best-2026-10',4,'sqlite-champion-58'),
  ('curated-drogon-best-2026-10',5,'sqlite-champion-9')
ON CONFLICT (recommendation_id,position) DO UPDATE SET variant_id=EXCLUDED.variant_id;

CREATE OR REPLACE FUNCTION public.got_strategy_data()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT jsonb_build_object(
    'version', '2026-10-07.3',
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
      ORDER BY f.variant_id,f.mechanic_id,f.id),'[]'::jsonb) FROM knowledge.strategy_champion_facts f),
    'curatedRecommendations', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'id',c.id,'targetId',c.target_id,'title',c.title,'recommendationType',c.recommendation_type,
      'confidence',c.confidence,'provenanceRef',c.provenance_ref,'sourceId',c.source_id,'notes',c.notes,
      'active',c.active,'effectiveDate',c.effective_date,'gameVersion',c.game_version,'reviewStatus',c.review_status,
      'leaderVariantId',c.leader_variant_id,
      'members',coalesce((SELECT jsonb_agg(jsonb_build_object('position',m.position,'variantId',m.variant_id) ORDER BY m.position)
        FROM knowledge.curated_recommendation_members m WHERE m.recommendation_id=c.id),'[]'::jsonb)) ORDER BY c.target_id,c.id),'[]'::jsonb)
      FROM knowledge.curated_recommendations c)
  );
$$;
REVOKE ALL ON FUNCTION public.got_strategy_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.got_strategy_data() TO anon, authenticated;

DO $$
BEGIN
  IF (SELECT count(*) FROM knowledge.curated_recommendations WHERE active AND confidence>=0.9) <> 1 THEN RAISE EXCEPTION 'Active curated recommendation count mismatch'; END IF;
  IF (SELECT count(*) FROM knowledge.curated_recommendation_members WHERE recommendation_id='curated-drogon-best-2026-10') <> 5 THEN RAISE EXCEPTION 'Drogon curated team must contain five exact variants'; END IF;
  IF NOT EXISTS (SELECT 1 FROM knowledge.curated_recommendation_members WHERE recommendation_id='curated-drogon-best-2026-10' AND variant_id='sqlite-champion-19' AND position=1) THEN RAISE EXCEPTION 'Curated leader position mismatch'; END IF;
END $$;
