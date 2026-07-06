---
id: T01
parent: S01
milestone: M006
key_files:
  - js/game/chain.js
  - js/data/config.js
  - js/__tests__/chain.test.js
key_decisions:
  - (none)
duration: 
verification_result: untested
completed_at: 2026-07-06T04:34:19.582Z
blocker_discovered: false
---

# T01: Zincir motoru yazıldı: startChain, submitChainWord, chainError, endChain. 9 test.

**Zincir motoru yazıldı: startChain, submitChainWord, chainError, endChain. 9 test.**

## What Happened

js/game/chain.js oluşturuldu. State: score, streak, words, usedWords, lastLetter, errors. Havuz INFO + pack bonus kelimelerinden oluşur. submitChainWord: kelime lastLetter ile başlamalı, havuzda olmalı, kullanılmamış olmalı. Skor: uzunluk * coinsPerGrapheme + 3 kelimede bir combo bonus. İki hata zinciri bitirir, sonuç S.stats'a yazılır. js/__tests__/chain.test.js: 9 test (state, doğru zincir, yanlış harf, tekrar, kısa, havuz dışı, hata yönetimi). Tüm 356 test geçiyor.

## Verification

npm test: 25 files, 356 tests, all passed.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| — | No verification commands discovered | — | — | — |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `js/game/chain.js`
- `js/data/config.js`
- `js/__tests__/chain.test.js`
