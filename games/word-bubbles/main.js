// ワード バブル — Word Bubbles
//
// Voice calls a target word ("apple!"). Bubbles with English words drift
// across the screen. Kid taps the bubble with the right word. Right tap
// = pop + score. Wrong tap = -2 points + raspberry. Time-limited round.
//
// Surprises:
//   - GOLDEN BUBBLES (~5% spawn): pop = +10 + reveals next target
//   - POISON BUBBLES (~3% spawn): -5 if tapped (don't touch!)
//   - SLOW-MO mode triggers at 5-streak (chaos energy reward)
//
// Touch-first: bubbles are ~80px circles, pointerdown handler. Anywhere
// taps on field also trigger if you miss.

(function () {
  const SND = window.GamesAudio;
  const ART = window.GamesArt;

  // Word pool — same family as other games
  const WORDS = [
    "cat", "dog", "fish", "bird", "bee", "pig", "fox", "cow",
    "apple", "banana", "milk", "egg", "ice cream", "bread", "rice", "sushi",
    "moon", "sun", "star", "rain", "snow", "cloud",
    "red", "blue", "green", "pink", "yellow",
    "octopus", "camel", "lion", "robot", "fluffy", "smelly", "bomb",
    "hat", "shoe", "ribbon", "claw", "hump", "cherry", "coin",
  ];

  const $ = (id) => document.getElementById(id);
  const screens = ["title", "game", "result"];
  function show(id) { screens.forEach(s => $("screen-" + s).classList.toggle("hidden", s !== id)); }

  const BEST_KEY = "esl_word_bubbles_best";
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
    bubbles: [],
    target: null,
    score: 0,
    streak: 0,
    slowmoUntil: 0,
    deadline: 0,
    spawnEvery: 1100,
    nextSpawn: 0,
    speed: 0.06,
    raf: null,
    lastT: 0,
    timerId: null,
  };

  function startGame() {
    State.bubbles = [];
    State.score = 0;
    State.streak = 0;
    State.slowmoUntil = 0;
    State.speed = State.level === 0 ? 0.06 : 0.10;
    State.spawnEvery = State.level === 0 ? 950 : 700;
    State.deadline = performance.now() + 60_000;
    $("bubble-field").innerHTML = "";
    setupCaller();
    nextTarget();
    show("game");
    State.lastT = performance.now();
    State.raf = requestAnimationFrame(tick);
    if (State.timerId) clearInterval(State.timerId);
    State.timerId = setInterval(updateTime, 200);
  }

  // Pick a random kaiju to be the "caller" — they hang in the top-right
  // corner of the field announcing target words. Rotates between rounds
  // so kids see different kaiju cameos.
  function setupCaller() {
    if (!ART || !ART.bosses) return;
    const all = ART.bosses();
    if (!all.length) return;
    const boss = all[(Math.random() * all.length) | 0];
    const svgEl = document.getElementById("kc-svg");
    const nameEl = document.getElementById("kc-name");
    if (svgEl) svgEl.innerHTML = ART.renderSVG(boss);
    if (nameEl) nameEl.textContent = boss.name_jp;
  }
  function stopGame() {
    if (State.raf) cancelAnimationFrame(State.raf);
    if (State.timerId) clearInterval(State.timerId);
  }
  $("hud-quit").addEventListener("click", () => { stopGame(); show("title"); renderBest(); });

  function pickWord() {
    return WORDS[(Math.random() * WORDS.length) | 0];
  }
  function nextTarget() {
    State.target = pickWord();
    $("target-word").textContent = State.target;
    setupCaller();           // rotate kaiju caller each new target — feels like they're announcing
    setTimeout(() => SND.speakEn(State.target), 180);
  }

  function spawn() {
    const w = (Math.random() < 0.45) ? State.target : pickWord();
    const roll = Math.random();
    let kind;
    if (roll < 0.04) kind = "golden";
    else if (roll < 0.07) kind = "poison";
    else if (w === State.target) kind = "target";
    else kind = "normal";
    const field = $("bubble-field");
    const fw = field.clientWidth, fh = field.clientHeight;
    const size = 80 + Math.random() * 30;
    const el = document.createElement("div");
    el.className = "bubble " + kind;
    el.style.width = el.style.height = size + "px";
    el.style.left = (Math.random() * (fw - size)) + "px";
    el.style.top  = (fh + 20) + "px";
    el.textContent = w;
    const b = { el, word: w, kind, x: parseFloat(el.style.left), y: fh + 20, drift: (Math.random()*0.05 - 0.025), size };
    State.bubbles.push(b);
    el.addEventListener("pointerdown", (e) => { e.stopPropagation(); tapBubble(b); });
    field.appendChild(el);
  }

  function tick(t) {
    const dt = t - State.lastT;
    State.lastT = t;
    const slow = t < State.slowmoUntil ? 0.35 : 1;
    if (t >= State.nextSpawn) {
      State.nextSpawn = t + State.spawnEvery;
      spawn();
    }
    // Move bubbles upward
    State.bubbles.forEach(b => {
      b.y -= State.speed * dt * slow;
      b.x += b.drift * dt;
      b.el.style.top  = b.y + "px";
      b.el.style.left = b.x + "px";
    });
    // Despawn off the top
    State.bubbles = State.bubbles.filter(b => {
      if (b.y + b.size < -30) {
        try { b.el.remove(); } catch(_){}
        return false;
      }
      return true;
    });
    if (performance.now() >= State.deadline) { endGame(); return; }
    State.raf = requestAnimationFrame(tick);
  }

  function updateTime() {
    const remain = Math.max(0, State.deadline - performance.now());
    const sec = Math.ceil(remain / 1000);
    const el = $("hud-time");
    el.textContent = "⏱ " + sec;
    if (sec <= 10) el.classList.add("danger"); else el.classList.remove("danger");
    $("hud-score").textContent = State.score;
  }

  function tapBubble(b) {
    if (b.popped) return;
    b.popped = true;
    b.el.classList.add("popped");
    if (b.kind === "golden") {
      State.score += 10;
      State.streak++;
      SND.sfxLevel();
      popFx(b.el, "+10", "#ffe45c");
      // Golden = reveals + immediately changes target
      nextTarget();
    } else if (b.kind === "poison") {
      State.score = Math.max(0, State.score - 5);
      State.streak = 0;
      SND.sfxWrong();
      popFx(b.el, "-5 💀", "#ff3b6b");
    } else if (b.word === State.target) {
      State.score += 2;
      State.streak++;
      SND.sfxCorrect();
      SND.speakEn(b.word);
      popFx(b.el, "+2", "#44ff88");
      if (State.streak >= 5) triggerSlowmo();
      // New target every 3 hits to keep things fresh
      if (State.score % 6 === 0) nextTarget();
    } else {
      State.score = Math.max(0, State.score - 2);
      State.streak = 0;
      SND.sfxWrong();
      popFx(b.el, "-2", "#ff3b6b");
    }
    setTimeout(() => { try { b.el.remove(); } catch(_){} }, 380);
  }

  function popFx(el, text, color) {
    const rect = el.getBoundingClientRect();
    const fx = document.createElement("div");
    fx.className = "pop-fx";
    fx.textContent = text;
    fx.style.color = color;
    fx.style.left = rect.left + "px";
    fx.style.top  = rect.top + "px";
    fx.style.position = "fixed";
    fx.style.zIndex = "70";
    document.body.appendChild(fx);
    setTimeout(() => { try { fx.remove(); } catch(_){} }, 700);
  }

  function triggerSlowmo() {
    State.slowmoUntil = performance.now() + 4500;
    const b = document.createElement("div");
    b.textContent = "🐢 SLOW-MO 🐢";
    b.style.cssText = `
      position: fixed; top: 25%; left: 50%; transform: translateX(-50%);
      font-size: 28px; font-weight: 900; letter-spacing: 4px;
      color: #44eeff; text-shadow: 0 0 12px #44eeff, 0 2px 0 #000;
      pointer-events: none; z-index: 100;
      animation: pop-rise 1.6s ease-out forwards;
    `;
    document.body.appendChild(b);
    setTimeout(() => { try { b.remove(); } catch(_){} }, 1800);
  }

  function endGame() {
    stopGame();
    saveBest(State.score);
    $("result-banner").textContent = State.score >= 60 ? "BUBBLE MASTER!" : State.score >= 30 ? "GOOD!" : "DONE!";
    $("result-stats").innerHTML = `スコア: <span style="color:#ffe45c">${State.score}</span> · ストリーク: ${State.streak}`;
    const lines = [
      "BINGO. BONGO. BUNGO. The third bubble is my brother.",
      "I have stolen your bubbles. They were correct. Mostly. I am returning them.",
      "Ohonhonhon, you popped almost as well as a small parfait.",
      "In my village... we did not have bubbles. We have sand.",
      "The cosmos has observed your popping. The cosmos was not informed bubbles existed.",
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
    const emojis = ["🎉","🫧","✨","💫","🎈","🪩"];
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

  // Inline denture gag
  function dentures() {
    const t = document.createElement("div");
    t.textContent = "🦷";
    t.style.cssText = `position: fixed; top: ${20 + Math.random()*50}%; left: -120px;
      font-size: ${56 + Math.random()*40}px;
      z-index: 999; pointer-events: none;`;
    document.body.appendChild(t);
    const distance = window.innerWidth + 240;
    const peak = 80 + Math.random()*60;
    const rotEnd = 720 + Math.random()*360;
    t.animate(
      [{ transform: "translate(0,0) rotate(0)" },
       { transform: `translate(${distance/2}px, -${peak}px) rotate(${rotEnd/2}deg)`, offset: 0.5 },
       { transform: `translate(${distance}px, 0) rotate(${rotEnd}deg)` }],
      { duration: 3200, easing: "cubic-bezier(.22,.61,.36,1)", fill: "forwards" }
    );
    setTimeout(() => { try { t.remove(); } catch(_){} }, 3400);
  }
  setInterval(() => { if (Math.random() < 1/35) dentures(); }, 1000);
})();
