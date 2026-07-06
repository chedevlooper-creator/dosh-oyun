# M005: Offline-First Sertlestirme ve Performans Profili

**Vision:** PWA'nin offline çalışmasını garanti altına almak (pack JSON'ları dahil) ve gerçek tarayıcıda performans profilini çıkarıp kalan darboğazları tespit etmek.

## Slices

- [x] **S01: Workbox Runtime Caching ve Pack Precache** `risk:low` `depends:[]`
  > After this: İnternet kapalıyken pack değiştirilebilir; tüm pack'ler ilk yüklemede cache'lenir.

- [x] **S02: Tarayici Performans Profili** `risk:low` `depends:[S01]`
  > After this: Ana ekran ve oyun ekranı için frame budget, layout thrashing, ve long task raporu.

## Boundary Map

Not provided.
