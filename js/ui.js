// All DOM rendering. Game logic calls these and provides callbacks.
window.UI = (() => {
  const SCREENS = ["title","setup","pass","role","wager","question","result","action","boss","victory","defeat","vote"];
  function $(id) { return document.getElementById(id); }

  // iOS-resilient tap handler: handles both touch and mouse, force-blurs any
  // focused input on tap so the soft keyboard doesn't eat the first tap.
  function tap(el, handler) {
    if (!el) return;
    let lastTouch = 0;
    function blurActive() {
      const a = document.activeElement;
      if (a && a !== el && (a.tagName === "INPUT" || a.tagName === "TEXTAREA") && a.blur) a.blur();
    }
    el.addEventListener("touchend", (e) => {
      if (e.cancelable) e.preventDefault();
      lastTouch = Date.now();
      blurActive();
      handler(e);
    }, { passive: false });
    el.addEventListener("click", (e) => {
      if (Date.now() - lastTouch < 800) return;
      blurActive();
      handler(e);
    });
  }
  function show(name) {
    SCREENS.forEach(n => {
      const el = $("screen-"+n);
      if (!el) return;
      el.classList.toggle("hidden", n !== name);
      if (n !== name) el.innerHTML = "";
    });
    // Exit button is visible during a fight (any in-game screen except title/setup/victory/defeat)
    const exitBtn = $("exit-btn");
    if (exitBtn) {
      const inFight = !["title","setup","victory","defeat"].includes(name);
      exitBtn.classList.toggle("hidden", !inFight);
    }
    window.scrollTo(0,0);
  }
  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    if (t.content.childElementCount > 1) {
      // Footgun: multiple top-level children would silently drop all but the first.
      console.warn("UI.el(): multiple top-level children — wrap them in a single element. Got:", html.slice(0, 120));
    }
    return t.content.firstElementChild;
  }
  function clear(id) { $("screen-"+id).innerHTML = ""; }

  let toastTimer = null;
  function toast(msg, ms=1400) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), ms);
  }

  // -------- TITLE --------
  function renderTitle({ onStart }) {
    show("title");
    const s = $("screen-title"); s.innerHTML = "";
    s.appendChild(el(`
      <div class="center" style="margin-top: 8vh;">
        <h1 class="pop">${JP.title}</h1>
        <div class="title-en bob">${JP.titleEn}</div>
        <div style="font-size: 80px; margin: 20px 0;" class="bob">🐙💩👾🦑</div>
        <button class="btn huge hot" id="btn-start">${JP.start} ⚔️</button>
        <div class="row" style="margin-top:8px;">
          <button class="btn ghost" id="btn-rules">あそびかた ❓</button>
          <button class="btn ghost" id="btn-settings">せってい ⚙️</button>
        </div>
        <div class="subtle" style="margin-top: 28px;">タップで おとが でます 🔊</div>
      </div>`));
    tap($("btn-start"), () => {
      try { SND.unlock(); SND.sfxPop(); } catch(e) {}
      onStart();
    });
    tap($("btn-rules"), () => {
      try { SND.unlock(); } catch(e) {}
      showRules(() => renderTitle({onStart}));
    });
    tap($("btn-settings"), () => {
      try { SND.unlock(); } catch(e) {}
      showSettings(() => renderTitle({onStart}));
    });
  }

  function showSettings(onBack) {
    show("title");
    const s = $("screen-title"); s.innerHTML = "";
    const isMuted = SND.isMuted();
    const voices = SND.listVoices ? SND.listVoices() : [];
    const currentName = (() => {
      try { return localStorage.getItem("kjb_voice") || ""; } catch(e) { return ""; }
    })();
    s.appendChild(el(`
      <div class="center" style="max-width: 600px; margin: 32px auto; padding: 0 12px;">
        <h2>せってい ⚙️</h2>
        <div style="background:var(--card); border-radius:14px; padding:18px; box-shadow:var(--shadow); text-align:left;">
          <div style="font-size:18px; margin-bottom:8px;">おと</div>
          <button class="toggle ${isMuted?'':'on'}" id="mute-on" style="font-size:18px;padding:10px 16px;">🔊 おと ON</button>
          <button class="toggle ${isMuted?'on':''}" id="mute-off" style="font-size:18px;padding:10px 16px;">🔇 おと OFF (ミュート)</button>
          <div style="font-size:18px; margin:14px 0 8px;">えいごの こえ</div>
          <select id="voice-pick" style="font-size:16px; padding:8px; border-radius:8px; width:100%; max-width:340px;">
            <option value="">じどうで えらぶ</option>
            ${voices.map(v => `<option value="${escapeHTML(v.name)}" ${v.name===currentName?'selected':''}>${escapeHTML(v.name)} (${escapeHTML(v.lang)})</option>`).join("")}
          </select>
          <div class="row" style="margin-top:8px;">
            <button class="btn cool" id="voice-test" style="font-size:16px;min-height:44px;">🔊 テスト</button>
          </div>
        </div>
        <button class="btn huge cool" id="back-settings" style="margin-top:18px;">${JP.back}</button>
      </div>`));
    tap($("mute-on"), () => { SND.setMuted(false); SND.sfxPop(); showSettings(onBack); });
    tap($("mute-off"), () => { SND.setMuted(true); showSettings(onBack); });
    tap($("voice-test"), () => { SND.speak("Hello! Let's play."); });
    const vsel = $("voice-pick");
    if (vsel) vsel.onchange = () => { SND.setVoice(vsel.value || null); };
    tap($("back-settings"), () => onBack());
  }

  // -------- SETUP --------
  function renderSetup({ onConfirm }) {
    show("setup");
    clear("setup");
    const s = $("screen-setup");
    let count = 3;
    let level = 2;        // global default level
    let jinro = false;
    let advanced = false; // show per-player level overrides
    let timerSec = 0;     // 0 = no timer; otherwise seconds per question
    let hardMode = false; // boss attacks require defensive Q to dodge
    // Pre-fill name fields with shuffled, unique funny names — kids see them on entry
    // and can keep them or type over them.
    const namePool = (window.FUNNY_NAMES || []).slice();
    for (let i = namePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [namePool[i], namePool[j]] = [namePool[j], namePool[i]];
    }
    const names = namePool.slice(0, 6);
    while (names.length < 6) names.push("");
    const playerLevels = [null,null,null,null,null,null]; // null = use global

    function pickFunnyName(usedNames) {
      const pool = (window.FUNNY_NAMES || []).filter(n => !usedNames.includes(n));
      if (!pool.length) return JP.player_n(usedNames.length+1);
      return pool[(Math.random()*pool.length)|0];
    }

    function redraw() {
      s.innerHTML = "";
      s.appendChild(el(`
        <div class="center" style="width:100%;">
          <h2>${JP.setup_title}</h2>
          <div class="subtle">${JP.player_count}</div>
          <div class="row" id="count-row"></div>
          <div class="subtle" style="margin-top:12px;">${JP.level}（みんなの デフォルト）</div>
          <div class="row" id="lvl-row"></div>
          <div class="row" id="names-row"></div>
          <div class="row" style="margin-top:8px;">
            <button class="toggle ${advanced?'on':''}" id="adv-toggle">${advanced?'こべつレベル ON':'こべつレベル OFF'}</button>
          </div>
          <div class="row" style="margin-top:8px;">
            <span class="subtle" style="margin-right:8px;">じかん せいげん:</span>
            <button class="toggle ${timerSec===0?'on':''}" data-sec="0">なし</button>
            <button class="toggle ${timerSec===30?'on':''}" data-sec="30">30びょう</button>
            <button class="toggle ${timerSec===20?'on':''}" data-sec="20">20びょう</button>
            <button class="toggle ${timerSec===10?'on':''}" data-sec="10">10びょう</button>
          </div>
          <div class="row" style="margin-top:8px;">
            <button class="toggle ${hardMode?'on':''}" id="hard-toggle">${hardMode?'ハードモード ON (こたえて かわす!)':'ハードモード OFF'}</button>
          </div>
          ${count >= 4 ? `
            <div class="subtle" style="margin-top:12px;">${JP.jinro_hint}</div>
            <div class="row"><button class="toggle ${jinro?'on':''}" id="jinro-toggle">${jinro?JP.jinro_on:JP.jinro_off}</button></div>
          ` : ``}
          <div class="row" style="margin-top:24px;">
            <button class="btn huge good" id="go">${JP.start_battle} 🚀</button>
            <button class="btn ghost" id="back">${JP.back}</button>
          </div>
        </div>
      `));
      const cr = $("count-row");
      [1,2,3,4,5,6].forEach(n => {
        const b = el(`<button class="toggle ${count===n?'on':''}">${n}</button>`);
        tap(b, () => { count = n; if (count < 4) jinro = false; redraw(); });
        cr.appendChild(b);
      });
      const lr = $("lvl-row");
      [[1,JP.level1],[2,JP.level2],[3,JP.level3]].forEach(([n, lbl]) => {
        const b = el(`<button class="toggle ${level===n?'on':''}" style="font-size:14px;">${lbl}</button>`);
        tap(b, () => { level = n; redraw(); });
        lr.appendChild(b);
      });
      const nr = $("names-row");
      nr.style.flexDirection = "column";
      nr.style.alignItems = "center";
      for (let i = 0; i < count; i++) {
        const wrap = document.createElement("div");
        wrap.style.cssText = "display:flex;gap:6px;align-items:center;margin:4px 0;flex-wrap:wrap;justify-content:center;";
        const inp = el(`<input class="player-input" maxlength="10" placeholder="${JP.player_n(i+1)}" value="${escapeHTML(names[i]||"")}"/>`);
        inp.oninput = (e) => { names[i] = e.target.value; };
        wrap.appendChild(inp);
        if (advanced) {
          [["★",1],["★★",2],["★★★",3]].forEach(([lbl, n]) => {
            const cur = playerLevels[i] ?? level;
            const b = el(`<button class="toggle ${cur===n?'on':''}" style="font-size:14px;padding:6px 10px;">L${n}</button>`);
            tap(b, () => { playerLevels[i] = n; redraw(); });
            wrap.appendChild(b);
          });
        }
        nr.appendChild(wrap);
      }
      tap($("adv-toggle"), () => { advanced = !advanced; redraw(); });
      tap($("hard-toggle"), () => { hardMode = !hardMode; redraw(); });
      // Timer buttons (data-sec attribute on each toggle)
      s.querySelectorAll("[data-sec]").forEach(b => tap(b, () => { timerSec = parseInt(b.dataset.sec,10); redraw(); }));
      const jinroBtn = $("jinro-toggle"); if (jinroBtn) tap(jinroBtn, () => { jinro = !jinro; redraw(); });
      tap($("go"), () => {
        const used = [];
        const finalNames = names.slice(0, count).map((n,i) => {
          const trimmed = n.trim();
          if (trimmed) { used.push(trimmed); return trimmed; }
          const fn = pickFunnyName(used);
          used.push(fn); return fn;
        });
        const finalLevels = playerLevels.slice(0, count).map(l => l ?? level);
        SND.sfxPop();
        onConfirm({ count, level, levels: finalLevels, jinro: jinro && count >= 4, names: finalNames, timerSec, hardMode });
      });
      tap($("back"), () => location.reload());
    }
    redraw();
  }

  // -------- PASS / hand-off --------
  function renderPass(playerName, onReady) {
    show("pass");
    const s = $("screen-pass");
    s.innerHTML = `
      <div class="center" style="margin-top: 18vh;">
        <div class="pass-big bob">📱</div>
        <h2>${JP.pass_to(playerName)}</h2>
        <div class="pass-instr" style="white-space: pre-line;">${JP.pass_instr}</div>
        <button class="btn huge cool" id="ready">${JP.ok}</button>
      </div>`;
    tap($("ready"), () => { SND.sfxPop(); onReady(); });
  }

  // -------- ROLE REVEAL (Jinro) --------
  function renderRole(player, isSpy, onDone) {
    show("role");
    const s = $("screen-role");
    s.innerHTML = `
      <div class="center" style="margin-top:12vh;">
        <div class="role-card ${isSpy?'spy':'hero'}">
          <div class="role-name">${isSpy?JP.role_spy_title:JP.role_hero_title}</div>
          <div style="font-size:20px;margin:12px 0;">${isSpy?JP.role_spy_text:JP.role_hero_text}</div>
          <div style="font-size:60px;">${isSpy?'🕵️':'⚔️'}</div>
        </div>
        <div class="subtle" style="margin-top:12px;">じぶんだけ みてね</div>
        <button class="btn huge ghost" id="ok">${JP.ok}</button>
      </div>`;
    tap($("ok"), () => onDone());
  }

  // -------- WAGER --------
  function renderWager(player, boss, players, onPick, onCard) {
    show("wager");
    const s = $("screen-wager"); s.innerHTML = "";
    s.appendChild(el(buildHeader(boss, players, player)));
    s.appendChild(el(`
      <div class="center" style="width:100%;">
        <h3>${JP.wager_title}</h3>
        <div class="wager-grid">
          <button class="wager-btn" data-stars="1">
            <div class="s">★</div>
            <div class="lbl">${JP.wager_easy}</div>
            <div class="reward">${JP.wager_reward(1)}</div>
            <div style="font-size:12px;color:#aaa;">ダメージ +1</div>
          </button>
          <button class="wager-btn" data-stars="2">
            <div class="s">★★</div>
            <div class="lbl">${JP.wager_med}</div>
            <div class="reward">${JP.wager_reward(2)}</div>
            <div style="font-size:12px;color:#aaa;">ダメージ +2</div>
          </button>
          <button class="wager-btn" data-stars="3">
            <div class="s">★★★</div>
            <div class="lbl">${JP.wager_hard}</div>
            <div class="reward">${JP.wager_reward(3)}</div>
            <div style="font-size:12px;color:#aaa;">ダメージ +3</div>
          </button>
        </div>
        <div style="margin-top:14px;" id="hand-area"></div>
      </div>`));
    s.querySelectorAll(".wager-btn").forEach(b => tap(b, () => {
      SND.sfxPop();
      onPick(parseInt(b.dataset.stars,10));
    }));
    renderHandInto($("hand-area"), player, /*beforeQ*/true, onCard);
  }

  // -------- QUESTION --------
  function renderQuestion(player, question, boss, players, opts, onAnswer, onUseHint) {
    show("question");
    const s = $("screen-question"); s.innerHTML = "";
    s.appendChild(el(buildHeader(boss, players, player)));
    const stars = "★".repeat(question.stars);
    let displayPrompt = "";
    if (question.promptImage) displayPrompt += `<div style="font-size:120px;line-height:1;">${question.promptImage}</div>`;
    if (question.prompt) displayPrompt += `<div class="question-prompt-en">${escapeHTML(question.prompt).replace(/\n/g,"<br>")}</div>`;
    if (!question.prompt && !question.promptImage && question.audio) {
      displayPrompt += `<button class="listen-btn" id="listen-btn">🔊</button>`;
    }

    // Apply hint mask
    const masked = (opts.hintMaskIdx ?? -1);

    const timerSec = (opts && opts.timerSec) || 0;
    const timerHtml = timerSec > 0 ? `<div class="q-timer" id="q-timer">⏱️ <span id="q-timer-num">${timerSec}</span></div>` : "";
    s.appendChild(el(`
      <div class="question-card">
        ${timerHtml}
        <div class="stars">${stars}</div>
        <div class="question-prompt-jp">${question.prompt_jp}</div>
        ${displayPrompt}
        <div class="options" id="opts"></div>
        ${question.audio ? `<div class="row" style="margin-top:12px;"><button class="btn ghost" id="say-again">🔊 もういっかい</button></div>` : ``}
      </div>
    `));
    let timerHandle = null;
    let answered = false;
    if (timerSec > 0) {
      let remaining = timerSec;
      const tn = $("q-timer-num");
      timerHandle = setInterval(() => {
        if (answered) { clearInterval(timerHandle); return; }
        remaining--;
        if (tn) tn.textContent = remaining;
        const t = $("q-timer");
        if (t && remaining <= 5) t.classList.add("low");
        if (remaining <= 0) {
          clearInterval(timerHandle);
          if (!answered) {
            answered = true;
            const right = optsEl.querySelector(`[data-i="${question.answer}"]`);
            if (right) right.classList.add("right");
            optsEl.querySelectorAll(".opt").forEach(x => x.classList.add("disabled"));
            SND.sfxWrong();
            setTimeout(() => onAnswer(false, -1), 850);
          }
        }
      }, 1000);
    }
    const optsEl = $("opts");
    question.options.forEach((opt, i) => {
      const disabled = i === masked;
      const o = el(`<div class="opt ${disabled?'disabled':''}" data-i="${i}">${escapeHTML(opt)}</div>`);
      if (!disabled) {
        tap(o, () => {
          if (answered) return;
          answered = true;
          if (timerHandle) clearInterval(timerHandle);
          const correct = i === question.answer;
          o.classList.add(correct ? "right" : "wrong");
          if (!correct) {
            const right = optsEl.querySelector(`[data-i="${question.answer}"]`);
            if (right) right.classList.add("right");
          }
          optsEl.querySelectorAll(".opt").forEach(x => x.classList.add("disabled"));
          if (correct) SND.sfxCorrect(); else SND.sfxWrong();
          setTimeout(() => onAnswer(correct, i), 850);
        });
      }
      optsEl.appendChild(o);
    });

    if (question.audio) {
      const speak = () => SND.speak(question.audio);
      const lb = $("listen-btn"); if (lb) tap(lb, speak);
      const sa = $("say-again"); if (sa) tap(sa, speak);
      // Auto-speak after a tick if listen-only
      if (!question.prompt && !question.promptImage) {
        setTimeout(speak, 350);
      }
    }
  }

  // -------- RANDOM POP-IN EVENTS (fairy / bomb / thief) --------
  // Each shows in a modal overlay. Caller passes `onResolve(effect)` where
  // effect is whatever the event decided to do.

  const FAIRY_SVG = `
    <svg viewBox="0 0 200 240" class="event-svg" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="55" cy="105" rx="42" ry="55" fill="#ffc8e0" opacity=".75" stroke="#ff7aa8" stroke-width="2.5" transform="rotate(-22 55 105)"/>
      <ellipse cx="145" cy="105" rx="42" ry="55" fill="#ffc8e0" opacity=".75" stroke="#ff7aa8" stroke-width="2.5" transform="rotate(22 145 105)"/>
      <rect x="80" y="98" width="40" height="55" fill="#ff8ecf" stroke="#000" stroke-width="3"/>
      <path d="M 70 145 Q 100 178 130 145 L 142 175 Q 100 195 58 175 Z" fill="#ffaadc" stroke="#000" stroke-width="3"/>
      <path d="M 75 165 Q 100 195 125 165 L 138 198 Q 100 215 62 198 Z" fill="#ff8ecf" stroke="#000" stroke-width="3"/>
      <line x1="92" y1="200" x2="84" y2="232" stroke="#fde0c0" stroke-width="7" stroke-linecap="round"/>
      <line x1="108" y1="200" x2="116" y2="232" stroke="#fde0c0" stroke-width="7" stroke-linecap="round"/>
      <ellipse cx="84" cy="234" rx="8" ry="4" fill="#000"/>
      <ellipse cx="116" cy="234" rx="8" ry="4" fill="#000"/>
      <circle cx="100" cy="65" r="36" fill="#fde0c0" stroke="#000" stroke-width="3"/>
      <ellipse cx="100" cy="48" rx="22" ry="10" fill="#f4caa0" opacity=".7"/>
      <path d="M 65 70 Q 60 55 70 50 L 76 76 Q 70 80 65 70 Z" fill="#3a2a1a" stroke="#000" stroke-width="2"/>
      <path d="M 135 70 Q 140 55 130 50 L 124 76 Q 130 80 135 70 Z" fill="#3a2a1a" stroke="#000" stroke-width="2"/>
      <path d="M 75 78 Q 100 105 125 78 L 122 100 Q 100 115 78 100 Z" fill="#fff" stroke="#000" stroke-width="2.5"/>
      <path d="M 85 95 Q 100 110 115 95" stroke="#ddd" stroke-width="1.5" fill="none"/>
      <path d="M 84 60 Q 90 55 96 60" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M 104 60 Q 110 55 116 60" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="80" cy="73" rx="6" ry="3" fill="#ff88bb" opacity=".7"/>
      <ellipse cx="120" cy="73" rx="6" ry="3" fill="#ff88bb" opacity=".7"/>
      <line x1="135" y1="138" x2="172" y2="78" stroke="#a06030" stroke-width="4" stroke-linecap="round"/>
      <g class="fairy-wand-star">
        <path d="M 168 70 L 174 81 L 186 81 L 176 89 L 180 100 L 168 93 L 156 100 L 160 89 L 150 81 L 162 81 Z" fill="#ffe45c" stroke="#000" stroke-width="2"/>
      </g>
    </svg>`;

  const BOMB_SVG = `
    <svg viewBox="0 0 200 220" class="event-svg" xmlns="http://www.w3.org/2000/svg">
      <path d="M 100 50 Q 115 35 100 18 Q 85 0 105 -8" stroke="#a06030" stroke-width="4" fill="none" transform="translate(0 28)"/>
      <circle cx="105" cy="22" r="10" fill="#ffaa00"/>
      <circle cx="105" cy="22" r="6" fill="#ffe45c"/>
      <circle cx="98" cy="14" r="3" fill="#ff5500"/>
      <circle cx="100" cy="135" r="68" fill="#222" stroke="#000" stroke-width="3"/>
      <ellipse cx="78" cy="105" rx="22" ry="11" fill="#fff" opacity=".25"/>
      <circle cx="80" cy="125" r="14" fill="#fff"/>
      <circle cx="120" cy="125" r="14" fill="#fff"/>
      <circle cx="83" cy="129" r="7" fill="#000"/>
      <circle cx="123" cy="129" r="7" fill="#000"/>
      <circle cx="86" cy="125" r="2.5" fill="#fff"/>
      <circle cx="126" cy="125" r="2.5" fill="#fff"/>
      <path d="M 85 155 Q 100 168 115 155" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
      <text x="100" y="195" text-anchor="middle" font-size="14" fill="#ff8888" font-weight="900">DON'T MESS UP!</text>
    </svg>`;

  const THIEF_SVG = `
    <svg viewBox="0 0 220 200" class="event-svg" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="110" cy="148" rx="55" ry="42" fill="#1a1a1a" stroke="#000" stroke-width="3"/>
      <circle cx="110" cy="80" r="42" fill="#1a1a1a" stroke="#000" stroke-width="3"/>
      <polygon points="78,55 82,28 96,52" fill="#1a1a1a" stroke="#000" stroke-width="3"/>
      <polygon points="142,55 138,28 124,52" fill="#1a1a1a" stroke="#000" stroke-width="3"/>
      <polygon points="80,55 84,38 92,52" fill="#ff88bb"/>
      <polygon points="140,55 136,38 128,52" fill="#ff88bb"/>
      <rect x="68" y="70" width="84" height="20" fill="#fff" stroke="#000" stroke-width="2.5"/>
      <ellipse cx="92" cy="80" rx="6" ry="9" fill="#88ff44"/>
      <ellipse cx="128" cy="80" rx="6" ry="9" fill="#88ff44"/>
      <ellipse cx="92" cy="80" rx="2.2" ry="7" fill="#000"/>
      <ellipse cx="128" cy="80" rx="2.2" ry="7" fill="#000"/>
      <polygon points="106,95 110,100 114,95" fill="#ff88bb"/>
      <path d="M 100 105 Q 110 112 120 105 Q 124 108 128 102" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>
      <line x1="65" y1="98" x2="82" y2="100" stroke="#fff" stroke-width="1.5"/>
      <line x1="138" y1="100" x2="155" y2="98" stroke="#fff" stroke-width="1.5"/>
      <ellipse cx="50" cy="135" rx="22" ry="28" fill="#e8c890" stroke="#000" stroke-width="3"/>
      <path d="M 38 113 Q 50 108 62 113 L 60 116 Q 50 112 40 116 Z" fill="#a07030" stroke="#000" stroke-width="2"/>
      <text x="50" y="146" text-anchor="middle" font-size="28" font-weight="900" fill="#000">¥</text>
      <path d="M 160 145 Q 195 138 198 105 Q 198 80 178 90" stroke="#1a1a1a" stroke-width="14" fill="none" stroke-linecap="round"/>
    </svg>`;

  function showModal(html) {
    const modal = document.createElement("div");
    modal.className = "event-modal";
    modal.innerHTML = `<div class="event-card">${html}</div>`;
    document.body.appendChild(modal);
    return modal;
  }
  function closeModal(modal) { if (modal && modal.remove) modal.remove(); }

  // ✨ Fairy: bald ojisan in a tutu. Heals player to full no matter what they say.
  function renderFairyEvent(player, onResolve) {
    SND.unlock(); SND.sfxPop();
    const stage1 = `
      <div class="event-rare">★ レアキャラ あらわれた！ ★</div>
      <div class="event-name">きせき フェアリー</div>
      ${FAIRY_SVG}
      <div class="event-line">「ねえ ${escapeHTML(player.name)}くん〜 ✨<br>ぼく かわいい？」</div>
      <div class="event-buttons">
        <button class="btn good" id="ev-yes">うん かわいい！💖</button>
        <button class="btn bad" id="ev-no">ブサイク… 😬</button>
      </div>`;
    const modal = showModal(stage1);
    const finish = (saidYes) => {
      const reaction = saidYes
        ? "「うそ つかないで！しってる、ブサイクだって おもってる！😭」"
        : "「ひどい！なんて こと いうの！😡」";
      modal.querySelector(".event-card").innerHTML = `
        <div class="event-rare">★ レアキャラ ★</div>
        <div class="event-name">きせき フェアリー</div>
        ${FAIRY_SVG}
        <div class="event-line">${reaction}</div>
        <div class="event-line" style="color: var(--good);">「まあ いいや... HP ぜんぶ かいふくする！💖」</div>
        <div class="event-buttons">
          <button class="btn huge good" id="ev-ok">ありがとう ✨</button>
        </div>`;
      tap(modal.querySelector("#ev-ok"), () => {
        closeModal(modal);
        onResolve({ kind: "heal-full" });
      });
    };
    tap(modal.querySelector("#ev-yes"), () => finish(true));
    tap(modal.querySelector("#ev-no"), () => finish(false));
  }

  // 💣 Bomb-kun: gives a quick question. Right = boss takes 15 dmg, wrong = player takes 8.
  function renderBombEvent(player, question, onResolve) {
    SND.unlock(); SND.sfxBoss();
    let displayPrompt = "";
    if (question.promptImage) displayPrompt += `<div style="font-size:64px;line-height:1;">${question.promptImage}</div>`;
    if (question.prompt) displayPrompt += `<div class="question-prompt-en" style="font-size:24px;">${escapeHTML(question.prompt).replace(/\n/g,"<br>")}</div>`;
    const html = `
      <div class="event-rare">★ レアキャラ ★</div>
      <div class="event-name">ジバク くん 💣</div>
      ${BOMB_SVG}
      <div class="event-line">「シュー〜… こたえれば<br>ボスに ばくはつ！まちがえたら キミに ばくはつ！」</div>
      <div style="background:rgba(0,0,0,.4); padding:12px; border-radius:14px; margin:8px 0;">
        <div class="question-prompt-jp">${question.prompt_jp}</div>
        ${displayPrompt}
        <div class="options" id="bomb-opts" style="margin-top:8px;"></div>
      </div>`;
    const modal = showModal(html);
    const optsEl = modal.querySelector("#bomb-opts");
    let answered = false;
    question.options.forEach((opt, i) => {
      const o = document.createElement("div");
      o.className = "opt"; o.dataset.i = i; o.textContent = opt;
      tap(o, () => {
        if (answered) return; answered = true;
        const correct = i === question.answer;
        o.classList.add(correct ? "right" : "wrong");
        if (!correct) {
          const right = optsEl.querySelector(`[data-i="${question.answer}"]`);
          if (right) right.classList.add("right");
        }
        optsEl.querySelectorAll(".opt").forEach(x => x.classList.add("disabled"));
        if (correct) SND.sfxCorrect(); else SND.sfxWrong();
        const reaction = correct ? "「ドカーン！ボスを ふっとばす！💥」" : "「ばくはつ ミス…キミに あたる！💥」";
        modal.querySelector(".event-card").innerHTML = `
          <div class="event-rare">★ レアキャラ ★</div>
          <div class="event-name">ジバク くん 💣</div>
          ${BOMB_SVG}
          <div class="event-line">${reaction}</div>
          <div class="event-buttons">
            <button class="btn huge ${correct?'good':'bad'}" id="ev-ok">${correct?'やったー！':'いてて…'}</button>
          </div>`;
        tap(modal.querySelector("#ev-ok"), () => {
          closeModal(modal);
          onResolve({ kind: "bomb", correct });
        });
      });
      optsEl.appendChild(o);
    });
    if (question.audio) {
      setTimeout(() => SND.speak(question.audio), 250);
    }
  }

  // 🐱 Thief Cat: steals HP from boss, gives to player.
  function renderThiefEvent(player, onResolve) {
    SND.unlock(); SND.sfxPop();
    const sassy = pickRand([
      "「にゃー！ボスから ちょっと かりてきた！🎒」",
      "「すきあり！ ボスの エナジー いただき〜！」",
      "「キミに あげる、ぼくは いそがしいから！にゃっ！」",
      "「コソコソ コソコソ… うふふ〜！」",
      "「ボスの しっぽから 5 もらってきた！」"
    ]);
    const html = `
      <div class="event-rare">★ レアキャラ ★</div>
      <div class="event-name">どろぼう ねこ 🐈‍⬛</div>
      ${THIEF_SVG}
      <div class="event-line">${sassy}</div>
      <div class="event-line" style="color:var(--good);">「ボスに 5ダメージ、キミに +5 HP！」</div>
      <div class="event-buttons">
        <button class="btn huge good" id="ev-ok">サンキュー！🐾</button>
      </div>`;
    const modal = showModal(html);
    tap(modal.querySelector("#ev-ok"), () => {
      closeModal(modal);
      onResolve({ kind: "thief" });
    });
  }

  // -------- DEFENSE Q (hard mode) --------
  // Boss is about to attack `player` for `dmg`. Show a fast 6s question — right answer dodges.
  function renderDefenseQ(player, question, dmg, boss, players, onResolve) {
    show("question");
    const s = $("screen-question"); s.innerHTML = "";
    s.appendChild(el(buildHeader(boss, players, player)));
    let displayPrompt = "";
    if (question.promptImage) displayPrompt += `<div style="font-size:84px;line-height:1;">${question.promptImage}</div>`;
    if (question.prompt) displayPrompt += `<div class="question-prompt-en">${escapeHTML(question.prompt).replace(/\n/g,"<br>")}</div>`;
    if (!question.prompt && !question.promptImage && question.audio) {
      displayPrompt += `<button class="listen-btn" id="listen-btn">🔊</button>`;
    }
    s.appendChild(el(`
      <div class="question-card" style="border:4px solid var(--bad);">
        <div class="q-timer" id="q-timer">⏱️ <span id="q-timer-num">6</span></div>
        <div style="font-size:22px;color:var(--hot);font-weight:900;">⚠️ ${escapeHTML(player.name)}, こたえて かわせ！</div>
        <div class="subtle">あたると ${dmg} ダメージ！</div>
        <div class="question-prompt-jp">${question.prompt_jp}</div>
        ${displayPrompt}
        <div class="options" id="opts"></div>
      </div>
    `));
    let answered = false;
    let timerHandle = null;
    let remaining = 6;
    const tn = $("q-timer-num");
    const optsEl = $("opts");
    timerHandle = setInterval(() => {
      if (answered) { clearInterval(timerHandle); return; }
      remaining--;
      if (tn) tn.textContent = remaining;
      const t = $("q-timer");
      if (t && remaining <= 3) t.classList.add("low");
      if (remaining <= 0) {
        clearInterval(timerHandle);
        if (!answered) {
          answered = true;
          const right = optsEl.querySelector(`[data-i="${question.answer}"]`);
          if (right) right.classList.add("right");
          optsEl.querySelectorAll(".opt").forEach(x => x.classList.add("disabled"));
          SND.sfxWrong();
          setTimeout(() => onResolve(false), 700);
        }
      }
    }, 1000);
    question.options.forEach((opt, i) => {
      const o = el(`<div class="opt" data-i="${i}">${escapeHTML(opt)}</div>`);
      tap(o, () => {
        if (answered) return;
        answered = true;
        clearInterval(timerHandle);
        const correct = i === question.answer;
        o.classList.add(correct ? "right" : "wrong");
        if (!correct) {
          const right = optsEl.querySelector(`[data-i="${question.answer}"]`);
          if (right) right.classList.add("right");
        }
        optsEl.querySelectorAll(".opt").forEach(x => x.classList.add("disabled"));
        if (correct) SND.sfxCorrect(); else SND.sfxWrong();
        setTimeout(() => onResolve(correct), 700);
      });
      optsEl.appendChild(o);
    });
    if (question.audio) {
      const speak = () => SND.speak(question.audio);
      const lb = $("listen-btn"); if (lb) tap(lb, speak);
      if (!question.prompt && !question.promptImage) setTimeout(speak, 250);
    }
  }

  // -------- RESULT --------
  function renderResult({ correct, energyEarned, cardsDrawn, question, chosen, player, boss, players }, onContinue) {
    show("result");
    const s = $("screen-result"); s.innerHTML = "";
    s.appendChild(el(buildHeader(boss, players, player)));
    const cheer = correct ? pickRand(JP.correct_cheer) : pickRand(JP.wrong_burn);
    let wrongDetail = "";
    if (!correct && question) {
      const correctText = question.options[question.answer];
      const yourAnswer = (typeof chosen === "number" && chosen >= 0) ? question.options[chosen] : "—";
      const explainHtml = question.explain ? `<div style="font-size:18px;color:#d8c8ff;margin-top:8px;">💡 ${escapeHTML(question.explain)}</div>` : "";
      wrongDetail = `
        <div style="background:var(--card);border-radius:14px;padding:14px 18px;margin:12px auto;max-width:560px;text-align:left;box-shadow:var(--shadow);">
          <div style="font-size:16px;color:#aaa;">あなたの こたえ:</div>
          <div style="font-size:22px;color:var(--bad);font-weight:900;">${escapeHTML(yourAnswer)}</div>
          <div style="font-size:16px;color:#aaa;margin-top:8px;">ただしい こたえ:</div>
          <div style="font-size:24px;color:var(--good);font-weight:900;">${escapeHTML(correctText)}</div>
          ${explainHtml}
        </div>`;
    }
    s.appendChild(el(`
      <div class="center" style="width:100%;">
        <h2 class="${correct?'pop':''}">${correct?JP.correct:JP.wrong}</h2>
        <div style="font-size:24px;color:${correct?'var(--good)':'var(--bad)'};margin: 6px 0;">${cheer}</div>
        ${correct ? `
          <div style="font-size:20px;">${JP.earned_energy(energyEarned)}</div>
          <div style="font-size:20px;">${JP.draw_card(cardsDrawn)}</div>
        ` : wrongDetail}
        <button class="btn huge ${correct?'good':'ghost'}" id="cont">${JP.next}</button>
      </div>`));
    tap($("cont"), () => onContinue());
    // Speak the correct answer on wrong-answer to help kids who can't read it yet.
    if (!correct && question && question.options && typeof question.answer === "number") {
      const txt = question.options[question.answer];
      if (typeof txt === "string" && /[a-zA-Z]/.test(txt)) {
        setTimeout(() => SND.speak(txt), 350);
      }
    }
  }

  // -------- ACTION (attack / cards) --------
  function renderAction(player, boss, players, onAttack, onCard, onEnd) {
    show("action");
    const s = $("screen-action"); s.innerHTML = "";
    s.appendChild(el(buildHeader(boss, players, player)));
    const hasAtk = player.attackPower > 0;
    s.appendChild(el(`
      <div class="center" style="width:100%;">
        <h3>${hasAtk ? "カイジュウを やっつけろ！" : "ターンを おわるよ"}</h3>
        <div class="subtle">エナジー ${player.energy}${hasAtk?` / こうげきパワー ${player.attackPower}`:""}</div>
        <div class="row">
          ${hasAtk
            ? `<button class="btn huge hot" id="atk">⚔️ ${JP.action_attack}！</button>`
            : `<button class="btn huge cool" id="end">${JP.action_end} →</button>`
          }
        </div>
        ${hasAtk ? `<button class="btn ghost" id="end" style="margin-top:8px;font-size:14px;">${JP.action_end}</button>` : ``}
        <h3 style="margin-top:16px;">カード</h3>
        <div id="hand-area"></div>
      </div>
    `));
    if (hasAtk) {
      tap($("atk"), () => onAttack());
    }
    tap($("end"), () => { SND.sfxPop(); onEnd(); });
    renderHandInto($("hand-area"), player, false, onCard);
  }

  // -------- TARGET PICKER --------
  // If active player is a spy, also show teammate-attack and boss-heal sabotage options.
  function renderTargetPicker(player, boss, players, onPick, onCancel) {
    show("action");
    const s = $("screen-action"); s.innerHTML = "";
    s.appendChild(el(buildHeader(boss, players, player)));
    const isSpy = player.role === "spy";
    s.appendChild(el(`
      <div class="center" style="width:100%;">
        <h3>${JP.pick_target}</h3>
        <div class="parts-pick" id="parts"></div>
        ${isSpy ? `
          <div class="subtle" style="margin-top:14px;color:#ff7799;font-weight:900;">🕵️ スパイの ひみつ オプション</div>
          <div class="parts-pick" id="spy-targets"></div>
        ` : ``}
        <button class="btn ghost" id="cancel">${JP.cancel}</button>
      </div>`));
    const partsEl = $("parts");
    boss.parts.forEach(p => {
      const dead = p.hp <= 0;
      const effLabel = effectLabel(p);
      const isCore = p.effect === "win";
      const cls = `part-btn ${dead?'dead':''} ${isCore?'core-btn':''}`;
      const icon = isCore ? "⭐ " : "";
      const node = el(`<button class="${cls}">
        <div class="pn">${icon}${p.name_jp}${isCore?' （よわてん）':''}</div>
        <div class="ph">HP ${Math.max(0,p.hp)}/${p.maxHP}</div>
        <div class="pe">${effLabel}</div>
      </button>`);
      if (!dead) tap(node, () => { SND.sfxPop(); onPick({ kind: "boss-part", part: p }); });
      partsEl.appendChild(node);
    });
    if (isSpy) {
      const sp = $("spy-targets");
      players.filter(pp => !pp.dead && pp.id !== player.id).forEach(teammate => {
        const node = el(`<button class="part-btn" style="border-color:#ff7799;">
          <div class="pn">😈 ${escapeHTML(teammate.name)}</div>
          <div class="ph">HP ${teammate.hp}/${teammate.maxHp}</div>
          <div class="pe" style="color:#ff7799;">なかまを こうげき！</div>
        </button>`);
        tap(node, () => { SND.sfxPop(); onPick({ kind: "teammate", target: teammate }); });
        sp.appendChild(node);
      });
      const healBoss = el(`<button class="part-btn" style="border-color:#ff7799;">
        <div class="pn">💚 ボスを かいふく</div>
        <div class="ph">+5 ボスHP</div>
        <div class="pe" style="color:#ff7799;">こっそり たすける</div>
      </button>`);
      tap(healBoss, () => { SND.sfxPop(); onPick({ kind: "heal-boss" }); });
      sp.appendChild(healBoss);
    }
    tap($("cancel"), () => onCancel());
  }

  function effectLabel(p) {
    switch (p.effect) {
      case "atk-1": return "1あし: ボス -1こうげき";
      case "miss-50": return "目: ボス はずれやすく";
      case "miss-40": return "目: ボス はずれやすく";
      case "miss-30": return "目: ボス はずれやすく";
      case "no-poison": return "くち: どくが でない";
      case "no-special": return "とくしゅ こうげき ふうじ";
      case "weak-spot": return "よわてん！ ダメージ +50%";
      case "slow": return "あし: ボス おそく";
      case "win": return "コア！ こわすと しょうり！";
      default: return "";
    }
  }

  // -------- BOSS TURN --------
  function renderBoss(boss, players, log, onContinue) {
    show("boss");
    const s = $("screen-boss"); s.innerHTML = "";
    s.appendChild(el(buildHeader(boss, players, null)));
    s.appendChild(el(`
      <div class="center" style="width:100%;">
        <h2>${JP.boss_turn} 👹</h2>
        <div class="boss-bubble" style="position:static;display:inline-block;margin:12px;">${pickRand([boss.catchphrase, ...JP.boss_atk_words])}</div>
        <div id="log" style="font-size:18px; margin: 12px auto; line-height:1.6; max-width:600px; max-height: 30vh; overflow-y: auto;"></div>
        <button class="btn huge cool" id="cont">${JP.next}</button>
      </div>`));
    const logEl = $("log");
    log.forEach(line => {
      const p = el(`<div>${line}</div>`);
      logEl.appendChild(p);
    });
    SND.sfxBoss();
    tap($("cont"), () => onContinue());
  }

  // -------- VICTORY / DEFEAT --------
  function renderVictory({ players, jinro, spyWins }, onAgain, onTitle) {
    show("victory");
    const s = $("screen-victory"); s.innerHTML = "";
    SND.sfxVictory();
    let title = JP.victory;
    if (jinro && spyWins) title = JP.spy_wins;
    if (jinro && !spyWins) title = JP.hero_wins;
    s.appendChild(el(`
      <div class="center" style="margin-top:8vh;">
        <h1 class="pop">${title} 🎉</h1>
        <div style="font-size:120px;" class="bob">🏆</div>
        <div style="font-size:22px;color:var(--good);">${JP.victory_sub}</div>
        <div style="margin-top:24px;">
          ${players.map(p => `<div>${p.name}: HP ${p.hp} ${p.role==='spy'?'🕵️':''}</div>`).join("")}
        </div>
        <div class="row" style="margin-top:24px;">
          <button class="btn huge good" id="again">${JP.play_again}</button>
          <button class="btn ghost" id="title">${JP.back_to_title}</button>
        </div>
      </div>`));
    tap($("again"), () => onAgain());
    tap($("title"), () => onTitle());
  }

  function renderDefeat({ players, jinro, spyWins }, onAgain, onTitle) {
    show("defeat");
    const s = $("screen-defeat"); s.innerHTML = "";
    SND.sfxDefeat();
    let title = JP.defeat;
    if (jinro && spyWins) title = JP.spy_wins;
    s.appendChild(el(`
      <div class="center" style="margin-top:8vh;">
        <h1 class="shake">${title} 💀</h1>
        <div style="font-size:120px;">😵</div>
        <div style="font-size:22px;color:var(--bad);">${JP.defeat_sub}</div>
        <div style="margin-top:24px;">
          ${players.map(p => `<div>${p.name}: HP ${p.hp} ${p.role==='spy'?'🕵️':''}</div>`).join("")}
        </div>
        <div class="row" style="margin-top:24px;">
          <button class="btn huge bad" id="again">${JP.play_again}</button>
          <button class="btn ghost" id="title">${JP.back_to_title}</button>
        </div>
      </div>`));
    tap($("again"), () => onAgain());
    tap($("title"), () => onTitle());
  }

  // -------- VOTE (Jinro mode) --------
  function renderVote(players, onVote, onSkip) {
    show("vote");
    const s = $("screen-vote"); s.innerHTML = "";
    s.appendChild(el(`
      <div class="center" style="margin-top:8vh;">
        <h2>${JP.vote_pick}</h2>
        <div style="font-size:60px;">🔍</div>
        <div class="vote-row" id="vrow"></div>
        <button class="btn ghost" id="skip">${JP.vote_skip}</button>
      </div>`));
    const vr = $("vrow");
    players.filter(p=>!p.dead).forEach(p => {
      const b = el(`<button class="vote-btn">${p.name}</button>`);
      tap(b, () => onVote(p));
      vr.appendChild(b);
    });
    tap($("skip"), () => onSkip());
  }

  // -------- HEADER (boss + players) --------
  function buildHeader(boss, players, currentPlayer) {
    const svg = boss ? Monsters.renderBossSVG(boss) : "";
    const playerTiles = (players||[]).map(p => `
      <div class="player ${currentPlayer && p.id===currentPlayer.id?'active':''} ${p.dead?'dead':''}">
        <div class="name">${escapeHTML(p.name)}</div>
        <div class="hp ${p.hp<=5?'low':''}">❤️ ${p.hp}</div>
        <div class="energy">⚡ ${p.energy} 🎴 ${p.hand?p.hand.length:0}</div>
      </div>`).join("");
    return `
      <div class="header-wrap">
        <div class="round-banner">${boss ? `${boss.name_jp}` : ""}</div>
        <div class="stage">${svg}</div>
        <div class="boss-name">${boss ? boss.name_jp : ""}</div>
        <div class="players">${playerTiles}</div>
      </div>
    `;
  }

  // -------- HAND --------
  function renderHandInto(container, player, beforeQ, onCard) {
    container.innerHTML = "";
    const hand = el(`<div class="hand"></div>`);
    if (!player.hand || !player.hand.length) {
      hand.appendChild(el(`<div class="subtle">カードなし</div>`));
    } else {
      player.hand.forEach((c, idx) => {
        const playable = (player.energy >= c.cost) && (!beforeQ || c.beforeQ);
        const node = el(`<div class="card ${playable?'':'unplayable'}">
          <div class="icon">${c.icon}</div>
          <div class="cname">${c.name_jp}</div>
          <div class="ctext">${c.text_jp}</div>
          <div class="ccost">⚡${c.cost}</div>
        </div>`);
        if (playable) tap(node, () => { SND.sfxCard(); onCard(c, idx); });
        hand.appendChild(node);
      });
    }
    container.appendChild(hand);
  }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }

  function showRules(onBack) {
    show("title");
    const s = $("screen-title"); s.innerHTML = "";
    s.appendChild(el(`
      <div class="center" style="max-width: 720px; margin: 24px auto; padding: 0 12px;">
        <h2>あそびかた 📖</h2>
        <div style="text-align:left; font-size:18px; line-height:1.7; background:var(--card); padding:18px; border-radius:14px; box-shadow:var(--shadow);">
          <p>🎯 <b>もくてき:</b> カイジュウの「コア」を こわせ！</p>
          <p>📱 <b>１人ずつ ばん:</b> iPad を まわして あそぶよ。</p>
          <p>1️⃣ ★1〜★3 から もんだいを えらぶ。むずかしいほど ダメージが ふえる！</p>
          <p>2️⃣ えいごの もんだいに こたえる。せいかい → エナジー＆こうげき！</p>
          <p>3️⃣ カイジュウの どこかを タップして こうげき！</p>
          <p>4️⃣ カードを つかって なかまを たすけよう！</p>
          <p>👹 <b>パーツ こわし:</b> あしを こわすと カイジュウの こうげきが へる！ 目を こわすと はずれやすく！</p>
          <p>🕵️ <b>うらぎりモード（4人〜）:</b> ひとりだけ スパイ！ばれずに みんなを まけさせよう。みんなは スパイを あてるか カイジュウを たおせば しょうり！</p>
          <p style="text-align:center; font-weight:900; color: var(--accent);">たのしんで〜！ 🎉</p>
        </div>
        <button class="btn huge cool" id="back-rules" style="margin-top:18px;">${JP.back}</button>
      </div>`));
    tap($("back-rules"), () => onBack());
  }

  return { renderTitle, renderSetup, renderPass, renderRole, renderWager, renderQuestion,
           renderResult, renderAction, renderTargetPicker, renderBoss, renderVictory,
           renderDefeat, renderVote, renderDefenseQ, toast, show, showRules, tap,
           renderFairyEvent, renderBombEvent, renderThiefEvent };
})();
