---
id: S02
parent: M002
milestone: M002
provides:
  - (none)
requires:
  []
affects:
  []
key_files: []
key_decisions: []
patterns_established:
  - (none)
observability_surfaces:
  - none
drill_down_paths:
  []
duration: ""
verification_result: passed
completed_at: 2026-07-06T02:29:10.722Z
blocker_discovered: false
---

# S02: Ana Ekran ve İstatistiklerde Skor Gösterimi

**Ana ekranda TA skoru, istatistiklerde TA bölümü — kullanıcı skorlarını her yerde görüyor.**

## What Happened

İki UI değişikliği: (1) Ana ekrandaki ⏱ butonunda, eğer daha önce Time Attack oynandıysa en iyi skor label olarak gösteriliyor. (2) İstatistikler panelinde yeni "Zamana Karşı ⏱" bölümü eklendi; en iyi skor, toplam oyun sayısı ve en iyi kelime sayısı gösteriliyor. Tüm dillerde i18n anahtarları mevcut.

## Verification

npm run verify: lint clean, 347/347 tests passed, build successful.

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

- `js/screens/home.js` — renderHome() TA skorunu btn-timeattack label'ına yazıyor
- `js/screens/stats.js` — openStats() TA bölümü eklendi
