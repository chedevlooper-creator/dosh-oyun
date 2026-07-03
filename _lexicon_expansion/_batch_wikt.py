#!/usr/bin/env python3
"""
Batch process: fetch Wiktionary Chechen meaning for all words in batch_1.json
Output: a JSON dict {word: {found, en_gloss, en_links, url} }
"""
import json
import time
import sys
sys.path.insert(0, '.')
from _wikt_lookup import fetch_chechen_meaning

with open('batch_1.json','r',encoding='utf-8') as f:
    data = json.load(f)

words = [d['word'] for d in data]
results = {}
start = time.time()
for i, w in enumerate(words, 1):
    r = fetch_chechen_meaning(w)
    results[w] = r
    elapsed = time.time() - start
    avg = elapsed / i
    eta = avg * (len(words) - i)
    print(f"[{i:3d}/{len(words)}] {w:12s} | {r.get('en_gloss','')[:60]:60s} | ETA {eta:.0f}s", flush=True)

with open('_wikt_raw.json','w',encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=1)

# Stats
found = sum(1 for r in results.values() if r.get('found') and r.get('en_gloss'))
print(f"\nTotal: {len(words)}, found meaning: {found}")
print(f"Total time: {time.time()-start:.1f}s")
