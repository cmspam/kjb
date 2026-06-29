/* ============================================================
   ニャーニャコ大戦争  —  game.js
   Battle-Cats-style engine: money + wallet upgrade, XP character
   upgrades (stronger look + new powers), EX unlocks, type system
   (1.5x めっぽう強い), zombies + Zombie Killer, barriers + Barrier
   Breaker, warping/knockback boss, dust particles, tower HP.
   ============================================================ */

// ---------------- types (属性) ----------------
const TYPES = {
  red:   { jp:"赤",       color:"#e23b3b" },
  float: { jp:"浮遊",     color:"#7fc7ff" },
  black: { jp:"黒",       color:"#9aa0b0" },
  zombie:{ jp:"ゾンビ",   color:"#8ab84f" },
  alien: { jp:"エイリアン",color:"#46d6b8" },
  demon: { jp:"悪魔",     color:"#c46bff" },
  metal: { jp:"メタル",   color:"#b8c0cc" },
  star:  { jp:"星",       color:"#ffd23f" },
};

// ability display
const AB = {
  fast:          { jp:"すばやい",            ic:"💨" },
  area:          { jp:"範囲こうげき",        ic:"💥" },
  knockback:     { jp:"ふっとばし",          ic:"👊" },
  zombieKiller:  { jp:"ゾンビキラー",        ic:"☠️" },
  barrierBreaker:{ jp:"バリアブレイカー",    ic:"🛡️" },
  crit:          { jp:"クリティカル",        ic:"⚡" },
  tank:          { jp:"たいりょく おおい",   ic:"🧱" },
  longrange:     { jp:"えんきょり",          ic:"🎯" },
  slow:          { jp:"タイムストップ",      ic:"⏱️" },
};
const strongLabel = t => `${TYPES[t].jp}にめっぽう強い`;

// ---------------- player characters ----------------
// base = level-1 stats. grow = +fraction per level. unlocks = powers gained by level.
const CHARS = [
  { id:"crew", name:"クルーメイト", ex:false, color:"#3fa9f5",
    art:()=>ART.crewmate("#3fa9f5"),
    base:{cost:45, hp:120, dmg:18, range:46, atkCd:0.7, speed:48, scale:0.60},
    grow:{hp:0.16, dmg:0.16, cost:0.06}, maxLv:10,
    innate:[], unlocks:[ {lv:3,a:"strong:red"}, {lv:7,a:"knockback"} ] },

  { id:"trala", name:"トラレロ・トラララ", ex:false, color:"#5aa9e6",
    art:()=>ART.tralalero(),
    base:{cost:90, hp:150, dmg:24, range:50, atkCd:0.55, speed:92, scale:0.66},
    grow:{hp:0.15, dmg:0.16, cost:0.06}, maxLv:10,
    innate:["fast"], unlocks:[ {lv:4,a:"strong:float"}, {lv:8,a:"barrierBreaker"} ] },

  { id:"tung", name:"トゥントゥンサフール", ex:false, color:"#a9743f",
    art:()=>ART.tung(),
    base:{cost:150, hp:240, dmg:48, range:60, atkCd:1.1, speed:42, scale:0.72},
    grow:{hp:0.17, dmg:0.18, cost:0.07}, maxLv:10,
    innate:["area","knockback"], unlocks:[ {lv:5,a:"strong:black"}, {lv:9,a:"crit"} ] },

  { id:"bomb", name:"ボンバルディーロ", ex:false, color:"#6b7a52",
    art:()=>ART.bombardiro(),
    base:{cost:220, hp:620, dmg:34, range:54, atkCd:1.0, speed:30, scale:0.80},
    grow:{hp:0.20, dmg:0.15, cost:0.07}, maxLv:10,
    innate:["area","tank"], unlocks:[ {lv:4,a:"strong:alien"}, {lv:8,a:"strong:demon"} ] },

  { id:"capp", name:"カプチーノ・アサシン", ex:true, color:"#f3e9d6", unlockXp:1200,
    art:()=>ART.cappuccino(),
    base:{cost:180, hp:160, dmg:90, range:48, atkCd:0.5, speed:120, scale:0.66},
    grow:{hp:0.14, dmg:0.18, cost:0.06}, maxLv:12,
    innate:["fast","zombieKiller"], unlocks:[ {lv:5,a:"strong:zombie"}, {lv:8,a:"crit"} ] },

  { id:"bone", name:"ボネカ・アンバラブ", ex:true, color:"#74b84a", unlockXp:1600,
    art:()=>ART.boneca(),
    base:{cost:260, hp:520, dmg:40, range:52, atkCd:0.9, speed:46, scale:0.74},
    grow:{hp:0.18, dmg:0.16, cost:0.07}, maxLv:12,
    innate:["barrierBreaker","knockback","tank"], unlocks:[ {lv:5,a:"strong:alien"}, {lv:8,a:"strong:demon"} ] },

  // ----- gacha-only brainrot characters -----
  { id:"chimp", name:"チンパンジーニ・バナニーニ", gacha:true, rarity:"N", color:"#ffd33a",
    art:()=>ART.chimp(),
    base:{cost:70, hp:140, dmg:26, range:46, atkCd:0.6, speed:96, scale:0.62},
    grow:{hp:0.15, dmg:0.16, cost:0.06}, maxLv:10,
    innate:["fast"], unlocks:[ {lv:4,a:"strong:red"}, {lv:8,a:"knockback"} ] },

  { id:"patapim", name:"ブルブル・パタピム", gacha:true, rarity:"R", color:"#9a6634",
    art:()=>ART.patapim(),
    base:{cost:210, hp:760, dmg:32, range:56, atkCd:1.0, speed:30, scale:0.78},
    grow:{hp:0.20, dmg:0.15, cost:0.07}, maxLv:10,
    innate:["area","tank"], unlocks:[ {lv:4,a:"strong:black"}, {lv:8,a:"knockback"} ] },

  { id:"ballerina", name:"バレリーナ・カプチーナ", gacha:true, rarity:"R", color:"#ff9ec4",
    art:()=>ART.ballerina(),
    base:{cost:130, hp:220, dmg:34, range:50, atkCd:0.5, speed:104, scale:0.66},
    grow:{hp:0.15, dmg:0.17, cost:0.06}, maxLv:10,
    innate:["fast","knockback"], unlocks:[ {lv:4,a:"strong:float"}, {lv:8,a:"barrierBreaker"} ] },

  { id:"lirili", name:"リリリ・ラリラ", gacha:true, rarity:"SR", color:"#5fae4a",
    art:()=>ART.lirili(),
    base:{cost:270, hp:460, dmg:52, range:76, atkCd:1.0, speed:34, scale:0.74},
    grow:{hp:0.17, dmg:0.18, cost:0.07}, maxLv:12,
    innate:["slow","longrange"], unlocks:[ {lv:5,a:"strong:demon"}, {lv:9,a:"area"} ] },

  { id:"vaca", name:"ラ・ヴァカ・サトゥルノ", gacha:true, rarity:"UR", color:"#ffd23f",
    art:()=>ART.vaca(),
    base:{cost:420, hp:1300, dmg:84, range:56, atkCd:0.9, speed:36, scale:0.86},
    grow:{hp:0.20, dmg:0.18, cost:0.07}, maxLv:15,
    innate:["area","knockback","barrierBreaker"], unlocks:[ {lv:5,a:"strong:alien"}, {lv:9,a:"strong:demon"}, {lv:13,a:"crit"} ] },
];
const charById = id => CHARS.find(c=>c.id===id);

// per-character attack flavor (animation + impact effect). default "bonk".
const ATK_STYLE = {
  crew:"bonk", trala:"bite", tung:"swing", bomb:"bomb", capp:"slash", bone:"slam",
  chimp:"bite", patapim:"slam", ballerina:"spin", lirili:"shoot", vaca:"slam",
};

// ---------------- gacha ----------------
const RARITY = {
  N:  { stars:"★",    name:"ノーマル",      color:"#5aa9e6", weight:50, dupeXp:150 },
  R:  { stars:"★★",   name:"レア",          color:"#5ad17a", weight:30, dupeXp:300 },
  SR: { stars:"★★★",  name:"スーパーレア",   color:"#c46bff", weight:14, dupeXp:700 },
  UR: { stars:"★★★★", name:"レジェンド",     color:"#ffd23f", weight:6,  dupeXp:1800, rainbow:true },
};
const GACHA = CHARS.filter(c=>c.gacha);

// gather powers active at a given level → {abilities:Set, strong:Set}
function powersAt(c, lv){
  const abilities = new Set(c.innate), strong = new Set();
  for(const u of c.unlocks){ if(lv>=u.lv){
    if(u.a.startsWith("strong:")) strong.add(u.a.split(":")[1]);
    else abilities.add(u.a);
  }}
  return {abilities, strong};
}
// every power (for shop display) with locked flag
function allPowerRows(c, lv){
  const rows = c.innate.map(a=>({label:AB[a].ic+" "+AB[a].jp, locked:false, type:false}));
  for(const u of c.unlocks){
    const isT = u.a.startsWith("strong:");
    const label = isT ? "🔥 "+strongLabel(u.a.split(":")[1]) : (AB[u.a].ic+" "+AB[u.a].jp);
    rows.push({label:`Lv${u.lv} ${label}`, locked:lv<u.lv, type:isT});
  }
  return rows;
}
// stats at level
function statsAt(c, lv){
  const k = lv-1;
  return {
    cost: Math.round(c.base.cost*(1+c.grow.cost*k)),
    hp:   Math.round(c.base.hp*(1+c.grow.hp*k)),
    dmg:  Math.round(c.base.dmg*(1+c.grow.dmg*k)),
    range:c.base.range, atkCd:c.base.atkCd, speed:c.base.speed,
    scale:c.base.scale*(1+0.025*k),
  };
}
const upgradeCost = lv => 200*lv;            // XP to go lv→lv+1

// ---------------- enemies ----------------
const ENEMY = {
  redImp:   { name:"赤インポスター",       art:()=>ART.imp("red"),    type:["red"],   hp:150, dmg:16, range:46, atkCd:0.8, speed:40, scale:0.58, reward:34, xp:6 },
  floatImp: { name:"浮遊インポスター",     art:()=>ART.imp("float"),  type:["float"], hp:175, dmg:18, range:46, atkCd:0.8, speed:54, scale:0.56, reward:38, xp:7 },
  blackImp: { name:"黒インポスター",       art:()=>ART.imp("black"),  type:["black"], hp:330, dmg:30, range:46, atkCd:0.9, speed:34, scale:0.62, reward:56, xp:10, barrier:260 },
  zombieImp:{ name:"ゾンビインポスター",   art:()=>ART.imp("zombie"), type:["zombie"],hp:210, dmg:22, range:46, atkCd:0.8, speed:46, scale:0.60, reward:48, xp:9, revive:1 },
  alienImp: { name:"エイリアンインポスター",art:()=>ART.imp("alien"), type:["alien"], hp:230, dmg:24, range:48, atkCd:0.9, speed:38, scale:0.62, reward:58, xp:11, barrier:260 },
  demonImp: { name:"悪魔インポスター",     art:()=>ART.imp("demon"),  type:["demon"], hp:370, dmg:34, range:50, atkCd:1.0, speed:30, scale:0.66, reward:82, xp:14, barrier:420, demon:true },
  metalImp: { name:"メタルインポスター",   art:()=>ART.imp("metal"),  type:["metal"], hp:135, dmg:26, range:46, atkCd:0.9, speed:24, scale:0.62, reward:100, xp:18, metal:true },
  boss:     { name:"ギガ・インポスター",   art:()=>ART.bossImpostor(),type:["star","alien"], hp:2600, dmg:76, range:64, atkCd:1.4, speed:18, scale:1.5, reward:460, xp:280, barrier:650, boss:true, warp:true, knockback:true },
};

// ---------------- stages (ステージ) ----------------
// Eight stages, gentle → fierce. Each new type is introduced on its own stage
// so the mechanics teach themselves. `mag` scales enemy hp/dmg/barrier so the
// late stages stay hard even after the player has levelled characters up.
// LEVEL points at the stage being played right now.
function stage(o){
  return Object.assign({ playerTowerHP:1600, enemyTowerHP:1000, coinRate:11,
    coinStart:120, walletMaxLv:8, mag:1, reward:300 }, o);
}
const LEVELS = [
  stage({ name:"はじめての たたかい", sub:"あかい インポスター", enemyTowerHP:520, playerTowerHP:1600,
    coinRate:14, coinStart:160, mag:0.85, reward:200,
    spawns:[{t:2,e:"redImp"},{t:6,e:"redImp"},{t:11,e:"redImp"},{t:16,e:"redImp"},{t:21,e:"redImp"},{t:26,e:"redImp"}] }),

  stage({ name:"ふわふわ ぐんだん", sub:"ふゆう が とんでくる", enemyTowerHP:720,
    coinRate:13, coinStart:150, mag:0.95, reward:260,
    spawns:[{t:2,e:"redImp"},{t:5,e:"floatImp"},{t:9,e:"redImp"},{t:13,e:"floatImp"},{t:17,e:"floatImp"},
      {t:21,e:"redImp"},{t:25,e:"floatImp"},{t:29,e:"floatImp"}] }),

  stage({ name:"ゾンビ ナイト", sub:"たおしても いきかえる！", enemyTowerHP:880,
    coinRate:12, mag:1, reward:340,
    spawns:[{t:2,e:"redImp"},{t:5,e:"zombieImp"},{t:9,e:"floatImp"},{t:13,e:"zombieImp"},{t:16,e:"zombieImp"},
      {t:20,e:"redImp"},{t:24,e:"zombieImp"},{t:28,e:"zombieImp"},{t:32,e:"floatImp"}] }),

  stage({ name:"シールド ぐんだん", sub:"レポートで バリアを はがせ！", enemyTowerHP:1050,
    coinRate:12, mag:1, reward:440,
    spawns:[{t:2,e:"redImp"},{t:6,e:"blackImp"},{t:10,e:"alienImp"},{t:13,e:"floatImp"},{t:17,e:"blackImp"},
      {t:21,e:"alienImp"},{t:25,e:"blackImp"},{t:29,e:"alienImp"},{t:33,e:"blackImp"}] }),

  stage({ name:"メタル ラッシュ", sub:"クリティカルで くだけ！", enemyTowerHP:1150,
    coinRate:12, mag:1, reward:560,
    spawns:[{t:2,e:"redImp"},{t:6,e:"metalImp"},{t:10,e:"redImp"},{t:13,e:"metalImp"},{t:17,e:"floatImp"},
      {t:21,e:"metalImp"},{t:25,e:"metalImp"},{t:29,e:"redImp"},{t:33,e:"metalImp"}] }),

  stage({ name:"あくまの しんりん", sub:"あくま が おそってくる", enemyTowerHP:1350,
    coinRate:12, mag:1.1, reward:720,
    spawns:[{t:2,e:"alienImp"},{t:5,e:"demonImp"},{t:9,e:"zombieImp"},{t:13,e:"demonImp"},{t:17,e:"blackImp"},
      {t:21,e:"demonImp"},{t:25,e:"alienImp"},{t:29,e:"demonImp"},{t:33,e:"demonImp"},{t:37,e:"metalImp"}] }),

  stage({ name:"ボス しゅつげん！", sub:"ギガ・インポスター あらわる", enemyTowerHP:1500,
    coinRate:12, mag:1.15, reward:950,
    spawns:[{t:2,e:"redImp"},{t:5,e:"alienImp"},{t:8,e:"zombieImp"},{t:11,e:"demonImp"},{t:14,e:"blackImp"},
      {t:20,e:"boss"},
      {t:24,e:"demonImp"},{t:28,e:"metalImp"},{t:31,e:"alienImp"},{t:35,e:"demonImp"},{t:39,e:"zombieImp"}] }),

  stage({ name:"さいしゅう けっせん", sub:"ぜんぶ でてくる！", enemyTowerHP:1900, playerTowerHP:1800,
    coinRate:11, mag:1.35, reward:1400,
    spawns:[
      {t:2,e:"redImp"},{t:4,e:"redImp"},{t:6,e:"floatImp"},{t:9,e:"redImp"},{t:11,e:"zombieImp"},{t:13,e:"floatImp"},
      {t:16,e:"blackImp"},{t:18,e:"redImp"},{t:20,e:"alienImp"},{t:23,e:"zombieImp"},{t:25,e:"floatImp"},{t:27,e:"blackImp"},
      {t:30,e:"demonImp"},{t:32,e:"redImp"},{t:34,e:"metalImp"},{t:37,e:"alienImp"},{t:39,e:"zombieImp"},{t:41,e:"demonImp"},{t:43,e:"floatImp"},
      {t:48,e:"boss"},
      {t:50,e:"redImp"},{t:52,e:"blackImp"},{t:54,e:"zombieImp"},{t:57,e:"demonImp"},{t:59,e:"alienImp"},{t:61,e:"floatImp"},{t:63,e:"metalImp"},
      {t:66,e:"demonImp"},{t:68,e:"blackImp"},{t:70,e:"alienImp"},{t:73,e:"zombieImp"},{t:75,e:"demonImp"},{t:77,e:"metalImp"},{t:79,e:"alienImp"},
      {t:84,e:"boss"},
      {t:86,e:"demonImp"},{t:88,e:"metalImp"},{t:90,e:"blackImp"},{t:93,e:"alienImp"},{t:95,e:"demonImp"},{t:97,e:"metalImp"},{t:99,e:"demonImp"},
    ] }),
];
let LEVEL = LEVELS[0];           // active stage; set when a battle starts

// wallet helpers — economy tuned so you can keep an army on the field
const walletMax  = lv => 200 + (lv-1)*150;
const walletRate = lv => LEVEL.coinRate + (lv-1)*5.5;
const walletUpCost = lv => Math.round(70 * Math.pow(1.6, lv-1));

// report ability — strips shields only (no HP damage)
const REPORT_CHARGE = 16;     // seconds to charge

// critical hits — characters with the crit power roll this chance per hit
const CRIT_CHANCE = 0.20;     // 20% of attacks land a critical
const CRIT_MULT   = 3;        // critical hits do 3x damage (and shatter metal)

// ヒーローゲージ (hero power-up) — fills over time; when full, へんしん! plays a
// transformation cutscene and powers up the whole army for a few seconds.
const HERO_CHARGE  = 24;      // seconds to fill the hero gauge
const BUFF_TIME    = 8;       // seconds the army stays powered-up
const BUFF_DMG     = 1.6;     // damage multiplier while powered-up
const BUFF_SPD     = 1.35;    // march-speed multiplier while powered-up

// ---------------- profile (persisted) ----------------
const SAVE_KEY = "yoshito2_nyanyako_v1";
let profile = loadProfile();
function loadProfile(){
  let p; try{ p = JSON.parse(localStorage.getItem(SAVE_KEY)); }catch(e){}
  if(!p || !p.levels) p = { xp:1500, levels:{} };
  if(p.xp===undefined) p.xp = 1500;
  // ensure every character exists; starters owned at Lv1, ex/gacha locked at 0
  for(const c of CHARS){ if(p.levels[c.id]===undefined) p.levels[c.id] = (c.ex||c.gacha) ? 0 : 1; }
  // grant starter gacha points the first time (so he can pull right away)
  if(p.gachaPoints===undefined) p.gachaPoints = 5;
  // number of stages cleared in order (also = index of the next unlocked stage)
  if(p.cleared===undefined) p.cleared = 0;
  // which stage indices have ever been cleared (for crown marks on the map)
  if(!p.clearedSet) p.clearedSet = {};
  // sound on/off
  if(p.muted===undefined) p.muted = false;
  return p;
}
function saveProfile(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(profile)); }catch(e){} }

// ---------------- DOM helpers ----------------
const $ = s => document.querySelector(s);
const FIELD = () => $("#field");
const W = () => FIELD().clientWidth;
function el(html){ const t=document.createElement("template"); t.innerHTML=html.trim(); return t.content.firstChild; }
function show(id){ document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active")); $("#"+id).classList.add("active"); }

function floatText(x,y,txt,color){
  const f=el(`<div class="float-txt" style="left:${x}px;bottom:${y}px;color:${color||"#fff"}">${txt}</div>`);
  FIELD().appendChild(f); setTimeout(()=>f.remove(),1000);
}
function dust(x,y,color){
  for(let i=0;i<4;i++){
    const sz=4+Math.random()*7;
    const d=el(`<div class="dust"></div>`);
    d.style.left=x+"px"; d.style.bottom=y+"px";
    d.style.width=d.style.height=sz+"px"; d.style.background=color||"#e8e0cf";
    d.style.setProperty("--dx",(Math.random()*44-22)+"px");
    d.style.setProperty("--dy",(Math.random()*30+6)+"px");
    FIELD().appendChild(d); setTimeout(()=>d.remove(),520);
  }
}
function shock(x,y,size,color){
  const s=el(`<div class="shock"></div>`);
  s.style.left=(x-size/2)+"px"; s.style.bottom=(y-size/2)+"px";
  s.style.width=s.style.height=size+"px"; s.style.borderColor=color||"#fff";
  FIELD().appendChild(s); setTimeout(()=>s.remove(),520);
}
// ----- sprite motion (Web Animations API: auto-clears, so it never fights CSS state) -----
function lungeAttack(a){
  if(!a.svgEl) return;
  // local +x always reads as "toward the enemy" (enemy wrappers are flipped by CSS)
  a.svgEl.animate(
    [{transform:"translateX(0)"},{transform:"translateX(11px) scale(1.07)",offset:.35},{transform:"translateX(0)"}],
    {duration:240, easing:"ease-out"});
}
function hurtFlinch(target, big){
  if(!target.svgEl) return;
  const dx = big?-9:-5, s = big?0.86:0.93, d = big?280:170;
  target.svgEl.animate(
    [{transform:"translateX(0) scale(1)"},{transform:`translateX(${dx}px) scale(${s})`,offset:.4},{transform:"translateX(0) scale(1)"}],
    {duration:d, easing:"ease-out"});
}
// armed warp enemy blinks to the LEFT of (behind) the unit that just hit it — bypassing it
function warpBypass(enemy, attacker){
  enemy.warpArmed=false; enemy.warpTimer=6;
  SND.sfx("warp");
  enemy.dom.classList.remove("warparmed");
  shock(enemy.x+enemy.w/2, 80, enemy.w*1.3, "#b6ff00");
  floatText(enemy.x+enemy.w/2, 120, "ワープ!", "#b6ff00");
  let nx = Math.min(enemy.x, attacker.x - enemy.w - 8);
  enemy.x = Math.max(playerBaseX(), nx); pos(enemy);
  enemy.atkTimer = 0;                          // ready to strike whatever it landed in front of
  shock(enemy.x+enemy.w/2, 80, enemy.w*1.3, "#b6ff00");
  if(enemy.svgEl) enemy.svgEl.animate(
    [{opacity:0,transform:"scale(.4)"},{opacity:1,transform:"scale(1)"}],{duration:280,easing:"ease-out"});
}

// ====================================================
//  SHOP
// ====================================================
function renderShop(){
  $("#shopXp").textContent = profile.xp;
  $("#titleXp").textContent = profile.xp;
  const list = $("#shopList"); list.innerHTML="";
  for(const c of CHARS){
    const lv = profile.levels[c.id] || 0;
    const owned = lv>=1;
    const dispLv = owned?lv:1;
    const st = statsAt(c, dispLv);
    const pows = allPowerRows(c, owned?lv:0);
    const R = c.gacha ? RARITY[c.rarity] : null;
    const badge = c.gacha ? `<div class="ex" style="background:${R.color};color:#1a1a22">${R.stars}</div>`
                          : (c.ex?`<div class="ex">EX</div>`:"");
    const card = el(`<div class="card ${owned?"":"locked"}" ${R?`style="border-color:${R.color}"`:""}>
      <div class="port">${badge}${c.art(dispLv)}</div>
      <div class="info">
        <div class="nm">${c.name} ${owned?`<span class="lv">Lv${lv}</span>`:""}</div>
        <div class="stats"><span>たいりょく <b>${st.hp}</b></span><span>こうげき <b>${st.dmg}</b></span><span>コスト <b>${st.cost}</b></span></div>
        <div class="pows">${pows.map(p=>`<span class="pow ${p.locked?"locked":""} ${p.type?"t":""}">${p.label}</span>`).join("")}</div>
        <button class="upbtn"></button>
      </div></div>`);
    const btn = card.querySelector(".upbtn");
    if(!owned && c.gacha){
      btn.disabled = true; btn.textContent = `🎰 ガチャで ゲット (${R.name})`;
      btn.style.background = R.color; btn.style.color = "#1a1a22"; btn.style.opacity = ".9";
    } else if(!owned){
      btn.classList.add("unlock");
      btn.textContent = `かいきん  −${c.unlockXp} XP`;
      btn.disabled = profile.xp < c.unlockXp;
      btn.onclick = ()=>{ if(profile.xp>=c.unlockXp){ profile.xp-=c.unlockXp; profile.levels[c.id]=1; SND.sfx("unlock"); saveProfile(); renderShop(); } };
    } else if(lv>=c.maxLv){
      btn.classList.add("maxed"); btn.textContent="さいだいレベル！⭐"; btn.disabled=true;
    } else {
      const cost = upgradeCost(lv);
      btn.textContent = `つよくする Lv${lv}→${lv+1}  −${cost} XP`;
      btn.disabled = profile.xp < cost;
      btn.onclick = ()=>{ if(profile.xp>=cost){ profile.xp-=cost; profile.levels[c.id]=lv+1; SND.sfx("levelup"); saveProfile(); renderShop(); } };
    }
    list.appendChild(card);
  }
}

// ====================================================
//  BATTLE
// ====================================================
let G=null;
function freshGame(stageIdx){
  return { running:false, over:false, paused:false, last:0, time:0, speed:1, stageIdx:stageIdx||0,
    coins:LEVEL.coinStart, coinAcc:0, walletLv:1,
    units:[], enemies:[], nextId:1,
    pHP:LEVEL.playerTowerHP, eHP:LEVEL.enemyTowerHP,
    spawnIdx:0, cooldowns:{}, report:0, battleXp:0, bossSpawned:false,
    hero:0, buffT:0, bossCount:0 };
}

const SPAWN_X = 64;
function playerBaseX(){ return SPAWN_X+12; }
function enemyBaseX(){ return W()-SPAWN_X-12; }

function buildBar(){
  const bar=$("#bar"); bar.innerHTML="";
  // wallet upgrade button
  const wb=el(`<div class="unitbtn wallet" id="walletBtn">
      <div class="icon"><svg viewBox="0 0 120 120"><rect x="20" y="40" width="80" height="56" rx="12" fill="#2bb3ff" stroke="#0a4a7a" stroke-width="4"/><rect x="20" y="40" width="80" height="16" rx="8" fill="#1a7ec0"/><circle cx="86" cy="70" r="9" fill="#ffd23f" stroke="#0a4a7a" stroke-width="3"/><text x="60" y="34" font-size="34" text-anchor="middle">⬆</text></svg></div>
      <div class="nm">お財布Lv↑</div><div class="cost" id="walletCost">80</div></div>`);
  wb.onclick=upgradeWallet; bar.appendChild(wb);
  // owned characters
  for(const c of CHARS){
    const lv = profile.levels[c.id]||0; if(lv<1) continue;
    const st = statsAt(c,lv);
    const b=el(`<div class="unitbtn" data-id="${c.id}">
        <div class="lvtag">Lv${lv}</div>
        <div class="icon">${c.art(lv)}</div>
        <div class="nm">${c.name}</div>
        <div class="cost"><svg viewBox="0 0 24 24" width="13" height="13"><circle cx="12" cy="12" r="11" fill="#ffd23f" stroke="#b8860b" stroke-width="2"/></svg>${st.cost}</div>
        <div class="cd" style="display:none"><i style="height:0%"></i></div></div>`);
    b.onclick=()=>trySpawn(c.id);
    bar.appendChild(b);
  }
  // report
  const rep=el(`<div class="unitbtn report" data-id="__report">
      <div class="icon"><svg viewBox="0 0 120 120"><rect x="20" y="34" width="80" height="56" rx="10" fill="#ff3b5c" stroke="#7a0a1c" stroke-width="4"/><rect x="54" y="44" width="12" height="28" rx="6" fill="#fff"/><circle cx="60" cy="80" r="6" fill="#fff"/><path d="M30 34 L40 18 L80 18 L90 34 Z" fill="#ff8a00" stroke="#7a0a1c" stroke-width="3"/></svg></div>
      <div class="nm">レポート!</div><div class="cost" style="color:#ff8a8a">しょうしゅう</div>
      <div class="cd" style="display:none"><i style="height:0%"></i></div></div>`);
  rep.onclick=doReport; bar.appendChild(rep);
  // hero power-up (へんしん)
  const hero=el(`<div class="unitbtn hero" data-id="__hero">
      <div class="icon"><svg viewBox="0 0 120 120"><polygon points="60,12 72,44 106,44 78,66 88,100 60,80 32,100 42,66 14,44 48,44" fill="#ffd23f" stroke="#b8860b" stroke-width="4" stroke-linejoin="round"/><text x="60" y="74" font-size="34" text-anchor="middle">⚡</text></svg></div>
      <div class="nm">へんしん！</div><div class="cost" style="color:#ffe08a">パワーアップ</div>
      <div class="cd" style="display:none"><i style="height:0%"></i></div></div>`);
  hero.onclick=triggerHero; bar.appendChild(hero);
}

function upgradeWallet(){
  if(!G.running||G.over) return;
  if(G.walletLv>=LEVEL.walletMaxLv) return;
  const cost=walletUpCost(G.walletLv);
  if(G.coins<cost) return;
  G.coins-=cost; G.walletLv++;
  $("#walletLv").textContent=G.walletLv;
  SND.sfx("walletup");
  floatText(120,140,"お財布レベルアップ!","#6cf");
  syncHud();
}

function makeActor(def, side, charLevel){
  const id=G.nextId++;
  const wrap=el(`<div class="actor ${side==="enemy"?"enemy":""}" data-aid="${id}"></div>`);
  wrap.innerHTML = def.art(charLevel) + `<div class="mini-hp"><i style="width:100%"></i></div>`;
  const svg=wrap.querySelector("svg");
  const px=Math.round(120*def.scale);
  svg.setAttribute("width",px); svg.setAttribute("height",px);
  if(side==="enemy") wrap.style.transform="scaleX(-1)";

  const a={ id, def, side, hp:def.hp, maxhp:def.hp, w:px,
    x: side==="player"? playerBaseX() : enemyBaseX()-px,
    atkTimer:0, stun:0, dead:false, down:false, reviveAt:0,
    reviveLeft: def.revive||0, dom:wrap, svgEl:svg, hpEl:wrap.querySelector(".mini-hp>i"),
    flashT:0, warpTimer:3, warpArmed:false, kbTimer: def.boss?2:0,
    barrier: def.barrier||0, barrierMax: def.barrier||0,
    abilities: def.abilities||new Set(), strong: def.strong||new Set() };

  // barrier visual
  if(a.barrier>0){
    const bsz=px*1.25;
    const bar=el(`<div class="barrier ${def.demon?"demon":""}" style="width:${bsz}px;height:${bsz}px;margin-left:${-bsz/2}px;margin-top:${-bsz/2}px"></div>`);
    wrap.appendChild(bar); a.barrierEl=bar;
  }
  // friendly level pips + aura
  if(side==="player" && charLevel){
    const tier = charLevel>=8?"⭐⭐⭐" : charLevel>=5?"⭐⭐" : charLevel>=3?"⭐":"";
    if(tier){ const p=el(`<div class="lvpips">${tier}</div>`); wrap.appendChild(p); }
    if(charLevel>=5){ wrap.classList.add("aura"); wrap.style.setProperty("--auraC", charLevel>=8?"#ffd23f":"#7fe3ff"); }
  }
  FIELD().appendChild(wrap);
  pos(a);
  return a;
}
function pos(a){ a.dom.style.left=a.x+"px"; }

function trySpawn(id){
  if(!G.running||G.over) return;
  const c=charById(id); const lv=profile.levels[id]||0; if(lv<1) return;
  const st=statsAt(c,lv);
  if(G.coins<st.cost){ bump(id); return; }
  if((G.cooldowns[id]||0)>0) return;
  G.coins-=st.cost;
  const cd = Math.max(1.5, st.cost/45);     // deploy cooldown scales with cost
  G.cooldowns[id]=cd; G.cooldowns["_max_"+id]=cd;
  const pw=powersAt(c,lv);
  const def={ name:c.name, art:c.art, hp:st.hp, dmg:st.dmg, range:st.range,
    atkCd:st.atkCd, speed:st.speed, scale:st.scale, atk:ATK_STYLE[c.id]||"bonk",
    abilities:pw.abilities, strong:pw.strong };
  const actor=makeActor(def,"player",lv);
  if(G.buffT>0) actor.dom.classList.add("buffed");
  G.units.push(actor);
  SND.sfx("deploy");
  syncHud();
}
function bump(id){ const b=document.querySelector(`.unitbtn[data-id="${id}"]`); if(b){ b.style.transform="translateX(-3px)"; setTimeout(()=>b.style.transform="",80);} }

function spawnEnemy(key){
  const base=ENEMY[key];
  const mag=LEVEL.mag||1;
  const def=Object.assign({},base,{type:base.type, abilities:new Set(), strong:new Set(),
    hp:Math.round(base.hp*mag), dmg:Math.round(base.dmg*mag),
    barrier: base.barrier?Math.round(base.barrier*mag):0 });
  const a=makeActor(def,"enemy");
  G.enemies.push(a);
  if(base.boss){
    G.bossSpawned=true; G.bossCount++;
    SND.sfx("boss");
    bossCutscene(G.bossCount);     // big taunt cutscene before the fight resumes
  }
}

// ----- report -----
function doReport(){
  if(!G.running||G.over||G.report<1) return;
  G.report=0;
  SND.sfx("report");
  const fx=$("#reportFx"); fx.classList.remove("go"); void fx.offsetWidth; fx.classList.add("go");
  const mw=$("#meetingWord"); mw.classList.remove("go"); void mw.offsetWidth; mw.classList.add("go");
  let hit=0;
  G.enemies.forEach(e=>{ if(e.dead) return;
    // Emergency Meeting strips SHIELDS only — it does NOT damage enemy HP
    if(e.barrier>0){ e.barrier=0; if(e.barrierEl) e.barrierEl.remove();
      shock(e.x+e.w/2, 72, e.w*1.3, e.def.demon?"#d36bff":"#6ff");
      floatText(e.x+e.w/2, 70+Math.random()*40, "シールド かいじょ!", "#6ff"); hit++;
    }
  });
  if(!hit) floatText(W()/2,120,"こわせる シールドが ないよ 👀","#fff");
}

// ----- damage core -----
function dealDamage(attacker, target, dmg, isReport){
  if(target.dead || target.down) return;
  // type multiplier
  let mult=1;
  if(attacker && attacker.strong && target.def.type && target.def.type.some(t=>attacker.strong.has(t))) mult=1.5;
  dmg = dmg*mult;
  // army power-up (hero ヒーローゲージ) boosts every player hit
  if(attacker && attacker.side==="player" && G.buffT>0) dmg*=BUFF_DMG;
  // critical hit (only crit-power characters), rolled per attack
  let isCrit=false;
  if(attacker && attacker.abilities && attacker.abilities.has("crit") && !isReport && Math.random()<CRIT_CHANCE){
    isCrit=true; dmg*=CRIT_MULT; SND.sfx("crit");
  }
  // メタル: shrugs off any hit for just 1 dmg — unless a クリティカル lands (or report)
  let metalGuard=false;
  if(target.def.metal && !isReport && !isCrit){ dmg=1; metalGuard=true; }
  // barrier
  if(target.barrier>0 && !isReport){
    if(attacker && attacker.abilities.has("barrierBreaker")){
      target.barrier=0; if(target.barrierEl) target.barrierEl.remove();
      shock(target.x+target.w/2, 70, target.w*1.3, target.def.demon?"#d36bff":"#6ff");
      floatText(target.x+target.w/2, 80, "バリアブレイク!", "#6ff");
      SND.sfx("barrier");
      // breaking still lands the hit below
    } else {
      target.barrier-=dmg;
      if(target.barrierEl) target.barrierEl.style.opacity = Math.max(0.25, target.barrier/target.barrierMax)*0.7+0.15;
      if(target.barrier<=0){ target.barrier=0; if(target.barrierEl) target.barrierEl.remove();
        shock(target.x+target.w/2,70,target.w*1.2,target.def.demon?"#d36bff":"#6ff"); }
      dust(target.x+target.w/2, 60, "#bff");
      return; // damage absorbed by barrier
    }
  }
  if(isCrit) floatText(target.x+target.w/2, 96, "クリティカル！"+Math.round(dmg), "#ff5b5b");
  else if(mult>1) floatText(target.x+target.w/2, 90, Math.round(dmg)+"!", "#ffd23f");
  else if(metalGuard && Math.random()<0.5) floatText(target.x+target.w/2, 84, "カキーン！", "#cfe8ff");
  target.hp-=dmg;
  target.flashT=0.12;
  if(!isReport && !isCrit) SND.sfx(metalGuard?"hit":(dmg>=55?"bighit":"hit"));
  hurtFlinch(target, isCrit);
  dust(target.x + (target.side==="enemy"? target.w*0.2 : target.w*0.8), 50, "#efe6d2");
  if(target.hpEl) target.hpEl.style.width=Math.max(0,target.hp/target.maxhp*100)+"%";

  // knockback (player ability) on enemy
  if(attacker && attacker.side==="player" && attacker.abilities.has("knockback") && !target.def.boss && Math.random()<0.3){
    target.x=Math.min(enemyBaseX()-target.w, target.x+22); pos(target); target.stun=Math.max(target.stun,0.3);
  }
  // タイムストップ: freeze the enemy briefly
  if(attacker && attacker.side==="player" && attacker.abilities.has("slow") && !target.def.boss && Math.random()<0.5){
    target.stun=Math.max(target.stun,1.0); floatText(target.x+target.w/2,100,"とまれ!","#9df");
  }

  if(target.hp<=0){
    // zombie revive?
    if(target.def.revive && target.reviveLeft>0 && !isReport && !(attacker && attacker.abilities.has("zombieKiller"))){
      target.reviveLeft--; target.down=true; target.hp=0;
      target.reviveAt=G.time+1.3; target.dom.classList.add("down");
      floatText(target.x+target.w/2,80,"ぐぬぬ…","#8ab84f");
      return;
    }
    killActor(target, attacker);
  }
  // warp-bypass: an armed warp enemy, once a player unit lands a hit, blinks past it
  if(!target.dead && !target.down && target.def.warp && target.warpArmed && attacker && attacker.side==="player" && !isReport){
    warpBypass(target, attacker);
  }
}

function killActor(target, attacker){
  if(target.dead) return;
  target.dead=true;
  if(target.side==="enemy"){
    G.coins=Math.min(walletMax(G.walletLv), G.coins+(target.def.reward||0));
    G.battleXp += target.def.xp||0;
    if(target.def.revive && attacker && attacker.abilities.has("zombieKiller"))
      floatText(target.x+target.w/2,90,"ゾンビキラー！","#fff");
  }
  target.dom.style.transition="opacity .25s, transform .25s";
  target.dom.style.opacity="0";
  target.dom.style.transform=(target.side==="enemy"?"scaleX(-1) ":"")+"translateY(18px) rotate(18deg)";
  dust(target.x+target.w/2,40,target.side==="enemy"?"#caa":"#ace");
  setTimeout(()=>target.dom.remove(),260);
}

// front opposing target
function frontFor(a){
  if(a.side==="player"){
    let f=null; for(const e of G.enemies){ if(e.dead||e.down) continue; if(e.x+e.w>=a.x){ if(!f||e.x<f.x) f=e; } } return f;
  } else {
    let f=null; for(const u of G.units){ if(u.dead) continue; if(u.x<=a.x+a.w){ if(!f||u.x>f.x) f=u; } } return f;
  }
}

function step(dt){
  // coins
  G.coinAcc += walletRate(G.walletLv)*dt;
  if(G.coinAcc>=1){ const add=Math.floor(G.coinAcc); G.coins=Math.min(walletMax(G.walletLv),G.coins+add); G.coinAcc-=add; }
  // cooldowns
  for(const k in G.cooldowns){ if(k.startsWith("_max_")) continue; if(G.cooldowns[k]>0) G.cooldowns[k]=Math.max(0,G.cooldowns[k]-dt); }
  // report charge
  if(G.report<1) G.report=Math.min(1,G.report+dt/REPORT_CHARGE);
  // hero power-up gauge charge
  if(G.hero<1) G.hero=Math.min(1,G.hero+dt/HERO_CHARGE);
  // army power-up countdown
  if(G.buffT>0){ G.buffT-=dt; if(G.buffT<=0){ G.buffT=0; for(const u of G.units){ if(u.dom) u.dom.classList.remove("buffed"); } } }
  // spawns
  while(G.spawnIdx<LEVEL.spawns.length && G.time>=LEVEL.spawns[G.spawnIdx].t){ spawnEnemy(LEVEL.spawns[G.spawnIdx].e); G.spawnIdx++; }

  updateSide(G.units,dt,"player");
  updateSide(G.enemies,dt,"enemy");

  G.units=G.units.filter(u=>!u.dead);
  G.enemies=G.enemies.filter(e=>!e.dead);

  if(G.eHP<=0){ endGame(true); return; }
  if(G.pHP<=0){ endGame(false); return; }
  syncHud(); syncButtons();
}

function updateSide(list,dt,side){
  for(const a of list){
    if(a.dead) continue;
    if(a.flashT>0){ a.flashT-=dt; a.dom.classList.toggle("hit-flash",a.flashT>0); }
    // zombie revive
    if(a.down){ if(G.time>=a.reviveAt){ a.down=false; a.dom.classList.remove("down"); a.hp=a.maxhp; if(a.hpEl) a.hpEl.style.width="100%"; floatText(a.x+a.w/2,80,"ふっかつ！ぜんかい！","#8ab84f"); if(a.svgEl) a.svgEl.animate([{transform:"scale(.6)"},{transform:"scale(1.15)"},{transform:"scale(1)"}],{duration:380,easing:"ease-out"}); } else { a.dom.classList.remove("walking"); continue; } }
    if(a.stun>0){ a.stun-=dt; a.dom.classList.add("stun"); if(a.stun<=0) a.dom.classList.remove("stun"); else { a.dom.classList.remove("walking"); continue; } }
    if(a.atkTimer>0) a.atkTimer-=dt;

    // boss: warp + knockback shockwave
    // warp: charge up, then ARM. The actual blink happens when it gets hit (see dealDamage).
    if(a.def.warp && !a.warpArmed){ a.warpTimer-=dt; if(a.warpTimer<=0){ a.warpArmed=true; a.dom.classList.add("warparmed"); floatText(a.x+a.w/2,130,"ワープ じゅうでん!","#b6ff00"); } }
    if(a.def.knockback && a.side==="enemy"){ a.kbTimer-=dt; if(a.kbTimer<=0){ a.kbTimer=4.5; bossShock(a); } }

    const target=frontFor(a);
    if(side==="player"){
      let blocked=false;
      if(target){
        if(target.x-(a.x+a.w) <= a.def.range){ blocked=true;
          if(a.atkTimer<=0){ attack(a); a.atkTimer=a.def.atkCd; } }
      } else if(a.x+a.w >= enemyBaseX()-a.def.range){ blocked=true;
        if(a.atkTimer<=0){ a.atkTimer=a.def.atkCd; const d=Math.round(a.def.dmg*(G.buffT>0?BUFF_DMG:1)); G.eHP=Math.max(0,G.eHP-d); SND.sfx("towerhit"); dust(enemyBaseX(),120,"#fb8"); floatText(enemyBaseX(),120+Math.random()*30,"-"+d,"#fff"); } }
      if(!blocked){ a.x+=a.def.speed*(G.buffT>0?BUFF_SPD:1)*dt; if(a.x+a.w>enemyBaseX()) a.x=enemyBaseX()-a.w; pos(a); }
      a.dom.classList.toggle("walking", !blocked);
    } else {
      let blocked=false;
      if(target){
        if(a.x-(target.x+target.w) <= a.def.range){ blocked=true;
          if(a.atkTimer<=0){ attack(a); a.atkTimer=a.def.atkCd; } }
      } else if(a.x <= playerBaseX()+a.def.range){ blocked=true;
        if(a.atkTimer<=0){ a.atkTimer=a.def.atkCd; G.pHP=Math.max(0,G.pHP-a.def.dmg); SND.sfx("towerhit"); dust(playerBaseX()+30,120,"#f88"); floatText(playerBaseX()+30,120+Math.random()*30,"-"+a.def.dmg,"#ff3b5c"); } }
      if(!blocked){ a.x-=a.def.speed*dt; if(a.x<playerBaseX()) a.x=playerBaseX(); pos(a); }
      a.dom.classList.toggle("walking", !blocked);
    }
  }
}

// an actor attacks. each character has its own flavour (a.def.atk):
// swing (club), bomb/shoot (projectile), slash, slam, spin, bite, bonk.
function attack(a){
  const style = a.def.atk || "bonk";
  const isArea = !!(a.def.abilities && a.def.abilities.has("area"));
  const foes = a.side==="player"? G.enemies : G.units;
  // gather everyone this swing will hit
  const targets=[];
  if(isArea){
    for(const f of foes){ if(f.dead||f.down) continue;
      const inRange = a.side==="player" ? (f.x+f.w>=a.x && f.x-(a.x+a.w)<=a.def.range)
                                        : (f.x<=a.x+a.w && a.x-(f.x+f.w)<=a.def.range);
      if(inRange) targets.push(f);
    }
  } else { const f=frontFor(a); if(f) targets.push(f); }

  const dir = a.side==="player"? 1 : -1;
  const frontX = a.side==="player"? a.x+a.w : a.x;
  const land = ()=>{ for(const f of targets) dealDamage(a,f,a.def.dmg); };

  // Tung's secondary: a ~30% "home run" — he bats a baseball at the front foe
  // (ranged hit, extra damage, sends it flying back)
  if(style==="swing" && a.side==="player" && Math.random()<0.3){
    playAttackAnim(a, "swing");
    const f = frontFor(a);
    const tx = f ? f.x + f.w/2 : frontX + dir*170;
    floatText(frontX, 98, "ホームラン！", "#ffd23f");
    launchProjectile("baseball", frontX, 66, tx, 58, ()=>{
      const tgt = (f && !f.dead && !f.down) ? f : frontFor(a);
      if(tgt){
        dealDamage(a, tgt, Math.round(a.def.dmg*1.4));
        if(!tgt.def.boss && !tgt.dead){
          tgt.x = Math.min(enemyBaseX()-tgt.w, tgt.x + 64); pos(tgt);
          tgt.stun = Math.max(tgt.stun, 0.5);
          shock(tgt.x+tgt.w/2, 70, 72, "#ffd23f");
        }
      }
    });
    return;
  }

  playAttackAnim(a, style);

  if(style==="bomb" || style==="shoot"){
    const tx = targets.length ? targets.reduce((s,f)=>s+f.x+f.w/2,0)/targets.length
                              : frontX + dir*a.def.range*0.8;
    launchProjectile(style, frontX, 74, tx, 56, land);
  } else {
    land();
    meleeImpact(style, frontX, dir, isArea, a.def.range);
  }
}

// attacker sprite motion, per style (auto-clears, so it never fights CSS state)
function playAttackAnim(a, style){
  const s=a.svgEl; if(!s) return;
  if(style==="swing"){
    const arm=s.querySelector(".swingarm");
    if(arm) arm.animate([{transform:"rotate(-50deg)"},{transform:"rotate(26deg)",offset:.5},{transform:"rotate(0deg)"}],{duration:300,easing:"ease-in"});
    s.animate([{transform:"rotate(0)"},{transform:"rotate(7deg)",offset:.5},{transform:"rotate(0)"}],{duration:300,easing:"ease-out"});
  } else if(style==="bomb"){
    s.animate([{transform:"translateX(0)"},{transform:"translateX(-8px)",offset:.25},{transform:"translateX(0)"}],{duration:260,easing:"ease-out"});
  } else if(style==="shoot"){
    s.animate([{transform:"scale(1,1)"},{transform:"scale(1.09,0.93)",offset:.3},{transform:"scale(1,1)"}],{duration:240});
  } else if(style==="slash"){
    s.animate([{transform:"translateX(0)"},{transform:"translateX(15px)",offset:.3},{transform:"translateX(3px)",offset:.55},{transform:"translateX(17px)",offset:.78},{transform:"translateX(0)"}],{duration:260,easing:"ease-out"});
  } else if(style==="slam"){
    s.animate([{transform:"translateY(0) scale(1,1)"},{transform:"translateY(-11px) scale(1.05,1.05)",offset:.4},{transform:"translateY(0) scale(1.04,0.94)",offset:.7},{transform:"translateY(0) scale(1,1)"}],{duration:340,easing:"ease-in"});
  } else if(style==="spin"){
    s.animate([{transform:"rotate(0)"},{transform:"rotate(360deg)"}],{duration:340,easing:"ease-in-out"});
  } else if(style==="bite"){
    s.animate([{transform:"translateX(0) scaleX(1)"},{transform:"translateX(13px) scaleX(1.08)",offset:.4},{transform:"translateX(0) scaleX(1)"}],{duration:220,easing:"ease-out"});
  } else { lungeAttack(a); }
}

// melee impact flourish at the contact point
function meleeImpact(style, x, dir, isArea, range){
  if(isArea) shock(x, 60, range*1.6, "#ffd27a");
  if(style==="swing"){ impactStar(x+dir*10, 64, "#ffe08a"); }
  else if(style==="slash"){ slashArc(x+dir*8, 58, dir, "#bdeaff"); slashArc(x+dir*15, 50, dir, "#ffffff"); }
  else if(style==="spin"){ slashArc(x+dir*8, 58, dir, "#ff9ec4"); }
  else if(style==="slam"){ shock(x+dir*6, 40, 72, "#ffffff"); impactStar(x+dir*6, 46, "#ffffff"); dust(x+dir*6,40,"#e8e0cf"); }
  else if(style==="bite"){ slashArc(x+dir*6, 56, dir, "#cdebff"); }
  else { dust(x+dir*6, 50, "#efe6d2"); }
}

// fly a bomb/orb from attacker to target, then explode and apply damage
function launchProjectile(style, fromX, fromY, toX, toY, onHit){
  const cls = style==="bomb"?"bomb" : (style==="baseball"?"baseball":"orb");
  const p=el(`<div class="proj ${cls}"></div>`);
  p.style.left=fromX+"px"; p.style.bottom=fromY+"px";
  FIELD().appendChild(p);
  const dur = style==="bomb"?340:230;
  const midY = Math.max(fromY,toY) + (style==="bomb"?56:14);
  p.animate([
    {left:fromX+"px", bottom:fromY+"px"},
    {left:(fromX+(toX-fromX)*0.5)+"px", bottom:midY+"px", offset:.5},
    {left:toX+"px", bottom:toY+"px"},
  ],{duration:dur, easing:"linear", fill:"forwards"});
  if(style==="bomb") p.animate([{transform:"rotate(0)"},{transform:"rotate(230deg)"}],{duration:dur});
  else if(style==="baseball") p.animate([{transform:"rotate(0)"},{transform:"rotate(540deg)"}],{duration:dur});
  setTimeout(()=>{ p.remove();
    if(style==="bomb"){ boom(toX,toY); }
    else if(style==="baseball"){ impactStar(toX,toY,"#ffffff"); dust(toX,toY,"#efe6d2"); dust(toX,toY,"#fff"); }
    else { shock(toX,toY,56,"#9fd8ff"); impactStar(toX,toY,"#cfeaff"); }
    onHit();
  }, dur);
}

// --- impact fx ---
function impactStar(x,y,color){
  const s=el(`<div class="hitstar">✸</div>`);
  s.style.left=x+"px"; s.style.bottom=y+"px"; if(color) s.style.color=color;
  FIELD().appendChild(s); setTimeout(()=>s.remove(),340);
}
function slashArc(x,y,dir,color){
  const w=36, s=el(`<div class="slashfx"></div>`);
  s.style.left=(x-w/2)+"px"; s.style.bottom=y+"px"; s.style.width=w+"px";
  s.style.background=`linear-gradient(90deg,transparent,${color},transparent)`;
  s.style.setProperty("--rot",(dir>0?-35:35)+"deg");
  FIELD().appendChild(s); setTimeout(()=>s.remove(),280);
}
function boom(x,y){
  shock(x,y,96,"#ff8a00"); shock(x,y,58,"#ffd23f");
  impactStar(x,y,"#ffd23f");
  for(let i=0;i<3;i++) dust(x,y,"#ffb24a");
  SND.sfx("boom");
}

// boss shockwave knockback
function bossShock(boss){
  shock(boss.x+boss.w/2, 80, 260, "#ffd23f");
  floatText(boss.x+boss.w/2,140,"ノックバック!!","#ffd23f");
  SND.sfx("bighit"); shakeScreen();
  for(const u of G.units){ if(u.dead) continue;
    if(Math.abs((u.x+u.w/2)-(boss.x+boss.w/2)) < 200){
      u.x=Math.max(playerBaseX(), u.x-70); pos(u); u.stun=Math.max(u.stun,0.7);
      dust(u.x+u.w/2,50,"#fff");
    }
  }
}

// ====================================================
//  CUTSCENES  (VOICEVOX voice + big character render)
// ====================================================
function pauseGame(p){ if(!G) return; G.paused=p; if(!p) G.last=0; }

// generic cinematic: dark overlay, huge sprite, name + speech, a voice clip.
// Stays up for at least `dur` ms AND until the voice finishes.
function playCutscene(opts){
  const ov=$("#cutscene");
  ov.className="cutscene "+opts.kind+" show";
  $("#cutArt").innerHTML=opts.artHTML;
  const svg=$("#cutArt").querySelector("svg");
  if(svg){ svg.setAttribute("width","240"); svg.setAttribute("height","240"); }
  $("#cutName").textContent=opts.name||"";
  $("#cutText").textContent=opts.text||"";
  const minTime=new Promise(r=>setTimeout(r, opts.dur||2600));
  const vp=opts.voiceId?SND.voice(opts.voiceId):Promise.resolve();
  return Promise.all([minTime,vp]).then(()=>new Promise(res=>{
    ov.classList.remove("show"); setTimeout(res,420);
  }));
}

// boss arrives → menacing taunt before the fight resumes
function bossCutscene(n){
  pauseGame(true);
  const vid = n>=2 ? "boss_enrage" : "boss_appear";
  const text = n>=2 ? "もう ようしゃ しないぞ！" : "フハハハ！ ギガ・インポスター とうじょう！";
  shakeScreen();
  playCutscene({kind:"boss", artHTML:ART.bossImpostor(), name:"ギガ・インポスター",
    text, voiceId:vid, dur:2900}).then(()=>pauseGame(false));
}

// hero power-up → whole army buffed for a few seconds
function triggerHero(){
  if(!G||!G.running||G.over||G.paused||G.hero<1) return;
  G.hero=0;
  SND.sfx("powerup");
  pauseGame(true);
  const owned = CHARS.filter(c=>(profile.levels[c.id]||0)>=1)
    .sort((a,b)=>(profile.levels[b.id]||0)-(profile.levels[a.id]||0));
  const hero = owned[0] || charById("crew");
  const lv = profile.levels[hero.id]||1;
  const lines = ["power_1","power_2","power_3","power_4","power_5"];
  const texts = { power_1:"パワーアップ！ いくぞー！", power_2:"へんしん！ ニャーニャコパワー！",
                  power_3:"ちからが あふれてくる！", power_4:"みんな、ちからを かして！", power_5:"ぜったいに まけない！" };
  const vid = lines[Math.floor(Math.random()*lines.length)];
  shakeScreen();
  playCutscene({kind:"hero", artHTML:hero.art(lv), name:hero.name,
    text:texts[vid], voiceId:vid, dur:2600}).then(()=>{ applyArmyBuff(); pauseGame(false); });
}
function applyArmyBuff(){
  G.buffT = BUFF_TIME;
  floatText(W()/2, 160, "ぜんいん パワーアップ！⚡", "#ffd23f");
  for(const u of G.units){ if(!u.dead) u.dom.classList.add("buffed"); }
}

// screen shake (juice)
function shakeScreen(){
  const f=FIELD(); f.classList.remove("shake"); void f.offsetWidth; f.classList.add("shake");
  setTimeout(()=>f.classList.remove("shake"),460);
}

// ----- HUD -----
function syncHud(){
  $("#coins").textContent=Math.floor(G.coins);
  $("#coinMax").textContent=walletMax(G.walletLv);
  $("#walletLv").textContent=G.walletLv;
  $("#phpFill").style.width=(G.pHP/LEVEL.playerTowerHP*100)+"%";
  $("#ehpFill").style.width=(G.eHP/LEVEL.enemyTowerHP*100)+"%";
}
function syncButtons(){
  // wallet
  const wb=$("#walletBtn"), wc=$("#walletCost");
  if(wb){ if(G.walletLv>=LEVEL.walletMaxLv){ wc.textContent="MAX"; wb.classList.add("cant"); }
    else { const c=walletUpCost(G.walletLv); wc.textContent=c; wb.classList.toggle("cant",G.coins<c); } }
  for(const c of CHARS){ const lv=profile.levels[c.id]||0; if(lv<1) continue;
    const b=document.querySelector(`.unitbtn[data-id="${c.id}"]`); if(!b) continue;
    const cd=b.querySelector(".cd"), bar=cd.querySelector("i");
    const rem=G.cooldowns[c.id]||0, max=G.cooldowns["_max_"+c.id]||1;
    if(rem>0){ cd.style.display="flex"; bar.style.height=(100*(1-rem/max))+"%"; } else cd.style.display="none";
    b.classList.toggle("cant", G.coins<statsAt(c,lv).cost);
  }
  const rep=document.querySelector('.unitbtn[data-id="__report"]');
  if(rep){ const cd=rep.querySelector(".cd"), bar=cd.querySelector("i");
    if(G.report<1){ cd.style.display="flex"; bar.style.height=(G.report*100)+"%"; rep.classList.remove("ready"); }
    else { cd.style.display="none"; rep.classList.add("ready"); } }
  const hb=document.querySelector('.unitbtn[data-id="__hero"]');
  if(hb){ const cd=hb.querySelector(".cd"), bar=cd.querySelector("i");
    if(G.hero<1){ cd.style.display="flex"; bar.style.height=(G.hero*100)+"%"; hb.classList.remove("ready"); }
    else { cd.style.display="none"; hb.classList.add("ready"); } }
}

// ----- bases & decor -----
function placeBases(){
  FIELD().querySelectorAll(".base, .star, .actor, .float-txt, .dust, .shock").forEach(n=>n.remove());
  const pb=el(`<div class="base" style="left:-16px">${ART.playerBase()}</div>`);
  const eb=el(`<div class="base" style="right:-16px">${ART.enemyBase()}</div>`);
  [pb,eb].forEach(b=>{ const s=b.querySelector("svg"); s.setAttribute("width","94"); s.setAttribute("height","134"); });
  FIELD().appendChild(pb); FIELD().appendChild(eb);
  for(let i=0;i<26;i++){ const s=el(`<div class="star"></div>`); const sz=Math.random()*2+1;
    s.style.width=s.style.height=sz+"px"; s.style.left=(Math.random()*100)+"%"; s.style.top=(Math.random()*55)+"%";
    s.style.animationDelay=(Math.random()*2)+"s"; FIELD().appendChild(s); }
}

// ----- loop -----
function loop(ts){
  if(!G.running) return;
  if(G.paused){ G.last=ts; requestAnimationFrame(loop); return; }
  if(!G.last) G.last=ts;
  let dt=(ts-G.last)/1000; G.last=ts; if(dt>0.1) dt=0.1;
  dt*=G.speed;
  G.time+=dt; step(dt);
  if(G.running) requestAnimationFrame(loop);
}

function startBattle(stageIdx){
  stageIdx = stageIdx||0;
  LEVEL = LEVELS[stageIdx];
  SND.unlock();
  show("screen-battle");
  $("#stageName").textContent = LEVEL.name;
  buildBar();
  G=freshGame(stageIdx);
  placeBases();
  syncHud(); syncButtons();
  // stage banner sweep
  const sb=$("#stageBanner");
  sb.querySelector(".sbname").textContent=LEVEL.name;
  sb.querySelector(".sbsub").textContent=LEVEL.sub;
  sb.classList.remove("go"); void sb.offsetWidth; sb.classList.add("go");
  // preload this stage's voices, then the battle-start shout
  const ids=["power_1","power_2","power_3","power_4","power_5","win","lose","start"];
  if(LEVEL.spawns.some(s=>s.e==="boss")) ids.push("boss_appear","boss_enrage");
  SND.preload(ids).then(()=>SND.voice("start"));
  G.running=true; G.last=0;
  requestAnimationFrame(loop);
}

function endGame(win){
  G.over=true; G.running=false;
  const stageIdx=G.stageIdx;
  const firstClear = win && !profile.clearedSet[stageIdx];
  let reward = win ? LEVEL.reward + G.battleXp : Math.round(G.battleXp*0.6);
  if(firstClear) reward += LEVEL.reward;          // double XP the first time a stage falls
  profile.xp += reward;
  if(win){
    profile.clearedSet[stageIdx]=1;
    profile.cleared = Math.max(profile.cleared, stageIdx+1);
    // gacha points: guaranteed +2 on first clear, otherwise a lucky drop
    let pts;
    if(firstClear) pts=2;
    else { const r=Math.random(); pts = r<0.40?0:(r<0.85?1:2); }
    profile.gachaPoints = (profile.gachaPoints||0) + pts;
    const line=$("#winPtLine");
    if(line){
      if(pts===0){ line.textContent="🎰 こんかいは ガチャポイント なし… ざんねん！"; line.style.color="#9aa0b0"; }
      else if(pts===1){ line.textContent="🎰 ＋1 ガチャポイント ゲット！"; line.style.color="#ff8af0"; }
      else { line.textContent="🎰 ＋2 ガチャポイント！ 大あたり！🎉"; line.style.color="#ffd23f"; }
    }
    const last = stageIdx+1>=LEVELS.length;
    const ttl=$("#winTitle"); if(ttl) ttl.textContent = last?"ぜんステージ クリア！🏆":"ステージ クリア！🎉";
    const nb=$("#winNext");
    if(nb){
      if(!last){ nb.style.display=""; nb.textContent="つぎへ ▶ "+LEVELS[stageIdx+1].name;
        nb.onclick=()=>{ $("#winOverlay").classList.remove("show"); startBattle(stageIdx+1); }; }
      else nb.style.display="none";
    }
  }
  saveProfile();
  $(win?"#winXp":"#loseXp").textContent = reward;
  SND.sfx(win?"win":"lose");
  setTimeout(()=>{ $(win?"#winOverlay":"#loseOverlay").classList.add("show"); SND.voice(win?"win":"lose"); }, 600);
}

// ====================================================
//  GACHA
// ====================================================
function updateChips(){
  if($("#titleXp")) $("#titleXp").textContent = profile.xp;
  if($("#titlePt")) $("#titlePt").textContent = profile.gachaPoints;
}
function openGacha(){ renderGacha(); show("screen-gacha"); }
function renderGacha(){
  $("#gachaPt").textContent = profile.gachaPoints;
  updateChips();
  const pool=$("#gachaPool"); pool.innerHTML="";
  GACHA.forEach(c=>{
    const owned=(profile.levels[c.id]||0)>=1;
    const R=RARITY[c.rarity];
    pool.appendChild(el(`<div class="poolitem ${owned?"":"unowned"}" style="border-color:${R.color}">
      ${c.art(profile.levels[c.id]||0)}<div class="rb" style="color:${R.color}">${R.stars}</div>
      <div class="nm2">${owned?c.name:"？？？"}</div></div>`));
  });
  $("#pullBtn").disabled = profile.gachaPoints < 1;
}
function rollRarity(){
  const total=Object.values(RARITY).reduce((s,r)=>s+r.weight,0);
  let x=Math.random()*total;
  for(const k in RARITY){ x-=RARITY[k].weight; if(x<0) return k; }
  return "N";
}
function pull(){
  if(profile.gachaPoints<1) return;
  SND.unlock(); SND.sfx("capsule");
  profile.gachaPoints--;
  const r=rollRarity();
  const poolR=GACHA.filter(c=>c.rarity===r);
  const c=poolR[Math.floor(Math.random()*poolR.length)];
  const owned=(profile.levels[c.id]||0)>=1;
  const res={ char:c, rarity:r, dupe:owned };
  if(owned){ res.xp=RARITY[r].dupeXp; profile.xp+=res.xp; }
  else { profile.levels[c.id]=1; }
  saveProfile();
  showReveal(res);
}
function showReveal(res){
  const R=RARITY[res.rarity], ov=$("#gachaReveal");
  ov.style.setProperty("--rc", R.color);
  ov.classList.toggle("ur", res.rarity==="UR");
  $("#revStars").textContent=R.stars; $("#revStars").style.color=R.color;
  $("#revName").textContent=res.char.name;
  $("#revPrizeArt").innerHTML=res.char.art(profile.levels[res.char.id]||1);
  const tag=$("#revTag");
  if(res.dupe){ tag.className="ptag dup"; tag.textContent=`だぶり！ ＋${res.xp} XP`; }
  else { tag.className="ptag new"; tag.textContent=`NEW!! ${R.name} を ゲット！`; }
  ov.classList.remove("burst");
  const cap=ov.querySelector(".capsule"); cap.classList.add("shake");
  ov.classList.add("show");
  setTimeout(()=>{ cap.classList.remove("shake"); ov.classList.add("burst"); SND.sfx("reveal"); spawnConfetti(ov,R.color,res.rarity==="UR"); }, 1000);
  $("#revAgain").disabled = profile.gachaPoints<1;
}
function closeReveal(){ $("#gachaReveal").classList.remove("show","burst"); renderGacha(); }
function spawnConfetti(ov,color,rainbow){
  const cols = rainbow ? ["#ff5b5b","#ffd23f","#5ad17a","#5aa9e6","#c46bff"] : [color,"#fff",color];
  for(let i=0;i<26;i++){ const c=el(`<div class="confetti"></div>`);
    c.style.left=(Math.random()*100)+"%"; c.style.background=cols[i%cols.length];
    c.style.animationDelay=(Math.random()*0.3)+"s"; c.style.transform=`rotate(${Math.random()*180}deg)`;
    ov.appendChild(c); setTimeout(()=>c.remove(),1500); }
}

// ====================================================
//  STAGE SELECT (ステージ えらび)
// ====================================================
function openStages(){ SND.unlock(); renderStages(); show("screen-stages"); }
function renderStages(){
  updateChips();
  const grid=$("#stageGrid"); grid.innerHTML="";
  LEVELS.forEach((L,i)=>{
    const unlocked = i<=profile.cleared;        // cleared = index of next-unlocked stage
    const cleared  = !!profile.clearedSet[i];
    const node=el(`<div class="stagenode ${unlocked?"":"locked"} ${cleared?"cleared":""}" data-i="${i}">
        <div class="snum">${i+1}</div>
        <div class="sinfo"><div class="sname">${unlocked?L.name:"？？？"}</div>
          <div class="ssub">${unlocked?L.sub:"まえの ステージを クリアしてね"}</div></div>
        <div class="sicon">${cleared?"👑":(unlocked?"▶":"🔒")}</div></div>`);
    if(unlocked) node.onclick=()=>{ SND.sfx("click"); startBattle(i); };
    grid.appendChild(node);
  });
}

// ----- speed + mute -----
function toggleSpeed(){ if(!G||!G.running) return; G.speed = G.speed===1?2:1; const b=$("#speedBtn"); if(b) b.textContent=G.speed+"x"; SND.sfx("click"); }
function refreshMuteBtns(){ const t=profile.muted?"🔇":"🔊"; ["#muteBtn","#muteTitle"].forEach(s=>{ const b=$(s); if(b) b.textContent=t; }); }
function toggleMute(){ profile.muted=!profile.muted; SND.setMuted(profile.muted); saveProfile(); refreshMuteBtns(); if(!profile.muted){ SND.unlock(); SND.sfx("click"); } }

// ====================================================
//  WIRING
// ====================================================
function buildTitleRow(){
  const row=$("#titleRow"); row.innerHTML="";
  [ART.crewmate("#3fa9f5"),ART.tralalero(),ART.cappuccino(),ART.boneca(),ART.imp("demon")].forEach(svg=>row.appendChild(el(svg)));
}
function buildHelpLegend(){
  const L=$("#helpLegend"); L.innerHTML="";
  const items=[
    {a:ART.crewmate("#3fa9f5"),n:"クルーメイト"},{a:ART.tralalero(),n:"トラレロ"},
    {a:ART.tung(),n:"サフール"},{a:ART.bombardiro(),n:"ボンバルディーロ"},
    {a:ART.cappuccino(),n:"カプチーノ(EX)"},{a:ART.boneca(),n:"ボネカ(EX)"},
    {a:ART.imp("zombie"),n:"ゾンビ(敵)"},{a:ART.imp("alien"),n:"エイリアン(敵)"},
    {a:ART.bossImpostor(),n:"ボス"},
  ];
  items.forEach(it=>L.appendChild(el(`<div class="li">${it.a}<span>${it.n}</span></div>`)));
}

window.addEventListener("DOMContentLoaded",()=>{
  // title stars
  const t=$("#screen-title");
  for(let i=0;i<40;i++){ const s=el(`<div class="tstar"></div>`); const sz=Math.random()*2+1;
    s.style.width=s.style.height=sz+"px"; s.style.left=(Math.random()*100)+"%"; s.style.top=(Math.random()*100)+"%";
    s.style.animationDelay=(Math.random()*2.5)+"s"; t.appendChild(s); }
  buildTitleRow(); buildHelpLegend();
  if($("#machineArt")) $("#machineArt").innerHTML = ART.gachaMachine();
  updateChips();
  SND.setMuted(profile.muted); refreshMuteBtns();

  $("#toBattle").onclick=openStages;
  $("#toShop").onclick=()=>{ SND.unlock(); renderShop(); show("screen-shop"); };
  $("#toGacha").onclick=openGacha;
  $("#stagesBack").onclick=()=>{ updateChips(); show("screen-title"); };
  $("#shopBack").onclick=()=>{ updateChips(); show("screen-title"); };
  $("#gachaBack").onclick=()=>{ updateChips(); show("screen-title"); };
  $("#pullBtn").onclick=pull;
  $("#revAgain").onclick=()=>pull();
  $("#revClose").onclick=closeReveal;
  $("#helpLink").onclick=()=>$("#helpOverlay").classList.add("show");
  $("#helpClose").onclick=()=>$("#helpOverlay").classList.remove("show");
  $("#quitBtn").onclick=()=>{ if(G) G.running=false; updateChips(); show("screen-title"); };
  $("#winBtn").onclick=()=>{ $("#winOverlay").classList.remove("show"); updateChips(); show("screen-title"); };
  $("#loseBtn").onclick=()=>{ $("#loseOverlay").classList.remove("show"); openStages(); };
  if($("#speedBtn")) $("#speedBtn").onclick=toggleSpeed;
  if($("#muteBtn")) $("#muteBtn").onclick=toggleMute;
  if($("#muteTitle")) $("#muteTitle").onclick=toggleMute;

  // keyboard: 1..N deploy owned, W wallet, R report, H henshin, S speed
  window.addEventListener("keydown",e=>{
    if(!G||!G.running) return;
    if(e.key.toLowerCase()==="w") upgradeWallet();
    if(e.key.toLowerCase()==="r") doReport();
    if(e.key.toLowerCase()==="h") triggerHero();
    if(e.key.toLowerCase()==="s") toggleSpeed();
    const n=parseInt(e.key);
    if(n>=1){ const owned=CHARS.filter(c=>(profile.levels[c.id]||0)>=1); if(owned[n-1]) trySpawn(owned[n-1].id); }
  });
});
