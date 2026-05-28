// もじ アタック — Letter Attack.
//
// A fast arcade hit-the-kaiju game built ON TOP of KJB's assets (monster
// SVGs, voices, themes) — it never modifies KJB. A random kaiju appears;
// you spell a 3-letter word (phonics) or build a sentence from word tiles.
// TAP a tile to hear it (letter = phonics SOUND, word = pronunciation);
// FLICK it at the kaiju to attack. Each correct hit blows a body part off
// (explosion + hit-zoom). Finish the word/sentence and the kaiju fully
// explodes — next kaiju. A wrong hit is fired back and cracks the screen;
// 3 cracks ends the run.
//
// Reuses: js/monsters.js (boss art), shared/audio.js (SND), shared/
// boss-art.js (ART), sentence-flappy's window.SENTENCES bank.

(function () {
  "use strict";
  const SND = window.GamesAudio;
  const ART = window.GamesArt;
  const $ = (id) => document.getElementById(id);
  const SENTENCES = window.SENTENCES || {};
  const PHONICS = window.LA_PHONICS || {};
  const WORDS = window.LA_WORDS || { byVowel: {}, all: [] };

  const BOSS_IDS = ["tako", "unko", "tral", "pamp", "parfait", "anpan", "temee", "catcherski"];
  const EMOJI = { tako:"🐙", unko:"💩", tral:"🐟", pamp:"🧸", parfait:"🍦", anpan:"🍞", temee:"🐫", catcherski:"🎮" };

  function show(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    const el = $("screen-" + id);
    if (el) el.classList.remove("hidden");
  }
  function rand(arr) { return arr[(Math.random() * arr.length) | 0]; }
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = (Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; }
    return a;
  }
  function tokenize(s) { return String(s || "").trim().split(/\s+/).filter(Boolean); }

  // ---- AUDIO WRAPPERS ----
  function speakPhonics(letter) {
    const p = PHONICS[letter] || { say: letter };
    SND.tryOpus(`../../assets/audio/phonics/${encodeURIComponent(letter)}.opus`, p.say,
                { lang: "en-US", rate: 0.85, volume: 1.0 });
  }
  // English audio is intentionally a CLEAR en-US voice (the generic
  // AnaNeural pack) rather than the per-kaiju voices. Several of those
  // (the *Multilingual* voices — Andrew/Ava/Emma) render English with a
  // foreign accent ("I wear a hat" -> "EE veer a hot"), which is wrong for
  // a pronunciation-teaching game. The kaiju still get their Japanese
  // character voice for spawn taunts (playBossLine) — that's a JP line.
  function speakWord(word) { SND.speakEn(word, { volume: 1.0 }); }
  function speakEnglish(text) { SND.speakEn(text, { volume: 1.0 }); }

  // Theme song: a brief low STING when a kaiju pops in, then it fades out
  // — NOT constant background (that buried the English words/sounds). The
  // mp3s are full songs, so we explicitly fade + stop after a few seconds.
  let _themeAudio = null, _themeStopT = 0, _themeFadeIv = 0;
  function playTheme(bossId) {
    stopTheme();
    if (!bossId) return;
    const suffix = Math.random() < 0.5 ? "_shiny" : "";
    try {
      const a = new Audio(`../../assets/themes/${encodeURIComponent(bossId + suffix)}.mp3`);
      a.volume = 0.16; a.loop = false;
      const p = a.play(); if (p && p.catch) p.catch(() => {});
      _themeAudio = a;
      _themeStopT = setTimeout(fadeTheme, 2600);   // play a couple seconds, then fade
    } catch (_) { _themeAudio = null; }
  }
  function fadeTheme() {
    const a = _themeAudio;
    if (!a) return;
    _themeFadeIv = setInterval(() => {
      if (!_themeAudio) { clearInterval(_themeFadeIv); _themeFadeIv = 0; return; }
      a.volume = Math.max(0, a.volume - 0.02);
      if (a.volume <= 0.001) stopTheme();
    }, 55);
  }
  function stopTheme() {
    if (_themeStopT) { clearTimeout(_themeStopT); _themeStopT = 0; }
    if (_themeFadeIv) { clearInterval(_themeFadeIv); _themeFadeIv = 0; }
    if (_themeAudio) { try { _themeAudio.pause(); _themeAudio.currentTime = 0; } catch (_) {} _themeAudio = null; }
  }
  let _lastVoiceAt = 0;
  function playKaijuLine(bossId, cats, minGapMs) {
    const now = performance.now();
    if (now - _lastVoiceAt < (minGapMs ?? 1500)) return;
    const taunts = (window.JP && window.JP.bosses && window.JP.bosses[bossId] && window.JP.bosses[bossId].taunts) || null;
    if (!taunts) return;
    for (const c of cats) {
      const pool = taunts[c];
      if (pool && pool.length) {
        SND.playBossLine(bossId, rand(pool), { volume: 0.85 });
        _lastVoiceAt = now;
        return;
      }
    }
  }

  // ---- STATE ----
  const State = {
    mode: "spell",       // "spell" | "sentence"
    level: 0,            // sentence sub-level 1/2/3; 0 for spell
    bossId: null,
    boss: null,
    // spell:
    word: "",
    letterIdx: 0,
    // sentence:
    sentEn: "",
    sentJp: "",
    words: [],
    wordIdx: 0,
    // run:
    cracks: 0,
    score: 0,
    busy: false,
    over: false,
  };
  const MAX_CRACKS = 3;

  // ---- CANVAS ----
  let cv, ctx, W = 0, H = 0, dpr = 1, raf = 0;
  let bossBox = { x: 0, y: 0, w: 0, h: 0 };
  let bossSpriteImg = null, bossSpriteWrap = null;
  let bossScale = 1, bossScaleVel = 0;     // hit-zoom pulse
  const shake = { until: 0, mag: 0 };
  let screenFlash = null;
  const particles = [];

  function setupCanvas() {
    cv = $("cv");
    ctx = cv.getContext("2d");
    resize();
    window.addEventListener("resize", resize);
  }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.floor(W * dpr); cv.height = Math.floor(H * dpr);
    cv.style.width = W + "px"; cv.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bw = Math.min(W * 0.82, 440);
    const bh = bw * 0.6;
    bossBox = { x: W / 2 - bw / 2, y: Math.max(64, H * 0.20), w: bw, h: bh };
  }
  function bossCenter() { return { x: bossBox.x + bossBox.w / 2, y: bossBox.y + bossBox.h / 2 }; }
  function partScreen(part) {
    const g = part.geom || { x: 400, y: 240 };
    return { x: bossBox.x + (g.x / 800) * bossBox.w, y: bossBox.y + (g.y / 480) * bossBox.h };
  }

  // Render the boss SVG with DEAD parts (hp<=0) omitted, so each broken
  // part visibly disappears. Mirrors Monsters.renderBossSVG but filters.
  function bossSVGPartial(boss) {
    const partsSVG = boss.parts.filter(p => p.hp > 0).map(p => p.draw(p)).join("\n");
    const svg = `<svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;">
      ${boss.bodySVG()}
      ${partsSVG}
    </svg>`;
    return boss.shiny ? `<div class="shiny-boss-svg ${boss.id}" style="width:100%;height:100%;">${svg}</div>` : svg;
  }
  function prepareSprite() {
    return new Promise(resolve => {
      if (bossSpriteWrap) { try { bossSpriteWrap.remove(); } catch (_) {} }
      const wrap = document.createElement("div");
      wrap.style.cssText = "position:fixed;left:-9999px;top:0;width:400px;height:240px;";
      wrap.innerHTML = bossSVGPartial(State.boss);
      document.body.appendChild(wrap);
      bossSpriteWrap = wrap;
      const svg = wrap.querySelector("svg");
      if (!svg) { resolve(); return; }
      const xml = new XMLSerializer().serializeToString(svg);
      const url = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(xml)));
      const img = new Image();
      img.onload = () => { bossSpriteImg = img; resolve(); };
      img.onerror = () => resolve();
      img.src = url;
    });
  }

  // ---- PARTICLES (adapted from sentence-flappy) ----
  function burstExplosion(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 200 + Math.random() * 380;
      particles.push({ type:"boom", x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, gy:320,
        life:700+Math.random()*600, max:1300, color:["#ff3b6b","#ffcc44","#ff6633","#fff"][i%4], size:3+Math.random()*5 });
    }
    particles.push({ type:"ring", x, y, vx:0, vy:0, gy:0, life:320, max:320, color:"#ffe45c", size:6 });
  }
  function burstDebris(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI/2 + (Math.random()-0.5)*2.6;
      const s = 120 + Math.random()*240;
      particles.push({ type:"debris", x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, gy:480,
        rot:Math.random()*6.28, spin:(Math.random()-0.5)*10, life:900+Math.random()*500, max:1400,
        color:["#cca066","#aa6633","#dd9966","#888","#ffe45c"][i%5], size:4+Math.random()*5 });
    }
  }
  function burstSparkle(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random()*Math.PI*2; const s = 120*(0.6+Math.random()*0.7);
      particles.push({ type:"spark", x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, gy:60,
        life:500+Math.random()*300, max:800, color:["#ffe45c","#44eeff","#fff"][i%3], size:1.5+Math.random()*3 });
    }
  }
  function addShake(durMs, mag) {
    const now = performance.now();
    shake.until = Math.max(shake.until, now + durMs);
    shake.mag = Math.max(shake.mag, mag);
  }
  // Punchy zoom-on-hit: snap the scale up immediately (a visible pop)
  // and add velocity so the spring overshoots slightly on the way back.
  function hitZoom(mag) { bossScale = Math.max(bossScale, 1 + mag); bossScaleVel += mag * 0.6; }

  // ---- DRAW LOOP ----
  let lastT = 0;
  function loop(t) {
    const dt = lastT ? Math.min(48, t - lastT) : 16;
    lastT = t;
    update(dt / 1000, t);
    draw(t);
    raf = requestAnimationFrame(loop);
  }
  function update(dt, t) {
    // hit-zoom spring back toward 1
    bossScale += bossScaleVel * dt * 6;
    bossScaleVel += (1 - bossScale) * dt * 60;   // spring
    bossScaleVel *= 0.86;                          // damp
    if (Math.abs(bossScale - 1) < 0.002 && Math.abs(bossScaleVel) < 0.002) { bossScale = 1; bossScaleVel = 0; }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt * 1000;
      if (p.type !== "ring") { p.x += p.vx*dt; p.y += p.vy*dt; p.vy += (p.gy||0)*dt; }
      if (p.spin) p.rot += p.spin*dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    // shake offset
    let sx = 0, sy = 0;
    if (t < shake.until) { const m = shake.mag * (shake.until - t) / 600; sx = (Math.random()-0.5)*m*2; sy = (Math.random()-0.5)*m*2; }
    ctx.save();
    ctx.translate(sx, sy);

    const c = bossCenter();
    // focus glow behind the kaiju
    const grd = ctx.createRadialGradient(c.x, c.y, 10, c.x, c.y, bossBox.w*0.75);
    grd.addColorStop(0, "rgba(255,228,92,0.12)");
    grd.addColorStop(1, "rgba(255,228,92,0)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    // ground shadow
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(c.x, bossBox.y + bossBox.h*0.96, bossBox.w*0.34, 16, 0, 0, Math.PI*2);
    ctx.fill();

    // monster (with hit-zoom)
    if (bossSpriteImg && !State.over) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.scale(bossScale, bossScale);
      ctx.translate(-c.x, -c.y);
      ctx.drawImage(bossSpriteImg, bossBox.x, bossBox.y, bossBox.w, bossBox.h);
      ctx.restore();
    }

    // particles
    for (const p of particles) {
      const a = Math.max(0, p.life / p.max);
      ctx.globalAlpha = a;
      if (p.type === "ring") {
        const r = (1 - a) * 120 + 6;
        ctx.strokeStyle = p.color; ctx.lineWidth = 4 * a + 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI*2); ctx.stroke();
      } else if (p.type === "debris") {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot || 0);
        ctx.fillStyle = p.color; ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size*1.4); ctx.restore();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    if (screenFlash && t < screenFlash.until) {
      ctx.fillStyle = screenFlash.color; ctx.fillRect(0, 0, W, H);
    }
  }

  // ---- RUN FLOW ----
  function startRun(mode, level) {
    State.mode = mode; State.level = level;
    State.cracks = 0; State.score = 0; State.over = false; State.busy = false;
    particles.length = 0; lastT = 0;
    show("game");
    renderCracks(); renderScore();
    if (!raf) raf = requestAnimationFrame(loop);
    setTimeout(() => resize(), 0);   // ensure dims after screen visible
    spawnMonster();
  }

  function freshBoss(bossId) {
    // Fresh instance — safe to mutate part hp without polluting the cache.
    // (No shiny here: the shiny look is a CSS filter on the wrapper div,
    // which is lost when we rasterize just the inner <svg>, and its HP buff
    // is irrelevant since we break parts directly.)
    return ART.get(bossId, true);
  }

  function spawnMonster() {
    State.bossId = rand(BOSS_IDS);
    State.boss = freshBoss(State.bossId);
    bossScale = 1; bossScaleVel = 0;

    // pick the target
    if (State.mode === "spell") {
      State.word = rand(WORDS.all);
      State.letterIdx = 0;
    } else {
      const s = pickSentence(State.bossId, State.level);
      State.sentEn = s.en; State.sentJp = s.jp;
      State.words = tokenize(s.en); State.wordIdx = 0;
    }

    prepareSprite().then(() => {
      renderPrompt();
      buildChoices();
      bannerSpawn();
      playTheme(State.bossId);
      playKaijuLine(State.bossId, ["healthy", "slingshot"], 0);
      // model the target audio a beat AFTER the spawn taunt so they don't clash
      if (State.mode === "spell") {
        setTimeout(() => speakWord(State.word), 950);
      } else if (State.level === 1) {
        setTimeout(() => speakEnglish(State.sentEn), 950);
      }
    });
  }

  // Sentence pools: easy=level1 pool, medium/hard=level2 pool. Hard biases
  // to the longest sentences. Falls back gracefully if a pool is thin.
  function pickSentence(bossId, level) {
    const pools = SENTENCES[bossId] || {};
    let pool = (level === 1 ? pools[1] : pools[2]) || pools[1] || pools[0] || [];
    pool = pool.filter(s => tokenize(typeof s === "string" ? s : s.en).length >= 2);
    if (!pool.length) return { en: "I am a kaiju.", jp: "わたし は カイジュウ。" };
    if (level === 3) {
      // hard — prefer the longer sentences
      const sorted = [...pool].sort((a,b) => tokenize((b.en||b)).length - tokenize((a.en||a)).length);
      pool = sorted.slice(0, Math.max(3, Math.ceil(sorted.length * 0.5)));
    }
    const s = rand(pool);
    return typeof s === "string" ? { en: s, jp: "" } : s;
  }

  // ---- PROMPT (HUD) ----
  function renderPrompt() {
    const isSpell = State.mode === "spell";
    $("word-slots").style.display = isSpell ? "flex" : "none";
    $("sent-jp").style.display = isSpell ? "none" : "block";
    $("sent-built").style.display = isSpell ? "none" : "block";
    $("btn-hear").style.display = "inline-block";
    if (isSpell) {
      $("prompt-lbl").textContent = "スペル しよう";
      const slots = $("word-slots");
      slots.innerHTML = "";
      [...State.word].forEach((ch, i) => {
        const d = document.createElement("div");
        d.className = "la-slot" + (i < State.letterIdx ? " done" : (i === State.letterIdx ? " next" : ""));
        d.textContent = i < State.letterIdx ? ch : "";
        slots.appendChild(d);
      });
    } else {
      $("prompt-lbl").textContent = "ぶん を つくろう";
      $("sent-jp").textContent = State.sentJp || "（" + State.sentEn + "）";
      const built = State.words.map((w, i) => i < State.wordIdx
        ? `<span>${w}</span>` : `<span class="blank">＿</span>`).join(" ");
      $("sent-built").innerHTML = built;
    }
  }

  // ---- CHOICES / TRAY ----
  function buildChoices() {
    const tray = $("tray");
    tray.innerHTML = "";
    let tiles;   // [{label, value, correct, kind}]
    if (State.mode === "spell") {
      const correct = State.word[State.letterIdx];
      const others = [];
      const pool = "abcdefghijklmnopqrstuvwxyz".split("").filter(l => l !== correct);
      shuffle(pool);
      for (const l of pool) { if (others.length >= 2) break; others.push(l); }
      tiles = shuffle([{ label: correct, value: correct, correct: true, kind: "letter" },
                       ...others.map(l => ({ label: l, value: l, correct: false, kind: "letter" }))]);
    } else {
      const correct = State.words[State.wordIdx];
      const count = (State.level === 1) ? 3 : 4;
      // distractor pool: words from this sentence + other sentences for the boss
      const bag = new Set();
      State.words.forEach(w => bag.add(w));
      const pools = SENTENCES[State.bossId] || {};
      Object.values(pools).forEach(arr => (arr || []).forEach(s => tokenize(s.en || s).forEach(w => bag.add(w))));
      const distract = [...bag].filter(w => w !== correct);
      shuffle(distract);
      const chosen = distract.slice(0, count - 1);
      tiles = shuffle([{ label: correct, value: correct, correct: true, kind: "word" },
                       ...chosen.map(w => ({ label: w, value: w, correct: false, kind: "word" }))]);
    }
    tiles.forEach(t => tray.appendChild(makeTile(t)));
  }

  function makeTile(t) {
    const el = document.createElement("div");
    el.className = "la-tile " + t.kind;
    el.textContent = t.label;
    el.dataset.correct = t.correct ? "1" : "0";
    el.dataset.value = t.value;
    el.dataset.kind = t.kind;
    attachTileInput(el);
    return el;
  }

  // Tap = speak; flick/drag-release = throw at the kaiju.
  function attachTileInput(el) {
    let down = null;
    el.addEventListener("pointerdown", (e) => {
      if (State.busy || State.over) return;
      down = { x: e.clientX, y: e.clientY, t: performance.now() };
      el.setPointerCapture(e.pointerId);
      el.classList.add("dragging");
    });
    el.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    el.addEventListener("pointerup", (e) => {
      if (!down) return;
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      const dist = Math.hypot(dx, dy);
      el.classList.remove("dragging");
      down = null;
      try { el.releasePointerCapture(e.pointerId); } catch (_) {}
      if (dist < 14) {
        // TAP (barely moved) — read it aloud, snap back home
        el.style.transform = "";
        if (el.dataset.kind === "letter") speakPhonics(el.dataset.value);
        else speakEnglish(el.dataset.value.replace(/[.,!?;:]+$/, ""));
      } else {
        // FLICK — throw from wherever the finger released
        throwTile(el);
      }
    });
    el.addEventListener("pointercancel", () => { if (down) { el.classList.remove("dragging"); el.style.transform=""; down=null; } });
  }

  function throwTile(el) {
    if (State.busy || State.over) return;
    State.busy = true;
    SND.sfxPop && SND.sfxPop();
    $("la-tip").style.display = "none";
    const r = el.getBoundingClientRect();
    const fly = el.cloneNode(true);
    fly.classList.add("flying");
    fly.style.left = r.left + "px"; fly.style.top = r.top + "px";
    fly.style.width = r.width + "px"; fly.style.height = r.height + "px"; fly.style.margin = "0";
    document.body.appendChild(fly);
    el.style.visibility = "hidden";   // hide the original while its clone flies
    const tgt = bossCenter();
    const sx = r.left + r.width/2, sy = r.top + r.height/2;
    const dx = tgt.x - sx, dy = tgt.y - sy;
    // dim the tray during flight
    $("tray").style.opacity = "0.4";
    const anim = fly.animate([
      { transform: "translate(0,0) rotate(0) scale(1)", opacity: 1 },
      { transform: `translate(${dx*0.5}px, ${dy*0.5 - 50}px) rotate(220deg) scale(0.85)`, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) rotate(420deg) scale(0.45)`, opacity: 0.9 }
    ], { duration: 250, easing: "cubic-bezier(.45,.05,.85,.45)" });
    anim.onfinish = () => {
      try { fly.remove(); } catch (_) {}
      $("tray").style.opacity = "1";
      const correct = el.dataset.correct === "1";
      if (correct) onCorrect(); else onWrong();
    };
  }

  // ---- HIT RESOLUTION ----
  function aliveNonCore() { return State.boss.parts.filter(p => p.hp > 0 && p.effect !== "win"); }

  function breakOnePart() {
    const parts = aliveNonCore();
    let at = bossCenter();
    if (parts.length) {
      const part = parts[0];
      part.hp = 0;
      at = partScreen(part);
    }
    burstExplosion(at.x, at.y, 26);
    burstDebris(at.x, at.y, 18);
    addShake(220, 11);
    hitZoom(0.14);
    SND.sfxCorrect && SND.sfxCorrect();
    return prepareSprite();
  }

  function onCorrect() {
    if (State.over) return;
    let complete = false;
    if (State.mode === "spell") {
      State.letterIdx++;
      complete = State.letterIdx >= State.word.length;
    } else {
      State.wordIdx++;
      complete = State.wordIdx >= State.words.length;
    }
    renderPrompt();
    if (complete) {
      monsterDefeated();
    } else {
      breakOnePart().then(() => {
        burstSparkle(bossCenter().x, bossCenter().y, 10);
        State.busy = false;
        buildChoices();
      });
    }
  }

  function monsterDefeated() {
    const c = bossCenter();
    // blow off everything that's left
    State.boss.parts.forEach(p => p.hp = 0);
    flash("💥 BOOM!");
    burstExplosion(c.x, c.y, 110);
    setTimeout(() => burstExplosion(c.x, c.y, 80), 130);
    setTimeout(() => burstExplosion(c.x, c.y, 60), 270);
    burstDebris(c.x, c.y, 40);
    addShake(700, 26);
    hitZoom(0.28);
    screenFlash = { color: "rgba(255,180,40,0.5)", until: performance.now() + 260 };
    bossSpriteImg = null;   // hide the corpse immediately
    SND.sfxLevel && SND.sfxLevel();
    playKaijuLine(State.bossId, ["desperate", "hurt"], 0);
    stopTheme();
    State.score++;
    renderScore();
    $("tray").innerHTML = "";
    setTimeout(() => { if (!State.over) spawnMonster(); State.busy = false; }, 1050);
  }

  function onWrong() {
    if (State.over) return;
    // kaiju fires it back
    const c = bossCenter();
    burstSparkle(c.x, c.y, 6);
    playKaijuLine(State.bossId, ["healthy", "high_combo"], 0);
    SND.sfxWrong && SND.sfxWrong();
    returnFire(() => {
      State.cracks++;
      addCrack();
      renderCracks();
      if (State.cracks >= MAX_CRACKS) {
        gameOver();
      } else {
        State.busy = false;
        buildChoices();
      }
    });
  }

  // animate a "bolt" from the kaiju to a random screen point, then crack
  function returnFire(done) {
    const c = bossCenter();
    const bolt = document.createElement("div");
    bolt.textContent = "💢";
    bolt.style.cssText = `position:fixed;left:${c.x}px;top:${c.y}px;font-size:46px;z-index:210;pointer-events:none;`;
    document.body.appendChild(bolt);
    const tx = (0.2 + Math.random()*0.6) * W - c.x;
    const ty = (0.55 + Math.random()*0.35) * H - c.y;
    const anim = bolt.animate([
      { transform: "translate(0,0) scale(0.5)", opacity: 0.4 },
      { transform: `translate(${tx*0.5}px, ${ty*0.5}px) scale(1.2)`, opacity: 1, offset: 0.6 },
      { transform: `translate(${tx}px, ${ty}px) scale(0.8)`, opacity: 1 }
    ], { duration: 300, easing: "ease-in" });
    anim.onfinish = () => { try { bolt.remove(); } catch (_) {} done(); };
  }

  // ---- SCREEN CRACKS ----
  function addCrack() {
    const overlay = $("crack");
    let svg = overlay.querySelector("svg");
    if (!svg) {
      svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.setAttribute("preserveAspectRatio", "none");
      overlay.appendChild(svg);
    }
    overlay.style.opacity = "1";
    // origin: random edge point heading toward a random interior point
    const edges = [
      { x: Math.random()*W, y: 0 }, { x: Math.random()*W, y: H },
      { x: 0, y: Math.random()*H }, { x: W, y: Math.random()*H },
    ];
    const start = rand(edges);
    const cx = W*(0.3+Math.random()*0.4), cy = H*(0.3+Math.random()*0.4);
    function jagged(x0, y0, x1, y1, segs) {
      let d = `M ${x0.toFixed(0)} ${y0.toFixed(0)}`;
      for (let i = 1; i <= segs; i++) {
        const f = i/segs;
        const jx = (Math.random()-0.5) * 40, jy = (Math.random()-0.5) * 40;
        d += ` L ${(x0 + (x1-x0)*f + jx).toFixed(0)} ${(y0 + (y1-y0)*f + jy).toFixed(0)}`;
      }
      return d;
    }
    const mk = (d, w, col) => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.setAttribute("stroke", col);
      path.setAttribute("stroke-width", w);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke-linecap", "round");
      svg.appendChild(path);
    };
    const main = jagged(start.x, start.y, cx, cy, 7);
    mk(main, 4, "rgba(255,255,255,0.85)");
    mk(main, 1.5, "rgba(120,200,255,0.9)");
    // a couple of branches
    for (let b = 0; b < 2; b++) {
      const bx = cx + (Math.random()-0.5)*W*0.4, by = cy + (Math.random()-0.5)*H*0.4;
      const br = jagged(cx, cy, bx, by, 5);
      mk(br, 3, "rgba(255,255,255,0.7)");
    }
    addShake(360, 16);
    screenFlash = { color: "rgba(255,40,40,0.35)", until: performance.now() + 200 };
  }

  function flash(text) {
    const c = bossCenter();
    const el = document.createElement("div");
    el.textContent = text;
    el.style.cssText = `position:fixed;left:${c.x}px;top:${c.y - 30}px;transform:translate(-50%,-50%);
      font-size:44px;font-weight:900;color:#ff3b6b;text-shadow:0 3px 0 #000,0 0 18px rgba(255,60,60,.7);
      z-index:220;pointer-events:none;letter-spacing:2px;`;
    document.body.appendChild(el);
    el.animate([{ transform:"translate(-50%,-50%) scale(0.4)", opacity:0 },
                { transform:"translate(-50%,-50%) scale(1.2)", opacity:1, offset:0.3 },
                { transform:"translate(-50%,-120%) scale(1)", opacity:0 }],
               { duration: 1000, easing:"ease-out" });
    setTimeout(() => { try { el.remove(); } catch (_) {} }, 1050);
  }

  // ---- HUD bits ----
  function renderCracks() {
    const el = $("cracks");
    let h = "";
    for (let i = 0; i < MAX_CRACKS; i++) h += `<span class="heart${i < State.cracks ? " lost" : ""}">${i < State.cracks ? "💔" : "❤️"}</span>`;
    el.innerHTML = h;
  }
  function renderScore() { $("score").textContent = "たおした: " + State.score; }

  function bannerSpawn() {
    const old = document.querySelector(".la-spawn");
    if (old) old.remove();
    const b = State.boss;
    const el = document.createElement("div");
    el.className = "la-spawn";
    el.innerHTML = `<div class="sp-jp">${EMOJI[State.bossId] || "👾"} ${(b && b.name_jp) || State.bossId} あらわれた！</div>
                    <div class="sp-en">${(b && b.name_en) || ""}</div>`;
    $("screen-game").appendChild(el);
    setTimeout(() => { try { el.remove(); } catch (_) {} }, 1500);
  }

  // ---- GAME OVER ----
  function gameOver() {
    State.over = true;
    State.busy = true;
    stopTheme();
    const overlay = $("crack");
    overlay.classList.add("shatter");
    SND.sfxFail && SND.sfxFail();
    setTimeout(() => {
      overlay.classList.remove("shatter");
      overlay.style.opacity = "0";
      const svg = overlay.querySelector("svg"); if (svg) svg.remove();
      $("over-score").textContent = String(State.score);
      const art = $("over-art");
      if (State.boss) art.innerHTML = ART.renderById(State.bossId) || "";
      // best score per mode/level
      const key = `la_best_${State.mode}_${State.level}`;
      let best = 0; try { best = parseInt(localStorage.getItem(key) || "0", 10) || 0; } catch (_) {}
      if (State.score > best) { best = State.score; try { localStorage.setItem(key, String(best)); } catch (_) {} }
      $("over-best").textContent = "ベスト: " + best;
      show("over");
    }, 720);
  }

  function quitToMenu() {
    State.over = true; State.busy = true;
    stopTheme();
    const overlay = $("crack"); overlay.style.opacity = "0";
    const svg = overlay.querySelector("svg"); if (svg) svg.remove();
    particles.length = 0;
    show("title");
  }

  // ---- WIRING ----
  function init() {
    setupCanvas();
    // title cast strip
    const cast = $("la-cast");
    if (cast) cast.innerHTML = BOSS_IDS.map(id => EMOJI[id]).join(" ");
    document.querySelectorAll(".mode-pick button").forEach(btn => {
      btn.addEventListener("click", () => {
        SND.sfxConfirm && SND.sfxConfirm();
        startRun(btn.dataset.mode, parseInt(btn.dataset.lv, 10));
      });
    });
    $("btn-quit").addEventListener("click", () => { SND.sfxPop && SND.sfxPop(); quitToMenu(); });
    $("btn-hear").addEventListener("click", () => {
      if (State.mode === "spell") speakWord(State.word);
      else speakEnglish(State.sentEn);
    });
    $("over-again").addEventListener("click", () => { SND.sfxConfirm && SND.sfxConfirm(); startRun(State.mode, State.level); });
    $("over-menu").addEventListener("click", () => { SND.sfxPop && SND.sfxPop(); show("title"); });
    $("over-home").addEventListener("click", () => { window.location.href = "../index.html"; });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
