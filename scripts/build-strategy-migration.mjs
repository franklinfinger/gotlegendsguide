import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/strategy/strategy-catalog.json'), 'utf8'));
const output = path.join(root, 'supabase/migrations/20261007020000_deterministic_strategy_engine.sql');
const sql = value => value == null ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`;
const num = value => Number(value).toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
const targetById = new Map(catalog.targets.map(target => [target.id, target]));

const mechanicRows = catalog.mechanics.map(row =>
  `  (${sql(row.id)},${sql(row.name)},${sql(row.category)})`).join(',\n');
const patternRows = catalog.patterns.map((row, index) =>
  `  (${sql(`pattern-${String(index + 1).padStart(2, '0')}-${row.mechanicId}`)},${sql(row.mechanicId)},${sql(row.role)},${sql(row.regex)})`).join(',\n');
const targetRows = catalog.targets.map(row =>
  `  (${sql(row.id)},${sql(row.battleMode)},${sql(row.kind)},${sql(row.name)},${sql(row.evidenceState)},${sql(row.approach)},${sql(row.timing)},${sql(row.warning)},${sql(row.provenanceRef)},'reviewed')`).join(',\n');
const scoringRows = [
  ...catalog.rules.map(row => ({...row, kind: 'target_fit', pairedMechanicId: null})),
  ...catalog.synergies.map(row => ({...row, kind: 'team_synergy', targetId: null, confidence: 0.75, provenanceRef: 'derived:verified-mechanic-combination'})),
].map(row => {
  const target = row.targetId ? targetById.get(row.targetId) : null;
  const mode = target?.battleMode || 'all';
  return `  (${sql(row.id)},${sql(row.kind)},${sql(mode)},${sql(row.targetId)},NULL,${sql(row.mechanicId)},${sql(row.pairedMechanicId)},${num(row.score)},${sql(row.rationale)},'strategy_inference',${sql(row.provenanceRef)},NULL,${num(row.confidence)},'reviewed')`;
}).join(',\n');

const migration = `-- Deterministic strategy layer derived from the frozen verified baseline.
-- Direct facts, strategy inferences, and community observations remain separate.
CREATE TABLE IF NOT EXISTS knowledge.strategy_mechanics (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL
);
CREATE TABLE IF NOT EXISTS knowledge.strategy_fact_patterns (
  id text PRIMARY KEY,
  mechanic_id text NOT NULL REFERENCES knowledge.strategy_mechanics(id),
  effect_role text NOT NULL,
  text_pattern text NOT NULL
);
CREATE TABLE IF NOT EXISTS knowledge.strategy_targets (
  id text PRIMARY KEY,
  battle_mode text NOT NULL CHECK (battle_mode IN ('legendary-assault','raid','war')),
  target_kind text NOT NULL,
  display_name text NOT NULL,
  evidence_state text NOT NULL CHECK (evidence_state IN ('verified','insufficient')),
  approach text NOT NULL,
  timing text NOT NULL,
  warning text NOT NULL,
  provenance_ref text NOT NULL,
  review_status text NOT NULL
);
CREATE TABLE IF NOT EXISTS knowledge.strategy_rules (
  id text PRIMARY KEY,
  rule_kind text NOT NULL CHECK (rule_kind IN ('target_fit','team_synergy')),
  battle_mode text NOT NULL,
  target_id text REFERENCES knowledge.strategy_targets(id),
  subject_variant_id text REFERENCES knowledge.champion_variants(id),
  mechanic_id text NOT NULL REFERENCES knowledge.strategy_mechanics(id),
  paired_mechanic_id text REFERENCES knowledge.strategy_mechanics(id),
  score numeric(7,3) NOT NULL,
  rationale text NOT NULL,
  evidence_category text NOT NULL CHECK (evidence_category IN ('verified_fact','strategy_inference','community_observed')),
  provenance_ref text NOT NULL,
  source_id bigint REFERENCES knowledge.sources(source_id),
  confidence numeric(4,3) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  review_status text NOT NULL
);
CREATE TABLE IF NOT EXISTS knowledge.strategy_champion_facts (
  id text PRIMARY KEY,
  variant_id text NOT NULL REFERENCES knowledge.champion_variants(id),
  mechanic_id text NOT NULL REFERENCES knowledge.strategy_mechanics(id),
  effect_role text NOT NULL,
  context text NOT NULL,
  fact_text text NOT NULL,
  evidence_category text NOT NULL CHECK (evidence_category IN ('verified_fact','strategy_inference','community_observed')),
  provenance_ref text NOT NULL,
  source_id bigint REFERENCES knowledge.sources(source_id),
  confidence numeric(4,3) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  review_status text NOT NULL
);

ALTER TABLE knowledge.strategy_mechanics ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge.strategy_fact_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge.strategy_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge.strategy_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge.strategy_champion_facts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge.strategy_mechanics, knowledge.strategy_fact_patterns, knowledge.strategy_targets, knowledge.strategy_rules, knowledge.strategy_champion_facts FROM PUBLIC, anon, authenticated;

INSERT INTO knowledge.strategy_mechanics (id,name,category) VALUES
${mechanicRows}
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,category=EXCLUDED.category;

INSERT INTO knowledge.strategy_fact_patterns (id,mechanic_id,effect_role,text_pattern) VALUES
${patternRows}
ON CONFLICT (id) DO UPDATE SET mechanic_id=EXCLUDED.mechanic_id,effect_role=EXCLUDED.effect_role,text_pattern=EXCLUDED.text_pattern;

INSERT INTO knowledge.strategy_targets (id,battle_mode,target_kind,display_name,evidence_state,approach,timing,warning,provenance_ref,review_status) VALUES
${targetRows}
ON CONFLICT (id) DO UPDATE SET battle_mode=EXCLUDED.battle_mode,target_kind=EXCLUDED.target_kind,display_name=EXCLUDED.display_name,evidence_state=EXCLUDED.evidence_state,approach=EXCLUDED.approach,timing=EXCLUDED.timing,warning=EXCLUDED.warning,provenance_ref=EXCLUDED.provenance_ref,review_status=EXCLUDED.review_status;

INSERT INTO knowledge.strategy_rules (id,rule_kind,battle_mode,target_id,subject_variant_id,mechanic_id,paired_mechanic_id,score,rationale,evidence_category,provenance_ref,source_id,confidence,review_status) VALUES
${scoringRows}
ON CONFLICT (id) DO UPDATE SET rule_kind=EXCLUDED.rule_kind,battle_mode=EXCLUDED.battle_mode,target_id=EXCLUDED.target_id,subject_variant_id=EXCLUDED.subject_variant_id,mechanic_id=EXCLUDED.mechanic_id,paired_mechanic_id=EXCLUDED.paired_mechanic_id,score=EXCLUDED.score,rationale=EXCLUDED.rationale,evidence_category=EXCLUDED.evidence_category,provenance_ref=EXCLUDED.provenance_ref,source_id=EXCLUDED.source_id,confidence=EXCLUDED.confidence,review_status=EXCLUDED.review_status;

DELETE FROM knowledge.strategy_champion_facts;

-- Exact mechanic words are normalized from reviewed ability, trait, and item wording.
INSERT INTO knowledge.strategy_champion_facts
  (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status)
SELECT 'fact-' || md5(a.id || '|' || p.id), a.variant_id, p.mechanic_id, p.effect_role,
  CASE WHEN a.kind='iconic' THEN 'item' WHEN a.kind IN ('champion_skill','skill') THEN 'skill' ELSE 'ability' END,
  a.name || ': ' || a.exact_visible_text, 'verified_fact', 'ability:' || a.id, a.source_id,
  coalesce(a.confidence, CASE WHEN a.review_status='complete' THEN 1.0 ELSE 0.7 END), coalesce(a.review_status,'reviewed')
FROM knowledge.abilities a
CROSS JOIN knowledge.strategy_fact_patterns p
WHERE a.variant_id IS NOT NULL
  AND a.kind NOT IN ('definition','boss','champion_trait')
  AND lower(a.exact_visible_text) ~ p.text_pattern
ON CONFLICT (id) DO NOTHING;

-- Original trait rows retain the Leader/Passive distinction needed for leader selection.
INSERT INTO knowledge.strategy_champion_facts
  (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status)
SELECT 'fact-' || md5('trait|' || t.trait_id || '|' || p.id), v.id, p.mechanic_id, p.effect_role,
  CASE WHEN lower(coalesce(t.trait_type,''))='leader' THEN 'leader' ELSE 'trait' END,
  t.trait_name || ': ' || t.exact_visible_text, 'verified_fact', 'champion_trait:' || t.trait_id, t.source_id,
  CASE WHEN t.completion_state='complete' THEN 1.0 ELSE 0.7 END, t.completion_state
FROM knowledge.champion_traits t
JOIN knowledge.champion_variants v ON v.sqlite_champion_id=t.champion_id
CROSS JOIN knowledge.strategy_fact_patterns p
WHERE lower(t.exact_visible_text) ~ p.text_pattern
ON CONFLICT (id) DO NOTHING;

INSERT INTO knowledge.strategy_champion_facts
  (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status)
SELECT 'leader-' || t.trait_id, v.id, 'leader_effect', 'leads', 'leader',
  t.trait_name || ': ' || t.exact_visible_text, 'verified_fact', 'champion_trait:' || t.trait_id, t.source_id,
  CASE WHEN t.completion_state='complete' THEN 1.0 ELSE 0.7 END, t.completion_state
FROM knowledge.champion_traits t
JOIN knowledge.champion_variants v ON v.sqlite_champion_id=t.champion_id
WHERE lower(coalesce(t.trait_type,''))='leader'
ON CONFLICT (id) DO UPDATE SET fact_text=EXCLUDED.fact_text,confidence=EXCLUDED.confidence,review_status=EXCLUDED.review_status;

-- Identity facts allow battlefield modifiers to match exact colors and normalized factions.
INSERT INTO knowledge.strategy_champion_facts
  (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status)
SELECT 'color-' || v.id, v.id, 'color_' || lower(v.gem_color), 'is', 'metadata',
  v.display_name || ' is ' || v.gem_color || '.', 'verified_fact', 'champion_variant:' || v.id, NULL, 1.0, v.review_status
FROM knowledge.champion_variants v
WHERE lower(coalesce(v.gem_color,'')) IN ('red','blue','green','purple','yellow')
ON CONFLICT (id) DO UPDATE SET mechanic_id=EXCLUDED.mechanic_id,fact_text=EXCLUDED.fact_text,review_status=EXCLUDED.review_status;

INSERT INTO knowledge.strategy_champion_facts
  (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status)
SELECT 'faction-' || md5(v.id || '|' || f.id), v.id,
  CASE f.name
    WHEN 'Night''s Watch' THEN 'faction_nights_watch'
    WHEN 'Free Cities' THEN 'faction_free_cities'
    WHEN 'Free Folk' THEN 'faction_free_folk'
    ELSE 'faction_' || replace(lower(f.name),' ','_') END,
  'member', 'metadata', v.display_name || ' belongs to ' || f.name || '.', 'verified_fact',
  'faction_membership:' || f.id || ':' || v.id, NULL, 1.0, 'reviewed'
FROM knowledge.faction_memberships fm
JOIN knowledge.champion_variants v ON v.id=fm.variant_id
JOIN knowledge.factions f ON f.id=fm.faction_id
WHERE fm.live_status='live' AND f.live_status='live'
  AND (CASE f.name WHEN 'Night''s Watch' THEN 'faction_nights_watch' WHEN 'Free Cities' THEN 'faction_free_cities' WHEN 'Free Folk' THEN 'faction_free_folk' ELSE 'faction_' || replace(lower(f.name),' ','_') END)
    IN (SELECT id FROM knowledge.strategy_mechanics)
ON CONFLICT (id) DO NOTHING;

INSERT INTO knowledge.strategy_champion_facts
  (id,variant_id,mechanic_id,effect_role,context,fact_text,evidence_category,provenance_ref,source_id,confidence,review_status)
SELECT 'availability-' || v.id, v.id, 'unverified_release', 'limits', 'metadata',
  'Current availability for ' || v.display_name || ' is not verified.', 'verified_fact',
  'champion_variant:' || v.id, NULL, 1.0, v.review_status
FROM knowledge.champion_variants v WHERE v.live_status <> 'live'
ON CONFLICT (id) DO UPDATE SET fact_text=EXCLUDED.fact_text,review_status=EXCLUDED.review_status;

CREATE INDEX IF NOT EXISTS strategy_facts_variant_idx ON knowledge.strategy_champion_facts(variant_id);
CREATE INDEX IF NOT EXISTS strategy_facts_mechanic_idx ON knowledge.strategy_champion_facts(mechanic_id);
CREATE INDEX IF NOT EXISTS strategy_rules_target_idx ON knowledge.strategy_rules(target_id);

CREATE OR REPLACE FUNCTION public.got_strategy_data()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT jsonb_build_object(
    'version', ${sql(catalog.version)},
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
  IF (SELECT count(*) FROM knowledge.strategy_targets) <> ${catalog.targets.length} THEN RAISE EXCEPTION 'Strategy target count mismatch'; END IF;
  IF (SELECT count(*) FROM knowledge.strategy_rules) <> ${catalog.rules.length + catalog.synergies.length} THEN RAISE EXCEPTION 'Strategy rule count mismatch'; END IF;
  IF (SELECT count(*) FROM knowledge.strategy_champion_facts) < 500 THEN RAISE EXCEPTION 'Strategy champion fact extraction is unexpectedly small'; END IF;
  IF (SELECT count(*) FROM knowledge.strategy_champion_facts WHERE context='leader') < 70 THEN RAISE EXCEPTION 'Leader fact extraction is incomplete'; END IF;
  IF (SELECT evidence_state FROM knowledge.strategy_targets WHERE id='legendary-assault:icy-viserion') <> 'insufficient' THEN RAISE EXCEPTION 'Icy Viserion must remain insufficient evidence'; END IF;
END $$;
`;

fs.writeFileSync(output, migration);
console.log(`Wrote ${path.relative(root, output)} with ${catalog.rules.length + catalog.synergies.length} rules.`);
