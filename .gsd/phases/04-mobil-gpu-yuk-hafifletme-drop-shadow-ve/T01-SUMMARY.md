---
id: T01
parent: S02
milestone: M004
key_files:
  - js/main.js
key_decisions:
  - (none)
duration: 
verification_result: untested
completed_at: 2026-07-06T03:06:14.678Z
blocker_discovered: false
---

# T01: Mobilde 3D kapalıysa gl/fx canvas'ları display:none yapılıyor.

**Mobilde 3D kapalıysa gl/fx canvas'ları display:none yapılıyor.**

## What Happened

js/main.js'e eklendi: mobil dokunmatik cihazlarda veya S.settings.scene3d === false olduğunda #gl (Three.js) ve #fx (partikül) canvas'ları display:none yapılıyor. Bu, canvas compositing yükünü tamamen kaldırır. Splash DOM temizliği zaten mevcuttu (2600ms sonra remove). Lint temiz, 347 test geçiyor.

## Verification

npm run lint: clean. npm test: 347 passed.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| — | No verification commands discovered | — | — | — |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `js/main.js`
