// スペル スリング — Spell Sling
//
// Touchscreen-first spelling game. A kaiju stands on the right;
// English word is shown as ?-blanks; an on-screen letter pad (no
// keyboard expected) fires letter projectiles at the kaiju when
// tapped. Correct letter fills the next blank and damages the kaiju.
// Wrong letter: miss animation, no damage. Complete the word → kaiju
// "defeated", combo += 1, score persists across sessions.
//
// Pedagogy: phonics + orthography pairing. Audio plays the full word
// at round start (per Sato-sensei: sound before text), then each
// correct letter is spoken as it lands.
//
// Levels:
//   0 — 入門: 3-letter words from concrete vocab Hana knows (cat, fish, sun)
//   1 — ふつう: 4-6 letter common kaiju nouns (octopus, camel, parfait)
//   2 — むずかしい: 7+ letter kaiju-specific compounds (takoyaki, hamburger)

(function () {
  const SND = window.GamesAudio;
  const ART = window.GamesArt;

  // ---- WORD BANK ----
  // Each: { word, bossId, hint } — hint shown as JP gloss.
  const WORDS = {
    0: [
      { w: "cat",  k: null,       jp: "ねこ" },
      { w: "dog",  k: null,       jp: "いぬ" },
      { w: "sun",  k: null,       jp: "たいよう" },
      { w: "egg",  k: null,       jp: "たまご" },
      { w: "bee",  k: null,       jp: "ハチ" },
      { w: "bun",  k: "anpan",    jp: "パン" },
      { w: "hat",  k: "tako",     jp: "ぼうし" },
      { w: "ice",  k: "parfait",  jp: "こおり" },
      { w: "fox",  k: null,       jp: "きつね" },
      { w: "pig",  k: null,       jp: "ぶた" },
    ],
    1: [
      { w: "octopus",  k: "tako",       jp: "たこ" },
      { w: "camel",    k: "temee",      jp: "ラクダ" },
      { w: "monkey",   k: "temee",      jp: "サル" },
      { w: "robot",    k: "catcherski", jp: "ロボット" },
      { w: "bomb",     k: "unko",       jp: "ばくだん" },
      { w: "fluffy",   k: "pamp",       jp: "ふわふわ" },
      { w: "cherry",   k: "parfait",    jp: "さくらんぼ" },
      { w: "bread",    k: "anpan",      jp: "パン" },
      { w: "claw",     k: "catcherski", jp: "つめ" },
      { w: "fish",     k: "tral",       jp: "さかな" },
      { w: "smelly",   k: "unko",       jp: "くさい" },
      { w: "lion",     k: "brainrot",   jp: "ライオン" },
      { w: "rainbow",  k: null,         jp: "にじ" },
      { w: "banana",   k: null,         jp: "バナナ" },
      { w: "sushi",    k: null,         jp: "すし" },
    ],
    2: [
      { w: "takoyaki",   k: "tako",       jp: "たこやき" },
      { w: "parfait",    k: "parfait",    jp: "パフェ" },
      { w: "crocodile",  k: "unko",       jp: "ワニ" },
      { w: "blackhole",  k: "brainrot",   jp: "ブラックホール" },
      { w: "spaghetti",  k: "tral",       jp: "スパゲッティ" },
      { w: "hamburger",  k: null,         jp: "ハンバーガー" },
      { w: "computer",   k: "catcherski", jp: "コンピューター" },
      { w: "elephant",   k: null,         jp: "ゾウ" },
      { w: "butterfly",  k: null,         jp: "ちょうちょう" },
      { w: "strawberry", k: "parfait",    jp: "いちご" },
    ],
  };

  const $ = (id) => document.getElementById(id);
  const screens = ["title", "game", "result"];
  function show(id) {
    screens.forEach(s => $("screen-" + s).classList.toggle("hidden", s !== id));
  }

  // Persistent score
  const SCORE_KEY = "esl_spell_sling_score";
  function getScore() {
    try { return JSON.parse(localStorage.getItem(SCORE_KEY) || "{}"); }
    catch (_) { return {}; }
  }
  function saveScore(s) {
    try { localStorage.setItem(SCORE_KEY, JSON.stringify(s)); } catch (_) {}
  }
  function bumpScore(amount) {
    const s = getScore();
    s.total = (s.total || 0) + amount;
    s.best  = Math.max(s.best || 0, s.streak || 0);
    saveScore(s);
  }

  function renderShelf() {
    const s = getScore();
    $("shelf").innerHTML = `これまでの スコア: <span class="score-num">${s.total || 0}</span> 文字 · ベスト コンボ: <span class="score-num">${s.best || 0}</span>`;
  }

  // ---- TITLE ----
  document.querySelectorAll(".level-pick button").forEach(b => {
    b.addEventListener("click", () => {
      State.level = parseInt(b.dataset.lv, 10);
      SND.sfxConfirm();
      State.streak = 0;
      State.round = 0;
      startRound();
    });
  });

  // ---- STATE ----
  const State = {
    level: 0,
    round: 0,
    totalRounds: 6,
    streak: 0,
    target: null,
    revealed: [],   // boolean per letter
    pendingIndex: 0,
    boss: null,
    failed: false,
    tomatoMode: false,
  };

  function startRound() {
    State.round++;
    if (State.round > State.totalRounds) { finish(); return; }
    const pool = WORDS[State.level];
    const item = pool[(Math.random() * pool.length) | 0];
    State.target = item;
    State.revealed = item.w.split("").map(() => false);
    State.pendingIndex = 0;
    State.failed = false;
    State.boss = item.k ? ART.get(item.k, true) : null;
    State.tomatoMode = Math.random() < 1/12; // ~8% tomato-rain rounds
    renderGameUI();
    show("game");
    setTimeout(() => SND.speakEn(item.w), 280);
    if (State.tomatoMode) setTimeout(tomatoRain, 1400);
  }

  function renderGameUI() {
    // Round indicator
    $("hud-rounds").textContent = `${State.round}/${State.totalRounds}`;
    $("hud-combo").textContent = "COMBO ×" + State.streak;
    $("hud-jp").textContent = `「${State.target.jp}」を スペル`;
    // Boss zone
    const zone = $("boss-zone");
    if (State.boss) {
      zone.innerHTML = `<div class="boss-sv">${ART.renderSVG(State.boss)}</div>`;
    } else {
      const fallback = ITEM_EMOJI[State.target.w] || "❓";
      zone.innerHTML = `<div class="boss-sv" style="display:flex;align-items:center;justify-content:center;font-size:180px;">${fallback}</div>`;
    }
    // Blanks
    renderBlanks();
    // Letter pad
    renderLetterPad();
  }

  const ITEM_EMOJI = {
    cat: "🐱", dog: "🐶", sun: "☀️", egg: "🥚", bee: "🐝",
    fox: "🦊", pig: "🐷", ice: "🧊",
    bun: "🍞", hat: "🎩", banana: "🍌", sushi: "🍣", rainbow: "🌈",
    hamburger: "🍔", elephant: "🐘", butterfly: "🦋", spaghetti: "🍝",
    strawberry: "🍓",
  };

  function renderBlanks() {
    const c = $("blanks"); c.innerHTML = "";
    State.target.w.split("").forEach((ch, i) => {
      const sp = document.createElement("span");
      sp.className = "blank " + (State.revealed[i] ? "fill" : "empty");
      sp.textContent = State.revealed[i] ? ch.toUpperCase() : "_";
      c.appendChild(sp);
    });
  }

  function renderLetterPad() {
    const pad = $("letter-pad");
    pad.innerHTML = "";
    // Compose 14 letter buttons — the answer letters + filler distractors
    const have = new Set(State.target.w.toLowerCase().split(""));
    const all = "abcdefghijklmnopqrstuvwxyz".split("");
    const distract = all.filter(c => !have.has(c));
    // shuffle distractors
    for (let i = distract.length - 1; i > 0; i--) {
      const j = (Math.random()*(i+1))|0;
      [distract[i], distract[j]] = [distract[j], distract[i]];
    }
    const padLetters = [...have, ...distract.slice(0, Math.max(0, 14 - have.size))];
    // shuffle pad
    for (let i = padLetters.length - 1; i > 0; i--) {
      const j = (Math.random()*(i+1))|0;
      [padLetters[i], padLetters[j]] = [padLetters[j], padLetters[i]];
    }
    padLetters.forEach(ch => {
      const b = document.createElement("button");
      b.className = "letter-btn";
      b.textContent = ch.toUpperCase();
      b.addEventListener("pointerdown", () => tapLetter(b, ch));
      pad.appendChild(b);
    });
  }

  $("btn-replay").addEventListener("click", () => { SND.sfxPop(); SND.speakEn(State.target.w); });
  $("hud-quit").addEventListener("click", () => { SND.sfxPop(); show("title"); renderShelf(); });

  function tapLetter(btn, ch) {
    // Identify what the next needed letter is. We require an in-order
    // spelling — kids reading left to right.
    const need = State.target.w[State.pendingIndex].toLowerCase();
    if (ch === need) {
      // CORRECT
      btn.classList.add("hit", "used");
      shootSling(btn, true);
      State.revealed[State.pendingIndex] = true;
      State.pendingIndex++;
      SND.sfxPop();
      // Speak the letter (phonics anchor)
      SND.speakEn(ch);
      setTimeout(() => renderBlanks(), 120);
      // Done?
      if (State.pendingIndex >= State.target.w.length) {
        setTimeout(() => roundWin(), 800);
      }
    } else {
      btn.classList.add("miss");
      shootSling(btn, false);
      SND.sfxWrong();
      setTimeout(() => btn.classList.remove("miss"), 400);
      State.failed = true;  // any miss breaks the combo (but kid keeps playing)
    }
  }

  function shootSling(btn, hit) {
    const rect = btn.getBoundingClientRect();
    const bossRect = document.querySelector(".boss-sv")?.getBoundingClientRect();
    if (!bossRect) return;
    const proj = document.createElement("div");
    proj.className = "sling-letter";
    proj.textContent = btn.textContent;
    proj.style.left = (rect.left + rect.width/2) + "px";
    proj.style.top  = (rect.top  + rect.height/2) + "px";
    document.body.appendChild(proj);
    const tx = (bossRect.left + bossRect.width/2) - (rect.left + rect.width/2);
    const ty = (bossRect.top  + bossRect.height*0.4) - (rect.top  + rect.height/2);
    proj.animate(
      [{ transform: "translate(0,0) rotate(0) scale(1)", opacity: 1 },
       { transform: `translate(${tx*0.5}px, ${ty*0.5 - 60}px) rotate(180deg) scale(1.2)`, offset: 0.5 },
       { transform: `translate(${tx}px, ${ty}px) rotate(360deg) scale(0.9)`, opacity: hit ? 1 : 0.4 }],
      { duration: 500, easing: "cubic-bezier(.4,.7,.6,1)", fill: "forwards" }
    );
    setTimeout(() => { try { proj.remove(); } catch(_){} }, 520);
    if (hit) {
      const bossEl = document.querySelector(".boss-sv");
      setTimeout(() => {
        bossEl.classList.add("hit");
        setTimeout(() => bossEl.classList.remove("hit"), 450);
      }, 500);
    }
  }

  function roundWin() {
    SND.sfxLevel();
    SND.speakEn(State.target.w);
    if (!State.failed) State.streak++;
    else                State.streak = 0;
    bumpScore(State.target.w.length);
    const s = getScore(); s.streak = State.streak; saveScore(s);
    document.querySelector(".boss-sv")?.classList.add("beaten");
    setTimeout(() => {
      // Round mini-result inline (no full screen change yet)
      // Just continue to next round
      startRound();
    }, 1400);
  }

  function finish() {
    SND.sfxLevel();
    $("result-banner").textContent = State.streak >= 5 ? "MEGA COMBO!" : State.streak >= 3 ? "STREAK!" : "DONE!";
    $("result-word").textContent  = `Combo ×${State.streak}`;
    $("result-art").innerHTML = State.boss ? ART.renderSVG(State.boss) : "";
    const lines = [
      "The cosmos has observed your spelling. The cosmos is mildly impressed.",
      "I detonated. WITH LOVE.",
      "Mamma mia! BELLISSIMO spelling!",
      "I have stolen your letters. They were correct. I am returning them.",
      `BINGO. BONGO. BUNGO. ${State.target.w.toUpperCase()} is my brother.`,
      "Ohonhonhon, you are now SLIGHTLY less of a sardine.",
    ];
    $("result-msg").textContent = lines[(Math.random()*lines.length)|0];
    show("result");
    spawnConfetti(40);
  }

  $("btn-next").addEventListener("click", () => { SND.sfxConfirm(); State.round = 0; State.streak = 0; startRound(); });
  $("btn-home").addEventListener("click", () => { SND.sfxConfirm(); show("title"); renderShelf(); });

  // ---- TOMATO RAIN secret ----
  function tomatoRain() {
    const banner = document.createElement("div");
    banner.textContent = "🍅 TOMATO RAIN 🍅";
    banner.style.cssText = `
      position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
      font-size: 18px; font-weight: 900; letter-spacing: 4px;
      color: #ff3b6b; text-shadow: 0 2px 0 #000;
      background: rgba(0,0,0,0.55); padding: 6px 16px; border-radius: 99px;
      border: 2px solid #ff3b6b; pointer-events: none; z-index: 80;
    `;
    document.body.appendChild(banner);
    setTimeout(() => { try { banner.remove(); } catch(_){} }, 2400);
    for (let i = 0; i < 14; i++) {
      setTimeout(() => {
        const t = document.createElement("div");
        t.className = "tomato";
        t.textContent = "🍅";
        t.style.left = (Math.random() * window.innerWidth) + "px";
        t.style.top = "-40px";
        document.body.appendChild(t);
        t.animate(
          [{ transform: "translateY(0) rotate(0)" },
           { transform: `translateY(${window.innerHeight + 40}px) rotate(${Math.random()*720-360}deg)` }],
          { duration: 1800 + Math.random()*900, fill: "forwards" }
        );
        setTimeout(() => { try { t.remove(); } catch(_){} }, 2800);
      }, i * 140);
    }
  }

  function spawnConfetti(n) {
    const layer = document.createElement("div");
    layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:900;overflow:hidden;";
    document.body.appendChild(layer);
    const emojis = ["🎉","🎊","⭐","🌟","✨","💫","🎈","🌈","🍅","💩"];
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
