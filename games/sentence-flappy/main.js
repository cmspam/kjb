// ぶんぽう フラッピー — Sentence Flappy (polish pass v5)
//
// Flying-shooter / word-collector. Kid steers a kaiju through scrolling
// space, dodging pipes AND collecting English-word tokens in the correct
// sentence order. Tokens spawn at ANY screen Y (not just between pipes)
// so dodging + collecting are simultaneous skills.
//
// Failure model is the body-parts cascade (user's request):
//   - Kaiju has 5 body parts visible in the HUD (limbs, eyes, mouth)
//   - Each wrong word destroys one part (visible on the sprite)
//   - Pipe crash = instant death (no body-part discount)
//   - When all 5 parts are broken, the CORE (heart) takes the next hit
//
// Polish layer (v5):
//   - Particle bursts (correct pickup = sparkles, break = feathers,
//     core hit = explosion, win = celebration shower)
//   - Screen shake at three intensities (light/medium/heavy)
//   - Hit-pause: 70ms freeze on big events for impact weight
//   - Combo meter — chain correct picks, audio pitch climbs, big text
//   - Magnetic pickup — correct-word tokens within range pull toward kaiju
//   - Trail behind kaiju + scale-tilt on flap (game-feel basics)
//   - Two-layer parallax stars + drifting foreground silhouettes
//   - Color-flash overlay on wrong/right + crash
//   - Win cinematic: words light up one-by-one with audio + boss bounce

(function () {
  const SND = window.GamesAudio;
  const ART = window.GamesArt;
  const SENTENCES = window.SENTENCES;

  // ---- LEVEL CONFIG ----
  const LEVEL_TUNING = {
    0: { speed: 130, gravity: 700, flap: -310, pipeGap: 0.46, pipeRate: 4200, tokenRate: 1600, pipeStyle: "cloud", parts: 5 },
    1: { speed: 170, gravity: 850, flap: -360, pipeGap: 0.36, pipeRate: 3600, tokenRate: 1500, pipeStyle: "pipe",  parts: 5 },
    2: { speed: 210, gravity: 950, flap: -390, pipeGap: 0.30, pipeRate: 3100, tokenRate: 1400, pipeStyle: "pipe",  parts: 5 },
  };

  const KAIJU_BY_LEVEL = {
    0: ["tako", "pamp", "parfait", "tral"],
    1: ["tako", "unko", "tral", "pamp", "parfait", "anpan", "temee", "catcherski"],
    2: ["tako", "unko", "tral", "pamp", "parfait", "anpan", "temee", "catcherski"],
  };

  // JP gloss table (for the HUD line below the English). Only most-
  // common sentence-prefix words; longer / rarer words gloss only at
  // the win screen.
  const QUICK_JP = {
    "I":"わたし", "am":"です", "is":"です", "are":"です", "the":"その",
    "an":"ひとつの(あ)", "a":"ひとつの", "have":"もつ", "has":"もつ",
    "and":"そして", "but":"でも", "from":"〜から", "in":"〜の中",
    "on":"〜の上", "at":"〜で", "to":"〜へ", "with":"〜と",
    "my":"わたしの", "your":"あなたの", "his":"かれの", "her":"かのじょの",
    "He":"かれ", "She":"かのじょ", "It":"それ", "you":"あなた",
    "me":"わたし", "us":"わたしたち", "we":"わたしたち", "they":"かれら",
    "very":"とても", "too":"も", "also":"も",
  };

  const $ = (id) => document.getElementById(id);
  const screens = ["title", "pick", "game", "win", "lose"];
  function show(id) { screens.forEach(s => $("screen-" + s).classList.toggle("hidden", s !== id)); }

  const State = {
    level: 0,
    bossId: null,
    boss: null,
    sentence: "",
    tokens: [],
    progress: 0,
    parts: [],
    coreHits: 0,
    pickupsCorrect: 0,
    pickupsWrong: 0,
    combo: 0,        // current streak of correct pickups
    comboMax: 0,
    sessionStartT: 0,
  };

  // ---- TITLE / PICK ----
  document.querySelectorAll(".level-pick button").forEach(btn => {
    btn.addEventListener("click", () => {
      State.level = parseInt(btn.dataset.lv, 10);
      SND.sfxConfirm();
      buildPickGrid();
      show("pick");
    });
  });
  $("pick-back").addEventListener("click", () => { SND.sfxPop(); show("title"); });

  function buildPickGrid() {
    const grid = $("pick-grid"); grid.innerHTML = "";
    const ids = KAIJU_BY_LEVEL[State.level];
    const m = loadMastery();
    ids.forEach(id => {
      const boss = ART.get(id, true);
      if (!boss) return;
      const div = document.createElement("button");
      div.className = "pick-card";
      const pool = SENTENCES[id][State.level] || [];
      const cleared = (m[id] && m[id].flappy && m[id].flappy[String(State.level)]) || [];
      const total = pool.length;
      const done = cleared.length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      div.innerHTML = `
        <div class="sv">${ART.renderSVG(boss)}</div>
        <div class="name">${boss.name_jp || id}</div>
        <div style="font-size:11px;color:var(--ink-dim);margin-top:2px;">${done}/${total} (${pct}%)</div>
      `;
      div.addEventListener("click", () => startGame(id));
      grid.appendChild(div);
    });
  }

  function tokenize(s) { return s.split(/\s+/).filter(Boolean); }
  function pureWord(tok) { return tok.replace(/[.,!?;:]+$/g, "").replace(/^[.,!?;:]+/g, ""); }
  function jpHint(line) {
    return line.split(/\s+/).filter(Boolean).map(t => {
      const p = pureWord(t);
      return QUICK_JP[p] || QUICK_JP[p.toLowerCase()] || "";
    }).filter(Boolean).join(" · ");
  }

  function startGame(bossId) {
    SND.sfxLevel();
    State.bossId = bossId;
    State.boss = ART.get(bossId, true);
    // ~1-in-7 chance the kaiju spawns shiny — uses KJB's existing
    // shiny art (Mongolian hat for Temee, etc). Rare visual variety
    // that rewards repeat play. The kaiju's shiny voice lines aren't
    // hooked here since flappy uses generic en-US speakers — visual
    // only.
    State.isShiny = Math.random() < 0.14;
    if (State.isShiny && window.Monsters && Monsters.applyShiny) {
      try { Monsters.applyShiny(State.boss); } catch (_) { State.isShiny = false; }
    }
    const pool = SENTENCES[bossId][State.level];
    const picked = pool[(Math.random() * pool.length) | 0];
    if (typeof picked === "string") {
      State.sentence = picked;
      State.sentenceJp = "";
    } else {
      State.sentence = picked.en;
      State.sentenceJp = picked.jp || "";
    }
    State.tokens = tokenize(State.sentence);
    State.progress = 0;
    State.pickupsCorrect = 0;
    State.pickupsWrong = 0;
    State.combo = 0;
    State.comboMax = 0;
    State.parts = buildBodyParts(State.boss);
    State.coreHits = 0;
    State.sessionStartT = performance.now();
    renderHUD();
    show("game");

    let hinted = false;
    function killHint() { if (!hinted) { hinted = true; $("tap-hint").style.display = "none"; } }
    document.addEventListener("pointerdown", killHint, { once: true });
    setupCanvas();
    runGame();
  }

  function buildBodyParts(boss) {
    const parts = [];
    if (boss && boss.parts) {
      boss.parts.forEach(p => {
        if (p.effect === "win") return;
        parts.push({ id: p.id, name_jp: p.name_jp, icon: pickPartIcon(p), broken: false, ref: p });
      });
    }
    while (parts.length < 5) {
      parts.push({ id: "pad" + parts.length, name_jp: "?", icon: "🛡", broken: false, ref: null });
    }
    return parts.slice(0, 5);
  }
  function pickPartIcon(p) {
    if (!p) return "🛡";
    if (p.type === "eye" || p.id.startsWith("e")) return "👁";
    if (p.type === "mouth") return "👄";
    if (p.id && p.id.toLowerCase().includes("tail")) return "🐍";
    if (p.id && p.id.toLowerCase().includes("hump")) return "🐫";
    if (p.id && p.id.toLowerCase().includes("mane")) return "🦁";
    if (p.id && p.id.toLowerCase().includes("claw")) return "🦞";
    if (p.id && p.id.toLowerCase().includes("ant")) return "📡";
    if (p.type === "limb") return "🦵";
    return "💢";
  }

  function renderHUD() {
    $("hud-jp-text").textContent = `★ ${State.boss.name_jp}`;
    const jpLine = $("hud-jp-line");
    jpLine.textContent = State.sentenceJp || "";
    const en = $("hud-en"); en.innerHTML = "";
    State.tokens.forEach((tok, i) => {
      const sp = document.createElement("span");
      sp.className = "slot";
      if (i < State.progress) sp.classList.add("done");
      else if (i === State.progress) sp.classList.add("next");
      sp.textContent = tok;
      en.appendChild(sp);
    });
    const partsEl = $("hud-parts"); partsEl.innerHTML = "";
    State.parts.forEach((p) => {
      const pip = document.createElement("div");
      pip.className = "part-pip" + (p.broken ? " broken" : "");
      pip.textContent = p.icon;
      partsEl.appendChild(pip);
    });
    const allPartsBroken = State.parts.every(p => p.broken);
    const corePip = document.createElement("div");
    corePip.className = "part-pip core" + (allPartsBroken ? " warn" : "");
    corePip.textContent = "❤️";
    partsEl.appendChild(corePip);
  }

  // ---- CANVAS / RENDER ----
  let cv, ctx, W, H, raf, lastT, running;
  let kaijuY, kaijuVy;
  let pipes, tokens;
  let nextPipeAt, nextTokenAt;
  let bossSpriteImg = null;
  let bossSpriteWrap = null;
  let scrollX = 0;
  let crashCool = 0;
  let hitPauseUntil = 0;          // ms timestamp: when current freeze-frame ends
  let shake = { x:0, y:0, until:0, mag:0 };
  let screenFlash = { color:null, until:0, mag:0 };
  let trail = [];                 // kaiju position history for trail
  let comboTextT = 0;             // ms remaining on combo flash text
  let comboTextVal = 0;
  const particles = [];           // unified particle buffer

  function setupCanvas() {
    cv = $("cv");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      const w = cv.clientWidth || window.innerWidth;
      const h = cv.clientHeight || window.innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      W = w; H = h;
    }
    resize();
    window.addEventListener("resize", resize);
    ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function runGame() {
    running = true;
    kaijuY = H * 0.5;
    kaijuVy = 0;
    pipes = [];
    tokens = [];
    crashCool = 0;
    hitPauseUntil = 0;
    shake = { x:0, y:0, until:0, mag:0 };
    screenFlash = { color:null, until:0, mag:0 };
    trail = [];
    particles.length = 0;
    comboTextT = 0;
    nextPipeAt = performance.now() + 1100;
    nextTokenAt = performance.now() + 600;
    lastT = performance.now();
    scrollX = 0;
    prepareKaijuSprite().then(() => {
      raf = requestAnimationFrame(loop);
    });
    document.addEventListener("pointerdown", onTap);
    document.addEventListener("keydown", onKey);
  }
  function stopGame() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    document.removeEventListener("pointerdown", onTap);
    document.removeEventListener("keydown", onKey);
    if (bossSpriteWrap) { try { bossSpriteWrap.remove(); } catch (_) {} bossSpriteWrap = null; }
  }
  $("hud-quit").addEventListener("click", () => { stopGame(); show("title"); });
  $("hud-peek").addEventListener("click", () => {
    const line = $("hud-jp-line"); const btn = $("hud-peek");
    line.classList.toggle("peek");
    btn.classList.toggle("active");
  });

  function onTap(e) {
    if (!running) return;
    if (e.clientY < 64) return;
    kaijuVy = LEVEL_TUNING[State.level].flap;
    SND.sfxPop();
    // Tiny tap effect at kaiju position
    burstSparkles(W*0.25 - 10, kaijuY + 10, 4, "#aaccff", 80, 1);
  }
  function onKey(e) {
    if (!running) return;
    if (e.code === "Space" || e.code === "ArrowUp") { kaijuVy = LEVEL_TUNING[State.level].flap; SND.sfxPop(); }
  }

  function prepareKaijuSprite() {
    return new Promise(resolve => {
      if (bossSpriteWrap) { try { bossSpriteWrap.remove(); } catch (_) {} }
      const wrap = document.createElement("div");
      wrap.style.cssText = "position:fixed;left:-9999px;width:160px;height:120px;";
      wrap.innerHTML = ART.renderSVG(State.boss);
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

  function spawnPipe(t) {
    const tun = LEVEL_TUNING[State.level];
    const gap = H * tun.pipeGap;
    const topMin = H * 0.10;
    const topMax = H - gap - H * 0.10;
    const topH = topMin + Math.random() * (topMax - topMin);
    pipes.push({ x: W + 30, topH, gap, w: Math.max(48, W * 0.085), style: tun.pipeStyle });
  }

  function spawnToken(t) {
    const wantTarget = Math.random() < 0.55;
    let word;
    if (wantTarget) {
      word = State.tokens[State.progress];
    } else {
      const all = SENTENCES[State.bossId][State.level] || [];
      const allWords = new Set();
      State.tokens.forEach(t => allWords.add(t));
      all.forEach(s => {
        const en = typeof s === "string" ? s : s.en;
        tokenize(en).forEach(t => allWords.add(t));
      });
      const sentencePool = [...allWords].filter(w => w !== State.tokens[State.progress]);
      if (sentencePool.length === 0) word = State.tokens[State.progress];
      else word = sentencePool[(Math.random() * sentencePool.length) | 0];
    }
    if (!word) return;
    const y = 60 + Math.random() * (H - 160);
    tokens.push({ x: W + 30, y, word: word, picked: false, scale: 0.6, scaleT: 0 });
  }

  function loop(t) {
    if (!running) return;
    let dt = Math.min(40, t - lastT);
    lastT = t;
    // Hit-pause: freeze everything but rendering
    if (t < hitPauseUntil) dt = 0;
    update(dt, t);
    draw(t);
    raf = requestAnimationFrame(loop);
  }

  function update(dt, t) {
    const tun = LEVEL_TUNING[State.level];
    const dts = dt / 1000;
    kaijuVy += tun.gravity * dts;
    kaijuY  += kaijuVy * dts;
    if (kaijuY < 0)        { kaijuY = 0; kaijuVy = 0; }
    if (kaijuY > H - 30)   {
      if (crashCool < 99000) { kaijuY = H - 30; hitObstacle("floor"); }
    }

    // Trail update
    trail.push({ x: W*0.25, y: kaijuY, t });
    if (trail.length > 14) trail.shift();

    // Particles tick
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vx += (p.gx || 0) * dts;
      p.vy += (p.gy || 240) * dts;
      p.x += p.vx * dts;
      p.y += p.vy * dts;
      p.life -= dt;
      p.rot = (p.rot || 0) + (p.spin || 0) * dts;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Shake decay
    if (t < shake.until) {
      shake.x = (Math.random()*2 - 1) * shake.mag;
      shake.y = (Math.random()*2 - 1) * shake.mag;
    } else { shake.x = 0; shake.y = 0; }

    if (comboTextT > 0) comboTextT -= dt;

    const step = tun.speed * dts;
    pipes.forEach(p => p.x -= step);
    tokens.forEach(tk => {
      tk.x -= step;
      // Token scale-in animation
      tk.scaleT = Math.min(1, tk.scaleT + dts * 4);
      tk.scale = 0.6 + 0.4 * easeOut(tk.scaleT);
    });

    if (t >= nextPipeAt)  { spawnPipe(t); nextPipeAt  = t + tun.pipeRate; }
    if (t >= nextTokenAt) { spawnToken(t); nextTokenAt = t + tun.tokenRate; }

    pipes = pipes.filter(p => p.x + p.w > -30);
    tokens = tokens.filter(tk => tk.x > -50 && !tk.picked);

    if (crashCool > 0 && crashCool < 99000) crashCool -= dt;

    // Magnetic pickup — correct-word tokens within range pull toward kaiju.
    // Reduces frustration from near-misses while still requiring the kid
    // to aim ROUGHLY at the right token (wrong tokens don't magnetize).
    const kx = W * 0.25, ky = kaijuY;
    const expected = State.tokens[State.progress];
    tokens.forEach(tk => {
      if (tk.picked) return;
      if (tk.word !== expected) return;
      const dx = kx - tk.x, dy = ky - tk.y;
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d < 140 && d > 40) {
        const pull = (1 - d/140) * 380 * dts;
        tk.x += (dx/d) * pull;
        tk.y += (dy/d) * pull;
      }
    });

    // Token pickups
    const PICK_R = 50;
    tokens.forEach(tk => {
      if (tk.picked) return;
      const dx = tk.x - kx, dy = tk.y - ky;
      if (dx*dx + dy*dy < PICK_R*PICK_R) {
        tk.picked = true;
        handlePickup(tk);
      }
    });

    // Pipe collisions — instant death (no cooldown forgiveness).
    if (crashCool < 99000) {
      pipes.forEach(p => {
        if (kx + 22 < p.x || kx - 22 > p.x + p.w) return;
        if (ky - 22 < p.topH || ky + 22 > p.topH + p.gap) hitObstacle("pipe");
      });
    }
  }

  function easeOut(k) { return 1 - Math.pow(1-k, 3); }

  function handlePickup(tk) {
    const expected = State.tokens[State.progress];
    if (expected && tk.word === expected) {
      State.progress++;
      State.pickupsCorrect++;
      State.combo++;
      if (State.combo > State.comboMax) State.comboMax = State.combo;
      // Pitch climbs with combo for satisfying chain feedback
      const pitchBoost = Math.min(0.5, State.combo * 0.08);
      SND.sfxCorrect();
      SND.speakEn(pureWord(tk.word));
      // Big sparkle burst at pickup point
      burstSparkles(tk.x, tk.y, 24, "#44ff88", 200, 2.4);
      // Word ghost rising up
      flash(tk.x, tk.y, tk.word, "#aaffcc");
      // Tiny shake feedback
      addShake(120, 3);
      // Color flash green
      screenFlash = { color: "rgba(80,255,140,0.18)", until: performance.now()+160, mag: 1 };
      // Combo text
      if (State.combo >= 2) {
        comboTextVal = State.combo;
        comboTextT = 800;
      }
      renderHUD();
      if (State.progress >= State.tokens.length) {
        setTimeout(winSequence, 700);
      }
    } else {
      State.pickupsWrong++;
      State.combo = 0;
      SND.sfxWrong();
      flash(tk.x, tk.y, "✕", "#ff3b6b");
      // Feather/smoke burst at impact
      burstFeathers(tk.x, tk.y, 14);
      // Red flash
      screenFlash = { color: "rgba(255,60,90,0.22)", until: performance.now()+200, mag: 1.2 };
      addShake(180, 8);
      // Brief hit-pause to make damage feel WEIGHTED
      hitPauseUntil = performance.now() + 70;
      breakNextPart();
    }
  }

  function hitObstacle(kind) {
    if (crashCool > 0) return;
    crashCool = 99999;
    SND.sfxSplat();
    flash(W * 0.25, kaijuY, "💥", "#ff3b6b");
    // Big crash particles
    burstExplosion(W*0.25, kaijuY, 38);
    addShake(420, 18);
    screenFlash = { color: "rgba(255,40,60,0.45)", until: performance.now()+260, mag: 2 };
    hitPauseUntil = performance.now() + 140;
    setTimeout(() => crashSequence(kind), 600);
  }

  function crashSequence(kind) {
    stopGame();
    SND.sfxFail();
    $("lose-banner").textContent = kind === "floor" ? "GROUND HIT!" : "PIPE CRASH!";
    $("lose-jp").textContent = State.boss.name_jp;
    $("lose-progress").innerHTML = `「${State.tokens.slice(0, State.progress).join(" ") || "..."}」 ... まで かんせい!<br>あと: <span style="color:#ffe45c">${State.tokens.slice(State.progress).join(" ") || "(なし)"}</span><br>さいだい コンボ: <span style="color:#ffe45c">${State.comboMax}</span>`;
    renderLoseExtras(kind);
    show("lose");
  }

  function breakNextPart() {
    const intactIdx = State.parts.findIndex(p => !p.broken);
    if (intactIdx >= 0) {
      const broken = State.parts[intactIdx];
      broken.broken = true;
      if (broken.ref) broken.ref.hp = 0;
      // Burst at the kaiju where the damage shows
      burstFeathers(W*0.25, kaijuY, 18);
      renderHUD();
      prepareKaijuSprite();
    } else {
      State.coreHits++;
      const core = State.boss.parts.find(p => p.effect === "win");
      if (core) core.hp = 0;
      // Massive core-break cinematic
      burstExplosion(W*0.25, kaijuY, 60);
      addShake(560, 24);
      screenFlash = { color: "rgba(255,60,30,0.6)", until: performance.now()+400, mag: 3 };
      hitPauseUntil = performance.now() + 200;
      renderHUD();
      prepareKaijuSprite();
      setTimeout(loseSequence, 900);
    }
  }

  // ---- PARTICLES ----
  function burstSparkles(x, y, n, color, speed, scale) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = (speed || 200) * (0.6 + Math.random()*0.6);
      particles.push({
        type: "spark",
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        gy: 60,
        life: 600 + Math.random()*300,
        max: 900,
        color: color || "#ffe45c",
        size: (1.5 + Math.random()*3) * (scale || 1),
      });
    }
  }
  function burstFeathers(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI/2 + (Math.random()-0.5) * 2.4;
      const s = 120 + Math.random()*220;
      particles.push({
        type: "feather",
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        gy: 200,
        rot: Math.random()*Math.PI*2,
        spin: (Math.random()-0.5) * 8,
        life: 900 + Math.random()*500,
        max: 1400,
        color: ["#cca066","#aa6633","#dd9966","#888"][i%4],
        size: 4 + Math.random()*4,
      });
    }
  }
  function burstExplosion(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 200 + Math.random()*380;
      particles.push({
        type: "boom",
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        gy: 320,
        life: 700 + Math.random()*600,
        max: 1300,
        color: ["#ff3b6b","#ffcc44","#ff6633","#fff"][i%4],
        size: 3 + Math.random()*5,
      });
    }
    // Big shockwave ring
    particles.push({
      type:"ring", x, y, vx:0, vy:0, gy:0,
      life: 320, max: 320, color:"#ffe45c", size:6
    });
  }

  function addShake(durMs, mag) {
    const now = performance.now();
    shake.until = Math.max(shake.until, now + durMs);
    shake.mag = Math.max(shake.mag, mag);
  }

  // ---- DRAW ----
  const flashes = [];
  function flash(x, y, text, color) { flashes.push({ x, y, text, color, t: 0, life: 800 }); }

  // Background drifting silhouettes (foreground depth) — re-seeded per
  // session so the parallax doesn't loop identically every time.
  const fg = { layer1: [], layer2: [], seeded: false };
  function seedFg() {
    fg.layer1.length = 0; fg.layer2.length = 0;
    const farIcons = ["🐙","🐫","💩","🐟","🍦","🍞","🧸","🎮"];
    for (let i = 0; i < 6; i++) {
      fg.layer1.push({ icon: farIcons[(Math.random()*farIcons.length)|0],
                       x: Math.random() * W * 2, y: Math.random() * H,
                       size: 36 + Math.random() * 28, speed: 18 + Math.random() * 18 });
    }
    for (let i = 0; i < 4; i++) {
      fg.layer2.push({ icon: farIcons[(Math.random()*farIcons.length)|0],
                       x: Math.random() * W * 2, y: 60 + Math.random() * (H - 200),
                       size: 60 + Math.random() * 36, speed: 50 + Math.random() * 30 });
    }
    fg.seeded = true;
  }

  function draw(t) {
    if (!fg.seeded) seedFg();
    ctx.save();
    // Screen shake
    ctx.translate(shake.x, shake.y);
    ctx.clearRect(-30, -30, W+60, H+60);
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#1a0a3a");
    grad.addColorStop(0.6, "#5a1a8a");
    grad.addColorStop(1, "#aa3aaa");
    ctx.fillStyle = grad;
    ctx.fillRect(-30, -30, W+60, H+60);

    // PARALLAX layer A: distant stars (slow)
    scrollX += 0.3;
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    for (let i = 0; i < 24; i++) {
      const sx = (W - ((i * 79 + scrollX) % (W + 60)));
      const sy = (i * 53) % H;
      ctx.fillRect(sx, sy, 1, 1);
    }
    // PARALLAX layer B: closer stars (faster, brighter)
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    for (let i = 0; i < 14; i++) {
      const sx = (W - ((i * 137 + scrollX * 2) % (W + 80)));
      const sy = ((i * 91) + 30) % H;
      ctx.fillRect(sx, sy, 2, 2);
    }
    // Foreground silhouette drift (very back)
    ctx.globalAlpha = 0.10;
    fg.layer1.forEach(s => {
      s.x -= s.speed * 0.016;
      if (s.x < -80) s.x = W + 80;
      ctx.font = `${s.size}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(s.icon, s.x, s.y);
    });
    // Mid-distance silhouettes
    ctx.globalAlpha = 0.18;
    fg.layer2.forEach(s => {
      s.x -= s.speed * 0.016;
      if (s.x < -120) s.x = W + 120;
      ctx.font = `${s.size}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(s.icon, s.x, s.y);
    });
    ctx.globalAlpha = 1;

    // Pipes
    pipes.forEach(p => {
      if (p.style === "cloud") {
        drawCloud(p.x, 0, p.w, p.topH);
        drawCloud(p.x, p.topH + p.gap, p.w, H - (p.topH + p.gap));
      } else {
        drawPipe(p.x, 0, p.w, p.topH);
        drawPipe(p.x, p.topH + p.gap, p.w, H - (p.topH + p.gap));
      }
    });

    // Tokens
    const expected = State.tokens[State.progress];
    tokens.forEach(tk => {
      if (tk.picked) return;
      const isTarget = (tk.word === expected);
      ctx.save();
      ctx.translate(tk.x, tk.y);
      ctx.scale(tk.scale, tk.scale);
      // Target tokens get a subtle pulsing halo so they're easy to spot
      if (isTarget) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.008);
        ctx.beginPath();
        ctx.arc(0, 0, 26 + pulse*4, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,228,92,${0.18 + pulse*0.18})`;
        ctx.fill();
      }
      ctx.font = "bold 17px system-ui, sans-serif";
      const w = ctx.measureText(tk.word).width + 24;
      const h = 30;
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      roundRect(ctx, -w/2 - 2, -h/2 + 2, w, h, 14);
      ctx.fill();
      ctx.fillStyle = isTarget ? "rgba(255,255,170,0.96)" : "rgba(255,255,255,0.96)";
      roundRect(ctx, -w/2, -h/2, w, h, 14);
      ctx.fill();
      ctx.fillStyle = "#2a0a4a";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tk.word, 0, 1);
      ctx.restore();
    });

    // Kaiju trail (oldest = most faded)
    if (trail.length > 1) {
      for (let i = 0; i < trail.length - 1; i++) {
        const k = i / trail.length;
        ctx.globalAlpha = k * 0.35;
        ctx.fillStyle = "#aaccff";
        ctx.beginPath();
        ctx.arc(trail[i].x, trail[i].y, 16 * k + 4, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Particles
    drawParticles();

    // Flash text labels
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i]; f.t += 16;
      const k = f.t / f.life;
      if (k >= 1) { flashes.splice(i, 1); continue; }
      ctx.globalAlpha = 1 - k;
      ctx.font = "bold 34px system-ui, sans-serif";
      ctx.fillStyle = f.color;
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.lineWidth = 4;
      ctx.textAlign = "center";
      ctx.strokeText(f.text, f.x, f.y - k * 50);
      ctx.fillText(f.text, f.x, f.y - k * 50);
      ctx.globalAlpha = 1;
    }

    // Kaiju sprite
    const kx = W * 0.25, ky = kaijuY;
    const tilt = Math.max(-0.4, Math.min(0.8, kaijuVy * 0.001));
    ctx.save();
    ctx.translate(kx, ky);
    ctx.rotate(tilt);
    const flapScale = 1 + Math.max(0, -kaijuVy * 0.0003);
    ctx.scale(flapScale, 1);
    const blink = crashCool > 0 && (Math.floor(crashCool / 80) % 2 === 0);
    if (blink) ctx.globalAlpha = 0.4;
    if (bossSpriteImg) {
      const sw = 140, sh = 105;
      ctx.drawImage(bossSpriteImg, -sw/2, -sh/2, sw, sh);
    } else {
      ctx.font = "60px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ART.emoji(State.bossId), 0, 0);
    }
    ctx.restore();

    // Combo flash text (big, center top)
    if (comboTextT > 0) {
      const k = 1 - (comboTextT / 800);
      ctx.save();
      ctx.globalAlpha = 1 - k * 0.6;
      const sz = 48 + Math.sin(k*6) * 6 + (State.combo > 4 ? 12 : 0);
      ctx.font = `900 ${sz}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.lineWidth = 6;
      ctx.fillStyle = State.combo >= 5 ? "#ff3b6b" : (State.combo >= 3 ? "#ffcc44" : "#44ff88");
      const cx = W * 0.5;
      const cy = 130 + k * 30;
      ctx.strokeText(`x${comboTextVal} COMBO!`, cx, cy);
      ctx.fillText(`x${comboTextVal} COMBO!`, cx, cy);
      ctx.restore();
    }

    ctx.restore();
    // Screen flash overlay (outside shake transform)
    if (t < screenFlash.until && screenFlash.color) {
      const k = 1 - ((screenFlash.until - t) / 200);
      ctx.fillStyle = screenFlash.color;
      ctx.globalAlpha = Math.max(0, 1 - k);
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
  }

  function drawParticles() {
    for (const p of particles) {
      const k = p.life / p.max;
      if (p.type === "spark") {
        ctx.globalAlpha = Math.max(0, k);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fill();
      } else if (p.type === "feather") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, k);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.4, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
      } else if (p.type === "boom") {
        ctx.globalAlpha = Math.max(0, k);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fill();
      } else if (p.type === "ring") {
        const rk = 1 - k;
        ctx.globalAlpha = Math.max(0, k);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 6 * k;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 30 + rk * 120, 0, Math.PI*2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);   ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);     ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
  }

  function drawPipe(x, y, w, h) {
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, "#2a8a44");
    g.addColorStop(0.5, "#5acc66");
    g.addColorStop(1, "#1a6a2a");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#0a3a0a";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    const capH = 22;
    if (y === 0) ctx.fillRect(x - 4, y + h - capH, w + 8, capH);
    else         ctx.fillRect(x - 4, y, w + 8, capH);
    if (y === 0) ctx.strokeRect(x - 4, y + h - capH, w + 8, capH);
    else         ctx.strokeRect(x - 4, y, w + 8, capH);
    // moss highlights
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(x + 4, y, 4, h);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillRect(x + w - 8, y, 4, h);
  }
  function drawCloud(x, y, w, h) {
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.strokeStyle = "rgba(180,200,255,0.6)";
    ctx.lineWidth = 2;
    const bumps = Math.max(2, Math.floor(h / 40));
    for (let i = 0; i < bumps; i++) {
      const cy = y + (i + 0.5) * (h / bumps);
      ctx.beginPath();
      ctx.ellipse(x + w/2, cy, w/2 + 6, 22, 0, 0, Math.PI*2);
      ctx.fill(); ctx.stroke();
    }
  }

  // Per-kaiju in-character victory lines for the win screen.
  // Pulled from the comedian persona's 8 lines + new ones in the
  // same key. Each line is { en, jp }.
  const VICTORY_LINES = {
    tako:       { en: "BINGO. BONGO. BUNGO. ...the third one is my brother.", jp: "ビンゴ。 ボンゴ。 ブンゴ。 …3 ばんめ は きょうだい。" },
    unko:       { en: "I detonated. With LOVE.",                                jp: "あい を こめて、 ばくは した。" },
    tral:       { en: "BELLISSIMO! You sing better than my mother thought.",   jp: "ベリッシモ！ はは の よそう より うた が じょうず。" },
    pamp:       { en: "You are now my real friend. Forever and fluffy.",       jp: "あなた は ほんとう の ともだち。 ずっと、 ふわふわ。" },
    parfait:    { en: "Ohonhonhon, you are now SLIGHTLY less of a sardine.",   jp: "オホンホンホン、 あなた は ほんの すこし いわし じゃない。" },
    anpan:      { en: "I cannot help you. I am bread. Also fish. You won.",     jp: "たすけられない。 ぼく は パン。 さかな も。 きみ の かち。" },
    temee:      { en: "In my village... we also won. It is tradition.",        jp: "むら で… かった こと も ある。 でんとう。" },
    catcherski: { en: "I have stolen your answer. It was correct. I keep it.", jp: "こたえ を ぬすんだ。 せいかい。 もって おく。" },
    brainrot:   { en: "The cosmos has observed your spelling. The cosmos is impressed.", jp: "うちゅう は きみ の つづり を みた。 かんしん した。" },
  };

  // ---- WIN / LOSE ----
  function winSequence() {
    stopGame();
    SND.sfxLevel();
    SND.speakEn(State.sentence);
    recordSentenceCleared(State.bossId, State.level, State.sentence);
    // Animated word-by-word reveal of the cleared sentence.
    const winEn = $("win-en"); winEn.innerHTML = "";
    State.tokens.forEach((tok, i) => {
      const sp = document.createElement("span");
      sp.textContent = tok + (i < State.tokens.length - 1 ? " " : "");
      sp.style.cssText = "display:inline-block;opacity:0;transform:translateY(8px) scale(0.7);transition:opacity 0.3s ease, transform 0.3s ease;";
      winEn.appendChild(sp);
      setTimeout(() => { sp.style.opacity = "1"; sp.style.transform = "translateY(0) scale(1)"; }, 120 + i * 140);
    });
    $("win-jp").textContent = State.sentenceJp || State.boss.name_jp;
    $("win-art").innerHTML = ART.renderSVG(State.boss);
    // Boss bounce on art
    const artEl = $("win-art").firstElementChild;
    if (artEl) {
      artEl.animate(
        [{ transform: "scale(0)" }, { transform: "scale(1.15)", offset: 0.7 }, { transform: "scale(1)" }],
        { duration: 600, easing: "cubic-bezier(.18,.89,.32,1.28)", fill: "forwards" }
      );
    }
    // Per-kaiju victory line, spoken in that kaiju's voice
    const vline = VICTORY_LINES[State.bossId];
    if (vline) {
      let vEl = document.getElementById("win-victory-line");
      if (!vEl) {
        vEl = document.createElement("div");
        vEl.id = "win-victory-line";
        vEl.style.cssText = "max-width:88vw;text-align:center;font-size:14px;color:#aaccff;font-style:italic;margin:10px 0 4px;letter-spacing:0.5px;padding:0 14px;line-height:1.5;";
        $("win-jp").parentNode.insertBefore(vEl, $("win-stats"));
      }
      vEl.innerHTML = `「${vline.en}」<br><span style="font-size:11px;color:var(--ink-dim);">${vline.jp}</span>`;
      setTimeout(() => SND.speakAsKaiju(State.bossId, vline.en), 1400 + State.tokens.length * 140);
    }
    const sec = Math.floor((performance.now() - State.sessionStartT) / 1000);
    const accuracy = State.pickupsCorrect + State.pickupsWrong === 0 ? 100 :
      Math.round(100 * State.pickupsCorrect / (State.pickupsCorrect + State.pickupsWrong));
    $("win-stats").innerHTML = `じかん: <span style="color:#ffe45c">${sec}s</span> · せいかい りつ: <span style="color:#ffe45c">${accuracy}%</span><br>こわした パーツ: ${State.parts.filter(p=>p.broken).length}/5 · さいだい コンボ: <span style="color:#ffe45c">${State.comboMax}</span>`;
    show("win");
    spawnConfetti(State.isShiny ? 100 : 60);
    if (State.isShiny) {
      // Surprise banner on shiny win
      const sh = document.createElement("div");
      sh.textContent = "★ SHINY ★";
      sh.style.cssText = "position:fixed;top:80px;left:50%;transform:translateX(-50%);font-size:36px;font-weight:900;background:linear-gradient(90deg,#ff3b6b,#ffcc44,#44eeff,#aa66ff,#ff3b6b);background-size:300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:6px;animation:shimmer 1.8s linear infinite;z-index:1000;pointer-events:none;";
      document.body.appendChild(sh);
      setTimeout(() => { try { sh.remove(); } catch (_) {} }, 3200);
    }
  }

  const MASTERY_KEY = "esl_kaiju_mastery";
  function loadMastery() {
    try { return JSON.parse(localStorage.getItem(MASTERY_KEY) || "{}"); } catch (_) { return {}; }
  }
  function saveMastery(m) { try { localStorage.setItem(MASTERY_KEY, JSON.stringify(m)); } catch (_) {} }
  function recordSentenceCleared(bossId, level, sentence) {
    const m = loadMastery();
    if (!m[bossId]) m[bossId] = { flappy: { 0:[], 1:[], 2:[] } };
    if (!m[bossId].flappy) m[bossId].flappy = { 0:[], 1:[], 2:[] };
    const lvKey = String(level);
    if (!m[bossId].flappy[lvKey]) m[bossId].flappy[lvKey] = [];
    if (!m[bossId].flappy[lvKey].includes(sentence)) {
      m[bossId].flappy[lvKey].push(sentence);
    }
    saveMastery(m);
  }
  function loseSequence() {
    stopGame();
    SND.sfxFail();
    $("lose-banner").textContent = "CORE BROKEN!";
    $("lose-jp").textContent = State.boss.name_jp;
    $("lose-progress").innerHTML = `「${State.tokens.slice(0, State.progress).join(" ") || "..."}」 ... まで かんせい!<br>あと: <span style="color:#ffe45c">${State.tokens.slice(State.progress).join(" ")}</span><br>さいだい コンボ: <span style="color:#ffe45c">${State.comboMax}</span>`;
    renderLoseExtras("core");
    show("lose");
  }

  // Per-kaiju in-character consolation lines for the lose screen.
  const CONSOLATION_LINES = {
    tako:       { en: "Eight arms, still not enough. Try again.",                    jp: "8本あし でも たりない。 もう いちど。" },
    unko:       { en: "Even brown kings fall. Brooklyn baby, brush off and go.",     jp: "ちゃいろ の おう も おちる。 ブルックリン ベイビー、 また やる。" },
    tral:       { en: "INCORRRRRECTO! ...try again, sweetie.",                       jp: "インコレット！ また やって ね。" },
    pamp:       { en: "Soft things bounce back. Like my stuffing. Like you.",         jp: "やわらかい もの は もどる。 ぼく の なかみ みたい。 きみ みたい。" },
    parfait:    { en: "The cherry fades, but the laughter melts new ice. Again?",    jp: "さくらんぼ は きえる、 でも わらい が あたらしい こおり を とかす。 また？" },
    anpan:      { en: "I cannot help. I am bread. Also fish. Try once more.",        jp: "たすけられない。 ぼく は パン。 さかな も。 もう いちど。" },
    temee:      { en: "In my village... we also failed. It is tradition. Sit. Try.", jp: "むら で… しっぱい も した。 でんとう。 すわって。 やる。" },
    catcherski: { en: "I have stolen your loss. It was free. Try again, kind kid.",  jp: "まけ を ぬすんだ。 タダ。 また やって、 やさしい こ。" },
    brainrot:   { en: "The cosmos has observed your spelling. The cosmos is disappointed but not surprised.", jp: "うちゅう は きみ の つづり を みた。 がっかり、 でも きが つかなかった わけ じゃない。" },
  };
  function renderLoseExtras(kind) {
    // Damaged kaiju art + consolation line
    let art = document.getElementById("lose-art");
    if (!art) {
      art = document.createElement("div");
      art.id = "lose-art";
      art.style.cssText = "width:200px;height:150px;margin:14px auto 6px;background:rgba(0,0,0,0.4);border:2px dashed rgba(255,90,80,0.7);border-radius:14px;padding:10px;";
      $("lose-jp").parentNode.insertBefore(art, $("lose-jp").nextSibling);
    }
    art.innerHTML = ART.renderSVG(State.boss);
    let cons = document.getElementById("lose-consolation");
    if (!cons) {
      cons = document.createElement("div");
      cons.id = "lose-consolation";
      cons.style.cssText = "max-width:88vw;text-align:center;font-size:14px;color:#aaccff;font-style:italic;margin:8px auto;letter-spacing:0.5px;padding:0 14px;line-height:1.5;";
      $("lose-progress").parentNode.insertBefore(cons, $("lose-progress"));
    }
    const cline = CONSOLATION_LINES[State.bossId] || { en: "Try again, brave kid.", jp: "また やって、 ゆうかん な こ。" };
    cons.innerHTML = `「${cline.en}」<br><span style="font-size:11px;color:var(--ink-dim);">${cline.jp}</span>`;
    setTimeout(() => SND.speakAsKaiju(State.bossId, cline.en), 500);
  }

  $("win-again").addEventListener("click", () => { SND.sfxConfirm(); startGame(State.bossId); });
  $("win-menu").addEventListener("click",  () => { SND.sfxConfirm(); buildPickGrid(); show("pick"); });
  $("win-home").addEventListener("click",  () => { SND.sfxConfirm(); show("title"); });
  $("lose-retry").addEventListener("click", () => { SND.sfxConfirm(); startGame(State.bossId); });
  $("lose-home").addEventListener("click",  () => { SND.sfxConfirm(); show("title"); });

  function spawnConfetti(n) {
    const layer = document.createElement("div");
    layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:900;overflow:hidden;";
    document.body.appendChild(layer);
    const emojis = ["🎉","🎊","⭐","🌟","✨","💫","🎈","🌈","🐙","🐫","💩","🐟","🍦","🍞","🧸","🎮"];
    for (let i = 0; i < n; i++) {
      const p = document.createElement("div");
      p.textContent = emojis[(Math.random()*emojis.length)|0];
      p.style.cssText = `position:absolute;left:${Math.random()*100}%;top:-30px;font-size:${18+Math.random()*22}px;`;
      p.animate(
        [{ transform:"translateY(0) rotate(0)", opacity: 1 },
         { transform:`translateY(${window.innerHeight+60}px) rotate(${Math.random()*720-360}deg)`, opacity: 0 }],
        { duration: 1800 + Math.random()*1400, delay: Math.random()*600, fill: "forwards" }
      );
      layer.appendChild(p);
    }
    setTimeout(() => { try { layer.remove(); } catch(_){} }, 3500);
  }

  show("title");
})();
