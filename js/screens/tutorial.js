// @ts-check
import { S } from "../engine/store.js";
import { closePanel, openPanel } from "./panel.js";
import { openMap } from "./map.js";
import { SFX } from "../engine/audio.js";
import { $ } from "../utils/helpers.js";

/* ================= REHBER (tutorial) ================= */
export function tutorial(){
  const steps = [
    ["Дош ойлане!","Харфаш харжа, дешнаш лаха.","Болх бале!"],
    ["Харфаш харжа","ПӀелг харфех хьекха: «Д», «О», «Ш» → «ДОШ».","Кхин дӀа"],
    ["ГӀирс","Хьехам 💡 — 25 🪙. ХӀан хьахо 🎯 — 35 🪙. Хьехаман тай 🪄 — 60 🪙.","Кхин дӀа"],
    ["Кечдина!","ХӀинца ловза.","Ловза йолае!"],
  ];
  let i = 0;
  const step = ()=>{
    if(i>=steps.length){ closePanel(); S.tut = true; openMap(); return; }
    const [t,b,btn] = steps[i];
    openPanel(`<h2>${t}</h2><p class="center" style="font-size:17px;line-height:1.55">${b}</p>
      <div class="btnrow"><button class="btn small" id="tut-next">${btn}</button>
      <button class="btn small ghost" id="tut-skip">Арадовла</button></div>`);
    $("tut-next").onclick = ()=>{ SFX.coin(); i++; step(); };
    $("tut-skip").onclick = ()=>{ closePanel(); S.tut=true; openMap(); };
  };
  step();
}

