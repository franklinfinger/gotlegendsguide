#!/usr/bin/env python3
"""Create a reviewable, source-linked patch for faction badges on champion profiles.

The legacy faction roster identifies the groups; each imported variant also has an
individual full-profile screenshot with its faction banner. The September update
adds factions without removing the existing ones.
"""
import json
import argparse
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROFILE = json.loads((ROOT / "data/audit/champion-profile-image-matches.json").read_text())
parser = argparse.ArgumentParser()
parser.add_argument("--guide-json", type=Path, required=True, help="Pre-reconciliation got_guide_data RPC export")
live = json.loads(parser.parse_args().guide_json.read_text())
sources = {}
for image in PROFILE["matches"]:
    sources.setdefault(image["variant_id"], image)

# Explicit variant IDs avoid collapsing same-name champions.
groups = {
    "Baratheon": "7 10 16 22 51 50 42 57 audit-variant-stannis-one-true-king 77 81",
    "Blacks": "8 9 25 30 32 1 37 legacy-champion-caraxes",
    "Bolton": "64 69 85 38",
    "Brotherhood": "24 57 59 legacy-champion-thoros",
    "Free Cities": "6 5 13 19 26 33 31 46 41 50 legacy-champion-thoros",
    "Free Folk": "27 40 61 62 63 legacy-champion-wunwun",
    "Greens": "43 56 legacy-champion-tyland 58 legacy-champion-aemond legacy-champion-aegonii audit-variant-criston-kingmaker 76",
    "Greyjoy": "36 legacy-champion-theon legacy-champion-yara",
    "Lannister": "4 10 12 15 21 66 36 45 49 legacy-champion-tyland 22 70 73 74 75",
    "Night's Watch": "39 48 54 62 67",
    "Stark": "24 3 2 legacy-champion-theon 48 52 53 60 71 83 audit-variant-jon-battle-of-the-bastards 84 51 38",
    "Targaryen": "8 9 11 18 31 41 44 47 legacy-champion-aegonii 68 65 58",
}

faction_ids = {f["name"]: f["id"] for f in live["factions"]}
champions = {c["id"]: c for c in live["champions"]}
rows = []
missing = []
for faction, tokens in groups.items():
    for token in tokens.split():
        variant = token if not token.isdigit() else f"sqlite-champion-{token}"
        if variant not in champions or variant not in sources:
            missing.append((faction, variant))
            continue
        source = sources[variant]
        rows.append({
            "variant_id": variant,
            "variant_name": champions[variant]["name"],
            "faction": faction,
            "faction_id": faction_ids[faction],
            "source_id": source["source_id"],
            "source_image": source["filename"],
            "basis": "individual champion profile faction banner, cross-checked with archived faction roster",
            "already_live": faction in champions[variant]["factions"],
        })
rows.sort(key=lambda r: (r["faction"], r["variant_id"]))
current = defaultdict(set)
for c in champions.values():
    current[c["id"]].update(c["factions"])
for variant in current:
    current[variant].difference_update({"Martell", "Tyrell", "Wildling"})
for row in rows:
    current[row["variant_id"]].add(row["faction"])
over = {k: sorted(v) for k, v in current.items() if len(v) > 2}
assert not missing, missing
assert not over, over
assert len(rows) == len({(r["variant_id"], r["faction"]) for r in rows})

manifest = {
    "method": "Individual champion profile faction banners reconciled against legacy-factions.html; new current factions from source 620 retained",
    "historical_exclusions": ["Martell", "Tyrell", "Wildling"],
    "not_imported": ["Grey Wind: no verified champion variant ID in current read model"],
    "relationships": rows,
}
(ROOT / "data/audit/profile-faction-reconciliation.json").write_text(json.dumps(manifest, indent=2) + "\n")

sql = [
    "-- Sourced individual profile banners, cross-checked against the archived faction roster.",
    "-- Preserve superseded mistaken icon-label factions for audit history.",
    "UPDATE knowledge.faction_memberships SET live_status='superseded' WHERE faction_id IN ('sqlite-faction-4d617274656c6c','sqlite-faction-547972656c6c','sqlite-faction-57696c646c696e67') AND live_status='live';",
    "UPDATE knowledge.factions SET live_status='superseded' WHERE id IN ('sqlite-faction-4d617274656c6c','sqlite-faction-547972656c6c','sqlite-faction-57696c646c696e67');",
    "INSERT INTO knowledge.faction_memberships (variant_id,faction_id,live_status,confidence,source_id) VALUES",
]
values = []
for r in rows:
    values.append("  ('%s','%s','live',1,%d)" % (r["variant_id"], r["faction_id"], r["source_id"]))
sql.append(",\n".join(values))
sql.append("ON CONFLICT (variant_id,faction_id) DO UPDATE SET live_status='live',confidence=1,source_id=EXCLUDED.source_id;")
sql.append("DO $$ BEGIN IF EXISTS (SELECT 1 FROM knowledge.faction_memberships WHERE live_status='live' GROUP BY variant_id HAVING count(*) > 2) THEN RAISE EXCEPTION 'Champion exceeds two current factions'; END IF; END $$;")
(ROOT / "supabase/migrations/20261007180000_reconcile_profile_factions.sql").write_text("\n\n".join(sql) + "\n")
print(json.dumps({"reviewed_profile_relationships":len(rows),"new_relationships":sum(not r["already_live"] for r in rows),"expected_live_relationships":sum(map(len,current.values())),"expected_dual_variants":sum(len(x)==2 for x in current.values()),"missing_profile_sources":missing,"more_than_two":over}, indent=2))
