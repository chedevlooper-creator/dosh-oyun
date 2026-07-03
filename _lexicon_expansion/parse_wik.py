#!/usr/bin/env python
"""Parse Wiktionary HTML and extract Chechen section definitions - v3."""
import json
import re
import os
import html

WORDS = "авсал адамаш акхар ала амал ара арз асар ах ахча ачо аьлана бага бакъ балоз баран бархӀ бат бац башха баӀ бел бера бешахо бо болат бос бохча буй бухь буш бӀе вайн варе веш виц вон воьда гай ган гата герз го гу гулдар гӀа гӀайре гӀапа гӀата гӀирс гӀу гӀумки даар даим дакх дамаца дарц даьхни дегӀ ден деши дила до дой дохк дохкуш доӀа духа етт жа жим зов зовца зуда зӀок ийза ип исс ишкол йез йова йохка йу ка кана кач кеп кивр кир ков коч кулга кхакх кхел кхес кхиа кхинда кхор кхоь къам къонза кӀал кӀирна кӏомал лаг лай лама ларгар лахе лекъ лестам ло лу лулахо луьста май мар март мах мача меза меца мо мор мохь мукх наб накхар наьрс нийсо ниха нохчо нур ов орам оьмар пеш пилмот пха пхи рагӀ сан севгӀ сиха соьлжа стигал сула сурхо тал тарсал тоба топца тур тхир тӀай тӀемло тӀу унхо урс уьра хаа хазам харжам хас херо хийцар хин хиш хоз ху хьакха хьан хьаш хье хьеха хьо хьун хӀоа ца цаьрга цициг цу цӀен чагӀар чапха чо чог чохь чухта чӀаж чӀурам шар шахь шелиг шеран шина шиъ шод шу эв эс эца эчена юхана юьхьан ян яьсса Ӏай Ӏаь Ӏу".split()

OUT_DIR = r"C:\Users\isaha\Yeni klasör (4)\dosh-oyun\_lexicon_expansion\raw_wik"

def strip_tags(s):
    s = re.sub(r"<style[\s\S]*?</style>", " ", s)
    s = re.sub(r"<script[\s\S]*?</script>", " ", s)
    s = re.sub(r"<[^>]+>", " ", s)
    s = re.sub(r"&nbsp;", " ", s)
    s = re.sub(r"&amp;", "&", s)
    s = re.sub(r"\s+", " ", s).strip()
    return html.unescape(s)

def find_chechen_section_en(s):
    """Find <h2 id=Chechen> ... up to next h2/h1."""
    m = re.search(r'<h2[^>]*id=["\']Chechen["\']', s, re.IGNORECASE)
    if not m:
        return None
    start = m.end()
    # Find next h1 or h2
    end = len(s)
    for nm in re.finditer(r'<h[12][^>]*>', s[start:], re.IGNORECASE):
        end = start + nm.start()
        break
    return strip_tags(s[start:end])[:3000]

def find_chechen_section_ru(s):
    """Find <h1 id=Чеченский> ... up to next h1."""
    m = re.search(r'<h1[^>]*id=["\']Чеченский["\']', s, re.IGNORECASE)
    if not m:
        return None
    start = m.end()
    end = len(s)
    for nm in re.finditer(r'<h1[^>]*>', s[start:], re.IGNORECASE):
        end = start + nm.start()
        break
    return strip_tags(s[start:end])[:3000]

def extract_ce(html_text):
    if html_text.startswith("ERROR"):
        return None
    if "не существует" in html_text or "does not exist" in html_text.lower():
        return None
    m = re.search(r'<div[^>]+id=["\']mw-content-text["\']', html_text)
    if m:
        start = m.end()
        e = re.search(r'<div[^>]+id=["\']catlinks["\']', html_text[start:])
        end = start + e.start() if e else min(start + 6000, len(html_text))
    else:
        start = 0
        end = min(6000, len(html_text))
    return strip_tags(html_text[start:end])[:3000]

results = []
for w in WORDS:
    base = w.replace("/", "_").replace("\\", "_")
    en_path = os.path.join(OUT_DIR, f"{base}_en.html")
    ru_path = os.path.join(OUT_DIR, f"{base}_ru.html")
    ce_path = os.path.join(OUT_DIR, f"{base}_ce.html")

    en_text = ""
    if os.path.exists(en_path):
        with open(en_path, "r", encoding="utf-8") as f:
            data = f.read()
        if "does not have an article" not in data:
            en_text = find_chechen_section_en(data) or ""

    ru_text = ""
    if os.path.exists(ru_path):
        with open(ru_path, "r", encoding="utf-8") as f:
            data = f.read()
        if "не создана" not in data and "не существует" not in data:
            ru_text = find_chechen_section_ru(data) or ""

    ce_text = ""
    if os.path.exists(ce_path):
        with open(ce_path, "r", encoding="utf-8") as f:
            ce_text = extract_ce(f.read()) or ""

    results.append({
        "word": w,
        "en_section": en_text,
        "ru_section": ru_text,
        "ce_section": ce_text,
    })

out_path = r"C:\Users\isaha\Yeni klasör (4)\dosh-oyun\_lexicon_expansion\raw_parsed.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print(f"Saved {len(results)} entries")

en_count = sum(1 for d in results if d['en_section'])
ru_count = sum(1 for d in results if d['ru_section'])
ce_count = sum(1 for d in results if d['ce_section'])
print(f'EN: {en_count}/210, RU: {ru_count}/210, CE: {ce_count}/210')

# Show some samples
for d in results[:5]:
    print(f"--- {d['word']} ---")
    if d['en_section']: print('EN:', d['en_section'][:200])
    if d['ru_section']: print('RU:', d['ru_section'][:200])
    if d['ce_section']: print('CE:', d['ce_section'][:200])
