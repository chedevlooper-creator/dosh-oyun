#!/usr/bin/env python3
"""
Download ALL Chechen lemmas from Wiktionary category, paginated.
"""
import urllib.parse
import urllib.request
import re
import json
import time

BASE = "https://en.wiktionary.org"

def get_lemma_links(html):
    # Look for category page links: <li><a href="/wiki/WORD" title="WORD">WORD</a></li>
    lemmas = set()
    for m in re.finditer(r'<li><a href="(/wiki/(?:%[0-9A-Fa-f]{2}){2,}[^"]*)" title="([^"]+)">([^<]+)</a></li>', html):
        url_path, title, text = m.group(1), m.group(2), m.group(3).strip()
        if text:
            lemmas.add((text, url_path))
    return lemmas

def fetch(url, retries=3):
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'})
            with urllib.request.urlopen(req, timeout=15) as r:
                return r.read().decode('utf-8', errors='replace')
        except Exception as e:
            print(f"  attempt {i+1} failed: {e}")
            if i < retries-1:
                time.sleep(3)
    return None

# Start with main category page and follow pagination
all_lemmas = {}
url = BASE + "/wiki/Category:Chechen_lemmas"
seen = 0
while url:
    print(f"Fetching {url[:80]}...", flush=True)
    html = fetch(url)
    if not html:
        print("Fetch failed, breaking")
        break
    lemmas = get_lemma_links(html)
    print(f"  found {len(lemmas)} lemmas")
    for text, path in lemmas:
        all_lemmas[text] = BASE + path

    # Find next page link
    # Pattern: <a href="/w/index.php?title=Category:Chechen_lemmas&pagefrom=...">next page</a>
    next_match = re.search(r'<a href="(/w/index\.php\?title=Category%3AChechen_lemmas&amp;[^"]+pagefrom=[^"]+)"[^>]*>next page</a>', html)
    if next_match:
        url = BASE + next_match.group(1).replace('&amp;', '&')
        seen += 1
        if seen > 100:
            print("Too many pages, stopping")
            break
    else:
        url = None
    time.sleep(1.0)

# Also fetch the subcategories: nouns, verbs, etc
subcats = [
    'Chechen_nouns', 'Chechen_verbs', 'Chechen_adjectives', 'Chechen_adverbs',
    'Chechen_numerals', 'Chechen_pronouns', 'Chechen_interjections',
    'Chechen_particles', 'Chechen_conjunctions', 'Chechen_postpositions',
    'Chechen_proper_nouns', 'Chechen_multiword_terms'
]
for subcat in subcats:
    url = f"{BASE}/wiki/Category:{subcat}"
    while url:
        print(f"Fetching {url[:80]}...", flush=True)
        html = fetch(url)
        if not html:
            break
        lemmas = get_lemma_links(html)
        print(f"  found {len(lemmas)} lemmas")
        for text, path in lemmas:
            if text not in all_lemmas:
                all_lemmas[text] = BASE + path
        next_match = re.search(r'<a href="(/w/index\.php\?title=Category%3A' + urllib.parse.quote(subcat) + r'&amp;[^"]+pagefrom=[^"]+)"[^>]*>next page</a>', html)
        if next_match:
            url = BASE + next_match.group(1).replace('&amp;', '&')
        else:
            url = None
        time.sleep(1.0)

print(f"\nTotal unique lemmas: {len(all_lemmas)}")
with open('_ch_lemmas.json', 'w', encoding='utf-8') as f:
    json.dump(all_lemmas, f, ensure_ascii=False, indent=1)
print("Saved to _ch_lemmas.json")
