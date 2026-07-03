# Tasks
- [ ] Görev 1: React altyapısının kurulması
  - [ ] Alt Görev 1.1: `react`, `react-dom` paketlerinin kurulması.
  - [ ] Alt Görev 1.2: `@vitejs/plugin-react` paketinin devDependency olarak kurulması ve `vite.config.js` dosyasının güncellenmesi.
  - [ ] Alt Görev 1.3: `index.html` dosyasına `<div id="root"></div>` eklenmesi ve ana script'in uzantısının JSX destekleyecek şekilde uyarlanması.
- [ ] Görev 2: Store entegrasyonu (React Hooks)
  - [ ] Alt Görev 2.1: Mevcut `store.js` Proxy yapısını dinleyebilecek bir React hook'unun (örn. `useStore`) oluşturulması. (Vercel kurallarına uygun re-render optimizasyonları ile).
- [ ] Görev 3: UI Bileşenlerinin (Components) oluşturulması
  - [ ] Alt Görev 3.1: `Home` ekranının React bileşeni olarak yeniden yazılması.
  - [ ] Alt Görev 3.2: `Map` (Seviye Haritası) ekranının React bileşeni olarak yeniden yazılması.
  - [ ] Alt Görev 3.3: `Game` (Oyun) ekranının (Grid ve Wheel) React bileşeni olarak yeniden yazılması.
  - [ ] Alt Görev 3.4: Modal ve Panellerin (Settings, Stats, Dictionary) React Portal veya şartlı render ile oluşturulması.
- [ ] Görev 4: 3D Motorun (Three.js) entegrasyonu
  - [ ] Alt Görev 4.1: `scene3d.js` mantığının bir React `useEffect` veya bağımsız bir background bileşeni ile root seviyesine entegre edilmesi.
- [ ] Görev 5: Vanilla JS kalıntılarının temizlenmesi
  - [ ] Alt Görev 5.1: `js/utils/dom.js` içindeki kullanılmayan manuel DOM fonksiyonlarının silinmesi.
  - [ ] Alt Görev 5.2: Tüm stil sınıf (class) atamalarının React `className` yapısına tam uyumlu hale getirilmesi.

# Task Dependencies
- [Görev 2] depends on [Görev 1]
- [Görev 3] depends on [Görev 2]
- [Görev 4] depends on [Görev 3]
- [Görev 5] depends on [Görev 3]
