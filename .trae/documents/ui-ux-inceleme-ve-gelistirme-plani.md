# UI/UX İnceleme ve Geliştirme Planı

## Summary
Bu planın amacı, mevcut `dosh-oyun` web uygulamasında kullanıcı deneyimini iyileştirmek için önce gerçek çalışan kaynak yapısını netleştirmek, ardından ana kullanıcı akışı olan `home -> map -> game` hattında görünürlük, keşfedilebilirlik ve tutarlılık sorunlarını hedefli biçimde düzeltmektir. Plan, yalnızca gözlenen kod ve mevcut ürün yapısına dayanır; özellikle `index.html` içindeki inline uygulama mantığı ile `js/` altındaki modüler sürüm arasındaki ayrışma temel karar noktasıdır.

## Current State Analysis
- Proje bir Vite tabanlı web uygulaması olarak yapılandırılmıştır; giriş dosyaları `index.html` ve `editor.html` olarak tanımlıdır.
- README, home ekranında hero kartı, yıldız çipi ve animasyonlu ilerleme çubuğu gibi belirgin UI vaatleri içerir.
- `index.html`, yalnızca markup ve stil değil, aynı zamanda büyük bir inline uygulama script’i de barındırır. Bu, ürün davranışının hâlen HTML içinden çalışıyor olabileceğini gösterir.
- Aynı zamanda `js/main.js` ve `js/screens/*` altında home, map, game, settings, stats ve dictionary akışlarını yöneten modüler bir sürüm de vardır.
- Bu iki katman tam senkron değildir:
  - `js/screens/home.js` içindeki `renderHome()` yalnızca coin ve ilerleme metnini günceller.
  - `index.html` içindeki çalışan `renderHome()` sürümü coin, toplam yıldız ve progress bar genişliğini birlikte günceller.
- Oyun araçları `index.html` içinde çoğunlukla ikon + fiyat + `title` kombinasyonuyla sunulmaktadır. Bu masaüstünde kabul edilebilir olsa da dokunmatik kullanımda düşük keşfedilebilirlik riski taşır.
- Modal altyapısı `js/utils/dom.js` içindeki `openPanel(html)` fonksiyonuna dayanır; tutorial, settings, stats, dictionary ve level complete akışları string tabanlı HTML üretimiyle çalışır.
- Erişilebilirlik açısından olumlu bir temel vardır:
  - `show()` ekran geçişlerinde `aria-hidden` ve `inert` kullanır.
  - `main.js` modal açıkken `Escape` ve `Tab` davranışlarını yönetir.
  - `map.js` seviye düğümleri için `aria-label` üretir.

## Proposed Changes

### 1. Gerçek kaynak yapısını tekilleştir
Dosyalar:
- `index.html`
- `js/main.js`
- `js/screens/home.js`
- `js/screens/map.js`
- `js/screens/game.js`
- `js/screens/settings.js`
- `js/screens/stats.js`
- `js/screens/dictionary.js`

Ne:
- Ürünün hangi katmandan çalıştığını kesinleştir.
- Çalışan sürüm ile bakım yapılan sürümün aynı yer olmasını sağla.

Neden:
- Şu an aynı arayüzün iki implementasyonu bulunuyor.
- UI/UX düzeltmeleri yanlış katmanda yapılırsa kullanıcıya görünmeyebilir.
- Regresyon ve bakım maliyeti gereksiz biçimde artar.

Nasıl:
- Önce `index.html` içindeki inline uygulama mantığının aktif ürün kaynağı olup olmadığını doğrula.
- Eğer hedef modüler mimari ise:
  - `index.html` içindeki uygulama mantığını kaldırıp modüler entry’ye yönlendir.
  - `js/` altındaki sürümü tek kaynak haline getir.
- Eğer hedef tek dosyalı dağıtım ise:
  - `index.html` ürün kaynağı olarak korunur.
  - `js/screens/*` içeriği ya parity sağlanacak şekilde güncellenir ya da referans/teknik borç olarak açıkça ayrıştırılır.
- Uygulamada aynı davranışın iki farklı versiyonda ayrı ayrı yaşamaması sağlanır.

### 2. Home ekranını ürün vaadiyle hizala
Dosyalar:
- `index.html`
- `js/screens/home.js`
- `README.md`

Ne:
- Home ekranındaki hero kartı, yıldız bilgisi ve ilerleme göstergesini tek ve tutarlı davranışla güncelle.

Neden:
- README’de yıldız çipi ve animasyonlu ilerleme çubuğu vaat ediliyor.
- Modüler sürümde `home-stars` ve `home-bar` güncellenmiyor.
- Home ekranı oyuncunun motivasyon, durum özeti ve geri dönüş noktasıdır.

Nasıl:
- `renderHome()` her çağrıldığında şu alanları birlikte güncelle:
  - coin
  - çözülen seviye sayısı
  - toplam yıldız
  - progress bar yüzdesi
- Home CTA metnini kullanıcı durumuna göre daha açıklayıcı hale getir:
  - ilk kez gelen kullanıcı için başlangıç/tanıtım odaklı
  - geri dönen kullanıcı için devam et / oyna odaklı
- Home’a dönüş yapan akışlarda aynı render rutininin tekrar çağrıldığından emin ol.
- README vaatleri ile canlı ürün arasındaki farkları kapat.

### 3. Home -> Map -> Game akışında yönlendirmeyi güçlendir
Dosyalar:
- `js/main.js`
- `js/screens/map.js`
- `js/screens/game.js`
- `index.html`

Ne:
- Kullanıcının nerede olduğunu, sonraki adımın ne olduğunu ve mevcut seviyeyi daha hızlı anlamasını sağlayacak akış iyileştirmeleri yap.

Neden:
- Ana akış teknik olarak net, ancak UX tarafında daha güçlü durum anlatımıyla desteklenebilir.
- Harita ve oyun ekranları işlevsel olsa da durum iletişimi daha görünür hale getirilebilir.

Nasıl:
- Home’daki ana CTA’yı yalnızca “başlat” mantığında bırakma; kullanıcı durumu varsa “devam et” davranışını öne çıkar.
- Harita ekranında `done`, `current` ve `locked` durumlarını yalnız görsel stil ile değil, daha belirgin yardımcı metin/etiket yapısıyla destekle.
- Oyun üst çubuğunda seviye bağlamını daha baskın hale getir; oyuncu oyuna geçtiğinde öncelikli odağın görev olduğunu hissetsin.
- Tutorial sonrası yönlendirme ile normal devam akışı aynı zihinsel modele oturtulsun.

### 4. Oyun araçlarını dokunmatik kullanım için daha anlaşılır yap
Dosyalar:
- `index.html`
- `js/screens/game.js`

Ne:
- Bonus ve ipucu kontrollerini ikon odaklı yapıdan, görünür açıklama destekli yapıya geçir.

Neden:
- `title` hover tabanlıdır ve mobil kullanımda zayıf keşif sağlar.
- İkonlar deneyimli kullanıcı için hızlıdır, ancak ilk kez gelen oyuncu için yeterince açıklayıcı değildir.
- Coin harcatan kontrollerde belirsizlik maliyetlidir.

Nasıl:
- Her araç için kısa ve sürekli görünür bir etiket ekle.
- Mevcut fiyat rozetlerini koru; fakat işlev adı ve fiyat aynı bakış alanında okunabilsin.
- `aria-label` kullanmaya devam et, ancak bunu görünür etiketin yerine değil ek destek olarak konumlandır.
- Küçük ekranlarda alan darlığı yaratmamak için:
  - kompakt iki satırlı buton
  - alt etiket
  - ilk kullanımlarda yardımcı tanıtım
  seçeneklerinden biri seçilerek tutarlı biçimde uygulanır.

### 5. Modal sistemini standardize et
Dosyalar:
- `js/utils/dom.js`
- `js/screens/home.js`
- `js/screens/settings.js`
- `js/screens/stats.js`
- `js/screens/dictionary.js`
- `js/screens/game.js`

Ne:
- Tüm modal içerikleri için ortak bir yapı, aksiyon sırası ve semantik düzen tanımla.

Neden:
- Şu an modal içerikleri string HTML ile dağıtık biçimde kuruluyor.
- Bu yapı kısa vadede hızlı olsa da uzun vadede bakım, tutarlılık ve test zorlukları yaratır.
- Modal UX’i ürün algısında yüksek ağırlığa sahiptir çünkü öğretici, ayarlar, istatistik ve seviye sonu aynı yüzeyde açılır.

Nasıl:
- Kısa vadede ortak modal şablonu belirle:
  - başlık alanı
  - gövde alanı
  - birincil aksiyon
  - ikincil aksiyon
  - kapama davranışı
- `openPanel(html)` kullanımını tamamen kaldırmadan önce, bu API’yi besleyen içeriklerin ortak markup kuralını oluştur.
- Özellikle reset onayı, tutorial adımları ve level complete panellerinde buton sırası ve vurgu tutarlı hale getir.
- Orta vadede `innerHTML` bağımlılığını azaltacak yardımcı render fonksiyonları veya element tabanlı yaklaşım için zemin hazırla.

### 6. Stats ve dictionary bilgi mimarisini sadeleştir
Dosyalar:
- `js/screens/stats.js`
- `js/screens/dictionary.js`

Ne:
- Bilgi panellerini yalnızca veri gösteren yüzeyler olmaktan çıkarıp daha kolay taranabilir hale getir.

Neden:
- Stats ekranında tüm metrikler aynı ağırlıkta görünür.
- Dictionary ekranında boş durum ve sonuçsuz arama mesajları işlevsel ama yeterince rehberli değildir.

Nasıl:
- Stats kartlarını zihinsel modele göre grupla:
  - ilerleme
  - performans
  - ekonomi
- Önemli metrikleri üst sıraya taşı.
- Dictionary’de boş durum, sonuç yok durumu ve arama deneyimini daha açıklayıcı metinlerle güçlendir.
- Liste uzadığında arama alanının görünür kalması gerekiyorsa bunu panel davranışıyla destekle.

### 7. Erişilebilirlik ve durum anlatımını renk bağımlılığından çıkar
Dosyalar:
- `index.html`
- `js/screens/map.js`
- `js/screens/game.js`
- `js/utils/dom.js`

Ne:
- Kritik durumların yalnız renk, glow veya ikon farkıyla anlatılmadığından emin ol.

Neden:
- Kilitli, aktif ve tamamlanmış durumlar farklı kullanıcı profillerinde eşit netlikte algılanmayabilir.
- Var olan erişilebilirlik temeli iyi; bunu uygulamanın tamamına daha sistematik yaymak gerekir.

Nasıl:
- Kilitli/aktif/tamamlanan durumlara yardımcı metin veya semantik açıklama ekle.
- Yalnız ikonla anlatılan kritik aksiyon bırakma.
- Modal, oyun aracı ve harita düğmelerinde metin + semantik etiket kombinasyonunu standartlaştır.

## Assumptions & Decisions
- Kullanıcı isteği, mevcut projeyi görsel ve deneyim açısından inceleyip uygulanabilir geliştirme önerileri üretmektir; bu plan buna göre hazırlanmıştır.
- Bu plan yeni özellik eklemekten çok mevcut UX akışını netleştirmeye ve görünür kaliteyi artırmaya odaklanır.
- En kritik karar, uygulamanın gerçek source-of-truth yapısının tekilleştirilmesidir; diğer tüm UI iyileştirmeleri bu kararın ardından kalıcı değer üretir.
- README ürün vaadi açısından referans kabul edilmiştir; uygulama davranışıyla çelişen noktalar parity problemi olarak ele alınacaktır.
- `editor.html` bu planın odağında değildir; kullanıcı isteği ana oyun UI/UX incelemesidir.
- Büyük çaplı yeniden tasarım yerine, önce mevcut yapı üzerinde yüksek etkili ve düşük belirsizlikli iyileştirmeler uygulanacaktır.

## Verification Steps
1. Kaynak doğrulaması
- Uygulamanın gerçekten hangi script katmanından çalıştığını doğrula.
- Düzenlenen dosyada yapılan küçük bir görünür değişikliğin canlı yüzeye yansıyıp yansımadığını test et.
- Aynı davranışın iki ayrı implementasyonda kalmadığını teyit et.

2. Home ekranı doğrulaması
- İlk açılışta coin, yıldız, solved count ve progress bar birlikte doğru görünmeli.
- Bir seviye tamamlandıktan sonra home’a dönünce bu değerler anında güncellenmeli.
- Günlük hediye durumuna göre glow davranışı tutarlı olmalı.

3. Akış doğrulaması
- Home -> tutorial -> map ve home -> map geçişleri beklenen kullanıcı durumuna göre doğru çalışmalı.
- Harita ekranında mevcut seviye ilk bakışta anlaşılmalı.
- Haritadan oyuna geçişte kullanıcı ana görevi net biçimde algılamalı.

4. Oyun araçları doğrulaması
- Hover olmadan, özellikle mobil viewport altında, araç işlevleri anlaşılmalı.
- İkon, etiket ve fiyat birlikte okunabilir olmalı.
- Yanlış ipucu kullanım riskini artıran belirsizlik ortadan kalkmalı.

5. Modal doğrulaması
- Tüm modallarda ilk odak mantıklı elemana gitmeli.
- `Escape` ile kapanma çalışmalı.
- Modal kapandığında odak doğru önceki elemana dönmeli.
- Buton sıraları ve başlık-gövde düzeni ekranlar arasında tutarlı olmalı.

6. Panel bilgi mimarisi doğrulaması
- Stats ekranında metrikler kolay taranabilir gruplar halinde okunmalı.
- Dictionary ekranında boş durum ve sonuç yok mesajları kullanıcıyı yönlendirmeli.

7. Erişilebilirlik doğrulaması
- Kritik durumlar yalnız renkle anlatılmamalı.
- Önemli kontrollerde görünür etiket ve semantik açıklama birlikte bulunmalı.
- Harita, modal ve oyun içi araçlar klavye ve odak akışı açısından gerilememeli.
