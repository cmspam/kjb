/* ============================================================
   studio.js  —  ゲームスタジオ
   Design a whole game: any number of characters (any of the 11
   looks, recolored, resized, restatted, with abilities, set as
   start / gacha / locked) and any number of stages (enemy waves,
   timing, strength, tower HP). Save/load 3 slots. Then PLAY the
   game you built (../play reads the same definition).
   ============================================================ */

/* ---- persistence ---- */
const SLOT_KEYS = ["0","1","2"];
function gameKey(s){ return "ylstudio_game_"+s; }
function getActive(){ try{ return localStorage.getItem("ylstudio_active")||"0"; }catch(e){ return "0"; } }
function setActive(s){ try{ localStorage.setItem("ylstudio_active",s); }catch(e){} }
function loadGame(s){ try{ return JSON.parse(localStorage.getItem(gameKey(s))); }catch(e){ return null; } }
function defChar(){ return { base:"crewmate", name:"", hue:0, sat:1, size:0.62, hp:150, dmg:25, speed:60, atkCd:0.7, abil:[], avail:"start", rarity:"N" }; }
function defStage(){ return { name:"", ehp:700, php:1600, coin:13, mag:1, coinStart:150, spacing:3, wave:[] }; }
function newGame(){ return { title:"ぼくの ゲーム", chars:[ defChar() ], levels:[ defStage() ] }; }

let SLOT = getActive();
let G = loadGame(SLOT) || newGame();
function save(){ try{ localStorage.setItem(gameKey(SLOT), JSON.stringify(G)); }catch(e){} }
save();

/* ---- helpers ---- */
const $ = s=>document.querySelector(s);
function el(h){ const t=document.createElement("template"); t.innerHTML=h.trim(); return t.content.firstChild; }
function show(id){ document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active")); $("#"+id).classList.add("active"); window.scrollTo&&window.scrollTo(0,0); }
let toastT=null;
function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove("show"),1600); }
function speak(id){ SND.unlock(); SND.voice(id); }

const ABIL = [["fast","はやい💨"],["area","はんい💥"],["knockback","ふっとばし👊"],["crit","クリティカル⚡"],
  ["barrierBreaker","バリアこわし🛡️"],["zombieKiller","ゾンビキラー☠️"],["tank","タンク🧱"]];
const ABIL_LABEL = Object.fromEntries(ABIL);
const ENEMIES = [["red","あか"],["float","ふゆう"],["zombie","ゾンビ"],["black","くろ"],
  ["alien","エイリアン"],["demon","あくま"],["metal","メタル"],["boss","ボス"]];
const enemyArt = k => k==="boss" ? ART.bossImpostor() : ART.imp(k);
const baseName = c => BASE_NAMES[c.base] || "キャラ";
const charPic = c => recolor(BASES[c.base?c.base:"crewmate"](1), c.hue||0, (c.sat==null?1:c.sat));
function availTag(c){
  if(c.avail==="gacha") return `<span class="minitag gacha">ガチャ ${"★".repeat({N:1,R:2,SR:3,UR:4}[c.rarity]||1)}</span>`;
  if(c.avail==="locked") return `<span class="minitag lock">あとで</span>`;
  return `<span class="minitag start">さいしょ</span>`;
}

/* ============================================================
   HOME
   ============================================================ */
function renderHome(){
  $("#homeFace").innerHTML = ART.zunda();
  $("#homeTag").innerHTML = `いま の ゲーム: <b>${G.title||"ぼくの ゲーム"}</b><br>キャラ ${G.chars.length}こ ・ ステージ ${G.levels.length}こ`;
}

/* ============================================================
   CHARACTER LIST + EDITOR
   ============================================================ */
function renderCharList(){
  const L=$("#charList"); L.innerHTML="";
  G.chars.forEach((c,i)=>{
    const card=el(`<div class="card"><div class="pic">${charPic(c)}</div>
      <div class="meta"><b>${c.name||baseName(c)}</b><span>たいりょく ${c.hp} ・ こうげき ${c.dmg}</span>
      <div class="tagrow">${availTag(c)}${(c.abil||[]).map(a=>`<span class="minitag">${ABIL_LABEL[a]}</span>`).join("")}</div></div></div>`);
    card.onclick=()=>openCharEdit(i); L.appendChild(card);
  });
  const add=el(`<div class="card addcard">＋ キャラを ついか</div>`);
  add.onclick=()=>{ G.chars.push(defChar()); save(); SND.sfx("click"); openCharEdit(G.chars.length-1); };
  L.appendChild(add);
}

let editIdx=0, editC=null;
function openCharEdit(i){ editIdx=i; editC=G.chars[i]; show("charEdit"); renderCharEdit(); }
function renderCharEdit(){
  const c=editC;
  $("#charEditTitle").textContent = c.name||baseName(c);
  const body=$("#charEditBody");
  body.innerHTML=`
    <div class="preview" id="cPrev"></div>
    <div class="ctl"><h3>みための タイプ</h3><div class="picks" id="basePicks"></div></div>
    <div class="ctl"><h3>いろ・おおきさ</h3>
      <div class="row"><label>いろ</label><input type="range" class="hueslider" id="hue" min="0" max="360" value="${c.hue||0}"></div>
      <div class="row"><label>こさ</label><input type="range" id="sat" min="0" max="200" value="${Math.round((c.sat==null?1:c.sat)*100)}"><span class="val" id="vSat">${Math.round((c.sat==null?1:c.sat)*100)}</span></div>
      <div class="row"><label>おおきさ</label><input type="range" id="size" min="45" max="110" value="${Math.round(c.size*100)}"><span class="val" id="vSize">${Math.round(c.size*100)}</span></div>
    </div>
    <div class="ctl"><h3>つよさ</h3>
      <div class="row"><label>たいりょく</label><input type="range" id="hp" min="40" max="1500" step="10" value="${c.hp}"><span class="val" id="vHp">${c.hp}</span></div>
      <div class="row"><label>こうげき</label><input type="range" id="dmg" min="3" max="300" step="1" value="${c.dmg}"><span class="val" id="vDmg">${c.dmg}</span></div>
      <div class="row"><label>はやさ</label><input type="range" id="speed" min="20" max="140" step="2" value="${c.speed}"><span class="val" id="vSpeed">${c.speed}</span></div>
    </div>
    <div class="ctl"><h3>とくぎ（タップで オン・オフ）</h3><div class="chips" id="abilChips"></div></div>
    <div class="ctl"><h3>なまえ・でかた</h3>
      <div class="row"><label>なまえ</label><input type="text" id="nm" maxlength="10" placeholder="${baseName(c)}" value="${c.name||""}"></div>
      <div class="seg" id="availSeg"></div>
      <div class="row" id="rarityRow" style="display:none"><label>レアど</label><div class="chips" id="rarityChips"></div></div>
    </div>
    <div class="dataview" id="cData"></div>
    <div class="rowbtns"><button class="delbtn" id="delChar">🗑️ この キャラを けす</button></div>`;

  const bp=$("#basePicks");
  Object.keys(BASES).forEach(k=>{
    const p=el(`<div class="pick ${k===c.base?'on':''}" >${recolor(BASES[k](1), c.hue||0, (c.sat==null?1:c.sat))}<span>${BASE_NAMES[k]}</span></div>`);
    p.onclick=()=>{ c.base=k; SND.sfx("click"); save(); renderCharEdit(); };
    bp.appendChild(p);
  });
  const ac=$("#abilChips");
  ABIL.forEach(([k,lbl])=>{
    const on=(c.abil||[]).includes(k);
    const ch=el(`<div class="chip ${on?'on':''}">${lbl}</div>`);
    ch.onclick=()=>{ c.abil=c.abil||[]; const j=c.abil.indexOf(k); if(j<0)c.abil.push(k); else c.abil.splice(j,1); SND.sfx("click"); save(); renderCharEdit(); };
    ac.appendChild(ch);
  });
  const seg=$("#availSeg");
  [["start","さいしょから"],["gacha","ガチャ"],["locked","あとで"]].forEach(([v,l])=>{
    const b=el(`<button class="${c.avail===v?'on':''}">${l}</button>`);
    b.onclick=()=>{ c.avail=v; SND.sfx("click"); save(); renderCharEdit(); };
    seg.appendChild(b);
  });
  if(c.avail==="gacha"){
    $("#rarityRow").style.display=""; const rc=$("#rarityChips");
    [["N","★"],["R","★★"],["SR","★★★"],["UR","★★★★"]].forEach(([v,s])=>{
      const ch=el(`<div class="chip ${c.rarity===v?'on':''}">${s}</div>`);
      ch.onclick=()=>{ c.rarity=v; SND.sfx("click"); save(); renderCharEdit(); };
      rc.appendChild(ch);
    });
  }
  const bindR=(id,fn)=>{ const e=$("#"+id); e.oninput=()=>{ fn(+e.value); save(); updatePrev(); updateData(); }; };
  bindR("hue", v=>{ c.hue=v; });
  bindR("sat", v=>{ c.sat=v/100; $("#vSat").textContent=v; });
  bindR("size", v=>{ c.size=v/100; $("#vSize").textContent=v; });
  bindR("hp", v=>{ c.hp=v; $("#vHp").textContent=v; });
  bindR("dmg", v=>{ c.dmg=v; $("#vDmg").textContent=v; });
  bindR("speed", v=>{ c.speed=v; $("#vSpeed").textContent=v; });
  $("#nm").oninput=()=>{ c.name=$("#nm").value; save(); updateData(); };
  $("#delChar").onclick=()=>{ if(G.chars.length<=1){ toast("さいてい 1つ は ひつようだよ"); return; }
    G.chars.splice(editIdx,1); save(); SND.sfx("click"); show("chars"); renderCharList(); };
  updatePrev(); updateData();

  function updatePrev(){
    const px=Math.min(165, Math.round(150*c.size*1.35));
    const svg=recolor(BASES[c.base](1), c.hue||0, (c.sat==null?1:c.sat));
    $("#cPrev").innerHTML=svg;
    const s=$("#cPrev svg"); if(s){ s.setAttribute("width",px); s.setAttribute("height",px); }
  }
  function updateData(){
    $("#cData").innerHTML = `<span class="k">キャラ</span> = { <span class="k">hp</span>:<span class="n">${c.hp}</span>, `+
      `<span class="k">dmg</span>:<span class="n">${c.dmg}</span>, <span class="k">speed</span>:<span class="n">${c.speed}</span>, `+
      `<span class="k">size</span>:<span class="n">${c.size.toFixed(2)}</span>, <span class="k">とくぎ</span>:[${(c.abil||[]).map(a=>'"'+a+'"').join(", ")}] }`;
  }
}

/* ============================================================
   STAGE LIST + EDITOR
   ============================================================ */
function renderStageList(){
  const L=$("#stageList"); L.innerHTML="";
  G.levels.forEach((s,i)=>{
    const icons=(s.wave||[]).slice(0,6).map(w=>`<span style="font-size:11px">${enemyShort(w.e)}</span>`).join(" ");
    const card=el(`<div class="card"><div class="pic" style="background:none">${i+1}️⃣</div>
      <div class="meta"><b>${s.name||("ステージ "+(i+1))}</b><span>てき ${(s.wave||[]).length}たい ・ タワー ${s.ehp}</span>
      <div class="tagrow"><span class="minitag">つよさ ${Math.round(s.mag*100)}%</span></div></div></div>`);
    card.onclick=()=>openStageEdit(i); L.appendChild(card);
  });
  const add=el(`<div class="card addcard">＋ ステージを ついか</div>`);
  add.onclick=()=>{ G.levels.push(defStage()); save(); SND.sfx("click"); openStageEdit(G.levels.length-1); };
  L.appendChild(add);
}
function enemyShort(k){ return ({red:"🔴",float:"🔵",zombie:"🟢",black:"⚫",alien:"🟩",demon:"🟣",metal:"⚪",boss:"💀"})[k]||"❓"; }

let editSIdx=0, editS=null;
function openStageEdit(i){ editSIdx=i; editS=G.levels[i]; show("stageEdit"); renderStageEdit(); }
function reassignT(s){ s.wave.forEach((w,i)=> w.t = 2 + i*(s.spacing||3)); }
function renderStageEdit(){
  const s=editS;
  $("#stageEditTitle").textContent = s.name||("ステージ "+(editSIdx+1));
  const body=$("#stageEditBody");
  body.innerHTML=`
    <div class="ctl"><h3>なまえ</h3>
      <div class="row"><input type="text" id="snm" maxlength="12" placeholder="ステージ ${editSIdx+1}" value="${s.name||""}"></div></div>
    <div class="ctl"><h3>タワー と おかね</h3>
      <div class="row"><label>てきタワー</label><input type="range" id="ehp" min="300" max="3000" step="50" value="${s.ehp}"><span class="val" id="vEhp">${s.ehp}</span></div>
      <div class="row"><label>じぶんタワー</label><input type="range" id="php" min="600" max="3000" step="100" value="${s.php}"><span class="val" id="vPhp">${s.php}</span></div>
      <div class="row"><label>おかね</label><input type="range" id="coin" min="8" max="24" step="1" value="${s.coin}"><span class="val" id="vCoin">${s.coin}</span></div>
      <div class="row"><label>てきの つよさ</label><input type="range" id="mag" min="50" max="250" step="5" value="${Math.round(s.mag*100)}"><span class="val" id="vMag">${Math.round(s.mag*100)}%</span></div>
    </div>
    <div class="ctl"><h3>ウェーブ（てきを タップして ついか）</h3>
      <div class="picks" id="enemyPicks"></div>
      <div class="row"><label>あいだ</label><input type="range" id="spacing" min="1" max="6" step="1" value="${s.spacing||3}"><span class="val" id="vSpacing">${s.spacing||3}びょう</span></div>
      <div class="wavelist" id="waveList"></div>
      <div class="rowbtns"><button class="delbtn" id="clearWave">🗑️ ウェーブを けす</button></div>
    </div>
    <div class="dataview" id="sData"></div>
    <div class="rowbtns"><button class="delbtn" id="delStage">🗑️ この ステージを けす</button></div>`;

  const ep=$("#enemyPicks");
  ENEMIES.forEach(([k,n])=>{
    const p=el(`<div class="pick">${enemyArt(k)}<span>${n}</span></div>`);
    p.onclick=()=>{ if(s.wave.length>=20){ toast("いっぱい だよ！"); return; } s.wave.push({e:k}); reassignT(s); save(); SND.sfx("click"); renderWave(); updateSData(); };
    ep.appendChild(p);
  });
  const bindR=(id,fn)=>{ const e=$("#"+id); e.oninput=()=>{ fn(+e.value); save(); updateSData(); }; };
  bindR("ehp", v=>{ s.ehp=v; $("#vEhp").textContent=v; });
  bindR("php", v=>{ s.php=v; $("#vPhp").textContent=v; });
  bindR("coin", v=>{ s.coin=v; $("#vCoin").textContent=v; });
  bindR("mag", v=>{ s.mag=v/100; $("#vMag").textContent=v+"%"; });
  $("#spacing").oninput=()=>{ s.spacing=+$("#spacing").value; $("#vSpacing").textContent=s.spacing+"びょう"; reassignT(s); save(); renderWave(); updateSData(); };
  $("#snm").oninput=()=>{ s.name=$("#snm").value; save(); };
  $("#clearWave").onclick=()=>{ s.wave=[]; save(); SND.sfx("click"); renderWave(); updateSData(); };
  $("#delStage").onclick=()=>{ if(G.levels.length<=1){ toast("さいてい 1つ は ひつようだよ"); return; }
    G.levels.splice(editSIdx,1); save(); SND.sfx("click"); show("stages"); renderStageList(); };
  renderWave(); updateSData();

  function renderWave(){
    const wl=$("#waveList");
    if(!s.wave.length){ wl.innerHTML=`<span style="color:#6a8a78;align-self:center;padding:4px 8px">てきを タップして いれてね</span>`; return; }
    wl.innerHTML="";
    s.wave.forEach((w,i)=>{
      const c=el(`<div class="wavechip">${enemyArt(w.e)}<span class="t">${w.t}びょう</span></div>`);
      c.querySelector("svg").setAttribute("width",34); c.querySelector("svg").setAttribute("height",34);
      c.onclick=()=>{ s.wave.splice(i,1); reassignT(s); save(); SND.sfx("click"); renderWave(); updateSData(); };
      wl.appendChild(c);
    });
  }
  function updateSData(){
    const w=s.wave.map(x=>`{<span class="k">t</span>:<span class="n">${x.t}</span>,<span class="k">e</span>:"${x.e}"}`).join(", ");
    $("#sData").innerHTML=`<span class="k">ステージ</span> = { <span class="k">tower</span>:<span class="n">${s.ehp}</span>, <span class="k">つよさ</span>:<span class="n">${s.mag.toFixed(2)}</span>,<br><span class="k">wave</span>:[ ${w} ] }`;
  }
}

/* ============================================================
   SLOTS (save / load)
   ============================================================ */
function validGame(g){ return g && Array.isArray(g.chars) && g.chars.length && Array.isArray(g.levels) && g.levels.length; }
function exportFile(){
  try{
    const blob=new Blob([JSON.stringify(G,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    const safe=(G.title||"mygame").replace(/[^\w぀-ヿ一-鿿 -]/g,"").trim()||"mygame";
    a.href=url; a.download=safe+".nyanyako.json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
    SND.sfx("levelup"); toast("ファイルに ほぞん した！");
  }catch(e){ toast("ほぞん できなかった…"); }
}
function importFromText(text){
  let g; try{ g=JSON.parse(text); }catch(e){ toast("ファイルが よめなかった…"); return; }
  if(!validGame(g)){ toast("ゲームの ファイルじゃ ないみたい…"); return; }
  G=g; save(); SND.sfx("levelup"); renderSlots(); renderHome(); toast("ファイルから よみこんだ！🎮");
}

/* ---- link (base64 in URL) + QR sharing, to move a game between devices ---- */
function b64e(str){ return btoa(unescape(encodeURIComponent(str))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function b64d(b){ b=b.replace(/-/g,'+').replace(/_/g,'/'); while(b.length%4) b+='='; return decodeURIComponent(escape(atob(b))); }
function shareURL(){ return location.origin+location.pathname+"#g="+b64e(JSON.stringify(G)); }
function checkURLImport(){
  const m=(location.hash||"").match(/[#&]g=([^&]+)/);
  if(!m) return false;
  try{ const g=JSON.parse(b64d(m[1])); if(validGame(g)){ G=g; save(); history.replaceState(null,"",location.pathname); return true; } }catch(e){}
  return false;
}
function showShare(){
  const url=shareURL();
  $("#shareLink").textContent=url;
  const box=$("#qrBox");
  try{
    const q=qrcode(0,"L"); q.addData(url); q.make();
    box.className="qrbox"; box.innerHTML=`<img alt="QR" src="${q.createDataURL(6,2)}">`;
  }catch(e){
    box.className="qrbox toobig";
    box.textContent="この ゲームは おおきすぎて QRに できないよ。「リンクを コピー」か「ファイルに ほぞん」で わたしてね！";
  }
  $("#shareOvl").classList.add("show");
  SND.unlock(); SND.sfx("reveal");
}
function renderSlots(){
  const L=$("#slotList"); L.innerHTML="";
  L.appendChild(el(`<div style="font-size:13px;color:#bfe;text-align:center;line-height:1.6">ゲームは じどうで ほぞん されるよ。<br><b style="color:#ffd23f">ゲームを わたす</b> で QR・リンク・ファイルに できる！<br>ほかの タブレットに もっていけるよ！</div>`));
  const fileRow=el(`<div class="rowbtns" style="justify-content:center">
    <button class="bigbtn gold" id="expFile" style="font-size:16px">📤 ゲームを わたす</button>
    <button class="bigbtn blue" id="impFile" style="font-size:16px">📥 ファイルから よみこむ</button></div>`);
  L.appendChild(fileRow);
  fileRow.querySelector("#expFile").onclick=showShare;
  fileRow.querySelector("#impFile").onclick=()=>$("#importFile").click();
  SLOT_KEYS.forEach((s,i)=>{
    const g=loadGame(s);
    const cur = s===SLOT;
    const info = g ? `<b>${g.title||"ぼくの ゲーム"}</b><span>キャラ ${g.chars?g.chars.length:0} ・ ステージ ${g.levels?g.levels.length:0}</span>` : `<b>からっぽ</b><span>あたらしく つくれるよ</span>`;
    const card=el(`<div class="slot ${cur?'on':''}"><div class="pic" style="background:none;font-size:26px">💾</div>
      <div class="meta">スロット ${i+1} ${cur?'（いま）':''}<br>${info}</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <button class="bigbtn gray" style="padding:8px 12px;font-size:14px;box-shadow:0 4px 0 #0007" data-act="load">えらぶ</button>
        <button class="bigbtn gold" style="padding:8px 12px;font-size:14px;box-shadow:0 4px 0 #0007" data-act="new">あたらしく</button>
      </div></div>`);
    card.querySelector('[data-act="load"]').onclick=()=>{ SLOT=s; setActive(s); G=loadGame(s)||newGame(); save(); SND.sfx("levelup"); renderSlots(); renderHome(); toast("スロット "+(i+1)+" を ひらいた！"); };
    card.querySelector('[data-act="new"]').onclick=()=>{ SLOT=s; setActive(s); G=newGame(); save(); SND.sfx("levelup"); renderSlots(); renderHome(); toast("あたらしい ゲーム！"); };
    L.appendChild(card);
  });
}

/* ============================================================
   PLAY
   ============================================================ */
function play(){
  if(!G.chars.some(c=>c.avail==="start")){ toast("「さいしょから」つかえる キャラを 1つ いれてね！"); return; }
  setActive(SLOT); save(); SND.unlock(); SND.sfx("win");
  location.href="play/index.html";
}

/* ---- mute ---- */
let muted=false;
try{ muted = localStorage.getItem("ylstudio_muted")==="1"; }catch(e){}
function refreshMute(){ $("#muteBtn").textContent = muted?"🔇":"🔊"; }
function toggleMute(){ muted=!muted; SND.setMuted(muted); try{localStorage.setItem("ylstudio_muted",muted?"1":"0");}catch(e){} refreshMute(); if(!muted){ SND.unlock(); SND.sfx("click"); } }

/* ============================================================
   WIRING
   ============================================================ */
window.addEventListener("DOMContentLoaded",()=>{
  SND.setMuted(muted); refreshMute();
  SND.preload(["welcome","hero_intro","stage_intro","saved","praise1"]);
  const imported = checkURLImport();
  renderHome();
  if(imported) toast("リンクから ゲームを よみこんだ！🎮");
  // share overlay
  $("#shareClose").onclick=()=>$("#shareOvl").classList.remove("show");
  $("#saveFileBtn").onclick=exportFile;
  $("#copyLink").onclick=()=>{ const url=shareURL();
    if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(url).then(()=>toast("リンクを コピーした！"),()=>toast("コピー できなかった…")); }
    else toast("リンクを ながおしして コピーしてね"); };
  $("#muteBtn").onclick=toggleMute;
  $("#toChars").onclick=()=>{ SND.unlock(); renderCharList(); show("chars"); speak("hero_intro"); };
  $("#toStages").onclick=()=>{ SND.unlock(); renderStageList(); show("stages"); speak("stage_intro"); };
  $("#toPlay").onclick=play;
  $("#toSlots").onclick=()=>{ SND.unlock(); renderSlots(); show("slots"); };
  $("#importFile").onchange=(e)=>{ const f=e.target.files&&e.target.files[0]; if(!f) return;
    const r=new FileReader(); r.onload=()=>importFromText(r.result); r.readAsText(f); e.target.value=""; };
  $("#charsBack").onclick=()=>{ renderHome(); show("home"); };
  $("#stagesBack").onclick=()=>{ renderHome(); show("home"); };
  $("#slotsBack").onclick=()=>{ renderHome(); show("home"); };
  $("#charEditBack").onclick=()=>{ save(); renderCharList(); show("chars"); };
  $("#stageEditBack").onclick=()=>{ save(); renderStageList(); show("stages"); };
  const greet=()=>{ SND.unlock(); speak("welcome"); document.removeEventListener("pointerdown",greet); };
  document.addEventListener("pointerdown",greet,{once:true});
});
