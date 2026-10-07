#!/usr/bin/env python3
"""Build the post-review list of genuinely unresolved material evidence."""

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DRIVE = ROOT / "data/source-images/reconciliation.jsonl"
MATERIALITY = ROOT / "data/audit/historical-source-materiality.jsonl"
OUTPUT = ROOT / "data/audit/remaining-unresolved-sources.tsv"

ACCESSIBLE = {
    "IMG_2183.PNG": "Theon's first trait title is above the visible crop; its effect wording is complete.",
    "IMG_2184.PNG": "Theon's first trait title remains above the visible crop; continuation confirms only the effect wording.",
    "IMG_2186.PNG": "Theon's first trait title remains outside the crop.",
    "IMG_2311.PNG": "Thoros of Myr's first trait title is above the visible crop; its effect wording is complete across adjacent images.",
    "IMG_2325.PNG": "Joffrey Protector's Treasury Generator wording ends below the visible crop.",
    "IMG_2346.PNG": "Cersei Lannister's Treasury Generator wording ends below the visible crop.",
}


def lines(path):
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def main():
    drive = {row["filename"]: row for row in lines(DRIVE)}
    materiality = lines(MATERIALITY)
    rows = [("google_drive", drive[name]["source_id"], name, "cropped_text", reason) for name, reason in ACCESSIBLE.items()]
    rows.extend(("historical_reference", row["source_id"], row["filename"], "material_resupply_needed", row["reason"])
                for row in materiality if row["disposition"] == "material_resupply_needed")
    if len(rows) != 11:
        raise SystemExit(f"Expected 6 accessible crop sources and 5 material historical sources, found {len(rows)}")
    with OUTPUT.open("w", newline="") as handle:
        writer = csv.writer(handle, delimiter="\t", lineterminator="\n")
        writer.writerow(("corpus", "source_id", "filename", "status", "reason"))
        writer.writerows(sorted(rows, key=lambda row: (row[0], str(row[2]))))
    print(f"Wrote {len(rows)} genuinely unresolved/material source rows to {OUTPUT}")


if __name__ == "__main__":
    main()
