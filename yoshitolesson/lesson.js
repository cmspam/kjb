/* ============================================================
   lesson.js  —  コードで あそぼう！  (programming lab)
   Five hands-on lessons for an 8-year-old: variables, values,
   loops, if/else, and designing a wave. No typing — sliders,
   swatches and taps. Every change updates a live code panel and
   a mini preview that reuses the game's own characters. ずんだもん
   guides with VOICEVOX voice. The hero you design in lessons 1+2
   is saved into the real game (yoshito2).
   ============================================================ */

/* ---- ずんだもん guide sprite ---- */
ART.zunda = function(){
  const lg="#cfe98f", lgD="#9cc25e", lgL="#eef9cf", dg="#6fae3a", dgD="#487d24", cheek="#ff9ec4";
  const u = "z"+(ART._uid++);
  return `
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="h${u}" cx="0.4" cy="0.32" r="0.8">
      <stop offset="0" stop-color="${lgL}"/><stop offset=".7" stop-color="${lg}"/><stop offset="1" stop-color="${lgD}"/>
    </radialGradient></defs>
    <ellipse cx="60" cy="115" rx="26" ry="4" fill="#000" opacity=".15"/>
    <!-- edamame sprout (zunda) -->
    <path d="M60 6 Q40 6 40 30 L80 30 Q80 6 60 6 Z" fill="${dg}" stroke="${dgD}" stroke-width="2.5"/>
    <circle cx="50" cy="22" r="5.5" fill="${dgD}" opacity=".5"/><circle cx="60" cy="18" r="5.5" fill="${dgD}" opacity=".5"/><circle cx="70" cy="22" r="5.5" fill="${dgD}" opacity=".5"/>
    <path d="M60 6 L60 30" stroke="${dgD}" stroke-width="1.5" opacity=".5"/>
    <!-- little body -->
    <rect x="48" y="92" width="24" height="20" rx="10" fill="${lg}" stroke="${lgD}" stroke-width="2.5"/>
    <ellipse cx="40" cy="80" rx="7" ry="9" fill="${lg}" stroke="${lgD}" stroke-width="2"/>
    <ellipse cx="80" cy="80" rx="7" ry="9" fill="${lg}" stroke="${lgD}" stroke-width="2"/>
    <!-- head -->
    <circle cx="60" cy="62" r="33" fill="url(#h${u})" stroke="${lgD}" stroke-width="3"/>
    <path d="M40 44 Q38 64 44 84" stroke="#fff" stroke-width="5" opacity=".35" fill="none" stroke-linecap="round"/>
    <!-- cheeks -->
    <circle cx="40" cy="70" r="6" fill="${cheek}" opacity=".7"/><circle cx="80" cy="70" r="6" fill="${cheek}" opacity=".7"/>
    <!-- eyes -->
    <ellipse cx="49" cy="60" rx="6.5" ry="9" fill="#2a2a2a"/><ellipse cx="71" cy="60" rx="6.5" ry="9" fill="#2a2a2a"/>
    <circle cx="51" cy="56" r="2.4" fill="#fff"/><circle cx="73" cy="56" r="2.4" fill="#fff"/>
    <!-- mouth -->
    <path d="M55 74 Q60 80 65 74" stroke="${dgD}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </svg>`;
};

/* ---- DOM helpers ---- */
const $ = s => document.querySelector(s);
function el(html){ const t=document.createElement("template"); t.innerHTML=html.trim(); return t.content.firstChild; }
function show(id){ document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active")); $("#"+id).classList.add("active"); }

/* ---- timers that are cleared whenever we navigate ---- */
let LTIMERS=[];
function every(ms,fn){ const id=setInterval(fn,ms); LTIMERS.push(id); return id; }
function after(ms,fn){ const id=setTimeout(()=>{ LTIMERS=LTIMERS.filter(t=>t!==id); fn(); },ms); LTIMERS.push(id); return id; }
function clearTimers(){ LTIMERS.forEach(id=>{ clearInterval(id); clearTimeout(id); }); LTIMERS=[]; }

/* ---- persisted lab state (cleared lessons + the hero he designs) ---- */
const LAB_KEY="yoshitolesson_v1";
const GAME_CUSTOM_KEY="yoshito_custom_char_v1";   // shared with yoshito2
let lab = loadLab();
function loadLab(){
  let p; try{ p=JSON.parse(localStorage.getItem(LAB_KEY)); }catch(e){}
  if(!p) p={};
  if(!p.cleared) p.cleared={};
  if(!p.design) p.design={ hp:160, dmg:30, size:62, color:"#3fa9f5", visor:"#a6e3ff", name:"ぼくの ヒーロー" };
  if(p.muted===undefined) p.muted=false;
  return p;
}
function saveLab(){ try{ localStorage.setItem(LAB_KEY, JSON.stringify(lab)); }catch(e){} }
function saveCustomToGame(){
  const d=lab.design;
  const cost = Math.round(45 + d.dmg*1.4 + (d.hp-100)*0.12);
  const blob={ name:d.name, color:d.color, visor:d.visor, hp:d.hp, dmg:d.dmg,
    scale:(d.size/100), cost:Math.max(40,cost) };
  try{ localStorage.setItem(GAME_CUSTOM_KEY, JSON.stringify(blob)); }catch(e){}
}

/* ---- guide voice ---- */
function speak(id){ SND.unlock(); SND.voice(id); }

/* ---- mini-preview helpers ---- */
function mkStage(){ return el(`<div class="stage"><div class="ground"></div></div>`); }
function makeSpr(stage, svg, opts){
  opts=opts||{};
  const d=el(`<div class="spr ${opts.foe?'foe':''}">${svg}<div class="hp"><i style="width:100%"></i></div></div>`);
  const s=d.querySelector("svg"); const px=Math.round(112*(opts.scale||0.6));
  s.setAttribute("width",px); s.setAttribute("height",px);
  if(opts.foe) d.style.transform="scaleX(-1)";
  if(!opts.hp){ const h=d.querySelector(".hp"); if(h) h.style.display="none"; }
  stage.appendChild(d);
  const o={ el:d, svg:s, w:px, hpEl:d.querySelector(".hp>i"), x:opts.x||0, max:opts.max||100, hp:opts.max||100, dead:false,
    setX(x){ this.x=x; this.el.style.left=x+"px"; },
    setScale(sc){ const p=Math.round(112*sc); this.w=p; this.svg.setAttribute("width",p); this.svg.setAttribute("height",p); },
    setHP(v){ this.hp=v; if(this.hpEl) this.hpEl.style.width=Math.max(0,v/this.max*100)+"%"; },
    lunge(){ this.svg.animate([{transform:"translateX(0)"},{transform:"translateX(10px) scale(1.06)",offset:.4},{transform:"translateX(0)"}],{duration:220,easing:"ease-out"}); } };
  o.setX(o.x);
  return o;
}
function pop(stage,x,y,txt,color){ const p=el(`<div class="pop" style="left:${x}px;bottom:${y}px;color:${color||"#fff"}">${txt}</div>`); stage.appendChild(p); setTimeout(()=>p.remove(),1000); }
function ring(stage,x,y,color){ const r=el(`<div class="ring" style="left:${x-20}px;bottom:${y-20}px;width:40px;height:40px;border-color:${color||"#fff"}"></div>`); stage.appendChild(r); setTimeout(()=>r.remove(),500); }
function confetti(host){
  const cols=["#8be04f","#ffd23f","#ff8af0","#5aa9e6","#fff"];
  for(let i=0;i<30;i++){ const c=el(`<div class="confetti"></div>`); c.style.left=(Math.random()*100)+"%"; c.style.background=cols[i%cols.length];
    c.style.animationDelay=(Math.random()*0.4)+"s"; c.style.transform=`rotate(${Math.random()*180}deg)`; host.appendChild(c); setTimeout(()=>c.remove(),1600); }
}
function stars(host,n){ for(let i=0;i<n;i++){ const s=el(`<div class="star"></div>`); const sz=Math.random()*2+1;
  s.style.width=s.style.height=sz+"px"; s.style.left=(Math.random()*100)+"%"; s.style.top=(Math.random()*100)+"%"; s.style.animationDelay=(Math.random()*2)+"s"; host.appendChild(s); } }

/* ---- small code-panel helper ---- */
function flash(id){ const e=$(id); if(!e) return; e.classList.add("hl"); setTimeout(()=>e.classList.remove("hl"),260); }

/* ============================================================
   LESSONS
   ============================================================ */
let curLesson=0;

function guideBubble(text){
  return `<div class="guide"><div class="gface">${ART.zunda()}</div><div class="bubble">${text}</div></div>`;
}

const LESSONS = [
  // ---------- L1: variables ----------
  { num:1, title:"へんすう", sub:"すうじを かえよう", icon:"🔢", voice:"l1_intro",
    build(body){
      body.appendChild(el(guideBubble("へんすうは、なまえの ついた はこ。<br>すうじを かえると、キャラが つよく なるよ！")));
      body.appendChild(el(`<div class="goalbar">🎯 こうげきを つよく して、てきを たおそう！</div>`));
      const code=el(`<div class="codebox">
        <span class="k">let</span> たいりょく <span class="k">=</span> <span class="n" id="cHp">${lab.design.hp}</span><br>
        <span class="k">let</span> こうげき <span class="k">=</span> <span class="n" id="cDmg">${lab.design.dmg}</span><br>
        <span class="k">let</span> おおきさ <span class="k">=</span> <span class="n" id="cSize">${lab.design.size}</span></div>`);
      body.appendChild(code);
      const stage=mkStage(); body.appendChild(stage);
      const ctl=el(`<div class="ctl">
        <div class="slider"><label>たいりょく</label><input type="range" id="sHp" min="80" max="400" step="10" value="${lab.design.hp}"><span class="val" id="vHp">${lab.design.hp}</span></div>
        <div class="slider"><label>こうげき</label><input type="range" id="sDmg" min="5" max="100" step="5" value="${lab.design.dmg}"><span class="val" id="vDmg">${lab.design.dmg}</span></div>
        <div class="slider"><label>おおきさ</label><input type="range" id="sSize" min="55" max="120" step="5" value="${lab.design.size}"><span class="val" id="vSize">${lab.design.size}</span></div>
      </div>`);
      body.appendChild(ctl);
      const act=el(`<div class="actrow"><button class="bigbtn gold" id="fightBtn">⚔️ たたかう！</button></div>`);
      body.appendChild(act);

      const W=()=>stage.clientWidth;
      let hero, foe;
      function reset(){
        stage.querySelectorAll(".spr,.pop,.ring").forEach(n=>n.remove());
        hero=makeSpr(stage, ART.crewmate(lab.design.color, lab.design.visor), {scale:lab.design.size/100, x:30, hp:true, max:lab.design.hp});
        foe =makeSpr(stage, ART.imp("red"), {scale:0.6, x:W()-90, hp:true, max:260, foe:true});
      }
      function redraw(){
        $("#cHp").textContent=lab.design.hp; $("#cDmg").textContent=lab.design.dmg; $("#cSize").textContent=lab.design.size;
        $("#vHp").textContent=lab.design.hp; $("#vDmg").textContent=lab.design.dmg; $("#vSize").textContent=lab.design.size;
        if(hero){ hero.setScale(lab.design.size/100); hero.max=lab.design.hp; hero.setHP(lab.design.hp); }
      }
      $("#sHp").oninput=e=>{ lab.design.hp=+e.target.value; saveLab(); redraw(); flash("#cHp"); };
      $("#sDmg").oninput=e=>{ lab.design.dmg=+e.target.value; saveLab(); redraw(); flash("#cDmg"); };
      $("#sSize").oninput=e=>{ lab.design.size=+e.target.value; saveLab(); redraw(); flash("#cSize"); };

      let fighting=false;
      $("#fightBtn").onclick=()=>{
        if(fighting) return; fighting=true; SND.unlock(); reset();
        let hcd=0, fcd=0;
        const tick=every(60,()=>{
          if(foe.dead||hero.dead) return;
          hcd-=0.06; fcd-=0.06;
          // close in then trade
          if(hero.x < foe.x-hero.w*0.7){ hero.x+=6; hero.setX(hero.x); hero.el.classList.add("walk"); return; }
          hero.el.classList.remove("walk");
          if(hcd<=0){ hcd=0.5; hero.lunge(); foe.setHP(foe.hp-lab.design.dmg); ring(stage,foe.x+foe.w/2,60,"#ffd23f"); SND.sfx("hit");
            pop(stage,foe.x+foe.w/2,80,"-"+lab.design.dmg,"#ffd23f");
            if(foe.hp<=0){ foe.dead=true; foe.el.style.transition="opacity .3s,transform .3s"; foe.el.style.opacity=0; foe.el.style.transform="scaleX(-1) translateY(16px) rotate(20deg)";
              pop(stage,foe.x+foe.w/2,100,"たおした！🎉","#8be04f"); SND.sfx("win"); clearTimers();
              after(700,()=>finishLesson()); return; } }
          if(fcd<=0){ fcd=0.6; foe.lunge(); hero.setHP(hero.hp-18); SND.sfx("hit");
            if(hero.hp<=0){ hero.dead=true; hero.el.style.opacity=.4; pop(stage,hero.x+hero.w/2,90,"やられた…","#ff5b5b");
              SND.sfx("lose"); clearTimers();
              after(900,()=>{ fighting=false; pop(stage,W()/2,120,"こうげきを つよく してね！","#ffd23f"); reset(); }); } }
        });
      };
      reset();
    } },

  // ---------- L2: values (color) + save to game ----------
  { num:2, title:"いろ", sub:"じぶんの キャラ", icon:"🎨", voice:"l2_intro",
    build(body){
      body.appendChild(el(guideBubble("いろも コードで きめるよ。<br>じぶんの キャラを つくって、<b>ゲームに ついか</b> しよう！")));
      body.appendChild(el(`<div class="goalbar">🎯 すきな いろを えらんで「ゲームに ついか！」</div>`));
      const code=el(`<div class="codebox">
        <span class="k">let</span> color <span class="k">=</span> <span class="s" id="cColor">"${lab.design.color}"</span><br>
        <span class="k">let</span> visor <span class="k">=</span> <span class="s" id="cVisor">"${lab.design.visor}"</span></div>`);
      body.appendChild(code);
      const stage=mkStage(); body.appendChild(stage);
      const hero=makeSpr(stage, ART.crewmate(lab.design.color, lab.design.visor), {scale:0.9, x:0});
      function center(){ hero.setX((stage.clientWidth-hero.w)/2); }
      const BODY=["#3fa9f5","#ff5b5b","#8be04f","#ffd23f","#c46bff","#ff8af0","#5fe3c1","#ff8a00","#ffffff","#33333f"];
      const VIS =["#a6e3ff","#ffd0d0","#d6fff5","#fff7ea","#ffd0f0","#b6ff00"];
      const sw=(arr,sel,cls)=>arr.map(c=>`<div class="sw ${c===sel?'sel':''}" data-${cls}="${c}" style="background:${c}"></div>`).join("");
      const ctl=el(`<div class="ctl">
        <div><div style="font-weight:bold;margin-bottom:6px">からだの いろ</div><div class="swatches" id="bodyS">${sw(BODY,lab.design.color,"b")}</div></div>
        <div><div style="font-weight:bold;margin-bottom:6px">め(バイザー)の いろ</div><div class="swatches" id="visS">${sw(VIS,lab.design.visor,"v")}</div></div>
        <div><div style="font-weight:bold;margin-bottom:6px">なまえ</div><div class="chips" id="nameC">
          ${["ぼくの ヒーロー","さいきょう","ニャンコ","スーパースター"].map(n=>`<div class="chip ${n===lab.design.name?'':''}" data-name="${n}" style="${n===lab.design.name?'border-color:#ffd23f':''}">${n}</div>`).join("")}</div></div>
      </div>`);
      body.appendChild(ctl);
      const act=el(`<div class="actrow"><button class="bigbtn gold" id="addBtn">⭐ ゲームに ついか！</button></div>`);
      body.appendChild(act);
      after(30,center);

      function redraw(){
        const news=ART.crewmate(lab.design.color, lab.design.visor);
        hero.el.querySelector("svg").outerHTML=news;
        hero.svg=hero.el.querySelector("svg"); hero.svg.setAttribute("width",hero.w); hero.svg.setAttribute("height",hero.w);
        $("#cColor").textContent=`"${lab.design.color}"`; $("#cVisor").textContent=`"${lab.design.visor}"`;
        hero.svg.animate([{transform:"scale(.8)"},{transform:"scale(1.08)"},{transform:"scale(1)"}],{duration:300});
      }
      ctl.querySelectorAll("[data-b]").forEach(s=>s.onclick=()=>{ lab.design.color=s.dataset.b; saveLab();
        ctl.querySelectorAll("[data-b]").forEach(x=>x.classList.toggle("sel",x===s)); flash("#cColor"); SND.sfx("click"); redraw(); });
      ctl.querySelectorAll("[data-v]").forEach(s=>s.onclick=()=>{ lab.design.visor=s.dataset.v; saveLab();
        ctl.querySelectorAll("[data-v]").forEach(x=>x.classList.toggle("sel",x===s)); flash("#cVisor"); SND.sfx("click"); redraw(); });
      ctl.querySelectorAll("[data-name]").forEach(c=>c.onclick=()=>{ lab.design.name=c.dataset.name; saveLab();
        ctl.querySelectorAll("[data-name]").forEach(x=>x.style.borderColor=x===c?"#ffd23f":""); SND.sfx("click"); });

      $("#addBtn").onclick=()=>{ SND.unlock(); saveCustomToGame(); SND.sfx("levelup");
        hero.svg.animate([{transform:"scale(1)"},{transform:"scale(1.3) rotate(8deg)"},{transform:"scale(1)"}],{duration:500});
        ring(stage, stage.clientWidth/2, 90, "#ffd23f"); pop(stage, stage.clientWidth/2, 110, "ゲームに ついか！⭐","#ffd23f");
        after(800,()=>finishLesson("きみの キャラが ゲームに でてくるよ！ あそんでみてね！🎮")); };
    } },

  // ---------- L3: loops ----------
  { num:3, title:"くりかえし", sub:"ループ", icon:"🔁", voice:"l3_intro",
    build(body){
      body.appendChild(el(guideBubble("おなじことを なんかいも！<br>くりかえしで、いちどに たくさん つくれるよ。")));
      body.appendChild(el(`<div class="goalbar">🎯 ちょうど 5たい だして じっこう！</div>`));
      let count=3;
      const code=el(`<div class="codebox">
        <span class="k">for</span> (i <span class="k">=</span> 0; i <span class="k">&lt;</span> <span class="n" id="cN">${count}</span>; i++) {<br>
        &nbsp;&nbsp;つくる(クルーメイト)<br>}</div>`);
      body.appendChild(code);
      const stage=mkStage(); body.appendChild(stage);
      const ctl=el(`<div class="ctl"><div class="slider"><label>かいすう</label><input type="range" id="sN" min="1" max="10" step="1" value="${count}"><span class="val" id="vN">${count}</span></div></div>`);
      body.appendChild(ctl);
      const act=el(`<div class="actrow"><button class="bigbtn gold" id="runBtn">▶ じっこう！</button></div>`);
      body.appendChild(act);
      $("#sN").oninput=e=>{ count=+e.target.value; $("#cN").textContent=count; $("#vN").textContent=count; flash("#cN"); };
      let running=false;
      $("#runBtn").onclick=()=>{
        if(running) return; running=true; SND.unlock();
        stage.querySelectorAll(".spr,.pop").forEach(n=>n.remove());
        let i=0;
        const id=every(280,()=>{
          if(i>=count){ clearTimers(); running=false;
            if(count===5){ pop(stage,stage.clientWidth/2,120,"5たい！ せいかい！🎉","#8be04f"); SND.sfx("win"); after(700,()=>finishLesson()); }
            else { pop(stage,stage.clientWidth/2,120,count+"たい だしたよ！(5たいに してね)","#ffd23f"); }
            return; }
          const sp=makeSpr(stage, ART.crewmate(lab.design.color, lab.design.visor), {scale:0.5, x:10});
          sp.dir=1; SND.sfx("deploy");
          const sx={v:10};
          every(40,()=>{ sx.v+=2.2; sp.setX(sx.v); sp.el.classList.add("walk"); });
          pop(stage,30,100,"i = "+i,"#9fd8ff");
          i++;
        });
      };
    } },

  // ---------- L4: if / else ----------
  { num:4, title:"もし〜なら", sub:"じょうけん", icon:"🔀", voice:"l4_intro",
    build(body){
      body.appendChild(el(guideBubble("「もし〜なら」で、コンピューターは かんがえる！<br>メタルてきを たおすには？")));
      body.appendChild(el(`<div class="goalbar">🎯 ただしい こうげきを えらんで メタルを たおそう！</div>`));
      const code=el(`<div class="codebox">
        <span class="k">if</span> (てき <span class="k">==</span> <span class="s">メタル</span>) {<br>
        &nbsp;&nbsp;つかう(<span class="n">クリティカル⚡</span>) <span class="c">// ← これが ただしい</span><br>
        } <span class="k">else</span> {<br>
        &nbsp;&nbsp;つかう(ふつうの こうげき)<br>}</div>`);
      body.appendChild(code);
      const stage=mkStage(); body.appendChild(stage);
      let hero, foe;
      function reset(){ stage.querySelectorAll(".spr,.pop,.ring").forEach(n=>n.remove());
        hero=makeSpr(stage, ART.crewmate(lab.design.color, lab.design.visor), {scale:0.62, x:30});
        foe =makeSpr(stage, ART.imp("metal"), {scale:0.66, x:0, hp:true, max:120, foe:true});
        after(20,()=>foe.setX(stage.clientWidth-100)); }
      reset();
      const act=el(`<div class="pickrow">
        <button class="pickbtn" id="normBtn">🗡️ ふつうの こうげき</button>
        <button class="pickbtn" id="critBtn" style="border-color:#ffd23f">⚡ クリティカル</button></div>`);
      body.appendChild(act);
      let done=false;
      $("#normBtn").onclick=()=>{ if(done) return; SND.unlock(); hero.lunge(); SND.sfx("hit");
        pop(stage,foe.x+foe.w/2,80,"1 ダメージ！ きかない！","#cfe8ff"); ring(stage,foe.x+foe.w/2,60,"#cfe8ff"); };
      $("#critBtn").onclick=()=>{ if(done) return; done=true; SND.unlock(); hero.lunge(); SND.sfx("crit");
        ring(stage,foe.x+foe.w/2,60,"#ffd23f"); pop(stage,foe.x+foe.w/2,90,"クリティカル！⚡","#ff5b5b");
        foe.setHP(0); foe.el.style.transition="opacity .3s,transform .3s"; foe.el.style.opacity=0; foe.el.style.transform="scaleX(-1) translateY(16px) rotate(20deg)";
        pop(stage,foe.x+foe.w/2,110,"たおした！🎉","#8be04f"); SND.sfx("win"); after(800,()=>finishLesson()); };
    } },

  // ---------- L5: design a wave (array) ----------
  { num:5, title:"つくってみよう", sub:"ステージ デザイン", icon:"🛠️", voice:"l5_intro",
    build(body){
      body.appendChild(el(guideBubble("じぶんだけの ステージを つくろう！<br>てきを えらんで、3たい いじょうで プレイ！")));
      body.appendChild(el(`<div class="goalbar">🎯 3たい いじょうの ウェーブを つくって プレイ！</div>`));
      const wave=[];
      const code=el(`<div class="codebox" id="waveCode"></div>`);
      body.appendChild(code);
      const list=el(`<div class="wavelist" id="waveList"></div>`); body.appendChild(list);
      const TYPES=[["red","あか"],["float","ふゆう"],["zombie","ゾンビ"],["alien","エイリアン"],["demon","あくま"],["metal","メタル"]];
      const chips=el(`<div class="chips">${TYPES.map(([k,n])=>`<div class="chip" data-k="${k}">${ART.imp(k)}${n}</div>`).join("")}</div>`);
      body.appendChild(chips);
      const act=el(`<div class="actrow"><button class="bigbtn pink" id="clrBtn">🗑️ けす</button><button class="bigbtn gold" id="playBtn">▶ プレイ！</button></div>`);
      body.appendChild(act);
      const stage=mkStage(); body.appendChild(stage);

      function redraw(){
        list.innerHTML = wave.length? wave.map(k=>ART.imp(k)).join("") : `<span style="color:#6a8a78;align-self:center;padding:4px 8px">てきを タップ して ついか</span>`;
        list.querySelectorAll("svg").forEach(s=>{s.setAttribute("width",34);s.setAttribute("height",34);});
        const names={red:"redImp",float:"floatImp",zombie:"zombieImp",alien:"alienImp",demon:"demonImp",metal:"metalImp"};
        $("#waveCode").innerHTML = `<span class="k">let</span> wave <span class="k">=</span> [<br>`+
          (wave.length? wave.map(k=>`&nbsp;&nbsp;<span class="s">${names[k]}</span>,`).join("<br>")+"<br>" : "")+`]`;
      }
      redraw();
      chips.querySelectorAll("[data-k]").forEach(c=>c.onclick=()=>{ if(wave.length>=8) return; wave.push(c.dataset.k); SND.sfx("click"); redraw(); });
      $("#clrBtn").onclick=()=>{ wave.length=0; SND.sfx("click"); redraw(); };

      let playing=false;
      $("#playBtn").onclick=()=>{
        if(playing) return;
        if(wave.length<3){ pop(stage,stage.clientWidth/2,120,"3たい いじょうに してね！","#ffd23f"); SND.sfx("lose"); return; }
        playing=true; SND.unlock(); stage.querySelectorAll(".spr,.pop,.ring").forEach(n=>n.remove());
        const W=stage.clientWidth;
        // base on the left + 3 defenders
        const allies=[]; for(let i=0;i<3;i++){ const a=makeSpr(stage, ART.crewmate(lab.design.color,lab.design.visor), {scale:0.46,x:14+i*6,hp:true,max:90}); a.dir=1; a.cd=0; allies.push(a); }
        const foes=[]; let si=0;
        const spawn=every(650,()=>{ if(si>=wave.length){ return; } const f=makeSpr(stage, ART.imp(wave[si++]), {scale:0.5,x:W-60,hp:true,max:70,foe:true}); f.dir=-1; f.cd=0; foes.push(f); });
        const SPD=42;
        const tick=every(50,()=>{
          const live=[...allies,...foes].filter(o=>!o.dead);
          live.forEach(o=>{
            const opp=(o.dir===1?foes:allies).filter(x=>!x.dead);
            let tgt=null,bd=1e9; opp.forEach(x=>{const d=Math.abs(x.x-o.x); if(d<bd){bd=d;tgt=x;}});
            if(tgt && bd < o.w*0.45+tgt.w*0.45+10){ o.el.classList.remove("walk"); o.cd-=0.05;
              if(o.cd<=0){ o.cd=0.5; o.lunge(); tgt.setHP(tgt.hp-16); SND.sfx("hit");
                if(tgt.hp<=0){ tgt.dead=true; ring(stage,tgt.x+tgt.w/2,46,o.dir===1?"#ffd23f":"#ff5b5b"); tgt.el.style.transition="opacity .3s"; tgt.el.style.opacity=0; setTimeout(()=>tgt.el.remove(),300); } } }
            else { o.x+=o.dir*SPD*0.05; o.setX(o.x); o.el.classList.add("walk"); }
          });
          if(si>=wave.length && foes.every(f=>f.dead) && foes.length){ clearTimers(); pop(stage,W/2,120,"ステージ クリア！🎉","#8be04f"); SND.sfx("win"); after(900,()=>finishLesson("すごい！ きみが ゲームを デザイン したよ！🛠️")); }
        });
        after(13000,()=>{ if(playing){ clearTimers(); pop(stage,W/2,120,"ステージ クリア！🎉","#8be04f"); SND.sfx("win"); after(900,()=>finishLesson("すごい！ きみが ゲームを デザイン したよ！🛠️")); } });
      };
    } },
];

/* ============================================================
   NAVIGATION
   ============================================================ */
function renderHome(){
  $("#guideTop").innerHTML=ART.zunda();
  const grid=$("#lessonGrid"); grid.innerHTML="";
  LESSONS.forEach((L,i)=>{
    const unlocked = i===0 || lab.cleared[i-1];
    const cleared = !!lab.cleared[i];
    const node=el(`<div class="lesnode ${unlocked?"":"locked"} ${cleared?"cleared":""}">
      <div class="ln">${L.num}</div>
      <div class="lt"><b>${L.icon} ${unlocked?L.title:"？？？"}</b><span>${unlocked?L.sub:"まえの レッスンを クリアしてね"}</span></div>
      <div class="lic">${cleared?"👑":(unlocked?"▶":"🔒")}</div></div>`);
    if(unlocked) node.onclick=()=>openLesson(i);
    grid.appendChild(node);
  });
}
function openHome(){ clearTimers(); renderHome(); show("home"); }

function openLesson(i){
  clearTimers(); curLesson=i; const L=LESSONS[i];
  SND.unlock(); SND.preload([L.voice,"praise1","praise2","praise3","correct","clear"]);
  $("#lesTitle").textContent=`${L.num}. ${L.title}`;
  const body=$("#lesBody"); body.innerHTML="";
  $("#clearOv").classList.remove("show");
  L.build(body);
  show("lesson");
  after(450,()=>speak(L.voice));
}

let lessonResolved=false;
function finishLesson(extraMsg){
  if(lessonResolved) return; lessonResolved=true;
  clearTimers();
  lab.cleared[curLesson]=1; saveLab();
  const last = curLesson===LESSONS.length-1;
  const allDone = LESSONS.every((_,i)=>lab.cleared[i]);
  const ov=$("#clearOv");
  $("#clearFace").innerHTML=ART.zunda();
  $("#clearH").textContent = allDone? "ぜんぶ クリア！🏆" : "できた！🎉";
  $("#clearP").textContent = extraMsg || (allDone? "きみは りっぱな プログラマー なのだ！" : "つぎの レッスンも やってみよう！");
  const nb=$("#clearNext");
  if(last){ nb.textContent="おうちへ ▶"; nb.onclick=openHome; }
  else { nb.textContent="つぎの レッスン ▶"; nb.onclick=()=>openLesson(curLesson+1); }
  confetti(ov); stars(ov,18);
  ov.classList.add("show");
  speak(allDone?"clear":["praise1","praise2","praise3"][Math.floor(Math.random()*3)]);
}

/* ---- mute ---- */
function refreshMute(){ const t=lab.muted?"🔇":"🔊"; ["#muteHome","#muteLes"].forEach(s=>{const b=$(s); if(b) b.textContent=t;}); }
function toggleMute(){ lab.muted=!lab.muted; SND.setMuted(lab.muted); saveLab(); refreshMute(); if(!lab.muted){ SND.unlock(); SND.sfx("click"); } }

/* ---- wiring ---- */
window.addEventListener("DOMContentLoaded",()=>{
  SND.setMuted(lab.muted); refreshMute();
  stars($("#home"),34);
  renderHome();
  $("#lesBack").onclick=openHome;
  $("#clearHome").onclick=openHome;
  $("#muteHome").onclick=toggleMute;
  $("#muteLes").onclick=toggleMute;
  // greet on first tap (audio needs a gesture)
  const greet=()=>{ SND.unlock(); speak("welcome"); document.removeEventListener("pointerdown",greet); };
  document.addEventListener("pointerdown",greet,{once:true});
});

// reset the per-lesson "resolved" guard whenever a fresh lesson opens
const _openLesson=openLesson;
openLesson=function(i){ lessonResolved=false; _openLesson(i); };
