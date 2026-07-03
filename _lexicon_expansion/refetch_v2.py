#!/usr/bin/env python3
"""Refetch all Wiktionary words with proper rate limiting and retries."""
import json
import re
import urllib.request
import urllib.parse
import urllib.error
import time
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

CACHE_DIR = r"C:\Users\isaha\Yeni klasör (4)\dosh-oyun\_lexicon_expansion\wik_api_cache"
BATCH_PATH = r"C:\Users\isaha\Yeni klasör (4)\dosh-oyun\_lexicon_expansion\batch_3.json"

UA = "HermesBot/1.0 (research; dosh-game lexicon) python-urllib"

def fetch_wik_api(word, lang="en"):
    safe = urllib.parse.quote(word)
    base = "https://en.wiktionary.org" if lang == "en" else "https://ru.wiktionary.org"
    url = f"{base}/w/api.php?action=parse&format=json&page={safe}&prop=wikitext&redirects=1"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode("utf-8", errors="replace"))
    except urllib.error.HTTPError as e:
        return {"error": f"HTTP {e.code}", "retry": e.code in (429, 503, 502, 500)}
    except Exception as e:
        return {"error": str(e), "retry": False}

def main():
    data = json.load(open(BATCH_PATH, encoding="utf-8"))
    words = [d["word"] for d in data]
    print(f"Total: {len(words)}", file=sys.stderr)

    # Load all cached
    cached = {}
    for w in words:
        safe = w.replace("/", "_").replace("\\", "_")
        cp = os.path.join(CACHE_DIR, f"{safe}.json")
        if os.path.exists(cp):
            try:
                cached[w] = json.load(open(cp, encoding="utf-8"))
            except:
                pass

    # Identify what needs refetching
    needs = []
    for w in words:
        rec = cached.get(w)
        if not rec:
            needs.append(w)
        else:
            en = rec.get("en", {})
            if "error" in en:
                needs.append(w)
    print(f"Need to fetch/refetch: {len(needs)}", file=sys.stderr)

    # Sequential fetch with rate limit
    for i, w in enumerate(needs):
        safe = w.replace("/", "_").replace("\\", "_")
        cp = os.path.join(CACHE_DIR, f"{safe}.json")
        rec = cached.get(w, {"word": w})
        # Fetch EN
        en = None
        for attempt in range(5):
            en = fetch_wik_api(w, "en")
            if "error" not in en:
                break
            elif en.get("retry"):
                wait = 5 + attempt * 5
                print(f"  {w} en retry {attempt+1}, wait {wait}s", file=sys.stderr)
                time.sleep(wait)
            else:
                break
        rec["en"] = en if en is not None else {"error": "none"}
        time.sleep(0.4)  # 0.4s = 150/min
        # Fetch RU
        ru = None
        for attempt in range(5):
            ru = fetch_wik_api(w, "ru")
            if "error" not in ru:
                break
            elif ru.get("retry"):
                wait = 5 + attempt * 5
                time.sleep(wait)
            else:
                break
        rec["ru"] = ru if ru is not None else {"error": "none"}
        json.dump(rec, open(cp, "w", encoding="utf-8"), ensure_ascii=False)
        cached[w] = rec
        if (i+1) % 25 == 0:
            oks = sum(1 for w in needs[:i+1] if "error" not in cached[w].get("en", {}))
            print(f"  {i+1}/{len(needs)} done, {oks} en ok so far", file=sys.stderr)
        time.sleep(0.4)

    # Final stats
    oks_en = sum(1 for w in words if "error" not in cached.get(w, {}).get("en", {}))
    oks_ru = sum(1 for w in words if "error" not in cached.get(w, {}).get("ru", {}))
    print(f"Final: en ok={oks_en}/{len(words)}, ru ok={oks_ru}/{len(words)}", file=sys.stderr)

if __name__ == "__main__":
    main()
