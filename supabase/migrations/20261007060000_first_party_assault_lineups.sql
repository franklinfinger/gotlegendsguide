-- Retain the supplied first-party lineup even where an exact variant is unresolved.
-- Null variant IDs are deliberate; the display name is not treated as an identity.
ALTER TABLE knowledge.curated_recommendations ALTER COLUMN leader_variant_id DROP NOT NULL;
ALTER TABLE knowledge.curated_recommendation_members ALTER COLUMN variant_id DROP NOT NULL;
ALTER TABLE knowledge.curated_recommendation_members ADD COLUMN display_name text;
ALTER TABLE knowledge.curated_recommendation_members ADD COLUMN identity_status text NOT NULL DEFAULT 'exact'
  CHECK (identity_status IN ('exact','unresolved'));
ALTER TABLE knowledge.curated_recommendation_members ADD COLUMN is_leader boolean NOT NULL DEFAULT false;

UPDATE knowledge.curated_recommendation_members m
SET display_name = v.display_name,
    is_leader = m.variant_id = c.leader_variant_id
FROM knowledge.curated_recommendations c, knowledge.champion_variants v
WHERE m.recommendation_id = c.id AND m.variant_id = v.id;

ALTER TABLE knowledge.curated_recommendation_members ALTER COLUMN display_name SET NOT NULL;
ALTER TABLE knowledge.curated_recommendation_members ADD CONSTRAINT curated_identity_matches_variant
  CHECK ((identity_status='exact' AND variant_id IS NOT NULL) OR
         (identity_status='unresolved' AND variant_id IS NULL));

INSERT INTO knowledge.curated_recommendations
  (id,target_id,title,recommendation_type,confidence,provenance_ref,source_id,notes,active,effective_date,game_version,review_status,leader_variant_id)
VALUES
  ('curated-viserion-first-party-2026-10','legendary-assault:viserion','First-party Viserion lineup','best_known',0.8,
   'user_supplied:first_party_tips_2026-10-07',NULL,
   'Current first-party in-game lineup transcribed directly by the user. The original recommendation image is not attached to this record. Jon Snow has two source-backed variants and the supplied name does not identify which one; no exact ID is assigned to that slot.',
   true,'2026-10-07',NULL,'partial','sqlite-champion-48'),
  ('curated-rhaegal-first-party-2026-10','legendary-assault:rhaegal','First-party Rhaegal lineup','best_known',0.8,
   'user_supplied:first_party_tips_2026-10-07',NULL,
   'Current first-party in-game lineup transcribed directly by the user. The original recommendation image is not attached to this record. Criston Cole has two source-backed variants. Both Daenerys Targaryen slots remain unresolved without portrait or affinity evidence; the second was identified as Leader by the user.',
   true,'2026-10-07',NULL,'partial',NULL),
  ('curated-icy-viserion-first-party-2026-10','legendary-assault:icy-viserion','First-party Icy Viserion lineup','best_known',0.95,
   'user_supplied:first_party_tips_2026-10-07',NULL,
   'Current first-party in-game lineup transcribed directly by the user. All five names match one source-backed variant each. The original recommendation image and Icy Viserion ability cards are not available; no ability wording or detailed battle sequence is inferred.',
   true,'2026-10-07',NULL,'reviewed','sqlite-champion-21');

INSERT INTO knowledge.curated_recommendation_members
  (recommendation_id,position,variant_id,display_name,identity_status,is_leader)
VALUES
  ('curated-viserion-first-party-2026-10',1,'sqlite-champion-48','Benjen Stark','exact',true),
  ('curated-viserion-first-party-2026-10',2,'sqlite-champion-54','Alliser Thorne','exact',false),
  ('curated-viserion-first-party-2026-10',3,NULL,'Jon Snow','unresolved',false),
  ('curated-viserion-first-party-2026-10',4,'sqlite-champion-30','Laenor Velaryon','exact',false),
  ('curated-viserion-first-party-2026-10',5,'legacy-champion-theon','Theon Greyjoy','exact',false),
  ('curated-rhaegal-first-party-2026-10',1,NULL,'Criston Cole','unresolved',false),
  ('curated-rhaegal-first-party-2026-10',2,NULL,'Daenerys Targaryen','unresolved',false),
  ('curated-rhaegal-first-party-2026-10',3,'sqlite-champion-63','Osha','exact',false),
  ('curated-rhaegal-first-party-2026-10',4,NULL,'Daenerys Targaryen','unresolved',true),
  ('curated-rhaegal-first-party-2026-10',5,'sqlite-champion-41','Viserys Targaryen III','exact',false),
  ('curated-icy-viserion-first-party-2026-10',1,'sqlite-champion-48','Benjen Stark','exact',false),
  ('curated-icy-viserion-first-party-2026-10',2,'sqlite-champion-54','Alliser Thorne','exact',false),
  ('curated-icy-viserion-first-party-2026-10',3,'sqlite-champion-39','Samwell Tarly','exact',false),
  ('curated-icy-viserion-first-party-2026-10',4,'sqlite-champion-53','Bran Stark','exact',false),
  ('curated-icy-viserion-first-party-2026-10',5,'sqlite-champion-21','Jaqen H''ghar','exact',true);

-- These are already verified tips. Keep encounter ability evidence marked insufficient.
UPDATE knowledge.strategy_targets
SET approach='The supplied first-party lineup is available. Verified tips favor REINFORCE damage and strong gem teams; the ability cards needed to explain each champion''s contribution are unavailable.',
    timing='Using Skills frequently triggers Icebound sooner. The exact turn sequence remains unverified.',
    warning='Icy Viserion is immune to most Debuffs. His ability cards and detailed battle rules remain unavailable.'
WHERE id='legendary-assault:icy-viserion';

DO $$
BEGIN
  IF (SELECT count(*) FROM knowledge.curated_recommendations WHERE active) <> 4 THEN
    RAISE EXCEPTION 'Expected four active first-party Legendary Assault lineups';
  END IF;
  IF EXISTS (SELECT recommendation_id FROM knowledge.curated_recommendation_members
             GROUP BY recommendation_id HAVING count(*) <> 5 OR count(*) FILTER (WHERE is_leader) <> 1) THEN
    RAISE EXCEPTION 'Every curated lineup must contain five positions and one Leader';
  END IF;
  IF (SELECT count(*) FROM knowledge.curated_recommendation_members WHERE identity_status='unresolved') <> 4 THEN
    RAISE EXCEPTION 'Expected four unresolved exact variant identities';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.got_strategy_data()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT jsonb_build_object(
    'version', '2026-10-07.4',
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
      'members',coalesce((SELECT jsonb_agg(jsonb_build_object(
        'position',m.position,'variantId',m.variant_id,'displayName',m.display_name,
        'identityStatus',m.identity_status,'isLeader',m.is_leader) ORDER BY m.position)
        FROM knowledge.curated_recommendation_members m WHERE m.recommendation_id=c.id),'[]'::jsonb)) ORDER BY c.target_id,c.id),'[]'::jsonb)
      FROM knowledge.curated_recommendations c)
  );
$$;
REVOKE ALL ON FUNCTION public.got_strategy_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.got_strategy_data() TO anon, authenticated;
