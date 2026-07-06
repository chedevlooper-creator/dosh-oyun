# M001: Bundle Optimizasyonu ve Kalite İyileştirmeleri

**Vision:** İlk yükleme boyutunu ~150KB gzip azaltmak, Sentry'yi lazy-load yapmak, JPG fallback'leri temizlemek ve build output'unu küçültmek.

## Slices

- [x] **S01: Sentry Lazy-Load ve Bundle Küçültme** `risk:low` `depends:[]`
  > After this: İlk yüklemede Sentry chunk'ı yüklenmez; hata durumunda lazy-load olur.

- [x] **S02: JPG Fallback Temizliği ve Asset Optimizasyonu** `risk:low` `depends:[]`
  > After this: public/ dizininde sadece WebP arkaplanlar kalır; tema yükleme sadece WebP kullanır.

## Boundary Map

Not provided.
