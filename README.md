# Дош — Нохчийн дош (v3: Ultra grafik + 3D + PWA)

Words-of-Wonders tarzı Çeçence kelime oyunu. Flutter gerekmez — saf HTML5/JS.
**Her platformda çalışır:** Android, iOS, Windows, macOS, Linux (tarayıcı + kurulabilir PWA).

## Çalıştırma / Kurulum

```bash
npm install
npm run dev          # geliştirme sunucusu (http://localhost:8765)
npm run dev:force    # vite --force (önbellek temizle + başlat)
npm run dev:clean    # .vite/ + node_modules/.vite/ sil + başlat
npm run build        # üretim build'i → dist/
npm run preview      # üretim build'ini serve et (dist/)
npm run verify       # lint + birim testler + build
npm run test:e2e     # Playwright smoke (gerçek tarayıcı akışı)
```
| Platform | Nasıl |
|---|---|
| Web'de yayın | Vercel'e bağlı (`vercel.json`); `dist/` herhangi bir statik hosta da yüklenebilir |
| Android / iOS | Yayınlanan adresi aç → tarayıcı menüsünden **"Ana ekrana ekle"** — tam ekran, çevrimdışı çalışan uygulama olur (PWA) |
| Mağaza (APK/IPA) | Klasörü [Capacitor](https://capacitorjs.com) ile sarmalayın: `npx cap add android` |

> **💡 Windows'ta Vite önbellek sorunu mu yaşıyorsunuz?** `npm run dev:clean`
> tüm önbellekleri temizler ve sunucuyu yeniden başlatır. Eğer hâlâ eski kod
> serve ediliyorsa `npm run build && npm run preview` ile production build'i
> kullanın (önbellek tamamen bypass edilir). Detaylı bilgi: [Geliştirici notları](#geliştirici-notları)

Hata takibi için `.env` içinde `VITE_SENTRY_DSN` ayarlayın (kullanıcı izni:
Ayarlar → 🐞). Alan adı değişirse `index.html` head'indeki mutlak URL'leri ve
`public/robots.txt` + `public/sitemap.xml` içini güncelleyin.

## v10'da yeni (Bonus sandık animasyonu + kapsamlı E2E test paketi)

- 🎁 **Bonus sandık (bonus-chest) açılma animasyonu** — sandığa tıklayınca:
  - `chestPop` — ikonda ölçek sıçraması + dönüş patlaması (550ms, elastic curve)
  - 10 adet DOM partikülü (✦ ♦ ∙ + ⬩ * 🪙) buton etrafında rastgele açılarda yükselip kaybolur
  - `dustBurst` — altın partiküllerin yayılarak sönmesi (700ms)
  - `countPulse` — bonus sayısı badge'inde yeşil parıltı (500ms)
  - `gemHover` — sandık hover öncesinde nazik altın ışıması
  - Çift tıklama önleme: `.opening` class guard'ı
  - Güvenlik temizleyici: 2 saniye sonra stuck class'ı zorla kaldırma
  - `animationend` ile partikül DOM'dan otomatik temizlenir
  - Başarı ses efekti: `SFX.coin()` ile eşzamanlı seslendirme
- 🧪 **23 E2E Playwright testi** — tüm akışlar otomatik doğrulanır:
  - Sözlük paneli: stagger animasyon sınıfı, genişletme/daraltma (`aria-expanded`),
    kart içeriği (kelime, IPA, gloss, telaffuz, tag'ler), tag filtreleme,
    arama fonksiyonu
  - İpucu görsel feedback: `.hint-active` toggle, `.hint-insufficient` sallanma,
    `.hint-wand-active` glow, yetersiz bakiye akışı
  - Bonus sandık: `.opening` class'ı eklenmesi ve 600ms sonra kalkması
  - Chain modu: panel + input + `chain-status` kontrolleri
- 🔬 **Kapsamlı CI pipeline** — GitHub Actions'da seri çalıştırma (`fullyParallel: false`),
  45s test timeout, stabilite için 1 retry, 23 testin tamamı CI'da otomatik doğrulanır

## v9'da yeni (Hint mikro-etkileşimleri + Vite cache fix)

- 💡 **İpuçlarına mikro-etkileşimler** — üç hint butonu artık görsel geri bildirim verir:
  - `#hint-letter` (ХӀарф хьахо): başarılı kullanımda altın parıltı (`hintSuccess`),
    yetersiz bakiyede butonda sallanma (`hintInsufficient`)
  - `#hint-target` (ХӀан хьахо): hedefleme modu açıkken nabız atan altın halka
    (`targetActive`), tıklanan hücre ile kapanınca glow söner
  - `#hint-wand` (Хьехаман тай): başarılı kullanımda üçlü flaş efekti (`wandGlow`)
  - Tüm butonlarda yetersiz bakiye durumunda sallanma + fiyat rozetinde shake
- 🔧 **Vite önbellek yönetimi** — Windows'ta eski versiyon serve edilme sorununa
  kalıcı çözüm: `cacheDir: '.vite'` (node_modules dışı), `server.watch.usePolling`
  (Windows polling fallback), `cacheBuster` plugin (değişen dosyaları moduleGraph'ten
  otomatik düşürür)
- 📦 **Yeni npm scriptleri:** `npm run dev:force` (önbellek temizle + başlat),
  `npm run dev:clean` (.vite/ ve node_modules/.vite/ sil + başlat)
- ✅ **Production build test** — `vite preview` ile önbellek bypass: 15/16 görsel test,
  13/13 E2E smoke test başarılı

## v8'de yeni (Zengin Kelime Kartı + Animasyonlar + Etkileşimler)

- 📖 **Sözlük kartları yeniden tasarlandı** — her kelime artık zengin bir kart:
  gold Russo One font, 🔊 telaffuz butonu, [IPA] yazılışı, ✓ bulundu rozeti,
  чеч./тр. anlam satırları, ℹ etimoloji notu, 📝 örnek cümleler, renkli kategori
  tag'leri (hayvan, doğa, renk vb.)
- 🃏 **Kart genişletme (expand/collapse)** — `aria-expanded` ile erişilebilir:
  karta tıklayınca altında etimoloji ve tüm örnek cümleler slide-down açar;
  başka karta tıklayınca önceki otomatik kapanır (accordion mantığı)
- 🏷️ **20+ kategori tag'i renklendirildi** — her tag kendi renginde:
  yeşil=hayvan, turuncu=yemek, pembe=vücut, mor=abstract, mavi=dil,
  kırmızı=action, kahverengi=home, lacivert=weather, vb.
- 🎯 **Sözlük arama + filtreleme** — anlamda, IPA'da ve etimolojide arama,
  tag filtresi (çoklu seçim), sadece çözülmüş/çözülmemiş filtreleri,
  istatistik çubuğu (toplam/bulunan kelime sayısı)
- 💬 **155+ kelimeye IPA, örnek cümle, etimoloji eklendi** — her kelime artık
  telaffuz + örnek kullanım + köken bilgisi içerir; 8 dil kodu (ce, ru, ar, fa,
  tr, en, el, la) ile çok dilli etimoloji gösterimi
- 🎤 **Telaffuz butonu** — her kelime kartında 🔊 ile TTS (SpeechSynthesis API)
- ✍️ **Geri bildirim butonu** — her kartta ✍️ ile hatalı anlam bildirimi

### Animasyonlar

- 🚀 **Kart giriş animasyonu (stagger)** — sözlük açıldığında kartlar teker teker
  aşağıdan yukarı süzülerek gelir (adaptive delay ∼35ms/kart, max 800ms)
- 🏀 **Bilgi şeridi yaylanma (bounce)** — kelime anlamı gösterildiğinde altın
  strip aşağıdan yaylanarak açılır (`stripBounce` keyframe, spring curve)
- ✦ **Kıvılcım efekti (sparkle burst)** — info-strip açıldığında sağ üstte
  altın ✦ kıvılcımı patlar (`sparkleBurst`, 550ms ease-out)
- 📋 **Detay açılma animasyonu** — kart genişletildiğinde detay bölümü
  yumuşak slide-down ile açılır (`detailSlideDown`, 350ms)
- 🏠 **Ana ekran ikon kademeli girişi (stagger icon reveal)** — butonlar sırayla
  pop-in yapar (`iconPop`, scale bounce, 60ms ara ile, 7 ikon ~420ms)
- 💡 **Hint butonu glow efektleri:**
  - Başarılı ipucu: `hintSuccess` (550ms, box-shadow glow + scale bounce)
  - Yetersiz bakiye: `hintInsufficient` (450ms, hafif shake + rotate)
  - Hedefleme modu: `targetActive` (1.2s, sonsuz altın nabız)
  - Sihirli değnek: `wandGlow` (700ms, üçlü flaş)
- 🎬 **Sayısız V6 polish animasyonu:**
  - `pressBounce` — tüm tıklanabilir öğelere haptik basma hissi
  - `flashGlow` — başarı anlarında altın parıltı
  - `toastIn` — bildirimlerin zıplayarak girişi
  - `panel` girişi — 3D rotate + scale + translateY (22,1,36,1 spring)
  - `coinSpin` — coin chip güncellemesinde sayı animasyonu
  - 85+ CSS keyframe, 40+ utility class

### Etkileşimler

- 👆 **Swipe-to-dismiss (kaydırarak kapatma)** — bilgi şeridini aşağı
  kaydırarak kapatabilirsiniz:
  - Üstte 36×4px tutamak çubuğu görsel indikatör
  - Parmak takibi (sürtünme katsayısı 0.6, opaklık fade)
  - 80px altında → yaylanarak geri döner (snap back, 300ms)
  - 80px üstünde → aşağı kayarak kapanır (dismiss)
  - Fare ile de çalışır (pointer events)
  - İçerik kaydırma ile çakışmaz (sadece üst 40px tetikler)
- 🎮 **Oyun içi döngü:**
  - `hintLetter()` başarı/başarısızlık anında buton feedback
  - `hintTarget()` toggle ile `.hint-active` class yönetimi
  - `hintWand()` üç harfli kullanımda buton görsel flaşı

### Mobil Performans

- Tüm giriş animasyonları `@media (pointer:coarse)` altında 80ms'e düşürülür
- Sonsuz animasyonlar mobilde kapatılır (compositor yükü)
- Drop-shadow/filter zincirleri tek katmana indirgenir
- `backdrop-filter` mobil GPU'da tamamen kaldırılır

## v7'de yeni (gerçek fotoğraf arka planlar)

- 📷 **Her tema için gerçek 1920px fotoğraf** (Unsplash lisansı — ticari kullanım
  serbest, atıf gerekmez):
  - Кавказ: **Ushguli, Svaneti** — gerçek tarihî taş kuleleriyle Kafkas köyü
  - Буьйса: **Elbruz bölgesi** üzerinde Samanyolu
  - Хьун: sisli dağ ormanı vadisi · Гуьйре: gün batımı sis denizi · Ӏа: karlı zirveler
- 🎬 **Ken Burns sinematik animasyonu** — fotoğraf 48 saniyede yavaşça
  kayar/yakınlaşır, video hissi verir (video dosyası olmadan)
- 🪶 3D katman fotoğrafın üzerinde yaşamaya devam eder: süzülen kartal,
  kar/yıldız/ateş böceği partikülleri (şeffaf WebGL)
- Okunabilirlik için fotoğraf üstü degrade karartma + logo kontrast gölgesi
- Prosedürel 3D dağlar koddan kaldırılmadı: `PHOTO_MODE = false` yapılırsa geri gelir

## v6'da yeni (tarihî yapılar)

- 🏘️ **Tarihî aul (dağ köyü)** — sol zirvede Şaroy/Nikaroy tarzı yerleşke:
  taş örgü dokulu savaş kulesi (бӀав), çevresinde 3 konut kulesi (гӀала,
  düz damlı/korkuluklu) ve sur duvarı
- 🗿 **Prosedürel taş duvar dokusu** — her taş tek tek çizilir, temaya göre tonlanır
- ⚰️ **Nekropol (Тсой-Педе tarzı "ölüler şehri")** — orta yamaçta eğimli çatılı
  taş mezar mahzenleri
- 🕯️ Gece temasında tüm yapıların pencerelerinden sıcak ışık sızar (bloom)
- Savaş kulesine tepe taşı (цӀогал) ve 4. çatı basamağı eklendi

## v5'te yeni (ultra profesyonel tasarım sistemi)

- 🪟 **Cam (glassmorphism) tasarım dili** — her ekran ve kart aynı dilde:
  blur + doygunluk, ince ışık kenarı, iç parlaklık, tutarlı gölge/yarıçap
- 🏠 Ana ekran **hero kartı**: coin + yıldız çipleri, animasyonlu ilerleme çubuğu, tam genişlik oyna butonu
- 🧭 **Etiketli dock** (Денна · Дошам · Статистика · Нисдарш)
- 🎬 **Ekrana duyarlı 3D kamera**: oyunda alçalır (ızgara sade göğe karşı), haritada kuşbakışına yaklaşır
- 🎞️ Kademeli giriş animasyonları (stagger), 3D perspektifli ekran geçişleri
- 💍 Çarkta dönen degrade ışık halkası; araç çubuğu tek cam dock oldu
- ❄️ Kış teması yeniden dengelendi (beyaz patlaması giderildi)

## v4'te yeni (Çeçen kültür sahnesi)

- 🏰 **Vainakh kuleleri (бӀаьвнаш)** — dağ zirvelerine prosedürel inşa edilen,
  yukarı daralan gövdeli, basamaklı piramit çatılı iki savaş kulesi;
  gece temasında pencerelerinden sıcak ışık sızar (bloom ile parlar)
- 🦅 **Süzülen kartal (аьрзу)** — gökyüzünde geniş daireler çizer, kanat çırpar
- 🌫️ Gündüz sisi ayarlandı (daha berrak ufuk)

## v3'te yeni (ultra grafik paketi)

- ✨ **Bloom (ışıma) post-processing** — güneş, yıldızlar ve ateş böcekleri gerçekçe parlar
- 🎨 **ACES sinematik ton eşleme** + gökyüzü degrade dokusu (temaya göre)
- 🏔️ 2 kat detaylı arazi (5 oktav gürültü) + uzak sırt katmanı (derinlik)
- 🪰 Temaya özel partiküller: ateş böcekleri (gece/orman), süzülen yapraklar (sonbahar), toz ışıltıları (gündüz), yumuşak kar (kış)
- 🔤 **Russo One** display fontu (Kiril; palochka görsel olarak I ile eşlenir)
- 💥 Oyun hissi: kelime çözünce ekran sarsıntısı + altın ışıma, telefonda titreşim (haptic), açılış (splash) ekranı
- 🖥️ 4K/Retina keskinliği: piksel oranı 2.5'e kadar; arka planda otomatik duraklatma (pil dostu)

## v2'de yeni

- 🏔️ **Gerçek 3D sahne** (Three.js, gömülü/çevrimdışı): low-poly Kafkas dağları,
  sis, güneş, süzülen bulutlar, gece temasında yıldızlar, kış temasında yağan kar,
  paralaks kamera (imleç/dokunuşla dağlar hafifçe döner)
- 🃏 3D animasyonlar: hücreler 3D dönerek açılır, çark perspektif eğimli,
  paneller 3D girer, harita düğümleri 3D döner
- 🎵 **Sentezlenmiş ortam müziği** (pentatonik, dosyasız) — ayarlardan açma/kapama
- 📱 **PWA**: manifest + service worker + ikonlar; kurulabilir, çevrimdışı oynanır
- ✅ **Kelime denetimi**: 11 Rusça/geçersiz ızgara kelimesi gerçek Çeçenceyle
  değiştirildi, 17 bozuk bonus silindi, 16 yanlış anlam düzeltildi
  (politika: aşağıdaki "İçerik kuralları" ve `CLAUDE.md`)

## Dosyalar

```
index.html      giriş noktası (SEO/OG meta)
js/             ES modülleri: engine/ screens/ fx/ utils/ data/
js/data/levels/ seviye paketleri (pack-N.json, lazy yüklenir)
css/            katmanlı stiller (variables → themes → layout → components)
public/         runtime asset'leri (bg fotoğrafları, ikonlar, robots, sitemap)
e2e/            Playwright smoke testleri
scripts/        içerik araçları (coverage analizi, görsel optimizasyonu)
```

Service worker sürümlemesi otomatiktir (`vite-plugin-pwa` autoUpdate) —
her build'de precache manifest'i yenilenir, elle sürüm artırmak gerekmez.

## Oyun ekonomisi (orijinalle birebir)

Başlangıç 100 🪙 · kelime = grafem×5 🪙 · bonus +10 🪙 · 3'lü seri +15 🪙 ·
ipuçları 25/35/60 🪙 · günlük hediye +100 🪙 ·
⭐⭐⭐ = 0 hata & 0 ipucu, ⭐⭐ = ≤2 hata & ≤1 ipucu

## Geliştirici notları

### Windows Vite önbellek sorunu

Windows'ta Vite bazen eski transform sonuçlarını cache'te tutar ve dosya değişse
bile eski sürümü serve etmeye devam eder (`/js/screens/dict.js`'te `dict-item`
gösterip `dict-card` göstermemek gibi). Bu sorun için 3 çözüm katmanı:

1. **`npm run dev:clean`** — `.vite/` ve `node_modules/.vite/` önbellek dizinlerini
   siler, ardından Vite'i başlatır.
2. **`npm run dev:force`** — `vite --force` ile çalışır, Vite'in dep cache'ini
   temizler ve tüm bağımlılıkları yeniden ön-derler.
3. **`npm run build && npm run preview`** — production build (`dist/`) statik
   dosyalardan oluşur, Vite'in module graph cache'ine dokunmaz. Sorunun en
   garantili çözümü.

### vite.config.js cache ayarları

Projede 3 mekanizma ile Vite önbellek sorunu önlenir:

- `cacheDir: '.vite'` — Önbellek `node_modules/.vite` yerine proje kökündeki
  `.vite/` dizinine yönlendirilir (Windows yol uzunluğu/izni sorunlarından kaçınmak
  için). Zaten `.gitignore`'da.
- `server.watch.usePolling` — Sadece Windows'ta polling tabanlı dosya izleme
  (`process.platform === 'win32'`). Chokidar'ın Windows'taki bildirim gecikmelerini
  aşar. macOS/Linux'ta etkin değil (gereksiz CPU yükü olmaz).
- `cacheBuster()` plugin — Dosya değişikliklerinde `server.moduleGraph.invalidateModule()`
  ile Vite'in transform cache'ini temizler.

### Test stratejisi

```bash
npm test              # 409 birim test (25 dosya) — ~1sn
npm run test:e2e      # 23 Playwright E2E testi (~30sn)
npm run dev:clean     # Önbellek temiz + dev başlat
npm run build         # Production build doğrulama
npm run preview       # Production build serve (önbellek bypass)
```

### E2E Test Detayları

23 Playwright testi 8 grup halinde `e2e/smoke.spec.js`'de tanımlıdır:

| Grup | Test Sayısı | Kapsam |
|------|-------------|--------|
| 🏠 Ana ekran | 4 | splash kapanışı, 7 ikon stagger, hero kart, başlat butonu |
| 🗺️ Harita | 2 | seviye düğümleri, kilit/stars gösterimi |
| 🎮 Oyun döngüsü | 4 | seviye 1 çözümü, info-strip, seviye sonu paneli, bonus kelime |
| 🗓️ Günlük bulmaca | 1 | günlük puzzle çarkı + kelime çözümü |
| ⚙️ Ayarlar | 1 | panel açma + tema değiştirme |
| 📖 Sözlük paneli | 5 | stagger sınıfları, expand/collapse (`aria-expanded`),
  kart içeriği, tag filtreleme, arama |
| 💡 İpucu feedback | 3 | `.hint-active` toggle, `.hint-insufficient` sallanma,
  `.hint-wand-active` glow, yetersiz bakiye akışı |
| 🎁 Bonus chest | 1 | `.opening` class + toast doğrulaması |
| 🔗 Chain modu | 1 | panel + input + `chain-status` görünürlüğü |

## İçerik kuralları

Sahte Çeçence yazılmaz. Bulmaca kelimeleri Wiktionary'nin Çeçence lemma
kategorisiyle doğrulanır; arayüz metinleri orijinal `ce.json`'dan gelir.
Çeçen digrafları (аь гӀ кх къ кӀ оь пӀ тӀ уь хь хӀ цӀ чӀ юь яь) tek harf sayılır.
