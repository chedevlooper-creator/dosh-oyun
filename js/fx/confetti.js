import { $ } from "../utils/helpers.js";

/* ================= KONFETİ / PARÇACIK ================= */
const fx = $("fx"), fctx = fx.getContext("2d");
let parts = [];
export function fxSize(){ fx.width=innerWidth*devicePixelRatio; fx.height=innerHeight*devicePixelRatio; fctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); }
addEventListener("resize", fxSize); fxSize();
export function confetti(n=90){
  const colors=["#ffc94d","#43d9a3","#7ad0ff","#ff8fa3","#c9a3ff","#ffffff"];
  for(let i=0;i<n;i++) parts.push({ x:innerWidth/2+(Math.random()-0.5)*160, y:innerHeight*0.32,
    vx:(Math.random()-0.5)*11, vy:-Math.random()*11-3, g:.28, r:Math.random()*5+3,
    c:colors[(Math.random()*colors.length)|0], a:1, rot:Math.random()*6.28, vr:(Math.random()-0.5)*0.3 });
}
(function loop(){
  fctx.clearRect(0,0,innerWidth,innerHeight);
  parts = parts.filter(p=>p.a>0.02 && p.y<innerHeight+30);
  for(const p of parts){
    p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.rot+=p.vr; p.a-=0.004;
    fctx.save(); fctx.globalAlpha=p.a; fctx.translate(p.x,p.y); fctx.rotate(p.rot);
    fctx.fillStyle=p.c; fctx.fillRect(-p.r,-p.r*0.6,p.r*2,p.r*1.2); fctx.restore();
  }
  requestAnimationFrame(loop);
})();

