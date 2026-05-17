// カイジュウ じょう ぼうえい — Castle Defense (v2 rebuild)
//
// Dropped the fixed 4-button panel (Give/Stop/Sing/Hug) per user
// feedback. New mechanic:
//
// LEVEL 0 (ふつう) — Word-Emoji Match
//   Kaiju demands one thing: "Give me a cherry!"
//   4 emoji buttons at the bottom (cherry / banana / fish / ice-cream)
//   Each button shows emoji + English word — kid taps the matching one.
//   The 4 buttons CHANGE every demand (no fixed set).
//
// LEVEL 1 (むずかしい) — Sentence Builder
//   Kaiju demands two things: "I want a ___ and a ___."
//   8 emoji buttons. Kid taps two in order to fill the two blanks.
//   Order matters (the kaiju says "a cherry AND a coin" not "a coin and").
//
// Each round has 3 waves of escalating speed. The kaiju advances toward
// the castle while the kid reads. Right answer = cannon fires + kaiju
// leaves. Wrong answer = kaiju advances faster. 3 castle hits = game
// over. Per-wave shiny variant.

(function () {
  const SND = window.GamesAudio;
  const ART = window.GamesArt;

  // ----- ITEM POOL -----
  // Each item: { word, emoji, jp, kaiju (optional — for thematic linking) }
  const ITEMS = [
    { w:"cherry",   e:"🍒",  jp:"さくらんぼ", k:"parfait" },
    { w:"banana",   e:"🍌",  jp:"バナナ",   k:null },
    { w:"sushi",    e:"🍣",  jp:"すし",     k:"anpan" },
    { w:"ice cream",e:"🍦",  jp:"アイス",   k:"parfait" },
    { w:"apple",    e:"🍎",  jp:"りんご",   k:null },
    { w:"hat",      e:"🎩",  jp:"ぼうし",   k:"tako" },
    { w:"shoe",     e:"👟",  jp:"くつ",     k:"tral" },
    { w:"ribbon",   e:"🎀",  jp:"リボン",   k:"pamp" },
    { w:"coin",     e:"🪙",  jp:"コイン",   k:"catcherski" },
    { w:"bomb",     e:"💣",  jp:"ばくだん", k:"unko" },
    { w:"hump",     e:"🐫",  jp:"こぶ",     k:"temee" },
    { w:"fish",     e:"🐟",  jp:"さかな",   k:"tral" },
    { w:"bread",    e:"🍞",  jp:"パン",     k:"anpan" },
    { w:"camel",    e:"🐫",  jp:"ラクダ",   k:"temee" },
    { w:"hug",      e:"🤗",  jp:"ハグ",     k:"pamp" },
    { w:"egg",      e:"🥚",  jp:"たまご",   k:null },
    { w:"music",    e:"🎵",  jp:"おんがく", k:"tral" },
    { w:"emoji",    e:"😀",  jp:"えもじ",   k:"catcherski" },
    { w:"river",    e:"🌊",  jp:"かわ",     k:"unko" },
    { w:"moon",     e:"🌙",  jp:"つき",     k:"brainrot" },
    { w:"star",     e:"⭐",  jp:"ほし",     k:"brainrot" },
    { w:"book",     e:"📚",  jp:"ほん",     k:null },
    { w:"bell",     e:"🔔",  jp:"かね",     k:null },
    { w:"cake",     e:"🍰",  jp:"ケーキ",   k:null },
    { w:"flower",   e:"🌸",  jp:"はな",     k:null },
    { w:"sun",      e:"☀️",  jp:"たいよう", k:null },
    { w:"snowman",  e:"⛄",  jp:"ゆきだるま", k:"temee" },
    { w:"crown",    e:"👑",  jp:"おうかん", k:"anpan" },
  ];

  // Per-kaiju verb pool — the kaiju picks ONE verb at random per demand
  // (give / show / find / sing / hide / catch / eat / want).
  const VERBS = {
    tako:       [{en:"Give me", jp:"〜ちょうだい"}, {en:"Show me", jp:"〜みせて"}, {en:"I want", jp:"〜ほしい"}],
    unko:       [{en:"Drop", jp:"〜おとせ"}, {en:"I need", jp:"〜いる"}, {en:"Bring me", jp:"〜もってこい"}],
    tral:       [{en:"Sing about", jp:"〜の うた"}, {en:"Bring me", jp:"〜もってきて"}, {en:"I love", jp:"〜だいすき"}],
    pamp:       [{en:"Give me", jp:"〜ちょうだい"}, {en:"I want", jp:"〜ほしい"}, {en:"Hug a", jp:"〜を ハグ"}],
    parfait:    [{en:"Sweet, sweet", jp:"あまい あまい〜"}, {en:"Top with", jp:"〜のせて"}, {en:"I taste", jp:"〜の あじ"}],
    anpan:      [{en:"Hero needs", jp:"ヒーロー は 〜が ひつよう"}, {en:"Give me", jp:"〜ちょうだい"}, {en:"Eat my", jp:"わたし の 〜を たべて"}],
    temee:      [{en:"Bring me", jp:"〜もってこい"}, {en:"Find a", jp:"〜を さがせ"}, {en:"I have a", jp:"〜が ある"}],
    catcherski: [{en:"Insert", jp:"〜いれろ"}, {en:"Trade for", jp:"〜と こうかん"}, {en:"Steal a", jp:"〜を ぬすめ"}],
    brainrot:   [{en:"The cosmos wants", jp:"うちゅう は 〜を ほしい"}, {en:"Show me", jp:"〜みせて"}, {en:"Give me", jp:"〜ちょうだい"}],
  };

  const $ = (id) => document.getElementById(id);
  const screens = ["title", "game", "result"];
  function show(id) { screens.forEach(s => $("screen-" + s).classList.toggle("hidden", s !== id)); }

  const BEST_KEY = "esl_castle_defense_v2_best";
  const getBest = () => parseInt(localStorage.getItem(BEST_KEY) || "0", 10);
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
    hp: 3,
    score: 0,
    wave: 1,
    invadersLeft: 0,
    bossWave: false,
    locked: false,
    currentInvader: null,
    currentBossId: null,
    currentVerb: null,
    targets: [],    // 1 item (level 0) or 2 items (level 1)
    pool: [],       // emoji buttons on screen
    selected: [],   // sentence-builder slots
    speedFactor: 1,
  };

  // ----- TITLE -----
  function startGame() {
    State.hp = 3;
    State.score = 0;
    State.wave = 1;
    State.bossWave = false;
    State.locked = false;
    State.speedFactor = 1;
    renderHUD();
    show("game");
    nextWave();
  }
  $("hud-quit").addEventListener("click", () => { stopAll(); show("title"); renderBest(); });
  $("btn-repeat").addEventListener("click", () => {
    if (State.currentVerb && State.targets.length) {
      SND.sfxPop();
      speakDemand();
    }
  });

  function renderHUD() {
    $("hp-icons").textContent = "❤️".repeat(State.hp);
    $("hud-wave").textContent = "WAVE " + State.wave;
    $("hud-score").textContent = "★ " + State.score;
  }

  function nextWave() {
    if (State.hp <= 0) return;
    State.bossWave = (State.wave % 3 === 0);
    State.invadersLeft = State.bossWave ? 1 : (3 + Math.min(State.wave, 4));
    State.speedFactor = 1 + State.wave * 0.12;
    if (State.bossWave) bossWarning();
    setTimeout(spawnInvader, State.bossWave ? 1700 : 300);
  }

  function pickKaiju() {
    const all = Object.keys(VERBS);
    return all[(Math.random() * all.length) | 0];
  }

  function pickDemand(bossId) {
    const verbs = VERBS[bossId] || VERBS.tako;
    const verb = verbs[(Math.random() * verbs.length) | 0];
    const itemCount = State.level === 0 ? 1 : 2;
    // Pick items — prefer kaiju-linked items, then fill with random
    const linked = ITEMS.filter(it => it.k === bossId);
    const others = ITEMS.filter(it => it.k !== bossId);
    const pool = [];
    while (pool.length < itemCount) {
      const src = (linked.length > 0 && pool.length === 0 && Math.random() < 0.6) ? linked : others;
      const p = src[(Math.random() * src.length) | 0];
      if (!pool.find(x => x.w === p.w)) pool.push(p);
    }
    return { verb, items: pool };
  }

  function speakDemand() {
    if (State.level === 0) {
      const t = State.targets[0];
      SND.speakEn(State.currentVerb.en + " a " + t.w + "!");
    } else {
      const a = State.targets[0], b = State.targets[1];
      SND.speakEn(State.currentVerb.en + " a " + a.w + " and a " + b.w + "!");
    }
  }

  function spawnInvader() {
    State.locked = false;
    State.selected = [];
    State.currentBossId = pickKaiju();
    const boss = ART.get(State.currentBossId, true);
    if (State.bossWave && boss && window.Monsters && Monsters.applyShiny) {
      try { Monsters.applyShiny(boss); } catch (_) {}
    }
    const demand = pickDemand(State.currentBossId);
    State.currentVerb = demand.verb;
    State.targets = demand.items;

    const iv = document.createElement("div");
    iv.className = "invader";
    iv.style.left = "100%";
    iv.innerHTML = `<div class="iv-sv">${boss ? ART.renderSVG(boss) : ""}</div><div class="iv-tag">${boss ? boss.name_jp : ""}</div>`;
    State.currentInvader = iv;
    $("invader-area").appendChild(iv);
    const dur = (5500 - State.level * 500) / State.speedFactor;
    iv.animate(
      [{ left: "100%" }, { left: "calc(50% - 50px)" }],
      { duration: dur, easing: "linear", fill: "forwards" }
    );
    iv._timer = setTimeout(() => invaderReached(iv), dur);

    // Render demand text + emoji pad
    renderDemand();
    renderEmojiPad(demand);
    if (State.level === 1) {
      $("sentence-build").classList.remove("hidden");
      renderSentenceSlots();
    } else {
      $("sentence-build").classList.add("hidden");
    }

    setTimeout(speakDemand, 320);
  }

  function renderDemand() {
    const v = State.currentVerb;
    if (State.level === 0) {
      const t = State.targets[0];
      $("kd-en").innerHTML = `${v.en} a <span class="blank">?</span>!`;
      $("kd-jp").textContent = `${v.jp.replace("〜", t.jp)}！`;
    } else {
      $("kd-en").innerHTML = `${v.en} a <span class="blank" id="bl0">?</span> and a <span class="blank" id="bl1">?</span>!`;
      $("kd-jp").textContent = `${v.jp.replace("〜", State.targets[0].jp + " と " + State.targets[1].jp)}！`;
    }
  }

  function renderEmojiPad(demand) {
    const pad = $("emoji-pad"); pad.innerHTML = "";
    // Build the candidate pool: target items + distractors
    const candidates = new Set(demand.items);
    // Add distractors from this kaiju's linked items first
    const linked = ITEMS.filter(it => it.k === State.currentBossId && !demand.items.find(t => t.w === it.w));
    linked.slice(0, 2).forEach(it => candidates.add(it));
    // Then random
    const others = ITEMS.filter(it => !demand.items.find(t => t.w === it.w) && !linked.find(l => l.w === it.w));
    for (let i = others.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [others[i], others[j]] = [others[j], others[i]];
    }
    const need = State.level === 0 ? 4 : 8;
    others.slice(0, need - candidates.size).forEach(it => candidates.add(it));
    // Shuffle the final pad
    State.pool = [...candidates];
    for (let i = State.pool.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [State.pool[i], State.pool[j]] = [State.pool[j], State.pool[i]];
    }
    pad.style.gridTemplateColumns = State.level === 0 ? "repeat(4, 1fr)" : "repeat(4, 1fr)";
    State.pool.forEach(it => {
      const b = document.createElement("button");
      b.className = "emoji-btn";
      b.dataset.word = it.w;
      b.innerHTML = `<div class="eb-emoji">${it.e}</div><div class="eb-word">${it.w}</div>`;
      b.addEventListener("pointerdown", () => tapEmoji(b, it));
      pad.appendChild(b);
    });
  }

  function renderSentenceSlots() {
    const slots = $("sb-slots"); slots.innerHTML = "";
    for (let i = 0; i < State.targets.length; i++) {
      const sl = document.createElement("div");
      sl.className = "sb-slot" + (State.selected[i] ? " filled" : "");
      sl.textContent = State.selected[i] ? State.selected[i].e : "?";
      slots.appendChild(sl);
    }
    $("sb-submit").disabled = State.selected.length < State.targets.length;
  }

  function tapEmoji(btn, it) {
    if (State.locked) return;
    if (State.level === 0) {
      // Direct compare to target[0]
      if (it.w === State.targets[0].w) handleCorrect(btn, it);
      else handleWrong(btn);
    } else {
      // Sentence builder: append to slots
      if (State.selected.length < State.targets.length) {
        State.selected.push(it);
        // Fill the blank in the kd-en
        const blank = document.getElementById("bl" + (State.selected.length - 1));
        if (blank) { blank.textContent = it.e + " " + it.w; blank.classList.add("filled"); }
        renderSentenceSlots();
        if (State.selected.length === State.targets.length) {
          // Auto-submit after a beat
        }
      }
    }
  }
  $("sb-submit").addEventListener("click", () => {
    if (State.locked) return;
    if (State.selected.length < State.targets.length) return;
    // Check order
    const correct = State.selected.every((s, i) => s.w === State.targets[i].w);
    if (correct) handleCorrect(null, null);
    else handleWrongSentence();
  });

  function handleCorrect(btn, it) {
    State.locked = true;
    if (btn) btn.classList.add("correct");
    SND.sfxCorrect();
    State.score += State.bossWave ? 30 : 10;
    // Speak full success
    if (State.level === 0) SND.speakEn(State.targets[0].w + "!");
    else SND.speakEn(State.targets.map(t => t.w).join(" and ") + "!");
    cannonShot(State.currentInvader);
    const iv = State.currentInvader; const tm = iv._timer;
    if (tm) clearTimeout(tm);
    setTimeout(() => {
      iv.classList.add("beaten");
      setTimeout(() => {
        try { iv.remove(); } catch (_) {}
        State.locked = false;
        State.invadersLeft--;
        renderHUD();
        if (State.invadersLeft <= 0) { State.wave++; setTimeout(nextWave, 800); }
        else spawnInvader();
      }, 700);
    }, 500);
  }

  function handleWrong(btn) {
    btn.classList.add("wrong");
    SND.sfxWrong();
    setTimeout(() => btn.classList.remove("wrong"), 400);
    advanceInvader();
  }
  function handleWrongSentence() {
    SND.sfxWrong();
    // Clear selections + blanks
    State.selected = [];
    renderSentenceSlots();
    document.getElementById("bl0") && (document.getElementById("bl0").textContent = "?", document.getElementById("bl0").classList.remove("filled"));
    document.getElementById("bl1") && (document.getElementById("bl1").textContent = "?", document.getElementById("bl1").classList.remove("filled"));
    advanceInvader();
  }
  function advanceInvader() {
    // Snap-anim the invader closer
    if (!State.currentInvader) return;
    State.currentInvader.style.transition = "left 0.4s ease-in";
  }

  function invaderReached(iv) {
    if (!iv || iv !== State.currentInvader) return;
    State.hp--;
    SND.sfxFail();
    $("castle").classList.add("hurt");
    setTimeout(() => $("castle").classList.remove("hurt"), 500);
    try { iv.remove(); } catch (_) {}
    State.currentInvader = null;
    renderHUD();
    if (State.hp <= 0) { endGame(); return; }
    State.invadersLeft--;
    if (State.invadersLeft <= 0) { State.wave++; setTimeout(nextWave, 800); }
    else setTimeout(spawnInvader, 500);
  }

  function cannonShot(target) {
    if (!target) return;
    const castleRect = $("castle").getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const shot = document.createElement("div");
    shot.className = "cannon-shot";
    shot.textContent = "💥";
    const sx = castleRect.left + castleRect.width / 2;
    const sy = castleRect.top + 20;
    shot.style.left = sx + "px";
    shot.style.top = sy + "px";
    document.body.appendChild(shot);
    const tx = (targetRect.left + targetRect.width / 2) - sx;
    const ty = (targetRect.top + targetRect.height / 2) - sy;
    shot.animate(
      [{ transform: "translate(0,0) scale(0.6)", opacity: 1 },
       { transform: `translate(${tx*0.5}px, ${ty*0.5 - 60}px) scale(1.2)`, offset: 0.5 },
       { transform: `translate(${tx}px, ${ty}px) scale(0.4)`, opacity: 0 }],
      { duration: 480, easing: "cubic-bezier(.3,.7,.5,1)", fill: "forwards" }
    );
    setTimeout(() => { try { shot.remove(); } catch (_) {} }, 520);
  }

  function bossWarning() {
    const w = document.createElement("div");
    w.className = "boss-warning";
    w.textContent = "⚠ SHINY WAVE ⚠";
    document.body.appendChild(w);
    setTimeout(() => { try { w.remove(); } catch (_) {} }, 1700);
    SND.sfxFail();
  }

  function stopAll() {
    State.locked = false;
    State.currentInvader = null;
    $("invader-area").innerHTML = "";
  }

  function endGame() {
    saveBest(State.score);
    State.locked = true;
    const banner = State.score >= 200 ? "VICTORY!" : State.score >= 80 ? "DEFENDED" : "FALLEN";
    $("result-banner").textContent = banner;
    $("result-stats").innerHTML = `スコア: <span style="color:#ffe45c">${State.score}</span> · WAVE ${State.wave - 1}`;
    const lines = [
      "The castle stood. Brave defender.",
      "Mamma mia! BELLISSIMO defense!",
      "I have stolen your defense rating. It was high.",
      "In my village... we also defended. With camels.",
      "The cosmos has observed your effort.",
    ];
    $("result-msg").textContent = lines[(Math.random()*lines.length)|0];
    stopAll();
    show("result");
    spawnConfetti(34);
  }

  $("btn-again").addEventListener("click", () => { SND.sfxConfirm(); startGame(); });
  $("btn-home").addEventListener("click", () => { SND.sfxConfirm(); show("title"); renderBest(); });

  function spawnConfetti(n) {
    const layer = document.createElement("div");
    layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:900;overflow:hidden;";
    document.body.appendChild(layer);
    const emojis = ["🎉","🎊","🏰","✨","💫","💥"];
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
    setTimeout(() => { try { layer.remove(); } catch (_) {} }, 3500);
  }

  // ----- BOOT -----
  renderBest();
  show("title");
})();
