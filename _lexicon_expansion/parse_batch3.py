#!/usr/bin/env python3
"""Parse cached Wiktionary responses for Chechen meanings."""
import json
import re
import os
import sys

CACHE_DIR = r"C:\Users\isaha\Yeni klasör (4)\dosh-oyun\_lexicon_expansion\wik_api_cache"
BATCH_PATH = r"C:\Users\isaha\Yeni klasör (4)\dosh-oyun\_lexicon_expansion\batch_3.json"

def parse_ce_section(wikitext):
    """Parse the Chechen section. Return list of (pos, [definitions])."""
    if not wikitext: return []
    # Find the Chechen section. May appear multiple times for different word senses.
    # Be careful: cut at next language header.
    # First find the start of the Chechen section
    start = re.search(r"==\s*Chechen\s*==", wikitext)
    if not start: return []
    # Then find end: next ==Language== header (==Word== ok too)
    after = wikitext[start.end():]
    # find next ==X== where X is a language name (top-level: ==Foo==, NOT ==Pronunciation== which is ===Foo===)
    # Cut at exactly 2 leading equals, then language name, then 2 equals, where X is at start of line
    end_match = re.search(r"^==\s*[A-Z][A-Za-z\-\(\) ]+\s*==\s*$", after, re.MULTILINE)
    section = after[:end_match.start()] if end_match else after
    # Find the POS subsection(s) - ===Noun===, ===Verb===, etc (3 equals)
    pos_pattern = re.compile(r"^===\s*([A-Z][a-z]+)\s*===\s*$", re.MULTILINE)
    pos_matches = list(pos_pattern.finditer(section))
    if not pos_matches:
        # no POS subsection; try ===...=== too
        return [("?", _extract_defs(section, "?"))]
    results = []
    for i, pm in enumerate(pos_matches):
        pos = pm.group(1)
        # Extract until next POS subsection
        end = pos_matches[i+1].start() if i+1 < len(pos_matches) else len(section)
        pos_section = section[pm.end():end]
        defs = _extract_defs(pos_section, pos)
        if defs:
            results.append((pos, defs))
    return results

def _extract_defs(text, pos):
    defs = []
    for line in text.split("\n"):
        ls = line.strip()
        if not ls.startswith("#"): continue
        if ls.startswith("#:"): continue  # example continuation
        content = ls.lstrip("#").strip()
        if not content: continue
        # Skip templates that are trans-top etc
        if content.startswith("{{") and ("trans-top" in content or "trans-bottom" in content or "ux" in content.split("|")[0]):
            continue
        if content.startswith("===="): continue
        # Strip ALL templates
        content = re.sub(r"\{\{[^{}]*\}\}", "", content)
        # Then iterate for nested templates
        prev = None
        while prev != content:
            prev = content
            content = re.sub(r"\{\{[^{}]*\}\}", "", content)
        content = re.sub(r"\[\[([^\]|]+\|)?([^\]]+)\]\]", r"\2", content)
        content = re.sub(r"'''([^']+)'''", r"\1", content)
        content = re.sub(r"''([^']+)''", r"\1", content)
        content = content.strip()
        if not content: continue
        if len(content) < 2: continue
        defs.append(content)
    return defs

def main():
    data = json.load(open(BATCH_PATH, encoding="utf-8"))
    words = [d["word"] for d in data]

    out = []
    for w in words:
        safe = w.replace("/", "_").replace("\\", "_")
        cache_path = os.path.join(CACHE_DIR, f"{safe}.json")
        if not os.path.exists(cache_path):
            out.append({"word": w, "en_wikt": None, "ru_wikt": None, "meanings": []})
            continue
        rec = json.load(open(cache_path, encoding="utf-8"))
        en = rec.get("en", {})
        ru = rec.get("ru", {})
        en_wt = en.get("parse", {}).get("wikitext", {}).get("*", "") if "parse" in en else ""
        ru_wt = ru.get("parse", {}).get("wikitext", {}).get("*", "") if "parse" in ru else ""
        en_meanings = parse_ce_section(en_wt)
        ru_meanings = parse_ce_section(ru_wt)  # may have different structure
        out.append({
            "word": w,
            "en_has_ce_section": "==Chechen==" in en_wt,
            "ru_has_ce_section": "==Чеченский" in ru_wt or "Чеченско" in ru_wt,
            "en_meanings": en_meanings,
            "ru_meanings": ru_meanings,
            "en_len": len(en_wt),
            "ru_len": len(ru_wt),
        })
    # Summary
    with_section = [o for o in out if o.get("en_has_ce_section") or o.get("ru_has_ce_section")]
    with_meanings = [o for o in out if o.get("en_meanings") or o.get("ru_meanings")]
    print(f"Total: {len(out)}")
    print(f"Has Chechen section (en or ru): {len(with_section)}")
    print(f"Has parsed meanings: {len(with_meanings)}")
    print()
    for o in out:
        ems = o.get("en_meanings", [])
        rms = o.get("ru_meanings", [])
        if ems or rms:
            print(f"  {o['word']}:")
            for pos, defs in ems:
                print(f"    EN [{pos}]: {defs[:3]}")
            for pos, defs in rms:
                print(f"    RU [{pos}]: {defs[:3]}")

if __name__ == "__main__":
    main()
