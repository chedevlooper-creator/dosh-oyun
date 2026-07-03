/* ================= ÇEÇEN GRAFEMLER ================= */
export const PAL = "Ӏ"; // Ӏ palochka
export const DIGRAPHS = ["аь","гӀ","кх","къ","кӀ","оь","пӀ","тӀ","уь","хь","хӀ","цӀ","чӀ","юь","яь"].map(norm);
export const DSET = new Set(DIGRAPHS);
export function norm(s){ return s.toLowerCase().replace(/[Ӏӏ]|[iI]/g, PAL).trim(); }
export function splitG(word){
  const w = norm(word); const out = [];
  for (let i=0;i<w.length;){
    const two = w.slice(i,i+2);
    if (i+1<w.length && DSET.has(two)){ out.push(two); i+=2; }
    else { out.push(w[i]); i+=1; }
  }
  return out;
}
export function dispG(g){ return g.toUpperCase().replace(/[Ӏӏ]/g,"I"); } // görselde palochka = I (aynı görünür, her font destekler)
export function vibrate(p){ try{ if(navigator.vibrate) navigator.vibrate(p); }catch(e){} }

