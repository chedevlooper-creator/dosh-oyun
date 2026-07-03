#!/usr/bin/env python3
"""
apply_to_index.py
Takes _merged_additions.json + _existing_info.json and patches the const INFO = {...} block
in index.html, adding only NEW entries (deduped against existing).

Usage: python apply_to_index.py [--backup] [--out index.new.html]
"""
import json, os, re, shutil, argparse, sys
from datetime import datetime

DIR = r"C:\Users\isaha\Yeni klasör (4)\dosh-oyun\_lexicon_expansion"
INDEX = r"C:\Users\isaha\Yeni klasör (4)\dosh-oyun\index.html"
EXISTING = os.path.join(DIR, "_existing_info.json")
ADDITIONS = os.path.join(DIR, "_merged_additions.json")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--backup", action="store_true")
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    with open(EXISTING, "r", encoding="utf-8") as f:
        existing = json.load(f)
    with open(ADDITIONS, "r", encoding="utf-8") as f:
        new = json.load(f)

    # Only add words not already in existing
    to_add = {w: e for w, e in new.items() if w not in existing}
    print(f"Existing: {len(existing)}, New: {len(new)}, To add: {len(to_add)}")
    if not to_add:
        print("Nothing to add.")
        return

    if args.backup:
        ts = datetime.now().strftime("%Y%m%d-%H%M%S")
        shutil.copy(INDEX, INDEX + f".bak-info-{ts}")
        print(f"Backed up to {INDEX}.bak-info-{ts}")

    with open(INDEX, "r", encoding="utf-8") as f:
        text = f.read()

    # Find const INFO = { ... };
    m = re.search(r"const INFO = \{(.*?)\};\n", text, re.DOTALL)
    if not m:
        print("Could not find const INFO block")
        sys.exit(1)
    block = m.group(0)
    body = m.group(1)

    # Build new entries
    new_entries = []
    for w, e in to_add.items():
        tr = e["tr_meaning"].replace("\\","\\\\").replace('"','\\"')
        new_entries.append(f'"{w}":"{tr}"')

    # Insert before the closing brace, comma-separated
    insertion = ",".join(new_entries)
    if body.strip():
        if not body.rstrip().endswith(","):
            new_body = body.rstrip() + "," + insertion
        else:
            new_body = body.rstrip() + insertion
    else:
        new_body = insertion
    new_block = "const INFO = {" + new_body + "};\n"

    new_text = text[:m.start()] + new_block + text[m.end():]

    out = args.out or INDEX
    with open(out, "w", encoding="utf-8") as f:
        f.write(new_text)
    print(f"Patched {len(to_add)} entries → {out}")
    print(f"Sample: {list(to_add.items())[:3]}")

if __name__ == "__main__":
    main()
