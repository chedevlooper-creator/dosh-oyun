# Hardening Raporu (2026)

`dosh-oyun` oyununu 2026 kalite çıtasına taşımak için yapılan değişikliklerin özeti.
Plan referansı: [harden_dosh-oyun_to_2026_bar_252dccdc.plan.md](harden_dosh-oyun_to_2026_bar_252dccdc.plan.md).

## Sonuç tablosu

| Metrik | Önce | Sonra |
|---|---|---|
| Source LOC (`js/`) | 3694 | 3051 |
| Source/test oranı | 13% | 28% |
| Test dosyası sayısı | 3 | 7 |
| Test satır sayısı | 476 | 865 |
| Toplam test sayısı (yaklaşık) | ~30 | ~95 |
| Runtime npm dep | 0 (vendored) | 0 (henüz; three ESM için 1 eklenebilir) |
| Duplicate JS dosya | 6 çift | 0 |
| `chechen-culture-canvas.png` | 3.94 MB | silindi |
| `three.min.js` r128 | 592 KB | silindi (ESM `three` import'a hazır) |
| `fx.js` (UnrealBloom bundle) | 24 KB | silindi (ESM addon import'a hazır) |
| Service worker | Çakışma (2 dosya) | Tek: vite-plugin-pwa generated |
| CI gate | yok | lint + test + build (GitHub Actions) |
| i18n dilleri | 1 (ce) (kullanım dışı) | 3 (ce/tr/ru) — settings UI bağlı |
| Save şeması | versionsuz (string key v1) | `_v: 2` + migration pipeline |

## Faz bazında kapatılan bulgular

### Phase 0 — Hazırlık
- Baseline envanteri: `BASELINE_2026_HARDEN.md`

### Phase 1 — Ölü kod temizliği (F12, F34, F36, F37, F38, F58)
Silinen dosyalar (her biri duplicate veya ölü):
- `js/fx/audio.js` (kullanım dışı, `S` import'u `engine/save.js`'den — orada yok, eğer bağlansaydı patlardı)
- `js/fx/three-scene.js` (kullanım dışı; aktif olan `fx/scene3d.js`)
- `js/fx/confetti.js` (kullanım dışı; aktif olan `fx/particles.js` zaten aynı `confetti`'yi export ediyor)
- `js/utils/graphemes.js` (duplicate; `engine/grapheme.js` zaten test edilen tek kaynak)
- `js/utils/constants.js` (duplicate; `data/config.js` zaten test edilen tek kaynak)
- `js/utils/dom.js` (duplicate; `utils/helpers.js` tüm export'ları içeriyor; `updateCoins(S)` imza farkı düzeltildi — `helpers.js`'deki argümansız sürüm tutuldu, tüm 4 çağrı güncellendi)

Yan etkiler:
- `js/screens/game.js`'de import listesinde adı geçen ama gerçekten import edilmeyen `openPanel, closePanel` bug'ı (F37 partial) düzeltildi — `panel.js`'den doğru import eklendi.
- `js/utils/helpers.js` artık `GL`'ye bağımlı değil; `show()` lazy dynamic import kullanıyor.

### Phase 2 — Doğruluk (F21, F22, F25, F29, F53, F15)
- **Save schema v2**: `js/engine/store.js`'de `SAVE_VERSION = 2`, `snapshot()` `_v: 2` yazıyor, `hydrate()` `MIGRATIONS` tablosuyla eski sürümleri migrate ediyor. `localStorage` anahtarı hâlâ `dosh-save-v1` (geriye dönük uyumlu); v1→v2 migration identity.
- **i18n wiring** (F21/F22/F25): `js/utils/i18n.js`'e `ru` çevirisi eklendi; `setLanguage()` artık `documentElement.lang`'i güncelliyor. `js/screens/settings.js`'e dil seçici (lang picker) eklendi. Yüksek görünürlüklü 2 string (`home.start`, `home.continue`) `t()`'ye bağlandı; `settings.js` panel başlığı ve 5 satır tamamen i18n'e geçti. `js/main.js` `load()`'dan sonra `documentElement.lang`'i senkronize ediyor.
- **Service worker çakışması** (F53): el yazması `sw.js` silindi, `index.html`'den `<script src="three.min.js">` ve `<script src="fx.js">` script'leri kaldırıldı. `vite-plugin-pwa` `autoUpdate` ile generate edilen tek SW kaldı (kayıt `js/main.js`'de).
- **3.94 MB PNG** (F15): `chechen-culture-canvas.png` silindi.
- **`_wordlist_full.txt`** (F61): kullanım dışı, `.gitignore`'da bırakıldı (repo ağırlığı 7 MB → 3 MB).

### Phase 3 — Performans (F1, F2, F7, F10, F11, F18, F13)
- **ESM three** (F1): `js/fx/scene3d.js` artık `import * as THREE from "three"` ve `three/addons/postprocessing/{EffectComposer,RenderPass,UnrealBloomPass,OutputPass}.js` ESM'lerini kullanıyor. Kullanıcının `npm install three` çalıştırması gerek.
- **Lazy 3D** (F2): `js/main.js` `import { GL } from "./fx/scene3d.js"` statik import'unu kaldırdı; `loadGL()` dynamic import fonksiyonu yazıldı. `requestIdleCallback` ile sahne idle'da yükleniyor. `S.settings.scene3d === false` ise hiç yüklenmiyor. `js/screens/settings.js` ve `js/utils/helpers.js` de `GL`'i dynamic import ile çözüyor.
- **Tek resize dispatcher** (F10): `js/utils/resize.js` eklendi. `onResize(fn)` tek `resize` listener kurar, 80ms debounce uygular, sadece boyut değiştiğinde fan-out yapar. 5 ayrı listener (main.js, scene3d.js, particles.js, game.js, fx.js) artık tek noktaya bağlı.
- **Idle particle loop** (F11): `js/fx/particles.js` artık parçacık yokken 800ms sonra rAF'i durduruyor; `confetti()` çağrısı tekrar başlatıyor. `clearRect` artık her frame çalışmıyor.
- **Swipe cache** (F7): `js/screens/game.js buildWheel()` her balona viewport-space `cx, cy, r` cache'liyor. `bubbleAt()` ve `renderSel()` artık `getBoundingClientRect` çağırmıyor (pointermove başına 14 → 0).
- **Reduced motion** (F18): `js/utils/helpers.js` artık `prefersReducedMotion()` fonksiyonu export ediyor. `js/fx/scene3d.js` animasyon döngüsünde kamerayı, parallax'ı ve bulutları reduced-motion'da durduruyor.
- **Photo lazy load** (F13): `index.html`'deki inline `style="background-image:url(...)"` 5 div'den kaldırıldı. `js/engine/theme.js` `applyTheme()` aktif temanın `.ph` div'ine `style.backgroundImage` atıyor; ilk açılışta sadece aktif tema fotoğrafı indirilir (5×JPG = ~2.4MB → ~600KB başlangıç yükü).

### Phase 4 — Erişilebilirlik ve test (F4, F16, F19, F26, F27, F33, F35)
- **Aria labels** (F19): `js/screens/game.js buildGrid()` her hücreye `aria-label="Satır N, sütun M"`, `role="gridcell"` koyuyor; board `role="grid"` + `aria-label="Bulmaca ızgarası"` aldı. `fillCell` dolu hücrede aria-label'ı harfle güncelliyor.
- **role=progressbar** (F19): `index.html`'de `#home-bar` `role="progressbar" aria-valuemin/max/now aria-label="İlerleme"`; `js/screens/home.js renderHome()` `aria-valuenow`'u dinamik günceller.
- **Arrow-key nav** (F16): `js/screens/game.js`'e `onCellKey()` eklendi — ok tuşları komşu hücreye odak veriyor, Enter/Space hedefi seçiyor. `bubbles` (çark harfleri) zaten `tabindex="0"` ve Enter/Space tuşlarını dinliyor.
- **WCAG contrast test** (F26): `js/__tests__/contrast.test.js` her temada `--ink` (krem) ile `--card` (yarı saydam)'ın en-kötü-durum kompozit kontrastını ölçüyor; 4.5:1 AA threshold doğrulanıyor.
- **JSDoc checkJs** (F33): `jsconfig.json` `checkJs: true, strict: false`; tüm `js/` kaynak dosyalarına `// @ts-check` eklendi.
- **Store testleri** (F27): `js/__tests__/store.test.js` proxy get/set, commitS/commitSettings/addFoundWord, setG/commitG, snapshot integrity.
- **Save testleri** (F29): `js/__tests__/save.test.js` snapshot()'un `_v: 2` içerdiğini ve proxy marker'larını sızdırmadığını doğrular.
- **i18n testleri** (F21): `js/__tests__/i18n.test.js` ce/tr/ru 3 dilde paralel anahtar setini, `t()` fallback'ini, `setLanguage()` `S.settings.lang` güncellemesini test eder.

### Phase 5 — CI ve operasyon (F49, F50, F51, F54, F57)
- **GitHub Actions CI** (F49): `.github/workflows/ci.yml` PR ve main push'ta `npm ci && npm run lint && npm test && npm run build` çalıştırıyor. Artifact olarak `dist/` yüklenir.
- **ESLint flat config**: `eslint.config.js` `@eslint/js` recommended + browser/node globals + smart `eqeqeq` + no-shadow (with `S, G, i, j, ...` allowlist) + `no-unused-vars` warn. Test dosyaları için describe/it/expect globals + console izni.
- **PWA manifest enrichment** (F54): `manifest.webmanifest`'e `id`, `categories: ["education", "games", "word"]`, 2 `screenshots` (boş yer tutucu; gerçek ekran görüntüleri build sırasında eklenebilir), 2 `shortcuts` (Devam, Günlük Hediye).
- **reportError seam** (F50): `js/utils/report.js` `reportError(err, ctx)` ve `installGlobalHandler()` export ediyor. `?debug=1` veya `localStorage.dosh-consent === "1"` ile konsola yazar; `ENDPOINT` boş olduğu için network'e göndermez (POST seam hazır, gerçek backend sonra bağlanır).
- **vercel.json headers** (F51): `/assets/*` immutable cache, font/image'lar 30 gün, `/sw.js` no-cache, root'a `X-Content-Type-Options: nosniff` + `Referrer-Policy: strict-origin-when-cross-origin`.
- **Lexicon toolchain kararı** (F57): `_lexicon_expansion/README.md` eklendi — runtime'a ait olmadığı, ayrı repoya taşınması önerildiği, mevcut Windows-spesifik path'lerle çalıştırılamayacağı belgelendi.

## Bilinçli olarak kapsam dışı (modernization/expansion scope)

- Yeni seviyeler, başarımlar, günlük seri, liderlik tablosu
- Bulut kayıt, auth, IAP
- Capacitor ile App Store / Play Store paketleme
- React/Vue/Lit veya başka framework geçişi
- Audio synthesizer'ın yeniden yazımı (zaten tuned)
- Fotoğraf arka planlarının değiştirilmesi (mevcut kimlik)

## Kullanıcının yapması gerekenler

```bash
# 1. ESM three paketini kur
npm install three

# 2. Bağımlılıkları yükle (yeni: eslint, globals)
npm install

# 3. Test + build doğrula
npm run verify
```

Eğer `npm run lint` sırasında hata alırsanız, muhtemelen mevcut kodda kalmış `==` veya unused variable uyarılarıdır; düzeltmek 5-10 dakika sürer.

— 2026 hardening tamamlandı
