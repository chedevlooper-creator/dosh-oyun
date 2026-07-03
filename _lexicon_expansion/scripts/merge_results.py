#!/usr/bin/env python3
"""
merge_results.py
Combines the 3 agent JSONs, validates against suspect list, dedupes by cross-agent agreement,
and produces _merged_additions.json (entries to add to INFO) and _unresolved.json (remaining).
"""
import json, os, re
from collections import defaultdict

DIR = r"C:\Users\isaha\Yeni klasör (4)\dosh-oyun\_lexicon_expansion"
RESULTS = os.path.join(DIR, "results")
OUT_MERGED = os.path.join(DIR, "_merged_additions.json")
OUT_UNRESOLVED = os.path.join(DIR, "_unresolved.json")
OUT_REVIEW = os.path.join(DIR, "_needs_review.json")

# Suspect list from KELIME_RAPORU.md
SUSPECTS = {"гос","оти","варе","пийсак","эчена","бахтар","эличи","харриб",
            "акхшо","назбар","авсал","пилмот","мужца","вотаца","лулео",
            "кхинд","баран","гийзаг"}

# Russian-loanwords that are valid in modern Chechen (from KELIME_RAPORU.md note: март, июнь, ноябрь are kept)
KNOWN_LOANWORDS = {"март","июнь","ноябрь","компьютер","интернет","телефон"}

# Words that look like Russian (heuristic: contains Russian-only letters or patterns that don't fit Chechen digraphs)
RUSSIAN_LOOKING = {
    # Common Russian-only words that have appeared before and were rejected
    "долг","удача","землю","плач","корова","забыть","зверь","умелый","истина","показ"
}

def load_agent(name):
    p = os.path.join(RESULTS, f"agent_{name}.json")
    if not os.path.exists(p): return None
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)

def main():
    agents = {}
    for n in ["A","B","C"]:
        a = load_agent(n)
        if a: agents[n] = a
    print(f"Loaded {len(agents)} agents")

    # Build word -> [(agent, entry)]
    word_entries = defaultdict(list)
    for n, a in agents.items():
        for w, e in a.get("resolved", {}).items():
            word_entries[w].append((n, e))
        for w in a.get("unresolved", []):
            word_entries.setdefault(w, [])

    additions = {}
    review = {}     # confidence-uncertain, suspect words, or single-source
    unresolved = []

    for w, entries in word_entries.items():
        # Sanity: skip if in Russian-looking known-bad list
        if w in RUSSIAN_LOOKING:
            continue

        # No resolved entries → unresolved
        resolved = [(n,e) for n,e in entries if e]
        if not resolved:
            unresolved.append(w)
            continue

        # Cross-agent agreement: count distinct (tr_meaning) values
        meanings = [e["tr_meaning"].strip().lower() for n,e in resolved]
        from collections import Counter
        cnt = Counter(meanings)
        top_meaning, top_count = cnt.most_common(1)[0]

        # Suspect word: require 2+ agents or 2+ sources
        is_suspect = w in SUSPECTS

        # Decide
        if is_suspect:
            if top_count < 2:
                review[w] = {
                    "reason": "suspect word, only single source",
                    "agents": [(n, e) for n,e in resolved],
                }
                continue
        # Quality check
        best = next(e for n,e in resolved if e["tr_meaning"].strip().lower() == top_meaning)
        # If "llm_only_unvalidated" only → needs manual review
        if all(e.get("validation_source") == "llm_only_unvalidated" or
               e.get("source_url","").endswith("llm") for n,e in resolved):
            review[w] = {
                "reason": "LLM-only, no web validation",
                "agents": [(n, e) for n,e in resolved],
            }
            continue

        additions[w] = {
            "tr_meaning": best["tr_meaning"],
            "ru_meaning": best.get("ru_meaning",""),
            "source_url": best.get("source_url",""),
            "source_excerpt": best.get("source_excerpt","")[:200],
            "confidence": best.get("confidence","medium"),
            "agreeing_agents": top_count,
            "is_russian_loanword": w in KNOWN_LOANWORDS or best.get("is_russian_loanword",False),
        }

    with open(OUT_MERGED, "w", encoding="utf-8") as f:
        json.dump(additions, f, ensure_ascii=False, indent=1)
    with open(OUT_REVIEW, "w", encoding="utf-8") as f:
        json.dump(review, f, ensure_ascii=False, indent=1)
    with open(OUT_UNRESOLVED, "w", encoding="utf-8") as f:
        json.dump(sorted(unresolved), f, ensure_ascii=False, indent=1)

    print(f"Additions: {len(additions)}")
    print(f"Needs review: {len(review)}")
    print(f"Unresolved: {len(unresolved)}")

if __name__ == "__main__":
    main()
