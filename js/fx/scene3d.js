// @ts-check
import { S } from "../engine/store.js";
import { $, prefersReducedMotion } from "../utils/helpers.js";
import { onResize } from "../utils/resize.js";
/* ESM three: r128 (592KB) çıkarıldı, modern tree-shakeable three kullanılıyor.
 * Post-processing bileşenleri three/addons'tan ESM olarak alınır.
 * Kullanıcının `npm install three` çalıştırması gerekir. */
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

/* ================= 3D SAHNE (Three.js — Kafkas dağları) ================= */
export const GL = (() => {
  const PHOTO_MODE = true; // gerçek fotoğraf arka plan: 3D yalnızca partikül + kartal katmanı çizer
  let renderer, scene, camera, terrain, stars, snow, sun, dirLight, ambLight, hemiLight;
  const clouds = [];
  let composer = null, bloomPass = null, motes = null, farRidge = null;
  const towerWindows = [];
  let eagle = null, wingL = null, wingR = null;
  const stoneMats = [];
  let px = 0, py = 0, tpx = 0, tpy = 0, ok = false;
  let camY = 9, camYT = 9, lookY = 12, lookYT = 12; // ekrana göre kamera hedefleri
  const PAL3D = {
    kavkaz: { fog:0x7fb2d2, low:0x24405f, high:0x3d5a80, snowline:13, light:0xfff2d0, amb:0x8fb8d8, stars:0,   snow:0,
              skyTop:"#3f95cc", skyBot:"#cfe9f4", bloom:0.45, mote:{color:0xffffff, op:0.28, speed:0.006, size:0.55} },
    night:  { fog:0x141a3e, low:0x10163a, high:0x252d5c, snowline:15, light:0x9aa5ff, amb:0x2a3170, stars:0.9, snow:0,
              skyTop:"#05071c", skyBot:"#2a2558", bloom:0.85, mote:{color:0xffd98a, op:0.85, speed:0.004, size:0.8} },
    forest: { fog:0xa7d4b8, low:0x143528, high:0x2f6b4f, snowline:17, light:0xffe9b0, amb:0x6aa583, stars:0,   snow:0,
              skyTop:"#5cae83", skyBot:"#e2f2d3", bloom:0.5,  mote:{color:0xd8ff9a, op:0.6,  speed:0.005, size:0.7} },
    autumn: { fog:0xe8b98a, low:0x5c2f1c, high:0x9c5636, snowline:16, light:0xffd9a0, amb:0xcf8a5c, stars:0,   snow:0,
              skyTop:"#e88f4e", skyBot:"#ffe3bd", bloom:0.6,  mote:{color:0xffa050, op:0.75, speed:0.012, size:0.9} },
    winter: { fog:0xa9c4dc, low:0x5e7c9e, high:0x9db8d2, snowline:6,  light:0xe8f0fa, amb:0xb8cfe4, stars:0,   snow:0.9,
              skyTop:"#5f8fc0", skyBot:"#dcebf8", bloom:0.22, mote:{color:0xffffff, op:0,    speed:0.005, size:0.5} },
  };
  function hillNoise(x, z){
    let h = Math.sin(x*0.055 + z*0.031) * Math.sin(z*0.043 - x*0.012) * 0.5 + 0.5;
    h += (Math.sin(x*0.11 + 1.7) * Math.sin(z*0.09 + 4.2) * 0.5 + 0.5) * 0.5;
    h += (Math.sin(x*0.23 + 9.1) * Math.sin(z*0.19 + 2.8) * 0.5 + 0.5) * 0.25;
    h += (Math.sin(x*0.47 + 3.3) * Math.sin(z*0.41 + 7.6) * 0.5 + 0.5) * 0.12;  // ince detay
    h += (Math.sin(x*0.93 + 5.9) * Math.sin(z*0.87 + 1.4) * 0.5 + 0.5) * 0.06;  // kaya dokusu
    return h / 1.93;
  }
  function skyTexture(top, bot){
    const c = document.createElement("canvas"); c.width = 2; c.height = 512;
    const g = c.getContext("2d"), gr = g.createLinearGradient(0,0,0,512);
    gr.addColorStop(0, top); gr.addColorStop(1, bot);
    g.fillStyle = gr; g.fillRect(0,0,2,512);
    const t = new THREE.CanvasTexture(c); return t;
  }
  function glowTexture(inner, outer){
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const g = c.getContext("2d"), gr = g.createRadialGradient(64,64,4,64,64,64);
    gr.addColorStop(0, inner); gr.addColorStop(1, outer);
    g.fillStyle = gr; g.fillRect(0,0,128,128);
    return new THREE.CanvasTexture(c);
  }
  function buildTerrain(){
    const geo = new THREE.PlaneGeometry(260, 100, 150, 56);
    geo.rotateX(-Math.PI/2);
    const pos = geo.attributes.position;
    for(let i=0; i<pos.count; i++){
      const x = pos.getX(i), z = pos.getZ(i) - 38;
      const depth = THREE.MathUtils.clamp((-z - 8)/55, 0, 1);
      pos.setY(i, Math.pow(hillNoise(x, z), 1.6) * 36 * depth - 2);
      pos.setZ(i, z);
    }
    geo.computeVertexNormals();
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(pos.count*3), 3));
    const mat = new THREE.MeshPhongMaterial({ vertexColors:true, flatShading:true, shininess:4 });
    terrain = new THREE.Mesh(geo, mat);
    scene.add(terrain);
  }
  function paintTerrain(p){
    const pos = terrain.geometry.attributes.position, col = terrain.geometry.attributes.color;
    const low = new THREE.Color(p.low), high = new THREE.Color(p.high), snowC = new THREE.Color(0xf4f9ff), c = new THREE.Color();
    for(let i=0; i<pos.count; i++){
      const y = pos.getY(i);
      const t = THREE.MathUtils.clamp((y+2)/30, 0, 1);
      c.copy(low).lerp(high, t);
      const sl = p.snowline + hillNoise(pos.getX(i)*3.1, pos.getZ(i)*2.7)*4;
      if(y > sl) c.lerp(snowC, THREE.MathUtils.clamp((y-sl)/5, 0, 1));
      col.setXYZ(i, c.r, c.g, c.b);
    }
    col.needsUpdate = true;
  }
  let _init = false;
  function init(){
    if (_init) return;
    if(typeof THREE === "undefined") return;
    try{
      renderer = new THREE.WebGLRenderer({ canvas: $("gl"), antialias:true, alpha:PHOTO_MODE });
    }catch{ return; }
    ok = true;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); // 4K/retina keskinliği, mobilde pil dostu
    renderer.toneMapping = THREE.ACESFilmicToneMapping;      // sinematik ton eşleme
    renderer.toneMappingExposure = 1.05;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(58, innerWidth/innerHeight, 0.1, 400);
    camera.position.set(0, 9, 30);
    hemiLight = new THREE.HemisphereLight(0xffffff, 0x334466, 0.55); scene.add(hemiLight);
    ambLight = new THREE.AmbientLight(0x8fb8d8, 0.35); scene.add(ambLight);
    dirLight = new THREE.DirectionalLight(0xfff2d0, 0.95);
    dirLight.position.set(35, 60, -40); scene.add(dirLight);
    if(!PHOTO_MODE) buildTerrain();
    // yıldızlar — dokunmatik cihazlarda daha az partikül (bellek + pil)
    {
      const isTouch = matchMedia("(pointer:coarse)").matches;
      const n = isTouch ? 400 : 900, arr = new Float32Array(n*3);
      for(let i=0;i<n;i++){
        const a = Math.random()*Math.PI*2, r = 150 + Math.random()*140, y = 20 + Math.random()*160;
        arr[i*3] = Math.cos(a)*r; arr[i*3+1] = y; arr[i*3+2] = Math.sin(a)*r - 60;
      }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(arr,3));
      stars = new THREE.Points(g, new THREE.PointsMaterial({ color:0xffffff, size:1.3, transparent:true, opacity:0, sizeAttenuation:false }));
      scene.add(stars);
    }
    // kar — dokunmatikte yarıya
    {
      const isTouch = matchMedia("(pointer:coarse)").matches;
      const n = isTouch ? 300 : 700, arr = new Float32Array(n*3);
      for(let i=0;i<n;i++){ arr[i*3]=(Math.random()-0.5)*120; arr[i*3+1]=Math.random()*55; arr[i*3+2]=(Math.random()-0.5)*90 - 20; }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(arr,3));
      snow = new THREE.Points(g, new THREE.PointsMaterial({ color:0xffffff, size:0.5, transparent:true, opacity:0,
        map: glowTexture("rgba(255,255,255,1)","rgba(255,255,255,0)"), depthWrite:false }));
      scene.add(snow);
    }
    // bulutlar
    if(!PHOTO_MODE){
      const tex = glowTexture("rgba(255,255,255,.85)", "rgba(255,255,255,0)");
      for(let i=0;i<7;i++){
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:tex, transparent:true, opacity:0.32, depthWrite:false }));
        sp.position.set((Math.random()-0.5)*180, 26+Math.random()*18, -50-Math.random()*40);
        sp.scale.set(34+Math.random()*26, 12+Math.random()*7, 1);
        sp.userData.v = 0.008 + Math.random()*0.014;
        clouds.push(sp); scene.add(sp);
      }
    }
    // güneş
    if(!PHOTO_MODE){
      sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture("rgba(255,244,214,1)","rgba(255,214,110,0)"), transparent:true, depthWrite:false }));
      sun.position.set(46, 48, -95); sun.scale.set(46,46,1); scene.add(sun);
    }
    // uzak sırt (derinlik katmanı)
    if(!PHOTO_MODE){
      const geo = new THREE.PlaneGeometry(500, 70, 60, 10);
      geo.rotateX(-Math.PI/2);
      const pos = geo.attributes.position;
      for(let i=0;i<pos.count;i++){
        const x = pos.getX(i), z = pos.getZ(i) - 130;
        pos.setY(i, Math.pow(hillNoise(x*0.6+400, z), 1.5) * 55 - 2);
        pos.setZ(i, z);
      }
      geo.computeVertexNormals();
      farRidge = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color:0x3d5a80, fog:true }));
      scene.add(farRidge);
    }
    // ateş böceği / yaprak / toz parçacıkları (temaya göre) — dokunmatikte azalt
    {
      const isTouch = matchMedia("(pointer:coarse)").matches;
      const n = isTouch ? 50 : 130, arr = new Float32Array(n*3);
      for(let i=0;i<n;i++){ arr[i*3]=(Math.random()-0.5)*90; arr[i*3+1]=Math.random()*26+1; arr[i*3+2]=(Math.random()-0.5)*60 - 5; }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(arr,3));
      motes = new THREE.Points(g, new THREE.PointsMaterial({ color:0xffffff, size:0.7, transparent:true, opacity:0,
        map: glowTexture("rgba(255,255,255,1)","rgba(255,255,255,0)"),
        blending:THREE.AdditiveBlending, depthWrite:false }));
      motes.userData.speed = 0.005;
      scene.add(motes);
    }
    // ---- Vainakh kuleleri (Нохчийн бӀаьвнаш) ----
    function groundY(x, z){
      const depth = THREE.MathUtils.clamp((-z - 8)/55, 0, 1);
      return Math.pow(hillNoise(x, z), 1.6) * 36 * depth - 2;
    }
    function findPeak(x0, x1, z0, z1){
      let best = {x:x0, z:z0, y:-99};
      for(let x = x0; x <= x1; x += 1.5)
        {for(let z = z0; z <= z1; z += 1.5){
          const y = groundY(x, z);
          if(y > best.y) best = {x, z, y};
        }}
      return best;
    }
    // taş örgü dokusu (prosedürel duvar taşları)
    function stoneTexture(){
      const c = document.createElement("canvas"); c.width = c.height = 128;
      const g = c.getContext("2d");
      g.fillStyle = "#8f8574"; g.fillRect(0,0,128,128);
      let y = 0, row = 0;
      while(y < 128){
        const h = 9 + ((row*37) % 6);
        let x = (row % 2) ? -6 : 0;
        while(x < 128){
          const w = 14 + ((x*13 + row*7) % 12);
          const v = ((x*31 + row*17) % 22) - 11; // taş tonu değişimi
          g.fillStyle = `rgb(${143+v},${133+v},${116+v})`;
          g.fillRect(x+1, y+1, w-2, h-2);
          x += w;
        }
        y += h; row++;
      }
      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      return t;
    }
    const stoneTex = stoneTexture();
    function stoneMat(rx, ry){
      const t = stoneTex.clone(); t.needsUpdate = true; t.repeat.set(rx, ry);
      const m = new THREE.MeshPhongMaterial({ map:t, flatShading:true, shininess:2 });
      stoneMats.push(m); return m;
    }
    function roofMat(){ const m = new THREE.MeshPhongMaterial({ color:0x4e463c, flatShading:true, shininess:2 }); return m; }
    function addWindow(g, s, hh, rAt){
      const w = new THREE.Mesh(new THREE.BoxGeometry(s*0.16, s*0.26, 0.05),
        new THREE.MeshBasicMaterial({ color:0x181310 }));
      w.position.set(0, hh, rAt + 0.03);
      g.add(w); towerWindows.push(w.material);
    }
    // Savaş kulesi (бӀав) — yukarı daralan gövde, машикули, basamaklı piramit çatı, tepe taşı
    function buildCombatTower(s){
      const g = new THREE.Group();
      const stone = stoneMat(2, 5), roof = roofMat();
      const add = (mesh, y) => { mesh.rotation.y = Math.PI/4; mesh.position.y = y; g.add(mesh); return mesh; };
      add(new THREE.Mesh(new THREE.CylinderGeometry(s*0.60, s*1.0, s*4.6, 4, 1), stone), s*2.3);
      add(new THREE.Mesh(new THREE.CylinderGeometry(s*0.80, s*0.60, s*0.5, 4, 1), stone), s*4.8);
      let ry = s*5.05;
      for(let i=0;i<4;i++){
        const r = s*(0.62 - i*0.12);
        ry += s*0.10;
        add(new THREE.Mesh(new THREE.CylinderGeometry(r - s*0.08, r, s*0.20, 4, 1), roof), ry);
        ry += s*0.10;
      }
      add(new THREE.Mesh(new THREE.ConeGeometry(s*0.22, s*0.8, 4), roof), ry + s*0.42);
      add(new THREE.Mesh(new THREE.SphereGeometry(s*0.09, 6, 5), roof), ry + s*0.86); // цӀогал tepe taşı
      for(let i=0;i<4;i++){
        const hh = s*(1.1 + i*0.95);
        addWindow(g, s, hh, s*(1.0 - 0.4*(hh/(s*4.6))) * 0.707);
      }
      return g;
    }
    // Konut kulesi (гӀала) — daha geniş, 2 katlı, düz damlı, korkuluklu
    function buildHouseTower(s){
      const g = new THREE.Group();
      const stone = stoneMat(2, 2.4);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(s*0.92, s*1.05, s*1.9, 4, 1), stone);
      body.rotation.y = Math.PI/4; body.position.y = s*0.95; g.add(body);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(s*0.98, s*0.98, s*0.16, 4, 1), stoneMat(3, 0.4));
      rim.rotation.y = Math.PI/4; rim.position.y = s*1.95; g.add(rim);
      addWindow(g, s*1.15, s*1.15, s*0.68);
      return g;
    }
    // Sur duvarı parçası
    function buildWall(len, h){
      return new THREE.Mesh(new THREE.BoxGeometry(len, h, 0.5), stoneMat(len/2, h));
    }
    // Nekropol mahzeni (Тсой-Педе tarzı: eğimli çatılı taş mezar evi)
    function buildVault(s){
      const g = new THREE.Group();
      const stone = stoneMat(1.6, 1);
      const body = new THREE.Mesh(new THREE.BoxGeometry(s*1.1, s*0.9, s*1.5), stone);
      body.position.y = s*0.45; g.add(body);
      const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, s*0.80, s*0.9, 4, 1), roofMat());
      roof.rotation.y = Math.PI/4; roof.position.y = s*1.35; roof.scale.z = 1.35; g.add(roof);
      return g;
    }
    // ---- yerleşim: sol tepede tarihî aul (köy) ----
    if(!PHOTO_MODE){
      const p = findPeak(-34, -16, -50, -34);
      const aul = new THREE.Group();
      const main = buildCombatTower(2.2); aul.add(main);
      const h1 = buildHouseTower(1.6); h1.position.set(-4.4, -0.6, 2.2); h1.rotation.y = 0.3; aul.add(h1);
      const h2 = buildHouseTower(1.3); h2.position.set(3.8, -0.9, 3.0); h2.rotation.y = -0.2; aul.add(h2);
      const h3 = buildHouseTower(1.1); h3.position.set(-2.6, -1.2, 5.2); h3.rotation.y = 0.55; aul.add(h3);
      const w1 = buildWall(7, 1.2); w1.position.set(-1.5, -0.4, 4.6); w1.rotation.y = 0.15; aul.add(w1);
      aul.position.set(p.x, p.y - 0.5, p.z);
      scene.add(aul);
    }
    // ---- sağ uzak zirvede tek nöbetçi kule ----
    if(!PHOTO_MODE){
      const p = findPeak(20, 40, -66, -46);
      const t = buildCombatTower(1.7); t.position.set(p.x, p.y - 0.4, p.z); scene.add(t);
    }
    // ---- orta-uzak yamaçta nekropol (ölüler şehri) ----
    if(!PHOTO_MODE){
      const p = findPeak(2, 16, -58, -42);
      const nec = new THREE.Group();
      for(let i=0;i<4;i++){
        const v = buildVault(1.0 + (i%2)*0.25);
        v.position.set((i-1.5)*2.1, -0.35*Math.abs(i-1.5), (i%2)*1.6);
        v.rotation.y = (i*0.45) - 0.6;
        nec.add(v);
      }
      nec.position.set(p.x, p.y - 0.5, p.z);
      scene.add(nec);
    }
    // ---- süzülen kartal (аьрзу) ----
    {
      eagle = new THREE.Group();
      const dark = new THREE.MeshBasicMaterial({ color:0x1c2430, side:THREE.DoubleSide });
      const wgeo = new THREE.PlaneGeometry(2.4, 0.65);
      wingL = new THREE.Group(); const wl = new THREE.Mesh(wgeo, dark); wl.position.x = -1.2; wingL.add(wl);
      wingR = new THREE.Group(); const wr = new THREE.Mesh(wgeo, dark); wr.position.x =  1.2; wingR.add(wr);
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.4, 4), dark);
      body.rotation.x = -Math.PI/2;
      eagle.add(wingL, wingR, body);
      eagle.scale.setScalar(0.9);
      scene.add(eagle);
    }
    // bloom (ışıma) — fx.js yüklüyse (fotoğraf modunda kapalı: şeffaflık bozulur)
    try{
      if(!PHOTO_MODE && EffectComposer && UnrealBloomPass){
        composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        bloomPass = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.5, 0.65, 0.82);
        composer.addPass(bloomPass);
        // OutputPass tonemap & renk düzeltmesi son aşamada uygular
        try { composer.addPass(new OutputPass()); } catch { /* Output yoksa da olur */ }
      }
    }catch{ composer = null; }
    resize(); retheme();
    onResize(resize);
    // pointermove throttle: anim loop zaten 30fps, 16ms throttle yeterli
    let lastPM = 0;
    addEventListener("pointermove", e => {
      const now = performance.now();
      if (now - lastPM < 16) return;
      lastPM = now;
      tpx = e.clientX/innerWidth - 0.5; tpy = e.clientY/innerHeight - 0.5;
    }, { passive:true });
    _init = true;
    document.body.classList.add("gl-on");
    let last = 0, paused = false;
    document.addEventListener("visibilitychange", ()=>{ paused = document.hidden; });
    window.__doshGL = { pause(){ paused = true; }, resume(){ paused = false; } };
    (function anim(t){
      requestAnimationFrame(anim);
      if(paused || t - last < 33) return; last = t; // ~30fps yeterli, pil dostu
      const s = t/1000;
      // Reduced-motion: tüm 3D animasyon/render durur, loop sadece değişikliği algılamak için canlı kalır
      if (prefersReducedMotion()) return;

      px += (tpx-px)*0.04; py += (tpy-py)*0.04;
      camY += (camYT-camY)*0.03; lookY += (lookYT-lookY)*0.03;
      camera.position.x = px*3 + Math.sin(s*0.10)*1.1;
      camera.position.y = camY + py*1.6 + Math.sin(s*0.13)*0.4;
      camera.lookAt(0, lookY, -60);
      for(const c of clouds){ c.position.x += c.userData.v; if(c.position.x > 110) c.position.x = -110; }
      if(snow.material.opacity > 0.01){
        const arr = snow.geometry.attributes.position.array;
        const n = snow.geometry.attributes.position.count;
        for(let i=0;i<n;i++){
          const i3 = i*3;
          let y = arr[i3+1] - 0.045;
          if(y < 0) y = 55;
          arr[i3+1] = y;
          arr[i3] += Math.sin(s + i)*0.006;
        }
        snow.geometry.attributes.position.needsUpdate = true;
      }
      stars.rotation.y = s*0.004;
      // kartal: geniş daireler çizer, kanat çırpar
      if(eagle){
        const a = s*0.09;
        eagle.position.set(Math.cos(a)*34, 24 + Math.sin(s*0.4)*2, -48 + Math.sin(a)*20);
        eagle.rotation.y = -a;
        const flap = Math.sin(s*5.2) * 0.5;
        wingL.rotation.z =  flap; wingR.rotation.z = -flap;
      }
      if(motes.material.opacity > 0.01){
        const arr = motes.geometry.attributes.position.array;
        const n = motes.geometry.attributes.position.count;
        const sp = motes.userData.speed;
        for(let i=0;i<n;i++){
          const i3 = i*3;
          arr[i3] += Math.sin(s*0.7 + i*1.7)*sp*3;
          let y = arr[i3+1] + Math.cos(s*0.5 + i*2.3)*sp*2 - (sp > 0.01 ? sp : 0);
          if(y < 0) y = 26;
          arr[i3+1] = y;
        }
        motes.geometry.attributes.position.needsUpdate = true;
        motes.material.size = motes.userData.baseSize * (1 + Math.sin(s*2.1)*0.25); // ışık nabzı
      }
      if(composer) composer.render(); else renderer.render(scene, camera);
    })(0);
  }
  function resize(){
    if(!ok) return;
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
    if(composer){ composer.setSize(innerWidth, innerHeight); }
  }
  function retheme(){
    if(!ok) return;
    const p = PAL3D[S.settings.theme] || PAL3D.kavkaz;
    if(!PHOTO_MODE){
      scene.background = skyTexture(p.skyTop, p.skyBot);
      scene.fog = new THREE.Fog(p.fog, 55, 230);
    }
    dirLight.color.set(p.light); ambLight.color.set(p.amb);
    stars.material.opacity = PHOTO_MODE ? p.stars*0.7 : p.stars; // fotoğrafın kendi yıldızlarına ek pırıltı
    snow.material.opacity = p.snow;
    if(sun){
      sun.material.opacity = p.stars > 0 ? 0.5 : 1.0;
      sun.scale.setScalar(p.stars > 0 ? 22 : 46);
    }
    if(farRidge) farRidge.material.color.set(p.high);
    motes.material.color.set(p.mote.color);
    motes.material.opacity = p.mote.op;
    motes.userData.speed = p.mote.speed;
    motes.userData.baseSize = p.mote.size;
    motes.material.size = p.mote.size;
    if(bloomPass) bloomPass.strength = p.bloom;
    // kule pencereleri: gecede sıcak ışık (bloom parlatır), gündüz karanlık
    const winColor = p.stars > 0 ? 0xffc466 : 0x181310;
    towerWindows.forEach(m => m.color.set(winColor));
    // taş yapılar tema ışığına boyanır
    const stoneTint = { kavkaz:0xffffff, night:0x8890c8, forest:0xe4f0da, autumn:0xffdfc0, winter:0xe8eff8 }[S.settings.theme] || 0xffffff;
    stoneMats.forEach(m => m.color.set(stoneTint));
    if(terrain) paintTerrain(p);
  }
  function view(scr){
    if(scr === "scr-game"){ camYT = 7;  lookYT = 20; }   // oyunda: kamera alçak, bakış yukarı → ızgara arkası sade gök
    else if(scr === "scr-map"){ camYT = 11; lookYT = 10; } // haritada: hafif kuşbakışı
    else { camYT = 9; lookYT = 12; }                       // ana ekran
  }
  return { init, retheme, view, ready: () => _init };
})();

