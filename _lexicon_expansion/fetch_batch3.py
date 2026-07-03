#!/usr/bin/env python3
"""Fetch Wiktionary API data for batch_3 words and parse meanings."""
import json
import re
import urllib.request
import urllib.parse
import urllib.error
import time
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

BATCH_PATH = r"C:\Users\isaha\Yeni klasör (4)\dosh-oyun\_lexicon_expansion\batch_3.json"
CACHE_DIR = r"C:\Users\isaha\Yeni klasör (4)\dosh-oyun\_lexicon_expansion\wik_api_cache"
os.makedirs(CACHE_DIR, exist_ok=True)

# Load words
with open(BATCH_PATH, encoding="utf-8") as f:
    data = json.load(f)
WORDS = [d["word"] for d in data]
print(f"Total words: {len(WORDS)}", file=sys.stderr)

UA = "HermesBot/1.0 (research; dosh-game lexicon expansion)"

def fetch_wik_api(word, lang="ce"):
    """Fetch Wiktionary API JSON for given word in given language."""
    safe = urllib.parse.quote(word)
    url = f"https://en.wiktionary.org/w/api.php?action=parse&format=json&page={safe}&prop=wikitext&redirects=1"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read().decode("utf-8", errors="replace"))
    except Exception as e:
        return {"error": str(e)}

def fetch_ru_wik_api(word):
    """Fetch Russian Wiktionary API JSON."""
    safe = urllib.parse.quote(word)
    url = f"https://ru.wiktionary.org/w/api.php?action=parse&format=json&page={safe}&prop=wikitext&redirects=1"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read().decode("utf-8", errors="replace"))
    except Exception as e:
        return {"error": str(e)}

def parse_ce_meaning(wikitext):
    """Parse the 'Chechen' section of en.wiktionary to extract meanings.
    Returns list of (definition, translation) tuples."""
    if not wikitext:
        return []
    # Find the ===Chechen=== section
    # Section header pattern: ==Chechen==
    # We look for the first ====Noun==== / ===Verb=== subsection
    results = []
    # Find Chechen section
    m = re.search(r"==\s*Chechen\s*==(.*?)(?====\s*[A-Z][a-z]+\s*==|\Z)", wikitext, re.DOTALL)
    if not m:
        return []
    section = m.group(1)
    # Find all # definitions
    # Pattern: # {{ux|...}} [[trans]]  or  # definition  (with translations in any form)
    # Chechen Wiktionary entries use templates: {{cux-xxx}} or just plain text
    # Often the structure is:  #  '''word'''  /translit/.  ''translation''.
    # The simplest reliable pattern: find lines starting with # until a blank or subsection
    pos_match = re.search(r"^====\s*(Noun|Verb|Adjective|Adverb|Pronoun|Particle|Conjunction|Interjection|Interjection|Determiner|Number|Postposition|Preposition|Particle|Article|Abbreviation|Suffix|Prefix|Infix)\s*====", section, re.MULTILINE)
    pos = pos_match.group(1) if pos_match else "?"
    # Extract definition lines: ones starting with '#' but not '##'
    defs = []
    for line in section.split("\n"):
        line_strip = line.strip()
        if not line_strip.startswith("#"):
            continue
        if line_strip.startswith("#:"):
            continue
        # Strip the # prefix
        content = line_strip.lstrip("#").strip()
        if not content or content.startswith("{{") and "trans-top" in content:
            continue
        if content.startswith("{{"):
            # Template, e.g. {{ux|...}}
            continue
        # Remove templates inline
        content_clean = re.sub(r"\{\{[^}]*\}\}", "", content)
        content_clean = re.sub(r"\[\[([^\]|]+\|)?([^\]]+)\]\]", r"\2", content_clean)
        content_clean = re.sub(r"'''([^']+)'''", r"\1", content_clean)
        content_clean = re.sub(r"''([^']+)''", r"\1", content_clean)
        content_clean = content_clean.strip()
        if content_clean and len(content_clean) > 2:
            defs.append(content_clean)
    return [(d, pos) for d in defs[:5]]

def main():
    cache_results = {}
    for w in WORDS:
        safe = w.replace("/", "_").replace("\\", "_")
        cache_path = os.path.join(CACHE_DIR, f"{safe}.json")
        if os.path.exists(cache_path):
            with open(cache_path, encoding="utf-8") as f:
                cache_results[w] = json.load(f)
    print(f"Already cached: {len(cache_results)}", file=sys.stderr)

    to_fetch = [w for w in WORDS if w not in cache_results]
    print(f"To fetch: {len(to_fetch)}", file=sys.stderr)

    # Fetch in parallel
    def fetch_one(word):
        return word, fetch_wik_api(word), fetch_ru_wik_api(word)

    with ThreadPoolExecutor(max_workers=8) as ex:
        futures = {ex.submit(fetch_one, w): w for w in to_fetch}
        for i, fut in enumerate(as_completed(futures)):
            word, en, ru = fut.result()
            safe = word.replace("/", "_").replace("\\", "_")
            cache_path = os.path.join(CACHE_DIR, f"{safe}.json")
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump({"word": word, "en": en, "ru": ru}, f, ensure_ascii=False)
            cache_results[word] = {"word": word, "en": en, "ru": ru}
            if (i + 1) % 20 == 0:
                print(f"  fetched {i+1}/{len(to_fetch)}", file=sys.stderr)
            time.sleep(0.05)

    print(f"Total cached: {len(cache_results)}", file=sys.stderr)

    # Now parse and report
    found = []
    not_found = []
    for w in WORDS:
        rec = cache_results.get(w, {})
        en = rec.get("en", {})
        en_wt = en.get("parse", {}).get("wikitext", {}).get("*", "") if "parse" in en else ""
        meanings = parse_ce_meaning(en_wt)
        if meanings:
            found.append((w, meanings))
        else:
            not_found.append(w)
    print(f"\nWith Chechen section + meanings: {len(found)}")
    print(f"Without: {len(not_found)}")
    print("\n=== FOUND ===")
    for w, m in found:
        print(f"  {w}: {m}")
    print("\n=== NOT FOUND ===")
    print("  " + " ".join(not_found))

if __name__ == "__main__":
    main()
