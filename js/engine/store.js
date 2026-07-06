// @ts-check
/* ================================================================
   STORE - Tek dogruluk kaynagi (Single Source of Truth)
   ---------------------------------------------------------------
   S (kalici kayit) ve G (aktif oyun durumu) bu modulden okunur.
   Dogrudan atama (S.coins += 5) otomatik commit tetikler ve:
     1. save()'i debounce eder (1000ms — mobilde localStorage yazma sıklığını azalt)
     2. 3D sahnenin retheme()'ini tetikler (tema degisikliginde)
     3. bonus merge'i atomik yapar
   API: commitS(patch), commitG(patch), resetG(), resetS()
   ================================================================ */
import { save } from "./save.js";

/* ---------- dahili durum ---------- */
const _S = {
  coins: 100,
  stars: {},
  dict: {},
  settings: { theme: "kavkaz", scene3d: true, sound: true, music: true, lang: "ce" },
  stats: { words: 0, coinsEarned: 0, coinsSpent: 0, hints: 0,
           bonusWords: 0, bestStreak: 0, levelsDone: 0 },
  lastDaily: "",
  lastGift: "",
  daily: { last: "", streak: 0, best: 0 },
  tut: false,
};
let _G = null;

let _onThemeChange = null;
let _saveTimer = 0;

/* ---------- yardimcilar ---------- */
function notifyTheme(){
  if(typeof _onThemeChange === "function"){
    try{ _onThemeChange(); }catch(e){ console.warn("[store] theme cb:", e); }
  }
}
/* Mobilde JSON.stringify(localStorage.setItem) -> daha uzun debounce.
 * Masaüstünde 300ms (hızlı kayıt), mobilde 1000ms (CPU/batarya tasarrufu). */
const _isCoarse = (typeof matchMedia === "function") && matchMedia("(pointer: coarse)").matches;
const _saveDelay = _isCoarse ? 1000 : 300;
function scheduleSave(){
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(()=>{
    try{ save(); }catch(e){ console.error("[store] save failed:", e); }
  }, _saveDelay);
}

/* ---------- Proxy ---------- */
/* Proxy'lenmiş nesneler veri üzerine işaret yazmadan WeakMap ile izlenir
   (aksi halde __proxy işareti localStorage'a sızıp sözlükte sahte kayıt yaratır) */
const _nestedProxies = new WeakMap();
function makeProxy(target, scope){
  return new Proxy(target, {
    get(obj, key){
      const v = obj[key];
      if(v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Map) && !(v instanceof Set)){
        let p = _nestedProxies.get(v);
        if(!p){
          p = new Proxy(v, {
            set(nested, k, val){
              nested[k] = val;
              if(scope === "S"){ scheduleSave(); if(k === "theme") notifyTheme(); }
              return true;
            },
            deleteProperty(nested, k){
              delete nested[k];
              if(scope === "S") scheduleSave();
              return true;
            }
          });
          _nestedProxies.set(v, p);
        }
        return p;
      }
      return v;
    },
    set(obj, key, val){
      const before = obj[key];
      obj[key] = val;
      if(scope === "S"){
        scheduleSave();
        if(key === "settings" && val && val.theme !== before && before && before.theme) notifyTheme();
      }
      return true;
    },
    deleteProperty(obj, key){
      delete obj[key];
      if(scope === "S") scheduleSave();
      return true;
    }
  });
}

/* ---------- API ---------- */
export function setOnThemeChange(fn){ _onThemeChange = fn; }

export function commitS(patch){
  const themeChanged = patch && patch.settings && patch.settings.theme && patch.settings.theme !== _S.settings.theme;
  Object.assign(_S, patch);
  if(themeChanged) notifyTheme();
  scheduleSave();
}
export function commitSettings(patch){
  const before = _S.settings.theme;
  Object.assign(_S.settings, patch);
  if(patch.theme && patch.theme !== before) notifyTheme();
  scheduleSave();
}

/* G'yi sifirlar (yeni seviye baslatilirken) */
export function setG(initial){
  _G = initial;
  if(_onGClear) _onGClear();
}
let _onGClear = null;
export function onGClear(fn){ _onGClear = fn; }

export function commitG(patch){
  if(!_G) return;
  Object.assign(_G, patch);
}
export function getG(){ return _G; }

/* ---------- bonus merge (atomik) ---------- */
export function addFoundWord(wordNorm, opts){
  opts = opts || {};
  const before = _S.coins;
  _S.dict[wordNorm] = 1;
  if(opts.isBonus){
    _S.stats.bonusWords = (_S.stats.bonusWords || 0) + 1;
  } else {
    _S.stats.words = (_S.stats.words || 0) + 1;
  }
  if(typeof opts.coins === "number"){
    _S.coins += opts.coins;
    _S.stats.coinsEarned = (_S.stats.coinsEarned || 0) + opts.coins;
  }
  scheduleSave();
  return { coinDelta: _S.coins - before };
}

/* kalici kayit yukle (save.js tarafindan init aninda cagrilir)
 * `persisted` snapshot()'dan gelen eski sürüm olabilir; migration pipeline'dan geçirilir. */
export function hydrate(persisted){
  const migrated = migrate(persisted);
  if(migrated && typeof migrated === "object"){
    Object.assign(_S, migrated);
  }
  if(typeof _S.coins !== "number") _S.coins = 100;
  if(!_S.stars || typeof _S.stars !== "object") _S.stars = {};
  if(!_S.dict || typeof _S.dict !== "object") _S.dict = {};
  if(!_S.settings || typeof _S.settings !== "object") _S.settings = { theme:"kavkaz", scene3d:true, sound:true, music:true, lang:"ce" };
  if(typeof _S.settings.lang !== "string") _S.settings.lang = "ce";
  if(typeof _S.settings.music !== "boolean") _S.settings.music = true;
  if(typeof _S.tut !== "boolean") _S.tut = false;
  if(typeof _S.lastGift !== "string") _S.lastGift = "";
  if(!_S.daily || typeof _S.daily !== "object") _S.daily = {};
  if(typeof _S.daily.last !== "string") _S.daily.last = "";
  if(typeof _S.daily.streak !== "number") _S.daily.streak = 0;
  if(typeof _S.daily.best !== "number") _S.daily.best = 0;
  if(!_S.stats || typeof _S.stats !== "object") _S.stats = {};
  for(const k of ["words","coinsEarned","coinsSpent","hints","bonusWords","bestStreak","levelsDone"]){
    if(typeof _S.stats[k] !== "number") _S.stats[k] = 0;
  }
  if(typeof _S.settings.theme !== "string") _S.settings.theme = "kavkaz";
  // Eski sürümün sızdırdığı __proxy işaretlerini kayıttan temizle
  for(const o of [_S, _S.stars, _S.dict, _S.settings, _S.stats]){
    if(o && typeof o === "object") delete o.__proxy;
  }
}

/* ---------- schema versiyonu ----------
 * snapshot() her zaman geçerli SAVE_VERSION'ı yazar; hydrate() okurken
 * eski sürümler için migration pipeline uygular. Şu an v1 ile v2 özdeş
 * (henüz breaking değişiklik yok), ama altyapı yerinde. */
export const SAVE_VERSION = 2;

const MIGRATIONS = {
  // 1 -> 2: identity migration (alan eklemedi / yeniden adlandırmadı)
  1: (data) => ({ ...data, _v: 2 }),
};

function migrate(persisted){
  let v = (persisted && typeof persisted === "object") ? (persisted._v | 0) : 1;
  if (v === 0) v = 1; // eski snapshot'lar _v içermez
  let cur = persisted;
  while (v < SAVE_VERSION) {
    const step = MIGRATIONS[v];
    if (!step) {
      console.warn(`[store] save migration: no path from v${v} to v${SAVE_VERSION}; aborting`);
      return null;
    }
    cur = step(cur) || cur;
    v = (cur && cur._v) | 0;
  }
  if (cur && cur._v !== SAVE_VERSION) cur = { ...cur, _v: SAVE_VERSION };
  return cur;
}

/* snapshot - save()'e verilecek kopya */
export function snapshot(){
  return {
    _v: SAVE_VERSION,
    coins: _S.coins,
    stars: Object.assign({}, _S.stars),
    dict: Object.assign({}, _S.dict),
    settings: Object.assign({}, _S.settings),
    stats: Object.assign({}, _S.stats),
    lastDaily: _S.lastDaily,
    lastGift: _S.lastGift,
    daily: Object.assign({}, _S.daily),
    tut: _S.tut,
  };
}

/* ---------- readonly proxy'ler (mevcut import'lar icin) ---------- */
export const S = makeProxy(_S, "S");
export const G = makeProxy(new Proxy({}, {
  get(_t, k){ return _G ? _G[k] : undefined; },
  set(_t, k, v){ if(_G){ _G[k] = v; return true; } return false; }
}), "G");
