// @ts-check
import { S } from "../engine/store.js";
import { closePanel, openPanel } from "./panel.js";
import { SFX } from "../engine/audio.js";
import { $ } from "../utils/helpers.js";
import { t } from "../utils/i18n.js";

async function _goMap() {
  closePanel(); S.tut = true;
  const { openMap } = await import("./map.js");
  openMap();
}

/* ================= REHBER (tutorial) ================= */
export function tutorial(){
  const steps = [
    ["tut.0.title","tut.0.body","tut.0.btn"],
    ["tut.1.title","tut.1.body","tut.1.btn"],
    ["tut.2.title","tut.2.body","tut.2.btn"],
    ["tut.3.title","tut.3.body","tut.3.btn"],
  ];
  let i = 0;
  const step = ()=>{
    if(i>=steps.length){ _goMap(); return; }
    const [tk, bk, btnk] = steps[i];
    openPanel(`<h2>${t(tk)}</h2><p class="center" style="font-size:17px;line-height:1.55">${t(bk)}</p>
      <div class="btnrow"><button class="btn small" id="tut-next">${t(btnk)}</button>
      <button class="btn small ghost" id="tut-skip">${t("tut.skip")}</button></div>`);
    $("tut-next").onclick = ()=>{ SFX.coin(); i++; step(); };
    $("tut-skip").onclick = _goMap;
  };
  step();
}

