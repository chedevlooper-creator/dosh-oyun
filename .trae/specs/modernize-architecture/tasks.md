# Tasks
- [x] Görev 1: Proje altyapısının kurulması
  - [x] Alt Görev 1.1: `package.json` oluşturulması ve `"type": "module"` ayarının yapılması.
  - [x] Alt Görev 1.2: Vite paketinin geliştirici bağımlılığı (devDependency) olarak eklenmesi ve scriptlerin tanımlanması (`dev`, `build`, `preview`).
- [x] Görev 2: CSS dosyalarının ayrıştırılması
  - [x] Alt Görev 2.1: `css` klasörünün oluşturulması.
  - [x] Alt Görev 2.2: `index.html` içindeki CSS kodlarının `variables.css`, `layout.css`, `components.css`, `animations.css` ve `themes.css` olarak ayrılması.
  - [x] Alt Görev 2.3: `index.html` içerisine bu CSS dosyalarının linklerinin (veya Vite üzerinden JS importlarının) eklenmesi.
- [x] Görev 3: JavaScript modüllerinin ayrıştırılması
  - [x] Alt Görev 3.1: `js` klasörü ve alt klasörlerinin (`data/`, `engine/`, `screens/`, `fx/`, `utils/`) oluşturulması.
  - [x] Alt Görev 3.2: Yardımcı fonksiyonların (`dom.js`, `helpers.js`) oluşturulup export edilmesi.
  - [x] Alt Görev 3.3: Veri dosyalarının (`levels.js`, `dictionary.js`) ayrılması.
  - [x] Alt Görev 3.4: Oyun motoru mantığının (`grapheme.js`, `grid.js`, `wheel.js`, `scoring.js`, `save.js`) ES6 modüllerine dönüştürülmesi.
  - [x] Alt Görev 3.5: Ekranların (`home.js`, `map.js`, `game.js`, vb.) ayrılması.
  - [x] Alt Görev 3.6: Görsel ve işitsel efektlerin (`audio.js`, `particles.js`, `three-scene.js`) modülleştirilmesi.
- [x] Görev 4: Modüllerin entegrasyonu ve `main.js`'in oluşturulması
  - [x] Alt Görev 4.1: Tüm modülleri bir araya getiren `js/main.js` giriş noktasının oluşturulması.
  - [x] Alt Görev 4.2: `index.html` dosyasına `<script type="module" src="/js/main.js"></script>` eklenmesi.
  - [x] Alt Görev 4.3: Inline JS bloklarının tamamen `index.html` dosyasından temizlenmesi.

# Task Dependencies
- [Görev 2] ve [Görev 3] birbirine paralel yapılabilir ancak `index.html` sadeleştirilmesi açısından sırayla yapılması tavsiye edilir.
- [Görev 4] depends on [Görev 3]
