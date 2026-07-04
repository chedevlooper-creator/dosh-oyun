# Lexicon expansion (Dahili içerik aracı)

Bu klasör, Çeçen Wiktionary lemma listesini çekip `js/data/levels.js`'e
aday kelime üretmek için kullanılan **Python** araç zincirini içerir.

## Üretim yapısıyla ilişkisi

**Bu klasör runtime'a ait değildir** — `npm run build` çıktısı olan
`dist/` klasörüne hiçbir dosya kopyalanmaz ve `js/main.js` buradan
herhangi bir modül import etmez. Yani silebilir veya taşıyabilirsiniz;
oyun çalışmaya devam eder.

## Neden ayrı bir araç?

- Ağır Python bağımlılıkları (HTTP, Wiktionary API parse) repoya katmak
  istemiyoruz; bu klasör sandbox'ta çalıştırılmak üzere ayrıldı.
- Bazı script'ler Windows'a özgü yollar içeriyor
  (`r"C:\Users\..."`). macOS/Linux'ta doğrudan çalıştırılamaz.
- Üretilen sonuçlar (`results/agent_A.json` vb.) elle incelenip
  `js/data/levels.js` veya `js/data/info.js`'e entegre ediliyor; otomatik
  bir build hattına bağlı değil.

## Kullanım (Windows'ta, elle)

```bash
# 1. Lemma listesi çek
python _fetch_lemma_list.py

# 2. Wiktionary'de her lemma için anlam/örnek çek (yavaş, saatler sürebilir)
python run_all_wikt.py

# 3. Sonuçları birleştir ve `js/data/info.js`'e uygula
python scripts/merge_results.py
python scripts/apply_to_index.py
```

## Daha iyi bir mimari (ileride)

İdeal olan: bu araç zincirini **ayrı bir repoya** taşımak ve
`js/data/levels.js`'i oradan regenere eden bir script'i CI'da çalıştırmak.
O zamana kadar bu klasör bir "taslak alanı" olarak duruyor.

— 2026 hardening notu
