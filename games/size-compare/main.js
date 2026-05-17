// サイズ くらべ — Size Compare
//
// Comparative-adjective drill. Two kaiju side-by-side, voice asks
// "Which is BIGGER?" — kid taps the answer. Covers bigger / smaller /
// taller / shorter / faster / slower / heavier / lighter, plus
// kaiju-themed: smellier (for Unkodilo!), fluffier (Pampamu), older
// (Temee), louder (Tralalero opera).
//
// Each kaiju has tunable attributes; for each question we pick the
// dimension and the two kaiju, ensuring there's a clear winner.

(function () {
  const SND = window.GamesAudio;
  const ART = window.GamesArt;

  // Each kaiju on the size/speed/etc spectrum (1=low, 10=high).
  // These are intentionally absurd for the comedy (Pampamu fluffy=10,
  // Brainrot loud=10, Tako smell=2 because his ink wasn't poop, etc).
  const KAIJU = {
    tako:       { jp: "タコタコ",      size: 6, height: 6, speed: 5, weight: 5, smell: 2, fluff: 2, age: 3, loud: 5 },
    unko:       { jp: "ウンコディロ",   size: 7, height: 7, speed: 4, weight: 8, smell: 10, fluff: 1, age: 4, loud: 9 },
    tral:       { jp: "トラララ",       size: 5, height: 5, speed: 7, weight: 3, smell: 3, fluff: 1, age: 5, loud: 10 },
    pamp:       { jp: "パムパム",       size: 4, height: 3, speed: 2, weight: 2, smell: 3, fluff: 10, age: 2, loud: 4 },
    parfait:    { jp: "パフェ イワシ",   size: 4, height: 6, speed: 3, weight: 4, smell: 1, fluff: 4, age: 6, loud: 2 },
    anpan:      { jp: "アンパン マグロ", size: 5, height: 5, speed: 6, weight: 6, smell: 2, fluff: 2, age: 4, loud: 6 },
    temee:      { jp: "ティメー",        size: 8, height: 9, speed: 4, weight: 7, smell: 5, fluff: 4, age: 10, loud: 5 },
    catcherski: { jp: "キャッチャースキー", size: 8, height: 10, speed: 1, weight: 10, smell: 2, fluff: 1, age: 6, loud: 7 },
    brainrot:   { jp: "ブレインロット",  size: 10, height: 10, speed: 9, weight: 9, smell: 6, fluff: 7, age: 9, loud: 10 },
  };

  // Comparative dimensions for level 0 (simple) vs level 1 (all).
  const DIMS_L0 = [
    { key: "size",   en: "bigger",   ja: "おおきい",   antonym: { en: "smaller",  ja: "ちいさい" } },
    { key: "size",   en: "smaller",  ja: "ちいさい",   antonym: { en: "bigger",   ja: "おおきい" } },
  ];
  const DIMS_L1 = [
    { key: "size",   en: "bigger",   ja: "おおきい",   antonym: { en: "smaller",  ja: "ちいさい" } },
    { key: "size",   en: "smaller",  ja: "ちいさい",   antonym: { en: "bigger",   ja: "おおきい" } },
    { key: "height", en: "taller",   ja: "せがたかい", antonym: { en: "shorter",  ja: "せがひくい" } },
    { key: "height", en: "shorter",  ja: "せがひくい", antonym: { en: "taller",   ja: "せがたかい" } },
    { key: "speed",  en: "faster",   ja: "はやい",     antonym: { en: "slower",   ja: "おそい" } },
    { key: "speed",  en: "slower",   ja: "おそい",     antonym: { en: "faster",   ja: "はやい" } },
    { key: "weight", en: "heavier",  ja: "おもい",     antonym: { en: "lighter",  ja: "かるい" } },
    { key: "smell",  en: "smellier", ja: "くさい",     antonym: { en: "fresher",  ja: "さわやか" } },
    { key: "fluff",  en: "fluffier", ja: "ふわふわ",   antonym: { en: "less fluffy", ja: "あらい" } },
    { key: "age",    en: "older",    ja: "ふるい",     antonym: { en: "younger",  ja: "わかい" } },
    { key: "loud",   en: "louder",   ja: "うるさい",   antonym: { en: "quieter",  ja: "しずか" } },
  ];

  const $ = (id) => document.getElementById(id);
  const screens = ["title", "game", "result"];
  function show(id) { screens.forEach(s => $("screen-" + s).classList.toggle("hidden", s !== id)); }

  const BEST_KEY = "esl_size_compare_best";
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
    round: 0,
    total: 10,
    score: 0,
    dim: null,        // current comparative chosen
    A: null,          // boss id for side A
    B: null,
    winner: null,     // 'A' or 'B'
    locked: false,
  };

  function startGame() {
    State.round = 0;
    State.score = 0;
    nextRound();
  }
  $("hud-quit").addEventListener("click", () => { show("title"); renderBest(); });

  function nextRound() {
    State.round++;
    if (State.round > State.total) { finish(); return; }
    State.locked = false;
    // Pick a comparative dimension
    const dims = State.level === 0 ? DIMS_L0 : DIMS_L1;
    State.dim = dims[(Math.random() * dims.length) | 0];
    // Pick two kaiju with distinct values along that dim
    const ids = Object.keys(KAIJU);
    let A, B, attempts = 0;
    do {
      A = ids[(Math.random() * ids.length) | 0];
      B = ids[(Math.random() * ids.length) | 0];
      attempts++;
    } while (
      attempts < 20 &&
      (A === B || Math.abs(KAIJU[A][State.dim.key] - KAIJU[B][State.dim.key]) < 2)
    );
    State.A = A; State.B = B;
    // Decide winner based on comparative direction
    // The "comparative" is positive if its meaning aligns with high values:
    // bigger, taller, faster, heavier, smellier, fluffier, older, louder → high value wins
    // smaller, shorter, slower → low value wins
    const HIGH_WIN = ["bigger","taller","faster","heavier","smellier","fluffier","older","louder"];
    const aHigh = KAIJU[A][State.dim.key] > KAIJU[B][State.dim.key];
    if (HIGH_WIN.includes(State.dim.en)) State.winner = aHigh ? "A" : "B";
    else                                  State.winner = aHigh ? "B" : "A";

    renderRound();
  }

  function renderRound() {
    $("hud-progress").textContent = `${State.round}/${State.total}`;
    $("hud-score").textContent = `★ ${State.score}`;
    $("hud-question").innerHTML = `Which is <em>${State.dim.en}</em>?`;
    const sideA = $("side-A"), sideB = $("side-B");
    sideA.classList.remove("correct", "wrong");
    sideB.classList.remove("correct", "wrong");
    $("art-A").innerHTML = renderArt(State.A);
    $("art-B").innerHTML = renderArt(State.B);
    $("name-A").textContent = KAIJU[State.A].jp;
    $("name-B").textContent = KAIJU[State.B].jp;
    setTimeout(() => SND.speakEn("Which is " + State.dim.en + "?"), 240);
  }

  function renderArt(bossId) {
    const boss = ART.get(bossId);
    if (boss) return ART.renderSVG(boss);
    return `<div class="cs-emoji" style="font-size:90px;">${ART.emoji(bossId)}</div>`;
  }

  $("side-A").addEventListener("pointerdown", () => tap("A"));
  $("side-B").addEventListener("pointerdown", () => tap("B"));
  $("btn-replay").addEventListener("click", () => {
    SND.sfxPop();
    SND.speakEn("Which is " + State.dim.en + "?");
  });

  function tap(which) {
    if (State.locked) return;
    State.locked = true;
    const el = $("side-" + which);
    if (which === State.winner) {
      el.classList.add("correct");
      SND.sfxCorrect();
      State.score += 10;
      // Speak the result: e.g. "Temee is bigger!"
      const winnerName = KAIJU[State[which]].jp;
      setTimeout(() => SND.speakEn(State[which].charAt(0).toUpperCase() + State[which].slice(1) + " is " + State.dim.en + "!"), 200);
      setTimeout(() => nextRound(), 1500);
    } else {
      el.classList.add("wrong");
      SND.sfxWrong();
      State.score = Math.max(0, State.score - 3);
      // Show correct answer
      const correctEl = $("side-" + State.winner);
      setTimeout(() => correctEl.classList.add("correct"), 200);
      setTimeout(() => nextRound(), 1700);
    }
  }

  function finish() {
    saveBest(State.score);
    $("result-banner").textContent = State.score >= 80 ? "BIG BRAIN!" : State.score >= 50 ? "GREAT!" : "DONE!";
    $("result-stats").innerHTML = `スコア: <span style="color:#ffe45c">${State.score}</span> / 100`;
    const lines = [
      "Bigger. Smaller. Same. Bigger. Smaller. Same. (Tako)",
      "I have stolen your comparisons. They were correct. Mostly.",
      "Ohonhonhon, you are SLIGHTLY less of a sardine.",
      "In my village... we are all the SAME. Three hundred years ago.",
      "The cosmos is bigger. The cosmos is always bigger.",
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
    const emojis = ["🎉","⚖️","✨","💫","🎈","➕"];
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
