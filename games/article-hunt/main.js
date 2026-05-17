// アーティクル ハント — Article Hunt
//
// English-article drill: a / an / the / — (zero article). Sato-sensei
// flagged this as the SINGLE BIGGEST persistent Japanese-learner gap
// (Butler 2002): Japanese has no article system at all, so kids never
// hit the pattern without explicit, high-frequency, low-stakes
// practice. This game IS that practice.
//
// Format: item appears with an emoji + the noun shown WITHOUT its
// article ("_ apple"). Kid taps the correct article. 10 items per
// round, escalating speed in hard mode.

(function () {
  const SND = window.GamesAudio;

  // Each item: { word, emoji, article, jp, sentence }
  // article: "a" | "an" | "the" | ""  (empty = zero article)
  const ITEMS = [
    // "a" — countable singular, consonant sound
    { w: "cat",       e: "🐱", a: "a",   jp: "ねこ" },
    { w: "dog",       e: "🐶", a: "a",   jp: "いぬ" },
    { w: "banana",    e: "🍌", a: "a",   jp: "バナナ" },
    { w: "hat",       e: "🎩", a: "a",   jp: "ぼうし" },
    { w: "robot",     e: "🤖", a: "a",   jp: "ロボット" },
    { w: "fish",      e: "🐟", a: "a",   jp: "さかな" },
    { w: "camel",     e: "🐫", a: "a",   jp: "ラクダ" },
    { w: "bun",       e: "🍞", a: "a",   jp: "パン" },
    { w: "shoe",      e: "👟", a: "a",   jp: "くつ" },
    { w: "bomb",      e: "💣", a: "a",   jp: "ばくだん" },
    // "an" — countable singular, vowel sound
    { w: "apple",     e: "🍎", a: "an",  jp: "りんご" },
    { w: "octopus",   e: "🐙", a: "an",  jp: "たこ" },
    { w: "egg",       e: "🥚", a: "an",  jp: "たまご" },
    { w: "ice cream", e: "🍦", a: "an",  jp: "アイス" },
    { w: "elephant",  e: "🐘", a: "an",  jp: "ゾウ" },
    { w: "umbrella",  e: "☂️", a: "an",  jp: "かさ" },
    { w: "orange",    e: "🍊", a: "an",  jp: "オレンジ" },
    // "the" — unique objects in our shared world
    { w: "sun",       e: "☀️", a: "the", jp: "たいよう" },
    { w: "moon",      e: "🌙", a: "the", jp: "つき" },
    { w: "sky",       e: "🌌", a: "the", jp: "そら" },
    { w: "earth",     e: "🌍", a: "the", jp: "ちきゅう" },
    { w: "world",     e: "🌐", a: "the", jp: "せかい" },
    // zero article — uncountable + plural-form
    { w: "water",     e: "💧", a: "",    jp: "みず" },
    { w: "milk",      e: "🥛", a: "",    jp: "ぎゅうにゅう" },
    { w: "homework",  e: "📚", a: "",    jp: "しゅくだい" },
    { w: "money",     e: "💰", a: "",    jp: "おかね" },
    { w: "snow",      e: "❄️", a: "",    jp: "ゆき" },
    { w: "rain",      e: "🌧️", a: "",    jp: "あめ" },
    { w: "music",     e: "🎵", a: "",    jp: "おんがく" },
    { w: "cats",      e: "🐱🐱🐱", a: "", jp: "ねこたち" },
    { w: "dogs",      e: "🐶🐶🐶", a: "", jp: "いぬたち" },
  ];

  const ARTICLES = [
    { id: "a",   label: "a",   jp: "ひとつ (し音)" },
    { id: "an",  label: "an",  jp: "ひとつ (あいうえお)" },
    { id: "the", label: "the", jp: "ただ ひとつ" },
    { id: "",    label: "—",   jp: "なし" },
  ];

  const $ = (id) => document.getElementById(id);
  const screens = ["title", "game", "result"];
  function show(id) { screens.forEach(s => $("screen-" + s).classList.toggle("hidden", s !== id)); }

  const BEST_KEY = "esl_article_hunt_best";
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
    item: null,
    deadline: 0,
    timer: null,
    locked: false,
  };

  function startGame() {
    State.round = 0;
    State.score = 0;
    renderPad();
    nextItem();
    show("game");
  }
  $("hud-quit").addEventListener("click", () => { stopGame(); show("title"); renderBest(); });

  function renderPad() {
    const pad = $("article-pad"); pad.innerHTML = "";
    // shuffle the article order so kids can't memorize positions
    const order = ARTICLES.slice();
    for (let i = order.length - 1; i > 0; i--) {
      const j = (Math.random() * (i+1)) | 0;
      [order[i], order[j]] = [order[j], order[i]];
    }
    order.forEach(a => {
      const b = document.createElement("button");
      b.className = "art-btn";
      b.dataset.aid = a.id;
      b.innerHTML = `${a.label}<div class="art-jp">${a.jp}</div>`;
      b.addEventListener("pointerdown", () => onTap(b, a.id));
      pad.appendChild(b);
    });
  }

  function nextItem() {
    State.round++;
    State.locked = false;
    if (State.round > State.total) { finish(); return; }
    const it = ITEMS[(Math.random() * ITEMS.length) | 0];
    State.item = it;
    $("item-emoji").textContent = it.e;
    $("item-word").innerHTML = `<span class="article-slot">?</span>${it.w}`;
    $("item-jp").textContent = it.jp;
    $("hud-progress").textContent = `${State.round}/${State.total}`;
    $("hud-score").textContent = "★ " + State.score;
    // Speak phrase with placeholder ___ to show kid the form
    const phrase = it.a === "" ? it.w : it.a + " " + it.w;
    setTimeout(() => SND.speakEn(phrase), 220);
    // Per-item timer in hard mode
    if (State.level === 1) {
      State.deadline = performance.now() + 6000;
      if (State.timer) clearInterval(State.timer);
      State.timer = setInterval(updateTime, 200);
      $("hud-time").style.display = "";
    } else {
      $("hud-time").style.display = "none";
      if (State.timer) { clearInterval(State.timer); State.timer = null; }
    }
  }

  function updateTime() {
    const remain = Math.max(0, State.deadline - performance.now());
    const sec = Math.ceil(remain / 1000);
    const el = $("hud-time");
    el.textContent = "⏱ " + sec;
    if (sec <= 3) el.classList.add("danger"); else el.classList.remove("danger");
    if (remain <= 0) timeout();
  }

  function timeout() {
    if (State.locked) return;
    State.locked = true;
    if (State.timer) { clearInterval(State.timer); State.timer = null; }
    revealAnswer(false);
    setTimeout(nextItem, 1300);
  }

  function onTap(btn, articleId) {
    if (State.locked) return;
    State.locked = true;
    if (State.timer) { clearInterval(State.timer); State.timer = null; }
    if (articleId === State.item.a) {
      btn.classList.add("correct");
      SND.sfxCorrect();
      State.score += 10;
      const slot = document.querySelector(".article-slot");
      slot.textContent = articleId === "" ? "—" : articleId;
      slot.classList.add("filled-good");
      // Speak the full phrase as reinforcement
      const full = State.item.a === "" ? State.item.w : State.item.a + " " + State.item.w;
      setTimeout(() => SND.speakEn(full), 200);
      setTimeout(() => { btn.classList.remove("correct"); nextItem(); }, 1200);
    } else {
      btn.classList.add("wrong");
      SND.sfxWrong();
      setTimeout(() => btn.classList.remove("wrong"), 400);
      revealAnswer(true);
      State.score = Math.max(0, State.score - 2);
      // Re-allow another try
      setTimeout(() => { State.locked = false; }, 1100);
    }
  }

  function revealAnswer(silent) {
    const slot = document.querySelector(".article-slot");
    slot.textContent = State.item.a === "" ? "—" : State.item.a;
    slot.classList.remove("filled-good");
    slot.classList.add("filled-bad");
    setTimeout(() => slot.classList.remove("filled-bad"), 400);
    if (!silent) {
      const full = State.item.a === "" ? State.item.w : State.item.a + " " + State.item.w;
      setTimeout(() => SND.speakEn(full), 200);
    }
  }

  function stopGame() {
    if (State.timer) { clearInterval(State.timer); State.timer = null; }
  }
  function finish() {
    stopGame();
    saveBest(State.score);
    $("result-banner").textContent = State.score >= 80 ? "MASTER!" : State.score >= 50 ? "GOOD!" : "DONE!";
    $("result-stats").innerHTML = `スコア: <span style="color:#ffe45c">${State.score}</span> / 100`;
    const lines = [
      "BINGO. BONGO. BUNGO. The third article is my brother.",
      "I have stolen your articles. They were definite. I am returning them.",
      "Ohonhonhon, you understand articles better than a sardine.",
      "In my village... we have no articles. We point at things.",
      "The cosmos has observed your grammar. The cosmos uses no articles either, actually.",
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
    const emojis = ["🎉","✏️","📚","✨","💫","🎈"];
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
  // Inline dentures gag
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
  setInterval(() => { if (Math.random() < 1/30) dentures(); }, 1000);
})();
