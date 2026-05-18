// ストーリー クエスト — Story Quest (rebuilt around branching graphs)
//
// Flow: title → kaiju picker → conversation picker → branching story →
//        warm/neutral/cool ending.
//
// Per-word JP gloss: every word in EVERY dialogue line (bubble + choice)
// is tappable. Tap = popup with JP meaning + plays the single-word
// audio in en-US-AnaNeural (kid voice). Words present in WORD_GLOSS get
// a dotted underline so kids know they're translatable. Words not in
// the gloss still play single-word audio.
//
// Audio: pre-rendered via Edge TTS into assets/voices/story/
//   - story/<kaiju>/<hash>.opus — kaiju lines in the kaiju's distinct
//     English voice (Christopher / Andrew / Brandon / Roger / Ana / etc.)
//   - story/kid/<hash>.opus      — kid responses in en-US-AnaNeural
//   - story/word/<hash>.opus     — single-word taps in en-US-AnaNeural

(function () {
  const SND = window.GamesAudio;
  const ART = window.GamesArt;
  const STORY = window.STORY;
  const WORD_GLOSS = window.WORD_GLOSS || {};

  const $ = (id) => document.getElementById(id);
  const screens = ["title", "kaiju", "conv-pick", "story", "end"];
  function show(id) { screens.forEach(s => $("screen-" + s).classList.toggle("hidden", s !== id)); }

  // ----- AUDIO HELPERS -----
  function playKaijuAudio(kaijuId, text) {
    if (!text) return;
    const hash = SND.djb2(SND.cleanForHash(text));
    const url = `../../assets/voices/story/${encodeURIComponent(kaijuId)}/${hash}.opus`;
    const a = new Audio(url);
    a.volume = 0.95;
    const p = a.play();
    if (p && p.catch) p.catch(() => SND.browserTTS(text));
  }
  function playKidAudio(text) {
    if (!text) return;
    const hash = SND.djb2(SND.cleanForHash(text));
    const url = `../../assets/voices/story/kid/${hash}.opus`;
    const a = new Audio(url);
    a.volume = 0.95;
    const p = a.play();
    if (p && p.catch) p.catch(() => SND.browserTTS(text));
  }
  function playWordAudio(word) {
    const hash = SND.djb2(SND.cleanForHash(word));
    const url = `../../assets/voices/story/word/${hash}.opus`;
    const a = new Audio(url);
    a.volume = 0.95;
    const p = a.play();
    if (p && p.catch) p.catch(() => SND.browserTTS(word));
  }

  // ----- WORD WRAPPING for per-word tap -----
  // Split text on whitespace + keep trailing punctuation. Each word
  // becomes a tappable span. The popup shows JP gloss + audio. Words
  // present in WORD_GLOSS get a dotted underline indicator.
  function wrapWords(text) {
    const out = [];
    const tokens = text.split(/(\s+)/);
    for (const tok of tokens) {
      if (/^\s+$/.test(tok)) { out.push(document.createTextNode(tok)); continue; }
      const pure = tok.replace(/[.,!?;:'"()]+$/g, "").replace(/^[.,!?;:'"()]+/g, "");
      const trail = tok.slice(pure.length);
      const lead = tok.length > pure.length ? tok.slice(0, tok.length - pure.length - trail.length) : "";
      const sp = document.createElement("span");
      sp.className = "word";
      const k = pure.toLowerCase();
      if (WORD_GLOSS[k]) sp.classList.add("glossed");
      sp.textContent = pure;
      sp.addEventListener("pointerdown", (e) => { e.stopPropagation(); onTapWord(pure); });
      out.push(document.createTextNode(lead));
      out.push(sp);
      if (trail) out.push(document.createTextNode(trail));
    }
    return out;
  }

  function onTapWord(word) {
    const k = word.toLowerCase();
    const jp = WORD_GLOSS[k];
    if (jp) {
      $("wp-en").textContent = word;
      $("wp-jp").textContent = jp;
      $("word-popup").classList.remove("hidden");
    }
    playWordAudio(word);
  }
  $("wp-close").addEventListener("click", () => { $("word-popup").classList.add("hidden"); });
  $("word-popup").addEventListener("click", (e) => {
    if (e.target.id === "word-popup") $("word-popup").classList.add("hidden");
  });

  // ----- PROGRESS PERSISTENCE -----
  const PROGRESS_KEY = "esl_story_progress";
  function getProgress() { try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}"); } catch (_) { return {}; } }
  function saveProgress(p) { try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch (_) {} }
  function markCompleted(kaijuId, convId, ending) {
    const p = getProgress();
    if (!p[kaijuId]) p[kaijuId] = {};
    p[kaijuId][convId] = ending;
    saveProgress(p);
    // Cross-game mastery
    recordConversationCompleted(kaijuId, convId);
  }
  // Phrase journal — every kaiju line the kid actually heard gets
  // saved (per kaiju) so they can replay any past line from a
  // browsable journal. Yumiko's review: turns a finite VN into
  // an infinitely-revisitable audio dictionary.
  const JOURNAL_KEY = "esl_story_journal";
  function loadJournal() { try { return JSON.parse(localStorage.getItem(JOURNAL_KEY) || "{}"); } catch (_) { return {}; } }
  function saveJournal(j) { try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(j)); } catch (_) {} }
  function recordPhrase(kaijuId, en, jp) {
    if (!en) return;
    const j = loadJournal();
    if (!j[kaijuId]) j[kaijuId] = [];
    if (!j[kaijuId].find(p => p.en === en)) j[kaijuId].push({ en, jp: jp || "" });
    saveJournal(j);
  }
  const MASTERY_KEY = "esl_kaiju_mastery";
  function loadMastery() { try { return JSON.parse(localStorage.getItem(MASTERY_KEY) || "{}"); } catch (_) { return {}; } }
  function saveMastery(m)  { try { localStorage.setItem(MASTERY_KEY, JSON.stringify(m)); } catch (_) {} }
  function recordConversationCompleted(kaijuId, convId) {
    const m = loadMastery();
    if (!m[kaijuId]) m[kaijuId] = {};
    if (!m[kaijuId].story) m[kaijuId].story = [];
    if (!m[kaijuId].story.includes(convId)) m[kaijuId].story.push(convId);
    saveMastery(m);
  }

  function renderMetShelf() {
    const p = getProgress();
    const shelf = $("met-shelf"); shelf.innerHTML = "";
    Object.keys(STORY).forEach(id => {
      const cell = document.createElement("div");
      cell.className = "met-cell" + (p[id] ? " met" : "");
      cell.textContent = p[id] ? ART.emoji(id) : "?";
      cell.title = STORY[id].name;
      shelf.appendChild(cell);
    });
  }

  // ----- TITLE -----
  $("btn-start").addEventListener("click", () => { SND.sfxConfirm(); buildKaijuGrid(); show("kaiju"); });
  $("kaiju-back").addEventListener("click", () => { show("title"); renderMetShelf(); });
  $("btn-journal").addEventListener("click", () => { SND.sfxConfirm(); openJournal(); });
  $("journal-back").addEventListener("click", () => { show("title"); renderMetShelf(); });

  function openJournal() {
    const j = loadJournal();
    // Build kaiju picker (only show kaiju with at least one phrase)
    const pick = $("journal-pick"); pick.innerHTML = "";
    const ids = Object.keys(j).filter(id => j[id] && j[id].length > 0);
    if (ids.length === 0) {
      $("journal-list").innerHTML = '<div class="journal-empty">まだ なに も きいて いない…<br>カイジュウ と はなして、 フレーズ を あつめよう！</div>';
      show("journal");
      return;
    }
    let active = ids[0];
    function rebuild() {
      pick.innerHTML = "";
      ids.forEach(id => {
        const b = document.createElement("button");
        b.className = "btn-cool" + (id === active ? " active" : "");
        const kd = STORY[id]; const name = kd ? kd.name : id;
        b.textContent = ART.emoji(id) + " " + name + " (" + j[id].length + ")";
        b.addEventListener("click", () => { SND.sfxPop(); active = id; rebuild(); });
        pick.appendChild(b);
      });
      const list = $("journal-list"); list.innerHTML = "";
      j[active].forEach(p => {
        const row = document.createElement("div");
        row.className = "journal-row";
        row.innerHTML = `<div class="jr-en">${p.en}</div>${p.jp ? '<div class="jr-jp">'+p.jp+'</div>' : ''}`;
        row.addEventListener("pointerdown", () => { playKaijuAudio(active, p.en); });
        list.appendChild(row);
      });
    }
    rebuild();
    show("journal");
  }

  function buildKaijuGrid() {
    const grid = $("kaiju-grid"); grid.innerHTML = "";
    const p = getProgress();
    Object.keys(STORY).forEach(id => {
      const kd = STORY[id];
      const boss = ART.get(id);
      const completedCount = p[id] ? Object.keys(p[id]).length : 0;
      const total = kd.conversations.length;
      const div = document.createElement("button");
      div.className = "kaiju-card";
      div.innerHTML = `
        <div class="kc-sv">${boss ? ART.renderSVG(boss) : ART.emoji(id)}</div>
        <div class="kc-name">${kd.name}</div>
        <div class="kc-count">${completedCount}/${total} かいわ</div>
      `;
      // Long-press / right-click previews the kaiju's English voice
      // saying their name. Useful for kids who want to hear who
      // they're about to pick.
      let pressTimer = null;
      let suppressClick = false;
      div.addEventListener("pointerdown", () => {
        pressTimer = setTimeout(() => {
          suppressClick = true;
          playKaijuAudio(id, kd.nameEn || kd.name);
        }, 500);
      });
      div.addEventListener("pointerup",   () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } });
      div.addEventListener("pointerleave",() => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } });
      div.addEventListener("contextmenu", (e) => { e.preventDefault(); suppressClick = true; playKaijuAudio(id, kd.nameEn || kd.name); });
      div.addEventListener("click", (e) => {
        if (suppressClick) { suppressClick = false; return; }
        SND.sfxPop();
        openConvPicker(id);
      });
      grid.appendChild(div);
    });
  }

  function openConvPicker(kaijuId) {
    State.kaijuId = kaijuId;
    const kd = STORY[kaijuId];
    $("conv-pick-title").textContent = kd.name + " — かいわ を えらぶ";
    const list = $("conv-list"); list.innerHTML = "";
    const p = getProgress();
    kd.conversations.forEach(conv => {
      const b = document.createElement("button");
      b.className = "btn-cool" + (p[kaijuId] && p[kaijuId][conv.id] ? " done" : "");
      b.innerHTML = `<div class="cl-title">${conv.title}</div><div class="cl-intro">${conv.intro}</div>`;
      b.addEventListener("click", () => { SND.sfxConfirm(); startConversation(conv); });
      list.appendChild(b);
    });
    show("conv-pick");
  }
  $("conv-back").addEventListener("click", () => { buildKaijuGrid(); show("kaiju"); });

  // ----- STORY -----
  const State = {
    kaijuId: null,
    conv: null,
    nodeId: null,
    outcomes: [],
    locked: false,
  };

  function startConversation(conv) {
    State.conv = conv;
    State.nodeId = conv.start;
    State.outcomes = [];
    State.currentScene = null;
    const kd = STORY[State.kaijuId];
    $("vn-name").textContent = kd.name;
    $("vn-kaiju").innerHTML = ART.renderSVG(ART.get(State.kaijuId, true));
    // Initial scene = conv.scene (if set) or the start node's scene, else fall back
    const initial = conv.scene || (conv.nodes[conv.start] && conv.nodes[conv.start].scene) || null;
    setScene(initial, true);
    show("story");
    renderNode();
  }

  // Scene management with crossfade. The vn-scene element holds two
  // layered SVGs (back + front). On change we fade the new one in and
  // remove the previous after the transition. This is the single
  // biggest perceived-quality lever in the VN — backstory beats land
  // visually, not just in dialogue.
  function setScene(sceneId, instant) {
    const slot = $("vn-scene");
    if (!slot) return;
    if (sceneId === State.currentScene && !instant) return;
    State.currentScene = sceneId;
    // Pick markup
    let html = "";
    if (sceneId && window.Scenes && Scenes.exists(sceneId)) {
      html = Scenes.render(sceneId);
    } else if (window.Stages && Stages.exists && Stages.exists(State.kaijuId)) {
      html = Stages.render(State.kaijuId);
    }
    if (instant) {
      slot.innerHTML = `<div class="scene-layer fade-active">${html}</div>`;
      return;
    }
    // Crossfade: new layer fades in while previous layer fades out.
    const oldLayers = slot.querySelectorAll(".scene-layer");
    const next = document.createElement("div");
    next.className = "scene-layer fade-in";
    next.innerHTML = html;
    slot.appendChild(next);
    // Force reflow then trigger animations
    requestAnimationFrame(() => {
      next.classList.remove("fade-in");
      next.classList.add("fade-active");
      // Fade out old layers simultaneously
      oldLayers.forEach(l => { l.classList.remove("fade-active"); l.classList.add("fade-out"); });
    });
    setTimeout(() => {
      // Drop all but the latest
      const layers = slot.querySelectorAll(".scene-layer");
      for (let i = 0; i < layers.length - 1; i++) layers[i].remove();
    }, 1000);
  }
  $("vn-quit").addEventListener("click", () => { SND.sfxPop(); show("title"); renderMetShelf(); });

  function renderNode() {
    State.locked = false;
    const node = State.conv.nodes[State.nodeId];
    if (!node) { endConversation(); return; }
    const kd = STORY[State.kaijuId];
    // Record this line in the phrase journal so the kid can replay
    // it any time from the journal panel.
    if (node.en) recordPhrase(State.kaijuId, node.en, node.jp);
    // Scene transition if this node specifies one
    if (node.scene) setScene(node.scene);
    // Mood emoji
    const moodMap = kd.moodEmoji || {};
    $("vn-mood").textContent = moodMap[node.mood] || "😄";
    $("vn-mood").style.animation = "none"; void $("vn-mood").offsetWidth; $("vn-mood").style.animation = "";
    // Bubble — word-tap spans
    const bubble = $("vn-bubble"); bubble.innerHTML = "";
    wrapWords(node.en).forEach(n => bubble.appendChild(n));
    if (node.jp) {
      const jpLine = document.createElement("div");
      jpLine.style.cssText = "font-size:12px; color:#6a4a7a; margin-top:6px; font-weight:500;";
      jpLine.textContent = node.jp;
      bubble.appendChild(jpLine);
    }
    // Kaiju animation
    const kj = $("vn-kaiju");
    kj.classList.remove("speak"); void kj.offsetWidth; kj.classList.add("speak");
    // Play kaiju voice
    setTimeout(() => playKaijuAudio(State.kaijuId, node.en), 280);
    // Choices
    const wrap = $("vn-choices"); wrap.innerHTML = "";
    if (!node.choices || node.choices.length === 0) {
      const b = document.createElement("button");
      b.className = "choice-btn";
      const enWrap = document.createElement("div"); enWrap.className = "ch-en";
      wrapWords("Continue →").forEach(n => enWrap.appendChild(n));
      const jpWrap = document.createElement("div"); jpWrap.className = "ch-jp"; jpWrap.textContent = "つぎ へ";
      b.appendChild(enWrap); b.appendChild(jpWrap);
      b.addEventListener("pointerdown", (e) => { if (e.target.classList && e.target.classList.contains("word")) return; SND.sfxPop(); endConversation(); });
      wrap.appendChild(b);
      return;
    }
    // Shuffle choices so good answer isn't always first
    const choices = node.choices.slice();
    for (let i = choices.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    choices.forEach(c => {
      const b = document.createElement("button");
      b.className = "choice-btn";
      const enWrap = document.createElement("div"); enWrap.className = "ch-en";
      wrapWords(c.en).forEach(n => enWrap.appendChild(n));
      const jpWrap = document.createElement("div"); jpWrap.className = "ch-jp"; jpWrap.textContent = c.jp;
      b.appendChild(enWrap); b.appendChild(jpWrap);
      b.addEventListener("pointerdown", (e) => {
        // Ignore word taps so they don't double-fire
        if (e.target.classList && e.target.classList.contains("word")) return;
        if (State.locked) return;
        State.locked = true;
        onChoice(b, c);
      });
      wrap.appendChild(b);
    });
  }
  $("btn-replay-kaiju").addEventListener("click", () => {
    const node = State.conv.nodes[State.nodeId];
    if (node) { SND.sfxPop(); playKaijuAudio(State.kaijuId, node.en); }
  });

  function onChoice(btn, choice) {
    if (choice.outcome === "good") { btn.classList.add("picked-good"); SND.sfxCorrect(); }
    else if (choice.outcome === "bad") { btn.classList.add("picked-bad"); SND.sfxWrong(); }
    else { SND.sfxPop(); }
    playKidAudio(choice.en);
    State.outcomes.push(choice.outcome);
    setTimeout(() => {
      State.nodeId = choice.next;
      renderNode();
    }, 1200);
  }

  function endConversation() {
    const node = State.conv.nodes[State.nodeId];
    // Score the outcomes for the ending picker (this conv's terminal node)
    const goods = State.outcomes.filter(o => o === "good").length;
    const bads  = State.outcomes.filter(o => o === "bad").length;
    let tag = "neutral";
    if (goods >= 2 && bads === 0) tag = "warm";
    else if (bads > goods) tag = "cool";

    // The terminal node text doubles as the ending line
    const moodEmoji = (STORY[State.kaijuId].moodEmoji || {})[node ? node.mood : "happy"] || "😄";

    $("end-banner").textContent =
      tag === "warm" ? "FRIENDSHIP!" :
      tag === "cool" ? "TENSION!" : "OK ENDING";
    $("end-emoji").textContent = moodEmoji;
    $("end-en").textContent = node ? (node.en || "") : "";
    $("end-jp").textContent = node ? (node.jp || "") : "";
    $("end-stats").innerHTML = `カイジュウ: <span style="color:#ffe45c">${STORY[State.kaijuId].name}</span><br>かいわ: <span style="color:#ffe45c">${State.conv.title}</span>`;
    show("end");
    SND.sfxLevel();
    // Save
    markCompleted(State.kaijuId, State.conv.id, tag);
    spawnConfetti(24);
    if (node && node.en) setTimeout(() => playKaijuAudio(State.kaijuId, node.en), 400);
  }

  $("btn-conv-again").addEventListener("click", () => { SND.sfxConfirm(); openConvPicker(State.kaijuId); });
  $("btn-end-kaiju").addEventListener("click", () => { SND.sfxConfirm(); buildKaijuGrid(); show("kaiju"); });
  $("btn-end-home").addEventListener("click", () => { SND.sfxConfirm(); show("title"); renderMetShelf(); });

  function spawnConfetti(n) {
    const layer = document.createElement("div");
    layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:900;overflow:hidden;";
    document.body.appendChild(layer);
    const emojis = ["📖","✨","💫","🎉","💖","🌟","🐙","🐫","🍦"];
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

  // ----- BOOT -----
  renderMetShelf();
  show("title");
})();
