// @ts-check
/* ================= KALICI KAYIT (localStorage) ================= */
import { snapshot, hydrate } from "./store.js";
import { toast } from "../utils/helpers.js";
import { warn, error } from "../utils/logger.js";

const KEY = "dosh-save-v1";

export function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(raw){
      hydrate(JSON.parse(raw));
      return true;
    }
  }catch(e){
    warn("[save] localStorage yüklenemedi:", e);
  }
  return false;
}

export function save(){
  try{
    const data = snapshot();
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  }catch(e){
    if(e && e.name === "QuotaExceededError"){
      error("[save] Kota aşıldı, ilerleme kaydedilemedi.");
      toast("Эшам: Йитер меттиг яц! ⚠️", "bad");
    } else {
      error("[save] Kayıt başarısız:", e);
    }
    return false;
  }
}

export function clearAll(){
  try{ localStorage.removeItem(KEY); }catch{}
}

/* ---------- yedekleme: dışa / içe aktarma ----------
 * localStorage tek kopya — tarayıcı verisi silinince ilerleme gider.
 * Export: snapshot'ın JSON'u (dosya olarak indirilir).
 * Import: JSON doğrulanır, hydrate migration pipeline'ından geçer, kaydedilir. */

export function exportSave(){
  return JSON.stringify(snapshot(), null, 2);
}

/**
 * @param {string} json
 * @returns {{ ok: boolean, error?: "parse"|"format" }}
 */
export function importSave(json){
  let data;
  try{ data = JSON.parse(json); }catch{ return { ok:false, error:"parse" }; }
  if(!data || typeof data !== "object" || Array.isArray(data)
     || typeof data.coins !== "number"
     || !data.settings || typeof data.settings !== "object"){
    return { ok:false, error:"format" };
  }
  hydrate(data); // eski sürüm yedekler migration + varsayılanlarla onarılır
  save();
  return { ok:true };
}
