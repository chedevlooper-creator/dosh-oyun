# React Mimari Migrasyonu Spec

## Neden
Mevcut vanilla JS mimarisi modüler hale getirilmiş olsa da, uygulamanın UI karmaşıklığı (modallar, ekran geçişleri, dinamik oyun içi etkileşimler) arttıkça DOM manipülasyonlarını manuel yönetmek zorlaşmaktadır. Uygulamanın UI katmanını "Vercel React En İyi Uygulamaları" (Vercel React Best Practices) yönergelerine uygun olarak React'e taşımak; yeniden kullanılabilirlik, performans optimizasyonu (re-render kontrolü) ve erişilebilirlik (A11Y) standartlarını sistematik bir şekilde uygulamayı sağlayacaktır.

## Değişiklikler
- Projeye `react` ve `react-dom` bağımlılıkları eklenecektir.
- Vite konfigürasyonu `@vitejs/plugin-react` içerecek şekilde güncellenecektir.
- `js/screens/` altındaki ekranlar (Home, Map, Game, Modals) fonksiyonel React bileşenlerine (Functional Components) dönüştürülecektir.
- Mevcut `store.js` (Proxy tabanlı state), React hook'ları (`useSyncExternalStore` veya custom hook) ile entegre edilerek bileşenlerin sadece gerekli durumlarda yeniden render edilmesi sağlanacaktır (Vercel kuralı: `rerender-derived-state`, `rerender-memo`).
- `index.html` dosyasına React root elementi (`<div id="root"></div>`) eklenecektir.
- **BREAKING**: `js/utils/dom.js` içerisindeki manuel DOM fonksiyonları (`$`, `show`, `hide`, `openPanel`) kaldırılacak, yerini deklaratif React state'lerine bırakacaktır.

## Etki
- Etkilenen sistemler: UI katmanı, state-görünüm senkronizasyonu, olay dinleyicileri (event listeners).
- Etkilenen kodlar: `package.json`, `vite.config.js`, `index.html`, `js/main.js`, `js/screens/*`, `js/utils/dom.js`. (Not: 3D motoru `Three.js` ve çekirdek oyun mantığı `js/engine/` büyük ölçüde korunacaktır).

## EKLENEN Gereksinimler
### Gereksinim: React UI Katmanı
Sistem, arayüzü oluşturmak için React kütüphanesini kullanmalıdır.

#### Senaryo: Bileşen Tabanlı Render
- **WHEN** kullanıcı uygulamayı başlattığında
- **THEN** React, `index.html` içindeki root elementine uygulamayı bağlamalı (mount) ve aktif ekranı state'e göre render etmelidir.

### Gereksinim: Vercel Best Practices Uyumluluğu
Uygulama, performans için Vercel React kurallarına uymalıdır.

#### Senaryo: Re-render Optimizasyonu
- **WHEN** oyun içi state güncellendiğinde (örneğin skor arttığında)
- **THEN** sadece ilgili skor bileşeni yeniden render edilmeli, tüm sayfa re-render olmamalıdır (`rerender-memo` ve `rerender-defer-reads` kuralları).

## REMOVED Gereksinimler
### Gereksinim: Manuel DOM Manipülasyonu
**Sebep**: React'in deklaratif yapısı gereği manuel DOM müdahalelerine gerek kalmamıştır.
**Migrasyon**: `dom.js` içindeki seçiciler ve stil atamaları, React `className` ve koşullu render (conditional rendering) mantığına dönüştürülecektir.
