// どうし リズム — Verb Rhythm
//
// Touchscreen rhythm game. Verbs scroll right→left in a track. When the
// verb is over the highlighted "now zone" the kid taps the bottom tap-
// zone (giant 90px-tall pad). On a hit the kaiju does that action
// (CSS keyframe animation tied to the verb), the verb is spoken, score
// climbs, combo + chaos meter rise. Miss = combo resets. When chaos
// fills 100% → DISCO MODE: screen flashes, next 10 notes give double
// score. Per Kenta: loud, fast, chaotic.
//
// Pedagogy: high-frequency action verbs at A1 level. Each verb has a
// matched animation so kid binds word ↔ visual ↔ audio (Paivio dual coding).

(function () {
  const SND = window.GamesAudio;
  const ART = window.GamesArt;

  // Verb pool with mapped action class + JP gloss
  const VERBS = [
    { w: "run",    a: "act-run",   jp: "はしる" },
    { w: "jump",   a: "act-jump",  jp: "ジャンプ" },
    { w: "eat",    a: "act-eat",   jp: "たべる" },
    { w: "sleep",  a: "act-sleep", jp: "ねる" },
    { w: "fly",    a: "act-fly",   jp: "とぶ" },
    { w: "dance",  a: "act-dance", jp: "おどる" },
    { w: "cry",    a: "act-cry",   jp: "なく" },
    { w: "spin",   a: "act-spin",  jp: "まわる" },
    { w: "shake",  a: "act-shake", jp: "ふるえる" },
    { w: "drink",  a: "act-eat",   jp: "のむ" },
    { w: "laugh",  a: "act-dance", jp: "わらう" },
    { w: "swim",   a: "act-fly",   jp: "およぐ" },
    { w: "sing",   a: "act-dance", jp: "うたう" },
    { w: "fall",   a: "act-cry",   jp: "おちる" },
    { w: "hug",    a: "act-eat",   jp: "ハグ" },
    { w: "kick",   a: "act-shake", jp: "ける" },
    { w: "yell",   a: "act-spin",  jp: "さけぶ" },
    { w: "wave",   a: "act-dance", jp: "てをふる" },
  ];

  const $ = (id) => document.getElementById(id);
  const screens = ["title", "game", "result"];
  function show(id) {
    screens.forEach(s => $("screen-" + s).classList.toggle("hidden", s !== id));
  }

  const BEST_KEY = "esl_verb_rhythm_best";
  function getBest()    { return parseInt(localStorage.getItem(BEST_KEY) || "0", 10); }
  function saveBest(s)  { if (s > getBest()) localStorage.setItem(BEST_KEY, String(s)); }
  function renderBest() {
    $("best").innerHTML = `べスト スコア: <em>${getBest()}</em>`;
  }

  // ---- TITLE ----
  document.querySelectorAll(".level-pick button").forEach(b => {
    b.addEventListener("click", () => {
      State.level = parseInt(b.dataset.lv, 10);
      SND.sfxConfirm();
      startGame();
    });
  });

  const State = {
    level: 0,
    notes: [],          // { word, action, x (px from track-right), hit?:boolean, missed?:boolean }
    spawnT: 0,
    nextSpawn: 0,
    score: 0,
    combo: 0,
    chaos: 0,
    discoUntil: 0,
    boss: null,
    started: 0,
    duration: 60000,    // 60s per session
    running: false,
    raf: null,
    lastT: 0,
    speed: 0.32,        // px/ms
    spawnInterval: 1400,
    trackWidth: 0,
  };

  function startGame() {
    State.notes = [];
    State.score = 0;
    State.combo = 0;
    State.chaos = 0;
    State.discoUntil = 0;
    State.started = performance.now();
    State.boss = ART.bosses()[(Math.random() * 7) | 0]; // any of the first 7 bosses
    State.speed = State.level === 0 ? 0.28 : 0.42;
    State.spawnInterval = State.level === 0 ? 1500 : 950;
    renderHUD();
    renderBoss();
    show("game");
    State.running = true;
    State.lastT = performance.now();
    State.nextSpawn = 0;
    State.trackWidth = document.querySelector(".track").getBoundingClientRect().width;
    State.raf = requestAnimationFrame(tick);
    document.addEventListener("pointerdown", onTap);
  }
  function stopGame() {
    State.running = false;
    if (State.raf) cancelAnimationFrame(State.raf);
    document.removeEventListener("pointerdown", onTap);
    document.body.classList.remove("disco-mode");
  }
  $("hud-quit").addEventListener("click", () => { stopGame(); show("title"); renderBest(); });

  function renderBoss() {
    $("boss-display").innerHTML = `<div class="boss-sv">${ART.renderSVG(State.boss)}</div>`;
  }
  function renderHUD() {
    $("hud-combo").textContent = "×" + State.combo;
    $("hud-score").textContent = State.score;
    $("hud-chaos-fill").style.width = State.chaos + "%";
  }

  function spawnNote() {
    const v = VERBS[(Math.random() * VERBS.length) | 0];
    const noteEl = document.createElement("div");
    noteEl.className = "note";
    noteEl.textContent = v.w;
    // Spawn on the right side of the track
    const trackEl = $("track-notes");
    noteEl.style.left = "100%";
    trackEl.appendChild(noteEl);
    const note = {
      el: noteEl,
      word: v.w,
      action: v.a,
      jp: v.jp,
      x: trackEl.getBoundingClientRect().width,   // position px from left
      hit: false,
      missed: false,
    };
    State.notes.push(note);
  }

  function tick(t) {
    if (!State.running) return;
    const dt = Math.min(40, t - State.lastT);
    State.lastT = t;

    // Spawn loop
    if (t - State.nextSpawn >= State.spawnInterval) {
      State.nextSpawn = t;
      spawnNote();
    }
    // Update positions
    const w = State.trackWidth;
    const nowZoneCenter = w * 0.20 + 45;
    const nowZoneStart  = w * 0.20;
    const nowZoneEnd    = w * 0.20 + 90;
    State.notes.forEach(n => {
      if (!n.hit && !n.missed) {
        n.x -= State.speed * dt;
        n.el.style.left = n.x + "px";
        // Past the now-zone without being hit = miss
        if (n.x + 60 < nowZoneStart) {
          n.missed = true;
          n.el.classList.add("miss");
          State.combo = 0;
          State.chaos = Math.max(0, State.chaos - 5);
          renderHUD();
          showHitBanner("MISS", "miss");
        }
      }
    });
    // Despawn far-off
    State.notes = State.notes.filter(n => {
      if (n.x < -120) { try { n.el.remove(); } catch(_) {} return false; }
      return true;
    });

    // Time check
    if (t - State.started >= State.duration) { endGame(); return; }

    // Disco countdown
    if (State.discoUntil && t > State.discoUntil) {
      State.discoUntil = 0;
      document.body.classList.remove("disco-mode");
    }
    renderHUD();
    State.raf = requestAnimationFrame(tick);
  }

  function onTap(e) {
    if (!State.running) return;
    // Ignore taps in the HUD region (above tap-zone)
    if (e.clientY < 64) return;
    // Find the note closest to the now-zone center
    const w = State.trackWidth;
    const nowCenter = w * 0.20 + 45;
    let best = null, bestDist = 999;
    State.notes.forEach(n => {
      if (n.hit || n.missed) return;
      const d = Math.abs(n.x + 60 - nowCenter);  // 60 is approx half-width of pill
      if (d < bestDist) { bestDist = d; best = n; }
    });
    if (!best || bestDist > 80) {
      SND.sfxWrong();
      showHitBanner("早すぎ", "miss");
      State.combo = 0;
      renderHUD();
      return;
    }
    // Hit!
    best.hit = true;
    best.el.classList.add("hit");
    State.combo++;
    const isDisco = performance.now() < State.discoUntil;
    const isPerfect = bestDist < 30;
    const points = (isPerfect ? 20 : 10) * (isDisco ? 2 : 1);
    State.score += points;
    State.chaos = Math.min(100, State.chaos + (isPerfect ? 8 : 4));
    if (State.chaos >= 100 && !isDisco) triggerDisco();
    showHitBanner(isPerfect ? "PERFECT" : "GOOD", isPerfect ? "perfect" : "good");
    SND.sfxCorrect();
    SND.speakEn(best.word);
    // Kaiju does the action
    const bossEl = document.querySelector(".boss-sv");
    if (bossEl) {
      // Remove other act classes
      bossEl.className = "boss-sv";
      void bossEl.offsetWidth; // reflow to restart anim
      bossEl.classList.add(best.action);
    }
    renderHUD();
  }

  function showHitBanner(text, kind) {
    const el = document.createElement("div");
    el.className = "hit-banner " + kind;
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => { try { el.remove(); } catch(_) {} }, 700);
  }

  function triggerDisco() {
    State.discoUntil = performance.now() + 6000;
    document.body.classList.add("disco-mode");
    const banner = document.createElement("div");
    banner.textContent = "🪩 DISCO MODE 🪩";
    banner.style.cssText = `
      position: fixed; top: 38%; left: 50%; transform: translateX(-50%);
      font-size: 36px; font-weight: 900; letter-spacing: 6px;
      color: #ffe45c; text-shadow: 0 0 14px #ff66cc, 0 2px 0 #000;
      pointer-events: none; z-index: 100;
      animation: hit-burst 1.4s ease-out forwards;
    `;
    document.body.appendChild(banner);
    setTimeout(() => { try { banner.remove(); } catch(_){} }, 1500);
    // Speed up for fun
    State.spawnInterval = Math.max(550, State.spawnInterval * 0.7);
  }

  function endGame() {
    stopGame();
    saveBest(State.score);
    $("result-banner").textContent = State.score >= 600 ? "MEGA!" : State.score >= 300 ? "GREAT!" : "DONE!";
    $("result-score").textContent = `${State.score} ぽいんと`;
    $("result-art").innerHTML = ART.renderSVG(State.boss);
    const lines = [
      "The cosmos has observed your rhythm. The cosmos is impressed.",
      "I detonated. To the BEAT.",
      "Mamma mia! BELLISSIMO dancing!",
      "Ohonhonhon, you have rhythm of a slightly less embarrassed sardine.",
      "I have stolen your beats. They were on time. I am returning them.",
      "In my village... we dance too. But for 8 hours. It is tradition.",
    ];
    $("result-msg").textContent = lines[(Math.random()*lines.length)|0];
    show("result");
    spawnConfetti(40);
  }

  $("btn-again").addEventListener("click", () => { SND.sfxConfirm(); startGame(); });
  $("btn-home").addEventListener("click", () => { SND.sfxConfirm(); show("title"); renderBest(); });

  function spawnConfetti(n) {
    const layer = document.createElement("div");
    layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:900;overflow:hidden;";
    document.body.appendChild(layer);
    const emojis = ["🎉","🎊","🪩","🎵","✨","💫","🎈"];
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

  // ---- BOOT ----
  renderBest();
  show("title");
  if (window.startDenturesGag) window.startDenturesGag();
})();
