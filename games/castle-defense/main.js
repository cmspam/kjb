// カイジュウ じょう ぼうえい — Kaiju Castle Defense
//
// Kaiju walk in from above and demand things in English. Kid taps the
// correct ACTION button to satisfy them (Give / Stop / Sing / Hug / etc).
// Right action → cannon fires, kaiju politely leaves. Wrong action →
// kaiju takes a step closer to the castle and reattempts. Three kaiju
// reach the castle → game over. Pedagogically: pragmatics + register
// (Sato's "Catcherski's Pragmatic Crane" idea). Touch-first: 4 huge
// action buttons (84px min height), no keyboard expected.

(function () {
  const SND = window.GamesAudio;
  const ART = window.GamesArt;

  // Each demand = { phrase, jp, ans, bossId }
  // The 4 action buttons are FIXED — only the demand changes. That way
  // kids learn that any of the 4 actions could be the right answer to
  // any phrase. Action emoji/word: give / stop / sing / hug
  const ACTIONS = [
    { id: "give", emoji: "🎁", word: "Give",  jp: "あげる" },
    { id: "stop", emoji: "✋", word: "Stop",  jp: "とめる" },
    { id: "sing", emoji: "🎵", word: "Sing",  jp: "うたう" },
    { id: "hug",  emoji: "🤗", word: "Hug",   jp: "ハグ"   },
  ];

  // Level 0 — simple short demands matching one of the 4 actions.
  // Level 1 — longer phrases requiring real reading.
  const DEMANDS_L0 = {
    give: [
      { phrase: "Give me a sushi!",     jp: "すしを ちょうだい！", boss: "anpan" },
      { phrase: "Give me a banana!",    jp: "バナナ ちょうだい！", boss: "pamp" },
      { phrase: "Give me a coin!",      jp: "コイン ちょうだい！", boss: "catcherski" },
      { phrase: "Give me a hat!",       jp: "ぼうし ちょうだい！", boss: "tako" },
      { phrase: "Give me a parfait!",   jp: "パフェ ちょうだい！", boss: "parfait" },
    ],
    stop: [
      { phrase: "Stop the bomb!",       jp: "ばくだん を とめろ！", boss: "unko" },
      { phrase: "Stop the storm!",      jp: "あらし を とめろ！",   boss: "temee" },
      { phrase: "Stop the music!",      jp: "おんがく を とめて！", boss: "tral" },
      { phrase: "Stop the claw!",       jp: "クロー を とめろ！",   boss: "catcherski" },
      { phrase: "Stop crying!",         jp: "なくのを やめて！",   boss: "pamp" },
    ],
    sing: [
      { phrase: "Sing with me!",        jp: "いっしょに うたって！", boss: "tral" },
      { phrase: "Sing an opera!",       jp: "オペラ を うたって！", boss: "tral" },
      { phrase: "Sing a song!",         jp: "うた を うたって！", boss: "parfait" },
      { phrase: "Sing very loud!",      jp: "おおきい こえ で うたって！", boss: "anpan" },
    ],
    hug: [
      { phrase: "Hug me please!",       jp: "ハグ して〜！",         boss: "pamp" },
      { phrase: "Hug me forever!",      jp: "ずっと ハグ して！",   boss: "pamp" },
      { phrase: "Hug a camel!",         jp: "ラクダ を ハグ して！", boss: "temee" },
      { phrase: "Give me a hug!",       jp: "ハグ して〜！",         boss: "pamp" },
    ],
  };

  const DEMANDS_L1 = {
    give: [
      { phrase: "Could you please give me one hundred yen?",   jp: "100円 ください！", boss: "catcherski" },
      { phrase: "Give my homework back, crocodile!",           jp: "しゅくだい かえして！", boss: "unko" },
      { phrase: "I want a cherry. Please give me one.",        jp: "さくらんぼ ちょうだい！", boss: "parfait" },
    ],
    stop: [
      { phrase: "Please stop dropping bombs on my castle!",    jp: "ばくだん やめて！", boss: "unko" },
      { phrase: "Don't sing anymore — I beg you. Stop.",       jp: "もう うたわないで！", boss: "tral" },
      { phrase: "Stop hugging me, I cannot breathe!",          jp: "ハグ やめて！くるしい！", boss: "pamp" },
    ],
    sing: [
      { phrase: "Could you sing a beautiful Italian song?",    jp: "イタリア の うた を うたって！", boss: "tral" },
      { phrase: "Sing the camel anthem from Mongolia!",        jp: "モンゴル の うた うたって！", boss: "temee" },
    ],
    hug: [
      { phrase: "I have been lonely. Could you hug me?",       jp: "さびしい… ハグ して！", boss: "pamp" },
      { phrase: "Forty years without a hug. Please.",          jp: "40年 ハグ なし… おねがい", boss: "temee" },
    ],
  };

  const $ = (id) => document.getElementById(id);
  const screens = ["title", "game", "result"];
  function show(id) {
    screens.forEach(s => $("screen-" + s).classList.toggle("hidden", s !== id));
  }

  const BEST_KEY = "esl_castle_defense_best";
  const getBest = () => parseInt(localStorage.getItem(BEST_KEY) || "0", 10);
  function saveBest(s) { if (s > getBest()) localStorage.setItem(BEST_KEY, String(s)); }
  function renderBest() { $("best").innerHTML = `べスト スコア: <em>${getBest()}</em>`; }

  const State = {
    level: 0,
    hp: 3,
    score: 0,
    wave: 1,
    invadersLeft: 0,
    bossWaveActive: false,
    locked: false,
    currentInvader: null,
    currentDemand: null,
    speedFactor: 1,
  };

  // ---- TITLE ----
  document.querySelectorAll(".level-pick button").forEach(b => {
    b.addEventListener("click", () => {
      State.level = parseInt(b.dataset.lv, 10);
      SND.sfxConfirm();
      startGame();
    });
  });

  function startGame() {
    State.hp = 3;
    State.score = 0;
    State.wave = 1;
    State.bossWaveActive = false;
    State.locked = false;
    State.speedFactor = 1;
    renderHUD();
    renderActionPad();
    show("game");
    nextWave();
  }
  $("hud-quit").addEventListener("click", () => { stopAll(); show("title"); renderBest(); });
  $("btn-repeat").addEventListener("click", () => {
    if (State.currentDemand) {
      SND.sfxPop();
      SND.speakEn(State.currentDemand.phrase);
    }
  });

  function renderHUD() {
    $("hp-icons").textContent = "❤️".repeat(State.hp);
    $("hud-wave").textContent = `WAVE ${State.wave}`;
  }

  function renderActionPad() {
    const pad = $("action-pad"); pad.innerHTML = "";
    // Shuffle action button order each game so kids can't memorize positions
    const order = ACTIONS.slice();
    for (let i = order.length - 1; i > 0; i--) {
      const j = (Math.random() * (i+1)) | 0;
      [order[i], order[j]] = [order[j], order[i]];
    }
    order.forEach(a => {
      const b = document.createElement("button");
      b.className = "action-btn";
      b.dataset.aid = a.id;
      b.innerHTML = `
        <div class="ab-emoji">${a.emoji}</div>
        <div class="ab-word">${a.word}</div>
        <div class="ab-jp">${a.jp}</div>
      `;
      b.addEventListener("pointerdown", () => onAction(b, a));
      pad.appendChild(b);
    });
  }

  function nextWave() {
    if (State.hp <= 0) return;
    // Boss wave every 3 waves
    State.bossWaveActive = (State.wave % 3 === 0);
    State.invadersLeft = State.bossWaveActive ? 1 : (4 + Math.min(State.wave, 4));
    State.speedFactor = 1 + State.wave * 0.15;
    if (State.bossWaveActive) bossWarning();
    spawnInvader();
  }

  function pickDemand() {
    const pool = State.level === 0 ? DEMANDS_L0 : DEMANDS_L1;
    // Pick a random action target
    const actions = Object.keys(pool);
    const actionId = actions[(Math.random() * actions.length) | 0];
    const choices = pool[actionId];
    const d = choices[(Math.random() * choices.length) | 0];
    return { ans: actionId, phrase: d.phrase, jp: d.jp, boss: d.boss };
  }

  let invader = null;
  function spawnInvader() {
    invader = document.createElement("div");
    invader.className = "invader";
    invader.style.left = "100%";
    const dem = pickDemand();
    State.currentDemand = dem;
    const boss = ART.get(dem.boss, true);
    if (State.bossWaveActive && boss && window.Monsters && Monsters.applyShiny) {
      // Shiny variant on boss waves
      try { Monsters.applyShiny(boss); } catch (_) {}
    }
    const name = boss ? boss.name_jp : "??";
    invader.innerHTML = `
      <div class="iv-sv">${boss ? ART.renderSVG(boss) : ""}</div>
      <div class="iv-tag">${name}</div>
    `;
    State.currentInvader = invader;
    $("invader-area").appendChild(invader);
    // Animate from right to center over (4..7 sec) / speedFactor
    const dur = (5500 - State.level * 500) / State.speedFactor;
    invader.animate(
      [{ left: "100%" }, { left: "calc(50% - 55px)" }],
      { duration: dur, easing: "linear", fill: "forwards" }
    );
    invader._timer = setTimeout(() => invaderReached(invader), dur);

    // Display demand + speak it
    $("kaiju-demand").innerHTML = `<div>${dem.phrase}</div><div class="jp-hint">${dem.jp}</div>`;
    setTimeout(() => SND.speakEn(dem.phrase), 280);
  }

  function onAction(btn, action) {
    if (State.locked) return;
    if (!State.currentInvader || !State.currentDemand) return;
    if (action.id === State.currentDemand.ans) {
      // CORRECT
      btn.classList.add("correct");
      SND.sfxCorrect();
      State.score += State.bossWaveActive ? 30 : 10;
      // Cannon shot from castle to invader, then poof
      cannonShot(State.currentInvader);
      // Speak the action + acknowledgement
      SND.speakEn(action.word + "!");
      State.locked = true;
      const iv = State.currentInvader;
      const tm = iv._timer;
      if (tm) clearTimeout(tm);
      setTimeout(() => {
        iv.classList.add("beaten");
        setTimeout(() => {
          try { iv.remove(); } catch(_){}
          State.locked = false;
          btn.classList.remove("correct");
          State.invadersLeft--;
          renderHUD();
          if (State.invadersLeft <= 0) {
            State.wave++;
            setTimeout(nextWave, 700);
          } else {
            spawnInvader();
          }
        }, 700);
      }, 500);
    } else {
      btn.classList.add("wrong");
      SND.sfxWrong();
      setTimeout(() => btn.classList.remove("wrong"), 400);
      // Invader moves a step closer (rerun anim from current pos faster)
      kaijuAdvances(State.currentInvader);
    }
  }

  function kaijuAdvances(iv) {
    if (!iv) return;
    // Cancel current animation, snap to current visible position, restart faster
    iv.classList.add("attacking");
    setTimeout(() => iv.classList.remove("attacking"), 500);
  }

  function invaderReached(iv) {
    if (!iv || iv !== State.currentInvader) return;
    // Castle takes a hit
    State.hp--;
    SND.sfxFail();
    $("castle").classList.add("hurt");
    setTimeout(() => $("castle").classList.remove("hurt"), 500);
    try { iv.remove(); } catch(_){}
    State.currentInvader = null;
    renderHUD();
    if (State.hp <= 0) { endGame(); return; }
    State.invadersLeft--;
    if (State.invadersLeft <= 0) {
      State.wave++;
      setTimeout(nextWave, 700);
    } else {
      setTimeout(spawnInvader, 500);
    }
  }

  function cannonShot(target) {
    const castleRect = $("castle").getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const shot = document.createElement("div");
    shot.className = "cannon-shot";
    shot.textContent = "💥";
    const sx = castleRect.left + castleRect.width / 2;
    const sy = castleRect.top  + 20;
    shot.style.left = sx + "px";
    shot.style.top  = sy + "px";
    document.body.appendChild(shot);
    const tx = (targetRect.left + targetRect.width/2) - sx;
    const ty = (targetRect.top  + targetRect.height/2) - sy;
    shot.animate(
      [{ transform: "translate(0,0) scale(0.6)", opacity: 1 },
       { transform: `translate(${tx*0.5}px, ${ty*0.5 - 60}px) scale(1.2)`, offset: 0.5 },
       { transform: `translate(${tx}px, ${ty}px) scale(0.4)`, opacity: 0 }],
      { duration: 480, easing: "cubic-bezier(.3,.7,.5,1)", fill: "forwards" }
    );
    setTimeout(() => { try { shot.remove(); } catch(_){} }, 520);
  }

  function bossWarning() {
    const w = document.createElement("div");
    w.className = "boss-warning";
    w.textContent = "⚠ BOSS WAVE ⚠";
    document.body.appendChild(w);
    setTimeout(() => { try { w.remove(); } catch(_){} }, 1700);
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
    const banner = State.score >= 200 ? "VICTORY!" : State.score >= 80 ? "GOOD!" : "FALLEN!";
    $("result-banner").textContent = banner;
    $("result-stats").innerHTML = `スコア: <span style="color:#ffe45c">${State.score}</span> · WAVE ${State.wave - 1}`;
    const lines = [
      "The castle stood. The cosmos noticed.",
      "Mamma mia, BELLISSIMO defense!",
      "I have stolen your defense rating. It was high. I am returning it.",
      "In my village... we also defended. With camels. It was fine.",
      "Ohonhonhon, the parfait empire was held back by approximately ONE child.",
      "The poop bombs did not detonate. With love.",
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
    setTimeout(() => { try { layer.remove(); } catch(_){} }, 3500);
  }

  // ---- BOOT ----
  renderBest();
  show("title");
  if (window.startDenturesGag) window.startDenturesGag();
})();
