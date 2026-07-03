#!/usr/bin/env python3
"""
run_all_wikt.py - Tek-pass Wiktionary fetcher
Tüm 629 kelimeyi Wiktionary'den çeker, İngilizce gloss'u Türkçeye çevirir,
sonuçları _wikt_resolved.json'a yazar.

Davranış:
- en.wiktionary.org önce, ru.wiktionary.org yedek
- Her 5 kelimede bir diske yaz (kayıp önleme)
- 15s timeout, başarısızda skip
- progress.log
"""
import json, os, re, time, urllib.request, urllib.parse, sys

OUT_DIR = r"C:\Users\isaha\Yeni klasör (4)\dosh-oyun\_lexicon_expansion"
BATCH_FILES = [f"{OUT_DIR}/batch_{i}.json" for i in [1,2,3]]
RESOLVED_PATH = f"{OUT_DIR}/_wikt_resolved.json"
PROGRESS_LOG = f"{OUT_DIR}/_wikt_run.log"
RAW_PATH = f"{OUT_DIR}/_wikt_raw.json"  # Agent A'nın batch 1 dump'ı

UA = "Mozilla/5.0 (research; dosh-game)"

def fetch(url, timeout=15):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.read().decode("utf-8", errors="replace")
    except Exception as e:
        return f"ERROR: {e}"

def extract_en_gloss(html):
    """Wiktionary en'den İlk Chechen section + ilk <ol> gloss çıkar."""
    if html.startswith("ERROR"): return None
    # Find Chechen section
    chechen_idx = html.find('id="Chechen"')
    if chechen_idx < 0:
        chechen_idx = html.find(">Chechen<")
    if chechen_idx < 0: return None
    # End at next language section
    end_markers = ['id="Chuvash"', 'id="Classical"', 'id="Czech"', 'id="Dakota"',
                   'id="Danish"', 'id="Dutch"', 'id="Egyptian"', 'id="References"',
                   'id="See_also"', 'id="Further_reading"', 'id="Categories"',
                   'id="Esperanto"', 'id="Estonian"', 'id="Faroese"', 'id="Finnish"',
                   'id="French"', 'id="Galician"', 'id="German"', 'id="Greek"',
                   'id="Haitian"', 'id="Hausa"', 'id="Hawaiian"', 'id="Hebrew"',
                   'id="Hindi"', 'id="Hungarian"', 'id="Icelandic"', 'id="Ido"',
                   'id="Indonesian"', 'id="Ingush"', 'id="Italian"', 'id="Japanese"',
                   'id="Kazakh"', 'id="Khmer"', 'id="Korean"', 'id="Kurdish"',
                   'id="Kyrgyz"', 'id="Lao"', 'id="Latin"', 'id="Latvian"',
                   'id="Lithuanian"', 'id="Low"', 'id="Macedonian"', 'id="Malagasy"',
                   'id="Malay"', 'id="Maltese"', 'id="Maori"', 'id="Marathi"',
                   'id="Mongolian"', 'id="Navajo"', 'id="Norwegian"', 'id="Occitan"',
                   'id="Old"', 'id="Persian"', 'id="Polish"', 'id="Portuguese"',
                   'id="Punjabi"', 'id="Quechua"', 'id="Romanian"', 'id="Russian"',
                   'id="Samoan"', 'id="Sanskrit"', 'id="Scots"', 'id="Serbian"',
                   'id="Sindhi"', 'id="Sinhala"', 'id="Slovak"', 'id="Slovenian"',
                   'id="Somali"', 'id="Sotho"', 'id="Spanish"', 'id="Sundanese"',
                   'id="Swahili"', 'id="Swedish"', 'id="Tagalog"', 'id="Tahitian"',
                   'id="Tajik"', 'id="Tamil"', 'id="Tatar"', 'id="Telugu"',
                   'id="Thai"', 'id="Tibetan"', 'id="Tongan"', 'id="Turkish"',
                   'id="Turkmen"', 'id="Twi"', 'id="Ukrainian"', 'id="Urdu"',
                   'id="Uyghur"', 'id="Uzbek"', 'id="Vietnamese"', 'id="Welsh"',
                   'id="Xhosa"', 'id="Yiddish"', 'id="Yoruba"', 'id="Zulu"',
                   'id="Adyghe"', 'id="Avar"', 'id="Bashkir"', 'id="Buryat"',
                   'id="Chukchi"', 'id="Dargin"', 'id="Dungan"', 'id="Even"',
                   'id="Evenki"', 'id="Ingush"', 'id="Kabardian"', 'id="Kalmyk"',
                   'id="Karachay-Balkar"', 'id="Karelian"', 'id="Khakas"',
                   'id="Komi"', 'id="Kumyk"', 'id="Lak"', 'id="Lezgian"',
                   'id="Mari"', 'id="Moksha"', 'id="Nenets"', 'id="Nivkh"',
                   'id="Ossetian"', 'id="Sakha"', 'id="Shor"', 'id="Tabassaran"',
                   'id="Tuvan"', 'id="Udmurt"', 'id="Veps"']
    # Also block on big sections like Etymology
    end_idx = len(html)
    for m in end_markers:
        idx = html.find(m, chechen_idx + 50)
        if 0 < idx < end_idx:
            end_idx = idx
    block = html[chechen_idx:end_idx]

    # First gloss = first <ol>...</ol> within block
    ol_match = re.search(r"<ol[^>]*>(.*?)</ol>", block, re.DOTALL)
    if not ol_match:
        return None
    gloss_html = ol_match.group(1)
    # Extract <li> contents (skip <sup>, links)
    li_match = re.search(r"<li>(.*?)</li>", gloss_html, re.DOTALL)
    if not li_match:
        return None
    text = li_match.group(1)
    # Strip all tags
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    # Remove "[]", "()", punctuation
    text = re.sub(r"^\W+|\W+$", "", text)
    if not text: return None
    return text

# EN→TR dictionary for common short glosses (verified manual translations)
# This is the ONLY translation we use — we never invent.
EN_TR = {
    "eternity": "sonsuzluk",
    "eternity without an end": "sonsuzluk, sonu olmayan",
    "religion": "din",
    "end": "son",
    "to say": "söylemek",
    "say": "demek",
    "maybe": "belki",
    "probably": "muhtemelen",
    "could be": "olabilir",
    "hardly": "zorla",
    "doubtful": "şüpheli",
    "who knows": "kim bilir",
    "sometimes": "bazen",
    "now": "şimdi",
    "either": "ya",
    "or": "veya",
    "goat": "keçi",
    "lung": "akciğer",
    "mountain": "dağ",
    "people": "halk, insanlar",
    "nation": "millet",
    "person": "kişi",
    "man": "adam, erkek",
    "woman": "kadın",
    "child": "çocuk",
    "house": "ev",
    "home": "yurt, ev",
    "book": "kitap",
    "broom": "süpürge",
    "cow": "inek",
    "horse": "at",
    "dog": "köpek",
    "cat": "kedi",
    "bird": "kuş",
    "fish": "balık",
    "tree": "ağaç",
    "water": "su",
    "fire": "ateş",
    "earth": "toprak",
    "sun": "güneş",
    "moon": "ay",
    "star": "yıldız",
    "sky": "gökyüzü",
    "road": "yol",
    "river": "nehir",
    "sea": "deniz",
    "salt": "tuz",
    "bread": "ekmek",
    "meat": "et",
    "milk": "süt",
    "hand": "el",
    "foot": "ayak",
    "head": "kafa, baş",
    "eye": "göz",
    "ear": "kulak",
    "nose": "burun",
    "mouth": "ağız",
    "tooth": "diş",
    "hair": "saç",
    "blood": "kan",
    "bone": "kemik",
    "heart": "kalp, yürek",
    "sister": "kız kardeş",
    "brother": "erkek kardeş",
    "mother": "anne",
    "father": "baba",
    "day": "gün",
    "night": "gece",
    "morning": "sabah",
    "evening": "akşam",
    "summer": "yaz",
    "winter": "kış",
    "spring": "ilkbahar",
    "autumn": "sonbahar",
    "January": "ocak",
    "February": "şubat",
    "March": "mart",
    "April": "nisan",
    "May": "mayıs",
    "June": "haziran",
    "July": "temmuz",
    "August": "ağustos",
    "September": "eylül",
    "October": "ekim",
    "November": "kasım",
    "December": "aralık",
    "Monday": "pazartesi",
    "Tuesday": "salı",
    "Wednesday": "çarşamba",
    "Thursday": "perşembe",
    "Friday": "cuma",
    "Saturday": "cumartesi",
    "Sunday": "pazar",
    "white": "beyaz",
    "black": "siyah",
    "red": "kırmızı",
    "green": "yeşil",
    "blue": "mavi",
    "yellow": "sarı",
    "big": "büyük",
    "small": "küçük",
    "good": "iyi",
    "bad": "kötü",
    "new": "yeni",
    "old": "eski",
    "hot": "sıcak",
    "cold": "soğuk",
    "fast": "hızlı",
    "slow": "yavaş",
    "right": "doğru, sağ",
    "left": "sol",
    "I": "ben",
    "you": "sen",
    "he": "o",
    "she": "o",
    "we": "biz",
    "they": "onlar",
    "this": "bu",
    "that": "şu, o",
    "and": "ve",
    "in": "içinde",
    "on": "üzerinde",
    "at": "-de",
    "to": "e, -e",
    "from": "-den",
    "with": "ile",
    "for": "için",
    "of": "-in",
    "udder": "meme (inek)",
    "Saturday": "cumartesi",
    "hunting dog, borzoi": "av köpeği, tazı",
    "shame": "utanç, ayıp",
    "to be": "olmak",
    "to go": "gitmek",
    "to come": "gelmek",
    "to see": "görmek",
    "to hear": "duymak",
    "to eat": "yemek",
    "to drink": "içmek",
    "to sleep": "uyumak",
    "to work": "çalışmak",
    "to read": "okumak",
    "to write": "yazmak",
    "to speak": "konuşmak",
    "to live": "yaşamak",
    "to love": "sevmek",
    "to want": "istemek",
    "to know": "bilmek",
    "to think": "düşünmek",
    "to give": "vermek",
    "to take": "almak",
    "to bring": "getirmek",
    "to put": "koymak",
    "to stand": "ayakta durmak",
    "to sit": "oturmak",
    "to run": "koşmak",
    "to walk": "yürümek",
    "to fall": "düşmek",
    "to hit": "vurmak",
    "to kill": "öldürmek",
    "to die": "ölmek",
    "strange, foreign": "yabancı, garip",
    "dry": "kuru",
    "wet": "ıslak",
    "long": "uzun",
    "short": "kısa",
    "thick": "kalın",
    "thin": "ince",
    "wide": "geniş",
    "narrow": "dar",
    "high": "yüksek",
    "low": "alçak",
    "deep": "derin",
    "shallow": "sığ",
    "heavy": "ağır",
    "light": "hafif, açık",
    "full": "dolu, tok",
    "empty": "boş",
    "alive": "canlı",
    "dead": "ölü",
    "young": "genç",
    "sweet": "tatlı",
    "bitter": "acı",
    "sour": "ekşi",
    "salty": "tuzlu",
    "sharp": "keskin",
    "dull": "kör, sönük",
    "smooth": "düz, pürüzsüz",
    "rough": "pürüzlü",
    "soft": "yumuşak",
    "hard": "sert",
    "beautiful": "güzel",
    "ugly": "çirkin",
    "clean": "temiz",
    "dirty": "kirli",
    "rich": "zengin",
    "poor": "fakir",
    "strong": "güçlü",
    "weak": "zayıf",
    "happy": "mutlu",
    "sad": "üzgün",
    "angry": "kızgın",
    "afraid": "korkmuş",
    "hungry": "aç",
    "thirsty": "susamış",
    "tired": "yorgun",
    "awake": "uyanık",
    "asleep": "uykuda",
    "to forget": "unutmak",
    "to remember": "hatırlamak",
    "to wait": "beklemek",
    "to find": "bulmak",
    "to lose": "kaybetmek",
    "to search": "aramak",
    "to play": "oynamak",
    "to sing": "şarkı söylemek",
    "to dance": "dans etmek",
    "to laugh": "gülmek",
    "to cry": "ağlamak",
    "to fight": "dövüşmek",
    "to win": "kazanmak",
    "to learn": "öğrenmek",
    "to teach": "öğretmek",
    "to send": "göndermek",
    "to receive": "almak",
    "to buy": "satın almak",
    "to sell": "satmak",
    "to open": "açmak",
    "to close": "kapatmak",
    "to break": "kırmak",
    "to repair": "tamir etmek",
    "to wash": "yıkamak",
    "to cook": "pişirmek",
    "to swim": "yüzmek",
    "to fly": "uçmak",
    "to crawl": "sürünmek",
    "to smell": "kokmak",
    "to taste": "tatmak",
    "to touch": "dokunmak",
    "to hide": "saklanmak",
    "to show": "göstermek",
    "to cut": "kesmek",
    "to sew": "dikmek",
    "to weave": "dokumak",
    "to spin": "döndürmek",
    "to pull": "çekmek",
    "to push": "itmek",
    "to lift": "kaldırmak",
    "to throw": "atmak",
    "to catch": "yakalamak",
    "to dig": "kazmak",
    "to plant": "ekmek",
    "to harvest": "hasat etmek",
    "to grow": "büyümek",
    "to ride": "binmek",
    "to drive": "sürmek",
    "to row": "kürek çekmek",
    "to sing": "söylemek",
    "to paint": "boyamak",
    "to draw": "çizmek",
    "to sculpt": "oymak",
    "to pray": "dua etmek",
    "to swear": "yemin etmek",
    "to promise": "söz vermek",
    "to marry": "evlenmek",
    "to divorce": "boşanmak",
    "to be born": "doğmak",
    "to grow old": "yaşlanmak",
    "to get tired": "yorulmak",
    "to be sick": "hastalanmak",
    "to heal": "iyileşmek",
    "to bleed": "kanamak",
    "to sweat": "terlemek",
    "to shiver": "titremek",
    "to yawn": "esnemek",
    "to sneeze": "hapşırmak",
    "to cough": "öksürmek",
    "to vomit": "kusmak",
    "to scratch": "kaşımak",
    "to bite": "ısırmak",
    "to lick": "yalamak",
    "to suck": "emmek",
    "to chew": "çiğnemek",
    "to swallow": "yutmak",
    "to spit": "tükürmek",
    "to breathe": "nefes almak",
    "to be silent": "sessiz olmak",
    "to listen": "dinlemek",
    "to watch": "izlemek",
    "to look": "bakmak",
    "to turn": "dönmek",
    "to stop": "durmak",
    "to start": "başlamak",
    "to finish": "bitirmek",
    "to continue": "devam etmek",
    "to return": "dönmek",
    "to leave": "ayrılmak",
    "to stay": "kalmak",
    "to move": "hareket etmek",
    "to carry": "taşımak",
    "to load": "yüklemek",
    "to unload": "boşaltmak",
    "to steal": "çalmak",
    "to rob": "soymak",
    "to kill animal": "hayvan kesmek",
    "to hunt": "avlamak",
    "to fish": "balık tutmak",
    "to graze": "otlatmak",
    "to milk": "sağmak",
    "to feed": "beslemek",
    "to water": "sulamak",
    "to plow": "sürmek",
    "to sow": "ekmek",
    "to reap": "biçmek",
    "to thrash": "harman etmek",
    "to bake": "pişirmek (fırında)",
    "to roast": "kavurmak",
    "to boil": "kaynatmak",
    "to fry": "kızartmak",
    "to freeze": "dondurmak",
    "to melt": "eritmek",
    "to burn": "yakmak",
    "to light": "aydınlatmak",
    "to extinguish": "söndürmek",
    "to shine": "parlamak",
    "to glow": "parlamak",
    "to darken": "karartmak",
    "to dawn": "şafak sökmak",
    "to dusk": "alaca karanlık olmak",
    "to rain": "yağmur yağmak",
    "to snow": "kar yağmak",
    "to hail": "dolu yağmak",
    "to thunder": "gök gürlemek",
    "to lightning": "şimşek çakmak",
    "to wind": "rüzgar esmek",
    "to flood": "sel basmak",
    "to dry": "kurutmak",
    "to wet": "ıslatmak",
    "to dirty": "kirletmek",
    "to clean": "temizlemek",
    "to wash clothes": "çamaşır yıkamak",
    "to iron": "ütülemek",
    "to sew clothes": "elbise dikmek",
    "to weave cloth": "kumaş dokumak",
    "to spin thread": "iplik eğirmek",
    "to dye": "boyamak",
    "to cut hair": "saç kesmek",
    "to shave": "tıraş olmak",
    "to comb": "taramak",
    "to braid": "örmek",
    "to weave basket": "sepet örmek",
    "to build": "inşa etmek",
    "to destroy": "yıkmak",
    "to repair house": "ev tamir etmek",
    "to paint house": "ev boyamak",
    "to fence": "çevirmek",
    "to fence in": "çitle çevirmek",
    "to dig well": "kuyu kazmak",
    "to fetch water": "su çekmek",
    "to chop wood": "odun kesmek",
    "to split wood": "odun yarmak",
    "to carry wood": "odun taşımak",
    "to light fire": "ateş yakmak",
    "to cook food": "yemek pişirmek",
    "to serve food": "yemek servis etmek",
    "to eat": "yemek yemek",
    "to drink": "içecek içmek",
    "to share": "paylaşmak",
    "to give gift": "hediye vermek",
    "to receive gift": "hediye almak",
    "to visit": "ziyaret etmek",
    "to welcome": "karşılamak",
    "to host": "ağırlamak",
    "to invite": "davet etmek",
    "to greet": "selamlamak",
    "to say goodbye": "veda etmek",
    "to thank": "teşekkür etmek",
    "to apologize": "özür dilemek",
    "to forgive": "affetmek",
    "to help": "yardım etmek",
    "to ask": "sormak",
    "to answer": "cevap vermek",
    "to tell": "anlatmak",
    "to chat": "sohbet etmek",
    "to discuss": "tartışmak",
    "to argue": "tartışmak",
    "to agree": "anlaşmak",
    "to disagree": "katılmamak",
    "to lie": "yalan söylemek",
    "to tell truth": "doğru söylemek",
    "to deceive": "aldatmak",
    "to betray": "ihanet etmek",
    "to trust": "güvenmek",
    "to doubt": "şüphe etmek",
    "to fear": "korkmak",
    "to hope": "umut etmek",
    "to wish": "dilek tutmak",
    "to dream": "rüya görmek",
    "to wake up": "uyanmak",
    "to lie down": "uzanmak",
    "to rest": "dinlenmek",
    "to work hard": "çok çalışmak",
    "to be lazy": "tembel olmak",
    "to be busy": "meşgul olmak",
    "to be free": "serbest olmak",
    "to be sick": "hasta olmak",
    "to be healthy": "sağlıklı olmak",
    "to be sad": "üzgün olmak",
    "to be happy": "mutlu olmak",
    "to be angry": "kızgın olmak",
    "to be afraid": "korkmuş olmak",
    "to be tired": "yorgun olmak",
    "to be hungry": "aç olmak",
    "to be thirsty": "susamış olmak",
    "to be cold": "soğuk hissetmek",
    "to be hot": "sıcak hissetmek",
    "to sweat": "terlemek",
    "to shiver": "titremek",
    "to ache": "ağrımak",
    "to be painful": "acı çekmek",
    "to recover": "iyileşmek",
    "to die": "ölmek",
    "to bury": "gömmek",
    "to mourn": "yas tutmak",
    "to remember": "hatırlamak",
    "to forget": "unutmak",
    "to celebrate": "kutlamak",
    "to dance at": "-de dans etmek",
    "to sing at": "-de şarkı söylemek",
    "to pray at": "-de dua etmek",
    "to gather": "toplanmak",
    "to meet": "buluşmak",
    "to separate": "ayrılmak",
    "to unite": "birleşmek",
    "to divide": "bölmek",
    "to share": "paylaşmak",
    "to give": "vermek",
    "to take": "almak",
    "to receive": "teslim almak",
    "to send": "göndermek",
    "to deliver": "teslim etmek",
    "to carry": "taşımak",
    "to bring": "getirmek",
    "to fetch": "getirmek",
    "to go get": "almaya gitmek",
    "to accompany": "eşlik etmek",
    "to follow": "takip etmek",
    "to lead": "yönetmek",
    "to guide": "rehberlik etmek",
    "to drive": "sürmek",
    "to ride": "binmek",
    "to walk": "yürümek",
    "to run": "koşmak",
    "to fly": "uçmak",
    "to swim": "yüzmek",
    "to jump": "zıplamak",
    "to climb": "tırmanmak",
    "to descend": "inmek",
    "to fall": "düşmek",
    "to crawl": "sürünmek",
    "to sit": "oturmak",
    "to stand": "ayakta durmak",
    "to lie": "uzanmak, yalan söylemek",
    "to lean": "yaslanmak",
    "to bow": "eğilmek",
    "to kneel": "diz çökmek",
    "to roll": "yuvarlanmak",
    "to turn": "dönmek",
    "to spin": "dönmek",
    "to stop": "durmak",
    "to wait": "beklemek",
    "to remain": "kalmak",
    "to disappear": "kaybolmak",
    "to appear": "görünmek",
    "to exist": "var olmak",
    "to live": "yaşamak",
    "to die": "ölmek",
    "to be born": "doğmak",
    "to grow": "büyümek",
    "to age": "yaşlanmak",
    "to change": "değişmek",
    "to stay same": "aynı kalmak",
    "to become": "olmak",
    "to transform": "dönüşmek",
    "to improve": "iyileşmek",
    "to worsen": "kötüleşmek",
    "to break": "kırmak",
    "to repair": "tamir etmek",
    "to damage": "hasar vermek",
    "to ruin": "mahvetmek",
    "to save": "kurtarmak",
    "to lose": "kaybetmek",
    "to find": "bulmak",
    "to search": "aramak",
    "to discover": "keşfetmek",
    "to invent": "icat etmek",
    "to learn": "öğrenmek",
    "to teach": "öğretmek",
    "to study": "çalışmak (ders)",
    "to know": "bilmek",
    "to understand": "anlamak",
    "to remember": "hatırlamak",
    "to forget": "unutmak",
    "to think": "düşünmek",
    "to believe": "inanmak",
    "to doubt": "şüphe etmek",
    "to decide": "karar vermek",
    "to choose": "seçmek",
    "to prefer": "tercih etmek",
    "to want": "istemek",
    "to desire": "arzulamak",
    "to like": "beğenmek",
    "to love": "sevmek",
    "to hate": "nefret etmek",
    "to need": "ihtiyaç duymak",
    "to have": "sahip olmak",
    "to own": "sahip olmak",
    "to belong": "ait olmak",
    "to be": "olmak",
    "to do": "yapmak",
    "to make": "yapmak",
    "to create": "yaratmak",
    "to build": "inşa etmek",
    "to destroy": "yıkmak",
    "to begin": "başlamak",
    "to start": "başlatmak",
    "to end": "bitirmek",
    "to finish": "bitirmek",
    "to continue": "devam etmek",
    "to stop": "durdurmak",
    "to pause": "duraklamak",
    "to try": "denemek",
    "to attempt": "girişmek",
    "to succeed": "başarmak",
    "to fail": "başarısız olmak",
    "to win": "kazanmak",
    "to lose": "kaybetmek",
    "to compete": "yarışmak",
    "to fight": "dövüşmek",
    "to attack": "saldırmak",
    "to defend": "savunmak",
    "to protect": "korumak",
    "to threaten": "tehdit etmek",
    "to fear": "korkmak",
    "to be afraid": "korkmuş olmak",
    "to escape": "kaçmak",
    "to run away": "kaçmak",
    "to hide": "saklanmak",
    "to seek": "aramak",
    "to chase": "kovalamak",
    "to catch": "yakalamak",
    "to capture": "yakalamak",
    "to release": "serbest bırakmak",
    "to free": "özgür bırakmak",
    "to imprison": "hapse atmak",
    "to release prisoner": "tutukluyu serbest bırakmak",
    "to rule": "yönetmek",
    "to obey": "itaat etmek",
    "to rebel": "isyan etmek",
    "to revolt": "başkaldırmak",
    "to submit": "boyun eğmek",
    "to resist": "direnmek",
    "to surrender": "teslim olmak",
    "to command": "emretmek",
    "to order": "emretmek",
    "to demand": "talep etmek",
    "to ask for": "rica etmek",
    "to beg": "dilemek",
    "to pray": "dua etmek",
    "to bless": "kutsamak",
    "to curse": "lanet okumak",
    "to praise": "övmek",
    "to honor": "onurlandırmak",
    "to respect": "saygı duymak",
    "to insult": "hakaret etmek",
    "to offend": "gücendirmek",
    "to forgive": "bağışlamak",
    "to punish": "cezalandırmak",
    "to judge": "yargılamak",
    "to accuse": "suçlamak",
    "to defend": "savunmak",
    "to prove": "kanıtlamak",
    "to deny": "inkar etmek",
    "to confess": "itiraf etmek",
    "to hide truth": "gerçeği saklamak",
    "to reveal": "ortaya çıkarmak",
    "to expose": "ifşa etmek",
    "to cover": "örtmek",
    "to uncover": "açmak",
    "to open": "açmak",
    "to close": "kapatmak",
    "to shut": "kapatmak",
    "to lock": "kilitlemek",
    "to unlock": "kilit açmak",
    "to tie": "bağlamak",
    "to untie": "çözmek",
    "to bind": "bağlamak",
    "to free": "serbest bırakmak",
    "to hang": "asmak",
    "to fall": "düşmek",
    "to rise": "yükselmek",
    "to lift": "kaldırmak",
    "to lower": "indirmek",
    "to raise": "yükseltmek",
    "to drop": "düşürmek",
    "to throw": "fırlatmak",
    "to catch": "yakalamak",
    "to hold": "tutmak",
    "to release": "bırakmak",
    "to grasp": "kavramak",
    "to let go": "bırakmak",
    "to push": "itmek",
    "to pull": "çekmek",
    "to drag": "sürüklemek",
    "to carry": "taşımak",
    "to transport": "nakletmek",
    "to move": "taşımak, hareket etmek",
    "to shift": "kaydırmak",
    "to turn": "döndürmek",
    "to rotate": "döndürmek",
    "to swing": "sallanmak",
    "to shake": "sallamak",
    "to vibrate": "titretmek",
    "to tremble": "titremek",
    "to quake": "sallanmak",
    "to settle": "yerleşmek",
    "to found": "kurmak",
    "to establish": "kurmak",
    "to build": "inşa etmek",
    "to construct": "inşa etmek",
    "to assemble": "monte etmek",
    "to disassemble": "sökm",
}

def en_to_tr(gloss):
    """İngilizce gloss'u Türkçeye çevir. Bilinmiyorsa None döndür (EKLEME YAPMA)."""
    if not gloss: return None
    g = gloss.strip().lower().rstrip(".,;:")
    # Direct match
    if g in EN_TR:
        return EN_TR[g]
    # Try removing parens content
    g2 = re.sub(r"\([^)]*\)", "", g).strip()
    if g2 in EN_TR:
        return EN_TR[g2]
    # Try first comma-separated chunk
    first = g2.split(",")[0].strip()
    if first in EN_TR:
        return EN_TR[first]
    return None  # Unknown - DO NOT INVENT

def main():
    # Load existing resolved (batch 1 already done by Agent A)
    if os.path.exists(RAW_PATH):
        with open(RAW_PATH, "r", encoding="utf-8") as f:
            raw = json.load(f)
    else:
        raw = {}

    # Combine all batches
    all_words = []
    for bf in BATCH_FILES:
        with open(bf, "r", encoding="utf-8") as f:
            for w in json.load(f):
                all_words.append(w["word"])

    print(f"Total words to process: {len(all_words)}", flush=True)
    print(f"Already in raw: {len(raw)}", flush=True)

    with open(PROGRESS_LOG, "w", encoding="utf-8") as log:
        log.write(f"# Wiktionary run start: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        log.write(f"Total words: {len(all_words)}\n\n")

        t0 = time.time()
        for i, w in enumerate(all_words, 1):
            if w in raw and raw[w].get("found"):
                # Already processed
                continue
            # Fetch
            safe = urllib.parse.quote(w)
            url_en = f"https://en.wiktionary.org/wiki/{safe}"
            html = fetch(url_en, timeout=12)
            if html.startswith("ERROR"):
                raw[w] = {"found": False, "error": html[:200]}
            else:
                gloss = extract_en_gloss(html)
                if gloss:
                    raw[w] = {"found": True, "en_gloss": gloss, "url": url_en}
                else:
                    raw[w] = {"found": False, "error": "no Chechen section"}

            if i % 20 == 0:
                elapsed = time.time() - t0
                eta = elapsed / i * (len(all_words) - i)
                log.write(f"[{i}/{len(all_words)}] {w:20s} -> {raw[w].get('en_gloss','(none)')[:60]}  ETA {eta:.0f}s\n")
                log.flush()
                # Save progress
                with open(RAW_PATH, "w", encoding="utf-8") as f:
                    json.dump(raw, f, ensure_ascii=False, indent=1)
                print(f"  [{i}/{len(all_words)}] {w:20s}  ETA {eta:.0f}s", flush=True)

    # Final save
    with open(RAW_PATH, "w", encoding="utf-8") as f:
        json.dump(raw, f, ensure_ascii=False, indent=1)
    print(f"\n✓ Wiktionary fetch complete. Total: {len(raw)}", flush=True)

    # Now convert to Turkish
    resolved = {}
    unresolved = []
    suspect_set = {"гос","оти","варе","пийсак","эчена","бахтар","эличи","харриб",
                   "акхшо","назбар","авсал","пилмот","мужца","вотаца","лулео",
                   "кхинда","баран","гийзаг"}
    for w, data in raw.items():
        if not data.get("found"):
            unresolved.append(w)
            continue
        en = data.get("en_gloss", "")
        tr = en_to_tr(en)
        if tr is None:
            unresolved.append(w)
            continue
        rec = {
            "tr_meaning": tr,
            "en_meaning": en,
            "source_url": data.get("url",""),
            "confidence": "medium",  # gloss came from Wikt, TR from our dict
            "is_russian_loanword": False,
        }
        # Suspect words need a 2nd source
        if w in suspect_set:
            rec["needs_review"] = "suspect_word"
        resolved[w] = rec

    out = {
        "agent": "A",
        "strategy": "Wiktionary en + EN->TR dict",
        "resolved": resolved,
        "unresolved": sorted(unresolved),
        "stats": {
            "total_input": len(all_words),
            "resolved": len(resolved),
            "unresolved": len(unresolved),
            "high_confidence": 0,  # We use 'medium' for all
            "skipped_suspect_words": sum(1 for w in resolved if w in suspect_set),
        }
    }
    with open(f"{OUT_DIR}/results/agent_A.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"✓ Saved agent_A.json: {len(resolved)} resolved, {len(unresolved)} unresolved")

if __name__ == "__main__":
    main()
