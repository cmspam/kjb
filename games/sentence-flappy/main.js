// ぶんぽう フラッピー — Sentence Flappy (rebuilt)
//
// Flying-shooter / word-collector. Kid steers a kaiju through scrolling
// space, dodging pipes AND collecting English-word tokens in the correct
// sentence order. Tokens spawn at ANY screen Y (not just between pipes)
// so dodging + collecting are simultaneous skills.
//
// Failure model is the body-parts cascade (user's request):
//   - Kaiju has 5 body parts visible in the HUD (limbs, eyes, mouth)
//   - Each wrong word OR pipe crash destroys one part
//   - When all 5 parts are broken, the CORE (heart) takes the next hit
//   - Core hit = game over, with explosion cinematic
//
// Spawning model fixes the prior bug where only the first word ever
// appeared. The spawn queue is rebuilt every time progress advances so
// the NEXT-expected word is always in the spawn pool AND distractors
// (words from elsewhere in the sentence + wrong words from the kaiju
// pool) are mixed in.

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
    tokens: [],          // ["I", "am", "an", "octopus."]
    progress: 0,
    parts: [],           // { name, broken }  — 5 destructible body parts
    coreHits: 0,
    pickupsCorrect: 0,
    pickupsWrong: 0,
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
    ids.forEach(id => {
      const boss = ART.get(id, true);
      if (!boss) return;
      const div = document.createElement("button");
      div.className = "pick-card";
      div.innerHTML = `
        <div class="sv">${ART.renderSVG(boss)}</div>
        <div class="name">${boss.name_jp || id}</div>
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
    const pool = SENTENCES[bossId][State.level];
    const picked = pool[(Math.random() * pool.length) | 0];
    // Pool is now { en, jp } objects (with backward compat for plain strings)
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
    // Build a local DESTRUCTIBLE list mirroring the boss's real parts.
    // We mutate boss.parts directly so KJB's renderBossSVG draws the
    // damaged silhouette (parts with hp=0 render as 💥 in the existing
    // monsters.js draw functions). When the kid picks a wrong word we
    // pick the next intact non-core part and set hp=0 + re-render the
    // sprite, so the kaiju visibly loses a hump / leg / eye / etc.
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
    const jpLine = State.sentenceJp ? ` · ${State.sentenceJp}` : "";
    $("hud-jp").textContent = `★ ${State.boss.name_jp}${jpLine}`;
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

  function onTap(e) {
    if (!running) return;
    if (e.clientY < 64) return;
    kaijuVy = LEVEL_TUNING[State.level].flap;
    SND.sfxPop();
  }
  function onKey(e) {
    if (!running) return;
    if (e.code === "Space" || e.code === "ArrowUp") { kaijuVy = LEVEL_TUNING[State.level].flap; SND.sfxPop(); }
  }

  function prepareKaijuSprite() {
    // Re-render the off-DOM SVG → data URL → Image. Called at game
    // start and after every body-part mutation so canvas shows damage.
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
    tokens.push({ x: W + 30, y, word: word, picked: false });
  }

  function loop(t) {
    if (!running) return;
    const dt = Math.min(40, t - lastT);
    lastT = t;
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

    const step = tun.speed * dts;
    pipes.forEach(p => p.x -= step);
    tokens.forEach(tk => tk.x -= step);

    if (t >= nextPipeAt)  { spawnPipe(t); nextPipeAt  = t + tun.pipeRate; }
    if (t >= nextTokenAt) { spawnToken(t); nextTokenAt = t + tun.tokenRate; }

    pipes = pipes.filter(p => p.x + p.w > -30);
    tokens = tokens.filter(tk => tk.x > -50 && !tk.picked);

    if (crashCool > 0) crashCool -= dt;

    // Token pickups
    const kx = W * 0.25, ky = kaijuY;
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

  function handlePickup(tk) {
    const expected = State.tokens[State.progress];
    if (expected && tk.word === expected) {
      State.progress++;
      State.pickupsCorrect++;
      SND.sfxCorrect();
      SND.speakEn(pureWord(tk.word));
      flash(tk.x, tk.y, "+1", "#44ff88");
      renderHUD();
      if (State.progress >= State.tokens.length) {
        setTimeout(winSequence, 700);
      }
    } else {
      State.pickupsWrong++;
      SND.sfxWrong();
      flash(tk.x, tk.y, "✕", "#ff3b6b");
      breakNextPart();
    }
  }

  function hitObstacle(kind) {
    // Pipes are INSTANT-DEATH per design — no second chances, no body-
    // part discount. The kid has to navigate cleanly. Reduces collision
    // ambiguity ("did that count?") and forces a clean dodging skill.
    if (crashCool > 0) return;
    crashCool = 99999;
    SND.sfxSplat();
    flash(W * 0.25, kaijuY, "💥", "#ff3b6b");
    // Cinematic crash: kaiju spirals down, explosion, lose screen.
    setTimeout(() => crashSequence(kind), 350);
  }

  function crashSequence(kind) {
    stopGame();
    SND.sfxFail();
    $("lose-banner").textContent = kind === "floor" ? "GROUND HIT!" : "PIPE CRASH!";
    $("lose-jp").textContent = State.boss.name_jp;
    $("lose-progress").innerHTML = `「${State.tokens.slice(0, State.progress).join(" ") || "..."}」 ... まで かんせい!<br>あと: <span style="color:#ffe45c">${State.tokens.slice(State.progress).join(" ") || "(なし)"}</span>`;
    show("lose");
  }

  function breakNextPart() {
    // Wrong-word damage. Find the next intact non-core part and
    // physically destroy it on the kaiju SVG by zeroing its HP. The
    // KJB renderBossSVG already draws hp=0 parts as 💥, so the kid
    // SEES Temee lose a hump, Tako lose a tentacle, etc. After the
    // mutation we re-render the kaiju sprite so the canvas shows the
    // damage on the next frame.
    const intactIdx = State.parts.findIndex(p => !p.broken);
    if (intactIdx >= 0) {
      const broken = State.parts[intactIdx];
      broken.broken = true;
      if (broken.ref) broken.ref.hp = 0;
      renderHUD();
      prepareKaijuSprite();  // refresh data-URL with the damaged SVG
    } else {
      // All non-core parts down — next wrong = CORE BREAK = game over
      State.coreHits++;
      // Damage the actual core in the boss so the win-art also shows it
      const core = State.boss.parts.find(p => p.effect === "win");
      if (core) core.hp = 0;
      renderHUD();
      prepareKaijuSprite();
      setTimeout(loseSequence, 600);
    }
  }

  // ---- DRAW ----
  const flashes = [];
  function flash(x, y, text, color) { flashes.push({ x, y, text, color, t: 0, life: 800 }); }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#1a0a3a");
    grad.addColorStop(0.6, "#5a1a8a");
    grad.addColorStop(1, "#aa3aaa");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    // Stars
    scrollX += 0.5;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    for (let i = 0; i < 30; i++) {
      const sx = (W - ((i * 79 + scrollX) % (W + 60)));
      const sy = (i * 53) % H;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }

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
    tokens.forEach(tk => {
      if (tk.picked) return;
      ctx.font = "bold 17px system-ui, sans-serif";
      const w = ctx.measureText(tk.word).width + 24;
      const h = 30;
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      roundRect(ctx, tk.x - w/2 - 2, tk.y - h/2 + 2, w, h, 14);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.96)";
      roundRect(ctx, tk.x - w/2, tk.y - h/2, w, h, 14);
      ctx.fill();
      ctx.fillStyle = "#2a0a4a";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tk.word, tk.x, tk.y + 1);
    });

    // Flashes
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i]; f.t += 16;
      const k = f.t / f.life;
      if (k >= 1) { flashes.splice(i, 1); continue; }
      ctx.globalAlpha = 1 - k;
      ctx.font = "bold 34px system-ui, sans-serif";
      ctx.fillStyle = f.color;
      ctx.textAlign = "center";
      ctx.fillText(f.text, f.x, f.y - k * 50);
      ctx.globalAlpha = 1;
    }

    // Kaiju sprite
    const kx = W * 0.25, ky = kaijuY;
    const tilt = Math.max(-0.4, Math.min(0.8, kaijuVy * 0.001));
    ctx.save();
    ctx.translate(kx, ky);
    ctx.rotate(tilt);
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

  // ---- WIN / LOSE ----
  function winSequence() {
    stopGame();
    SND.sfxLevel();
    SND.speakEn(State.sentence);
    $("win-en").textContent = State.sentence;
    $("win-jp").textContent = State.boss.name_jp;
    $("win-art").innerHTML = ART.renderSVG(State.boss);
    const sec = Math.floor((performance.now() - State.sessionStartT) / 1000);
    const accuracy = State.pickupsCorrect + State.pickupsWrong === 0 ? 100 :
      Math.round(100 * State.pickupsCorrect / (State.pickupsCorrect + State.pickupsWrong));
    $("win-stats").innerHTML = `じかん: <span style="color:#ffe45c">${sec}s</span> · せいかい りつ: <span style="color:#ffe45c">${accuracy}%</span><br>こわした パーツ: ${State.parts.filter(p=>p.broken).length}/5`;
    show("win");
    spawnConfetti(40);
  }
  function loseSequence() {
    stopGame();
    SND.sfxFail();
    $("lose-banner").textContent = "CORE BROKEN!";
    $("lose-jp").textContent = State.boss.name_jp;
    $("lose-progress").innerHTML = `「${State.tokens.slice(0, State.progress).join(" ") || "..."}」 ... まで かんせい!<br>あと: <span style="color:#ffe45c">${State.tokens.slice(State.progress).join(" ")}</span>`;
    show("lose");
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
    const emojis = ["🎉","🎊","⭐","🌟","✨","💫","🎈","🌈"];
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
