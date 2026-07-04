// @ts-check
/* ================= KALICI KAYIT (localStorage) ================= */
import { snapshot, hydrate } from "./store.js";
import { toast } from "../utils/helpers.js";

const KEY = "dosh-save-v1";

export function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(raw){
      hydrate(JSON.parse(raw));
      return true;
    }
  }catch(e){
    console.warn("[save] localStorage yüklenemedi:", e);
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
      console.error("[save] Kota aşıldı, ilerleme kaydedilemedi.");
      toast("Эшам: Йитер меттиг яц! ⚠️", "bad");
    } else {
      console.error("[save] Kayıt başarısız:", e);
    }
    return false;
  }
}

export function clearAll(){
  try{ localStorage.removeItem(KEY); }catch{}
}
