// ワード ハント — Word Hunt
//
// Hidden-object game reusing KJB's existing ending illustrations as
// scenes. Voice plays an English word, kid taps the matching object
// in the scene. A hot/cold indicator pops up after each wrong tap
// pointing the kid closer to the target. Timed round; each correct
// find = 10 points + bonus for hot streak. Pedagogy: noun vocabulary
// + image-word binding in rich contexts.

(function () {
  const SND = window.GamesAudio;

  // ---- SCENES ----
  // For each ending PNG, define hotspots as approximate % coordinates
  // (cx, cy) plus the target word and an optional JP hint. The PNGs
  // are 4:3 — coordinates are tuned to the visible content.
  // (Coordinates eyeballed from the illustrations the user supplied.)

  const SCENES = {
    tako: {
      src: "../../assets/images/endings/tako.png",
      blurb: "Osaka takoyaki takeover",
      items: [
        { w: "octopus",   jp: "たこ",       cx: 50, cy: 70 },
        { w: "lantern",   jp: "ちょうちん",  cx: 18, cy: 35 },
        { w: "moon",      jp: "つき",        cx: 80, cy: 14 },
        { w: "sign",      jp: "かんばん",    cx: 25, cy: 60 },
        { w: "star",      jp: "ほし",        cx: 92, cy: 22 },
        { w: "hat",       jp: "ぼうし",      cx: 50, cy: 32 },
      ],
    },
    unko: {
      src: "../../assets/images/endings/unko.png",
      blurb: "Brown Tokyo, poop everywhere",
      items: [
        { w: "tower",     jp: "タワー",      cx: 50, cy: 30 },
        { w: "river",     jp: "かわ",        cx: 50, cy: 78 },
        { w: "crocodile", jp: "ワニ",        cx: 75, cy: 50 },
        { w: "bomb",      jp: "ばくだん",    cx: 30, cy: 60 },
        { w: "museum",    jp: "はくぶつかん", cx: 25, cy: 70 },
        { w: "people",    jp: "ひと",        cx: 60, cy: 88 },
      ],
    },
    tral: {
      src: "../../assets/images/endings/tral.png",
      blurb: "Italian opera Shibuya",
      items: [
        { w: "fish",      jp: "さかな",      cx: 50, cy: 55 },
        { w: "shoe",      jp: "くつ",        cx: 40, cy: 75 },
        { w: "music",     jp: "おんがく",    cx: 70, cy: 20 },
        { w: "banner",    jp: "バナー",      cx: 50, cy: 18 },
        { w: "crowd",     jp: "ひとごみ",    cx: 20, cy: 80 },
        { w: "podium",    jp: "ステージ",    cx: 50, cy: 80 },
      ],
    },
    pamp: {
      src: "../../assets/images/endings/pamp.png",
      blurb: "Pink fluffy collection palace",
      items: [
        { w: "shelf",     jp: "たな",        cx: 30, cy: 50 },
        { w: "throne",    jp: "おうざ",      cx: 60, cy: 55 },
        { w: "heart",     jp: "ハート",      cx: 80, cy: 22 },
        { w: "ribbon",    jp: "リボン",      cx: 20, cy: 25 },
        { w: "plushy",    jp: "ぬいぐるみ",  cx: 50, cy: 60 },
        { w: "child",     jp: "こども",      cx: 40, cy: 40 },
      ],
    },
    parfait: {
      src: "../../assets/images/endings/parfait.png",
      blurb: "Tsukiji parfait takeover",
      items: [
        { w: "parfait",   jp: "パフェ",      cx: 50, cy: 55 },
        { w: "cherry",    jp: "さくらんぼ",  cx: 50, cy: 22 },
        { w: "cream",     jp: "クリーム",    cx: 60, cy: 40 },
        { w: "fin",       jp: "ヒレ",        cx: 50, cy: 70 },
        { w: "chef",      jp: "シェフ",      cx: 20, cy: 70 },
        { w: "counter",   jp: "カウンター",  cx: 50, cy: 80 },
      ],
    },
    anpan: {
      src: "../../assets/images/endings/anpan.png",
      blurb: "Anpan-Maguro throne",
      items: [
        { w: "statue",    jp: "ぞう",        cx: 50, cy: 45 },
        { w: "flag",      jp: "はた",        cx: 80, cy: 25 },
        { w: "bread",     jp: "パン",        cx: 50, cy: 38 },
        { w: "tuna",      jp: "マグロ",      cx: 50, cy: 60 },
        { w: "crowd",     jp: "ひとごみ",    cx: 50, cy: 85 },
        { w: "tree",      jp: "き",          cx: 15, cy: 40 },
      ],
    },
    temee: {
      src: "../../assets/images/endings/temee.png",
      blurb: "Gobi-Tokyo with mandatory humps",
      items: [
        { w: "camel",     jp: "ラクダ",      cx: 70, cy: 60 },
        { w: "thermometer", jp: "おんどけい", cx: 50, cy: 42 },
        { w: "hump",      jp: "こぶ",        cx: 70, cy: 50 },
        { w: "dog",       jp: "いぬ",        cx: 28, cy: 75 },
        { w: "snow",      jp: "ゆき",        cx: 50, cy: 90 },
        { w: "balloon",   jp: "ふうせん",    cx: 18, cy: 18 },
      ],
    },
    catcherski: {
      src: "../../assets/images/endings/catcherski.png",
      blurb: "Hacked emoji prison",
      items: [
        { w: "claw",      jp: "クロー",      cx: 50, cy: 25 },
        { w: "robot",     jp: "ロボット",    cx: 50, cy: 50 },
        { w: "screen",    jp: "がめん",      cx: 50, cy: 55 },
        { w: "coin",      jp: "コイン",      cx: 25, cy: 90 },
        { w: "drone",     jp: "ドローン",    cx: 78, cy: 18 },
        { w: "child",     jp: "こども",      cx: 30, cy: 70 },
      ],
    },
    brainrot: {
      src: "../../assets/images/endings/brainrot.png",
      blurb: "Cosmic finale",
      items: [
        { w: "lion",      jp: "ライオン",    cx: 50, cy: 40 },
        { w: "mane",      jp: "たてがみ",    cx: 50, cy: 32 },
        { w: "star",      jp: "ほし",        cx: 80, cy: 20 },
        { w: "moon",      jp: "つき",        cx: 20, cy: 25 },
        { w: "blackhole", jp: "ブラックホール", cx: 50, cy: 50 },
        { w: "tail",      jp: "しっぽ",      cx: 75, cy: 65 },
      ],
    },
  };

  const $ = (id) => document.getElementById(id);
  const screens = ["title", "game", "result"];
  function show(id) { screens.forEach(s => $("screen-" + s).classList.toggle("hidden", s !== id)); }

  const BEST_KEY = "esl_word_hunt_best";
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
    sceneId: null,
    scene: null,
    foundIds: [],   // indices of items that have been found
    targetIdx: -1,
    score: 0,
    deadline: 0,
    timer: null,
    locked: false,
    hotStreak: 0,
  };

  function startGame() {
    // Pick a random scene the kid hasn't been on this session ideally
    const ids = Object.keys(SCENES);
    State.sceneId = ids[(Math.random() * ids.length) | 0];
    State.scene = SCENES[State.sceneId];
    State.foundIds = [];
    State.score = 0;
    State.hotStreak = 0;
    State.locked = false;
    const seconds = State.level === 0 ? 60 : 45;
    State.deadline = performance.now() + seconds * 1000;
    $("scene-img").src = State.scene.src;
    show("game");
    pickNextTarget();
    if (State.timer) clearInterval(State.timer);
    State.timer = setInterval(updateTime, 200);
  }

  // Per-question, place 3 VISIBLE labeled circles on the scene — one
  // over the target, two over decoy items from the same scene. Kid
  // picks one of the three. Removes the "which of 50 children?"
  // problem from the original blind-hotspot design.

  function pickNextTarget() {
    const remaining = State.scene.items
      .map((_, i) => i)
      .filter(i => !State.foundIds.includes(i));
    if (remaining.length === 0) { roundWin(); return; }
    State.targetIdx = remaining[(Math.random() * remaining.length) | 0];
    const item = State.scene.items[State.targetIdx];
    // Pick 2 distractors from the same scene (any other item)
    const others = State.scene.items
      .map((_, i) => i)
      .filter(i => i !== State.targetIdx);
    for (let i = others.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [others[i], others[j]] = [others[j], others[i]];
    }
    const candidates = [State.targetIdx, ...others.slice(0, 2)];
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    State.candidates = candidates;
    $("hud-find").innerHTML = `★ Find: <em>${item.w}</em>`;
    $("hud-jp-hint").textContent = State.level === 0 ? item.jp : "";
    $("found-count").textContent = `${State.foundIds.length} / ${State.scene.items.length}`;
    layoutCandidateCircles();
    setTimeout(() => SND.speakEn(item.w), 240);
  }

  function layoutCandidateCircles() {
    const layer = $("hotspot-layer"); layer.innerHTML = "";
    State.candidates.forEach((idx, i) => {
      const it = State.scene.items[idx];
      const h = document.createElement("div");
      h.className = "hotspot visible-choice";
      h.style.left = it.cx + "%";
      h.style.top  = it.cy + "%";
      h.dataset.idx = idx;
      h.innerHTML = `<div class="choice-letter">${String.fromCharCode(65 + i)}</div>`;
      h.addEventListener("pointerdown", (e) => onHotspot(idx, e));
      layer.appendChild(h);
    });
  }

  function onHotspot(idx, e) {
    if (State.locked || State.targetIdx < 0) return;
    const item = State.scene.items[idx];
    const rect = e.currentTarget.getBoundingClientRect();
    if (idx === State.targetIdx) {
      e.currentTarget.classList.add("found");
      SND.sfxCorrect();
      State.foundIds.push(idx);
      State.hotStreak++;
      const bonus = State.hotStreak >= 3 ? 20 : 10;
      State.score += bonus;
      ripple(rect.left + rect.width/2, rect.top + rect.height/2, true);
      setTimeout(() => SND.speakEn(item.w), 200);
      State.locked = true;
      setTimeout(() => { State.locked = false; pickNextTarget(); }, 900);
    } else {
      e.currentTarget.classList.add("miss-circle");
      SND.sfxWrong();
      State.hotStreak = 0;
      setTimeout(() => e.currentTarget.classList.remove("miss-circle"), 500);
      State.score = Math.max(0, State.score - 3);
    }
  }

  function ripple(x, y, hit) {
    const r = document.createElement("div");
    r.className = "tap-ripple" + (hit ? " hit" : "");
    r.style.left = x + "px";
    r.style.top  = y + "px";
    r.style.position = "fixed";
    r.style.zIndex = "70";
    document.body.appendChild(r);
    setTimeout(() => { try { r.remove(); } catch(_){} }, 600);
  }

  $("btn-repeat").addEventListener("click", () => {
    if (State.targetIdx >= 0) {
      SND.sfxPop();
      SND.speakEn(State.scene.items[State.targetIdx].w);
    }
  });
  $("hud-quit").addEventListener("click", () => { stopAll(); show("title"); renderBest(); });

  function updateTime() {
    const remain = Math.max(0, State.deadline - performance.now());
    const sec = Math.ceil(remain / 1000);
    const el = $("hud-time");
    el.textContent = "⏱ " + sec;
    if (sec <= 10) el.classList.add("danger"); else el.classList.remove("danger");
    if (remain <= 0) roundEnd();
  }

  function stopAll() {
    if (State.timer) clearInterval(State.timer);
    State.locked = true;
  }

  function roundWin() {
    State.score += 30;  // round-clear bonus
    roundEnd(true);
  }
  function roundEnd(cleared) {
    stopAll();
    saveBest(State.score);
    $("result-banner").textContent = cleared ? "ALL FOUND!" : "TIME UP";
    $("result-stats").innerHTML = `スコア: <span style="color:#ffe45c">${State.score}</span> · みつけた: ${State.foundIds.length}/${State.scene.items.length}`;
    const lines = [
      "BINGO. BONGO. BUNGO. You found my brother. (Tako)",
      "I have stolen your search results. They were correct. I am returning them.",
      "In my village... we searched too. For three hundred years.",
      "The cosmos has observed your eye. It is mildly impressed.",
      "Ohonhonhon, even a sardine could find these. Yet here you are.",
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
    const emojis = ["🎉","🎊","🔍","⭐","✨","💫"];
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
  // Light denture gag — no boss-art import here, so inline it
  function dentures() {
    const t = document.createElement("div");
    t.textContent = "🦷";
    t.style.cssText = `position: fixed; top: ${20 + Math.random()*50}%; left: -120px;
      font-size: ${56 + Math.random()*40}px;
      z-index: 999; pointer-events: none;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35));`;
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
  setInterval(() => { if (Math.random() < 1/30) dentures(); }, 1000);
})();
