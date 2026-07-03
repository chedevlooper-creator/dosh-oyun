# Mimari Modernizasyon Spec

## Neden
Mevcut durumda oyun `index.html` içerisinde yaklaşık 1200 satır CSS ve 900 satır JS barındıran monolitik bir yapıdadır. Bu durum tek dosya prototipler için hızlı olsa da, profesyonel ekip çalışması, ölçeklenebilirlik, bakım yapılabilirliği ve yeni özelliklerin eklenmesi açısından sürdürülemez bir hale gelmiştir. Kodun parçalara ayrılması ve modern bir derleme (build) sürecinin eklenmesi gereklidir.

## Değişiklikler
- Projeye `package.json` eklenerek modern JS paket yöneticisi yapısına geçilecek.
- Geliştirme ortamı ve build süreci için `Vite` kurulacak.
- `index.html` içindeki JS kodları `js/` klasörü altına ES6 modülleri olarak ayrılacak (`main.js`, `data/`, `engine/`, `screens/`, `fx/`, `utils/`).
- `index.html` içindeki CSS kodları `css/` klasörü altına kategorize edilerek ayrılacak (`variables.css`, `layout.css`, `components.css`, `animations.css`, `themes.css`).
- Gerekli dışa aktarım (export/import) yapıları kurularak, `index.html` dosyasının sadece bir giriş noktası (entry point) olması sağlanacak.
- **BREAKING**: Monolitik global değişken yönetimi (`S` ve `G`) yerine, modüller arası veri aktarımı kullanılacak (şimdilik mevcut nesneler modül scope'unda tutulabilir veya global kalabilir ama ES6 modülleri üzerinden yönetilecektir).

## Etki
- Etkilenen sistemler: Tüm frontend mimarisi, var olan JS ve CSS yapısı.
- Etkilenen dosyalar: `index.html`, `package.json` (yeni), `vite.config.js` (yeni), `js/*` ve `css/*` klasörleri.

## EKLENEN Gereksinimler
### Gereksinim: Modüler Dosya Yapısı
Sistem, JavaScript ve CSS dosyalarını modüler bir şekilde sunmalıdır.

#### Senaryo: Başarılı Derleme
- **WHEN** geliştirici `npm run build` komutunu çalıştırdığında
- **THEN** Vite, tüm modülleri `dist/` klasörü altında optimize edilmiş tek bir yapı olarak derlemelidir.

## DEĞİŞTİRİLEN Gereksinimler
### Gereksinim: Oyun Başlatma (Entry Point)
**Mevcut:** `index.html` içindeki inline script üzerinden tetiklenen `init()`
**Yeni:** `index.html` içerisine `<script type="module" src="/js/main.js"></script>` eklenmesi ve tüm mantığın ES6 modülleriyle yüklenmesi.
