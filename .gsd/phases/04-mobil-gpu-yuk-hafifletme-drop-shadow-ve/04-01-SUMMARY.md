---
id: S01
parent: M004
milestone: M004
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
completed_at: 2026-07-06T03:05:47.588Z
blocker_discovered: false
---

# S01: Drop-Shadow ve Box-Shadow Mobil Temizligi

**Mobilde 6 CSS özelliği hafifletildi: drop-shadow filter'lar kapatıldı, box-shadow'lar tek katmana indi.**

## What Happened

css/components.css'te iki @media (pointer:coarse) bloguna GPU ağırlıklı CSS override'ları eklendi. Logo ve tower SVG'lerindeki 2-3 katmanlı drop-shadow() filter'ları kaldırıldı. SVG polyline filter'ları kaldırıldı. Baloncuk (bub) box-shadow'ları 2-3 katmandan tek katmana indirildi. Bu değişiklikler mobil cihazlarda GPU compositing ve fill-rate yükünü ciddi şekilde azaltır.

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

- `css/components.css` — @media (pointer:coarse) bloguna drop-shadow/box-shadow override'ları eklendi
