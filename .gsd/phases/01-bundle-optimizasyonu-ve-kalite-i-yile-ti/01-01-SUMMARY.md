---
id: S01
parent: M001
milestone: M001
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
completed_at: 2026-07-06T02:05:48.612Z
blocker_discovered: false
---

# S01: Sentry Lazy-Load ve Bundle Küçültme

**Sentry zaten lazy-load oluyor, main chunk 20KB gzip — hedefin altında. Değişiklik gerekmedi.**

## What Happened

Mevcut mimari zaten optimal: `report.js` içindeki `_getSentry()` fonksiyonu `import("@sentry/browser")` ile Sentry'yi dynamic import ediyor. Vite/Rollup bunu otomatik code-split ederek ayrı bir chunk oluşturuyor. Sentry sadece `reportError()` çağrıldığında (gerçek hata) veya kullanıcı `setConsent(true)` yaptığında yükleniyor. Main chunk 56.65KB raw / 20.29KB gzip. Sentry chunk 463KB raw / 153KB gzip — ilk sayfa yükünde gelmiyor. Tüm testler geçiyor.

## Verification

npm run build: main chunk 20.29KB gzip (hedef ≤45KB). npm test: 346/346 passed. Lint: clean.

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
