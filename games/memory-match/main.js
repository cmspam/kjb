// メモリー マッチ — Memory Match
//
// Pairs game. Each pair is { word card, image card } where the image
// is either a KJB kaiju SVG or a big emoji. Tap two cards to flip;
// matches stay revealed, mismatches flip back. Timer + move counter.
// Pedagogy: vocab + image binding via repeated re-exposure (matching
// loop forces multiple re-reads of each word).
//
// Touch-first: cards are large flex tiles with pointerdown handlers.

(function () {
  const SND = window.GamesAudio;
  const ART = window.GamesArt;

  const ITEMS = [
    { w: "octopus",   k: "tako",       e: "🐙" },
    { w: "camel",     k: "temee",      e: "🐫" },
    { w: "lion",      k: "brainrot",   e: "🦁" },
    { w: "robot",     k: "catcherski", e: "🤖" },
    { w: "crocodile", k: "unko",       e: "🐊" },
    { w: "bread",     k: "anpan",      e: "🍞" },
    { w: "fluffy",    k: "pamp",       e: "🧸" },
    { w: "fish",      k: "tral",       e: "🐟" },
    { w: "parfait",   k: "parfait",    e: "🍦" },
    { w: "apple",     k: null,         e: "🍎" },
    { w: "banana",    k: null,         e: "🍌" },
    { w: "cat",       k: null,         e: "🐱" },
    { w: "dog",       k: null,         e: "🐶" },
    { w: "moon",      k: null,         e: "🌙" },
    { w: "sun",       k: null,         e: "☀️" },
    { w: "star",      k: null,         e: "⭐" },
    { w: "egg",       k: null,         e: "🥚" },
    { w: "ice cream", k: null,         e: "🍦" },
    { w: "bee",       k: null,         e: "🐝" },
    { w: "milk",      k: null,         e: "🥛" },
  ];

  const PAIRS_PER_LEVEL = { 0: 4, 1: 6, 2: 8 };
  const $ = (id) => document.getElementById(id);
  const screens = ["title", "game", "result"];
  function show(id) { screens.forEach(s => $("screen-" + s).classList.toggle("hidden", s !== id)); }

  const BEST_KEY = "esl_memory_match_best";
  function getBest() { try { return JSON.parse(localStorage.getItem(BEST_KEY) || "{}"); } catch (_) { return {}; } }
  function saveBest(level, time) {
    const b = getBest();
    const key = "lv" + level;
    if (!b[key] || time < b[key]) { b[key] = time; localStorage.setItem(BEST_KEY, JSON.stringify(b)); }
  }
  function renderBest() {
    const b = getBest();
    const parts = [];
    if (b.lv0) parts.push(`入門 ${b.lv0}s`);
    if (b.lv1) parts.push(`ふつう ${b.lv1}s`);
    if (b.lv2) parts.push(`むずかしい ${b.lv2}s`);
    $("best").innerHTML = parts.length ? `べストタイム: <em>${parts.join(" · ")}</em>` : "";
  }

  document.querySelectorAll(".level-pick button").forEach(b => {
    b.addEventListener("click", () => {
      State.level = parseInt(b.dataset.lv, 10);
      SND.sfxConfirm();
      startGame();
    });
  });

  const State = {
    level: 0,
    cards: [],        // flat array of { id, kind: "word"|"pic", pairId, flipped, matched }
    firstPick: null,
    secondPick: null,
    moves: 0,
    matched: 0,
    totalPairs: 0,
    startedAt: 0,
    timer: null,
    locked: false,
  };

  function startGame() {
    const n = PAIRS_PER_LEVEL[State.level];
    State.totalPairs = n;
    State.matched = 0;
    State.moves = 0;
    State.firstPick = null;
    State.secondPick = null;
    State.locked = false;
    // Pick n unique items
    const pool = ITEMS.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = (Math.random() * (i+1)) | 0;
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const chosen = pool.slice(0, n);
    // Build cards: 2 per item (word + pic)
    State.cards = [];
    chosen.forEach((it, idx) => {
      State.cards.push({ id: "w" + idx, pairId: idx, kind: "word", item: it, flipped: false, matched: false });
      State.cards.push({ id: "p" + idx, pairId: idx, kind: "pic",  item: it, flipped: false, matched: false });
    });
    // shuffle deck
    for (let i = State.cards.length - 1; i > 0; i--) {
      const j = (Math.random() * (i+1)) | 0;
      [State.cards[i], State.cards[j]] = [State.cards[j], State.cards[i]];
    }
    renderGrid();
    State.startedAt = performance.now();
    if (State.timer) clearInterval(State.timer);
    State.timer = setInterval(updateTime, 200);
    updateHUD();
    show("game");

    // SURPRISE: 1-in-5 sessions, lightning round at start — all cards
    // briefly flip up for 1.2s so kid gets a preview.
    if (Math.random() < 1/5) lightningPreview();
  }
  $("hud-quit").addEventListener("click", () => { stopGame(); show("title"); renderBest(); });

  function renderGrid() {
    const grid = $("mm-grid");
    grid.className = "mm-grid cols-" + (State.totalPairs * 2 / 4);
    grid.innerHTML = "";
    State.cards.forEach((c, idx) => {
      const cardEl = document.createElement("div");
      cardEl.className = "mm-card";
      cardEl.dataset.idx = idx;
      let frontContent;
      if (c.kind === "word") {
        frontContent = `
          <div>
            <div class="word-text">${c.item.w}</div>
            <div class="word-jp">${c.item.e}</div>
          </div>`;
      } else {
        // Picture card: BIG kaiju emoji, with the kaiju name underneath.
        // Earlier build embedded the boss SVG (viewBox 800x480) which
        // rendered too small inside a phone-sized card — the boss
        // silhouette was barely visible. Big emoji is unmistakable.
        const k = c.item.k;
        const boss = k ? ART.get(k) : null;
        const label = boss ? boss.name_jp : c.item.w;
        frontContent = `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;">
            <div class="pic-emoji" style="font-size:48px;line-height:1;">${c.item.e}</div>
            <div class="word-jp" style="font-size:10px;margin-top:4px;text-align:center;">${label}</div>
          </div>`;
      }
      cardEl.innerHTML = `
        <div class="mm-face mm-back">?</div>
        <div class="mm-face mm-front">${frontContent}</div>
      `;
      cardEl.addEventListener("pointerdown", () => tapCard(idx, cardEl));
      grid.appendChild(cardEl);
    });
  }

  function tapCard(idx, el) {
    if (State.locked) return;
    const c = State.cards[idx];
    if (c.matched || c.flipped) return;
    c.flipped = true;
    el.classList.add("flipped");
    if (c.kind === "word") SND.speakEn(c.item.w);
    else SND.sfxPop();

    if (!State.firstPick) {
      State.firstPick = { idx, el, card: c };
    } else if (!State.secondPick) {
      State.secondPick = { idx, el, card: c };
      State.moves++;
      updateHUD();
      checkMatch();
    }
  }

  function checkMatch() {
    State.locked = true;
    const a = State.firstPick, b = State.secondPick;
    if (a.card.pairId === b.card.pairId) {
      // MATCH
      setTimeout(() => {
        a.el.classList.add("matched");
        b.el.classList.add("matched");
        SND.sfxCorrect();
        a.card.matched = true;
        b.card.matched = true;
        State.matched++;
        State.firstPick = null;
        State.secondPick = null;
        State.locked = false;
        updateHUD();
        if (State.matched >= State.totalPairs) finish();
      }, 300);
    } else {
      // NO MATCH — flip back after 1s
      a.el.classList.add("wrong");
      b.el.classList.add("wrong");
      SND.sfxWrong();
      setTimeout(() => {
        a.el.classList.remove("flipped", "wrong");
        b.el.classList.remove("flipped", "wrong");
        a.card.flipped = false;
        b.card.flipped = false;
        State.firstPick = null;
        State.secondPick = null;
        State.locked = false;
      }, 1100);
    }
  }

  function updateHUD() {
    $("hud-pairs").textContent = `${State.matched}/${State.totalPairs}`;
    $("hud-moves").textContent = `moves: ${State.moves}`;
  }
  function updateTime() {
    const sec = Math.floor((performance.now() - State.startedAt) / 1000);
    $("hud-time").textContent = "⏱ " + sec;
  }
  function stopGame() {
    if (State.timer) clearInterval(State.timer);
    State.locked = true;
  }

  function lightningPreview() {
    const banner = document.createElement("div");
    banner.className = "lightning-banner";
    banner.textContent = "⚡ PREVIEW! ⚡";
    document.body.appendChild(banner);
    setTimeout(() => { try { banner.remove(); } catch(_){} }, 1300);
    // Flip all cards momentarily
    document.querySelectorAll(".mm-card").forEach(el => el.classList.add("flipped"));
    State.locked = true;
    setTimeout(() => {
      document.querySelectorAll(".mm-card").forEach(el => {
        if (!el.classList.contains("matched")) el.classList.remove("flipped");
      });
      State.locked = false;
    }, 1200);
  }

  function finish() {
    stopGame();
    const sec = Math.floor((performance.now() - State.startedAt) / 1000);
    saveBest(State.level, sec);
    const efficiency = (State.totalPairs * 2) / Math.max(1, State.moves);
    $("result-banner").textContent = efficiency >= 0.95 ? "PERFECT!" : efficiency >= 0.7 ? "GREAT!" : "DONE!";
    $("result-stats").innerHTML = `タイム: <span style="color:#ffe45c">${sec}s</span> · MOVES: ${State.moves}`;
    const lines = [
      "BINGO. BONGO. BUNGO. The third match is my brother.",
      "I have stolen your memory. It was sharp. I am returning it.",
      "Ohonhonhon, you remember almost as well as a parfait.",
      "In my village... we also matched. With camels. It took 80 years.",
      "The cosmos has observed your memory. The cosmos remembers, too.",
    ];
    $("result-msg").textContent = lines[(Math.random()*lines.length)|0];
    show("result");
    spawnConfetti(32);
    SND.sfxLevel();
  }
  $("btn-again").addEventListener("click", () => { SND.sfxConfirm(); startGame(); });
  $("btn-home").addEventListener("click", () => { SND.sfxConfirm(); show("title"); renderBest(); });

  function spawnConfetti(n) {
    const layer = document.createElement("div");
    layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:900;overflow:hidden;";
    document.body.appendChild(layer);
    const emojis = ["🎉","🎊","🃏","✨","💫","🎈"];
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
