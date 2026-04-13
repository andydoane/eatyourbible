:root{
  --vinv-bg:#333333;
  --vinv-build-bg:#ffffff;
  --vinv-text-dark:#333333;
  --vinv-red:#ff5a51;
  --vinv-yellow:#ffc751;
  --vinv-blue:#40b9c5;
  --vinv-green:#a7cb6f;
  --vinv-white:#ffffff;
  --vinv-side:14px;
  --vinv-stage-max:860px;
  --vinv-radiation-symbol:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 26.458333 26.458333'><g transform='matrix(0.06803649,0,0,0.06803649,-4.1881757,-4.1915776)'><path d='m 293.5,264.4 c 0,-20.7 -16.8,-37.5 -37.5,-37.5 -20.7,0 -37.5,16.8 -37.5,37.5 0,20.7 16.8,37.5 37.5,37.5 20.7,0 37.5,-16.9 37.5,-37.5 z'/><path d='m 256,189.4 c 20.9,0 39.8,8.6 53.4,22.5 l 59.1,-98.4 -16,-9.7 C 294,68.6 218.2,68.6 159.7,103.8 l -16,9.7 59.1,98.4 C 216.2,198 235.1,189.4 256,189.4 Z'/><path d='m 328.3,245.6 c 1.6,6 2.7,12.2 2.7,18.8 0,34 -22.9,62.4 -53.9,71.6 l 59.2,98.7 16.1,-9.7 c 57.1,-34.3 91.1,-94.3 91.1,-160.6 v -18.8 z'/><path d='m 181,264.4 c 0,-6.5 1.1,-12.7 2.7,-18.8 H 68.5 v 18.8 c 0,66.3 34.1,126.3 91.1,160.6 l 16.1,9.7 59.2,-98.7 C 203.9,326.8 181,298.3 181,264.4 Z'/></g></svg>");
}

html,body{
  height:100%;
}

body{
  margin:0;
  background:var(--vinv-bg);
  color:var(--vinv-white);
  -webkit-user-select:none;
  user-select:none;
  -webkit-touch-callout:none;
}

#app.vm-shell{
  min-height:100dvh;
  height:100dvh;
  padding:0;
  display:block;
  overflow:hidden;
}

.vinv-shell,
.vinv-mode-shell{
  min-height:100dvh;
  height:100dvh;
  display:flex;
  flex-direction:column;
  overflow:hidden;
  background:var(--vinv-bg);
}

.vinv-stage,
.vinv-mode-stage{
  width:100%;
  max-width:var(--vinv-stage-max);
  margin:0 auto;
  flex:1 1 auto;
  min-height:0;
  display:flex;
  flex-direction:column;
}

.vinv-mode-top{
  flex:1 1 auto;
  min-height:0;
  display:flex;
  flex-direction:column;
  justify-content:center;
  align-items:center;
  text-align:center;
  gap:12px;
  padding:24px 18px;
}

.vinv-title{
  font-size:clamp(30px,6vw,58px);
  font-weight:900;
  line-height:1.02;
}

.vinv-subtitle{
  font-size:clamp(18px,2.6vw,28px);
  font-weight:800;
  line-height:1.18;
  max-width:700px;
}

.vinv-mode-card{
  width:min(100%,640px);
  background:rgba(255,255,255,0.08);
  border-radius:24px;
  padding:16px;
}

.vinv-mode-actions{
  display:flex;
  flex-direction:column;
  gap:14px;
}

.vm-btn{
  min-height:58px;
  border:none;
  border-radius:20px;
  background:#ffffff;
  color:#333333;
  font:inherit;
  font-size:clamp(20px,4vw,28px);
  font-weight:900;
  box-shadow:0 6px 0 rgba(0,0,0,0.24);
}

.vinv-build-wrap{
  flex:0 0 auto;
  padding:12px var(--vinv-side) 10px;
}

.vinv-build{
  background:var(--vinv-build-bg);
  color:var(--vinv-text-dark);
  border-radius:22px;
  padding:16px 18px;
  min-height:108px;
  display:flex;
  align-items:center;
  justify-content:center;
  text-align:center;
}

.vinv-build.is-shake{
  animation:vinvShake 280ms ease;
}

.vinv-build-text{
  font-size:clamp(21px,5vw,38px);
  line-height:1.18;
  font-weight:900;
  text-wrap:balance;
}

.vinv-build-token{
  color:transparent;
  transition:color 160ms ease;
}

.vinv-build-token.is-built.is-verse{
  color:var(--vinv-text-dark);
}

.vinv-build-token.is-built.is-book,
.vinv-build-token.is-built.is-reference{
  color:var(--vinv-green);
}

.vinv-field-wrap{
  flex:1 1 auto;
  min-height:0;
  display:flex;
  flex-direction:column;
  padding:0 var(--vinv-side) calc(10px + env(safe-area-inset-bottom));
}

.vinv-field{
  position:relative;
  flex:1 1 auto;
  min-height:280px;
  border-radius:26px;
  overflow:hidden;
  background:
    radial-gradient(circle at top, rgba(255,255,255,0.09), transparent 40%),
    linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.12));
}

.vinv-field.is-flash-bad{
  animation:vinvFlashBad 260ms ease;
}

.vinv-lanes,
.vinv-entities,
.vinv-rockets,
.vinv-effects,
.vinv-bottom,
.vinv-bonus,
.vinv-overlay-msg,
.vinv-hud-overlay{
  position:absolute;
  inset:0;
  pointer-events:none;
}

.vinv-lane{
  position:absolute;
  top:0;
  bottom:0;
  width:33.3333%;
  border-left:1px solid rgba(255,255,255,0.08);
}
.vinv-lane:first-child{ border-left:none; }

.vinv-lane-guide{
  position:absolute;
  left:50%;
  top:0;
  bottom:18px;
  width:2px;
  transform:translateX(-50%);
  background:linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0));
}

.vinv-hud-overlay{
  z-index:2;
}

.vinv-hud-overlay{
  z-index:2;
  pointer-events:none;
}

.vinv-corner-pill{
  pointer-events:auto;
  cursor:pointer;
}

.vinv-corner-pill{
  position:absolute;
  top:12px;
  background:rgba(255,255,255,0.96);
  color:#333333;
  border-radius:999px;
  padding:6px 12px;
  font-weight:900;
  font-size:15px;
}

.vinv-corner-left{ left:12px; }
.vinv-corner-right{ right:12px; }

.vinv-entity{
  position:absolute;
  width:min(29vw,170px);
  max-width:170px;
  min-width:84px;
  text-align:center;
  will-change:transform, opacity;
  transform-origin:center top;
}

.vinv-alien{
  display:flex;
  align-items:center;
  justify-content:center;
  line-height:1;
}

.vinv-alien-img{
  display:block;
  width:clamp(62px, 15vw, 118px);
  height:auto;
  filter:drop-shadow(0 3px 0 rgba(0,0,0,0.18));
  pointer-events:none;
  user-select:none;
  -webkit-user-drag:none;
}

.vinv-word{
  margin-top:6px;
  font-weight:900;
  font-size:clamp(18px,3.8vw,32px);
  line-height:1.06;
  text-shadow:0 2px 0 rgba(0,0,0,0.20);
  word-break:break-word;
}

.vinv-abduct-passenger{
  margin-top:8px;
  line-height:1;
  display:flex;
  align-items:center;
  justify-content:center;
}

.vinv-abductee-img{
  display:block;
  width:clamp(42px, 10vw, 78px);
  height:auto;
  pointer-events:none;
  user-select:none;
  -webkit-user-drag:none;
}

.vinv-abduct-wrap{
  z-index:3;
}

.vinv-abduct-stack{
  display:flex;
  flex-direction:column;
  align-items:center;
  position:relative;
}

.vinv-beam{
  position:absolute;
  transform:translate(-50%,-50%);
  text-align:center;
}

.vinv-beam{
  width:clamp(36px,8vw,68px);
  height:118px;
  border-radius:999px;
  background:linear-gradient(180deg, rgba(255,255,255,0), rgba(255,245,160,0.8), rgba(255,255,255,0));
  animation:vinvBeam 260ms ease-in-out infinite alternate;
}

.vinv-beam-abduct{
  top:32px;
  left:0;
}

.vinv-entity.is-fade{ animation:vinvFadeOut 240ms ease forwards; }
.vinv-entity.is-correct-pause{ animation:vinvCorrectPause 140ms ease forwards; }

.vinv-effect-wrap{
  position:absolute;
  transform:translate(-50%,-50%);
  width:0;
  height:0;
}

.vinv-particle,
.vinv-effect-ring,
.vinv-effect-center,
.vinv-effect-flash,
.vinv-effect-shell,
.vinv-effect-cross,
.vinv-effect-cross::before{
  position:absolute;
  left:0;
  top:0;
  transform:translate(-50%,-50%);
}

.vinv-particle{
  box-shadow:0 0 10px rgba(255,255,255,0.24);
}

.vinv-particle.is-dot,
.vinv-particle.is-plasma,
.vinv-particle.is-smoke{
  border-radius:999px;
}

.vinv-particle.is-petal{
  border-radius:999px 999px 999px 0;
}

.vinv-particle.is-star{
  clip-path:polygon(50% 0%, 62% 34%, 100% 38%, 72% 58%, 82% 100%, 50% 74%, 18% 100%, 28% 58%, 0% 38%, 38% 34%);
}

.vinv-particle.is-shard{
  clip-path:polygon(50% 0%, 100% 48%, 50% 100%, 0% 48%);
}

.vinv-particle.is-confetti{
  border-radius:2px;
}

.vinv-particle.is-crackle{
  width:4px !important;
  height:12px !important;
  border-radius:999px;
}

.vinv-particle.is-spark{
  width:3px !important;
  height:3px !important;
  border-radius:999px;
  box-shadow:0 0 8px rgba(255,255,255,0.9);
}

.vinv-effect-ring{
  border:3px solid rgba(255,255,255,0.92);
  border-radius:999px;
  box-shadow:0 0 12px rgba(255,255,255,0.22);
}

.vinv-effect-center{
  border-radius:999px;
  background:radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 38%, rgba(255,255,255,0) 74%);
}

.vinv-effect-flash{
  border-radius:999px;
  background:radial-gradient(circle, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.16) 42%, rgba(255,255,255,0) 72%);
}

.vinv-effect-shell{
  border-radius:999px;
  border:1px solid rgba(255,255,255,0.3);
}

.vinv-effect-cross,
.vinv-effect-cross::before{
  width:56px;
  height:4px;
  border-radius:999px;
  background:rgba(255,255,255,0.82);
  box-shadow:0 0 10px rgba(255,255,255,0.26);
  content:"";
}

.vinv-effect-cross{
  transform:translate(-50%,-50%) rotate(0deg);
}

.vinv-effect-cross::before{
  transform:translate(-50%,-50%) rotate(90deg);
}

.vinv-controls{
  flex:0 0 auto;
  display:grid;
  grid-template-columns:repeat(3, minmax(0,1fr));
  gap:12px;
  padding:14px 0 0;
}

.vinv-lane-btn{
  min-height:68px;
  border:none;
  border-radius:22px;
  color:#ffffff;
  font:inherit;
  font-size:clamp(18px,3.8vw,26px);
  font-weight:900;
  box-shadow:0 6px 0 rgba(0,0,0,0.24);
  transition:transform 90ms ease, opacity 140ms ease, filter 140ms ease;
  display:flex;
  align-items:center;
  justify-content:center;
  position:relative;
}

.vinv-lane-btn:active{ transform:translateY(4px); box-shadow:0 2px 0 rgba(0,0,0,0.24); }
.vinv-lane-btn.is-dim{ opacity:0.34; filter:saturate(0.6); }
.vinv-lane-btn:disabled{ cursor:default; }

.vinv-lane-btn[data-color="red"]{
  background:var(--vinv-red);
  color:#ffffff;
}

.vinv-lane-btn[data-color="yellow"]{
  background:var(--vinv-yellow);
  color:#333333;
}

.vinv-lane-btn[data-color="blue"]{
  background:var(--vinv-blue);
  color:#ffffff;
}

.vinv-lane-btn::before{
  content:"";
  width:clamp(22px, 5vw, 34px);
  height:clamp(22px, 5vw, 34px);
  background-color:currentColor;
  -webkit-mask-image:var(--vinv-radiation-symbol);
  mask-image:var(--vinv-radiation-symbol);
  -webkit-mask-repeat:no-repeat;
  mask-repeat:no-repeat;
  -webkit-mask-position:center;
  mask-position:center;
  -webkit-mask-size:contain;
  mask-size:contain;
  pointer-events:none;
  opacity:0.98;
}

.vinv-rocket{
  position:absolute;
  transform:translate(-50%,-50%);
  font-size:clamp(22px,5vw,34px);
}

.vinv-rocket.white{ filter:grayscale(1) brightness(1.7); }
.vinv-trail{
  position:absolute;
  transform:translate(-50%,-50%);
  font-size:clamp(14px,3vw,20px);
  opacity:0.9;
}

.vinv-overlay-msg{
  display:flex;
  align-items:center;
  justify-content:center;
}

.vinv-overlay-pill{
  background:rgba(255,255,255,0.96);
  color:#333333;
  border-radius:999px;
  padding:10px 16px;
  font-weight:900;
  font-size:clamp(18px,3vw,24px);
  animation:vinvOverlayPop 260ms ease;
}

.vinv-nav-wrap{
  flex:0 0 auto;
  padding:0 var(--vinv-side) calc(10px + env(safe-area-inset-bottom));
}

.vinv-nav{
  max-width:var(--vinv-stage-max);
  margin:0 auto;
  display:flex;
  gap:12px;
  align-items:center;
}

.vinv-nav-btn,
.vinv-help-btn{
  min-height:52px;
  border:none;
  border-radius:999px;
  font:inherit;
  font-size:20px;
  font-weight:900;
  box-shadow:0 6px 0 rgba(0,0,0,0.24);
}

.vinv-nav-btn{
  width:72px;
  min-width:72px;
  background:rgba(255,255,255,0.95);
  color:#333333;
}

.vinv-nav-center{ flex:1 1 auto; display:flex; justify-content:center; }
.vinv-help-btn{ width:min(100%,220px); padding:0 22px; background:#ffffff; color:#333333; }

.vinv-help-overlay{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,0.42);
  display:none;
  align-items:center;
  justify-content:center;
  padding:20px;
  z-index:20;
}

.vinv-help-overlay.is-open{ display:flex; }

.vinv-help-dialog{
  width:min(100%,560px);
  background:#ffffff;
  color:#333333;
  border-radius:24px;
  padding:22px 18px;
  text-align:center;
}

.vinv-help-title{
  font-size:clamp(26px,5vw,38px);
  font-weight:900;
}

.vinv-help-body{
  margin-top:10px;
  font-size:clamp(18px,3.8vw,24px);
  line-height:1.25;
  font-weight:800;
  text-wrap:balance;
  overflow-wrap:break-word;
}

.vinv-help-actions{
  margin-top:16px;
  display:flex;
  justify-content:center;
}

.vinv-game-menu-dialog{
  background:#ffffff;
}

.vinv-game-menu-title{
  color:#7f66c6;
}

.vinv-game-menu-actions{
  margin-top:16px;
  display:flex;
  flex-direction:column;
  gap:12px;
}

.vinv-game-menu-btn{
  background:#7f66c6;
  color:#ffffff;
}

.vinv-corner-left{
  min-width:44px;
  text-align:center;
}

@keyframes vinvShake{
  0%{transform:translateX(0)}
  25%{transform:translateX(-8px)}
  50%{transform:translateX(8px)}
  75%{transform:translateX(-5px)}
  100%{transform:translateX(0)}
}

@keyframes vinvFlashBad{
  0%{ background-color:rgba(255,90,81,0); }
  20%{ background-color:rgba(255,90,81,0.34); }
  100%{ background-color:rgba(255,90,81,0); }
}

@keyframes vinvFadeOut{
  from{ opacity:1; }
  to{ opacity:0; }
}

@keyframes vinvCorrectPause{
  0%{ transform:translate(-50%,0) scale(1); }
  100%{ transform:translate(-50%,0) scale(1.12); }
}

@keyframes vinvBeam{
  from{ opacity:0.45; }
  to{ opacity:0.9; }
}

@keyframes vinvOverlayPop{
  0%{ opacity:0; transform:scale(0.85); }
  100%{ opacity:1; transform:scale(1); }
}

@media (max-width:560px){
  .vinv-controls{ gap:10px; }
  .vinv-lane-btn{ min-height:62px; border-radius:18px; }
  .vinv-nav{ gap:10px; }
  .vinv-nav-btn{ width:64px; min-width:64px; }
  .vinv-corner-pill{ top:10px; font-size:14px; padding:5px 10px; }
}
