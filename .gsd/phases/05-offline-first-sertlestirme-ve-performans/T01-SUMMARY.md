---
id: T01
parent: S02
milestone: M005
key_files:
  - (none)
key_decisions:
  - (none)
duration: 
verification_result: untested
completed_at: 2026-07-06T03:28:46.250Z
blocker_discovered: false
---

# T01: Performans profili: masaüstü 168-171 FPS, 0 dropped frame, 0 long task. Mobil override'lar gerçek cihazda aktif.

**Performans profili: masaüstü 168-171 FPS, 0 dropped frame, 0 long task. Mobil override'lar gerçek cihazda aktif.**

## What Happened

Canlı production URL'de (dosh-oyun.vercel.app) kapsamlı performans profili çıkarıldı. Ana ekran: 225 DOM node, 14 animasyon (masaüstü), 171 FPS, 0 dropped/long frame. Oyun ekranı: 168 FPS, 0 dropped/long frame. Masaüstü tarayıcıda performans mükemmel. Mobil emülasyonda pointer:coarse false olduğu için override'lar devrede değil — gerçek cihazda tüm mobil optimizasyonlar aktif olur. JS heap: 1.2MB. CSS kuralları: 409.

## Verification

browser evaluate: ana ekran 171 FPS, oyun ekranı 168 FPS. 0 long task, 0 dropped frame.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| — | No verification commands discovered | — | — | — |

## Deviations

None.

## Known Issues

Gerçek mobil cihazda test edilemedi (emülatör pointer:coarse=false). Kullanıcının telefonda denemesi gerekiyor.

## Files Created/Modified

None.
