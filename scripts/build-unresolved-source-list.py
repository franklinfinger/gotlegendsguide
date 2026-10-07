#!/usr/bin/env python3
"""Build the exact, reviewable list of source files that remain unresolved."""

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DRIVE = ROOT / "data/source-images/reconciliation.jsonl"
HISTORICAL = ROOT / "data/source-images/historical-reference-reconciliation.jsonl"
ARCHIVE = ROOT / "data/source-images/local-archive-reconciliation.jsonl"
OUTPUT = ROOT / "data/audit/remaining-unresolved-sources.tsv"


def load(path):
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def main():
    rows = []
    for row in load(DRIVE):
        if row["contributes_new_information"] == "unresolved" or row["information_imported"] == "unresolved":
            rows.append(("google_drive", row["source_id"], row["filename"], "unresolved_content", row["unresolved_text_or_identity"]))
    for row in load(HISTORICAL):
        if row["status"] == "unresolved":
            rows.append(("historical_reference", row["source_id"], row["filename"], "original_bytes_unresolved", "Original file bytes were not recovered from authorized sources."))
    for row in load(ARCHIVE):
        if row["review_status"] == "archive_bytes_verified_content_unreviewed":
            rows.append(("local_archive", row["source_id"], row["filename"], "content_unreviewed", row["unresolved_text_or_identity"]))

    counts = {corpus: sum(row[0] == corpus for row in rows) for corpus in ("google_drive", "historical_reference", "local_archive")}
    expected = {"google_drive": 250, "historical_reference": 612, "local_archive": 95}
    if counts != expected:
        raise SystemExit(f"Unresolved source counts changed: expected {expected}, found {counts}")

    with OUTPUT.open("w", newline="") as handle:
        writer = csv.writer(handle, delimiter="\t", lineterminator="\n")
        writer.writerow(("corpus", "source_id", "filename", "status", "reason"))
        writer.writerows(sorted(rows, key=lambda row: (row[0], str(row[2]))))
    print(f"Wrote {len(rows)} unresolved source rows to {OUTPUT}")


if __name__ == "__main__":
    main()
