# Дош — Нохчийн дош (v3: Ultra grafik + 3D + PWA)

Words-of-Wonders tarzı Çeçence kelime oyunu. Flutter gerekmez — saf HTML5/JS.
**Her platformda çalışır:** Android, iOS, Windows, macOS, Linux (tarayıcı + kurulabilir PWA).

## Çalıştırma / Kurulum

```bash
npm install
npm run dev        # geliştirme sunucusu (http://localhost:8765)
npm run build      # üretim build'i → dist/
npm run verify     # lint + birim testler + build
npm run test:e2e   # Playwright smoke (gerçek tarayıcı akışı)
```

| Platform | Nasıl |
|---|---|
| Web'de yayın | Vercel'e bağlı (`vercel.json`); `dist/` herhangi bir statik hosta da yüklenebilir |
| Android / iOS | Yayınlanan adresi aç → tarayıcı menüsünden **"Ana ekrana ekle"** — tam ekran, çevrimdışı çalışan uygulama olur (PWA) |
| Mağaza (APK/IPA) | Klasörü [Capacitor](https://capacitorjs.com) ile sarmalayın: `npx cap add android` |

Hata takibi için `.env` içinde `VITE_SENTRY_DSN` ayarlayın (kullanıcı izni:
Ayarlar → 🐞). Alan adı değişirse `index.html` head'indeki mutlak URL'leri ve
`public/robots.txt` + `public/sitemap.xml` içini güncelleyin.

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

## İçerik kuralları

Sahte Çeçence yazılmaz. Bulmaca kelimeleri Wiktionary'nin Çeçence lemma
kategorisiyle doğrulanır; arayüz metinleri orijinal `ce.json`'dan gelir.
Çeçen digrafları (аь гӀ кх къ кӀ оь пӀ тӀ уь хь хӀ цӀ чӀ юь яь) tek harf sayılır.
