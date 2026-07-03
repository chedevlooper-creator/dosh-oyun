#!/usr/bin/env python3
"""Re-fetch failed (429) words from Wiktionary with retries, then parse."""
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

UA = "HermesBot/1.0 (research; dosh-game; contact: research@dosh.local)"

def fetch_wik_api(word, lang="en"):
    safe = urllib.parse.quote(word)
    base = "https://en.wiktionary.org" if lang == "en" else "https://ru.wiktionary.org"
    url = f"{base}/w/api.php?action=parse&format=json&page={safe}&prop=wikitext&redirects=1"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode("utf-8", errors="replace"))
    except urllib.error.HTTPError as e:
        return {"error": f"HTTP {e.code}", "retry": True}
    except Exception as e:
        return {"error": str(e), "retry": False}

def get_cached_words():
    cached = {}
    for f in os.listdir(CACHE_DIR):
        if f.endswith(".json"):
            try:
                d = json.load(open(os.path.join(CACHE_DIR, f), encoding="utf-8"))
                cached[d["word"]] = d
            except:
                pass
    return cached

def needs_refetch(rec):
    if not rec: return True
    en = rec.get("en", {})
    if "error" in en and en.get("retry"): return True
    return False

def main():
    cached = get_cached_words()
    to_refetch = [w for w, r in cached.items() if needs_refetch(r)]
    print(f"Total cached: {len(cached)}, to refetch: {len(to_refetch)}", file=sys.stderr)

    # Sequential, with delay, retry on 429
    for i, w in enumerate(to_refetch):
        safe = w.replace("/", "_").replace("\\", "_")
        cache_path = os.path.join(CACHE_DIR, f"{safe}.json")
        for attempt in range(4):
            en = fetch_wik_api(w, "en")
            if "error" not in en:
                ru = fetch_wik_api(w, "ru")
                rec = {"word": w, "en": en, "ru": ru}
                json.dump(rec, open(cache_path, "w", encoding="utf-8"), ensure_ascii=False)
                break
            elif en.get("retry"):
                time.sleep(3 + attempt * 3)
            else:
                # Permanent error, keep what we have
                rec = cached.get(w, {"word": w})
                rec["en_error"] = en.get("error", "")
                json.dump(rec, open(cache_path, "w", encoding="utf-8"), ensure_ascii=False)
                break
        if (i + 1) % 20 == 0:
            print(f"  refetched {i+1}/{len(to_refetch)}", file=sys.stderr)
        time.sleep(0.8)  # 0.8s between words = 75/min, well under limit

    print("Refetch done.", file=sys.stderr)

if __name__ == "__main__":
    main()
