// ストーリー クエスト — Story Quest
//
// Visual novel. Encounter a kaiju, hear their JP voice and English
// subtitle, pick an English response. Each kaiju has 3-turn dialogue
// tree branching on 2-3 choices per turn. Outcomes (good/neutral/bad)
// accumulate into one of three ending tags. Reading comprehension +
// pragmatic register practice (Sato-sensei's domain). The kid hears
// the kaiju line in English via TTS (level 0) or JP voice file if
// available (level 1 — turns off English subtitle for harder mode).
//
// Touch-first: all choices are 56px-tall tap buttons.

(function () {
  const SND = window.GamesAudio;
  const ART = window.GamesArt;
  const STORY = window.STORY;

  const $ = (id) => document.getElementById(id);
  const screens = ["title", "game", "outcome"];
  function show(id) {
    screens.forEach(s => $("screen-" + s).classList.toggle("hidden", s !== id));
  }

  // Met-kaiju shelf in localStorage
  const MET_KEY = "esl_story_quest_met";
  function getMet() {
    try { return JSON.parse(localStorage.getItem(MET_KEY) || "[]"); }
    catch (_) { return []; }
  }
  function saveMet(arr) {
    try { localStorage.setItem(MET_KEY, JSON.stringify(arr)); } catch (_) {}
  }
  function renderShelf() {
    const met = new Set(getMet());
    const shelf = $("meet-shelf"); shelf.innerHTML = "";
    Object.keys(STORY).forEach(id => {
      const cell = document.createElement("div");
      cell.className = "meet-cell" + (met.has(id) ? " met" : "");
      cell.textContent = met.has(id) ? ART.emoji(id) : "?";
      cell.title = STORY[id].name;
      shelf.appendChild(cell);
    });
  }

  // ---- TITLE ----
  document.querySelectorAll(".level-pick button").forEach(b => {
    b.addEventListener("click", () => {
      State.level = parseInt(b.dataset.lv, 10);
      SND.sfxConfirm();
      pickAndStart();
    });
  });

  const State = {
    level: 0,
    kaijuId: null,
    boss: null,
    turnIdx: 0,
    outcomes: [],   // "good" | "bad" | "neutral"
    locked: false,
  };

  function pickAndStart() {
    // Pick a random kaiju the kid hasn't met yet, or random if all met
    const met = new Set(getMet());
    const all = Object.keys(STORY);
    const unmet = all.filter(id => !met.has(id));
    const id = (unmet.length > 0 ? unmet : all)[(Math.random() * (unmet.length > 0 ? unmet.length : all.length)) | 0];
    startEncounter(id);
  }

  function startEncounter(kaijuId) {
    State.kaijuId = kaijuId;
    State.boss = ART.get(kaijuId, true);
    State.turnIdx = 0;
    State.outcomes = [];
    State.locked = false;
    renderScene();
    show("game");
    renderTurn();
  }
  $("vn-quit").addEventListener("click", () => { SND.sfxPop(); show("title"); renderShelf(); });

  function renderScene() {
    const scene = $("vn-scene");
    if (window.Stages && Stages.exists && Stages.exists(State.kaijuId)) {
      scene.innerHTML = Stages.render(State.kaijuId);
    } else {
      scene.innerHTML = "";
    }
    $("vn-name").textContent = STORY[State.kaijuId].name;
    $("vn-kaiju").innerHTML = ART.renderSVG(State.boss);
  }

  function renderTurn() {
    const tree = STORY[State.kaijuId];
    const turn = tree.turns[State.turnIdx];
    if (!turn) { finish(); return; }
    const bubble = $("vn-bubble");
    if (State.level === 0) {
      bubble.innerHTML = `
        <div class="bubble-en">${turn.kaiju.en}</div>
        <div class="bubble-jp">${turn.kaiju.jp}</div>
      `;
    } else {
      // Hard mode: English only (no JP scaffolding)
      bubble.innerHTML = `<div class="bubble-en">${turn.kaiju.en}</div>`;
    }
    // Kaiju mood animation
    const kj = $("vn-kaiju");
    kj.className = "vn-kaiju";
    void kj.offsetWidth;
    kj.classList.add(turn.mood || "speak");
    // Speak the line
    setTimeout(() => SND.speakEn(turn.kaiju.en), 260);
    // Choices
    const wrap = $("vn-choices"); wrap.innerHTML = "";
    if (!turn.choices || turn.choices.length === 0) {
      // Final wrap-up turn — show a "continue" button
      const b = document.createElement("button");
      b.className = "choice-btn";
      b.innerHTML = `<div class="ch-en">Continue →</div><div class="ch-jp">つぎ へ</div>`;
      b.addEventListener("pointerdown", () => { SND.sfxPop(); finish(); });
      wrap.appendChild(b);
      return;
    }
    // Level 1 picks 3 choices when available, level 0 picks the first 2 plus 1 extra
    const choices = State.level === 0 ? turn.choices.slice(0, Math.min(2, turn.choices.length)) : turn.choices.slice();
    // shuffle so good choice isn't always in same spot
    for (let i = choices.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    choices.forEach(c => {
      const b = document.createElement("button");
      b.className = "choice-btn";
      // Level 0 shows JP gloss; level 1 hides it (just English)
      const jp = (State.level === 0) ? `<div class="ch-jp">${c.jp}</div>` : "";
      b.innerHTML = `<div class="ch-en">${c.en}</div>${jp}`;
      b.addEventListener("pointerdown", () => onChoice(b, c));
      wrap.appendChild(b);
    });
  }

  function onChoice(btn, choice) {
    if (State.locked) return;
    State.locked = true;
    if (choice.outcome === "good") {
      btn.classList.add("picked-good");
      SND.sfxCorrect();
    } else if (choice.outcome === "bad") {
      btn.classList.add("picked-bad");
      SND.sfxWrong();
    } else {
      SND.sfxPop();
    }
    SND.speakEn(choice.en);
    State.outcomes.push(choice.outcome);
    setTimeout(() => {
      State.turnIdx++;
      State.locked = false;
      renderTurn();
    }, 1200);
  }

  function finish() {
    // Save met flag
    const met = new Set(getMet());
    met.add(State.kaijuId);
    saveMet([...met]);
    // Compute ending
    const goods = State.outcomes.filter(o => o === "good").length;
    const bads  = State.outcomes.filter(o => o === "bad").length;
    let banner = "NEUTRAL!";
    let tag = "おだやか な であい でした。";
    let msg = "The encounter was OK. The cosmos is mildly indifferent.";
    if (goods >= 2 && bads === 0) {
      banner = "FRIENDSHIP!";
      tag = "★ ベスト ともだち ★";
      msg = "You befriended the kaiju! In this timeline, the world is mostly safe.";
    } else if (goods > bads) {
      banner = "RESPECT!";
      tag = "そんけい される";
      msg = "The kaiju respects you. They will think of you fondly... probably.";
    } else if (bads > goods) {
      banner = "DRAMA!";
      tag = "ちょっと きまずい";
      msg = "Things got tense. The kaiju is mad, but you survived. Tradition.";
    }
    $("outcome-banner").textContent = banner;
    $("outcome-tag").textContent = tag;
    $("outcome-art").innerHTML = ART.renderSVG(State.boss);
    $("outcome-msg").textContent = msg;
    show("outcome");
    SND.sfxLevel();
    spawnConfetti(28);
  }

  $("btn-next-encounter").addEventListener("click", () => { SND.sfxConfirm(); pickAndStart(); });
  $("btn-home").addEventListener("click", () => { SND.sfxConfirm(); show("title"); renderShelf(); });

  function spawnConfetti(n) {
    const layer = document.createElement("div");
    layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:900;overflow:hidden;";
    document.body.appendChild(layer);
    const emojis = ["📖","✨","💫","🎉","💖","🌟"];
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
