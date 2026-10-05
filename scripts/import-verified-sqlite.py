#!/usr/bin/env python3
"""Validate the verified SQLite snapshot and generate/apply an idempotent Supabase seed.

No SQLite rows or credentials are written into the repository. Requires Python 3;
--apply additionally requires psql and SUPABASE_DB_URL in the environment.
"""

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = json.loads((ROOT / "supabase/source-manifest.json").read_text())
MIGRATION = ROOT / "supabase/migrations/20261005000000_verified_knowledge.sql"


def ident(value):
    if not value.replace("_", "").isalnum() or value[0].isdigit():
        raise ValueError(f"Unsafe SQL identifier: {value!r}")
    return '"' + value + '"'


def literal(value):
    if value is None:
        return "NULL"
    if isinstance(value, str):
        if "\x00" in value:
            raise ValueError("SQLite text contains a NUL byte that Postgres cannot store")
        return "'" + value.replace("'", "''") + "'"
    if isinstance(value, (int, float)):
        return str(value)
    raise TypeError(f"Unsupported SQLite value: {type(value)}")


def inspect_source(path):
    if not path.is_file():
        raise ValueError(f"SQLite source is missing: {path}")
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if digest != MANIFEST["sha256"]:
        raise ValueError("SQLite source SHA-256 does not match the approved verified snapshot")
    connection = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    if connection.execute("pragma integrity_check").fetchone()[0] != "ok":
        raise ValueError("SQLite integrity_check failed")
    if connection.execute("pragma foreign_key_check").fetchall():
        raise ValueError("SQLite foreign_key_check failed")
    actual = {
        row[0]: connection.execute(f"select count(*) from {ident(row[0])}").fetchone()[0]
        for row in connection.execute("select name from sqlite_master where type='table' and name not like 'sqlite_%'")
    }
    if actual != MANIFEST["counts"]:
        missing = {k: v for k, v in MANIFEST["counts"].items() if actual.get(k) != v}
        extra = sorted(set(actual) - set(MANIFEST["counts"]))
        raise ValueError(f"Source table/count mismatch: {missing}; unexpected tables: {extra}")
    print("Verified SQLite source:", ", ".join(f"{k}={v}" for k, v in sorted(actual.items())))
    return connection, digest


def table_order(connection):
    pending = set(MANIFEST["counts"])
    ordered = []
    while pending:
        ready = sorted(name for name in pending if all(
            fk[2] not in pending or fk[2] == name
            for fk in connection.execute(f"pragma foreign_key_list({ident(name)})")
        ))
        if not ready:
            raise ValueError(f"Foreign-key cycle among: {sorted(pending)}")
        ordered.extend(ready)
        pending.difference_update(ready)
    return ordered


def check_migration(connection):
    sql = MIGRATION.read_text()
    for table in MANIFEST["counts"]:
        pattern = rf'CREATE TABLE IF NOT EXISTS knowledge\."{re.escape(table)}" \((.*?)\n\);'
        match = re.search(pattern, sql, re.S)
        if not match:
            raise ValueError(f"Migration has no mirror table: {table}")
        for column in connection.execute(f"pragma table_info({ident(table)})"):
            if f'"{column[1]}" ' not in match.group(1):
                raise ValueError(f"Migration omits {table}.{column[1]}")
        if f'ALTER TABLE knowledge."{table}" ENABLE ROW LEVEL SECURITY' not in sql:
            raise ValueError(f"Migration does not enable RLS on {table}")
    for object_name in ("champion_variants", "factions", "faction_memberships", "faction_rules",
                        "abilities", "ability_effects", "source_images", "import_runs"):
        if f"CREATE TABLE IF NOT EXISTS knowledge.{object_name}" not in sql:
            raise ValueError(f"Migration has no derived table: {object_name}")
    if "GRANT EXECUTE ON FUNCTION public.got_data_health() TO anon, authenticated" not in sql:
        raise ValueError("Migration does not expose the read-only health function")
    print("Migration schema coverage and RLS checks passed.")


def seed_sql(connection, digest):
    yield "\\set ON_ERROR_STOP on\nBEGIN;\nSET standard_conforming_strings = on;\n"
    for name in table_order(connection):
        columns = [row[1] for row in connection.execute(f"pragma table_info({ident(name)})")]
        primary = [row[1] for row in sorted(connection.execute(f"pragma table_info({ident(name)})"), key=lambda x: x[5]) if row[5]]
        if not primary:
            raise ValueError(f"Source table has no primary key: {name}")
        nonprimary = [column for column in columns if column not in primary]
        column_sql = ", ".join(map(ident, columns))
        conflict_sql = ", ".join(map(ident, primary))
        if nonprimary:
            update_sql = ", ".join(f"{ident(col)}=EXCLUDED.{ident(col)}" for col in nonprimary)
            suffix = f"ON CONFLICT ({conflict_sql}) DO UPDATE SET {update_sql}"
        else:
            suffix = f"ON CONFLICT ({conflict_sql}) DO NOTHING"
        for row in connection.execute(f"select {column_sql} from {ident(name)}"):
            values = ", ".join(literal(row[col]) for col in columns)
            yield f"INSERT INTO knowledge.{ident(name)} ({column_sql}) VALUES ({values}) {suffix};\n"

    # Derived identities retain the source integer IDs. No similarity matching or
    # guessed variant merging is performed.
    for row in connection.execute("select champion_id, name, canonical_name, rarity, gem_color, record_state from champions order by champion_id"):
        cid = row["champion_id"]
        character_id = f"sqlite-character-{cid}"
        variant_id = f"sqlite-champion-{cid}"
        display = row["canonical_name"] or row["name"]
        yield ("INSERT INTO knowledge.characters(id, display_name) VALUES "
               f"({literal(character_id)}, {literal(display)}) ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name;\n")
        yield ("INSERT INTO knowledge.champion_variants(id, character_id, sqlite_champion_id, display_name, "
               "rarity, gem_color, review_status, live_status) VALUES "
               f"({literal(variant_id)}, {literal(character_id)}, {cid}, {literal(row['name'])}, "
               f"{literal(row['rarity'])}, {literal(row['gem_color'])}, {literal(row['record_state'])}, 'live') "
               "ON CONFLICT (id) DO UPDATE SET character_id=EXCLUDED.character_id, "
               "sqlite_champion_id=EXCLUDED.sqlite_champion_id, display_name=EXCLUDED.display_name, "
               "rarity=EXCLUDED.rarity, gem_color=EXCLUDED.gem_color, review_status=EXCLUDED.review_status;\n")

    factions = sorted({row[0] for row in connection.execute("select faction from champions where faction is not null and trim(faction) <> ''")})
    for faction in factions:
        faction_id = "sqlite-faction-" + faction.encode().hex()
        yield (f"INSERT INTO knowledge.factions(id, name, live_status) VALUES ({literal(faction_id)}, {literal(faction)}, 'live') "
               "ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name;\n")
    for cid, faction in connection.execute("select champion_id, faction from champions where faction is not null and trim(faction) <> ''"):
        faction_id = "sqlite-faction-" + faction.encode().hex()
        yield ("INSERT INTO knowledge.faction_memberships(variant_id, faction_id, live_status) VALUES "
               f"({literal(f'sqlite-champion-{cid}')}, {literal(faction_id)}, 'live') ON CONFLICT DO NOTHING;\n")

    ability_specs = [
        ("ability_definitions", "ability_id", "definition", "ability_name", "exact_visible_text", "source_id", None),
        ("champion_skills", "skill_id", "champion_skill", "skill_name", "exact_visible_text", "source_id", "champion_id"),
        ("iconic_abilities", "iconic_ability_id", "iconic", "ability_name", "exact_visible_text", "source_id", "champion_id"),
        ("raid_boss_abilities", "raid_boss_ability_id", "boss", "ability_name", "exact_visible_text", None, None),
        ("champion_companions", "companion_id", "companion", "skill_name", "exact_visible_text", "source_id", "champion_id"),
    ]
    for table, pk, kind, name_col, text_col, source_col, champ_col in ability_specs:
        for row in connection.execute(f"select * from {ident(table)}"):
            ability_id = f"sqlite-{table}-{row[pk]}"
            variant = f"sqlite-champion-{row[champ_col]}" if champ_col else None
            boss = row["raid_boss_id"] if table == "raid_boss_abilities" else None
            source = row[source_col] if source_col else None
            name = row[name_col] or "Unnamed visible ability"
            visible = row[text_col] or ""
            yield ("INSERT INTO knowledge.abilities(id, kind, name, variant_id, raid_boss_id, source_id, review_status, exact_visible_text) VALUES "
                   f"({literal(ability_id)}, {literal(kind)}, {literal(name)}, {literal(variant)}, {literal(boss)}, "
                   f"{literal(source)}, {literal(row['completion_state'])}, {literal(visible)}) ON CONFLICT (id) DO UPDATE SET "
                   "kind=EXCLUDED.kind, name=EXCLUDED.name, variant_id=EXCLUDED.variant_id, "
                   "raid_boss_id=EXCLUDED.raid_boss_id, source_id=EXCLUDED.source_id, "
                   "review_status=EXCLUDED.review_status, exact_visible_text=EXCLUDED.exact_visible_text;\n")
            yield ("INSERT INTO knowledge.ability_effects(id, ability_id, effect_kind, exact_visible_text) VALUES "
                   f"({literal(ability_id + '-visible-text')}, {literal(ability_id)}, 'unparsed_visible_text', {literal(visible)}) "
                   "ON CONFLICT (id) DO UPDATE SET exact_visible_text=EXCLUDED.exact_visible_text;\n")

    for row in connection.execute("select source_id, drive_file_id, drive_url, filename, verification_state from sources"):
        yield ("INSERT INTO knowledge.source_images(source_id, external_id, source_url, original_filename, review_status) VALUES "
               f"({row['source_id']}, {literal(row['drive_file_id'])}, {literal(row['drive_url'])}, "
               f"{literal(row['filename'])}, {literal(row['verification_state'])}) ON CONFLICT (source_id) DO UPDATE SET "
               "external_id=EXCLUDED.external_id, source_url=EXCLUDED.source_url, "
               "original_filename=EXCLUDED.original_filename, review_status=EXCLUDED.review_status;\n")

    yield ("INSERT INTO knowledge.import_runs(source_sha256, source_version, imported_at) VALUES "
           f"({literal(digest)}, {literal(MANIFEST['version'])}, now()) ON CONFLICT (source_sha256) "
           "DO UPDATE SET imported_at=EXCLUDED.imported_at, source_version=EXCLUDED.source_version;\n")
    for table, count in sorted(MANIFEST["counts"].items()):
        yield ("DO $$ BEGIN IF (SELECT count(*) FROM knowledge." + ident(table) + f") <> {count} THEN "
               f"RAISE EXCEPTION 'Count mismatch for {table}: expected {count}'; END IF; END $$;\n")
    expected_abilities = sum(MANIFEST["counts"][table] for table in (
        "ability_definitions", "champion_skills", "iconic_abilities", "raid_boss_abilities", "champion_companions"))
    expected_factions = len(factions)
    expected_memberships = connection.execute(
        "select count(*) from champions where faction is not null and trim(faction) <> ''").fetchone()[0]
    derived = {
        "characters": MANIFEST["counts"]["champions"],
        "champion_variants": MANIFEST["counts"]["champions"],
        "factions": expected_factions,
        "faction_memberships": expected_memberships,
        "abilities": expected_abilities,
        "ability_effects": expected_abilities,
        "source_images": MANIFEST["counts"]["sources"],
    }
    for table, count in derived.items():
        yield ("DO $$ BEGIN IF (SELECT count(*) FROM knowledge." + ident(table) + f") <> {count} THEN "
               f"RAISE EXCEPTION 'Derived count mismatch for {table}: expected {count}'; END IF; END $$;\n")
    yield ("DO $$ BEGIN IF EXISTS (SELECT 1 FROM knowledge.faction_memberships WHERE live_status <> 'live') "
           "THEN RAISE EXCEPTION 'Announced faction membership was promoted to live data'; END IF; END $$;\n")
    yield "COMMIT;\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sqlite", type=Path, default=Path.home() / "Downloads/got_legends_verified_knowledge.db")
    parser.add_argument("--apply", action="store_true", help="Run migration and seed using SUPABASE_DB_URL and psql")
    parser.add_argument("--check-migration", action="store_true", help="Check that the committed SQL migration matches the source schema")
    args = parser.parse_args()
    connection, digest = inspect_source(args.sqlite)
    derived_abilities = sum(MANIFEST["counts"][name] for name in (
        "ability_definitions", "champion_skills", "iconic_abilities", "raid_boss_abilities", "champion_companions"))
    live_factions = connection.execute(
        "select count(distinct faction) from champions where faction is not null and trim(faction) <> ''").fetchone()[0]
    live_memberships = connection.execute(
        "select count(*) from champions where faction is not null and trim(faction) <> ''").fetchone()[0]
    print(f"Derived expected: variants={MANIFEST['counts']['champions']}, abilities={derived_abilities}, "
          f"ability_effects={derived_abilities}, live_factions={live_factions}, "
          f"live_memberships={live_memberships}, source_images={MANIFEST['counts']['sources']}")
    if args.check_migration or args.apply:
        check_migration(connection)
    if args.apply:
        db_url = os.environ.get("SUPABASE_DB_URL")
        if not db_url:
            raise ValueError("Set SUPABASE_DB_URL to the project's Postgres connection URI")
        if not MIGRATION.exists():
            raise ValueError("Migration file is missing")
        child_env = {**os.environ, "PGDATABASE": db_url}
        child_env.pop("SUPABASE_DB_URL", None)
        subprocess.run(["psql", "-X", "-v", "ON_ERROR_STOP=1", "-q", "-f", str(MIGRATION)],
                       env=child_env, check=True)
        subprocess.run(["psql", "-X", "-v", "ON_ERROR_STOP=1", "-q"],
                       input="".join(seed_sql(connection, digest)), text=True, env=child_env, check=True)
        print("Migration and count-checked seed committed successfully.")
    else:
        # Construct the complete seed locally so missing fields or unsupported
        # value types fail before database credentials are requested.
        statement_count = sum(1 for _ in seed_sql(connection, digest))
        print(f"Seed generation passed: {statement_count} SQL statements; no live database was changed.")


if __name__ == "__main__":
    try:
        main()
    except (OSError, sqlite3.Error, ValueError, TypeError, subprocess.CalledProcessError) as error:
        print(f"Import validation failed: {error}", file=sys.stderr)
        sys.exit(1)
