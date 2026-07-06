# 📊 DOSH OPTIMIZASYON & GELİŞTİRME PLANI
**v4.0.0 → v4.1.0**

---

## 🎯 EKSEKÜTIF ÖZET

**Dosh** üretim hazır kalitede, ancak 10+ alanda ölçeklenebilirlik ve DX iyileştirmesi var. Optimizasyonlar 4 gruba ayrılıyor:

1. **Performance** (Bundle, Caching, Lazy Loading)
2. **Testing & Quality** (E2E Kapsamı, Error Boundaries)
3. **Code Quality** (JSDoc, Refactoring, Type Safety)
4. **Features & PWA** (Offline, Sync, Desktop Shortcuts)

---

## 🚀 HIZLI KAZANİMLAR (1-2 saat)

### ✅ P0: Production Debug Modu Temizlemesi
**Status:** Kolay  
**Impact:** Bundle boyutu, kod temizliği

**Problem:**
```javascript
// main.js:68-72 — debug modu tree-shake olmayabilir
if (import.meta.env.DEV && urlParams.get('debug') === '1') {
  window.__DOSH_DEBUG__ = true;
  console.warn("[DEBUG] Debug modu...", S);  // S nesnesi tüm bundle'a eklenir
}
```

**Çözüm:** Debug modu define plugin'i ile kapat
```javascript
// vite.config.js
define: {
  __DEBUG__: false,  // Production'da tree-shake olur
}

// main.js
if (__DEBUG__ && urlParams.get('debug') === '1') { ... }
```

---

### ✅ P1: console.warn/error Üretimde Kapat
**Status:** 15 dakika  
**Impact:** Bundle boyutu (~5-10KB), runtime logger

**Problem:** 15+ console.warn çağrısı production'da geçersiz

**Çözüm:** Logger modülü
```javascript
// js/utils/logger.js (yeni)
export function warn(...args) {
  if (!import.meta.env.PROD) console.warn(...args);
}
export function error(...args) {
  if (!import.meta.env.PROD) console.error(...args);
}

// js/engine/save.js
import { warn, error } from "../utils/logger.js";
// console.warn("[save]...") → warn("[save]...")
```

---

### ✅ P2: Sentry DSN Environment Doğrulama
**Status:** 5 dakika  
**Impact:** Hata raporlaması güvenliği

**Problem:** `VITE_SENTRY_DSN` env var doğrulanmıyor; yanlış DSN → hataları öğrenmez

**Çözüm:** vite.config.js'de kontrol
```javascript
const sentryDsn = process.env.VITE_SENTRY_DSN;
if (!sentryDsn) {
  console.warn("[config] VITE_SENTRY_DSN yok, Sentry devre dışı");
}
```

---

## 📈 ORT-DÜZEY İYİLEŞTİRMELER (3-5 saat)

### ✅ P3: E2E Test Kapsamını Genişlet
**Status:** Orta  
**Impact:** Test güveni, regresyon yakalama

**Mevcut:** 6 test (smoke)
**Hedef:** 12+ test (oyun akışları kapsamlı)

**Yeni Senaryolar:**
```javascript
// e2e/smoke.spec.js'ye ekle

test('level çözümü → ödül akışı', async ({ page }) => {
  // Tekerlek → Enter seçim → kelime bulma → ödül ekranı
  // Coin animasyonu, combo tetikleme, yıldız kazanma
});

test('hata → yanlış kelime shake', async ({ page }) => {
  // Yanlış kelime → shake animasyonu → geri say
});

test('ipuçları kullanımı', async ({ page }) => {
  // Harf ipucu → hedef ipucu → değnek ipucu
  // Coin çıkarma, UI güncelleme
});

test('günlük mod sınırlaması', async ({ page }) => {
  // Daily mode → S.stars YAZMIYOR
  // Harita ilerlemesi KAPATILTı
});

test('tema değişim → 3D yenileme', async ({ page }) => {
  // Ayarlar → tema değiştir → 3D GL.retheme() çalışıyor
});

test('mobilden error → toast görünüyor', async ({ page }) => {
  // localStorage quota error → toast bildirimi
});
```

---

### ✅ P4: Error Boundary Katmanları Ekle
**Status:** Orta  
**Impact:** Crash recovery, UX

**Problem:** Level yükleme hatası → sessiz başarısız, reload gerekli

**Çözüm:** game.js'de try/catch
```javascript
async function startLevel(id, opts) {
  try {
    const lv = await getLevel(id);
    if (!lv) throw new Error(`Level ${id} bulunamadı`);
    setG({ lv, ... });
    show("scr-game");
  } catch (e) {
    error("[game]", e);
    toast("Seviye yüklenemedi. Harita'ya dön.", "bad");
    show("scr-map");  // Güvenli fallback
  }
}
```

---

### ✅ P5: JSDoc Örnekleri & Type Coverage Tamamla
**Status:** 2 saat  
**Impact:** DX, IDE autocomplete

**Boş Dosyalar:**
- `js/game/state.js` — @typedef var ama örnek yok
- `js/utils/helpers.js` — 20 fonksiyon, 3 JSDoc
- `js/data/dictionary.js` — tanımlar eksik

**Hedef:** 95%+ JSDoc coverage (public API'lar)

```javascript
/**
 * İpuçlarını uygula ve para çıkar
 * @param {string} type - 'letter' | 'target' | 'wand'
 * @returns {{ success: boolean; cost: number; message?: string }}
 * @example
 * applyHint('letter')  // → { success: true, cost: 25, ... }
 */
export function applyHint(type) { ... }
```

---

### ✅ P6: PWA Manifest Desktop Kısayolları Ekle
**Status:** 20 dakika  
**Impact:** Masaüstü UX, bağlama menüsü

**Problem:** PWA manifest açık değil; kısayollar yok

**Çözüm:** vite.config.js manifest'e shortcuts ekle
```javascript
shortcuts: [
  {
    name: 'Денна дош',
    short_name: 'Денна',
    description: 'Daily puzzle',
    url: '/?daily=1',
    icons: [{ src: 'icon-192.png', sizes: '192x192' }]
  },
  {
    name: 'ТӀегӀанийн карта',
    short_name: 'Карта',
    description: 'Level map',
    url: '/?map=1'
  }
]
```

Sonra `/?map=1` deeps link'ini main.js'de işle.

---

## 🏗️ BÜYÜK REFACTORİNGLER (5-8 saat)

### ✅ P7: Chunk Boyut Optimizasyonu
**Status:** Karmaşık  
**Impact:** İlk yük (-20%), kayıt boyutu

**Analiz:**
```bash
npm run build
npx vite-bundle-visualizer dist/
```

**Sonra:**
- Gereksiz polyfill'ler kaldır
- Sentry chunk'ını optional yap (analytics koşullu)
- data-info.js'yi gzip optimize et (sıkıştırma)

---

### ✅ P8: Offline Mode (Service Worker Geliştirmeler)
**Status:** 3 saat  
**Impact:** Oyun offline oynanabilir

**Mevcut:** VitePWA auto caching
**Yeni:** Offline kullanım alanları

```javascript
// js/engine/save.js'de check
const isOnline = navigator.onLine;
if (!isOnline && localStorage.unavailable) {
  toast("Offline modunda oynanabilir, ancak kayıt olmayacak", "info");
}

// IndexedDB fallback (localStorage quota aşılırsa)
async function saveWithFallback(data) {
  try {
    localStorage.setItem('dosh-save-v1', JSON.stringify(data));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      // IndexedDB'ye geç
      await idb.put('dosh-saves', data);
    }
  }
}
```

---

### ✅ P9: Pervasive Error Logging (Sentry Entegrasyonu Denetim)
**Status:** 1 saat  
**Impact:** Production debugging

**Kontrol Et:**
- VITE_SENTRY_DSN set mi?
- Error reporting enable mi?
- Çok fazla spam filtrelemesi var mı? (sampled event'ler)

**İyileştirme:**
```javascript
// utils/report.js
Sentry.init({
  dsn: DSN,
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  profilesSampleRate: 0.01,
  beforeSend(event) {
    // Spam filtrele (localStorage, 404'ler)
    if (event.message?.includes('QuotaExceeded')) return null;
    return event;
  }
});
```

---

### ✅ P10: İçerik Doğrulama Pipeline Otomasyonu
**Status:** 2 saat  
**Impact:** Content QA, wiktionary sync

**Problem:** coverage.test.js manuel, yeni sözcükler break'leyebilir

**Çözüm:** GitHub Actions workflow
```yaml
# .github/workflows/content-check.yml
on: [pull_request]
jobs:
  validate-content:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test -- coverage.test.js
      - run: node scripts/analyze-coverage.mjs --md
      - if: failure()
        run: exit 1 # PR blokkası
```

---

## 🎯 UZUN VADELİ ÇALIŞMALAR (1+ haftalar)

### 🔮 P11: Type Safety Sürümü (JSDoc → TypeScript Migration)
**Status:** 1-2 hafta  
**Impact:** DX, IDE support, refactoring güvenliği

**Aşama:**
1. `js/engine/store.ts` → `@type` dış dosyası
2. `js/game/state.ts` → gerçek types
3. Async/await type'lı API'lar
4. Tam TypeScript (isteğe bağlı, gradual)

---

### 🔮 P12: Multiplayer/Leaderboard (Gelecek Versiyon)
**Status:** Konsep  
**Impact:** Engagement, sosyal özellikler

- Günlük puzzle paylaşım (yapılmış) → global leaderboard
- Friend challenges
- Real-time score sync

---

## 📋 KONTROL LİSTESİ

| P | İşlem | Dosyalar | Saat | Başladı |
|---|-------|----------|------|---------|
| 0 | Debug modu tree-shake | vite.config.js, js/main.js | 0.5 | ⬜ |
| 1 | Logger modülü | js/utils/logger.js, 15 dosya | 1 | ⬜ |
| 2 | Sentry DSN kontrol | vite.config.js, js/utils/report.js | 0.25 | ⬜ |
| 3 | E2E test expansion | e2e/smoke.spec.js | 2 | ⬜ |
| 4 | Error boundaries | js/screens/game.js, js/game/index.js | 1 | ⬜ |
| 5 | JSDoc tamamlama | 5+ dosya | 2 | ⬜ |
| 6 | PWA shortcuts | vite.config.js, js/main.js | 0.5 | ⬜ |
| 7 | Bundle optimizasyonu | vite.config.js, rollup | 1.5 | ⬜ |
| 8 | Offline mode | js/engine/save.js, indexeddb | 2 | ⬜ |
| 9 | Sentry audit | js/utils/report.js | 1 | ⬜ |
| 10 | Content validation CI | .github/workflows/ | 1.5 | ⬜ |

**Toplam ETA:** 13-15 saat (3 işçi günü)

---

## 💡 QUICK WINS (Başlamak için)

**Hemen yapılabilir (bugün):**
1. Logger modülü oluştur (P1) — 30 min
2. E2E test 1-2 tane ekle (P3) — 1 saat
3. JSDoc örnekleri için 3 dosya güncelle (P5) — 1 saat
4. Sentry DSN kontrol ekle (P2) — 15 min

**Sonuç:** +30-50KB bundle tasarrufu, +2 E2E test, +90 daha iyi IDE hints

---

## 📞 BAĞLANTILI DOSYALAR
- `AGENTS.md` — Proje politikaları
- `CLAUDE.md` — Developer guide
- `.github/workflows/ci.yml` — CI pipeline
- `package.json` — Dependencies ve scripts
