/* ================= 3D SAHNE (Three.js — Kafkas Dağları) ================= */

import { S } from "../engine/save.js";
import { prefersReducedMotion } from "../utils/helpers.js";

const GL = (() => {
  let renderer, scene, camera, terrain, stars, snow, clouds = [], sun, dirLight, ambLight, hemiLight;
  let composer = null, bloomPass = null, motes = null, farRidge = null;
  let px = 0, py = 0, tpx = 0, tpy = 0, ok = false;

  const PAL3D = {
    kavkaz: { fog: 0x9fcbe0, low: 0x24405f, high: 0x3d5a80, snowline: 13, light: 0xfff2d0, amb: 0x8fb8d8, stars: 0, snow: 0,
      skyTop: "#3f95cc", skyBot: "#cfe9f4", bloom: 0.45, mote: { color: 0xffffff, op: 0.28, speed: 0.006, size: 0.55 } },
    night: { fog: 0x141a3e, low: 0x10163a, high: 0x252d5c, snowline: 15, light: 0x9aa5ff, amb: 0x2a3170, stars: 0.9, snow: 0,
      skyTop: "#05071c", skyBot: "#2a2558", bloom: 0.85, mote: { color: 0xffd98a, op: 0.85, speed: 0.004, size: 0.8 } },
    forest: { fog: 0xa7d4b8, low: 0x143528, high: 0x2f6b4f, snowline: 17, light: 0xffe9b0, amb: 0x6aa583, stars: 0, snow: 0,
      skyTop: "#5cae83", skyBot: "#e2f2d3", bloom: 0.5, mote: { color: 0xd8ff9a, op: 0.6, speed: 0.005, size: 0.7 } },
    autumn: { fog: 0xe8b98a, low: 0x5c2f1c, high: 0x9c5636, snowline: 16, light: 0xffd9a0, amb: 0xcf8a5c, stars: 0, snow: 0,
      skyTop: "#e88f4e", skyBot: "#ffe3bd", bloom: 0.6, mote: { color: 0xffa050, op: 0.75, speed: 0.012, size: 0.9 } },
    winter: { fog: 0xd4e4f2, low: 0x7d9ab8, high: 0xb9cede, snowline: 6, light: 0xffffff, amb: 0xd6e6f5, stars: 0, snow: 0.9,
      skyTop: "#88b4dc", skyBot: "#f0f7ff", bloom: 0.4, mote: { color: 0xffffff, op: 0, speed: 0.005, size: 0.5 } },
  };

  function hillNoise(x, z) {
    let h = Math.sin(x * 0.055 + z * 0.031) * Math.sin(z * 0.043 - x * 0.012) * 0.5 + 0.5;
    h += (Math.sin(x * 0.11 + 1.7) * Math.sin(z * 0.09 + 4.2) * 0.5 + 0.5) * 0.5;
    h += (Math.sin(x * 0.23 + 9.1) * Math.sin(z * 0.19 + 2.8) * 0.5 + 0.5) * 0.25;
    h += (Math.sin(x * 0.47 + 3.3) * Math.sin(z * 0.41 + 7.6) * 0.5 + 0.5) * 0.12;
    h += (Math.sin(x * 0.93 + 5.9) * Math.sin(z * 0.87 + 1.4) * 0.5 + 0.5) * 0.06;
    return h / 1.93;
  }

  function skyTexture(top, bot) {
    const c = document.createElement("canvas"); c.width = 2; c.height = 512;
    const g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 512);
    gr.addColorStop(0, top); gr.addColorStop(1, bot);
    g.fillStyle = gr; g.fillRect(0, 0, 2, 512);
    return new THREE.CanvasTexture(c);
  }

  function glowTexture(inner, outer) {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    gr.addColorStop(0, inner); gr.addColorStop(1, outer);
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  function buildTerrain() {
    const geo = new THREE.PlaneGeometry(260, 100, 150, 56);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i) - 38;
      const depth = THREE.MathUtils.clamp((-z - 8) / 55, 0, 1);
      pos.setY(i, Math.pow(hillNoise(x, z), 1.6) * 36 * depth - 2);
      pos.setZ(i, z);
    }
    geo.computeVertexNormals();
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3));
    const mat = new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 4 });
    terrain = new THREE.Mesh(geo, mat);
    scene.add(terrain);
  }

  function paintTerrain(p) {
    const pos = terrain.geometry.attributes.position, col = terrain.geometry.attributes.color;
    const low = new THREE.Color(p.low), high = new THREE.Color(p.high), snowC = new THREE.Color(0xf4f9ff), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = THREE.MathUtils.clamp((y + 2) / 30, 0, 1);
      c.copy(low).lerp(high, t);
      const sl = p.snowline + hillNoise(pos.getX(i) * 3.1, pos.getZ(i) * 2.7) * 4;
      if (y > sl) c.lerp(snowC, THREE.MathUtils.clamp((y - sl) / 5, 0, 1));
      col.setXYZ(i, c.r, c.g, c.b);
    }
    col.needsUpdate = true;
  }

  function init() {
    if (typeof THREE === "undefined") return;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("gl"), antialias: true });
    } catch (e) { return; }
    ok = true;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 400);
    camera.position.set(0, 9, 30);

    hemiLight = new THREE.HemisphereLight(0xffffff, 0x334466, 0.55);
    scene.add(hemiLight);
    ambLight = new THREE.AmbientLight(0x8fb8d8, 0.35);
    scene.add(ambLight);
    dirLight = new THREE.DirectionalLight(0xfff2d0, 0.95);
    dirLight.position.set(35, 60, -40);
    scene.add(dirLight);

    buildTerrain();

    // Yıldızlar
    {
      const n = 900, arr = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, r = 150 + Math.random() * 140, y = 20 + Math.random() * 160;
        arr[i * 3] = Math.cos(a) * r; arr[i * 3 + 1] = y; arr[i * 3 + 2] = Math.sin(a) * r - 60;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
      stars = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.3, transparent: true, opacity: 0, sizeAttenuation: false }));
      scene.add(stars);
    }

    // Kar
    {
      const n = 700, arr = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { arr[i * 3] = (Math.random() - 0.5) * 120; arr[i * 3 + 1] = Math.random() * 55; arr[i * 3 + 2] = (Math.random() - 0.5) * 90 - 20; }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
      snow = new THREE.Points(g, new THREE.PointsMaterial({
        color: 0xffffff, size: 0.5, transparent: true, opacity: 0,
        map: glowTexture("rgba(255,255,255,1)", "rgba(255,255,255,0)"), depthWrite: false,
      }));
      scene.add(snow);
    }

    // Bulutlar
    {
      const tex = glowTexture("rgba(255,255,255,.85)", "rgba(255,255,255,0)");
      for (let i = 0; i < 7; i++) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.32, depthWrite: false }));
        sp.position.set((Math.random() - 0.5) * 180, 26 + Math.random() * 18, -50 - Math.random() * 40);
        sp.scale.set(34 + Math.random() * 26, 12 + Math.random() * 7, 1);
        sp.userData.v = 0.008 + Math.random() * 0.014;
        clouds.push(sp); scene.add(sp);
      }
    }

    // Güneş
    sun = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture("rgba(255,244,214,1)", "rgba(255,214,110,0)"), transparent: true, depthWrite: false,
    }));
    sun.position.set(46, 48, -95); sun.scale.set(46, 46, 1); scene.add(sun);

    // Uzak sırt
    {
      const geo = new THREE.PlaneGeometry(500, 70, 60, 10);
      geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i) - 130;
        pos.setY(i, Math.pow(hillNoise(x * 0.6 + 400, z), 1.5) * 55 - 2);
        pos.setZ(i, z);
      }
      geo.computeVertexNormals();
      farRidge = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x3d5a80, fog: true }));
      scene.add(farRidge);
    }

    // Partiküller (toz / ateş böceği)
    {
      const n = 130, arr = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { arr[i * 3] = (Math.random() - 0.5) * 90; arr[i * 3 + 1] = Math.random() * 26 + 1; arr[i * 3 + 2] = (Math.random() - 0.5) * 60 - 5; }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
      motes = new THREE.Points(g, new THREE.PointsMaterial({
        color: 0xffffff, size: 0.7, transparent: true, opacity: 0,
        map: glowTexture("rgba(255,255,255,1)", "rgba(255,255,255,0)"),
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      motes.userData.speed = 0.005;
      scene.add(motes);
    }

    // Bloom
    try {
      if (THREE.EffectComposer && THREE.UnrealBloomPass) {
        composer = new THREE.EffectComposer(renderer);
        composer.addPass(new THREE.RenderPass(scene, camera));
        bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.5, 0.65, 0.82);
        composer.addPass(bloomPass);
      }
    } catch (e) { composer = null; }

    resize();
    retheme();
    addEventListener("resize", resize);
    matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (e) => {
      // REDUCED check is inline
    });
    addEventListener("pointermove", (e) => {
      tpx = e.clientX / innerWidth - 0.5;
      tpy = e.clientY / innerHeight - 0.5;
    }, { passive: true });
    document.body.classList.add("gl-on");

    let last = 0, paused = false;
    document.addEventListener("visibilitychange", () => { paused = document.hidden; });
    window.__doshGL = { pause() { paused = true; }, resume() { paused = false; } };

    (function anim(t) {
      requestAnimationFrame(anim);
      if (paused || t - last < 33) return; last = t;
      const s = t / 1000;

      if (prefersReducedMotion()) { px = 0; py = 0; }
      else { px += (tpx - px) * 0.04; py += (tpy - py) * 0.04; }

      camera.position.x = prefersReducedMotion() ? 0 : (px * 3 + Math.sin(s * 0.10) * 1.1);
      camera.position.y = prefersReducedMotion() ? 9 : (9 + py * 1.6 + Math.sin(s * 0.13) * 0.4);
      camera.lookAt(0, 12, -60);

      for (const c of clouds) { c.position.x += c.userData.v; if (c.position.x > 110) c.position.x = -110; }

      if (snow.material.opacity > 0.01) {
        const p = snow.geometry.attributes.position;
        for (let i = 0; i < p.count; i++) {
          let y = p.getY(i) - 0.045;
          if (y < 0) y = 55;
          p.setY(i, y); p.setX(i, p.getX(i) + Math.sin(s + i) * 0.006);
        }
        p.needsUpdate = true;
      }
      stars.rotation.y = s * 0.004;

      if (motes.material.opacity > 0.01) {
        const p = motes.geometry.attributes.position, sp = motes.userData.speed;
        for (let i = 0; i < p.count; i++) {
          p.setX(i, p.getX(i) + Math.sin(s * 0.7 + i * 1.7) * sp * 3);
          let y = p.getY(i) + Math.cos(s * 0.5 + i * 2.3) * sp * 2 - (sp > 0.01 ? sp : 0);
          if (y < 0) y = 26;
          p.setY(i, y);
        }
        p.needsUpdate = true;
        motes.material.size = motes.userData.baseSize * (1 + Math.sin(s * 2.1) * 0.25);
      }

      if (composer) composer.render();
      else renderer.render(scene, camera);
    })(0);
  }

  function resize() {
    if (!ok) return;
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    if (composer) composer.setSize(innerWidth, innerHeight);
  }

  function retheme() {
    if (!ok) return;
    const p = PAL3D[S.settings.theme] || PAL3D.kavkaz;
    scene.background = skyTexture(p.skyTop, p.skyBot);
    scene.fog = new THREE.Fog(p.fog, 40, 200);
    dirLight.color.set(p.light);
    ambLight.color.set(p.amb);
    stars.material.opacity = p.stars;
    snow.material.opacity = p.snow;
    sun.material.opacity = p.stars > 0 ? 0.5 : 1.0;
    sun.scale.setScalar(p.stars > 0 ? 22 : 46);
    farRidge.material.color.set(p.high);
    motes.material.color.set(p.mote.color);
    motes.material.opacity = p.mote.op;
    motes.userData.speed = p.mote.speed;
    motes.userData.baseSize = p.mote.size;
    motes.material.size = p.mote.size;
    if (bloomPass) bloomPass.strength = p.bloom;
    paintTerrain(p);
  }

  return { init, retheme };
})();

export { GL };
