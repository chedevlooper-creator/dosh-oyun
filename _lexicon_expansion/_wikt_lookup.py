#!/usr/bin/env python3
"""
Fetch Wiktionary Chechen entry and extract English meaning.
"""
import sys
import urllib.parse
import urllib.request
import re
import json

def fetch_chechen_meaning(word):
    """Try to fetch the Chechen Wiktionary entry and return the English gloss."""
    word_url = "https://en.wiktionary.org/wiki/" + urllib.parse.quote(word)
    try:
        req = urllib.request.Request(word_url, headers={'User-Agent': 'Mozilla/5.0 (compatible; research/1.0)'})
        with urllib.request.urlopen(req, timeout=10) as r:
            html = r.read().decode('utf-8', errors='replace')
    except Exception as e:
        return {'found': False, 'error': f'fetch failed: {e}'}

    # Check that there's a Chechen section
    if 'id="Chechen"' not in html:
        return {'found': False, 'error': 'no Chechen section'}

    # Find Chechen section bounds
    chechen_start = html.find('id="Chechen"')
    # Find next language section
    next_lang = re.search(r'<h2 id="(?!Chechen)[A-Z][a-zA-Z]+"', html[chechen_start+15:])
    if next_lang:
        section_end = chechen_start + 15 + next_lang.start()
    else:
        section_end = len(html)
    section = html[chechen_start:section_end]

    # The Chechen definition appears in <ol><li>...english meaning...</li></ol>
    # We want the FIRST <ol> after the headword in this section
    # Find headword first
    headword_match = re.search(r'<p><span class="headword-line"', section)
    if not headword_match:
        # Try alternate headword pattern
        headword_match = re.search(r'class="Cyrl headword"', section)

    # The English meaning is in <a href="/wiki/...">word</a> inside <li>
    # Extract from li elements in ordered lists
    # Use a non-greedy approach: find first <ol> in section
    ol_match = re.search(r'<ol[^>]*>(.*?)</ol>', section, re.DOTALL)
    if ol_match:
        ol_content = ol_match.group(1)
        # Extract <a> links (these are English glosses) and surrounding text
        # First strip HTML tags to get text, but keep link text
        li_match = re.search(r'<li[^>]*>(.*?)</li>', ol_content, re.DOTALL)
        if li_match:
            li_text = li_match.group(1)
            # Get all <a> texts first (these are the linked English words)
            a_texts = re.findall(r'<a[^>]*title="([^"]+)"[^>]*>', li_text)
            # Remove HTML tags
            clean = re.sub(r'<[^>]+>', '', li_text)
            clean = re.sub(r'\s+', ' ', clean).strip()
            # Remove usage labels like "(religion)"
            clean = re.sub(r'\([a-z][a-z _-]*\)', '', clean).strip()
            return {
                'found': True,
                'en_gloss': clean,
                'en_links': a_texts,
                'url': word_url,
            }

    return {'found': True, 'en_gloss': '', 'en_links': [], 'url': word_url, 'error': 'no ol found'}

if __name__ == '__main__':
    word = sys.argv[1]
    result = fetch_chechen_meaning(word)
    print(json.dumps(result, ensure_ascii=False, indent=2))
