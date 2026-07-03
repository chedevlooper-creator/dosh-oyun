#!/usr/bin/env python
"""Fetch Wiktionary content for Chechen words."""
import json
import re
import urllib.request
import urllib.parse
import sys
import time
import os

WORDS = "авсал адамаш акхар ала амал ара арз асар ах ахча ачо аьлана бага бакъ балоз баран бархӀ бат бац башха баӀ бел бера бешахо бо болат бос бохча буй бухь буш бӀе вайн варе веш виц вон воьда гай ган гата герз го гу гулдар гӀа гӀайре гӀапа гӀата гӀирс гӀу гӀумки даар даим дакх дамаца дарц даьхни дегӀ ден деши дила до дой дохк дохкуш доӀа духа етт жа жим зов зовца зуда зӀок ийза ип исс ишкол йез йова йохка йу ка кана кач кеп кивр кир ков коч кулга кхакх кхел кхес кхиа кхинда кхор кхоь къам къонза кӀал кӀирна кӏомал лаг лай лама ларгар лахе лекъ лестам ло лу лулахо луьста май мар март мах мача меза меца мо мор мохь мукх наб накхар наьрс нийсо ниха нохчо нур ов орам оьмар пеш пилмот пха пхи рагӀ сан севгӀ сиха соьлжа стигал сула сурхо тал тарсал тоба топца тур тхир тӀай тӀемло тӀу унхо урс уьра хаа хазам харжам хас херо хийцар хин хиш хоз ху хьакха хьан хьаш хье хьеха хьо хьун хӀоа ца цаьрга цициг цу цӀен чагӀар чапха чо чог чохь чухта чӀаж чӀурам шар шахь шелиг шеран шина шиъ шод шу эв эс эца эчена юхана юьхьан ян яьсса Ӏай Ӏаь Ӏу".split()

OUT_DIR = r"C:\Users\isaha\Yeni klasör (4)\dosh-oyun\_lexicon_expansion\raw_wik"
os.makedirs(OUT_DIR, exist_ok=True)

def fetch(url, timeout=15):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (research; dosh-game)"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.read().decode("utf-8", errors="replace")
    except Exception as e:
        return f"ERROR: {e}"

def get_en_wik(word):
    safe = urllib.parse.quote(word)
    url = f"https://en.wiktionary.org/wiki/{safe}"
    return fetch(url)

def get_ru_wik(word):
    safe = urllib.parse.quote(word)
    url = f"https://ru.wiktionary.org/wiki/{safe}"
    return fetch(url)

def get_ce_wik(word):
    safe = urllib.parse.quote(word)
    url = f"https://ce.wikipedia.org/wiki/{safe}"
    return fetch(url)

# Process in parallel-ish manner
for w in WORDS:
    base = w.replace("/", "_").replace("\\", "_")
    # check if en already done
    en_path = os.path.join(OUT_DIR, f"{base}_en.html")
    ru_path = os.path.join(OUT_DIR, f"{base}_ru.html")
    ce_path = os.path.join(OUT_DIR, f"{base}_ce.html")
    if not os.path.exists(en_path):
        html = get_en_wik(w)
        with open(en_path, "w", encoding="utf-8") as f:
            f.write(html)
    if not os.path.exists(ru_path):
        html = get_ru_wik(w)
        with open(ru_path, "w", encoding="utf-8") as f:
            f.write(html)
    if not os.path.exists(ce_path):
        html = get_ce_wik(w)
        with open(ce_path, "w", encoding="utf-8") as f:
            f.write(html)
    time.sleep(0.3)
print("DONE")
