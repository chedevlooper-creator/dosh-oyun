---
id: S02
parent: M006
milestone: M006
provides:
  - (none)
requires:
  []
affects:
  []
key_files:
  - js/screens/chain.js
  - js/screens/home.js
  - js/__tests__/chain.test.js
  - css/components.css
key_decisions:
  - chain.js UI panel modal olarak aciliyor (ayri bir ekran yerine)
  - chain.btn i18n anahtari eklendi ve home.js render'inda kullaniliyor
  - Zincir motoru grafem normalizasyonu ile calisiyor (splitG/norm)
patterns_established:
  - (none)
observability_surfaces:
  - none
drill_down_paths:
  []
duration: ""
verification_result: passed
completed_at: 2026-07-06T05:28:15.463Z
blocker_discovered: false
---

# S02: Zincir UI ve Skor Kaliciligi

**Zincir modu UI tamamlandi, ana ekrandan erisilebilir, oyun sonu skor kalici olarak kaydediliyor.**

## What Happened

Kelime Zinciri modu tamamen oynanabilir hale geldi. Ana ekrandaki 🔗 butonu ile zincir modu açılıyor. Panel içinde: mevcut skor, son harf, zincir uzunluğu görünüyor. Oyuncu input kutusuna kelime yazıp Enter'a basıyor. Doğruysa puan ekleniyor ve zincir uzuyor. Yanlışsa hata sayacı artıyor, 2 hata = zincir sonu. Bitiş ekranında en iyi skor, en uzun zincir uzunluğu ve oyun sayısı gösteriliyor. Skor S.stats.chainBest/chainLongest/chainGames'te kalıcı olarak depolanıyor. İstatistik panelinde zincir istatistikleri gösteriliyor.

## Verification



## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

None.

## Known Limitations

None.

## Follow-ups

None.

## Files Created/Modified

None.
