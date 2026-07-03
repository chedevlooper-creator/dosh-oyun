# ДОŞ OYUNU — KAPSAMLI UI/UX ANALİZİ VE DETAYLI RAPORU

---

## İÇERİK
1. [Proje Geneli Görünüm](#1-proje-geneli-görünüm)
2. [Tüm Sayfalar ve Ekran Analizi](#2-tüm-sayfalar-ve-ekran-analizi)
3. [Etkileşimli Öğeler](#3-etkileşimli-öğeler)
4. [Görsel Tutarlılık ve Renk Sistemi](#4-görsel-tutarlılık-ve-renk-sistemi)
5. [Tipografi ve Yazı Stilleri](#5-tipografi-ve-yazı-stilleri)
6. [Erişilebilirlik (Accessibility)](#6-erişilebilirlik-accessibility)
7. [Duyarlı Tasarım (Responsive Design)](#7-duyarlı-tasarım-responsive-design)
8. [Animasyonlar ve Performans](#8-animasyonlar-ve-performans)
9. [Geliştirme İçin Öneriler ve İyileştirmeler](#9-geliştirme-için-öneriler-ve-iyileştirmeler)

---

## 1. Proje Geneli Görünüm
### Dosya Yapısı
Oyun, modern ve modüler bir yapıda tasarlanmıştır:
- Ana giriş: [index.html](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/index.html)
- Seviye editörü: [editor.html](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/editor.html)
- Modüler CSS: [css/](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/css/) dizininde parçalanmış (variables, themes, layout, animations, components, editor)
- Modüler JavaScript: [js/](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/js/) dizininde (data, engine, screens, fx, utils, editor)

### Ana Özellikler
- 5 farklı tema desteği (Kavkaz, Gece, Orman, Sonbahar, Kış)
- 3D sahne desteği (GL katmanı)
- PWA desteği
- Yerel depolama ile kayıt tutma

---

## 2. Tüm Sayfalar ve Ekran Analizi

### 2.1 Ana Sayfa (Home / [scr-home](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/index.html#L44-L63))
**Görünüm ve İçerik:**
- Logo: "ДОШ" (Russo One yazı tipi, degrade arka plan)
- Alt başlık: "Нохчийн дош"
- Hero kartı (cam görünümlü):
  - Coin & Star sayaçları
  - İlerleme çubuğu
  - "ДӀадоладе" (Başla) butonu
- Dock: 4 ikon butonu (Hediye, Sözlük, İstatistikler, Ayarlar)

**Etkileşim:**
- Başla butonu: `#scr-map` ekranına geçer
- İkon butonları: ilgili panelleri açar
- Hediye butonu: günlük ödül alınıyorsa parlar (`.glow` animasyonu)

### 2.2 Seviye Haritası (Map / [scr-map](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/index.html#L65-L73))
**Görünüm ve İçerik:**
- Üst çubuk: Geri butonu, başlık ("ТӀегӀанийн карта"), coin sayacı
- Kaydırılabilir harita:
  - Paket başlıkları (örn: 1., 2., 3., 4.)
  - 5'li ızgara şeklinde seviye düğümleri
  - Her düğümde durum (tamamlandı, şu anki, kilitli) ve yıldızları gösterilir

**Düğüm Durumları:**
- `done`: tamamlandı (yeşil-accent arka plan)
- `cur`: şu an oynanacak (altın çerçeve, titreşim animasyonu)
- `lock`: kilitli (soluk görünüm)

### 2.3 Oyun Ekranı (Game / [scr-game](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/index.html#L75-L101))
**Görünüm ve İçerik (Üstten Alta):**
1. Üst çubuk:
   - Geri butonu ([#game-back](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/index.html#L78))
   - Seviye bilgisi ("ТӀЕГӀА X")
   - Coin sayacı
   - Ayarlar butonu ([#game-settings](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/index.html#L81))

2. Izgara (Grid):
   - Kelimelerin doldurulacağı kareler
   - Hücreler `.cell` sınıfı ile temsil edilir
   - `.fill`, `.hintfill`, `.target` gibi durum sınıfları
   - 3D perspektif ve flip animasyonları

3. Bilgi şeridi ([#info-strip](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/index.html#L84)):
   - Kelime doğruluk bilgisi veya ipucu
   - Soluk/siyah görünüm, animasyonla açılır/kapanır

4. Araç Çubuğu ([.toolrow](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/index.html#L85-L97)):
   - 4 buton (4'lü ızgara):
     1. **Bonus Çağası ([#bonus-chest](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/index.html#L86-L88))**
        - Ikon: 💎
        - Yazı: "Бонус дешнаш"
        - Sayaç: sağ üst köşede (#bonus-count)
     2. **Harf İpucu ([#hint-letter](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/index.html#L89-L91))**
        - Ikon: 💡
        - Yazı: "ХӀарф хьахо"
        - Fiyat: 25 🪙
     3. **Hedef İpucu ([#hint-target](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/index.html#L92-L94))**
        - Ikon: 🎯
        - Yazı: "ХӀан хьахо"
        - Fiyat: 35 🪙
     4. **Sihirli Değnek ([#hint-wand](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/index.html#L95-L97))**
        - Ikon: 🪄
        - Yazı: "Хьехаман тай"
        - Fiyat: 60 🪙

5. Önizleme Alanı ([#preview](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/index.html#L99)):
   - Seçilen harflerin gösterildiği kapsül (`.cap`)
   - Durumlar: `.ok` (doğru kelime), `.bad` (hatalı), `.dup` (tekrar)

6. Çark (Wheel / [#wheel](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/index.html#L100)):
   - Daire şeklinde, içinde 7-8 harf baloncuğu ([.bub](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/index.html#L100))
   - Ortada karıştırma butonu ([#shuffle](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/index.html#L100))
   - Harfleri seçmek için sürükleme, tıklama
   - `.sel` sınıfı seçilen harfleri gösterir

### 2.4 Overlay Panelleri (Modallar / [veil](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/index.html#L104-L105))
Tüm paneller tek bir kapak ([#veil](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/index.html#L104)) altında gösterilir:
- **Ayarlar (Settings):** tema seçimi, 3D sahne açık/kapalı, ses açık/kapalı
- **İstatistikler (Stats):** toplam oynanan seviye, toplam coin, toplam yıldız, toplam kelime gibi bilgiler
- **Sözlük (Dictionary / Dict):** tüm kelimeleri aranabilir, listeler
- **Tutorial / Eğitim:** oyuna başlangıç kılavuzu
- **Seviye Tamamlandı (Level Complete):** yıldızlar, ödüller, devam butonu

### 2.5 Seviye Editörü (Editor / [editor.html](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/editor.html))
**Üst Araç Çubuğu (Toolbar):**
- Sol: Başlık, seviye ID, paket ID, oyununa dön butonu
- Sağ: Doğrula, JSON aktar, JSON içe aktar, temizle

**Ana Alan (Main):**
1. **Sol (Grid Bölümü):**
   - Izgara boyutları (satır/sütun)
   - Yeniden boyutlandır
   - Yön seçimi (across/down)
   - Kelime tanımla
   - Seviye yükle
   - Izgara tablosu

2. **Sağ (Panel):**
   - Kelimeler listesi
   - Bonus kelimeler
   - Ekstra harfler
   - Harf havuzu
   - Doğrulama mesajı

---

## 3. Etkileşimli Öğeler

### Butonlar ve Türleri
| ID / Sınıf       | Konum          | Tür         | Açıklama                                                                 | Dosya Bağlantısı                                                                 |
|-------------------|----------------|-------------|--------------------------------------------------------------------------|-----------------------------------------------------------------------------------|
| `#btn-start`      | Ana Sayfa      | Ana Buton   | Oyun haritasına geçiş yapar                                               | [index.html](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/index.html#L55) |
| `#btn-gift`       | Ana Sayfa Dock | İkon Buton  | Günlük ödül almayı sağlar                                                 | [index.html](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/index.html#L58) |
| `#btn-dict`       | Ana Sayfa Dock | İkon Buton  | Sözlük panelini açar                                                      | [index.html](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/index.html#L59) |
| `#btn-stats`      | Ana Sayfa Dock | İkon Buton  | İstatistikler panelini açar                                              | [index.html](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/index.html#L60) |
| `#btn-settings`   | Ana Sayfa Dock | İkon Buton  | Ayarlar panelini açar                                                     | [index.html](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/index.html#L61) |
| `#map-back`       | Harita Ekranı  | Yuvarlak    | Ana sayfaya geri döner                                                    | [index.html](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/index.html#L68) |
| `#game-back`      | Oyun Ekranı    | Yuvarlak    | Harita ekranına geri döner                                                | [index.html](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/index.html#L78) |
| `#game-settings`  | Oyun Ekranı    | Yuvarlak    | Ayarlar panelini açar                                                     | [index.html](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/index.html#L81) |
| `#shuffle`        | Oyun Ekranı    | Yuvarlak    | Çarktaki harfleri karıştırır                                              | [index.html](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/index.html#L100) |
| `.node`           | Harita Ekranı  | Kare Buton  | Belirli bir seviyeyi başlatır                                             | [components.css](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/css/components.css#L42-L54) |
| `.tool`           | Oyun Ekranı    | Dikdörtgen  | İpucu ve bonus araçlarını kullanır                                       | [components.css](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/css/components.css#L73-L84) |

### Diğer Etkileşimli Öğeler
- **Wheel Bubbles (.bub):** Harfleri seçmek için tıklama/sürükleme
- **Grid Cells (.cell):** Doldurulmuş hücreler, hedef hücreler (ipucu verildiğinde)
- **Theme Dots (.tdot):** Temayı değiştirmek için tıklama
- **Toggles (.toggle):** Ayarları aç/kapat (3D sahne, ses)

---

## 4. Görsel Tutarlılık ve Renk Sistemi
### 4.1 Temel Renkler ([variables.css](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/css/variables.css))
| Değişken      | Varsayılan Değer (Kavkaz Tema) | Açıklama                            |
|----------------|----------------------------------|-------------------------------------|
| `--sky1`       | `#7ec8e3`                       | Üst arka plan (gök mavisi)          |
| `--sky2`       | `#2a6f97`                       | Orta arka plan                       |
| `--sky3`       | `#123c5a`                       | Alt arka plan                        |
| `--mtn1-3`     | Dağ renkleri                     | SVG dağları                          |
| `--card`       | `rgba(13,32,52,.72)`            | Kart arka planı (yarı saydam)       |
| `--ink`        | `#f4f9fc`                       | Ana yazı rengi                       |
| `--ink2`       | `#b8cfe0`                       | Soluk yazı rengi                     |
| `--gold`       | `#ffc94d`                       | Altın (vurgu, sayac)                 |
| `--gold2`      | `#e8a020`                       | Koyu altın                            |
| `--accent`     | `#43d9a3`                       | Vurgu rengi (yeşil-turkuaz)          |
| `--accent2`    | `#22b585`                       | Koyu vurgu rengi                      |
| `--danger`     | `#ff6b6b`                       | Kırmızı (hata)                       |

### 4.2 Tema Sistemi ([themes.css](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/css/themes.css))
5 tema desteği, her biri `body.theme-{isim}` sınıfı ile uygulanır:
1. **Kavkaz (theme-kavkaz):** Mavi-gölgeler (varsayılan)
2. **Gece (theme-night):** Mor-lacivert
3. **Orman (theme-forest):** Yeşil
4. **Sonbahar (theme-autumn):** Turuncu-kahverengi
5. **Kış (theme-winter):** Açık mavi-beyaz

### 4.3 Cam (Glass) Görünüm Sistemi ([components.css](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/css/components.css#L185-L190))
Tüm kart, buton ve paneller cam görünümündedir:
- `backdrop-filter: blur(16px) saturate(1.35)`
- Çok katmanlı gölgeler
- Çok katmanlı degrade arka plan
- İnce beyaz sınır

---

## 5. Tipografi ve Yazı Stilleri
### 5.1 Yazı Tipleri
| İsim          | Kullanım Yeri                                                                 | Dosya Bağlantısı                                                                 |
|---------------|-------------------------------------------------------------------------------|-----------------------------------------------------------------------------------|
| **Russo One** | Logo, sayaclar, hücreler, buton yazıları, yıldızlar, önizleme, çark harfleri | [layout.css](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/css/layout.css#L1-L20) |
| **Segoe UI**  | Sistem arayüzü, yardımcı metinler, bilgi şeridi                                | [layout.css](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/css/layout.css#L14) |

### 5.2 Yazı Stilleri
- Sayısal değerler: `font-variant-numeric: tabular-nums` (genişlikler sabit kalır, atlama olmaz)
- Büyük başlıklar: büyük font ağırlığı (700-800), harf aralığı artırılmış
- Küçük metinler: düşük opaklık (var(--ink2)), küçük font boyutları

---

## 6. Erişilebilirlik (Accessibility)
### 6.1 Mevcut İyileştirmeler
- Icon-only butonlar için `aria-label` eklenmiş: ✅
- Decorative emojiler `aria-hidden="true"` ile gizlenmiş: ✅
- Klavye odaklama (focus-visible) için belirgin çerçeve: ✅
- Viewport'tan yakınlaştırma kısıtlaması kaldırılmış: ✅

### 6.2 Eksikler ve İyileştirme Önerileri
1. **Ekran Okuyucu Desteği (Screen Reader ARIA):**
   - Izgara hücrelerine `role="gridcell"`, `aria-label`
   - Çark balonlarına `role="button"`, seçim durumu için `aria-selected`
2. **Klavye Desteği:**
   - Çark balonları arasında Tab ile gezinme desteği
   - Hücreler arasında yön tuşları ile gezinme
3. **Renk Kontrastı:**
   - Tüm temalarda metin/arka plan kontrastı (WCAG AA) kontrol edilmeli

---

## 7. Duyarlı Tasarım (Responsive Design)
### Mevcut Medya Sorguları ([components.css](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/css/components.css#L147-L152))
- `max-height: 640px`: logo boyutunu küçült, preview min-height azalt
- `max-width: 420px`: araç butonlarını küçült
- `max-width: 400px`: dock butonlarını küçült
- Editör için `max-width:700px`: dikey düzene geç, hücre boyutlarını küçült

### Güvenli Alan (Safe Area)
- Üst/alt çubuklar `env(safe-area-inset-top/bottom)` ile çentik (notch) koruması: ✅

---

## 8. Animasyonlar ve Performans
### 8.1 Animasyon Listesi ([animations.css](file:///c:/Users/isaha/Yeni%20klasör%20(4)/dosh-oyun/css/animations.css))
| Animasyon Adı  | Açıklama                                                    |
|-----------------|-------------------------------------------------------------|
| `sunPulse`      | Güneşin boyutunu değiştirerek titretme                       |
| `float`         | Logo ve diğer öğelerin yukarı aşağı kayması                 |
| `giftGlow`      | Hediye butonunun parlaması                                  |
| `curPulse`      | Mevcut seviye düğümünün titreşimi                           |
| `targetBlink`   | Hedef hücresinin yanıp sönmesi                              |
| `pop`           | Hücre doldurulunca patlama efekti                           |
| `shake`         | Hata durumunda titreşim (preview, grid-wrap)                 |
| `kenburns`      | Fotoğraf arka planının yavaş yakınlaştırması/panlanması     |
| `flip3d`        | Hücre dolarken 3D dönme efekti                              |
| `coinSpin`      | Coin kazanırken para sembolünün dönmesi                     |
| `logoSway`      | Logonun yavaş sola/sağa eğilmesi                            |
| `nodePop`       | Seviye tamamlanınca düğümün belirginleşmesi                  |
| `shine`         | Logonun parlaması (splash ekranında)                        |
| `sbar`          | Splash ekranındaki ilerleme çubuğu                          |
| `gshake`        | Izgaranın hafif sallanması                                  |
| `ringSpin`      | Çark dışındaki ışık halkasının dönmesi                       |
| `rise`          | Ana sayfa öğelerinin aşağıdan yukarı çıkması                |

### 8.2 Performans
- **Transitionlar:** `transition: all` kaldırılmış, sadece `opacity` ve `transform` animasyonları kullanılmış: ✅
- **Layout Thrashing:** game.js'deki sorun iç içe `requestAnimationFrame` ile çözülmüş: ✅
- **GPU Hızlandırma:** `transform` ve `opacity` kullanıldığından GPU render edilir: ✅

---

## 9. Geliştirme İçin Öneriler ve İyileştirmeler
### Yüksek Öncelikli (Hemen Yapılabilir)
1. Editor.js'in bağımlılıklarını gözden geçirin (varsa)
2. Tüm panellerin ve ekranların testlerini ekleyin (unit/e2e)
3. Seviye yükleme/indirme özelliğini güçlendirin

### Orta Öncelikli
1. Klavye ile oynanabilirliği artırın (w/s/a/d veya yön tuşları)
2. Ses efektleri ve müzik için ayrı bir ses mikseri ekleyin
3. LocalStorage yerine daha güvenilir bir kayıt yöntemi (ör: IndexedDB) düşünün
4. Çoklu dil desteği ekleyin (i18n)

### Düşük Öncelikli
1. Sosyal paylaşım özelliği
2. Online lider tablosu
3. Bulut kayıt senkronizasyonu

---

## Sonuç
Oyunun mevcut UI/UX tasarımı **oldukça profesyonel, tutarlı ve kullanıcı dostu** durumda. Özellikle cam (glass) tasarım dili, 3D derinlik efektleri ve animasyonlar oyun hissini çok iyi yansıtıyor. Erişilebilirlik alanında bazı küçük geliştirmeler yapılabilir ancak genel olarak modern standartlara uygun bir yapıya sahiptir.
