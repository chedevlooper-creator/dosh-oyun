# M004: Mobil GPU Yuk Hafifletme - Drop-Shadow ve Filter Temizligi

**Vision:** Mobil cihazlarda kalan GPU ağırlıklı CSS özelliklerini (drop-shadow filter'ları, çok katmanlı box-shadow'lar, SVG filter'ları) @media (pointer:coarse) ile hafifletmek veya kapatmak.

## Slices

- [x] **S01: Drop-Shadow ve Box-Shadow Mobil Temizligi** `risk:low` `depends:[]`
  > After this: Mobilde logo ve tower drop-shadow kapanır, baloncuk shadow'ları hafifler.

- [x] **S02: Splash ve Gereksiz DOM Temizligi** `risk:low` `depends:[]`
  > After this: Splash kapandıktan sonra DOM'dan tamamen kalkar; gizli canvas'lar mobilde display:none olur.

## Boundary Map

Not provided.
