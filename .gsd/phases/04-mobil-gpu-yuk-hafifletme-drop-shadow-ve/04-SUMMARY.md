---
id: M004
title: "Mobil GPU Yuk Hafifletme - Drop-Shadow ve Filter Temizligi"
status: complete
completed_at: 2026-07-06T03:06:46.099Z
key_decisions: []
key_files:
  - css/components.css
  - js/main.js
lessons_learned:
  - (none)
---

# M004: Mobil GPU Yuk Hafifletme - Drop-Shadow ve Filter Temizligi

**6 CSS override'ı ve canvas gizleme ile mobil GPU yükü azaltıldı.**

## What Happened

## S01: Drop-Shadow ve Box-Shadow Temizliği
css/components.css @media (pointer:coarse):
- .logo, .tower: filter:none (2-3 kat drop-shadow kaldırıldı)
- .tool-ic svg, #wheel svg polyline: filter:none
- .bub, .bub.sel: box-shadow tek katmana indirildi

## S02: Canvas Gizleme
js/main.js: Mobil cihazlarda veya scene3d=false iken #gl ve #fx canvas'ları display:none

## Etki
- GPU compositing katmanı sayısı azaldı
- Fill-rate yükü düştü (özellikle logo/tower SVG filter'ları)
- Kullanılmayan canvas'lar compositing pipeline'ından çıkarıldı

## Success Criteria Results

Not provided.

## Definition of Done Results

Not provided.

## Requirement Outcomes

Not provided.

## Deviations

None.

## Follow-ups

None.
