/* ============================================================
   snd.js  —  iPad-safe audio bus for ニャーニャコ大戦争
   One AudioContext, unlocked on the first user tap. SFX are
   synthesized (no files). Voice clips are pre-rendered mp3s
   (voice/<id>.mp3), fetched + decoded ONCE into AudioBuffers and
   played from memory through the AudioContext — never per-line
   HTMLAudio elements, which old iPads throttle to a crawl.
   Voice rides ONE channel: a new line hard-stops the previous.
   ============================================================ */
const SND = (function(){
  const VOICE_VER = "1";                 // bump when clips are re-rendered
  let ctx=null, master=null, sfxGain=null, voiceGain=null, muted=false;
  const bufs={};                         // url -> AudioBuffer | Promise
  let curVoice=null, voiceToken=0;

  function unlock(){
    if(!ctx){
      const AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value=0.9; master.connect(ctx.destination);
      sfxGain = ctx.createGain(); sfxGain.gain.value=0.85; sfxGain.connect(master);
      voiceGain = ctx.createGain(); voiceGain.gain.value=1.0; voiceGain.connect(master);
    }
    if(ctx && ctx.state!=="running"){ try{ctx.resume();}catch(e){} }
  }
  // iOS suspends the context aggressively; resume on any gesture / tab return.
  function ensure(){ if(ctx && ctx.state!=="running"){ try{ctx.resume();}catch(e){} } }
  if(typeof document!=="undefined"){
    document.addEventListener("visibilitychange",()=>{ if(!document.hidden) ensure(); });
    document.addEventListener("pointerdown",ensure,true);
  }

  // ---------- synthesized SFX ----------
  function tone(freq,dur,type,vol,slideTo,when){
    if(!ctx||muted) return;
    const t=(ctx.currentTime)+(when||0);
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type=type||"sine"; o.frequency.setValueAtTime(freq,t);
    if(slideTo) o.frequency.exponentialRampToValueAtTime(slideTo,t+dur);
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(vol||0.3,t+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t+dur+0.03);
  }
  function noise(dur,vol,lp,when){
    if(!ctx||muted) return;
    const t=ctx.currentTime+(when||0);
    const n=Math.floor(ctx.sampleRate*dur), buf=ctx.createBuffer(1,n,ctx.sampleRate), d=buf.getChannelData(0);
    for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*(1-i/n);
    const s=ctx.createBufferSource(), g=ctx.createGain();
    s.buffer=buf; g.gain.value=vol||0.2;
    if(lp){ const f=ctx.createBiquadFilter(); f.type="lowpass"; f.frequency.value=lp; s.connect(f); f.connect(g); }
    else s.connect(g);
    g.connect(sfxGain); s.start(t);
  }
  const arp=(notes,step,dur,type,vol)=>notes.forEach((f,i)=>tone(f,dur||0.16,type||"triangle",vol||0.26,null,i*(step||0.09)));

  const SFX = {
    click:    ()=>tone(660,0.05,"square",0.14,520),
    deploy:   ()=>{ tone(420,0.09,"square",0.2,720); noise(0.12,0.12,1200); },
    hit:      ()=>{ tone(240,0.06,"triangle",0.16,150); noise(0.05,0.1,1600); },
    bighit:   ()=>{ tone(150,0.12,"sine",0.32,70); noise(0.08,0.2,800); },
    crit:     ()=>{ tone(900,0.08,"square",0.3,1500); tone(1300,0.12,"square",0.22,1900,null,0.04); noise(0.06,0.16); },
    boom:     ()=>{ tone(120,0.22,"sine",0.4,45); noise(0.22,0.3,500); tone(300,0.1,"sawtooth",0.2,60); },
    barrier:  ()=>{ tone(1200,0.14,"sine",0.22,500); noise(0.12,0.16,3000); },
    shield:   ()=>{ tone(700,0.1,"sine",0.2,1400); tone(1000,0.14,"sine",0.16,1800,null,0.05); },
    report:   ()=>{ arp([523,440,659,880],0.07,0.14,"square",0.24); noise(0.18,0.14,2000); },
    coin:     ()=>tone(1320,0.08,"sine",0.14,1760),
    walletup: ()=>arp([523,659,784],0.07,0.13,"sine",0.22),
    levelup:  ()=>arp([523,659,784,1046,1318],0.08,0.16,"triangle",0.26),
    unlock:   ()=>arp([392,523,659,784,1046],0.09,0.18,"triangle",0.28),
    warp:     ()=>{ tone(200,0.18,"sawtooth",0.22,1400); noise(0.14,0.12,3000); },
    boss:     ()=>{ tone(80,0.5,"sawtooth",0.34,55); tone(120,0.5,"square",0.18,90); noise(0.4,0.18,300); },
    powerup:  ()=>{ tone(330,0.5,"sawtooth",0.26,1320); arp([659,880,1046,1318,1760],0.07,0.18,"triangle",0.24); },
    towerhit: ()=>{ tone(90,0.16,"sine",0.34,50); noise(0.1,0.22,500); },
    win:      ()=>arp([523,659,784,1046,1318,1568],0.11,0.26,"triangle",0.3),
    lose:     ()=>arp([523,440,349,262],0.16,0.3,"sawtooth",0.26),
    capsule:  ()=>{ tone(880,0.06,"square",0.16,1200); tone(660,0.06,"square",0.16,900,null,0.08); },
    reveal:   ()=>arp([784,1046,1318,1760,2093],0.06,0.16,"sine",0.26),
  };
  let lastHit=0;
  function sfx(name){
    if(!ctx||muted) return;
    // throttle the high-frequency combat blips so a big melee doesn't buzz
    if(name==="hit"||name==="deploy"){ const n=performance.now(); if(n-lastHit<55) return; lastHit=n; }
    if(SFX[name]) SFX[name]();
  }

  // ---------- voice clips ----------
  function loadClip(url){
    if(!ctx) return Promise.resolve(null);
    if(bufs[url] && bufs[url].duration!==undefined) return Promise.resolve(bufs[url]);
    if(bufs[url] && bufs[url].then) return bufs[url];
    const p = fetch(url).then(r=>{ if(!r.ok) throw 0; return r.arrayBuffer(); })
      .then(ab=>new Promise((res,rej)=>ctx.decodeAudioData(ab,res,rej)))
      .then(b=>{ bufs[url]=b; return b; })
      .catch(()=>{ bufs[url]=null; return null; });
    bufs[url]=p; return p;
  }
  const vurl = id => (window.VOICE_DIR||"voice/")+id+".mp3?v="+VOICE_VER;
  function preload(ids){
    if(!ctx) return Promise.resolve();
    return Promise.all((ids||[]).map(id=>loadClip(vurl(id))));
  }
  function stopVoice(){ if(curVoice){ try{ curVoice.onended=null; curVoice.stop(); }catch(e){} curVoice=null; } }
  // voice(id) -> Promise that resolves when the clip finishes (or is cut off).
  function voice(id){
    voiceToken++; const token=voiceToken;
    stopVoice();
    if(!ctx||muted) return Promise.resolve();
    ensure();
    return loadClip(vurl(id)).then(buf=>new Promise(resolve=>{
      if(token!==voiceToken||muted||!buf){ return resolve(); }
      stopVoice();
      const src=ctx.createBufferSource();
      src.buffer=buf; src.connect(voiceGain);
      src.onended=()=>{ if(curVoice===src) curVoice=null; resolve(); };
      curVoice=src;
      try{ src.start(0); }catch(e){ return resolve(); }
      setTimeout(resolve, buf.duration*1000+800);   // safety net
    }));
  }

  function setMuted(m){ muted=!!m; if(muted){ stopVoice(); } else ensure(); }

  return { unlock, sfx, voice, preload, stopVoice, setMuted,
           isMuted:()=>muted, ready:()=>!!ctx };
})();
