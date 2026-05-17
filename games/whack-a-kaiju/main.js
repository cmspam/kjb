// ワッカー カイジュウ — Whack-a-Kaiju
//
// 3x3 grid of holes. Kaiju pop up from random holes at varying speeds.
// Voice calls a target word ("Whack the octopus!"). Kid taps the
// matching kaiju when it pops up. Wrong kaiju = -3. Miss (didn't tap
// before retraction) = +0. Right kaiju = +5 and Tako voice-line plays.
//
// Surprises:
//   - ULTRA MODE (every 20s): all 9 holes pop simultaneously for 4s
//   - 1-in-25 chance: dentures fly across the screen (cross-game gag)

(function () {
  const SND = window.GamesAudio;
  const ART = window.GamesArt;

  // Kaiju + target words. Same emoji set as bingo so kids see consistent
  // word-image mappings across games.
  const KAIJU = [
    { k: "tako",       w: "octopus",   e: "🐙" },
    { k: "unko",       w: "crocodile", e: "🐊" },
    { k: "tral",       w: "fish",      e: "🐟" },
    { k: "pamp",       w: "fluffy",    e: "🧸" },
    { k: "parfait",    w: "parfait",   e: "🍦" },
    { k: "anpan",      w: "bread",     e: "🍞" },
    { k: "temee",      w: "camel",     e: "🐫" },
    { k: "catcherski", w: "robot",     e: "🤖" },
    { k: null,         w: "cat",       e: "🐱" },
    { k: null,         w: "dog",       e: "🐶" },
    { k: null,         w: "moon",      e: "🌙" },
    { k: null,         w: "sun",       e: "☀️" },
    { k: null,         w: "apple",     e: "🍎" },
    { k: null,         w: "milk",      e: "🥛" },
  ];

  const $ = (id) => document.getElementById(id);
  const screens = ["title", "game", "result"];
  function show(id) { screens.forEach(s => $("screen-" + s).classList.toggle("hidden", s !== id)); }

  const BEST_KEY = "esl_whack_kaiju_best";
  function getBest() { return parseInt(localStorage.getItem(BEST_KEY) || "0", 10); }
  function saveBest(s) { if (s > getBest()) localStorage.setItem(BEST_KEY, String(s)); }
  function renderBest() { $("best").innerHTML = `べスト スコア: <em>${getBest()}</em>`; }

  document.querySelectorAll(".level-pick button").forEach(b => {
    b.addEventListener("click", () => {
      State.level = parseInt(b.dataset.lv, 10);
      SND.sfxConfirm();
      startGame();
    });
  });

  const State = {
    level: 0,
    target: null,
    score: 0,
    deadline: 0,
    holesArr: [],     // {el, popEl, occupant, retractAt}
    spawnEvery: 1000,
    nextSpawn: 0,
    raf: null,
    timer: null,
    ultraUntil: 0,
    nextUltra: 0,
  };

  function startGame() {
    State.score = 0;
    State.deadline = performance.now() + 60_000;
    State.spawnEvery = State.level === 0 ? 1100 : 650;
    State.nextUltra = performance.now() + 22000;
    buildGrid();
    nextTarget();
    show("game");
    State.raf = requestAnimationFrame(tick);
    if (State.timer) clearInterval(State.timer);
    State.timer = setInterval(updateTime, 200);
  }
  function stopGame() {
    if (State.raf) cancelAnimationFrame(State.raf);
    if (State.timer) clearInterval(State.timer);
  }
  $("hud-quit").addEventListener("click", () => { stopGame(); show("title"); renderBest(); });

  function buildGrid() {
    const holes = $("holes"); holes.innerHTML = "";
    State.holesArr = [];
    for (let i = 0; i < 9; i++) {
      const hole = document.createElement("div");
      hole.className = "hole";
      const pop = document.createElement("div");
      pop.className = "kaiju-pop";
      hole.appendChild(pop);
      hole.addEventListener("pointerdown", () => tapHole(i));
      holes.appendChild(hole);
      State.holesArr.push({ el: hole, popEl: pop, occupant: null, retractAt: 0 });
    }
  }

  function nextTarget() {
    State.target = KAIJU[(Math.random() * KAIJU.length) | 0];
    $("target-word").textContent = State.target.w;
    setTimeout(() => SND.speakEn("Whack the " + State.target.w + "!"), 200);
  }
  $("btn-repeat").addEventListener("click", () => {
    if (State.target) { SND.sfxPop(); SND.speakEn("Whack the " + State.target.w + "!"); }
  });

  function spawnPop() {
    const free = State.holesArr.filter(h => !h.occupant);
    if (free.length === 0) return;
    const hole = free[(Math.random() * free.length) | 0];
    // Mostly distractors, sometimes the target
    const wantTarget = Math.random() < 0.40;
    const kaiju = wantTarget ? State.target : KAIJU[(Math.random() * KAIJU.length) | 0];
    let inner;
    if (kaiju.k && ART.get(kaiju.k)) {
      inner = ART.renderSVG(ART.get(kaiju.k));
    } else {
      inner = `<div class="pop-emoji">${kaiju.e}</div>`;
    }
    hole.popEl.innerHTML = inner;
    hole.popEl.classList.add("up");
    hole.occupant = kaiju;
    // Retract after ~1.5-2.5s based on level
    const lifeMs = State.level === 0 ? 1900 : 1300;
    hole.retractAt = performance.now() + lifeMs;
  }

  function ultraMode() {
    State.ultraUntil = performance.now() + 4000;
    State.nextUltra = performance.now() + 22000;
    const b = document.createElement("div");
    b.className = "ultra-banner";
    b.textContent = "🌀 ULTRA WAVE 🌀";
    document.body.appendChild(b);
    setTimeout(() => { try { b.remove(); } catch(_) {} }, 1300);
    State.holesArr.forEach((h, i) => {
      if (h.occupant) return;
      const kaiju = i < KAIJU.length ? KAIJU[i] : State.target;
      let inner;
      if (kaiju.k && ART.get(kaiju.k)) inner = ART.renderSVG(ART.get(kaiju.k));
      else inner = `<div class="pop-emoji">${kaiju.e}</div>`;
      h.popEl.innerHTML = inner;
      h.popEl.classList.add("up");
      h.occupant = kaiju;
      h.retractAt = performance.now() + 4000;
    });
  }

  function tick(t) {
    if (t >= State.deadline) { endGame(); return; }
    if (t >= State.nextSpawn) {
      State.nextSpawn = t + State.spawnEvery;
      // Don't spawn during ultra wave fill-time
      if (t > State.ultraUntil) spawnPop();
    }
    if (t > State.nextUltra && State.level >= 0) ultraMode();
    State.holesArr.forEach(h => {
      if (h.occupant && t >= h.retractAt) {
        retract(h);
      }
    });
    State.raf = requestAnimationFrame(tick);
  }

  function retract(h) {
    h.popEl.classList.remove("up");
    h.occupant = null;
    setTimeout(() => { h.popEl.innerHTML = ""; }, 280);
  }

  function tapHole(idx) {
    const h = State.holesArr[idx];
    if (!h.occupant) return;
    const occ = h.occupant;
    h.popEl.classList.add("bonked");
    setTimeout(() => h.popEl.classList.remove("bonked"), 380);
    if (occ.w === State.target.w) {
      State.score += 5;
      SND.sfxCorrect();
      SND.speakEn(occ.w);
      popScore(h.el, "+5");
      h.occupant = null;
      setTimeout(() => { h.popEl.classList.remove("up"); h.popEl.innerHTML = ""; }, 380);
      // change target every 4 hits
      if (State.score % 20 === 0) nextTarget();
    } else {
      State.score = Math.max(0, State.score - 3);
      SND.sfxWrong();
      h.el.classList.add("miss");
      setTimeout(() => h.el.classList.remove("miss"), 400);
      popScore(h.el, "-3");
    }
    $("hud-score").textContent = State.score;
  }

  function popScore(holeEl, text) {
    const rect = holeEl.getBoundingClientRect();
    const fx = document.createElement("div");
    fx.className = "score-pop";
    fx.textContent = text;
    fx.style.left = (rect.left + rect.width/2 - 16) + "px";
    fx.style.top  = (rect.top  + 30) + "px";
    fx.style.position = "fixed";
    document.body.appendChild(fx);
    setTimeout(() => { try { fx.remove(); } catch(_){} }, 700);
  }

  function updateTime() {
    const remain = Math.max(0, State.deadline - performance.now());
    const sec = Math.ceil(remain / 1000);
    const el = $("hud-time");
    el.textContent = "⏱ " + sec;
    if (sec <= 10) el.classList.add("danger"); else el.classList.remove("danger");
  }

  function endGame() {
    stopGame();
    saveBest(State.score);
    $("result-banner").textContent = State.score >= 80 ? "WHACK MASTER!" : State.score >= 40 ? "GREAT!" : "DONE!";
    $("result-stats").innerHTML = `スコア: <span style="color:#ffe45c">${State.score}</span>`;
    const lines = [
      "BINGO. BONGO. BUNGO. You whacked my brother. He is fine.",
      "I have stolen your whacks. They were on target. I am returning them.",
      "Ohonhonhon, you whacked even ME. Rude.",
      "In my village... we whacked too. Sand. It did not move.",
      "The cosmos has observed your whacking. Please stop.",
    ];
    $("result-msg").textContent = lines[(Math.random()*lines.length)|0];
    show("result");
    spawnConfetti(28);
    SND.sfxLevel();
  }
  $("btn-again").addEventListener("click", () => { SND.sfxConfirm(); startGame(); });
  $("btn-home").addEventListener("click", () => { SND.sfxConfirm(); show("title"); renderBest(); });

  function spawnConfetti(n) {
    const layer = document.createElement("div");
    layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:900;overflow:hidden;";
    document.body.appendChild(layer);
    const emojis = ["🎉","🔨","✨","💫","🎈"];
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
