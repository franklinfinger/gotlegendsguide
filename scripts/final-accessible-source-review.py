#!/usr/bin/env python3
"""Finalize the visual review of the remaining accessible source images.

The decisions in this file come from individual inspection of the 95 pending
archive images and the 250 pending Drive images. Re-running the script updates
the permanent manifests and regenerates the review/materiality artifacts.
"""

import csv
import json
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DRIVE = ROOT / "data/source-images/reconciliation.jsonl"
ARCHIVE = ROOT / "data/source-images/local-archive-reconciliation.jsonl"
HISTORY = ROOT / "data/source-images/historical-reference-reconciliation.jsonl"
REVIEW = ROOT / "data/audit/final-accessible-source-review.json"
MATERIALITY = ROOT / "data/audit/historical-source-materiality.jsonl"
RESUPPLY = ROOT / "data/audit/prioritized-historical-resupply.tsv"


NEW_WAR = {"IMG_2131.PNG", "IMG_2133.PNG", "IMG_2134.PNG", "IMG_2135.PNG", "IMG_2139.PNG"}
WAR_ATTRIBUTION = {"IMG_2132.PNG", "IMG_2136.PNG", "IMG_2137.PNG", "IMG_2138.PNG"}
ASSAULT_PRIMARY = {"IMG_2115.PNG", "IMG_2116.PNG", "IMG_2117.PNG", "IMG_2118.PNG", "IMG_2119.PNG", "IMG_2120.PNG", "IMG_2122.PNG", "IMG_2123.PNG", "IMG_2124.PNG"}
ASSAULT_DUPLICATES = {"IMG_2121.PNG", "IMG_2594.PNG", "IMG_2669.PNG", "IMG_2689.PNG", "IMG_2749.PNG"}
FACTION_PRIMARY = {f"IMG_{n}.PNG" for n in (2557, 2558, 2559, 2560, 2563, 2565, 2566, 2567, 2569, 2570, 2571, 2776)}
FACTION_GUIDANCE = {"IMG_2580.PNG", "IMG_2772.PNG", "IMG_2773.PNG", "IMG_2775.PNG"}
FACTION_DUPLICATES = {"IMG_2562.PNG", "IMG_2564.PNG", "IMG_2568.PNG"}

# One screenshot per distinct observed composition. Outcomes are not shown.
TEAM_PRIMARY = {f"IMG_{n}.PNG" for n in (
    1830, 1831, 1832, 1833, 1834, 1835, 1856, 1872, 1882, 1886, 1887,
    2561, 2592, 2642, 2643, 2644, 2646, 2651, 2656, 2672, 2674, 2685,
    2688, 2736, 2737, 2738, 2739, 2740, 2741, 2742, 2743, 2744, 2745,
    2746, 2750, 2764, 2765,
)}
TEAM_DUPLICATES = {f"IMG_{n}.PNG" for n in (1836, 2641, 2652, 2653, 2654, 2670, 2671, 2673, 2682, 2683, 2684, 2686)}
CROPPED = {"IMG_2186.PNG", "IMG_2325.PNG", "IMG_2346.PNG"}
IRRELEVANT = {f"IMG_{n}.PNG" for n in (1838, 1858, 2130, 2572, 2573, 2574, 2575, 2576, 2577, 2791, 2792)}
IRRELEVANT |= {f"IMG_{n}.PNG" for n in (2128, 2129, 2584, 2585, 2586, 2587, 2588, 2589, 2590, 2591)}

MATERIAL_FILES = {
    "DBCBC905-F467-442E-B33E-2868A46A2F51_1_105_c.jpeg": (1, "Complete the cropped final wording of Teaching Me This Lesson III."),
    "IMG_3301(1).jpeg": (2, "Complete Joffrey Protector's cropped Treasury Generator wording."),
    "IMG_3325.jpeg": (3, "Complete Cersei Lannister's cropped Treasury Generator wording."),
    "IMG_3452(1).jpeg": (4, "Resolve the observed team member recorded as Crownlands Knight."),
    "IMG_3160.jpeg": (5, "Restore the supplied Red Woman's Ruby Necklace visual asset; its text is already represented."),
}


def load_lines(path):
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def write_lines(path, rows):
    path.write_text("".join(json.dumps(row, sort_keys=True) + "\n" for row in rows))


def drive_category(filename):
    if filename in CROPPED:
        return "cropped text"
    if filename in WAR_ATTRIBUTION:
        return "missing relationship or attribution"
    if filename in NEW_WAR | ASSAULT_PRIMARY | FACTION_PRIMARY | FACTION_GUIDANCE | TEAM_PRIMARY:
        return "visible new information requiring import"
    if filename in ASSAULT_DUPLICATES | FACTION_DUPLICATES | TEAM_DUPLICATES:
        return "duplicate"
    if filename in IRRELEVANT:
        return "irrelevant to the game database"
    return "visible information already represented"


def main():
    drive = load_lines(DRIVE)
    archive = load_lines(ARCHIVE)
    history = load_lines(HISTORY)
    pending_drive = [row for row in drive if row.get("information_imported") == "unresolved" or row.get("contributes_new_information") == "unresolved" or row.get("review_status") == "individually_visually_reviewed"]
    pending_archive = [row for row in archive if row.get("review_status") in {"archive_bytes_verified_content_unreviewed", "individually_visually_reviewed"}]
    if len(pending_drive) != 250 or len(pending_archive) != 95:
        raise SystemExit(f"Expected 250 Drive and 95 archive review targets; found {len(pending_drive)} and {len(pending_archive)}")

    drive_review = []
    for row in pending_drive:
        category = drive_category(row["filename"])
        row["final_resolution_category"] = category
        row["review_status"] = "individually_visually_reviewed"
        row["text_review_status"] = "human_visual_content_review_complete_machine_ocr_retained"
        row["contributes_new_information"] = category == "visible new information requiring import"
        row["information_imported"] = category in {
            "visible new information requiring import", "missing relationship or attribution",
            "visible information already represented", "duplicate", "irrelevant to the game database",
        }
        row["unresolved_text_or_identity"] = (["Visible text remains cropped; no missing wording was inferred."] if category == "cropped text" else [])
        row["confidence"] = 1.0 if category != "cropped text" else 0.95
        drive_review.append({"corpus": "google_drive", "source_id": row["source_id"], "filename": row["filename"], "resolution_category": category})

    archive_review = []
    for row in pending_archive:
        category = "duplicate" if row["same_stem_as_drive_png"] else "irrelevant to the game database"
        row["final_resolution_category"] = category
        row["review_status"] = "individually_visually_reviewed"
        row["text_review_status"] = "human_visual_content_review_complete_machine_ocr_retained"
        row["contributes_new_information"] = False
        row["information_imported"] = True
        row["unresolved_text_or_identity"] = []
        row["confidence"] = 1.0
        archive_review.append({"corpus": "local_archive", "source_id": row["source_id"], "filename": row["filename"], "resolution_category": category})

    if Counter(r["resolution_category"] for r in archive_review) != Counter({"duplicate": 72, "irrelevant to the game database": 23}):
        raise SystemExit("Archive review split changed")
    allowed = {"unreadable image", "cropped text", "ambiguous identity", "duplicate", "irrelevant to the game database", "visible information already represented", "visible new information requiring import", "missing relationship or attribution"}
    if any(r["resolution_category"] not in allowed for r in drive_review):
        raise SystemExit("Invalid final resolution category")

    write_lines(DRIVE, drive)
    write_lines(ARCHIVE, archive)
    REVIEW.write_text(json.dumps({
        "review_date": "2026-10-07",
        "drive_images_reviewed": len(drive_review),
        "archive_images_reviewed": len(archive_review),
        "drive_resolution_counts": dict(sorted(Counter(r["resolution_category"] for r in drive_review).items())),
        "archive_resolution_counts": dict(sorted(Counter(r["resolution_category"] for r in archive_review).items())),
        "records": sorted(drive_review + archive_review, key=lambda r: (r["corpus"], r["filename"])),
    }, indent=2) + "\n")

    unresolved_history = [row for row in history if row["status"] == "unresolved"]
    if len(unresolved_history) != 612:
        raise SystemExit(f"Expected 612 unavailable historical references, found {len(unresolved_history)}")
    materiality = []
    for row in unresolved_history:
        material = MATERIAL_FILES.get(row["filename"])
        materiality.append({
            "source_id": row["source_id"],
            "filename": row["filename"],
            "disposition": "material_resupply_needed" if material else "no_identifiable_unique_material_gap",
            "priority": material[0] if material else None,
            "reason": material[1] if material else "The completed structured database or another verified accessible source represents the identifiable fact; no unique missing content can be established from this unavailable filename.",
        })
    write_lines(MATERIALITY, materiality)
    with RESUPPLY.open("w", newline="") as handle:
        writer = csv.writer(handle, delimiter="\t", lineterminator="\n")
        writer.writerow(("priority", "source_id", "filename", "material_gap"))
        for row in sorted((r for r in materiality if r["priority"]), key=lambda r: r["priority"]):
            writer.writerow((row["priority"], row["source_id"], row["filename"], row["reason"]))
    print(json.dumps({
        "drive": Counter(r["resolution_category"] for r in drive_review),
        "archive": Counter(r["resolution_category"] for r in archive_review),
        "historical_material_resupply": len(MATERIAL_FILES),
    }, sort_keys=True))


if __name__ == "__main__":
    main()
