# Дош — Profesyonel Oyun Geliştirme Planı

> **Hedef:** Tek dosyalı (single-file) prototip → sürdürülebilir, ölçeklenebilir,
> dağıtılabilir, profesyonel kalitede bir oyun platformu.
>
> **Dil:** Planın tamamı Türkçe; oyun içi metinler Çeçence (Cyrillic) kalacak.

---

## 🏗️ Aşama 1: Mimari Modernizasyon (Temel)

### 1.1 Monolit → Modüler Yapı

**Sorun:** `index.html` içinde ~1200 satır CSS + ~900 satır JS. Tek dosya prototip
için hızlıdır ancak profesyonel ekip/ölçek için sürdürülemez.

**Yapılacaklar:**
```
dosh-oyun/
├── index.html                  # Ana giriş noktası (sadece import)
├── css/
│   ├── variables.css            # :root değişkenleri + temalar
│   ├── layout.css               # grid, main, screen, topbar
│   ├── components.css           # .btn, .cell, .bub, .panel, .tool vb.
│   ├── animations.css           # @keyframes, pop, shake, float, flip3d vb.
│   └── themes.css               # body.theme-* blokları
├── js/
│   ├── main.js                  # ES6 module entry: init(), routing
│   ├── data/
│   │   ├── levels.js            # LEVELS dizisi (100 seviye)
│   │   └── dictionary.js        # INFO sözlüğü + kelime doğrulama
│   ├── engine/
│   │   ├── grapheme.js          # norm(), splitG(), dispG(), DIGRAPHS
│   │   ├── grid.js              # buildGrid(), fillCell(), onCellTap()
│   │   ├── wheel.js             # buildWheel(), drag handling, submitSel()
│   │   ├── scoring.js           # puan hesaplama, combo, star sistemi
│   │   └── save.js              # load(), save(), SAVE_KEY
│   ├── screens/
│   │   ├── home.js              # ana ekran, günlük hediye
│   │   ├── map.js               # seviye haritası
│   │   ├── game.js              # oyun ekranı, seviye başlatma
│   │   ├── settings.js          # ayarlar paneli
│   │   ├── stats.js             # istatistik paneli
│   │   └── dictionary.js        # sözlük paneli
│   ├── fx/
│   │   ├── audio.js             # ac(), tone(), SFX, MUSIC
│   │   ├── particles.js         # confetti, flyCoins, fx canvas
│   │   └── three-scene.js       # GL modülü (3D dağlar)
│   └── utils/
│       ├── dom.js               # $(), show(), toast(), openPanel()
│       └── helpers.js           # today(), vibrate(), updateCoins()
├── assets/
│   ├── fonts/                   # woff2 dosyaları
│   ├── icons/                   # PWA ikonları
│   └── sounds/                  # (ileride) gerçek ses dosyaları
├── three.min.js                 # (üçüncü parti, değişmez)
└── fx.js                        # (üçüncü parti, değişmez)
```

**Fayda:**
- Git çakışmaları azalır, takım çalışması mümkün olur
- Lazy-loading → başlangıç yükü küçülür
- Her modül birim test edilebilir
- Yeni özellik eklemek için mevcut kodu kırmak zorlaşır

### 1.2 ES6 Module + Build Sistemi

```json
// package.json
{
  "name": "dosh",
  "version": "4.0.0",
  "type": "module",
  "scripts": {
    "dev":    "vite",
    "build":  "vite build",
    "preview":"vite preview",
    "test":   "vitest",
    "lint":   "eslint js/ --fix",
    "deploy": "node scripts/deploy.mjs"
  }
}
```

**Neden Vite?**
- Native ES module geliştirme (derleme yok, anında yansıma)
- `npm run build` → otomatik minifikasyon + code splitting + hash'leme
- CSS import desteği (CSS modülleri)
- Üretim çıktısı `dist/` klasörü → direkt deploy

**Alternatif:** Rollup (daha hafif) veya Webpack (daha eski).

### 1.3 State Yönetimi

**Şu anki durum:** Global `S` (kayıt) ve `G` (aktif oyun) nesneleri.

**İyileştirme:** Merkezi bir store ile state değişikliklerini izle:

```js
// store.js
const store = {
  state: { save: null, game: null, ui: { screen: 'home', panel: null } },
  listeners: new Map(),
  subscribe(key, fn) { ... },
  dispatch(action, payload) { ... }
};
```

**Fayda:**
- State değişiklikleri merkezden yönetilir
- `localStorage` otomatik senkronizasyon
- UI bileşenleri değişiklikleri dinler, kendiliğinden güncellenir
- Debugging kolaylaşır (Redux DevTools benzeri)

---

## 🎮 Aşama 2: Oyun İçeriği ve Feature'lar

### 2.1 Seviye Düzenleyici (Level Editor)

**Sorun:** Şu an seviyeler elle JSON yazılarak ekleniyor. 100 seviye var ama
elle üretim yavaş ve hata yapmaya açık.

**Çözüm 1 — Görsel Düzenleyici (öncelikli):**
- Ayrı bir HTML sayfası (`editor.html`) veya oyun içi bir mod
- Tahtaya kelimeleri sürükle-bırak
- Otomatik harf seti oluşturma + bonus kelime önerme
- JSON çıktısı üretme (`Kopyala` butonu)
- Izgara çakışma denetimi (aynı hücrede farklı harf olmasın)

**Çözüm 2 — Yarı Otomatik Seviye Üreteci:**
- Verilen bir kelime listesinden crossword grid oluşturan algoritma
- Zorluk derecesine göre grid boyutu belirleme
- Boşlukları doldurmak için rastgele harf yerleştirme

### 2.2 Yeni Oyun İçerikleri

| Özellik | Açıklama | Öncelik |
|---|---|---|
| **Günlük Bulmaca** | Her gün benzersiz, küçük bir bulmaca. Tüm oyuncular aynı. | Yüksek |
| **Sınırsız Mod** | Rastgele üretilen sonsuz seviye. Coin kazandırmaz. | Yüksek |
| **Turnuva/Haftalık** | Haftalık liderlik tablosu, en çok kelimeyi kim bulacak? | Orta |
| **Tema Kilitleri** | Her paketi bitirince yeni bir görsel tema veya arka plan | Orta |
| **Rozet/Başarı Sistemi** | "100 kelime", "Tüm yıldızlar", "İlk bonus" gibi rozetler | Orta |
| **İpucu Çeşitleri** | Harf silme, süre uzatma, otomatik tamamlama (hepsi coin ile) | Düşük |
| **Hikaye Modu** | Her paketin başında Çeçen kültüründen bir bilgi notu | Düşük |

### 2.3 Seviye Paketleri (Pack 5-8)

Şu an 4 paket var (100 seviye). Planlanan yeni paketler:

| Paket | Tema | Yaklaşık Seviye |
|---|---|---|
| 5 | **Безам** — Sevgi, aile, akrabalık | 25 (101-125) |
| 6 | **Лама** — Gelenek, görenek, atasözü | 25 (126-150) |
| 7 | **Тайп** — Çeçen toplumu, tarih | 25 (151-175) |
| 8 | **Къам** — Doğa, evren, çağdaş hayat | 25 (176-200) |

Her yeni kelime için Çeçence doğrulama şartı (wiktionary + anadili kontrolü).

---

## 🧪 Aşama 3: Test ve Kalite Güvence

### 3.1 Birim Testleri (Vitest)

```
js/engine/
├── grapheme.test.js    # norm(), splitG(), dispG() testleri
├── scoring.test.js     # starsFor(), puan hesaplama
├── grid.test.js        # grid oluşturma, hücre yerleşimi
├── save.test.js        # kayıt yükleme/kaydetme, versiyon migrasyonu
└── levels.test.js      # Tüm LEVELS'in tutarlılığı (harfler -> kelimeler)
```

**Örnek testler:**
- Her seviyedeki kelimenin harfleri, `letters` dizisinde tanımlanmış mı?
- Her bonus kelime aynı harflerden oluşuyor mu?
- Aynı hücrede birden fazla kelimenin harfi farklı mı? (çakışma kontrolü)
- `norm()` fonksiyonu tüm palochka varyantlarını (Ӏ, ӏ, i, I) tek norma indirgiyor mu?
- `splitG()` 2 karakterli digrafları (гӀ, кх, къ, тӀ, хь vb.) tek eleman olarak görüyor mu?

### 3.2 E2E Testleri (Playwright)

**Mevcut skill:** `webapp-testing` (`.agents/skills/`).

**Test senaryoları:**
1. Splash ekranı → otomatik kaybolma
2. Ana ekran → Başlat → Harita → Seviye 1 başlatma
3. Çarktan harf seçme ve kelime oluşturma
4. İpucu kullanma (coin düşümü kontrolü)
5. Günlük hediye alma
6. Tema değiştirme
7. Panel açma/kapama (settings, stats, dictionary)
8. Seviye tamamlama akışı
9. `localStorage` kaydı doğrulama
10. Mobil viewport (375×667) uyumluluğu

### 3.3 Görsel Regresyon Testleri

- Her tema için ekran görüntüsü karşılaştırması
- 3D sahnenin render doğruluğu (temel olarak)
- PWA manifest + service worker doğrulama

---

## 🚀 Aşama 4: Performans ve Dağıtım

### 4.1 Performans İyileştirmeleri

| Ölçüt | Hedef | Mevcut (tahmini) |
|---|---|---|
| İlk yükleme (LCP) | < 1.5 sn | ~2-3 sn (gömülü Three.js + tüm seviyeler) |
| İlk etkileşim (FID) | < 100 ms | ~200 ms |
| JS bundle | < 100 KB (kritik) | ~180 KB (küçültülmemiş tek blok) |
| Lighthouse PWA | > 90 | ~70-80 |
| Çalışma süresi FPS | 60 (3D kapalı), 30 (3D açık) | ~30-45 |

**Yapılacaklar:**
- Three.js lazy-load: Sadece oyun ekranına geçince yükle
- Seviye verilerini lazy-load: Sadece gerekli paketi yükle
- CSS kritik yol: Inline kritik CSS, gerisini async yükle
- Fontları `font-display: swap` ile yükle (zaten var)
- Canvas boyutlandırmayı throttling (resize olayında)
- 3D sahne için `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))` (zaten 2.5)

### 4.2 CI/CD (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI/CD
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test
      - run: npm run lint
  deploy:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

**Alternatif deploy hedefleri:**
- **Netlify:** Otomatik deploy + form handling + function support
- **Cloudflare Pages:** Ücretsiz, global CDN, Workers ile backend mantığı
- **Vercel:** Serverless functions + analytics
- **itch.io:** Oyun portföyü için

### 4.3 App Store Dağıtımı

**Android (APK/AAB) — Capacitor:**
```bash
npm init @capacitor/app dosh-cap
npx cap copy
npx cap open android   # Android Studio -> Build -> APK
```

**iOS (IPA):**
```bash
npx cap add ios
npx cap open ios       # Xcode -> Archive -> App Store
```

**PWA (mevcut):** Android/iOS ana ekranına eklenebilir. Mağaza geliri hedefleniyorsa
Capacitor + Google Play / App Store yol izlenir.

---

## 📊 Aşama 5: Analitik ve Kullanıcı Yönetimi

### 5.1 Telemetri (mahremiyet odaklı)

**Gerekli minimum veri (anonim, izinli):**
- Tamamlanan seviye sayısı
- Ortalama ipucu kullanımı
- En sık ziyaret edilen ekran
- Tema tercihleri
- Oyun oturumu süresi

**Araç seçenekleri:**
- **Plausible / Umami** — Gizlilik odaklı, self-host, hafif
- **PostHog** — Product analytics + feature flags + session recording
- **Google Analytics 4** — Ücretsiz, kapsamlı (ancak gizlilik endişesi)
- **TelemetryDeck** — Kullanıcı izni gerektirmez, anonim

### 5.2 Bulut Senkronizasyonu

**Feature:** Hesap oluşturmadan cihazlar arası ilerleme senkronizasyonu.

**Yöntem:**
- **Cloudflare KV + Turnstile:** Düşük maliyetli, bot korumalı
  - Kayıt şifrelenir (`Crypto.subtle` ile istemci tarafında)
  - PIN/QR kod ile cihaz eşleştirme
  - `localStorage` → buluta yedekleme, gerektiğinde geri yükleme
- **Apple iCloud / Google Drive:** Platform özgü, daha derin entegrasyon

---

## 🎨 Aşama 6: UI/UX Profesyonelleştirme

### 6.1 Erişilebilirlik (A11Y) — İleri Seviye

| Eksik | Yapılacak | WCAG Kriteri |
|---|---|---|
| Çark sürükleme klavye | `Tab` ile baloncuklar arası gezinme + `Enter` seçim | 2.1.1 |
| Grid hücre klavye navigasyonu | Yön tuşları + `Space` ile hücre seçimi | 2.1.2 |
| Renk kontrastı tüm temalarda | Her tema için ayrı kontrat denetimi (4.5:1 metin, 3:1 büyük metin) | 1.4.3 |
| Ekran okuyucu duyuruları | `aria-live` bölgelerine tüm oyun olaylarını ekle | 4.1.3 |
| Dokunmatik hedef boyutları | Tüm tıklanabilir öğeler ≥ 48×48 (şu an .tool 52×52 ✅) | 2.5.8 |
| Dil tanımı | `html[lang=ce]` (zaten var), gerekirse `xml:lang` | 3.1.1 |

### 6.2 Animasyon Sistemi

**Sorun:** Animasyonlar CSS'e dağılmış durumda.

**Çözüm:** Merkezi bir animasyon kütüphanesi veya CSS class sistemi:
- `.anim-fadeIn`, `.anim-slideUp`, `.anim-pop`, `.anim-shake`
- Tümü `prefers-reduced-motion` tarafından susturulur (zaten var ✅)
- Giriş çıkış geçişleri (screen'ler arası)
- Daha akıcı seviye geçişleri (zoom + fade)

### 6.3 Mobil Öncelikli Tasarım Denetimi

- Standart 375×667 (iPhone SE) ve 390×844 (iPhone 14) viewport'ta test
- Çark boyutu dinamik (zaten var, `Math.max(190, Math.min(300, ...))`)
- Grid hücreleri minimum 44×44 (Apple HIG)
- Safe area insets (zaten `env(safe-area-inset-top/bottom)` kullanılıyor ✅)
- `touch-action: manipulation` (zaten var ✅)

---

## 🔧 Aşama 7: Altyapı ve Araçlar

### 7.1 Geliştirme Ortamı

- **VS Code workspace** — önerilen eklentiler listesi
- **ESLint + Prettier** — kod biçimlendirme, tutarlı stil
- **Husky + lint-staged** — commit öncesi lint + test
- **Commitlint** — conventional commits (feat:, fix:, chore:, docs: vb.)

### 7.2 Dokümantasyon

- **API Dokümantasyonu:** JSDoc ile fonksiyon imzaları
- **Oyun Tasarım Belgesi (GDD):** Oyunun tam konsept dokümanı (Çeçen kültürü,
  kelime politikası, zorluk eğrisi)
- **CONTRIBUTING.md:** Yeni seviye nasıl eklenir, kod standartları
- **CHANGELOG.md:** Sürüm geçmişi, her sürümde ne değişti

### 7.3 Yedekleme ve Sürüm Yönetimi

- Git repo başlat (şu an git yok!)
- `.gitignore` ile `node_modules/`, `dist/`, `*.zip` dışarıda
- Semantic versioning: `v4.0.0`, `v4.1.0`, `v5.0.0`
- Her sürümde `dosh-oyun-vN.zip` oluştur + release notları
- `sw.js` cache versiyonunu sürümle eşitle

---

## 💰 Aşama 8: İş Modeli ve Para Kazanma

> **Not:** Oyun şu an tamamen ücretsiz. Profesyonelleşme sürecinde para kazanma
> seçenekleri değerlendirilebilir ancak topluluk projesi ruhu korunmalı.

| Yöntem | Açıklama | Topluluk Etkisi |
|---|---|---|
| **Bağış (gönüllü)** | Patreon / Ko-fi / Buy Me a Coffee | Olumlu — zorunlu değil |
| **Reklam (gönüllü)** | Seviye arası banner (hafif, rahatsız etmeyen) | Nötr — opsiyonel izle |
| **Tek seferlik "Paket"** | Yeni tema veya özel görünüm satışı | Orta — içerik kilidi |
| **Coin satışı** | Çok fazla ipucu almak isteyenler için | Nötr — oyun içi ekonomi |
| **Sponsor** | Çeçen kültür kurumları, dil dernekleri | Olumlu — misyon uyumlu |

---

## 📅 Zaman Çizelgesi (Tahmini)

| Aşama | Süre | Bağımlılık |
|---|---|---|
| **A1:** Mimari modernizasyon (Vite + modüler) | 2-3 hafta | Yok |
| **A3:** Test altyapısı | 1-2 hafta | A1 (modüller) |
| **A4:** CI/CD + dağıtım | 1 hafta | A1 |
| **A2:** Seviye düzenleyici | 3-4 hafta | A1 |
| **A2:** Yeni içerik (paket 5-8) | 4-6 hafta | A2 düzenleyici |
| **A5:** Analitik | 1 hafta | Yok |
| **A6:** A11Y + tasarım iyileştirme | 2-3 hafta | Yok |
| **A7:** Altyapı (git, doküman, CI) | 1 hafta | Yok |
| **A5:** Bulut senkronizasyonu | 2-3 hafta | A1 |
| **A4:** App Store dağıtımı | 2-3 hafta | A1 |
| **A8:** Para kazanma | 1-2 hafta | A1 |

**Toplam:** ~20-30 hafta (tek geliştirici) veya ~8-12 hafta (2-3 kişi)

---

## ✅ Öncelikli Eylemler (İlk Adım)

1. **Git repo başlat** — sürüm kontrolü olmadan profesyonelleşme mümkün değil
2. **package.json + Vite** kurulumu — modüler yapıya geçişin ilk adımı
3. **Grapheme engine** testini yaz — mevcut fonksiyonları test et
4. **Levels testini yaz** — tüm seviye verilerinin tutarlılığını doğrula
5. **`sw.js` cache** sürümünü `"dosh-v5"` yap
6. **KELIME_RAPORU.md**'yi güncelle ve takip edilecek şüpheli kelimeleri anadili
   konuşanlara danış

---

*Plan sürümü: 1.0 · Son güncelleme: 2 Temmuz 2026*
