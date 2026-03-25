#!/usr/bin/env python3
"""
restructure_json.py
===================
Converts all problem JSON files from flat explanation strings
to clean structured objects. Run from your frontend/src directory:

    python3 restructure_json.py

- Processes ALL .json files in assets/**
- Parses each ladder's `explanation` string into structured fields
- Writes back to the same files (overwrites in-place)
- Creates a backup folder `assets_backup/` first

Structured output per ladder:
  explanation: {
    prose: "...",
    connectsTo: { level: "L1", reason: "..." } | null,
    timeComplexity: { value: "O(n²)", note: "..." } | null,
    spaceComplexity: { value: "O(1)", note: "..." } | null,
    commonMistakes: ["...", "..."],
    codePattern: "..." | null,
    algorithm: ["step 1", "step 2", ...],
    summary: { time: { value, note }, space: { value, note } } | null
  }
"""

import json
import glob
import os
import re
import shutil
import sys


def parse_explanation(text):
    """Parse a raw explanation string into structured sections."""
    if not text or not isinstance(text, str):
        return text  # Already structured or empty, skip

    result = {
        "prose": "",
        "connectsTo": None,
        "timeComplexity": None,
        "spaceComplexity": None,
        "commonMistakes": [],
        "codePattern": None,
        "algorithm": [],
        "summary": None,
    }

    # ── Split on double newlines to separate main prose from algo/summary ──
    blocks = text.split("\n\n")
    main_prose = blocks[0] if blocks else ""
    algo_block = ""
    summary_block = ""

    for i in range(1, len(blocks)):
        b = blocks[i].strip()
        if re.match(r"^(?:Step-by-step algorithm|Algorithm|Steps)\s*:", b, re.I):
            algo_block = b
        elif re.match(r"^(?:Time|Space)\s*(?:complexity)?\s*:", b):
            summary_block += ("\n" if summary_block else "") + b
        elif re.match(r"^(?:Key concepts|Basic (?:array )?concepts)\s*:", b, re.I):
            # Treat concept lists as algorithm-style blocks
            if not algo_block:
                algo_block = b
        elif re.match(r"^(?:Example|Note)\s*:", b, re.I):
            # Skip example blocks that may appear at end
            pass
        elif re.match(r"^Common mistakes\s*:", b, re.I):
            # Some files have mistakes as a separate block
            main_prose += "\n\n" + b
        elif re.match(r"^(?:Connection to|This connects)\s", b, re.I):
            # Connection info as separate block  
            main_prose += "\n\n" + b
        elif re.match(r"^Real code pattern\s*:", b, re.I):
            main_prose += "\n\n" + b
        else:
            main_prose += "\n\n" + b

    # ── Extract "connects to Lx" — multiple formats ──
    # Format 1: "This approach connects to L1 by..."
    # Format 2: "Connection to L1: This full solution..."
    # Format 3: "Connection to higher level: ..."
    # Format 4: "This sub-routine connects to L0 by..."
    conn_match = re.search(
        r"This\s+(?:\w+\s+)?connects?\s+to\s+(L\d)\s*([^.]*)\.", main_prose, re.I
    )
    if not conn_match:
        conn_match = re.search(
            r"Connection to\s+(L\d)\s*:\s*([^.]*)\.", main_prose, re.I
        )
    if not conn_match:
        # "Connection to higher level: ...", "Connection to level above: ..."
        conn_match = re.search(
            r"Connection to\s+(?:higher level|level above|the level above)\s*:\s*([^.]*)\.",
            main_prose, re.I
        )
        if conn_match:
            result["connectsTo"] = {
                "level": None,
                "reason": conn_match.group(1).strip() or None,
            }
            main_prose = main_prose.replace(conn_match.group(0), "")
            conn_match = None  # Already handled
    if conn_match:
        result["connectsTo"] = {
            "level": conn_match.group(1),
            "reason": conn_match.group(2).strip() or None,
        }
        main_prose = main_prose.replace(conn_match.group(0), "")

    # ── Extract inline Time complexity — multiple formats ──
    # "Time complexity is O(n²) because..."
    # "Time complexity: O(n) - Each element..."
    # "Time complexity of O(n) for..."
    # "time is O(n) for..."
    time_match = re.search(
        r"Time complexity\s*(?:is|of|:)\s*(O\([^)]+\))\s*[-–—]?\s*([^.]*)\.", main_prose, re.I
    )
    if not time_match:
        time_match = re.search(
            r"time is\s*(O\([^)]+\))\s*[-–—]?\s*([^.]*)\.", main_prose, re.I
        )
    if not time_match:
        # "with O(n) time complexity because..."  / "O(n) time complexity"
        time_match = re.search(
            r"(?:with|is|has|gives?|giving)\s+(O\([^)]+\))\s+time(?:\s+complexity)?([^.]*)\.", main_prose, re.I
        )
    if time_match:
        result["timeComplexity"] = {
            "value": time_match.group(1),
            "note": time_match.group(2).strip().lstrip("- ") or None,
        }
        main_prose = main_prose.replace(time_match.group(0), "")

    # ── Extract inline Space complexity — multiple formats ──
    space_match = re.search(
        r"Space complexity\s*(?:is|of|:)\s*(O\([^)]+\))\s*[-–—]?\s*([^.]*)\.", main_prose, re.I
    )
    if not space_match:
        space_match = re.search(
            r"space is\s*(O\([^)]+\))\s*[-–—]?\s*([^.]*)\.", main_prose, re.I
        )
    if not space_match:
        # "O(1) space complexity" / "O(log n) space"  / "and O(1) space"
        space_match = re.search(
            r"(?:with|is|has|gives?|giving|and)\s+(O\([^)]+\))\s+space(?:\s+complexity)?([^.]*)\.", main_prose, re.I
        )
    if space_match:
        result["spaceComplexity"] = {
            "value": space_match.group(1),
            "note": space_match.group(2).strip().lstrip("- ") or None,
        }
        main_prose = main_prose.replace(space_match.group(0), "")

    # ── Extract common mistakes ──
    # Pattern 1: "Common mistakes include: 1) ..., 2) ..., 3) ..."
    # Pattern 2: "Common mistakes include: not doing X, doing Y wrong, ..."  
    # Pattern 3: "Common mistakes:\n1. ...\n2. ..."
    # Pattern 4: "Common mistakes:\n1) ...\n2) ..."
    mist_match = re.search(
        r"Common mistakes\s*(?:include|are)?:?\s*(.*?)(?=\.\s*(?:The )?(?:real )?code pattern|The (?:real )?code|Real code pattern|\.\s*$|$)",
        main_prose,
        re.I | re.S,
    )
    if mist_match:
        raw = mist_match.group(1).strip().rstrip(".")

        # Try newline-separated numbered: "1. ..." or "1) ..."
        newline_items = re.split(r"\n\s*\d+[).]\s*", raw)
        if len(newline_items) > 1:
            # First item might have a prefix before the number
            first = re.sub(r"^\d+[).]\s*", "", newline_items[0]).strip()
            items = [first] + [s.strip().rstrip(".") for s in newline_items[1:]]
            result["commonMistakes"] = [s for s in items if s and len(s) > 3]
        else:
            # Try inline numbered: 1) ..., 2) ... or 1. ... 2. ...
            numbered = re.split(r"\d+[).]\s*", raw)
            numbered = [s.strip().rstrip(",").rstrip(".").strip() for s in numbered if s.strip()]

            if len(numbered) > 1:
                result["commonMistakes"] = numbered
            else:
                # Comma/and separated prose
                parts = re.split(r",\s*(?:and\s+)?|\s+and\s+", raw)
                result["commonMistakes"] = [
                    s.strip().rstrip(",").rstrip(".").strip()
                    for s in parts
                    if s.strip() and len(s.strip()) > 3
                ]

        main_prose = main_prose.replace(mist_match.group(0), "")

    # ── Extract code pattern ──
    # Variations:
    #   "The real code pattern involves nested loops..."  (prose)
    #   "Real code pattern: def find_max(arr):\n    ..."  (actual code)
    #   "Real code pattern:\ndef find_max..."             (code on next line)
    code_match = re.search(
        r"(?:The\s+)?(?:real\s+)?code pattern\s*(?:is|involves|:)\s*(.*?)$",
        main_prose,
        re.I | re.S,
    )
    if code_match:
        code_text = code_match.group(1).strip().rstrip(".")
        # If it contains actual code (def, function, for, if), keep full multiline
        if re.search(r"^(?:def |function |class |for |if |while |#|//)", code_text, re.M):
            result["codePattern"] = code_text or None
        else:
            # Just a prose description, take first sentence
            first_sentence = re.match(r"([^.]+)", code_text)
            result["codePattern"] = (first_sentence.group(1).strip() if first_sentence else code_text) or None
        main_prose = main_prose.replace(code_match.group(0), "")

    # ── Clean up prose ──
    # Remove orphaned periods, double spaces, leading/trailing whitespace
    main_prose = re.sub(r"\.\s*\.", ".", main_prose)
    main_prose = re.sub(r"\s{2,}", " ", main_prose)
    main_prose = main_prose.strip().rstrip(".")
    if main_prose:
        main_prose += "."
    result["prose"] = main_prose if main_prose and main_prose != "." else None

    # ── Parse algorithm block ──
    if algo_block:
        lines = algo_block.split("\n")
        # Skip the header line ("Step-by-step algorithm:" etc)
        algo_lines = [l for l in lines[1:] if l.strip()]
        if algo_lines:
            result["algorithm"] = algo_lines

    # ── Parse summary block ──
    if summary_block:
        summary = {}
        # "Time: O(n²) - Quadratic" or "Time complexity: O(n) - Linear"
        t_match = re.search(
            r"Time(?:\s+complexity)?\s*:\s*(O\([^)]+\))\s*[-–—]\s*(.*)", summary_block, re.I
        )
        s_match = re.search(
            r"Space(?:\s+complexity)?\s*:\s*(O\([^)]+\))\s*[-–—]\s*(.*)", summary_block, re.I
        )
        if t_match:
            summary["time"] = {
                "value": t_match.group(1),
                "note": t_match.group(2).strip().rstrip("."),
            }
        if s_match:
            summary["space"] = {
                "value": s_match.group(1),
                "note": s_match.group(2).strip().rstrip("."),
            }
        if summary:
            result["summary"] = summary

    # ── Clean nulls for compactness ──
    if not result["algorithm"]:
        result["algorithm"] = None
    if not result["commonMistakes"]:
        result["commonMistakes"] = None

    return result


def process_file(filepath):
    """Process a single JSON file, restructuring all ladder explanations."""
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    modified = False

    for approach in data.get("approaches", []):
        for ladder in approach.get("ladders", []):
            exp = ladder.get("explanation")

            # Skip if already structured (dict) or empty
            if not exp or not isinstance(exp, str):
                continue

            # Parse and replace
            structured = parse_explanation(exp)
            ladder["explanation"] = structured
            modified = True

    if modified:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    return modified


def main():
    # Find the assets directory
    if os.path.isdir("assets"):
        base = "."
    elif os.path.isdir("src/assets"):
        base = "src"
    else:
        print("ERROR: Cannot find assets/ directory.")
        print("Run this script from your frontend/ or frontend/src/ directory.")
        sys.exit(1)

    assets_dir = os.path.join(base, "assets")
    backup_dir = os.path.join(base, "assets_backup")

    # Find all JSON files
    pattern = os.path.join(assets_dir, "**", "*.json")
    files = sorted(glob.glob(pattern, recursive=True))
    # Filter out __MACOSX junk
    files = [f for f in files if "__MACOSX" not in f and ".DS_Store" not in f]

    if not files:
        print(f"No JSON files found in {assets_dir}/")
        sys.exit(1)

    print(f"Found {len(files)} JSON files in {assets_dir}/")
    print()

    # Create backup
    if not os.path.exists(backup_dir):
        print(f"Creating backup at {backup_dir}/ ...")
        shutil.copytree(assets_dir, backup_dir)
        print("Backup created.")
    else:
        print(f"Backup already exists at {backup_dir}/, skipping backup.")
    print()

    # Process each file
    processed = 0
    skipped = 0
    errors = 0
    total_ladders = 0

    for filepath in files:
        try:
            # Quick check: does this file have string explanations?
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)

            has_string_exp = False
            for a in data.get("approaches", []):
                for lad in a.get("ladders", []):
                    total_ladders += 1
                    if isinstance(lad.get("explanation"), str):
                        has_string_exp = True

            if not has_string_exp:
                skipped += 1
                continue

            if process_file(filepath):
                processed += 1
                rel = os.path.relpath(filepath, base)
                print(f"  ✓ {rel}")
            else:
                skipped += 1

        except Exception as e:
            errors += 1
            print(f"  ✗ ERROR {filepath}: {e}")

    print()
    print("=" * 50)
    print(f"  Files processed:  {processed}")
    print(f"  Files skipped:    {skipped}")
    print(f"  Errors:           {errors}")
    print(f"  Total ladders:    {total_ladders}")
    print("=" * 50)
    print()

    if processed > 0:
        print("Done! Your JSON files are now structured.")
        print(f"Original files backed up to {backup_dir}/")
        print()
        print("Each ladder.explanation is now an object with:")
        print("  prose, connectsTo, timeComplexity, spaceComplexity,")
        print("  commonMistakes, codePattern, algorithm, summary")
    else:
        print("No files needed processing (already structured or no explanations found).")


if __name__ == "__main__":
    main()
