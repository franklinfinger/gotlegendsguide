"""Restore the three visually reviewed Icy Viserion tips in the SQLite snapshot."""

import json
import sqlite3
from pathlib import Path


database = Path(__file__).resolve().parents[1] / "data/audit/reconciled-knowledge.sqlite"
tips = (
    ("icy-viserion-reinforce", "Champions who REINFORCE can punish Icy Viserion by dealing bonus damage."),
    ("icy-viserion-gem-teams", "Strong gem teams can take advantage of Icy Viserion's Undead Dragon trait."),
    ("icy-viserion-skill-timing", "Using Skills frequently will trigger his devestating Icebound attack sooner, and he is immune to most Debuffs."),
)
sources = (102125, 102126, 102127)

with sqlite3.connect(database) as connection:
    connection.execute("PRAGMA foreign_keys=ON")
    for tip_id, wording in tips:
        connection.execute(
            "INSERT INTO legendary_assault_tips VALUES (?, ?, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET exact_visible_text=excluded.exact_visible_text, "
            "review_state=excluded.review_state",
            (tip_id, "Icy Viserion", wording, "screenshot_verified_current"),
        )
        for source_id in sources:
            connection.execute(
                "INSERT OR IGNORE INTO legendary_assault_tip_sources VALUES (?, ?)",
                (tip_id, source_id),
            )
    assert connection.execute("PRAGMA foreign_key_check").fetchall() == []
    assert connection.execute(
        "SELECT count(*) FROM legendary_assault_tips WHERE encounter_name='Icy Viserion'"
    ).fetchone()[0] == 3

print("Restored three Icy Viserion tips with nine source links.")

manifest = database.parents[1] / "source-images/reconciliation.jsonl"
updated = []
for line in manifest.read_text().splitlines():
    row = json.loads(line)
    if row.get("source_id") in sources:
        linked = row["database_records_connected"]
        for tip_id, _ in tips:
            connection = {"basis": "visually_reviewed_tip", "id": tip_id, "table": "legendary_assault_tips"}
            if connection not in linked:
                linked.append(connection)
        row["contributes_new_information"] = True
        row["information_imported"] = True
        line = json.dumps(row, sort_keys=True)
    updated.append(line)
manifest.write_text("\n".join(updated) + "\n")
