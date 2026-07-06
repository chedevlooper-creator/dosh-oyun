---
id: S01
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
completed_at: 2026-07-06T02:28:20.325Z
blocker_discovered: false
---

# S01: Skor Kalıcılığı ve Store Entegrasyonu

**taBest/taGames/taWords store'a eklendi, time-attack bitişte kaydediyor, i18n hazır.**

## What Happened

Store şeması genişletildi: S.stats'a taBest, taGames, taWords alanları eklendi. time-attack.js'de endTimeAttack() fonksiyonu oyun bitince bu alanları güncelliyor. Eski save'ler hydrate() tarafından sorunsuz migrate ediliyor (eksik alanlar 0 ile dolduruluyor). i18n anahtarları üç dilde eklendi. Yeni store testi eklendi. 347/347 test geçiyor.

## Verification

npm test: 347 tests passed. Lint: clean.

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

- `js/engine/store.js` — _S.stats'a taBest, taGames, taWords eklendi; hydrate ve varsayılanlar güncellendi
- `js/game/time-attack.js` — endTimeAttack() store'a skor yazıyor
- `js/utils/i18n.js` — stats.taSection/Best/Games/Words ce/ru/tr eklendi
- `js/__tests__/store.test.js` — TA alanları için hydrate testi eklendi
