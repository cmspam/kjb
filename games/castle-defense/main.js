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

  // ----- ITEM POOL (60+ items with category tags) -----
  // cat: food / weapon / animal / tool / cosmic / clothing / nature / body
  // Each kaiju draws preferentially from 2-3 categories (their "demand
  // profile") so each fight has a distinct vocabulary slice. Reviewers
  // flagged the prior 28-item pool as too thin for 20+ waves.
  const ITEMS = [
    // food
    { w:"cherry",     e:"🍒",  jp:"さくらんぼ", k:"parfait",    cat:"food" },
    { w:"banana",     e:"🍌",  jp:"バナナ",     k:null,         cat:"food" },
    { w:"sushi",      e:"🍣",  jp:"すし",       k:"anpan",      cat:"food" },
    { w:"ice cream",  e:"🍦",  jp:"アイス",     k:"parfait",    cat:"food" },
    { w:"apple",      e:"🍎",  jp:"りんご",     k:null,         cat:"food" },
    { w:"bread",      e:"🍞",  jp:"パン",       k:"anpan",      cat:"food" },
    { w:"egg",        e:"🥚",  jp:"たまご",     k:null,         cat:"food" },
    { w:"cake",       e:"🍰",  jp:"ケーキ",     k:null,         cat:"food" },
    { w:"donut",      e:"🍩",  jp:"ドーナツ",   k:null,         cat:"food" },
    { w:"pizza",      e:"🍕",  jp:"ピザ",       k:null,         cat:"food" },
    { w:"strawberry", e:"🍓",  jp:"いちご",     k:"parfait",    cat:"food" },
    { w:"hamburger",  e:"🍔",  jp:"ハンバーガー",k:null,        cat:"food" },
    { w:"dumpling",   e:"🥟",  jp:"ぎょうざ",   k:"temee",      cat:"food" },
    { w:"takoyaki",   e:"🐙",  jp:"たこやき",   k:"tako",       cat:"food" },
    // weapon
    { w:"bomb",       e:"💣",  jp:"ばくだん",   k:"unko",       cat:"weapon" },
    { w:"sword",      e:"⚔️",  jp:"けん",       k:null,         cat:"weapon" },
    { w:"shield",     e:"🛡",  jp:"たて",       k:null,         cat:"weapon" },
    { w:"fire",       e:"🔥",  jp:"ひ",         k:"unko",       cat:"weapon" },
    { w:"rocket",     e:"🚀",  jp:"ロケット",   k:null,         cat:"weapon" },
    // animal
    { w:"fish",       e:"🐟",  jp:"さかな",     k:"tral",       cat:"animal" },
    { w:"camel",      e:"🐫",  jp:"ラクダ",     k:"temee",      cat:"animal" },
    { w:"monkey",     e:"🐒",  jp:"サル",       k:"temee",      cat:"animal" },
    { w:"cat",        e:"🐱",  jp:"ねこ",       k:null,         cat:"animal" },
    { w:"dog",        e:"🐶",  jp:"いぬ",       k:null,         cat:"animal" },
    { w:"bee",        e:"🐝",  jp:"ハチ",       k:null,         cat:"animal" },
    { w:"bird",       e:"🐦",  jp:"とり",       k:null,         cat:"animal" },
    { w:"lion",       e:"🦁",  jp:"ライオン",   k:"brainrot",   cat:"animal" },
    { w:"frog",       e:"🐸",  jp:"カエル",     k:"tral",       cat:"animal" },
    { w:"crocodile",  e:"🐊",  jp:"ワニ",       k:"unko",       cat:"animal" },
    // tool / mechanical
    { w:"coin",       e:"🪙",  jp:"コイン",     k:"catcherski", cat:"tool" },
    { w:"emoji",      e:"😀",  jp:"えもじ",     k:"catcherski", cat:"tool" },
    { w:"claw",       e:"🦞",  jp:"クロー",     k:"catcherski", cat:"tool" },
    { w:"key",        e:"🔑",  jp:"かぎ",       k:null,         cat:"tool" },
    { w:"book",       e:"📚",  jp:"ほん",       k:null,         cat:"tool" },
    { w:"bell",       e:"🔔",  jp:"かね",       k:null,         cat:"tool" },
    { w:"phone",      e:"📱",  jp:"でんわ",     k:"catcherski", cat:"tool" },
    // cosmic
    { w:"moon",       e:"🌙",  jp:"つき",       k:"brainrot",   cat:"cosmic" },
    { w:"star",       e:"⭐",  jp:"ほし",       k:"brainrot",   cat:"cosmic" },
    { w:"sun",        e:"☀️",  jp:"たいよう",   k:null,         cat:"cosmic" },
    { w:"galaxy",     e:"🌌",  jp:"ぎんが",     k:"brainrot",   cat:"cosmic" },
    { w:"comet",      e:"☄️",  jp:"すいせい",   k:"brainrot",   cat:"cosmic" },
    // clothing
    { w:"hat",        e:"🎩",  jp:"ぼうし",     k:"tako",       cat:"clothing" },
    { w:"shoe",       e:"👟",  jp:"くつ",       k:"tral",       cat:"clothing" },
    { w:"ribbon",     e:"🎀",  jp:"リボン",     k:"pamp",       cat:"clothing" },
    { w:"crown",      e:"👑",  jp:"おうかん",   k:"anpan",      cat:"clothing" },
    { w:"glasses",    e:"👓",  jp:"めがね",     k:null,         cat:"clothing" },
    { w:"sock",       e:"🧦",  jp:"くつした",   k:null,         cat:"clothing" },
    // nature
    { w:"river",      e:"🌊",  jp:"かわ",       k:"unko",       cat:"nature" },
    { w:"flower",     e:"🌸",  jp:"はな",       k:null,         cat:"nature" },
    { w:"tree",       e:"🌳",  jp:"き",         k:null,         cat:"nature" },
    { w:"mountain",   e:"⛰️",  jp:"やま",       k:"temee",      cat:"nature" },
    { w:"snowman",    e:"⛄",  jp:"ゆきだるま", k:"temee",      cat:"nature" },
    { w:"rainbow",    e:"🌈",  jp:"にじ",       k:"pamp",       cat:"nature" },
    { w:"lightning",  e:"⚡",  jp:"いなずま",   k:"brainrot",   cat:"nature" },
    // body / abstract
    { w:"hug",        e:"🤗",  jp:"ハグ",       k:"pamp",       cat:"body" },
    { w:"hump",       e:"🐪",  jp:"こぶ",       k:"temee",      cat:"body" },
    { w:"face",       e:"😀",  jp:"かお",       k:"anpan",      cat:"body" },
    { w:"eye",        e:"👁",  jp:"め",         k:null,         cat:"body" },
    { w:"music",      e:"🎵",  jp:"おんがく",   k:"tral",       cat:"body" },
    { w:"smile",      e:"😄",  jp:"えがお",     k:"pamp",       cat:"body" },
    { w:"heart",      e:"❤️",  jp:"こころ",     k:"pamp",       cat:"body" },
    { w:"sparkle",    e:"✨",  jp:"きらきら",   k:"parfait",    cat:"cosmic" },
  ];
  // Per-kaiju category preferences. Each kaiju draws ~60% of distractor
  // items from their preferred categories so their fights feel distinct.
  const KAIJU_CATS = {
    tako:       ["food","clothing"],
    unko:       ["weapon","nature","animal"],
    tral:       ["animal","clothing","body"],
    pamp:       ["body","clothing","nature"],
    parfait:    ["food","cosmic"],
    anpan:      ["food","clothing","body"],
    temee:      ["food","nature","animal"],
    catcherski: ["tool","cosmic"],
    brainrot:   ["cosmic","nature","animal"],
  };

  // Per-kaiju verb pool. Each kaiju has their characteristic verbs +
  // a few shared ones. Verb selection drives the demand structure.
  const VERBS = {
    tako:       [{en:"Give me", jp:"〜ちょうだい"}, {en:"Show me", jp:"〜みせて"}, {en:"I want", jp:"〜ほしい"}, {en:"Buy me", jp:"〜かって"}],
    unko:       [{en:"Drop", jp:"〜おとせ"}, {en:"I need", jp:"〜いる"}, {en:"Bring me", jp:"〜もってこい"}, {en:"Throw", jp:"〜なげろ"}],
    tral:       [{en:"Sing about", jp:"〜の うた"}, {en:"Bring me", jp:"〜もってきて"}, {en:"I love", jp:"〜だいすき"}, {en:"Find me", jp:"〜さがして"}],
    pamp:       [{en:"Give me", jp:"〜ちょうだい"}, {en:"I want", jp:"〜ほしい"}, {en:"Hug a", jp:"〜を ハグ"}, {en:"Pet a", jp:"〜なでて"}],
    parfait:    [{en:"Sweet, sweet", jp:"あまい あまい〜"}, {en:"Top with", jp:"〜のせて"}, {en:"I taste", jp:"〜の あじ"}, {en:"Eat", jp:"〜たべて"}],
    anpan:      [{en:"Hero needs", jp:"ヒーロー は 〜が ひつよう"}, {en:"Give me", jp:"〜ちょうだい"}, {en:"Eat my", jp:"わたし の 〜を たべて"}],
    temee:      [{en:"Bring me", jp:"〜もってこい"}, {en:"Find a", jp:"〜を さがせ"}, {en:"I have a", jp:"〜が ある"}, {en:"Carry a", jp:"〜はこべ"}],
    catcherski: [{en:"Insert", jp:"〜いれろ"}, {en:"Trade for", jp:"〜と こうかん"}, {en:"Steal a", jp:"〜を ぬすめ"}, {en:"Hack a", jp:"〜を ハック"}],
    brainrot:   [{en:"The cosmos wants", jp:"うちゅう は 〜を ほしい"}, {en:"Show me", jp:"〜みせて"}, {en:"Devour", jp:"〜を のみこめ"}],
  };

  // ----- LEVEL 1 TEMPLATES -----
  // Reviewers called out that "I want a ___ and a ___" is the only
  // template at hard mode — gameplay ceiling hits immediately. Adding
  // a ladder of templates so kids learn function-word ordering
  // through real grammar variation. Each template is { en (with
  // {0}/{1} slots), jp (matched), slots:2 }.
  const TEMPLATES = [
    { en:"I want a {0} and a {1}.",        jp:"〜と〜が ほしい。",         slots:2 },
    { en:"Give me a {0}, then a {1}.",     jp:"まず〜、つぎに〜。",         slots:2 },
    { en:"A {0} before a {1}.",             jp:"〜の まえ に〜。",            slots:2 },
    { en:"I have a {0} but no {1}.",        jp:"〜は ある、〜は ない。",     slots:2 },
    { en:"Find a {0} for the {1}.",         jp:"〜の ために〜を さがせ。",    slots:2 },
    { en:"Drop the {0}, keep the {1}.",     jp:"〜を おとして、〜を のこせ。", slots:2 },
    { en:"Trade a {0} for a {1}.",          jp:"〜を 〜と こうかん。",        slots:2 },
    { en:"Bring me a {0} on a {1}.",        jp:"〜の うえ に〜を のせて。",  slots:2 },
  ];

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
    // Slower speed-up curve — kids need time to READ the demand and
    // FIND the emoji. Previously playtested as unplayable even by
    // fluent adults.
    State.speedFactor = 1 + State.wave * 0.05;
    if (State.bossWave) bossWarning();
    setTimeout(spawnInvader, State.bossWave ? 1700 : 300);
  }

  function pickKaiju() {
    const all = Object.keys(VERBS);
    return all[(Math.random() * all.length) | 0];
  }

  function pickDemand(bossId) {
    if (State.level === 0) {
      const verbs = VERBS[bossId] || VERBS.tako;
      const verb = verbs[(Math.random() * verbs.length) | 0];
      const items = pickKaijuItems(bossId, 1);
      return { verb, items, template: null };
    } else {
      // Sentence template — pick a random one for variety.
      const template = TEMPLATES[(Math.random() * TEMPLATES.length) | 0];
      const items = pickKaijuItems(bossId, template.slots);
      return { verb: null, template, items };
    }
  }
  function pickKaijuItems(bossId, n) {
    // Bias item selection toward this kaiju's preferred categories so
    // fights feel different per kaiju.
    const linked = ITEMS.filter(it => it.k === bossId);
    const cats = KAIJU_CATS[bossId] || [];
    const inCat = ITEMS.filter(it => it.k !== bossId && cats.includes(it.cat));
    const others = ITEMS.filter(it => it.k !== bossId && !cats.includes(it.cat));
    const out = [];
    while (out.length < n) {
      let pool;
      const r = Math.random();
      if (linked.length > 0 && r < 0.45) pool = linked;
      else if (inCat.length > 0 && r < 0.85) pool = inCat;
      else pool = others;
      const p = pool[(Math.random() * pool.length) | 0];
      if (!out.find(x => x.w === p.w)) out.push(p);
    }
    return out;
  }

  function speakDemand() {
    // Use per-kaiju voice profile so Catcherski sounds robot-deep,
    // Pampamu sounds high-and-cute, Temee sounds old-and-slow, etc.
    // Same kaiju identity across all 3 games (producer note).
    let sentence;
    if (State.level === 0) {
      const t = State.targets[0];
      sentence = State.currentVerb.en + " a " + t.w + "!";
    } else {
      const t = State.currentTemplate;
      sentence = t.en.replace("{0}", State.targets[0].w).replace("{1}", State.targets[1].w);
    }
    SND.speakAsKaiju(State.currentBossId, sentence);
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
    State.currentTemplate = demand.template;
    State.targets = demand.items;

    const iv = document.createElement("div");
    iv.className = "invader";
    iv.style.left = "100%";
    iv.innerHTML = `<div class="iv-sv">${boss ? ART.renderSVG(boss) : ""}</div><div class="iv-tag">${boss ? boss.name_jp : ""}</div>`;
    State.currentInvader = iv;
    $("invader-area").appendChild(iv);
    // Much slower base duration — even fluent adults couldn't keep up
    // with the prior 4-5 second walk. Level 0 (simple word match) gets
    // 10 seconds; Level 1 (sentence builder) gets 14 seconds to read,
    // parse, and find two correct emojis in order.
    const baseDur = State.level === 0 ? 10000 : 14000;
    const dur = baseDur / State.speedFactor;
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
    if (State.level === 0) {
      const v = State.currentVerb;
      const t = State.targets[0];
      $("kd-en").innerHTML = `${v.en} a <span class="blank">?</span>!`;
      $("kd-jp").textContent = `${v.jp.replace("〜", t.jp)}！`;
    } else {
      const t = State.currentTemplate;
      let html = t.en.replace("{0}", '<span class="blank" id="bl0">?</span>').replace("{1}", '<span class="blank" id="bl1">?</span>');
      $("kd-en").innerHTML = html;
      // JP gloss interpolation
      let jp = t.jp;
      const replacements = [State.targets[0].jp, State.targets[1].jp];
      jp = jp.replace("〜", replacements[0]).replace("〜", replacements[1]);
      $("kd-jp").textContent = jp;
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
    // Contribute to cross-game mastery store
    recordKaijuDefeated(State.currentBossId);
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
    // Wrong-answer penalty: shorten the remaining time by ~30%. The
    // invader is mid-animation already, so we replace the animation
    // with one that finishes its remaining distance in less time.
    if (!State.currentInvader) return;
    const iv = State.currentInvader;
    if (iv._timer) { clearTimeout(iv._timer); iv._timer = null; }
    const computed = window.getComputedStyle(iv).left;
    iv.style.left = computed;       // freeze position
    setTimeout(() => {
      const remaining = 2400 / State.speedFactor;  // ~2.4s left after a miss
      iv.animate(
        [{ left: computed }, { left: "calc(50% - 50px)" }],
        { duration: remaining, easing: "linear", fill: "forwards" }
      );
      iv._timer = setTimeout(() => invaderReached(iv), remaining);
    }, 20);
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

  // ----- CROSS-GAME MASTERY -----
  // Same localStorage key as sentence-flappy and story-quest. Each
  // wave-win adds to the kaiju's castle-defense count. Landing page
  // sums across the three games for a unified per-kaiju mastery %.
  const MASTERY_KEY = "esl_kaiju_mastery";
  function loadMastery() {
    try { return JSON.parse(localStorage.getItem(MASTERY_KEY) || "{}"); } catch (_) { return {}; }
  }
  function saveMastery(m) { try { localStorage.setItem(MASTERY_KEY, JSON.stringify(m)); } catch (_) {} }
  function recordKaijuDefeated(bossId) {
    if (!bossId) return;
    const m = loadMastery();
    if (!m[bossId]) m[bossId] = {};
    m[bossId].castle = (m[bossId].castle || 0) + 1;
    saveMastery(m);
  }

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
