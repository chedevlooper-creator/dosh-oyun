# Dosy: Performans Optimizasyonu, Bug Düzeltme ve Refactoring

**Tarih:** 10 Temmuz 2026
**Versiyon:** 1.0
**Proje:** Дош (Dosh) — Çeçence Kelime Bulmaca Oyunu
**Durum:** Tasarım Aşaması

---

## 1. Proje Özeti

### 1.1 Mevcut Durum
- **Uygulama:** Words-of-Wonders tarzı Çeçence kelime bulmaca oyunu
- **Tech Stack:** Vanilla JS (ES modules) + Vite 6.4.3 + Three.js 0.169 + PWA
- **Versiyon:** 4.0.0
- **Dağıtım:** Vercel (statik hosting) + PWA (kurulabilir)
- **Test Kapsamı:** Vitest (birim) + Playwright (E2E)
- **Diller:** Çeçence (varsayılan), Türkçe, Rusça
- **Temalar:** Кавказ, Буьйса (Gece), Хьун (Orman), Гуьйре (Sonbahar), Ӏа (Kış)

### 1.2 Proje Yapısı
```
dosh-oyun/
├── index.html              # Ana giriş noktası
├── editor.html             # Seviye editörü
├── js/
│   ├── main.js             # Uygulama giriş noktası
│   ├── engine/             # Çekirdek motor (audio, save, store, theme, daily, grapheme)
│   ├── game/               # Oyun mantığı (input, render, state, hints, reward, chain, time-attack)
│   ├── screens/            # Ekran yöneticileri (home, map, game, settings, dict, stats, tutorial, feedback, chain)
│   ├── data/               # Veri katmanı (config, dictionary, info, level-index, packs, levels/)
│   ├── fx/                 # Efektler (particles, scene3d)
│   ├── utils/              # Yardımcılar (helpers, i18n, tts, analytics, report, resize)
│   ├── editor/             # Seviye editörü mantığı
│   └── __tests__/          # Vitest testleri (25 dosya)
├── css/                    # Stil dosyaları (7 dosya: variables, themes, layout, animations, components, base, editor)
├── e2e/                    # Playwright E2E testleri
├── scripts/                # Build/içerik araçları
├── public/                 # Statik varlıklar (fotoğraflar, ikonlar, robots, sitemap)
├── docs/                   # Dokümantasyon
└── vite.config.js          # Vite + PWA yapılandırması
```

---

## 2. Kapsam ve Hedefler

### 2.1 Ana Hedefler
Bu spec, üç ana iş paketini kapsar:

1. **Performans Optimizasyonu** — Genel mobil cihazlarda GPU/CPU yükü azaltma
2. **Bug Düzeltme** — A11y, UI/Responsive, runtime hataları, test hataları
3. **Refactoring** — Kod kalitesi, modülerlik, test edilebilirlik

### 2.2 Öncelik Sırası
1. Mobil performans optimizasyonu (kritik)
2. Runtime hataları düzeltme (yüksek)
3. A11y sorunları düzeltme (yüksek)
4. UI/Responsive iyileştirmeleri (orta)
5. Refactoring (orta - kademeli)
6. Test hataları düzeltme (düşük - sürekli)

### 2.3 Başarı Kriterleri
- **Performans:** Lighthouse mobil skoru ≥80, First Contentful Paint <2s, Total Blocking Time <300ms
- **A11y:** WCAG 2.1 AA uyumluluğu, tüm interaktif elemanlar klavye ile erişilebilir
- **Test:** Mevcut testlerin %100 geçme oranı, yeni eklenen testlerle coverage artışı
- **Kod Kalitesi:** ESLint zero-warning, max fonksiyon uzunluğu <50 satır, döngüsel bağımlılık yok

---

## 3. Detay: Performans Optimizasyonu (Mobil GPU/CPU)

### 3.1 Sorun Alanları

#### 3.1.1 Mevcut Sorunlar
- **CSS backdrop-filter:** Mobil GPU'ları zorlar, ısınmaya neden olur
- **CSS box-shadow:** Yüksek mobil GPU yükü
- **CSS animasyonlar:** `will-change` kullanımı optimize edilmeli
- **3D transform'lar:** Perspektif ve 3D döndürme mobile ağır gelir
- **Canvas/WebGL:** Three.js sahnesi (scene3d.js) mobilde performans sorunları yaratır

#### 3.1.2 Hedef Cihazlar
- **Genel mobil** odak: Tüm mobil cihazlar için genel optimizasyon
- Düşük segment Android (2-3GB RAM, eski GPU)
- Eski iPhone'lar (iPhone 8/X serisi)
- Tabletler (yüksek çözünürlük)

### 3.2 Optimizasyon Stratejisi

#### 3.2.1 CSS Optimizasyonları
```javascript
// KALDIRILACAK/LIMITLENECEK:
- backdrop-filter: blur() → opak arka plan ile değiştir veya sadece hover'da
- box-shadow: çok katmanlı gölgeler → tek katman veya:none
- will-change: sadece animasyon sırasında ekle, biterken kaldır
- transform: perspective() → 2D fallback'e düşür
- filter: drop-shadow() → box-shadow veya:none
```

#### 3.2.2 Canvas/WebGL Optimizasyonları
```javascript
// scene3d.js için:
- Düşük segmentte 3D sahneyi tamamen devre dışı bırak
- Pixel ratio sınırlaması: max 2 (şu an 2.5'e kadar)
- Background tab'lar: requestAnimationFrame duraklatma (zaten var)
- Partikül sayısı: mobilde %50 azaltma
```

#### 3.2.3 JavaScript Optimizasyonları
```javascript
// Input handling:
- pointermove throttle: 60fps (zaten yapılmış, doğrula)
- Bubble text rendering: dispG optimizasyonu
- Event delegation: tek handler ile çoklu eleman

// State management:
- G state objesi: gereksiz yeniden render'ları önle
- Re-render guard: aynı state değişikliği için debounce
```

#### 3.2.4 Asset Optimizasyonları
```javascript
// Yükleme stratejisi:
- Critical CSS inline (above-the-fold)
- Font loading: font-display: swap
- Images: WebP formatı (zaten var), lazy loading
- Code splitting: zaten manualChunks ile yapılmış
```

### 3.3 Uygulama Planı

| Aşama | İş | Öncelik | Tahmini Süre |
|-------|-----|---------|---------------|
| 1 | CSS backdrop-filter ve box-shadow analizi | Yüksek | 2 saat |
| 2 | CSS optimizasyonları uygulama | Yüksek | 4 saat |
| 3 | 3D/WebGL mobil fallback | Yüksek | 4 saat |
| 4 | Input handling throttle doğrulama | Orta | 2 saat |
| 5 | Asset loading optimizasyonu | Orta | 2 saat |
| 6 | Mobil test ve Lighthouse doğrulama | Yüksek | 2 saat |

**Toplam Tahmini:** ~16 saat

---

## 4. Detay: Bug Düzeltme

### 4.1 A11y Sorunları (Tam Denetim)

#### 4.1.1 Denetim Alanları
- **ARIA Label'lar:** Tüm buton ve interaktif elemanlarda eksik label kontrolü
- **Screen Reader:** NVDA, VoiceOver ile test (ekran okuyucu desteği)
- **Klavye Navigasyonu:** Tab sırası, focus management, escape ile kapatma
- **Kontrast Oranı:** WCAG AA (4.5:1 normal, 3:1 büyük metin)
- **Renk Körlüğü:** Renge bağımlı bilgi iletimi kontrolü
- **Focus Visible:** Focus göstergesi visibility kontrolü

#### 4.1.2 Mevcut Durum
- `index.html`'de skip-link var: `<a href="#scr-home" class="skip-link">Skip to main content</a>`
- Bazı butonlarda aria-label var (game-back, map-back, shuffle)
- `role="dialog"` ve `aria-hidden` kullanımı var (veil, panel)
- `aria-live="polite"` kullanımı var (toast, banner, progress)

#### 4.1.3 Eksikler
- Tüm `.icon-btn` elemanlarında aria-label eksik olabilir
- Modal/dialog kapatma mekanizması (ESC tuşu)
- Focus trap (dialog açıkken)
- Renk contrast testi (tüm temalarda)
- Reduced motion desteği (`prefers-reduced-motion`)

### 4.2 UI/Responsive Sorunları (Tüm Ekran Boyutları)

#### 4.2.1 Hedef Ekran Boyutları
- **Küçük telefon:** 320-375px (iPhone SE, eski Android)
- **Standart telefon:** 375-428px (iPhone 12-14, Galaxy S)
- **Büyük telefon:** 428px+ (iPhone Pro Max, Galaxy Ultra)
- **Tablet:** 768px+
- **Landscape modu:** Yatay ekran desteği

#### 4.2.2 Kontrol Edilecekler
- Çark (wheel) boyutlandırması küçük ekranlarda
- Grid (ızgara) responsive yerleşim
- Tool row (araç çubuğu) kompakt mod
- Panel/modal boyutları ve taşma
- Font boyutları ve okunabilirlik
- Touch hedef boyutları (minimum 44x44px)
- Safe area (notch, home indicator)

### 4.3 Runtime Hataları

#### 4.3.1 Olası Hatalar
- **Three.js/WebGL:** Mobilde WebGL desteği olmadığında fallback
- **Service Worker:** Cache stratejisi hataları
- **LocalStorage:** Kota aşıldığında hata yönetimi
- **Audio context:** Otomatik çalma politikası ihlali
- **Promise rejection:** Yakalanmamış promise'lar

#### 4.3.2 Hata Yönetimi Stratejisi
```javascript
// Mevcut: report.js ile Sentry entegrasyonu
// Geliştirme:
- window.onerror ve unhandledrejection hook'ları
- Graceful degradation (WebGL yoksa 2D mod)
- LocalStorage fallback (IndexedDB veya memory)
```

### 4.4 Test Hataları

#### 4.4.1 Mevcut Test Durumu
- **Unit test:** 25 dosya, Vitest
- **E2E:** smoke.spec.js, Playwright
- **Coverage:** V8 provider, HTML rapor

#### 4.4.2 Potansiyel Sorunlar
- jsdom ortamında DOM manipülasyonu testleri
- Mock edilmemiş externals (Three.js, Sentry)
- Async test zamanlaması
- E2E'de dev server bağımlılığı

---

## 5. Detay: Refactoring

### 5.1 Hedef İlkeler

#### 5.1.1 Modülerlik
- **Amaç:** js/game/, js/screens/, js/engine/ arası bağımlılık azaltma
- **Yaklaşık:** Dependency injection, interface'ler (JSDoc typedef)
- **Hedef:** Her modülün bağımsız test edilebilirliği

#### 5.1.2 SOLID / Clean Code
- **Tek Sorumluluk:** Her fonksiyon tek bir iş yapmalı
- **Fonksiyon Boyutu:** Max 50 satır (şu an bazıları 100+ olabilir)
- **Karmaşıklık:** Döngüsel bağımlılık yok, max 3 seviye iç içe

#### 5.1.3 DRY (Don't Repeat Yourself)
- **Tespit:** Duplike kod kalıpları araştır
- **Çözüm:** Yardımcı fonksiyonlara taşıma
- **Örnek:** Event handler pattern'leri, DOM manipülasyonları

#### 5.1.4 Type Safety (JSDoc)
- **Mevcut:** jsconfig.json ile checkJs:true
- **Geliştirme:** Tüm export edilen fonksiyonlara JSDoc typedef
- **Hedef:** IDE autocomplete ve hata yakalama kalitesi

#### 5.1.5 Test Edilebilirlik
- **Bağımlılık enjeksiyonu:** Hardcoded bağımlılıkları parametre olarak geçir
- **Mock kolaylığı:** Pure fonksiyonlara odaklan
- **Test fixture'ları:** Ortak test verilerini merkezileştir

### 5.2 Mevcut Kod Kalitesi Sorunları

#### 5.2.1 Olası Sorun Alanları
- `game/index.js` çok büyük olabilir (public API + mantık)
- `game/state.js` global state yönetimi
- `screens/game.js` vs `game/index.js` karışıklığı (ESki/Yeni import)
- `utils/helpers.js` muhtemelen çok fazla şey içeriyor
- Event listener yönetimi (cleanup eksikliği)

#### 5.2.2 Refactoring Önceliği
1. **High:** game/index.js分割 (game core + public API)
2. **High:** state management iyileştirme
3. **Medium:** Event listener lifecycle management
4. **Medium:** Helpers fonksiyon bölme
5. **Low:** TypeScript'e geçiş (uzun vadeli)

### 5.3 Uygulama Stratejisi

#### 5.3.1 Kademeli Yaklaşım
- Her refactoring adımı ayrı bir commit/branch
- Refactoring sonrası tüm testlerin geçmesi zorunlu
- Coverage düşüşüne izin verilmez

#### 5.3.2 Refactoring Sırası
1. **Aşama 1:** Kod analizi ve sorun haritası çıkarma
2. **Aşama 2:** Kritik refactor'lar (state, game/index)
3. **Aşama 3:** DRY ve helper optimizasyonu
4. **Aşama 4:** JSDoc typedef geliştirmesi
5. **Aşama 5:** Test edilebilirlik iyileştirmeleri

---

## 6. Kısıtlar ve Riskler

### 6.1 Teknik Kısıtlar
- **Framework:** Vanilla JS (framework geçışı yok)
- **Browser Support:** Modern tarayıcılar (ES2022+)
- **PWA:** Service Worker cache stratejisi korunmalı
- **Deployment:** Vercel statik hosting

### 6.2 Riskler

| Risk | Olasılık | Etki | Azaltma |
|------|----------|------|---------|
| Refactoring regression | Orta | Yüksek | Kapsamlı test, feature flag |
| Performans regresyonu | Düşük | Orta | A/B testing, Lighthouse CI |
| A11y uyumsuzluk | Düşük | Orta | WAVE tool, screen reader test |
| Test Coverage düşüşü | Orta | Orta | Coverage gate, PR checks |

### 6.3 Bağımlılıklar
- Three.js (3D sahne) — opsiyonel, devre dışı bırakılabilir
- Sentry (hata takibi) — opsiyonel, graceful degradation
- vite-plugin-pwa — PWA için gerekli

---

## 7. Test Stratejisi

### 7.1 Mevcut Testler
- **Unit:** Vitest + jsdom, 25 dosya
- **E2E:** Playwright, smoke.spec.js
- **CI:** GitHub Actions (lint + test + build)

### 7.2 Geliştirme Planı
1. **Performans testleri:** Lighthouse CI ekleme
2. **A11y testleri:** axe-core integration
3. **Visual regression:** Playwright screenshot testleri
4. **Coverage gate:** PR'larda minimum %60 coverage

### 7.3 Doğrulama Komutları
```bash
npm run lint          # ESLint
npm test              # Vitest birim testler
npm run test:e2e      # Playwright E2E
npm run verify        # lint + test + build
npx lighthouse        # Manuel Lighthouse audit
```

---

## 8. Teslimat Planı

### 8.1 Kademeli Teslimat
- **Faz 1 (1 hafta):** Kritik bug'lar + A11y (runtime hataları, a11y denetimi)
- **Faz 2 (1 hafta):** Performans optimizasyonu (CSS + Canvas)
- **Faz 3 (2 hafta):** Refactoring (modülerlik, SOLID)
- **Faz 4 (Sürekli):** Test geliştirmesi + dokümantasyon

### 8.2 Acceptance Criteria
- [ ] Tüm mevcut testler geçiyor
- [ ] Yeni testler ekleniyor (coverage artışı)
- [ ] Lighthouse mobil skoru ≥80
- [ ] WCAG 2.1 AA uyumluluğu
- [ ] ESLint zero-warning
- [ ] Tüm ekran boyutlarında test edildi
- [ ] Dokümantasyon güncellendi

---

## 9. Kaynaklar

### 9.1 Proje Dosyaları
- README.md — Proje genel bakış
- package.json — Bağımlılıklar
- vite.config.js — Build yapılandırması
- vitest.config.js — Test yapılandırması
- mobile-performance-investigation-spec.md — Mevcut performans analizi

### 9.2 Referanslar
- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [Lighthouse Scoring](https://web.dev/performance-scoring/)
- [Vite Performance](https://vitejs.dev/guide/features.html)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)

---

**Onay Bekleyenler:**
- [ ] Kullanıcı onayı
- [ ] Teknik mimari onayı
- [ ] Test stratejisi onayı
