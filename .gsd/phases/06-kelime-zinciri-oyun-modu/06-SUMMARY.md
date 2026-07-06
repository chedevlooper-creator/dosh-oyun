---
id: M006
title: "Kelime Zinciri Oyun Modu"
status: complete
completed_at: 2026-07-06T05:28:39.327Z
key_decisions:
  - Zincir modu ayri bir ekran yerine panel (modal) olarak calisiyor — time attack ile benzer yaklasim
  - Zincir kelime havuzu INFO + pack bonus kelimelerinden olusuyor
  - chain.btn i18n anahtari ana ekran butonu icin eklendi
key_files:
  - js/game/chain.js
  - js/screens/chain.js
  - js/screens/home.js
  - js/__tests__/chain.test.js
  - css/components.css
lessons_learned:
  - Grafem normalizasyonu (splitG) Chechen digraflarinda kritik — string length kullanmak hatali
  - chain.js'deki pickWord fonksiyonu kullanilmiyormus, temizlenmesi lint uyarisini cozdu
  - Zincir UI zaten yazilmis haldeydi (onceki oturumdan), sadece home.js render ve i18n eksikti
---

# M006: Kelime Zinciri Oyun Modu

**Kelime zinciri oyun modu tamamlandi: motor, UI, skor kaliciligi.**

## What Happened

M006 kapsaminda yeni bir oyun modu gelistirildi: Kelime Zinciri (Дошан зӀенг). Zincir motoru js/game/chain.js'de: startChain (rastgele baslangic), submitChainWord (kisit kontrolu + puan), chainError (2 hata = bitis), endChain (S.stats'a yazma). UI js/screens/chain.js'de modal panel olarak calisiyor. Ana ekrandaki 🔗 butonundan erisilebiliyor. Chechen digraflari splitG/norm ile dogru isleniyor. Testler (357 unit, 13 e2e) ve build basarili.

## Success Criteria Results

S01: Zincir motoru (startChain, submitChainWord, chainError, endChain) calisiyor — 9 test dogruladi.
S02: Zincir UI ana ekrandan erisilebilir, input calisiyor, skor S.stats.chainBest/chainLongest/chainGames ile kalici.

## Definition of Done Results

- [x] S01 Zincir motoru yazildi (game/chain.js)
- [x] S02 UI tamamlandi (screens/chain.js, home.js butonu, CSS, i18n)
- [x] Testler gecildi (357/357 unit, 13/13 e2e)
- [x] Build basarili
- [x] Lint temiz

## Requirement Outcomes

Not provided.

## Deviations

None.

## Follow-ups

Zincir modu icin ileride: sure sinirlamasi (60s varyanti), paylasma (social), zincir siralamasi (leaderboard).
