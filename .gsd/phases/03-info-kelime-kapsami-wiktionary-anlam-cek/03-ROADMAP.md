# M003: INFO Kelime Kapsami - Wiktionary Anlam Cekme

**Vision:** Wiktionary'den Çeçence kelime anlamlarını (gloss) otomatik çeken bir pipeline kurmak, mevcut eksik INFO kelimelerini doldurmak ve coverage'ı artırmak.

## Slices

- [x] **S01: Wiktionary Gloss Cekme Scripti** `risk:medium` `depends:[]`
  > After this: node scripts/fetch-glosses.mjs çalışır, scripts/cache/glosses.json oluşur.

- [ ] **S02: Glosslari INFOya Aktarma ve Parse Iyilestirme** `risk:medium` `depends:[S01]`
  > After this: Eksik kelimelerin anlamları js/data/info.js'e eklenir.

## Boundary Map

Not provided.
