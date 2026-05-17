// センテンス ドラッグ — Sentence Drag
//
// Calm alternative to sentence-flappy. Show the JP target sentence,
// the kaiju it's about, and shuffled English word tiles. Kid TAPS
// tiles in order to move them into the answer tray. Tap a tile in
// the tray to remove it back. When all words are placed, tap "answer".
//
// Right answer → kaiju speaks the full English sentence and confetti.
// Wrong answer → wobble the misplaced tiles + voice the first wrong
// word, allow retry without losing progress.
//
// Pedagogy: same content as sentence-flappy (kaiju-themed absurd
// sentences) but the kid focuses on word order without the reflex-
// game pressure. Per Sakura's note: failure can't cost more than a
// few seconds of replay.

(function () {
  const SND = window.GamesAudio;
  const ART = window.GamesArt;

  // Same sentence pool as sentence-flappy — keep them in sync.
  const SENTENCES = {
    tako: {
      0: ["He is an octopus.", "He sells takoyaki.", "Tako eats sushi."],
      1: ["He has eight legs.", "Tako is an octopus.", "Tako wears a paper hat."],
      2: ["Tako sells takoyaki at the night market.",
          "Tako wants to turn every food into takoyaki.",
          "Tako has eight legs and a tall paper hat."],
    },
    unko: {
      0: ["He smells bad.", "He is a crocodile.", "He drops a bomb."],
      1: ["He says BOMBA.", "He fills the river with poop.", "He hates Anpanman."],
      2: ["Unkodilo is a robot crocodile filled with poop.",
          "Unkodilo eats my homework with a smile.",
          "He filled all the rivers with brown stinky water."],
    },
    tral: {
      0: ["He sings opera.", "He is a fish.", "Mamma mia."],
      1: ["He wears blue shoes.", "He has three legs.", "Tralalero is a fish."],
      2: ["Tralalero sings opera in the deep blue sea.",
          "He wears two blue Nike sneakers on his head.",
          "He wants everyone to sing in Italian."],
    },
    pamp: {
      0: ["She is fluffy.", "She is pink.", "She wants a hug."],
      1: ["She collects children.", "She is very soft.", "She is a plushy."],
      2: ["Pampamu is a fluffy plushy from Korea.",
          "She wants to hug every kid in the world.",
          "Pampamu collects kids inside her pink palace."],
    },
    parfait: {
      0: ["She is sweet.", "She is a fish.", "She has a cherry."],
      1: ["She tastes good.", "She is a sardine.", "She is from Paris."],
      2: ["Parfait is a sardine inside a sweet parfait glass.",
          "She turns every sushi into a cold dessert.",
          "Parfait has a tiny red cherry on her shiny head."],
    },
    anpan: {
      0: ["He is bread.", "He is a fish.", "He has a face."],
      1: ["He wants the throne.", "He hates Anpanman.", "He is a tuna."],
      2: ["Anpan Maguro is bread and also a fish.",
          "He wants to be the new hero of Japan.",
          "He hates Anpanman more than anything in the world."],
    },
    temee: {
      0: ["He is a camel.", "He is old.", "He has a hat."],
      1: ["He has two humps.", "He likes buuz.", "He is from Mongolia."],
      2: ["Temee is a camel with a monkey head and a beard.",
          "He has two humps on his back and a tall hat.",
          "Temee wants everyone in the world to grow a hump."],
    },
    catcherski: {
      0: ["He is a robot.", "He wants coins.", "He has a claw."],
      1: ["He was hacked.", "He stole emoji.", "He yells in Russian."],
      2: ["Catcherski is a UFO claw machine hacked by Russian hackers.",
          "He eats one hundred yen coins and never gives prizes.",
          "He locked all the emoji of the world inside a glass box."],
    },
  };

  const KAIJU_FOR_LEVEL = {
    0: ["tako", "pamp", "parfait", "tral"],
    1: ["tako", "unko", "tral", "pamp", "parfait", "anpan", "temee", "catcherski"],
    2: ["tako", "unko", "tral", "pamp", "parfait", "anpan", "temee", "catcherski"],
  };

  const TRANS = {
    "He is an octopus.": "かれ は たこ",
    "He sells takoyaki.": "かれ は たこ焼[や]き を うる",
    "Tako eats sushi.": "タコ は すし を たべる",
    "He has eight legs.": "かれ は 8本足[ぽんあし]",
    "Tako is an octopus.": "タコ は たこ",
    "Tako wears a paper hat.": "タコ は かみ の ぼうし を かぶる",
    "Tako sells takoyaki at the night market.": "タコ は よる の マーケット で たこ焼[や]き を うる",
    "Tako wants to turn every food into takoyaki.": "タコ は すべての たべもの を たこ焼[や]き に したい",
    "Tako has eight legs and a tall paper hat.": "タコ は 8本足[ぽんあし] と たかい かみ の ぼうし",
    "He smells bad.": "かれ は くさい",
    "He is a crocodile.": "かれ は ワニ",
    "He drops a bomb.": "かれ は ばくだん を おとす",
    "He says BOMBA.": "かれ は『ボンバ！』と いう",
    "He fills the river with poop.": "かれ は かわ を うんち で みたす",
    "He hates Anpanman.": "かれ は アンパンマン が きらい",
    "Unkodilo is a robot crocodile filled with poop.": "ウンコディロ は うんち で みちた ロボット ワニ",
    "Unkodilo eats my homework with a smile.": "ウンコディロ は しゅくだい を わらいながら たべる",
    "He filled all the rivers with brown stinky water.": "かれ は ぜんぶ の かわ を ちゃいろい くさい みず で みたした",
    "He sings opera.": "かれ は オペラ を うたう",
    "He is a fish.": "かれ は さかな",
    "Mamma mia.": "マンマ ミーア",
    "He wears blue shoes.": "かれ は あおい くつ を はく",
    "He has three legs.": "かれ は 3ぼん の あし",
    "Tralalero is a fish.": "トラララ は さかな",
    "Tralalero sings opera in the deep blue sea.": "トラララ は ふかい あおい うみ で オペラ を うたう",
    "He wears two blue Nike sneakers on his head.": "かれ は あたま に 2つ の あおい ナイキ スニーカー",
    "He wants everyone to sing in Italian.": "かれ は みんな に イタリアご で うたって ほしい",
    "She is fluffy.": "かのじょ は ふわふわ",
    "She is pink.": "かのじょ は ピンク",
    "She wants a hug.": "かのじょ は ハグ が ほしい",
    "She collects children.": "かのじょ は こども を あつめる",
    "She is very soft.": "かのじょ は とても やわらかい",
    "She is a plushy.": "かのじょ は ぬいぐるみ",
    "Pampamu is a fluffy plushy from Korea.": "パムパム は かんこく の ふわふわ ぬいぐるみ",
    "She wants to hug every kid in the world.": "かのじょ は せかい の すべて の こども を ハグ したい",
    "Pampamu collects kids inside her pink palace.": "パムパム は ピンク の おしろ に こども を あつめる",
    "She is sweet.": "かのじょ は あまい",
    "She has a cherry.": "かのじょ は さくらんぼ を もつ",
    "She tastes good.": "かのじょ は おいしい",
    "She is a sardine.": "かのじょ は イワシ",
    "She is from Paris.": "かのじょ は パリ から",
    "Parfait is a sardine inside a sweet parfait glass.": "パフェ は あまい パフェ グラス の なか の イワシ",
    "She turns every sushi into a cold dessert.": "かのじょ は すべて の すし を つめたい デザート に かえる",
    "Parfait has a tiny red cherry on her shiny head.": "パフェ は ピカピカ の あたま に ちいさい あかい さくらんぼ",
    "He is bread.": "かれ は パン",
    "He has a face.": "かれ は かお を もつ",
    "He wants the throne.": "かれ は おうざ が ほしい",
    "He is a tuna.": "かれ は マグロ",
    "Anpan Maguro is bread and also a fish.": "アンパン マグロ は パン で さかな",
    "He wants to be the new hero of Japan.": "かれ は しん にっぽん ヒーロー に なりたい",
    "He hates Anpanman more than anything in the world.": "かれ は せかい じゅう で アンパンマン が いちばん きらい",
    "He is a camel.": "かれ は ラクダ",
    "He is old.": "かれ は ねんを とった",
    "He has a hat.": "かれ は ぼうし を かぶる",
    "He has two humps.": "かれ は 2つ の こぶ",
    "He likes buuz.": "かれ は ブーズ が すき",
    "He is from Mongolia.": "かれ は モンゴル から",
    "Temee is a camel with a monkey head and a beard.": "ティメー は サル の あたま と ひげ の ある ラクダ",
    "He has two humps on his back and a tall hat.": "かれ は せなか に 2つ の こぶ と たかい ぼうし",
    "Temee wants everyone in the world to grow a hump.": "ティメー は せかい じゅう の ひと に こぶ を はやして ほしい",
    "He is a robot.": "かれ は ロボット",
    "He wants coins.": "かれ は コイン が ほしい",
    "He was hacked.": "かれ は ハック された",
    "He stole emoji.": "かれ は えもじ を ぬすんだ",
    "He yells in Russian.": "かれ は ロシアご で さけぶ",
    "Catcherski is a UFO claw machine hacked by Russian hackers.": "キャッチャースキー は ロシア の ハッカー に ハック された UFO キャッチャー",
    "He eats one hundred yen coins and never gives prizes.": "かれ は 100円 を たべて けっして けいひん を くれない",
    "He locked all the emoji of the world inside a glass box.": "かれ は せかい の すべて の えもじ を ガラス の はこ に とじこめた",
  };

  const $ = (id) => document.getElementById(id);
  const screens = ["title", "game", "round"];
  function show(id) { screens.forEach(s => $("screen-" + s).classList.toggle("hidden", s !== id)); }

  const BEST_KEY = "esl_sentence_drag_best";
  function getBest() { return parseInt(localStorage.getItem(BEST_KEY) || "0", 10); }
  function saveBest(s) { if (s > getBest()) localStorage.setItem(BEST_KEY, String(s)); }
  function renderBest() { $("best").innerHTML = `これまでの ぶん ★ <em>${getBest()}</em>`; }

  document.querySelectorAll(".level-pick button").forEach(b => {
    b.addEventListener("click", () => {
      State.level = parseInt(b.dataset.lv, 10);
      SND.sfxConfirm();
      State.round = 0;
      State.cleared = 0;
      startRound();
    });
  });

  const State = {
    level: 0,
    round: 0,
    cleared: 0,
    totalRounds: 5,
    boss: null,
    sentence: "",
    targetTokens: [],
    answer: [],       // current placed token indices (into pool)
    pool: [],         // tokens with shuffled order
  };

  function tokenize(s) { return s.split(/\s+/).filter(Boolean); }

  function startRound() {
    State.round++;
    if (State.round > State.totalRounds) { finish(); return; }
    const ids = KAIJU_FOR_LEVEL[State.level];
    const bossId = ids[(Math.random() * ids.length) | 0];
    State.boss = ART.get(bossId, true);
    const pool = SENTENCES[bossId][State.level];
    State.sentence = pool[(Math.random() * pool.length) | 0];
    State.targetTokens = tokenize(State.sentence);
    State.answer = [];
    // Build pool: target tokens + 1-2 distractors
    const distractors = ["very", "now", "always", "tomorrow", "really", "maybe"];
    const distract = State.level === 0 ? [] :
                    State.level === 1 ? [distractors[(Math.random()*distractors.length)|0]] :
                    [distractors[(Math.random()*distractors.length)|0], distractors[(Math.random()*distractors.length)|0]];
    State.pool = State.targetTokens.concat(distract).map((w, i) => ({ id: i, w, used: false }));
    // shuffle
    for (let i = State.pool.length - 1; i > 0; i--) {
      const j = (Math.random() * (i+1)) | 0;
      [State.pool[i], State.pool[j]] = [State.pool[j], State.pool[i]];
    }
    // Re-id for stable references
    State.pool.forEach((p, i) => p.id = i);
    renderGame();
    show("game");
    SND.speakEn(State.sentence);
  }

  function renderGame() {
    $("hud-kaiju").textContent = State.boss.name_jp;
    $("hud-progress").textContent = `${State.round}/${State.totalRounds}`;
    $("prompt-jp").textContent = TRANS[State.sentence] || "★";
    $("boss-frame").innerHTML = `<div class="boss-svg">${ART.renderSVG(State.boss)}</div>`;
    renderTrays();
  }

  function renderTrays() {
    const ans = $("answer-tray"); ans.innerHTML = "";
    const pool = $("pool-tray"); pool.innerHTML = "";
    if (State.answer.length === 0) ans.classList.add("empty");
    else                            ans.classList.remove("empty");

    State.answer.forEach(idx => {
      const t = State.pool[idx];
      const el = document.createElement("div");
      el.className = "word-tile in-answer";
      el.textContent = t.w;
      el.addEventListener("pointerdown", () => removeFromAnswer(idx));
      ans.appendChild(el);
    });
    State.pool.forEach(p => {
      if (State.answer.includes(p.id)) return;
      const el = document.createElement("div");
      el.className = "word-tile";
      el.textContent = p.w;
      el.addEventListener("pointerdown", () => addToAnswer(p.id));
      pool.appendChild(el);
    });
    // enable submit if all target slots filled
    $("btn-submit").disabled = State.answer.length === 0;
  }

  function addToAnswer(id) {
    SND.sfxPop();
    State.answer.push(id);
    SND.speakEn(State.pool[id].w);
    renderTrays();
  }
  function removeFromAnswer(id) {
    SND.sfxPop();
    State.answer = State.answer.filter(i => i !== id);
    renderTrays();
  }

  $("btn-replay").addEventListener("click", () => {
    SND.sfxPop(); SND.speakEn(State.sentence);
  });
  $("hud-quit").addEventListener("click", () => { SND.sfxPop(); show("title"); renderBest(); });

  $("btn-submit").addEventListener("click", () => {
    const got = State.answer.map(i => State.pool[i].w).join(" ");
    const want = State.targetTokens.join(" ");
    if (got === want) {
      // WIN
      SND.sfxLevel();
      SND.speakEn(State.sentence);
      State.cleared++;
      saveBest(State.cleared);
      document.querySelectorAll(".answer-tray .word-tile").forEach(el => el.classList.add("win"));
      setTimeout(() => roundFinished(true), 1100);
    } else {
      // WRONG — wobble + voice first incorrect word
      SND.sfxWrong();
      let firstWrong = -1;
      for (let i = 0; i < State.answer.length; i++) {
        if (State.pool[State.answer[i]].w !== State.targetTokens[i]) { firstWrong = i; break; }
      }
      const tiles = document.querySelectorAll(".answer-tray .word-tile");
      if (firstWrong >= 0 && tiles[firstWrong]) {
        tiles[firstWrong].classList.add("wobble");
        setTimeout(() => tiles[firstWrong].classList.remove("wobble"), 500);
      }
    }
  });

  function roundFinished(won) {
    $("round-banner").textContent = won ? "PERFECT!" : "OK!";
    $("round-en").textContent = State.sentence;
    $("round-jp").textContent = TRANS[State.sentence] || "";
    $("round-art").innerHTML = ART.renderSVG(State.boss);
    const lines = [
      "Mamma mia! BELLISSIMO sentence!",
      "BINGO. BONGO. BUNGO. The third word is my brother.",
      "I have stolen your word order. It was correct. I am returning it.",
      "In my village... we also assembled sentences. With sand.",
      "Ohonhonhon, you are now SLIGHTLY less of a sardine.",
    ];
    $("round-msg").textContent = lines[(Math.random()*lines.length)|0];
    show("round");
    spawnConfetti(28);
  }

  $("btn-next").addEventListener("click", () => { SND.sfxConfirm(); startRound(); });
  $("btn-home").addEventListener("click", () => { SND.sfxConfirm(); show("title"); renderBest(); });

  function finish() {
    show("title");
    renderBest();
  }

  function spawnConfetti(n) {
    const layer = document.createElement("div");
    layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:900;overflow:hidden;";
    document.body.appendChild(layer);
    const emojis = ["🎉","✋","✨","💫","🎈","📝"];
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
