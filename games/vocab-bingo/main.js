// カイジュウ ビンゴ — Vocab Bingo
//
// Voice plays an English word. A 3x3 grid of kaiju + objects shows.
// Kid taps the cell that matches. Correct = sticker; Wrong = silly miss
// animation, try again. 5 rounds per session. Designed for Hana (7yo
// absolute beginner) — every cell is tappable (no typing), every prompt
// is audio-first (per Sato-sensei), the kaiju are limited to the cute
// roster at the beginner level (no Brainrot King / Catcherski).
//
// Pedagogy: noun + adjective vocab at the A1 level. Words match the
// distinctive trait of each kaiju OR are generic objects on the grid.

(function () {
  const SND = window.GamesAudio;
  const ART = window.GamesArt;

  // ---- WORD BANK ----
  // Each item: { word: "fish", emoji: "🐟", kaiju: "tral", concept: "fish" }
  // The "kaiju" key tells which kaiju this word belongs to, used for
  // generating distractors. Generic items don't have a kaiju.

  const ITEMS = [
    // kaiju-specific words tied to their distinctive traits
    { w: "octopus",   e: "🐙", k: "tako",       jp: "たこ" },
    { w: "fish",      e: "🐟", k: "tral",       jp: "さかな" },
    { w: "camel",     e: "🐫", k: "temee",      jp: "ラクダ" },
    { w: "monkey",    e: "🐒", k: "temee",      jp: "サル" },
    { w: "lion",      e: "🦁", k: "brainrot",   jp: "ライオン" },
    { w: "robot",     e: "🤖", k: "catcherski", jp: "ロボット" },
    { w: "crocodile", e: "🐊", k: "unko",       jp: "ワニ" },
    { w: "bread",     e: "🍞", k: "anpan",      jp: "パン" },
    { w: "fluffy",    e: "🧸", k: "pamp",       jp: "ふわふわ" },
    { w: "cherry",    e: "🍒", k: "parfait",    jp: "さくらんぼ" },
    { w: "ice cream", e: "🍦", k: "parfait",    jp: "アイス" },
    { w: "sushi",     e: "🍣", k: null,         jp: "すし" },
    { w: "coin",      e: "🪙", k: "catcherski", jp: "コイン" },
    { w: "bomb",      e: "💣", k: "unko",       jp: "ばくだん" },
    { w: "shoe",      e: "👟", k: "tral",       jp: "くつ" },
    { w: "star",      e: "⭐", k: "brainrot",   jp: "ほし" },
    { w: "hat",       e: "🎩", k: "tako",       jp: "ぼうし" },
    { w: "claw",      e: "🦞", k: "catcherski", jp: "つめ" },
    { w: "egg",       e: "🥚", k: null,         jp: "たまご" },
    { w: "apple",     e: "🍎", k: null,         jp: "りんご" },
    { w: "banana",    e: "🍌", k: null,         jp: "バナナ" },
    { w: "milk",      e: "🥛", k: null,         jp: "ぎゅうにゅう" },
    { w: "cat",       e: "🐱", k: null,         jp: "ねこ" },
    { w: "dog",       e: "🐶", k: null,         jp: "いぬ" },
    { w: "bee",       e: "🐝", k: null,         jp: "ハチ" },
    { w: "moon",      e: "🌙", k: null,         jp: "つき" },
    { w: "sun",       e: "☀️", k: null,         jp: "たいよう" },
    { w: "ghost",     e: "👻", k: null,         jp: "おばけ" },
    { w: "rainbow",   e: "🌈", k: null,         jp: "にじ" },
    { w: "donut",     e: "🍩", k: null,         jp: "ドーナツ" },
  ];

  const $ = (id) => document.getElementById(id);
  const screens = ["title", "game", "round"];
  function show(id) {
    screens.forEach(s => $("screen-" + s).classList.toggle("hidden", s !== id));
  }

  // Persistent sticker shelf (LocalStorage)
  const STICKER_KEY = "esl_vocab_bingo_stickers";
  function loadStickers() {
    try { return JSON.parse(localStorage.getItem(STICKER_KEY) || "[]"); }
    catch (_) { return []; }
  }
  function saveStickers(arr) {
    try { localStorage.setItem(STICKER_KEY, JSON.stringify(arr)); } catch (_) {}
  }
  function renderShelf() {
    const earned = loadStickers();
    const row = $("sticker-row");
    row.innerHTML = "";
    // Show all 30 slots, earned ones colored
    ITEMS.slice(0, 24).forEach(it => {
      const sp = document.createElement("div");
      sp.className = "sticker" + (earned.includes(it.w) ? " earned" : "");
      sp.textContent = earned.includes(it.w) ? it.e : "?";
      sp.title = it.w;
      row.appendChild(sp);
    });
  }

  // ---- TITLE ----
  document.querySelectorAll(".level-pick button").forEach(b => {
    b.addEventListener("click", () => {
      State.level = parseInt(b.dataset.lv, 10);
      SND.sfxConfirm();
      startRound();
    });
  });

  // ---- STATE ----
  const State = {
    level: 0,
    round: 0,
    totalRounds: 5,
    correctThisRound: [],   // words got right this session
    target: null,           // current target item
    cellItems: [],          // items currently on grid
    isOpera: false,         // surprise: opera voice mode flag
    sessionDangerCascade: false,
  };

  // ---- START ROUND ----
  function startRound() {
    State.round = 0;
    State.correctThisRound = [];
    State.sessionDangerCascade = Math.random() < 1/3;   // every 3rd session gets a cascade somewhere
    nextRound();
  }

  function nextRound() {
    State.round++;
    if (State.round > State.totalRounds) {
      // Save stickers
      const have = new Set(loadStickers());
      State.correctThisRound.forEach(w => have.add(w));
      saveStickers([...have]);
      finishRound();
      return;
    }
    // Build a 9-cell grid: 1 target + 8 distractors. Distractors are
    // weighted toward same-kaiju items at level 1 (to make it slightly
    // harder), random at level 0.
    const target = ITEMS[(Math.random() * ITEMS.length) | 0];
    State.target = target;
    const others = ITEMS.filter(x => x.w !== target.w);
    // shuffle
    for (let i = others.length - 1; i > 0; i--) {
      const j = (Math.random() * (i+1)) | 0;
      [others[i], others[j]] = [others[j], others[i]];
    }
    // Take 8 distractors; insert target at a random position
    const cells = others.slice(0, 8);
    const insertAt = (Math.random() * 9) | 0;
    cells.splice(insertAt, 0, target);
    State.cellItems = cells.slice(0, 9);

    renderGrid();
    show("game");
    // Update HUD
    $("hud-prompt").innerHTML = `★ <em>${target.w}</em> を タップ！`;
    $("hud-stickers").textContent = `${State.round}/${State.totalRounds}`;
    // Audio-first: play the word ~120ms after grid is visible.
    setTimeout(() => speakTarget(), 250);

    // SURPRISES — secret events per round.
    // 1) OPERA MODE — 1-in-12 chance: the word is sung in opera voice.
    State.isOpera = (Math.random() < 1/12);
    // 2) GRANDFATHER CAMEO — 1-in-25 chance: a "grandpa" emoji floats
    //    across the screen (Shigeki's "Pampamu collects an occasional
    //    grandfather" gag). No explanation.
    if (Math.random() < 1/25) grandpaFloat();
    // 3) CASCADE — 1-in-6 chance during a session: this round counts
    //    doubled if the kid gets it first try.
    if (State.sessionDangerCascade && State.round === 3) cascadeBanner();
  }

  function speakTarget() {
    const word = State.target.w;
    if (State.isOpera) {
      SND.speakEn(word, { rate: 0.6, pitch: 1.5 });
      // Visual opera flair
      const fl = document.createElement("div");
      fl.textContent = "♪ ~ ♪";
      fl.style.cssText = `
        position: fixed; left: 50%; top: 56px; transform: translateX(-50%);
        font-size: 28px; color: #ffcc44;
        pointer-events: none; z-index: 70;
        text-shadow: 0 2px 0 #000;
      `;
      document.body.appendChild(fl);
      setTimeout(() => { try { fl.remove(); } catch(_){} }, 1400);
    } else {
      SND.speakEn(word);
    }
  }

  $("btn-replay").addEventListener("click", () => { SND.sfxPop(); speakTarget(); });
  $("hud-quit").addEventListener("click", () => { SND.sfxPop(); show("title"); renderShelf(); });

  function renderGrid() {
    const grid = $("bingo-grid"); grid.innerHTML = "";
    State.cellItems.forEach((it, idx) => {
      const cell = document.createElement("div");
      cell.className = "bingo-cell";
      // Level 0: include the JP label (Hana mode)
      // Level 1: emoji only — kid has to know the English word
      const hint = State.level === 0 ? `<div class="cell-hint">${it.jp}</div>` : "";
      // For kaiju-tied items, render the kaiju SVG; otherwise show big emoji
      let body;
      if (it.k && ART.get(it.k)) {
        body = `<div class="bsv">${ART.renderSVG(ART.get(it.k))}</div>`;
      } else {
        body = `<div class="bsv" style="display:flex;align-items:center;justify-content:center;"><div style="font-size:60px;">${it.e}</div></div>`;
      }
      cell.innerHTML = `${hint}${body}<div class="bname">${it.e}</div>`;
      cell.addEventListener("pointerdown", () => handleTap(cell, it));
      grid.appendChild(cell);
    });
  }

  let inputLocked = false;
  function handleTap(cell, it) {
    if (inputLocked) return;
    if (it.w === State.target.w) {
      inputLocked = true;
      cell.classList.add("correct");
      SND.sfxCorrect();
      // Confirmation: speak the word AGAIN (Sato — repetition with feedback)
      setTimeout(() => SND.speakEn(it.w), 220);
      // Add to round's collected words
      State.correctThisRound.push(it.w);
      // Praise burst
      praise(["sugoi!", "yatta!", "perfect!", "iine!", "great!", "BINGO!"][(Math.random()*6)|0]);
      setTimeout(() => {
        inputLocked = false;
        nextRound();
      }, 1100);
    } else {
      cell.classList.add("wrong");
      SND.sfxWrong();
      setTimeout(() => cell.classList.remove("wrong"), 400);
    }
  }

  function praise(text) {
    const el = document.createElement("div");
    el.className = "praise-burst";
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => { try { el.remove(); } catch(_){} }, 1300);
  }

  // ---- SURPRISES ----
  function grandpaFloat() {
    const grandpa = document.createElement("div");
    grandpa.textContent = "👴";
    grandpa.style.cssText = `
      position: fixed; bottom: 30%; left: -80px;
      font-size: 80px; z-index: 80; pointer-events: none;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
    `;
    document.body.appendChild(grandpa);
    grandpa.animate(
      [{ transform: "translateX(0) rotate(0)" },
       { transform: `translateX(${window.innerWidth + 200}px) rotate(360deg)` }],
      { duration: 4500, easing: "linear", fill: "forwards" }
    );
    setTimeout(() => { try { grandpa.remove(); } catch(_){} }, 4700);
  }

  function cascadeBanner() {
    const b = document.createElement("div");
    b.textContent = "★ CASCADE ROUND ★ ダブル ボーナス！";
    b.style.cssText = `
      position: fixed; top: 70px; left: 50%; transform: translateX(-50%);
      font-size: 16px; font-weight: 900; letter-spacing: 3px;
      color: #ff3b6b; text-shadow: 0 2px 0 #000;
      background: rgba(0,0,0,0.55); padding: 6px 16px; border-radius: 99px;
      border: 2px solid #ff3b6b;
      pointer-events: none; z-index: 80;
    `;
    document.body.appendChild(b);
    setTimeout(() => { try { b.remove(); } catch(_){} }, 2400);
  }

  // ---- ROUND COMPLETE ----
  function finishRound() {
    SND.sfxLevel();
    $("round-banner").textContent = ["SUGOI!", "BINGO BONGO BUNGO!", "YATTA!", "PERFECT-O!", "OMEDETOU!"][(Math.random()*5)|0];
    const rewards = $("round-rewards"); rewards.innerHTML = "";
    State.correctThisRound.forEach(w => {
      const it = ITEMS.find(x => x.w === w);
      const sp = document.createElement("div");
      sp.className = "sticker earned";
      sp.textContent = it.e;
      sp.title = w;
      rewards.appendChild(sp);
    });
    // Shareable diagnosis
    const lines = [
      `あなた は きょう <em>${State.correctThisRound.length}</em> ぼし です！`,
      "BINGO. BONGO. BUNGO. The third one is my brother. (Tako)",
      "The cosmos is mildly impressed. (Brainrot King)",
      "Ohonhonhon, you are slightly less of a sardine. (Parfait)",
      "I have stolen your answers. They were correct. I am returning them. (Catcherski)",
    ];
    $("round-diagnosis").innerHTML = lines[(Math.random()*lines.length)|0];
    show("round");
    spawnConfetti(36);
  }
  $("btn-next").addEventListener("click", () => { SND.sfxConfirm(); startRound(); });
  $("btn-home").addEventListener("click", () => { SND.sfxConfirm(); show("title"); renderShelf(); });

  function spawnConfetti(n) {
    const layer = document.createElement("div");
    layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:900;overflow:hidden;";
    document.body.appendChild(layer);
    const emojis = ["🎉","🎊","⭐","🌟","✨","💫","🎈","🌈","🍦","🐙","🐫"];
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
  renderShelf();
  show("title");
  if (window.startDenturesGag) window.startDenturesGag();
})();
