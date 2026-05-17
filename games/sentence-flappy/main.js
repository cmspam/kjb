// ぶんぽう フラッピー — Sentence Flappy
//
// Flappy-bird-style flying. Sentences are absurd-funny (per Mio's design
// note) and kaiju-specific. Words appear as floating tokens between pipes.
// Collect words in the CORRECT order to complete the sentence. Wrong word
// or pipe-crash costs a life but DOES NOT reset the sentence (per
// Sakura's rage-quit guard).
//
// Pedagogy (per Sato-sensei):
//   - Each word PLAYS ITS ENGLISH AUDIO when collected.
//   - The full sentence audio plays at the end.
//   - Difficulty levels match CEFR pre-A1 → A2.
//
// Levels:
//   0 — 入門: single-word goal, only cute bosses, soft clouds (no spike pipes)
//   1 — ふつう: 3-5 word sentences
//   2 — むずかしい: 6-10 word sentences with articles + plurals

(function () {
  const SND = window.GamesAudio;
  const ART = window.GamesArt;

  // ---- SENTENCE BANK ----
  // Each kaiju gets a pool of absurd sentences per level. Keep them
  // grammatically clean since the goal IS grammar — but make the content
  // weird so kids re-read them at lunch.
  //
  // Words are tokenized on whitespace + light punctuation.

  const SENTENCES = {
    tako: {
      0: ["octopus"],
      1: ["He is an octopus.", "Tako eats sushi.", "He has eight legs.", "He sells takoyaki."],
      2: ["Tako is an octopus who sells takoyaki at night.",
          "He has eight legs and a paper hat on his head.",
          "Tako wants to turn all food into takoyaki forever."],
    },
    unko: {
      0: ["bomb"],
      1: ["He is a crocodile.", "He drops a bomb.", "He smells bad.", "He says BOMBA."],
      2: ["Unkodilo is a robot crocodile who drops poop bombs from the sky.",
          "He filled all the rivers with brown stinky water.",
          "Unkodilo eats my homework and laughs at the smell."],
    },
    tral: {
      0: ["fish"],
      1: ["He is a fish.", "He sings opera.", "He wears blue shoes.", "Mamma mia!"],
      2: ["Tralalero is a fish who sings opera in the deep blue sea.",
          "He wears two blue Nike sneakers and a third one on his head.",
          "He wants the whole world to sing in Italian forever."],
    },
    pamp: {
      0: ["fluffy"],
      1: ["She is fluffy.", "She is pink.", "She wants a hug.", "She is soft."],
      2: ["Pampamu is a fluffy plushy who collects every child in the world.",
          "She is pink and soft but also a little bit scary.",
          "She will hug you and never ever let go."],
    },
    parfait: {
      0: ["sweet"],
      1: ["She is sweet.", "She is a fish.", "She tastes good.", "She has a cherry."],
      2: ["Parfait is a sardine inside a tall sweet parfait glass.",
          "She turns every sushi in Japan into a cold creamy dessert.",
          "She has a tiny cherry on top of her shiny head."],
    },
    anpan: {
      0: ["bread"],
      1: ["He is bread.", "He is a fish.", "He wants the throne.", "He has a face."],
      2: ["Anpan Maguro is bread and also a fish; it is complicated.",
          "He wants to be the new hero of Japan instead of Anpanman.",
          "His face is full of sweet red bean paste from yesterday."],
    },
    temee: {
      0: ["camel"],
      1: ["He is a camel.", "He has two humps.", "He is old.", "He likes buuz."],
      2: ["Temee is a camel with a monkey head and a long white beard.",
          "He has two humps on his back and forty thousand stars in his hat.",
          "He wants everyone in the world to grow a hump like him."],
    },
    catcherski: {
      0: ["robot"],
      1: ["He is a robot.", "He wants coins.", "He was hacked.", "He has a claw."],
      2: ["Catcherski is a UFO claw machine that was hacked by Russian hackers.",
          "He eats one hundred yen coins and never gives a prize.",
          "He locked all the emoji in the world inside a glass box."],
    },
  };

  // Beginner level only uses the cute / non-scary cast.
  const KAIJU_BY_LEVEL = {
    0: ["tako", "pamp", "parfait", "tral"],
    1: ["tako", "unko", "tral", "pamp", "parfait", "anpan", "temee", "catcherski"],
    2: ["tako", "unko", "tral", "pamp", "parfait", "anpan", "temee", "catcherski"],
  };

  // ---- ROUTING / STATE ----
  const $ = (id) => document.getElementById(id);
  const screens = ["title", "pick", "game", "win", "lose"];
  function show(id) {
    screens.forEach(s => $("screen-" + s).classList.toggle("hidden", s !== id));
  }

  let State = {
    level: 0,            // 0 / 1 / 2
    bossId: null,
    sentence: "",        // chosen sentence string
    tokens: [],          // tokenized words ["He","is","a","camel."]
    progress: 0,         // index into tokens — next slot to fill
    lives: 3,
    boss: null,          // factory-cloned boss instance (for SVG render)
    audio: null,         // current audio handle if any
    sessionStartMs: 0,
  };

  // ---- TITLE / LEVEL PICK ----
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

  // ---- GAME ----
  function tokenize(s) {
    // Treat trailing punctuation as glued to the previous word. We KEEP
    // punctuation on the spoken word so the audio lookup still finds
    // "camel." → "camel" via the cleanForHash trim. But the visual
    // collection slot shows the word as-written. We split on whitespace
    // and pass them as-is.
    return s.split(/\s+/).filter(Boolean);
  }
  function pureWord(tok) {
    return tok.replace(/[.,!?;:]+$/g, "").replace(/^[.,!?;:]+/g, "");
  }

  function startGame(bossId) {
    SND.sfxLevel();
    State.bossId = bossId;
    State.boss = ART.get(bossId, true);
    const pool = SENTENCES[bossId][State.level];
    State.sentence = pool[(Math.random() * pool.length) | 0];
    State.tokens = tokenize(State.sentence);
    State.progress = 0;
    State.lives = 3;
    State.sessionStartMs = performance.now();
    renderHUD();
    show("game");
    setupCanvas();
    // Hide tap-hint after first input
    let hinted = false;
    function killHint() { if (!hinted) { hinted = true; $("tap-hint").style.display = "none"; } }
    document.addEventListener("pointerdown", killHint, { once: true });
    runGame();
  }

  function renderHUD() {
    $("hud-jp").textContent = `★ ${State.boss.name_jp} の ぶん を つくれ`;
    const en = $("hud-en");
    en.innerHTML = "";
    State.tokens.forEach((tok, i) => {
      const sp = document.createElement("span");
      sp.className = "slot";
      if (i < State.progress) sp.classList.add("done");
      else if (i === State.progress) sp.classList.add("next");
      sp.textContent = tok;
      en.appendChild(sp);
    });
    $("hud-lives").textContent = "❤️".repeat(State.lives);
  }

  // ---- CANVAS GAME ----
  let cv, ctx, W, H, raf, lastT, running, kaijuY, kaijuVy, pipes, tokens, scrollX;
  let pipeGapPx, pipeSpacing, pipeWidth, gravity, flapV, scrollSpeed;
  let bossSpriteEl = null;
  let crashCooldown = 0;
  let pendingWord = null;     // which word should appear in the NEXT pipe gap
  let pickedThisGap = false;  // ensures one pickup per gap

  function setupCanvas() {
    cv = $("cv");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      const w = cv.clientWidth || window.innerWidth;
      const h = cv.clientHeight || window.innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      W = w; H = h;
      // tune physics with viewport. Units are PIXELS PER SECOND now
      // (previous build had per-frame numbers used as per-ms, so the
      // game ran at ~60x intended speed).
      pipeGapPx   = Math.max(180, H * 0.36);
      pipeSpacing = Math.max(260, W * 0.65);
      pipeWidth   = Math.max(50, W * 0.08);
      gravity     = H * 1.4;     // px/sec² downward accel
      flapV       = -H * 0.55;   // px/sec impulse upward on tap
      scrollSpeed = W * 0.18;    // px/sec horizontal scroll
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
    scrollX = 0;
    crashCooldown = 0;
    pickedThisGap = false;
    pipes = [];
    tokens = [];
    pendingWord = State.tokens[State.progress];
    // Seed pipes ahead
    for (let i = 0; i < 5; i++) spawnPipeAt(W + i * pipeSpacing);
    lastT = performance.now();
    // Pre-render kaiju SVG to an HTML element we drawImage from
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
    if (bossSpriteEl) {
      try { document.body.removeChild(bossSpriteEl); } catch (_) {}
      bossSpriteEl = null;
    }
  }
  $("hud-quit").addEventListener("click", () => { stopGame(); show("title"); });

  function onTap(e) {
    if (!running) return;
    // Ignore taps on the top HUD strip (so quit button still works)
    if (e.clientY < 56) return;
    kaijuVy = flapV;
    SND.sfxPop();
  }
  function onKey(e) {
    if (!running) return;
    if (e.code === "Space" || e.code === "ArrowUp") { kaijuVy = flapV; SND.sfxPop(); }
  }

  function prepareKaijuSprite() {
    // Off-DOM image we can drawImage from. We render the boss SVG to a
    // data URL then load it via Image. Re-renders on shiny-toggle would
    // need a refresh, but flappy doesn't shiny-toggle.
    return new Promise(resolve => {
      const wrap = document.createElement("div");
      wrap.style.cssText = "position:fixed;left:-9999px;width:160px;height:140px;";
      wrap.innerHTML = ART.renderSVG(State.boss);
      document.body.appendChild(wrap);
      bossSpriteEl = wrap;
      // The wrap.firstChild is the SVG (or the .shiny-boss-svg wrapper).
      const svg = wrap.querySelector("svg");
      if (!svg) { resolve(); return; }
      // serialize SVG → data URL → Image
      const xml = new XMLSerializer().serializeToString(svg);
      const url = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(xml)));
      const img = new Image();
      img.onload = () => { bossSpriteImg = img; resolve(); };
      img.onerror = () => resolve();
      img.src = url;
    });
  }
  let bossSpriteImg = null;

  function spawnPipeAt(x) {
    // Soft/cloud mode for beginner = wider gap + cloud styling
    const isSoft = State.level === 0;
    const gap = isSoft ? pipeGapPx * 1.35 : pipeGapPx;
    const topMin = H * 0.12;
    const topMax = H - gap - H * 0.12;
    const topH = topMin + Math.random() * (topMax - topMin);
    const pipe = {
      x: x,
      topH: topH,
      gap: gap,
      width: pipeWidth,
      passed: false,
      style: isSoft ? "cloud" : "pipe",
    };
    pipes.push(pipe);
    // Spawn a word token in this gap. We also occasionally drop a
    // distractor right alongside the correct one — the kid has to steer.
    const correctWord = pendingWord;
    if (!correctWord) return pipe;  // sentence already complete
    // Decide: is this gap the next correct slot? At level 0 the answer
    // is "almost always yes" — we want forward momentum. At level 2 the
    // distractors are denser to force reading.
    const distractDensity = State.level === 0 ? 0.0 : State.level === 1 ? 0.35 : 0.7;
    const wantCorrect = (pipes.length % 2 === 1) || Math.random() < 0.65;
    const isCorrect = wantCorrect || Math.random() < 0.5;
    if (isCorrect) {
      tokens.push({
        x: x + pipeWidth / 2,
        y: topH + gap / 2,
        word: correctWord,
        correct: true,
        pickedUp: false,
        gapId: pipes.length,
      });
    } else {
      // pick a distractor — a real word from the same sentence but
      // NOT the next one. Easier for kids to learn "is X next?" if the
      // wrong word is plausibly part of the sentence.
      let other = null;
      const others = State.tokens.filter((t, i) => i !== State.progress);
      if (others.length > 0) other = others[(Math.random() * others.length) | 0];
      if (!other) other = "the";
      tokens.push({
        x: x + pipeWidth / 2,
        y: topH + gap / 2 + (Math.random() - 0.5) * 40,
        word: other,
        correct: false,
        pickedUp: false,
        gapId: pipes.length,
      });
    }
    return pipe;
  }

  function loop(t) {
    if (!running) return;
    const dt = Math.min(40, t - lastT);
    lastT = t;
    update(dt);
    draw();
    raf = requestAnimationFrame(loop);
  }

  function update(dt) {
    // Physics — units are PER-SECOND, dt is in MS, so divide by 1000.
    const dts = dt / 1000;
    kaijuVy += gravity * dts;
    kaijuY  += kaijuVy * dts;
    // Bounds
    if (kaijuY < 0) { kaijuY = 0; kaijuVy = 0; }
    if (kaijuY > H - 20) { hitCrash(); kaijuY = H * 0.5; kaijuVy = 0; }

    // Scroll — also per-second.
    const step = scrollSpeed * dts;
    pipes.forEach(p => p.x -= step);
    tokens.forEach(tk => tk.x -= step);

    // Spawn new pipes
    if (pipes.length === 0 || pipes[pipes.length - 1].x < W - pipeSpacing) {
      spawnPipeAt((pipes.length ? pipes[pipes.length-1].x : W) + pipeSpacing);
    }

    // Despawn off-screen
    pipes = pipes.filter(p => p.x + p.width > -20);
    tokens = tokens.filter(tk => tk.x > -40);

    // Pickup detection
    const kx = W * 0.25, ky = kaijuY;
    const PICK_RADIUS = 44;
    tokens.forEach(tk => {
      if (tk.pickedUp) return;
      const dx = tk.x - kx, dy = tk.y - ky;
      if (dx * dx + dy * dy < PICK_RADIUS * PICK_RADIUS) {
        tk.pickedUp = true;
        handlePickup(tk);
      }
    });

    // Collision with pipes
    if (crashCooldown > 0) crashCooldown -= dt;
    else {
      pipes.forEach(p => {
        if (kx + 20 < p.x || kx - 20 > p.x + p.width) return;
        // Check top + bottom
        if (ky - 20 < p.topH || ky + 20 > p.topH + p.gap) {
          hitCrash();
        }
      });
    }
  }

  function handlePickup(tk) {
    // Compare against the LIVE expected word, not the stale per-token
    // `correct` flag stamped at spawn time. Previously, if "He is a
    // crocodile" spawned 4 "He" tokens ahead of the player and the kid
    // picked them all, each one advanced progress because they were
    // all marked correct=true at spawn — even though by pickup time
    // the expected word had become "is" / "a" / "crocodile". Now the
    // pickup checks the current State.tokens[State.progress].
    const expected = State.tokens[State.progress];
    if (expected && tk.word === expected) {
      State.progress++;
      pendingWord = State.tokens[State.progress] || null;
      SND.sfxCorrect();
      const word = pureWord(tk.word);
      SND.speakEn(word);
      renderHUD();
      flashPickup(tk.x, tk.y, "✨", "#44ff88");
      if (State.progress >= State.tokens.length) {
        setTimeout(() => { winSequence(); }, 600);
      }
    } else {
      // Wrong word — costs a life but doesn't reset progress
      State.lives--;
      SND.sfxWrong();
      flashPickup(tk.x, tk.y, "✕", "#ff3b6b");
      renderHUD();
      if (State.lives <= 0) loseSequence(tk.word);
    }
  }

  function hitCrash() {
    if (crashCooldown > 0) return;
    crashCooldown = 1500;
    State.lives--;
    SND.sfxSplat();
    renderHUD();
    if (State.lives <= 0) loseSequence(null);
  }

  // Floating flash animation for pickups
  const flashes = [];
  function flashPickup(x, y, text, color) {
    flashes.push({ x, y, text, color, t: 0, life: 700 });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // ---- BACKGROUND ----
    // Soft gradient with parallax stars
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#1a0a3a");
    grad.addColorStop(0.6, "#5a1a8a");
    grad.addColorStop(1, "#aa3aaa");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    // Star field (parallax — uses scrollX, slow, frame-rate-independent)
    scrollX += scrollSpeed * 0.005;
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    for (let i = 0; i < 30; i++) {
      const sx = (i * 79 + (scrollX * 0.3)) % (W + 60) - 30;
      const sy = (i * 53) % H;
      ctx.fillRect((W - sx), sy, 1.5, 1.5);
    }

    // ---- PIPES ----
    pipes.forEach(p => {
      if (p.style === "cloud") {
        // Soft cloud obstacle for beginner mode
        drawCloud(p.x, 0, p.width, p.topH);
        drawCloud(p.x, p.topH + p.gap, p.width, H - (p.topH + p.gap));
      } else {
        drawPipe(p.x, 0, p.width, p.topH);
        drawPipe(p.x, p.topH + p.gap, p.width, H - (p.topH + p.gap));
      }
    });

    // ---- WORD TOKENS ----
    tokens.forEach(tk => {
      if (tk.pickedUp) return;
      const cx = tk.x, cy = tk.y;
      // Bubble
      ctx.fillStyle = tk.correct ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.92)";
      const tw = ctx.measureText(tk.word).width;
      ctx.font = "bold 18px system-ui, sans-serif";
      const w = ctx.measureText(tk.word).width + 24;
      const h = 30;
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      roundRect(ctx, cx - w/2 - 2, cy - h/2 + 2, w, h, 14);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.96)";
      roundRect(ctx, cx - w/2, cy - h/2, w, h, 14);
      ctx.fill();
      ctx.fillStyle = "#2a0a4a";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tk.word, cx, cy + 1);
    });

    // ---- FLASH POPUPS ----
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i];
      f.t += 16;
      const k = f.t / f.life;
      if (k >= 1) { flashes.splice(i, 1); continue; }
      ctx.globalAlpha = 1 - k;
      ctx.font = "bold 36px system-ui, sans-serif";
      ctx.fillStyle = f.color;
      ctx.textAlign = "center";
      ctx.fillText(f.text, f.x, f.y - k * 40);
      ctx.globalAlpha = 1;
    }

    // ---- KAIJU SPRITE ----
    const kx = W * 0.25, ky = kaijuY;
    const tilt = Math.max(-0.5, Math.min(0.9, kaijuVy * 0.0008));
    ctx.save();
    ctx.translate(kx, ky);
    ctx.rotate(tilt);
    // Crash cooldown blink
    const blink = crashCooldown > 0 && (Math.floor(crashCooldown / 80) % 2 === 0);
    if (blink) ctx.globalAlpha = 0.35;
    if (bossSpriteImg) {
      // boss SVG is 800x480 — we want ~120x100 on screen
      const sw = 140, sh = 105;
      ctx.drawImage(bossSpriteImg, -sw/2, -sh/2, sw, sh);
    } else {
      // fallback emoji
      ctx.font = "60px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ART.emoji(State.bossId), 0, 0);
    }
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
  }

  function drawPipe(x, y, w, h) {
    // Body
    const grad = ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, "#2a8a44");
    grad.addColorStop(0.4, "#5acc66");
    grad.addColorStop(1, "#1a6a2a");
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#0a3a0a";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    // Cap
    const capH = 22;
    const capY = (h === H ? 0 : y + h - capH);  // top cap for top pipe, bottom cap for bottom
    // Simpler: cap goes at the side facing the kaiju gap
    ctx.fillStyle = grad;
    if (y === 0) {
      // top pipe — cap at the bottom edge
      ctx.fillRect(x - 4, y + h - capH, w + 8, capH);
      ctx.strokeRect(x - 4, y + h - capH, w + 8, capH);
    } else {
      // bottom pipe — cap at the top edge
      ctx.fillRect(x - 4, y, w + 8, capH);
      ctx.strokeRect(x - 4, y, w + 8, capH);
    }
  }

  function drawCloud(x, y, w, h) {
    // Soft white cloud obstacle for beginner mode
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.strokeStyle = "rgba(180,200,255,0.6)";
    ctx.lineWidth = 2;
    const bumps = Math.max(2, Math.floor(h / 40));
    for (let i = 0; i < bumps; i++) {
      const cy = y + (i + 0.5) * (h / bumps);
      ctx.beginPath();
      ctx.ellipse(x + w/2, cy, w/2 + 6, 22, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.stroke();
    }
  }

  // ---- WIN ----
  function winSequence() {
    stopGame();
    // Play full sentence audio
    SND.sfxLevel();
    SND.speakEn(State.sentence);
    // Build win screen
    $("win-en").textContent = State.sentence;
    $("win-jp").textContent = State.boss.name_jp;
    $("win-art").innerHTML = ART.renderSVG(State.boss);
    $("win-diagnosis").innerHTML = funnyDiagnosis();
    show("win");
    SND.sfxSparkle();
    spawnConfetti(40);
  }

  function funnyDiagnosis() {
    // Per Mio: shareable diagnosis. Per Shigeki: deadpan absurd lines.
    const lines = [
      `${State.boss.name_jp} のしんゆう。`,
      `きょう の あなた は <em>${State.boss.name_en || State.boss.name_jp}</em>。`,
      "せいかい！ あくむ は きょう も ふせがれた。",
      "The cosmos has observed your spelling. The cosmos is mildly impressed.",
      "I detonated. WITH LOVE.",
      "In my village... we celebrate this. It is tradition.",
      `Ohonhonhon, you are now SLIGHTLY less of a ${State.boss.name_en || "sardine"}.`,
    ];
    return lines[(Math.random() * lines.length) | 0];
  }

  function spawnConfetti(n) {
    const layer = document.createElement("div");
    layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:900;overflow:hidden;";
    document.body.appendChild(layer);
    const emojis = ["🎉","🎊","⭐","🌟","✨","💫","🎈","🌈","💩","🐙","🍦","🎮"];
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

  $("win-again").addEventListener("click", () => { SND.sfxConfirm(); startGame(State.bossId); });
  $("win-menu").addEventListener("click",  () => { SND.sfxConfirm(); buildPickGrid(); show("pick"); });
  $("win-home").addEventListener("click",  () => { SND.sfxConfirm(); show("title"); });

  // ---- LOSE ----
  function loseSequence(wrongWord) {
    stopGame();
    $("lose-jp").textContent = State.boss.name_jp;
    const lines = [
      "I have failed my ancestors.",
      "In my village… we also failed. It is tradition.",
      "The cosmos is disappointed but not surprised.",
      "I detonated. Without love this time.",
      "Mamma mia, try again amico.",
      "I am bread. Also fish. It is complicated.",
    ];
    $("lose-line").textContent = lines[(Math.random()*lines.length)|0];
    show("lose");
    SND.sfxFail();
  }
  $("lose-retry").addEventListener("click", () => { SND.sfxConfirm(); startGame(State.bossId); });
  $("lose-home").addEventListener("click",  () => { SND.sfxConfirm(); show("title"); });

  // ---- SECRET EVENTS ----
  // Random rare moments that surprise the kid mid-game. Per the design
  // doc: every game has at least one secret feature. Per Shigeki:
  // deadpan absurd > cheerleader. Per Kenta: chaos > polish.

  // 1) BOMBA RUSH — a 6-second window where Bombardiro Unkodilo flies
  //    in from the right, hovers above the player, and the next word
  //    token is golden + worth a free life if collected. ~1-in-90 per
  //    game tick (so ~3% chance per pipe-spacing).
  let bombaRushUntil = 0;
  let bombaSpriteEl = null;
  function maybeFireBombaRush(now) {
    if (now < bombaRushUntil) return;
    if (Math.random() > 1 / 90) return;
    bombaRushUntil = now + 6000;
    // Pulse the next token gold by stamping a flag on the latest unpicked token
    const lastUnpicked = tokens.find(tk => !tk.pickedUp);
    if (lastUnpicked) lastUnpicked.golden = true;
    // Floating banner so the kid registers it (deadpan: no exclamation)
    const banner = document.createElement("div");
    banner.textContent = "💩 BOMBA RUSH 💩";
    banner.style.cssText = `
      position: fixed; top: 60px; left: 50%; transform: translateX(-50%);
      font-size: 22px; font-weight: 900; letter-spacing: 4px;
      color: #ffe45c; text-shadow: 0 2px 0 #000, 0 0 14px #44ff88;
      background: rgba(0,0,0,0.55); padding: 8px 18px; border-radius: 99px;
      border: 2px solid #44ff88;
      pointer-events: none; z-index: 80;
    `;
    document.body.appendChild(banner);
    setTimeout(() => { try { banner.remove(); } catch (_){} }, 2200);
  }

  // 2) TRALALERO CAMEO — a 1-in-200 chance per game tick: an off-screen
  //    voice sings the target word in opera. Kid hears it before they
  //    collect it. Pure freebie / surprise listening exposure.
  let tralCameoUntil = 0;
  function maybeFireTralCameo(now) {
    if (now < tralCameoUntil) return;
    if (Math.random() > 1 / 200) return;
    tralCameoUntil = now + 8000;
    const word = State.tokens[State.progress];
    if (!word) return;
    // Visual: a fish silhouette swims in from the right
    const fish = document.createElement("div");
    fish.textContent = "🐟 ♪ " + pureWord(word) + " ♪";
    fish.style.cssText = `
      position: fixed; top: ${20 + Math.random()*40}%; right: -340px;
      font-size: 26px; font-weight: 900; letter-spacing: 2px;
      color: #fff; text-shadow: 0 2px 0 rgba(0,0,0,0.6);
      background: linear-gradient(90deg, #ee2266, #ffcc44);
      padding: 10px 18px; border-radius: 99px;
      pointer-events: none; z-index: 80;
    `;
    document.body.appendChild(fish);
    fish.animate(
      [{ transform: "translateX(0)" },
       { transform: `translateX(-${window.innerWidth + 400}px)` }],
      { duration: 5500, easing: "ease-in-out", fill: "forwards" }
    );
    setTimeout(() => { try { fish.remove(); } catch(_){} }, 5800);
    // Drama: opera-flavored TTS sting at slow rate
    SND.speakEn(pureWord(word), { rate: 0.7, pitch: 1.4 });
  }

  // Hook the secret-event rolls into update(). We can't edit update()
  // cleanly here — instead extend it via a frame counter.
  const _origLoop = loop;
  // Already running. Monkey-patch by overriding loop reference. Cleaner:
  // re-define the loop body to call our hooks too.
  // Re-wrap loop:
  function loopExt(t) {
    if (!running) return;
    const dt = Math.min(40, t - lastT);
    lastT = t;
    update(dt);
    maybeFireBombaRush(t);
    maybeFireTralCameo(t);
    draw();
    raf = requestAnimationFrame(loopExt);
  }
  // Patch runGame's loop start to use loopExt
  const _origRunGame = runGame;
  runGame = function () {
    running = true;
    kaijuY = H * 0.5; kaijuVy = 0; scrollX = 0;
    crashCooldown = 0; pickedThisGap = false;
    pipes = []; tokens = [];
    pendingWord = State.tokens[State.progress];
    for (let i = 0; i < 5; i++) spawnPipeAt(W + i * pipeSpacing);
    lastT = performance.now();
    prepareKaijuSprite().then(() => {
      raf = requestAnimationFrame(loopExt);
    });
    document.addEventListener("pointerdown", onTap);
    document.addEventListener("keydown", onKey);
  };

  // ---- BOOT ----
  show("title");
  if (window.startDenturesGag) window.startDenturesGag();
})();
