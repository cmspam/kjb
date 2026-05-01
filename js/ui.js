// All DOM rendering. Game logic calls these and provides callbacks.
window.UI = (() => {
  const SCREENS = ["title","setup","pass","role","wager","question","result","action","boss","victory","defeat","vote"];
  function $(id) { return document.getElementById(id); }

  // iOS-resilient tap handler. Three problems we have to solve at once:
  //
  // (1) Keyboard-dismiss path. When an <input> is focused on iPhone Safari and
  //     the user taps a button, iOS interprets the first tap as a "dismiss
  //     keyboard" gesture. Depending on layout/timing it can skip touchend on
  //     the button entirely, fire touchend but suppress the synthetic click, or
  //     consume user-activation if we call e.preventDefault() in touchend
  //     (which then breaks any later confirm()/alert()). So: NEVER preventDefault,
  //     and accept either pointerup OR click as a valid activation signal.
  //
  // (2) Phantom synthetic click after a screen change. iOS schedules `click`
  //     ~50–300ms after pointerup. If the original button gets removed in the
  //     pointerup handler (e.g. title→setup transition), the deferred click
  //     fires on whatever button now occupies that screen position. Without
  //     guarding, a single tap on "Start" activates the top button on the next
  //     screen too — the user sees the second screen flash by skipped, the
  //     player's turn skipped, etc.
  //
  //     Fix: a *cross-element* timer. Once any tap()-handled button activates,
  //     subsequent click events on any other button are ignored for ~500ms.
  //     Real pointer events on a different button still work — they go through
  //     the per-button armed flow, not the click fallback.
  //
  // (3) Slipped finger. pointerdown on A, finger drags to B, pointerup on B.
  //     iOS may then fire a synthetic click on B as a "best-guess" target.
  //     We never want this to count, because the user's intent was to tap A
  //     (and they aborted by sliding off). Fix: per-element `armed` flag —
  //     pointerup only fires the handler if pointerdown happened on the same
  //     element. The click fallback also rejects when the most recent
  //     pointerdown was elsewhere.
  //
  // The `pointerFired` flag prevents pointerup+click double-fire on the same
  // button (the original use case the previous version handled). Same-button
  // re-tap (after the gesture completes) re-arms via the next pointerdown.
  let lastTapFireTime = 0;
  let lastPointerDownEl = null;
  let lastPointerDownTime = 0;
  const PHANTOM_CLICK_WINDOW_MS = 500;
  function tap(el, handler) {
    if (!el) return;
    let armed = false;
    let pointerFired = false;
    function safeBlur() {
      const a = document.activeElement;
      if (a && a !== el && (a.tagName === "INPUT" || a.tagName === "TEXTAREA") && a.blur) a.blur();
    }
    function onPointerDown() {
      safeBlur();
      armed = true;
      pointerFired = false;
      lastPointerDownEl = el;
      lastPointerDownTime = Date.now();
    }
    function onPointerUp(e) {
      if (!armed) return;       // pointerdown was elsewhere — slipped finger, reject
      armed = false;
      pointerFired = true;
      lastTapFireTime = Date.now();
      handler(e);
    }
    function onPointerCancel() { armed = false; }
    function onClick(e) {
      // pointerup already fired the handler for this exact gesture
      if (pointerFired) { pointerFired = false; return; }
      const now = Date.now();
      // Phantom click after a recent fire on any button — suppress
      if (now - lastTapFireTime < PHANTOM_CLICK_WINDOW_MS) return;
      // Slipped-finger best-guess click — pointerdown was on a different element
      if (lastPointerDownEl && lastPointerDownEl !== el &&
          now - lastPointerDownTime < 1000) return;
      // Genuine click without prior pointerup (iOS keyboard-dismiss suppressed
      // touchend, or assistive-tech click) — activate.
      lastTapFireTime = now;
      handler(e);
    }
    el.addEventListener("pointerdown",   onPointerDown,   { passive: true });
    el.addEventListener("touchstart",    safeBlur,        { passive: true });
    el.addEventListener("pointerup",     onPointerUp);
    el.addEventListener("pointercancel", onPointerCancel);
    el.addEventListener("click",         onClick);
  }
  // Screens where boss-theme music is allowed to keep playing across a render
  // (the screens that explicitly start a theme manage their own stop). For all
  // other transitions, kill any lingering theme so it doesn't bleed into e.g.
  // the question screen.
  //
  // "action" is included so the PvP turn theme survives the renderPvpAction →
  // renderTargetPicker handoff (both call show("action")). In hero mode no
  // theme is started on the action screen, so the inclusion is a no-op there.
  const THEME_SCREENS = new Set(["title", "victory", "defeat", "action"]);
  function show(name) {
    SCREENS.forEach(n => {
      const el = $("screen-"+n);
      if (!el) return;
      el.classList.toggle("hidden", n !== name);
      if (n !== name) el.innerHTML = "";
    });
    // iOS Safari sometimes defers/drops the visibility commit when a screen
    // flip happens inside a touch handler. Reading offsetHeight forces a
    // synchronous layout flush so the new screen is actually committed before
    // the caller starts painting content into it.
    const target = $("screen-"+name);
    if (target) void target.offsetHeight;
    if (!THEME_SCREENS.has(name)) {
      if (SND && SND.stopTheme) SND.stopTheme(300);
      // Leaving the action phase ends the PvP turn — reset the auto-start
      // tracker so the next time a player's turn opens, their theme plays.
      pvpThemePlayerId = null;
    }
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

  // -------- SPEECH CHALLENGE (pronunciation) --------
  // Shows a modal asking the kid to pronounce `word`, calls SND.recognizeOnce,
  // displays the result. Up to MAX_ATTEMPTS tries — on miss/timeout/no-speech
  // the kid sees a "もういちど" retry button. On success or when they hit the
  // attempt cap (or skip), calls onDone(result).
  //
  // Status flips in three stages so the kid knows what's happening:
  //   "じゅんびちゅう…" while waiting for the mic permission
  //   "🎤 きいてるよ！" once recognizeOnce.onListening() fires (mic actually capturing)
  //   final result message after recognition resolves.
  // Speech-challenge modal. The recognition core in audio.js gates on a
  // Web-Audio voice-activity detector, so background noise no longer triggers
  // false fails. This UI just orchestrates retries and shows what the
  // recognizer heard for educational/diagnostic value.
  const MAX_SPEECH_ATTEMPTS = 4;

  function runSpeechChallenge(word, onDone) {
    const overlay = document.createElement("div");
    overlay.className = "speech-overlay";
    overlay.innerHTML = `
      <div class="speech-card">
        <div class="speech-prompt">🎤 マイクで…</div>
        <div class="speech-word">「${escapeHTML(word)}」</div>
        <div class="speech-status" id="sp-status">じゅんびちゅう…</div>
        <div class="speech-heard" id="sp-heard" style="font-size:13px;color:#aaa;margin-top:6px;min-height:18px;"></div>
        <div class="speech-attempts" id="sp-attempts" style="font-size:13px;color:#aaa;margin-top:4px;"></div>
        <div id="sp-buttons" style="display:none; gap:10px; justify-content:center; margin-top:14px; flex-wrap:wrap;">
          <button class="btn good" id="sp-retry">🔄 もういちど！</button>
          <button class="btn ghost" id="sp-skip">スキップ</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const status     = overlay.querySelector("#sp-status");
    const heardEl    = overlay.querySelector("#sp-heard");
    const attemptsEl = overlay.querySelector("#sp-attempts");
    const buttons    = overlay.querySelector("#sp-buttons");
    overlay.querySelector(".speech-card").animate(
      [
        { transform: "scale(0.6) translateY(20px)", opacity: 0 },
        { transform: "scale(1) translateY(0)", opacity: 1 }
      ],
      { duration: 250, easing: "cubic-bezier(.18,.89,.32,1.28)", fill: "forwards" }
    );

    let attempts   = 0;
    let lastResult = null;

    const close = (result) => {
      overlay.remove();
      if (onDone) onDone(result || { ok: false, reason: "skipped" });
    };
    const showRetry = () => { buttons.style.display = "flex"; };
    const hideRetry = () => { buttons.style.display = "none"; };

    function attempt() {
      attempts++;
      hideRetry();
      status.textContent = "じゅんびちゅう…";
      status.style.color = "#fff";
      heardEl.textContent = "";
      attemptsEl.textContent = `(${attempts} / ${MAX_SPEECH_ATTEMPTS} かいめ)`;

      SND.recognizeOnce(word, {
        totalTimeoutMs: 12000,
        onListening: () => {
          status.textContent = "🎤 はなしてね！";
          status.style.color = "#7ff0a0";
        },
      }).then((result) => {
        lastResult = result;

        if (result.ok) {
          status.textContent = "✨ ナイス はつおん！ +2 ダメ";
          status.style.color = "#4ade80";
          heardEl.textContent = "";
          attemptsEl.textContent = "";
          setTimeout(() => close(result), 1300);
          return;
        }

        // Failure UI — codes from the new VAD-gated core
        let msg;
        switch (result.reason) {
          case "no-speech":              msg = "🤔 こえが きこえなかった"; break;
          case "no-result-after-voice":  msg = "🤔 きこえたけど わからなかった"; break;
          case "not-allowed":
          case "service-not-allowed":    msg = "🎤 マイクの ゆるしを ON に してね"; break;
          case "no-mic-api":
          case "mic-failed":
          case "audio-ctx-failed":       msg = "🎤 マイクが つかえない"; break;
          case "unsupported":
          case "init_failed":            msg = "🤷 この ブラウザは つかえない"; break;
          default:                       msg = "😅 ちがう ことばに きこえた"; break;
        }
        status.textContent = msg;
        status.style.color = "#fde0c0";
        const heard = result.alts && result.alts[0] && result.alts[0].transcript;
        heardEl.textContent = heard ? `わたしには「${heard}」と きこえた` : "";

        const terminalReasons = ["not-allowed","service-not-allowed","no-mic-api",
                                 "mic-failed","audio-ctx-failed","unsupported","init_failed"];
        const canRetry = attempts < MAX_SPEECH_ATTEMPTS && !terminalReasons.includes(result.reason);
        if (canRetry) {
          showRetry();
        } else {
          attemptsEl.textContent = "";
          setTimeout(() => close(result), 1800);
        }
      });
    }

    overlay.querySelector("#sp-retry").addEventListener("click", () => attempt());
    overlay.querySelector("#sp-skip").addEventListener("click",  () => close(lastResult));
    attempt();
  }

  // Generic menu modal — N options stacked vertically. Used for the pause menu
  // (and anywhere else we want more than a yes/no choice).
  // items = [ { label, action, style } ]; style is a btn variant ("good", "ghost", "cool", "bad").
  function menuModal(title, items) {
    const overlay = document.createElement("div");
    overlay.className = "confirm-overlay";
    const itemsHTML = items.map((it,i) =>
      `<button class="btn ${it.style||'cool'}" id="mn-${i}" style="width:100%; max-width:280px;">${escapeHTML(it.label)}</button>`
    ).join("");
    overlay.innerHTML = `
      <div class="confirm-card">
        ${title ? `<div class="confirm-msg">${escapeHTML(title)}</div>` : ``}
        <div class="confirm-row" style="flex-direction:column; gap:8px; align-items:center;">${itemsHTML}</div>
      </div>`;
    document.body.appendChild(overlay);
    items.forEach((it, i) => {
      tap(overlay.querySelector(`#mn-${i}`), () => {
        overlay.remove();
        if (it.action) it.action();
      });
    });
  }

  // Custom confirm modal — used in place of native confirm() because iOS Safari
  // sometimes silently suppresses confirm() called from inside touch handlers.
  function confirmModal(msg, onYes, onNo) {
    const overlay = document.createElement("div");
    overlay.className = "confirm-overlay";
    overlay.innerHTML = `
      <div class="confirm-card">
        <div class="confirm-msg">${escapeHTML(msg)}</div>
        <div class="confirm-row">
          <button class="btn good" id="cf-yes">はい</button>
          <button class="btn ghost" id="cf-no">いいえ</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    tap(overlay.querySelector("#cf-yes"), () => { close(); if (onYes) onYes(); });
    tap(overlay.querySelector("#cf-no"),  () => { close(); if (onNo)  onNo(); });
  }

  // -------- TITLE --------
  // Title also picks player count (default 1) so the setup screen has fewer controls.
  function renderTitle({ onStart }) {
    show("title");
    const s = $("screen-title"); s.innerHTML = "";
    let count = 1;
    let mode = "hero"; // or "pvp"
    function paint() {
      s.innerHTML = "";
      const pvpDisabled = count < 2; // PvP needs ≥2 players
      if (pvpDisabled && mode === "pvp") mode = "hero";
      s.appendChild(el(`
        <div class="center" style="margin-top: 3vh;">
          <h1 class="pop">${JP.title}</h1>
          <div class="title-en bob">${JP.titleEn}</div>
          <div class="kaiju-row" style="font-size: 56px; margin: 8px 0;">
            <span class="kaiju-emoji" style="animation-delay: 0.0s;">🐙</span><span class="kaiju-emoji" style="animation-delay: 0.4s;">💩</span><span class="kaiju-emoji" style="animation-delay: 0.8s;">👾</span><span class="kaiju-emoji" style="animation-delay: 1.2s;">🦑</span>
          </div>
          ${(() => {
            // Lifetime rank line — shows once any battles have been played.
            if (!window.Progress || !Progress.getStats) return "";
            const stats = Progress.getStats();
            const totalBattles = stats.battles || 0;
            if (totalBattles === 0) return "";
            const r = Progress.rankFor(stats);
            const winsTxt = stats.wins ? ` ${stats.wins}しょうり` : "";
            const nextTxt = r.next ? ` (つぎ ${r.next.name_jp.replace(/[^a-zア-ヶー]/g,'').slice(0,8)} まで ${r.toNext})` : "";
            return `<div class="title-rank">${r.rank.name_jp}${winsTxt}${nextTxt}</div>`;
          })()}
          <div class="subtle" style="margin-top: 4px;">なんにん で あそぶ？</div>
          <div class="row" id="t-count-row" style="margin: 6px 0 10px;"></div>
          <div class="subtle">${JP.mode_label}</div>
          <div class="row" style="margin: 6px 0 14px; gap: 6px;">
            <button class="toggle ${mode==='hero'?'on':''}" id="m-hero" style="font-size:14px;padding:8px 12px;">⚔️ ${JP.mode_hero}</button>
            <button class="toggle ${mode==='pvp'?'on':''} ${pvpDisabled?'':''}" id="m-pvp" ${pvpDisabled?'disabled style="opacity:.45;font-size:14px;padding:8px 12px;"':'style="font-size:14px;padding:8px 12px;"'}>${JP.mode_pvp}</button>
          </div>
          <button class="btn huge hot" id="btn-start">${JP.start} ⚔️</button>
          <div class="row" style="margin-top:8px;">
            <button class="btn ghost" id="btn-rules">あそびかた ❓</button>
            <button class="btn ghost" id="btn-compendium">📖 ずかん${(window.Progress&&Progress.totalDefeated())?` (${Progress.totalDefeated()}/6)`:''}</button>
            <button class="btn ghost" id="btn-settings">せってい ⚙️</button>
          </div>
          <div class="subtle" style="margin-top: 10px;">タップで おとが でます 🔊</div>
        </div>`));
      const cr = $("t-count-row");
      [1,2,3,4,5,6].forEach(n => {
        const b = el(`<button class="toggle ${count===n?'on':''}" style="font-size:22px;padding:8px 14px;min-width:46px;">${n}</button>`);
        tap(b, () => { count = n; paint(); });
        cr.appendChild(b);
      });
      tap($("m-hero"), () => { mode = "hero"; paint(); });
      const pvpBtn = $("m-pvp");
      if (pvpBtn && !pvpDisabled) tap(pvpBtn, () => { mode = "pvp"; paint(); });
      tap($("btn-start"), () => {
        try { SND.unlock(); SND.sfxPop(); } catch(e) {}
        // Yield one frame before tearing down 12 screens and rebuilding setup.
        // Works around an iOS Safari quirk where a synchronous display-flip
        // inside a touch handler — combined with the first SND.unlock() call
        // stalling the renderer briefly — occasionally produces a blank screen
        // until reload. The frame gap lets iOS commit the current paint first.
        requestAnimationFrame(() => onStart({ count, mode }));
      });
      tap($("btn-rules"), () => {
        try { SND.unlock(); } catch(e) {}
        showRules(() => renderTitle({onStart}));
      });
      tap($("btn-compendium"), () => {
        try { SND.unlock(); } catch(e) {}
        showCompendium(() => renderTitle({onStart}));
      });
      tap($("btn-settings"), () => {
        try { SND.unlock(); } catch(e) {}
        showSettings(() => renderTitle({onStart}));
      });
    }
    paint();
  }

  function showSettings(onBack) {
    show("title");
    const s = $("screen-title"); s.innerHTML = "";
    const isMuted = SND.isMuted();
    const slingOn = SND.getSlingshot();
    const bossAnimOn = SND.getBossAnim();
    const themesOn = SND.getThemes ? SND.getThemes() : true;
    const spellOn = SND.getSpellMode ? SND.getSpellMode() : false;
    const a11yOn = SND.getA11y ? SND.getA11y() : false;
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
          <button class="toggle ${isMuted?'on':''}" id="mute-off" style="font-size:18px;padding:10px 16px;">🔇 おと OFF</button>

          <div style="font-size:18px; margin:18px 0 8px;">こうげき アニメ</div>
          <button class="toggle ${slingOn?'on':''}" id="sling-toggle" style="font-size:16px;padding:10px 16px;">🎯 スリングショット ${slingOn?'ON':'OFF'}</button>
          <button class="toggle ${bossAnimOn?'on':''}" id="bossanim-toggle" style="font-size:16px;padding:10px 16px;">💥 ボス アニメ ${bossAnimOn?'ON':'OFF'}</button>

          <div style="font-size:18px; margin:18px 0 8px;">ボスの テーマソング</div>
          <button class="toggle ${themesOn?'on':''}" id="themes-toggle" style="font-size:16px;padding:10px 16px;">🎵 テーマソング ${themesOn?'ON':'OFF'}</button>

          <div style="font-size:18px; margin:18px 0 8px;">スペルモード</div>
          <div class="subtle" style="font-size:13px; margin-bottom:6px;">えいごの たんごを じぶんで くみたてる！</div>
          <button class="toggle ${spellOn?'on':''}" id="spell-toggle" style="font-size:16px;padding:10px 16px;">📝 スペル ${spellOn?'ON':'OFF'}</button>

          <div style="font-size:18px; margin:18px 0 8px;">よみやすく モード</div>
          <div class="subtle" style="font-size:13px; margin-bottom:6px;">もじを おおきく する</div>
          <button class="toggle ${a11yOn?'on':''}" id="a11y-toggle" style="font-size:16px;padding:10px 16px;">👀 よみやすく ${a11yOn?'ON':'OFF'}</button>

          <div style="font-size:18px; margin:18px 0 8px;">えいごの こえ</div>
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
    tap($("sling-toggle"), () => { SND.setSlingshot(!slingOn); showSettings(onBack); });
    tap($("bossanim-toggle"), () => { SND.setBossAnim(!bossAnimOn); showSettings(onBack); });
    tap($("themes-toggle"), () => { SND.setThemes(!themesOn); SND.sfxPop(); showSettings(onBack); });
    tap($("spell-toggle"),  () => { SND.setSpellMode(!spellOn); SND.sfxPop(); showSettings(onBack); });
    tap($("a11y-toggle"),   () => { SND.setA11y(!a11yOn); SND.sfxPop(); showSettings(onBack); });
    tap($("voice-test"), () => { SND.speak("Hello! Let's play."); });
    const vsel = $("voice-pick");
    if (vsel) vsel.onchange = () => { SND.setVoice(vsel.value || null); };
    tap($("back-settings"), () => onBack());
  }

  // -------- SETUP --------
  function renderSetup({ onConfirm, count: initialCount }) {
    show("setup");
    clear("setup");
    const s = $("screen-setup");
    let count = initialCount || 1;
    let level = 2;
    let jinro = false;
    let advanced = false;
    let timerSec = 0;
    let hardMode = false;
    let showAdvanced = false; // collapsible "advanced" panel toggle
    const namePool = (window.FUNNY_NAMES || []).slice();
    for (let i = namePool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [namePool[i], namePool[j]] = [namePool[j], namePool[i]];
    }
    const names = namePool.slice(0, 6);
    while (names.length < 6) names.push("");
    const playerLevels = [null,null,null,null,null,null];
    // Per-player avatar emoji. Default: random from the Game.AVATARS pool. Kid
    // can tap their avatar button next to the name to cycle through the pool.
    const avatarPool = (window.Game && Game.AVATARS) || ['🐱'];
    const avatars = [];
    for (let i = 0; i < 6; i++) avatars[i] = avatarPool[(Math.random()*avatarPool.length)|0];

    function pickFunnyName(usedNames) {
      const pool = (window.FUNNY_NAMES || []).filter(n => !usedNames.includes(n));
      if (!pool.length) return JP.player_n(usedNames.length+1);
      return pool[(Math.random()*pool.length)|0];
    }

    function redraw() {
      s.innerHTML = "";
      s.appendChild(el(`
        <div class="center" style="width:100%; max-width: 600px; margin: 0 auto;">
          <h2 style="margin: 8px 0;">${JP.setup_title}</h2>
          <div class="subtle">${count}にん プレイ</div>
          <div class="subtle" style="margin-top:14px;">${JP.level}</div>
          <div class="row" id="lvl-row" style="gap:6px;justify-content:center;"></div>
          <div id="lvl-desc" style="margin-top:4px; line-height:2.2;">
            <div style="font-size:22px; font-weight:900; color:var(--accent);">${furigana(JP["level"+level])}</div>
            ${(level === 0 || level === 1) ? `<div class="subtle" style="font-size:13px;">${furigana(JP["level"+level+"_desc"]||"")}</div>` : ``}
          </div>
          <div class="subtle" style="margin-top:18px;">なまえ</div>
          <div class="row" id="names-row"></div>
          <button class="toggle ${showAdvanced?'on':''}" id="adv-panel" style="margin-top:14px; font-size:14px;">${showAdvanced?'▼ オプション':'▶ オプション'}</button>
          <div id="adv-content" style="display:${showAdvanced?'block':'none'}; margin-top:8px;">
            <div class="row" style="margin-top:8px;">
              <button class="toggle ${advanced?'on':''}" id="adv-toggle">${advanced?'こべつレベル ON':'こべつレベル OFF'}</button>
            </div>
            <div class="row" style="margin-top:8px;">
              <span class="subtle" style="margin-right:8px;">じかん せいげん:</span>
              <button class="toggle ${timerSec===0?'on':''}" data-sec="0">なし</button>
              <button class="toggle ${timerSec===30?'on':''}" data-sec="30">30s</button>
              <button class="toggle ${timerSec===20?'on':''}" data-sec="20">20s</button>
              <button class="toggle ${timerSec===10?'on':''}" data-sec="10">10s</button>
            </div>
            <div class="row" style="margin-top:8px;">
              <button class="toggle ${hardMode?'on':''}" id="hard-toggle">${hardMode?'ハードモード ON':'ハードモード OFF'}</button>
            </div>
            ${count >= 4 ? `
              <div class="row" style="margin-top:8px;">
                <button class="toggle ${jinro?'on':''}" id="jinro-toggle">${jinro?JP.jinro_on:JP.jinro_off}</button>
              </div>
              <div class="subtle" style="font-size:13px;">${JP.jinro_hint}</div>
            ` : ``}
          </div>
          <div class="row" style="margin-top:20px;">
            <button class="btn huge good" id="go">${JP.start_battle} 🚀</button>
            <button class="btn ghost" id="back">${JP.back}</button>
          </div>
        </div>
      `));
      const lr = $("lvl-row");
      [0,1,2,3,4].forEach(n => {
        const lbl = n === 0 ? "🍼" : String(n);
        const b = el(`<button class="toggle ${level===n?'on':''}" style="font-size:22px;padding:10px 14px;min-width:50px;font-weight:900;">${lbl}</button>`);
        tap(b, () => { level = n; redraw(); });
        lr.appendChild(b);
      });
      const nr = $("names-row");
      nr.style.flexDirection = "column";
      nr.style.alignItems = "center";
      for (let i = 0; i < count; i++) {
        const wrap = document.createElement("div");
        wrap.style.cssText = "display:flex;gap:6px;align-items:center;margin:4px 0;flex-wrap:wrap;justify-content:center;";
        // Avatar button — tap to cycle through the emoji pool.
        const avatarBtn = el(`<button class="toggle on" title="アバターを かえる" style="font-size:24px;padding:4px 10px;min-width:44px;">${avatars[i]}</button>`);
        tap(avatarBtn, () => {
          const idx = (avatarPool.indexOf(avatars[i]) + 1) % avatarPool.length;
          avatars[i] = avatarPool[idx];
          avatarBtn.textContent = avatars[i];
        });
        wrap.appendChild(avatarBtn);
        const inp = el(`<input class="player-input" maxlength="10" placeholder="${JP.player_n(i+1)}" value="${escapeHTML(names[i]||"")}"/>`);
        inp.oninput = (e) => { names[i] = e.target.value; };
        wrap.appendChild(inp);
        if (advanced) {
          [0,1,2,3,4].forEach(n => {
            const cur = playerLevels[i] ?? level;
            const lbl = n === 0 ? "🍼" : "L"+n;
            const b = el(`<button class="toggle ${cur===n?'on':''}" style="font-size:13px;padding:6px 8px;">${lbl}</button>`);
            tap(b, () => { playerLevels[i] = n; redraw(); });
            wrap.appendChild(b);
          });
        }
        nr.appendChild(wrap);
      }
      tap($("adv-panel"), () => { showAdvanced = !showAdvanced; redraw(); });
      const advT = $("adv-toggle"); if (advT) tap(advT, () => { advanced = !advanced; redraw(); });
      const hardT = $("hard-toggle"); if (hardT) tap(hardT, () => { hardMode = !hardMode; redraw(); });
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
        const finalAvatars = avatars.slice(0, count);
        SND.sfxPop();
        onConfirm({ count, level, levels: finalLevels, jinro: jinro && count >= 4, names: finalNames, avatars: finalAvatars, timerSec, hardMode });
      });
      tap($("back"), () => location.reload());
    }
    redraw();
  }

  // -------- PASS / hand-off --------
  // Accepts either a player object {name, avatar} or a plain name string
  // (callers in some flows still pass a string).
  function renderPass(player, onReady) {
    show("pass");
    const name = (player && player.name) || player;
    const avatar = (player && player.avatar) || "📱";
    const s = $("screen-pass");
    s.innerHTML = `
      <div class="center" style="margin-top: 18vh;">
        <div class="pass-big bob">${avatar}</div>
        <h2>${JP.pass_to(name)}</h2>
        <div class="pass-instr" style="white-space: pre-line;">${JP.pass_instr}</div>
        <button class="btn huge cool" id="ready">${JP.ok}</button>
      </div>`;
    tap($("ready"), () => { SND.sfxPop(); onReady(); });
  }

  // -------- PRIVATE SCAN (jinro reveal card) --------
  // Two-stage flow that mimics the role-reveal: a hand-off prompt so the
  // device can be passed to the asker alone, then the reveal card. Uses the
  // pass screen to keep neighbors from peeking.
  function renderPrivateScan(asker, target, isSpy, onDone) {
    show("pass");
    const s = $("screen-pass");
    s.innerHTML = `
      <div class="center" style="margin-top: 16vh;">
        <div class="pass-big bob">${asker && asker.avatar || "🔍"}</div>
        <h2>${escapeHTML((asker && asker.name) || "")} だけ みて！</h2>
        <div class="pass-instr" style="white-space: pre-line;">スキャンの けっか… ほかのひとには みせないでね</div>
        <button class="btn huge cool" id="reveal">${JP.ok}</button>
      </div>`;
    tap($("reveal"), () => {
      SND.sfxPop();
      // Stage 2: show the actual scan result.
      s.innerHTML = `
        <div class="center" style="margin-top:14vh;">
          <div class="role-card ${isSpy?'spy':'hero'}">
            <div class="role-name">🔍 スキャン: ${escapeHTML(target.name)}</div>
            <div style="font-size:36px;margin:14px 0;">${isSpy ? "🕵️ スパイ" : "⚔️ ヒーロー"}</div>
            <div style="font-size:14px;color:#bbb;">この じょうほう は ひみつ。<br>ほかの プレイヤーに おしえるか、 ないしょに するか…</div>
          </div>
          <button class="btn huge ghost" id="scanok">${JP.ok}</button>
        </div>`;
      tap($("scanok"), () => onDone());
    });
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
      // Wager pick is a deliberate choice — sfxSelect (sharper than sfxPop)
      // marks the commit. sfxPop becomes the menu-tap default.
      if (SND.sfxSelect) SND.sfxSelect(); else SND.sfxPop();
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
        // Pause countdown while listening audio is playing — listening
        // questions used to eat ~3s of timer just on the audio clip, leaving
        // a short timer with almost no thinking time. Now the kid only loses
        // ticks during silence.
        if (typeof speechSynthesis !== "undefined" && speechSynthesis.speaking) return;
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
    // Spelling mode (settings → 📝 スペル ON): when the answer is a single
    // English word, replace the multiple-choice grid with a letter-tile
    // builder. The kid sees the target word's letters PLUS 2-3 distractor
    // letters in scrambled order, then taps tiles in sequence to build the
    // word. No keyboard autocorrect, no "kat" passes for "cat" — they have
    // to use the right letters in the right order.
    const ans = question.options[question.answer];
    const spellModeOn = SND.getSpellMode && SND.getSpellMode();
    const ansIsSingleWord = typeof ans === "string" && /^[a-zA-Z]{2,12}$/.test(ans);
    const allAscii = question.options.every(o => typeof o === "string" && /^[a-zA-Z\s'-]+$/.test(String(o).trim()));
    const useSpell = spellModeOn && ansIsSingleWord && allAscii;

    if (useSpell) {
      const target = ans.toLowerCase();
      const targetLetters = target.split("");
      // Distractor letters: pick 2-3 random lowercase letters not in target.
      // ★1 gets 1-2, ★2/★3 get 2-3 to make ordering harder.
      const distractCount = Math.max(1, Math.min(3, question.stars + 1));
      const inWord = new Set(targetLetters);
      const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
      const candidates = alphabet.filter(c => !inWord.has(c));
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }
      const distractors = candidates.slice(0, distractCount);
      // Tile pool: target letters (with duplicates preserved) + distractors,
      // shuffled. Each tile carries its index so we can mark exactly the
      // right tile as "used" when tapped (handles duplicate letters cleanly).
      const allTiles = [...targetLetters, ...distractors];
      for (let i = allTiles.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [allTiles[i], allTiles[j]] = [allTiles[j], allTiles[i]];
      }
      const tileUsed = allTiles.map(() => false);
      const built = []; // [{ char, tileIdx }]

      optsEl.innerHTML = `
        <div class="spell-built" id="spell-built">
          ${target.split("").map((_,i) => `<span class="spell-slot" data-slot="${i}"></span>`).join("")}
        </div>
        <div class="spell-tiles" id="spell-tiles"></div>
        <div class="row" style="margin-top:10px; gap:10px; justify-content:center;">
          <button class="btn ghost" id="spell-del" style="font-size:16px;min-height:48px;min-width:0;padding:8px 14px;">⌫ もどす</button>
          <button class="btn good" id="spell-go" disabled>こたえる！</button>
        </div>`;

      const builtEl = $("spell-built");
      const tilesEl = $("spell-tiles");
      const goBtn = $("spell-go");

      function refreshSlots() {
        const slots = builtEl.querySelectorAll(".spell-slot");
        slots.forEach((slot, i) => {
          slot.textContent = built[i] ? built[i].char.toUpperCase() : "";
          slot.classList.toggle("filled", !!built[i]);
        });
        goBtn.disabled = built.length !== target.length;
      }
      function tapTile(idx, tileEl) {
        if (answered) return;
        if (tileUsed[idx]) return;
        if (built.length >= target.length) return;
        built.push({ char: allTiles[idx], tileIdx: idx });
        tileUsed[idx] = true;
        tileEl.classList.add("used");
        refreshSlots();
      }
      allTiles.forEach((c, idx) => {
        const t = el(`<button class="spell-tile" data-idx="${idx}">${c.toUpperCase()}</button>`);
        tap(t, () => tapTile(idx, t));
        tilesEl.appendChild(t);
      });
      tap($("spell-del"), () => {
        if (answered) return;
        const last = built.pop();
        if (last) {
          tileUsed[last.tileIdx] = false;
          const tile = tilesEl.querySelector(`[data-idx="${last.tileIdx}"]`);
          if (tile) tile.classList.remove("used");
          refreshSlots();
        }
      });
      const submit = () => {
        if (answered) return;
        if (built.length !== target.length) return;
        const guess = built.map(b => b.char).join("").toLowerCase();
        const ok = guess === target;
        // Soft-fail: a single typo (Levenshtein distance 1) is not really a
        // comprehension error. Counts as wrong (no reward) but the combo is
        // preserved — keeps fast-typing kids from losing streaks to a misclick.
        const softFail = !ok && levenshtein1(guess, target);
        answered = true;
        if (timerHandle) clearInterval(timerHandle);
        if (ok) SND.sfxCorrect(); else SND.sfxWrong();
        // Visual feedback on the slots
        builtEl.querySelectorAll(".spell-slot").forEach(slot => {
          slot.classList.add(ok ? "right" : (softFail ? "soft" : "wrong"));
        });
        if (!ok) {
          const hint = el(`<div style="margin-top:8px; color: var(--good); font-weight:900; font-size:20px;">→ ${escapeHTML(ans).toUpperCase()}</div>`);
          optsEl.appendChild(hint);
        }
        // Lock the tiles
        tilesEl.querySelectorAll(".spell-tile").forEach(t => t.classList.add("used"));
        goBtn.disabled = true;
        setTimeout(() => onAnswer(ok, ok ? question.answer : -1, softFail), 1300);
      };
      tap(goBtn, submit);
    } else {
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
    }

    if (question.audio) {
      // When the hint card is in play (slowAudio flag), the TTS rate is ducked
      // from the default 0.9 → 0.65 so kids who can't pick out the word at
      // normal speed get a clearer pass.
      const rate = opts && opts.slowAudio ? 0.65 : 0.9;
      const speak = () => SND.speak(question.audio, { rate });
      const lb = $("listen-btn"); if (lb) tap(lb, speak);
      const sa = $("say-again"); if (sa) tap(sa, speak);
      // Auto-speak after a tick if listen-only
      if (!question.prompt && !question.promptImage) {
        setTimeout(speak, 350);
      }
    }
  }

  // -------- MONSTER PICK (PvP) --------
  function renderMonsterPick(playerName, usedIds, onPick) {
    show("title");
    const s = $("screen-title"); s.innerHTML = "";
    const factories = Monsters.listFactories();
    s.appendChild(el(`
      <div class="center" style="max-width: 720px; margin: 12px auto; padding: 0 12px;">
        <h2>${escapeHTML(playerName)}、モンスターを えらんでね！</h2>
        <div class="subtle" style="margin-bottom:8px;">タップで けってい</div>
        <div id="mp-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;"></div>
      </div>`));
    const grid = $("mp-grid");
    factories.forEach((factory) => {
      const sample = factory();
      const taken = usedIds.includes(sample.id);
      const card = el(`
        <button class="part-btn" style="padding:8px;${taken?'opacity:.35;':''}">
          <div style="height:140px;">${Monsters.renderBossSVG(sample)}</div>
          <div class="pn" style="font-size:14px;color:var(--accent);">${escapeHTML(sample.name_jp)}</div>
          ${taken ? `<div class="pe" style="color:#aaa;">えらばれた</div>` : ``}
        </button>`);
      if (!taken) tap(card, () => { SND.sfxPop(); onPick(factory); });
      grid.appendChild(card);
    });
  }

  // -------- MATCH TITLE CARD (N6) --------
  // TV-broadcast pre-fight splash: "TONIGHT'S MAIN EVENT" headline, boss
  // vs player(s), brief 1.8s flash. Fires before renderBossIntro so the
  // boss reveal already feels like a sports broadcast main card.
  function showMatchTitleCard(boss, players, onDone) {
    SND.unlock();
    const overlay = document.createElement("div");
    overlay.className = "round-intro-overlay";
    const playerLine = (players || []).map(p => `${p.avatar?p.avatar+' ':''}${escapeHTML(p.name)}`).join(" · ");
    overlay.innerHTML = `
      <div class="round-flash" style="background:rgba(0,0,0,0);"></div>
      <div class="round-content" style="text-align:center;">
        <div style="font-size:13px; letter-spacing:6px; color:var(--accent); font-weight:800;">▶▶ TONIGHT ◀◀</div>
        <div class="round-label" style="color:#fff; font-size:18px; letter-spacing:4px; margin-top: 6px;">MAIN EVENT</div>
        <div style="font-size: 36px; font-weight: 900; color: var(--accent); margin: 14px 0 6px; text-shadow: 0 6px 0 #000, 0 0 20px var(--accent);">${escapeHTML(boss && boss.name_jp || "")}</div>
        <div style="font-size: 22px; color: var(--bad); font-weight: 900;">— VS —</div>
        <div style="font-size: 18px; color: #fff; margin-top: 8px; max-width: 80vw; word-wrap: break-word;">${playerLine}</div>
      </div>`;
    document.body.appendChild(overlay);
    SND.sfxBoss();
    overlay.querySelector(".round-content").animate(
      [
        { transform: "translate(-50%, -50%) scale(0.4)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(1.05)", opacity: 1, offset: 0.55 },
        { transform: "translate(-50%, -50%) scale(1)", opacity: 1 }
      ],
      { duration: 600, easing: "cubic-bezier(.18,.89,.32,1.28)", fill: "forwards" }
    );
    overlay.querySelector(".round-flash").animate(
      [
        { background: "rgba(255, 204, 0, 0)" },
        { background: "rgba(255, 204, 0, 0.25)", offset: 0.5 },
        { background: "rgba(255, 204, 0, 0)" }
      ],
      { duration: 500, iterations: 1 }
    );
    setTimeout(() => { overlay.remove(); if (onDone) onDone(); }, 1900);
  }

  // -------- BOSS PICKER MAP (N6) --------
  // Replaces the one-at-a-time "cycle boss" button with a grid of all
  // available kaiju, badged by defeat status. The kid taps the kaiju
  // they want to fight. Skipped if Monsters.listFactories doesn't yield
  // ≥2 candidates (single-boss flow falls through to the legacy cycle).
  function renderBossPickerMap(currentBossId, onPick, onCancel) {
    show("title");
    const s = $("screen-title"); s.innerHTML = "";
    const factories = (Monsters && Monsters.listFactories) ? Monsters.listFactories() : [];
    const samples = factories.map(f => f());
    const tilesHTML = samples.map((m, i) => {
      const defeated = !!(window.Progress && Progress.isDefeated && Progress.isDefeated(m.id));
      const isCurrent = m.id === currentBossId;
      return `
        <button class="map-tile ${defeated?'map-defeated':''} ${isCurrent?'map-current':''}" data-idx="${i}">
          <div class="map-tile-svg">${Monsters.renderBossSVG(m)}</div>
          <div class="map-tile-name">${escapeHTML(m.name_jp)}</div>
          <div class="map-tile-status">${defeated ? '✅ たおした' : (isCurrent ? '⚔️ せんちゅう' : 'たたかう？')}</div>
        </button>`;
    }).join("");
    s.appendChild(el(`
      <div class="center" style="max-width: 880px; margin: 12px auto; padding: 0 12px;">
        <div class="subtle" style="color:var(--accent); letter-spacing:4px;">★ あいてを えらぶ ★</div>
        <h2 style="margin: 4px 0; color: var(--accent);">🗺️ カイジュウ ぜんかい</h2>
        <div class="subtle" style="font-size:13px;">タップで バトル スタート！</div>
        <div class="map-grid">${tilesHTML}</div>
        <button class="btn ghost" id="map-back" style="margin-top:14px;">${JP.back || "もどる"}</button>
      </div>`));
    s.querySelectorAll(".map-tile").forEach(btn => {
      tap(btn, () => {
        const idx = parseInt(btn.dataset.idx, 10);
        const factory = factories[idx];
        if (factory) onPick(factory);
      });
    });
    tap($("map-back"), () => { if (onCancel) onCancel(); });
  }

  // -------- BOSS INTRO (shown once at game start) --------
  // Backstories use 「漢字[よみ]」 syntax that gets converted to ruby tags so kanji
  // shows the hiragana reading above it. Inserted via innerHTML so the ruby renders.
  function renderBossIntro(boss, onContinue, onCycle) {
    show("title");
    const s = $("screen-title"); s.innerHTML = "";
    const story = furigana(boss.backstory || "なぞの カイジュウ。");
    const weaknessHint = boss.weakness_label
      ? `<div style="background:#3a1a4a; border:2px solid var(--accent); color:var(--accent); border-radius:10px; padding:8px 12px; margin: 10px auto; max-width:520px; font-weight:900;">⚡ よわてん: ${boss.weakness_label} で ×1.5 ダメージ！</div>`
      : "";
    s.appendChild(el(`
      <div class="center" style="max-width: 720px; margin: 12px auto; padding: 0 12px;">
        <div class="subtle" style="color:var(--accent); letter-spacing:4px;">★ きょうの あいて ★</div>
        <h2 style="margin: 4px 0; color: var(--accent);">${escapeHTML(boss.name_jp)}</h2>
        <div class="subtle" style="font-size: 13px; opacity: .7;">${escapeHTML(boss.name_en||"")}</div>
        <div class="stage" style="height:280px; max-width:520px; margin: 8px auto;">${Monsters.renderBossSVG(boss)}</div>
        ${weaknessHint}
        <div style="background:var(--card); border-radius:14px; padding:18px; box-shadow:var(--shadow); text-align:left; max-width:520px; margin: 0 auto; line-height: 2.2;">
          <div style="font-size:14px; color:var(--accent); font-weight:900; margin-bottom:6px;">▶ ストーリー</div>
          <div style="font-size:16px; white-space: pre-line;">${story}</div>
        </div>
        <div class="row" style="margin-top:18px; gap:10px; justify-content:center;">
          <button class="btn huge hot" id="intro-go">バトル スタート！⚔️</button>
          ${onCycle ? `<button class="btn ghost" id="intro-cycle" style="font-size:16px; min-height:44px; min-width:0; padding: 8px 14px;">🔄 ちがう カイジュウ</button>` : ``}
        </div>
      </div>`));
    // Loop the boss's theme song while the kid reads the backstory. The render
    // is reached as a result of a user tap, so iOS audio gesture is satisfied.
    SND.playTheme(boss.id, { loop: true, volume: 0.5, fadeIn: 600 });
    // Boss says their catchphrase on entrance. Backstory is read silently
    // (kid reads at their own pace under the looping theme music) — earlier
    // attempts to voice a joined backstory paragraph 404'd because the
    // build pipeline renders backstory lines individually, not as a joined
    // block.
    if (boss.catchphrase) SND.playBossLine(boss.id, boss.catchphrase);
    tap($("intro-go"), () => { SND.stopBossVoice(); SND.stopTheme(400); onContinue(); });
    if (onCycle) {
      tap($("intro-cycle"), () => { SND.stopBossVoice(); SND.stopTheme(200); onCycle(); });
    }
  }

  // -------- MONSTER ATTACK PICKER (PvP) --------
  // Used in PvP after the kid taps an opponent: shows a row of buttons, one per
  // attack from the kid's own monster, each labeled with type (Heavy / Quick /
  // Wild / Pierce / Stun) and a one-line tagline. Tapping fires onPick(attack)
  // — the caller then runs the attack-type resolver and the cinematic.
  function showMonsterAttackPicker(attackerMonster, opponentName, onPick, onCancel) {
    SND.unlock();
    const overlay = document.createElement("div");
    overlay.className = "attack-picker-overlay";
    const attacks = (attackerMonster && attackerMonster.attacks) || [];
    const itemsHTML = attacks.map((a, i) => {
      const def = (window.Game && Game.attackTypeDef) ? Game.attackTypeDef(a.type) : { label: "", tagline: "" };
      return `
        <button class="attack-pick-btn" data-idx="${i}">
          <div class="atk-pick-name">${escapeHTML(a.name)}</div>
          <div class="atk-pick-type">${escapeHTML(def.label || "")}</div>
          <div class="atk-pick-tag">${escapeHTML(def.tagline || "")}</div>
        </button>`;
    }).join("");
    overlay.innerHTML = `
      <div class="attack-picker-modal">
        <div class="atk-picker-title">こうげきを えらぶ</div>
        <div class="atk-picker-target">${escapeHTML(attackerMonster && attackerMonster.name_jp || "")} → ${escapeHTML(opponentName || "")}</div>
        <div class="attack-picker-list">${itemsHTML}</div>
        <button class="btn ghost atk-picker-cancel" id="atk-cancel" style="font-size:14px;min-height:40px;margin-top:10px;">${JP.cancel || "キャンセル"}</button>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelectorAll(".attack-pick-btn").forEach(btn => {
      tap(btn, () => {
        const idx = parseInt(btn.dataset.idx, 10);
        overlay.remove();
        if (typeof onPick === "function") onPick(attacks[idx]);
      });
    });
    tap(overlay.querySelector("#atk-cancel"), () => {
      overlay.remove();
      if (typeof onCancel === "function") onCancel();
    });
  }

  // -------- SLINGSHOT (interactive attack animation, hero mode) --------
  function showSlingshot(boss, partName, onFire) {
    SND.unlock();
    const taunt = pickRand(JP.slingshot_taunts || ["うってみろよ！"]);
    // Boss voices the heckle — only attempt when we know which boss is talking
    // (PvP path passes the opponent monster, so this still works there too).
    if (boss && boss.id) SND.playBossLine(boss.id, taunt);
    const modal = document.createElement("div");
    modal.className = "sling-modal";
    modal.innerHTML = `
      <div class="sling-bubble">${escapeHTML(taunt)}</div>
      <div class="sling-target-area">
        <div class="sling-emoji-target">🎯</div>
        <div class="sling-target-name">${escapeHTML(partName||"")}</div>
      </div>
      <svg viewBox="0 0 400 500" id="sling-svg" preserveAspectRatio="xMidYEnd meet">
        <line x1="200" y1="500" x2="200" y2="280" stroke="#7a4520" stroke-width="22" stroke-linecap="round"/>
        <line x1="200" y1="290" x2="120" y2="190" stroke="#7a4520" stroke-width="20" stroke-linecap="round"/>
        <line x1="200" y1="290" x2="280" y2="190" stroke="#7a4520" stroke-width="20" stroke-linecap="round"/>
        <line x1="120" y1="190" x2="200" y2="310" stroke="#222" stroke-width="6" id="band-l" stroke-linecap="round"/>
        <line x1="280" y1="190" x2="200" y2="310" stroke="#222" stroke-width="6" id="band-r" stroke-linecap="round"/>
        <g id="pouch-g">
          <ellipse cx="200" cy="310" rx="26" ry="18" fill="#5a3a1a" stroke="#000" stroke-width="3"/>
          <circle cx="200" cy="306" r="14" fill="#888" stroke="#000" stroke-width="2"/>
          <circle cx="196" cy="302" r="3" fill="#fff" opacity=".7"/>
        </g>
      </svg>
      <div class="sling-text">ひっぱって はなして！👇</div>`;
    document.body.appendChild(modal);
    const bandL = modal.querySelector("#band-l");
    const bandR = modal.querySelector("#band-r");
    const pouchG = modal.querySelector("#pouch-g");
    const svg = modal.querySelector("#sling-svg");
    let dragging = false;
    let pulledY = 310;
    // Once fire() runs, the modal is on its way out (900ms cleanup timer).
    // A second pointerdown→drag→release inside that window must not fire
    // a second projectile / call onFire() twice. This flag locks it down.
    let fired = false;
    function setY(y) {
      pulledY = Math.max(310, Math.min(440, y));
      pouchG.setAttribute("transform", `translate(0, ${pulledY - 310})`);
      bandL.setAttribute("y2", pulledY);
      bandR.setAttribute("y2", pulledY);
    }
    function svgY(clientY) {
      const r = svg.getBoundingClientRect();
      return ((clientY - r.top) / r.height) * 500;
    }
    function onDown(e) {
      if (fired) return;
      dragging = true;
      e.preventDefault();
      // Hide the hint as soon as the player starts touching the slingshot.
      const hint = modal.querySelector(".sling-text");
      if (hint) hint.style.display = "none";
    }
    function onMove(e) {
      if (!dragging || fired) return;
      const cy = e.clientY ?? (e.touches && e.touches[0] && e.touches[0].clientY);
      if (cy == null) return;
      setY(svgY(cy));
    }
    function onUp() {
      if (!dragging || fired) return;
      dragging = false;
      const pull = pulledY - 310;
      if (pull < 25) { setY(310); return; }
      fire();
    }
    modal.addEventListener("pointerdown", onDown);
    modal.addEventListener("pointermove", onMove);
    modal.addEventListener("pointerup", onUp);
    modal.addEventListener("pointercancel", onUp);
    // Block page scroll/rubber-band while the slingshot is up — touch-action: none
    // on the modal alone isn't enough on iOS Safari.
    const blockScroll = (e) => { if (e.cancelable) e.preventDefault(); };
    document.addEventListener("touchmove", blockScroll, { passive: false });
    // Tap-anywhere fallback (just fire after a small delay if user can't drag)
    let tapStart = 0;
    modal.addEventListener("touchstart", () => { tapStart = Date.now(); }, { passive: true });
    function fire() {
      if (fired) return;
      fired = true;
      pouchG.style.transition = "transform 0.18s cubic-bezier(.18,.89,.32,1.28)";
      pouchG.setAttribute("transform", "translate(0, -20)");
      bandL.setAttribute("y2", "260");
      bandR.setAttribute("y2", "260");
      SND.sfxPop();
      const proj = document.createElement("div");
      proj.className = "sling-proj";
      proj.textContent = "🪨";
      modal.appendChild(proj);
      requestAnimationFrame(() => { proj.style.top = "5%"; proj.style.transform = "translate(-50%, 0) scale(1.4) rotate(180deg)"; });
      setTimeout(() => {
        const bang = document.createElement("div");
        bang.className = "sling-bang";
        bang.textContent = "💥";
        modal.appendChild(bang);
        SND.sfxHit();
      }, 380);
      setTimeout(() => {
        document.removeEventListener("touchmove", blockScroll);
        modal.remove();
        onFire();
      }, 900);
    }
  }

  // -------- BOSS ATTACK ANIMATION --------
  // Flow:
  //   Stage 0 (1200ms) — "ENEMY ATTACK!" warning banner with red flash
  //   Stage 1 (1100ms) — boss zoom/charge with one of the attack's phrases
  //   Stage 2 (700ms)  — attack emoji bursts out at huge size
  //   Stage 3 (500ms)  — 💥 bang
  //   Stage 4 (1200ms) — attack name + damage reveal
  // Each stage uses Web Animations API on FRESH elements so animations always
  // replay (CSS class-based animations sometimes get cached across overlays).
  function showBossAttackAnim(boss, attack, targetName, dmg, missed, onDone, missReason, opts={}) {
    SND.unlock();
    // byPlayer = true for PvP: a player-controlled monster attacking another.
    // Swaps the WARNING headline (no longer "enemy attack") and tightens the
    // pacing so the kid doesn't sit through 7s of cinematic 5+ times per match.
    const byPlayer = !!opts.byPlayer;
    const typeLabel = opts.typeLabel || "";
    // attackTypeBadge supplies the optional emoji-coded type readout under the
    // attack name on the reveal stage ("💪 ヘビー" / "⚡ クイック" / etc.).
    const attackerLabel = opts.attackerName || (boss && boss.name_jp) || "";
    // Stage timings — compact (~5s) for player attacks, full (~7s) for boss.
    const T = byPlayer
      ? { charge: 700,  burst: 2300, bang: 3000, reveal: 3500, end: 5400 }
      : { charge: 1700, burst: 3400, bang: 4300, reveal: 4800, end: 7200 };
    const phrase = pickRand(attack.phrases || [attack.name]);
    const m = (attack.name || "").match(/(\p{Extended_Pictographic}️?)\s*$/u);
    const emoji = m ? m[1] : "💥";
    // Stage-3 visual + final reveal text vary by why the attack didn't land.
    // Hits use the default 💥 / damage flow.
    const missVisual = (
      missReason === "shield" ? { sweep: "🛡️", label: "ふせいだ！" } :
      missReason === "escape" ? { sweep: "🏃", label: "にげた！" } :
      missReason === "fizzle" ? { sweep: "💤", label: "しっぱい…" } :
                                { sweep: "💨", label: "はずれ！" }
    );
    const missRevealHTML = (
      missReason === "shield" ? `→ ${escapeHTML(targetName)} は シールドで ふせいだ！ 🛡️` :
      missReason === "escape" ? `→ ${escapeHTML(targetName)} は うまく にげた！ 🏃` :
      missReason === "fizzle" ? `→ よわくなりすぎて こうげき しっぱい！ 💤` :
                                `→ ${escapeHTML(targetName)} は かわした！ ✨`
    );

    const overlay = document.createElement("div");
    overlay.className = "boss-anim-overlay";
    document.body.appendChild(overlay);

    // ----- Stage 0: warning headline -----
    if (byPlayer) {
      overlay.innerHTML = `
        <div class="boss-warn-flash" style="background:rgba(255,204,68,0.18);"></div>
        <div class="boss-warn-text">
          <div style="font-size: 16px; color: var(--accent); letter-spacing: 4px;">⚔ ${escapeHTML(attackerLabel)} の こうげき ⚔</div>
          <div style="font-size: 50px; font-weight: 900; color: var(--accent); text-shadow: 0 6px 0 #000, 0 0 30px var(--accent); margin-top: 4px;">${escapeHTML(typeLabel) || "アタック！"}</div>
          <div style="font-size: 20px; color: #fff; margin-top: 6px;">→ ${escapeHTML(targetName)}</div>
        </div>`;
      SND.sfxBoss();
    } else {
      overlay.innerHTML = `
        <div class="boss-warn-flash"></div>
        <div class="boss-warn-text">
          <div style="font-size: 18px; color: #ff8888; letter-spacing: 6px;">⚠ WARNING ⚠</div>
          <div style="font-size: 56px; font-weight: 900; color: var(--bad); text-shadow: 0 6px 0 #000, 0 0 30px var(--bad); margin-top: 4px;">てきの こうげき！${typeLabel ? `<div style="font-size:24px;color:#ffcc44;margin-top:4px;letter-spacing:3px;">${escapeHTML(typeLabel)}</div>` : ""}</div>
          <div style="font-size: 22px; color: #fff; margin-top: 6px;">${escapeHTML(targetName)} ねらわれた！</div>
        </div>`;
      SND.sfxBoss();
      if (SND.playSiren) SND.playSiren(1200);
    }
    // Keep translate(-50%, -50%) in every keyframe so the centering transform
    // isn't clobbered by the scale/rotate keyframes (the bug where it slid right).
    overlay.querySelector(".boss-warn-text").animate(
      [
        { transform: "translate(-50%, -50%) scale(0) rotate(-15deg)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(1.15) rotate(3deg)", opacity: 1, offset: 0.6 },
        { transform: "translate(-50%, -50%) scale(1) rotate(0)", opacity: 1 }
      ],
      { duration: 500, easing: "cubic-bezier(.18,.89,.32,1.28)", fill: "forwards" }
    );
    overlay.querySelector(".boss-warn-flash").animate(
      [
        { background: "rgba(255, 59, 107, 0)" },
        { background: "rgba(255, 59, 107, 0.4)", offset: 0.5 },
        { background: "rgba(255, 59, 107, 0)" }
      ],
      { duration: 400, iterations: 2 }
    );

    // Boss theme snippet runs the FULL attack — from the WARNING flash all the
    // way through the attack-name reveal — fading out as the overlay closes.
    // Total animation is 7200ms; snippet length is 7100ms which includes a 350ms
    // built-in tail fade, so the music ends right as we tear down the overlay.
    if (boss && boss.id) SND.playThemeSnippet(boss.id, 7100, 0.4);

    // ----- Stage 1: monster charges with phrase -----
    // Compact path (byPlayer) at 700ms, full at 1700ms so the WARNING text gets a real beat to read.
    setTimeout(() => {
      overlay.innerHTML = `
        <div class="boss-anim-stage">
          <div class="boss-anim-svg-wrap"></div>
          <div class="boss-anim-bubble">${escapeHTML(phrase)}</div>
        </div>`;
      // Boss voices the charge phrase as the bubble pops in
      if (boss && boss.id) SND.playBossLine(boss.id, phrase);
      const svgWrap = overlay.querySelector(".boss-anim-svg-wrap");
      svgWrap.innerHTML = Monsters.renderBossSVG(boss);
      // Charge: scale up + glow shake
      svgWrap.animate(
        [
          { transform: "scale(1) rotate(0)", filter: "brightness(1)" },
          { transform: "scale(1.12) rotate(-4deg)", filter: "brightness(1.6) drop-shadow(0 0 18px #ff3b6b)", offset: 0.35 },
          { transform: "scale(1.18) rotate(4deg)", filter: "brightness(2) drop-shadow(0 0 32px #ffcc00)", offset: 0.7 },
          { transform: "scale(1) rotate(0)", filter: "brightness(1)" }
        ],
        { duration: 1000, easing: "ease-in-out", fill: "forwards" }
      );
      const bubble = overlay.querySelector(".boss-anim-bubble");
      bubble.animate(
        [
          { transform: "translateX(-50%) scale(0)" },
          { transform: "translateX(-50%) scale(1)" }
        ],
        { duration: 350, easing: "cubic-bezier(.18,.89,.32,1.28)", fill: "forwards" }
      );
    }, T.charge);

    // ----- Stage 2: emoji burst -----
    setTimeout(() => {
      const burst = document.createElement("div");
      burst.className = "boss-anim-emoji";
      burst.textContent = emoji;
      overlay.appendChild(burst);
      burst.animate(
        [
          { transform: "translate(-50%,-50%) scale(0) rotate(-30deg)", opacity: 1 },
          { transform: "translate(-50%,-50%) scale(1.8) rotate(15deg)", opacity: 1 }
        ],
        { duration: 500, easing: "cubic-bezier(.18,.89,.32,1.28)", fill: "forwards" }
      );
    }, T.burst);

    // ----- Stage 3: bang (hit) or whoosh+MISS (miss) -----
    setTimeout(() => {
      if (missed) {
        // Whoosh: emoji streaks across screen instead of crashing into target.
        const whoosh = document.createElement("div");
        whoosh.className = "boss-anim-bang";
        whoosh.textContent = missVisual.sweep;
        overlay.appendChild(whoosh);
        whoosh.animate(
          [
            { transform: "translate(-150%,-50%) scale(1.2) rotate(-10deg)", opacity: 0 },
            { transform: "translate(-50%,-50%) scale(1.6) rotate(0)", opacity: 1, offset: 0.5 },
            { transform: "translate(80%,-50%) scale(1.2) rotate(20deg)", opacity: 0 }
          ],
          { duration: 500, easing: "ease-out", fill: "forwards" }
        );
        const miss = document.createElement("div");
        miss.className = "boss-anim-bang boss-anim-miss";
        miss.textContent = missVisual.label;
        overlay.appendChild(miss);
        miss.animate(
          [
            { transform: "translate(-50%,-50%) scale(0) rotate(-20deg)", opacity: 0 },
            { transform: "translate(-50%,-50%) scale(1.3) rotate(8deg)", opacity: 1, offset: 0.55 },
            { transform: "translate(-50%,-50%) scale(1) rotate(0)", opacity: 1 }
          ],
          { duration: 500, easing: "cubic-bezier(.18,.89,.32,1.28)", fill: "forwards" }
        );
        SND.sfxPop();
      } else {
        const bang = document.createElement("div");
        bang.className = "boss-anim-bang";
        bang.textContent = "💥";
        overlay.appendChild(bang);
        bang.animate(
          [
            { transform: "translate(-50%,-50%) scale(0) rotate(-15deg)", opacity: 1 },
            { transform: "translate(-50%,-50%) scale(2.2) rotate(15deg)", opacity: 1, offset: 0.6 },
            { transform: "translate(-50%,-50%) scale(1.6) rotate(0)", opacity: 0 }
          ],
          { duration: 500, easing: "ease-out", fill: "forwards" }
        );
        SND.sfxHit();
      }
    }, T.bang);

    // ----- Stage 4: attack name + damage / miss reveal -----
    setTimeout(() => {
      const name = document.createElement("div");
      name.className = "boss-anim-name";
      name.innerHTML = `
        <div class="atk-name">${escapeHTML(attack.name)}</div>
        <div class="atk-target" style="${missed?'color:#7ff0a0;':''}">${missed ? missRevealHTML : `→ ${escapeHTML(targetName)} に <b>${dmg}</b> ダメージ！`}</div>`;
      overlay.appendChild(name);
      name.animate(
        [
          { transform: "translateX(-50%) scale(0)", opacity: 0 },
          { transform: "translateX(-50%) scale(1.15)", opacity: 1, offset: 0.6 },
          { transform: "translateX(-50%) scale(1)", opacity: 1 }
        ],
        { duration: 450, easing: "cubic-bezier(.18,.89,.32,1.28)", fill: "forwards" }
      );
      // Dramatic attack-name shout — the build script tunes these clips with
      // higher intonation/volume so they sound shouted, not spoken.
      if (boss && boss.id && attack && attack.name) SND.playBossLine(boss.id, attack.name);
    }, T.reveal);

    // ----- End: clean up + callback -----
    // ~1900-2400ms after reveal so kids can read the attack-name + damage text.
    const endTimer = setTimeout(() => { if (!finished) finish(); }, T.end);
    let finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      try { clearTimeout(endTimer); } catch(_){}
      try { overlay.remove(); } catch(_){}
      onDone();
    }
    // Skip button — appears ~1300ms in (after the WARNING beat). Tapping it
    // fast-forwards to onDone immediately. Repetition was the #1 audit
    // complaint about boss attacks (4-player party = up to 12 cinematics
    // per round). The skip lets kids take the cinematic for the first one
    // and dismiss the rest.
    setTimeout(() => {
      if (finished) return;
      const skipBtn = document.createElement("button");
      skipBtn.className = "boss-anim-skip";
      skipBtn.innerHTML = "スキップ ▶▶";
      overlay.appendChild(skipBtn);
      // Use the project's tap helper so iOS pointer/click are handled.
      tap(skipBtn, finish);
    }, byPlayer ? 900 : 1500);
  }

  // -------- RARE EVENT HYPE INTRO --------
  // Big "★ レアイベント ★" splash to hype the player before any random pop-in.
  // Per-event color/icon tints — keyed by an `eventType` string the caller
  // optionally passes. Defaults to the original gold splash if no key.
  const RARE_EVENT_TINTS = {
    fairy:   { stars: "✨🧚‍♀️✨", glow: "rgba(255,180,255,0.5)", sub: "FAIRY!" },
    bomb:    { stars: "💣💥💣",   glow: "rgba(255,180,80,0.55)", sub: "BOMB!" },
    thief:   { stars: "🐈‍⬛💰🐈‍⬛", glow: "rgba(160,180,255,0.5)", sub: "THIEF!" },
    rush:    { stars: "🌀🌀🌀",   glow: "rgba(255,90,140,0.55)", sub: "RUSH!" },
    gambler: { stars: "🎰🎲🎰",   glow: "rgba(255,220,80,0.55)", sub: "GAMBLE!" },
    janken:  { stars: "✊✋✌️",     glow: "rgba(180,255,200,0.55)", sub: "JANKEN!" },
    ninja:   { stars: "🥷⚔️🥷",   glow: "rgba(180,180,180,0.55)", sub: "NINJA!" },
  };
  function showRareEventIntro(onDone, eventType) {
    SND.unlock();
    const tint = RARE_EVENT_TINTS[eventType] || { stars: "✨⭐✨", glow: "rgba(255,255,255,0.5)", sub: "RARE!" };
    const overlay = document.createElement("div");
    overlay.className = "rare-event-overlay";
    overlay.innerHTML = `
      <div class="rare-flash"></div>
      <div class="rare-content">
        <div class="rare-stars">${tint.stars}</div>
        <div class="rare-title">レアイベント！</div>
        <div class="rare-sub">${tint.sub}</div>
      </div>`;
    document.body.appendChild(overlay);
    SND.sfxVictory();
    if (SND.playSiren) SND.playSiren(1200);
    overlay.querySelector(".rare-content").animate(
      [
        { transform: "translate(-50%, -50%) scale(0) rotate(-20deg)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(1.2) rotate(5deg)", opacity: 1, offset: 0.55 },
        { transform: "translate(-50%, -50%) scale(1) rotate(0)", opacity: 1 }
      ],
      { duration: 600, easing: "cubic-bezier(.18,.89,.32,1.28)", fill: "forwards" }
    );
    overlay.querySelector(".rare-flash").animate(
      [
        { background: "rgba(255, 255, 255, 0)" },
        { background: tint.glow, offset: 0.5 },
        { background: "rgba(255, 255, 255, 0)" }
      ],
      { duration: 500, iterations: 2 }
    );
    overlay.querySelector(".rare-stars").animate(
      [{ transform: "rotate(0)" }, { transform: "rotate(360deg)" }],
      { duration: 1500, iterations: Infinity }
    );
    setTimeout(() => { overlay.remove(); onDone(); }, 1500);
  }

  // -------- PVP FACE-OFF INTRO --------
  // Boxer-entrance style splash before round 1 of monster-vs-monster mode.
  // Shows every kid's monster in a row separated by VS, then a big "FIGHT!".
  function showPvpFaceoff(players, onDone) {
    SND.unlock();
    const overlay = document.createElement("div");
    overlay.className = "round-intro-overlay";
    const lineup = players.map(p => `
      <div style="text-align:center; min-width:120px;">
        <div style="height:120px;">${p.monster ? Monsters.renderBossSVG(p.monster) : ''}</div>
        <div style="color:var(--accent); font-weight:900; font-size:14px;">${p.avatar?p.avatar+' ':''}${escapeHTML(p.name)}</div>
        <div style="font-size:10px; opacity:.8;">${p.monster?escapeHTML(p.monster.name_jp):''}</div>
      </div>`).join('<div style="font-size:32px; color:var(--bad); font-weight:900; align-self:center;">VS</div>');
    overlay.innerHTML = `
      <div class="round-flash"></div>
      <div class="round-content" style="width:95%; max-width: 760px;">
        <div class="round-label">⚔️ MONSTER BATTLE</div>
        <div style="display:flex; align-items:center; justify-content:center; gap:10px; margin: 16px 0; flex-wrap:wrap;">${lineup}</div>
        <div class="round-num" style="font-size: 88px; color: var(--bad); text-shadow: 0 8px 0 #000, 0 0 30px var(--bad);">FIGHT!</div>
      </div>`;
    document.body.appendChild(overlay);
    SND.sfxBoss();
    overlay.querySelector(".round-content").animate(
      [
        { transform: "translate(-50%, -50%) scale(0.6)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(1.05)", opacity: 1, offset: 0.6 },
        { transform: "translate(-50%, -50%) scale(1)", opacity: 1 }
      ],
      { duration: 700, easing: "cubic-bezier(.18,.89,.32,1.28)", fill: "forwards" }
    );
    overlay.querySelector(".round-flash").animate(
      [
        { background: "rgba(255,255,255,0)" },
        { background: "rgba(255,255,255,0.5)", offset: 0.5 },
        { background: "rgba(255,255,255,0)" }
      ],
      { duration: 500, iterations: 2 }
    );
    setTimeout(() => { overlay.remove(); if (onDone) onDone(); }, 2400);
  }

  // -------- CLIFFHANGER (boss core at 1 HP) --------
  // Music drops out, "あと 1ポイント…" splash, beat of silence, then continue.
  // Builds tension before the killing blow.
  function showCliffhanger(boss, onDone) {
    SND.unlock();
    SND.stopTheme(150);
    const overlay = document.createElement("div");
    overlay.className = "cliffhanger-overlay";
    overlay.innerHTML = `
      <div class="cliff-flash"></div>
      <div class="cliff-content">
        <div class="cliff-svg">${boss ? Monsters.renderBossSVG(boss) : ''}</div>
        <div class="cliff-label">あと 1ポイント…</div>
        <div class="cliff-sub">息[いき]を のんだ！</div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector(".cliff-content").animate(
      [
        { transform: "translate(-50%, -50%) scale(0.85)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(1)",    opacity: 1 }
      ],
      { duration: 500, easing: "ease-out", fill: "forwards" }
    );
    overlay.querySelector(".cliff-svg").animate(
      [
        { filter: "brightness(1)" },
        { filter: "brightness(.4) saturate(0.5)", offset: 0.5 },
        { filter: "brightness(.7) saturate(0.8)" }
      ],
      { duration: 2200, easing: "ease-out", fill: "forwards" }
    );
    setTimeout(() => { overlay.remove(); if (onDone) onDone(); }, 2400);
  }

  // -------- ROUND ANNOUNCEMENT --------
  // Boxing-card style "ROUND N" splash. Round 5+ gets extra flair so long
  // battles feel like the stakes are climbing.
  // -------- SPEECH BONUS SPLASH --------
  // Big star burst when the kid nails the speech challenge — much more
  // satisfying than the previous 1300ms toast for what's the hardest
  // interaction in the game (kid has to physically speak English).
  function showSpeechBonusSplash(word, onDone) {
    SND.unlock();
    const overlay = document.createElement("div");
    overlay.className = "round-intro-overlay";
    overlay.innerHTML = `
      <div class="round-flash" style="background:rgba(0,0,0,0);"></div>
      <div class="round-content">
        <div class="round-label" style="color:#ffcc00; font-size: 64px;">⭐ PERFECT! ⭐</div>
        <div class="round-sub" style="color:#fff;">「${escapeHTML(word||'')}」 ✨ +2 ボーナス！</div>
      </div>`;
    document.body.appendChild(overlay);
    SND.sfxVictory();
    overlay.querySelector(".round-content").animate(
      [
        { transform: "translate(-50%, -50%) scale(0) rotate(-15deg)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(1.25) rotate(8deg)", opacity: 1, offset: 0.55 },
        { transform: "translate(-50%, -50%) scale(1) rotate(0)", opacity: 1 }
      ],
      { duration: 480, easing: "cubic-bezier(.18,.89,.32,1.28)", fill: "forwards" }
    );
    overlay.querySelector(".round-flash").animate(
      [
        { background: "rgba(255, 204, 0, 0)" },
        { background: "rgba(255, 204, 0, 0.45)", offset: 0.4 },
        { background: "rgba(255, 204, 0, 0)" }
      ],
      { duration: 700, iterations: 1 }
    );
    setTimeout(() => { overlay.remove(); if (onDone) onDone(); }, 1300);
  }

  // -------- PHASE TRANSITION SPLASH (N2) --------
  // Fired when boss core drops below the 50% threshold. The boss enters its
  // "second form" — game.js sets a _phase2 flag that the stage CSS reads
  // for an enhanced glow + saturation, plus boss-attack damage gets a small
  // bump. This is the middle dramatic beat between fight start and rage
  // mode (which fires at 25%).
  function showPhase2Intro(boss, onDone) {
    SND.unlock();
    const overlay = document.createElement("div");
    overlay.className = "round-intro-overlay";
    // Use a hits-pool line for the phase-2 phrase — IS pre-rendered. The
    // boss_taunts.hurt pool is locale-only and not voiced by the build.
    const phrase = (boss && Array.isArray(boss.hits) && boss.hits.length)
      ? boss.hits[(Math.random()*boss.hits.length)|0]
      : "まだまだ！";
    overlay.innerHTML = `
      <div class="round-flash" style="background:rgba(255,80,200,0)"></div>
      <div class="round-content">
        <div class="round-label" style="color:#ff66cc;">⚡ PHASE 2 ⚡</div>
        <div class="round-num" style="font-size:48px;color:#ff66cc; text-shadow: 0 6px 0 #000, 0 0 30px #ff66cc;">${escapeHTML(boss && boss.name_jp || '')}</div>
        <div class="round-sub" style="color:#fff;">${escapeHTML(phrase)}</div>
      </div>`;
    document.body.appendChild(overlay);
    SND.sfxBoss();
    if (boss && boss.id && boss.hits && boss.hits.length) SND.playBossLine(boss.id, phrase);
    // Brief duck so the phase-2 sting reads.
    if (SND.duckTheme) SND.duckTheme(1100, 0.30);
    overlay.querySelector(".round-content").animate(
      [
        { transform: "translate(-50%, -50%) scale(0) rotate(-15deg)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(1.25) rotate(8deg)", opacity: 1, offset: 0.55 },
        { transform: "translate(-50%, -50%) scale(1) rotate(0)", opacity: 1 }
      ],
      { duration: 540, easing: "cubic-bezier(.18,.89,.32,1.28)", fill: "forwards" }
    );
    overlay.querySelector(".round-flash").animate(
      [
        { background: "rgba(255, 80, 200, 0)" },
        { background: "rgba(255, 80, 200, 0.5)", offset: 0.5 },
        { background: "rgba(255, 80, 200, 0)" }
      ],
      { duration: 460, iterations: 2 }
    );
    setTimeout(() => { overlay.remove(); if (onDone) onDone(); }, 1700);
  }

  // -------- COMBO TIER SPLASH --------
  // Brief banner when a kid hits combo 3 / 5 / 7 / 10 — turns a "+1 dmg
  // bonus" toast into a real moment. Reuses round-intro-overlay styling
  // for free, with tier-specific copy and color.
  function showComboSplash(combo, onDone) {
    const tiers = {
      3:  { label: "🔥 COMBO ×3",   sub: "ナイス れんぞく！",      color: "#ff8844" },
      5:  { label: "🔥🔥 COMBO ×5", sub: "もえてる！",              color: "#ff5511" },
      7:  { label: "💥 COMBO ×7",   sub: "とまらない！",            color: "#ffcc00" },
      10: { label: "⚡ ON FIRE ⚡",  sub: "でんせつ！ COMBO ×10",   color: "#ffeb44" },
    };
    const t = tiers[combo];
    if (!t) { if (onDone) onDone(); return; }
    SND.unlock();
    const overlay = document.createElement("div");
    overlay.className = "round-intro-overlay";
    overlay.innerHTML = `
      <div class="round-flash" style="background:rgba(0,0,0,0);"></div>
      <div class="round-content">
        <div class="round-label" style="color:${t.color};">${t.label}</div>
        <div class="round-sub" style="color:#fff;">${t.sub}</div>
      </div>`;
    document.body.appendChild(overlay);
    SND.sfxCorrect();
    overlay.querySelector(".round-content").animate(
      [
        { transform: "translate(-50%, -50%) scale(0) rotate(-12deg)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(1.15) rotate(4deg)", opacity: 1, offset: 0.55 },
        { transform: "translate(-50%, -50%) scale(1) rotate(0)", opacity: 1 }
      ],
      { duration: 400, easing: "cubic-bezier(.18,.89,.32,1.28)", fill: "forwards" }
    );
    overlay.querySelector(".round-flash").animate(
      [
        { background: "rgba(255, 200, 80, 0)" },
        { background: "rgba(255, 200, 80, 0.35)", offset: 0.5 },
        { background: "rgba(255, 200, 80, 0)" }
      ],
      { duration: 400, iterations: 1 }
    );
    setTimeout(() => { overlay.remove(); if (onDone) onDone(); }, 900);
  }

  // -------- FIRST BLOOD SPLASH --------
  // Fired on the first correct answer of the battle.
  function showFirstBloodSplash(onDone) {
    SND.unlock();
    const overlay = document.createElement("div");
    overlay.className = "round-intro-overlay";
    overlay.innerHTML = `
      <div class="round-flash" style="background:rgba(0,0,0,0);"></div>
      <div class="round-content">
        <div class="round-label" style="color:#ff3b6b;">FIRST BLOOD</div>
        <div class="round-sub" style="color:#fff;">バトル スタート！</div>
      </div>`;
    document.body.appendChild(overlay);
    SND.sfxVictory();
    overlay.querySelector(".round-content").animate(
      [
        { transform: "translate(-50%, -50%) scale(0) rotate(-15deg)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(1.2) rotate(5deg)", opacity: 1, offset: 0.55 },
        { transform: "translate(-50%, -50%) scale(1) rotate(0)", opacity: 1 }
      ],
      { duration: 450, easing: "cubic-bezier(.18,.89,.32,1.28)", fill: "forwards" }
    );
    setTimeout(() => { overlay.remove(); if (onDone) onDone(); }, 1100);
  }

  // -------- PART DESTROYED SPLASH --------
  // Fired when a boss/opponent monster part hp hits 0.
  function showPartDestroyedSplash(partName) {
    const overlay = document.createElement("div");
    overlay.className = "round-intro-overlay";
    overlay.innerHTML = `
      <div class="round-flash" style="background:rgba(0,0,0,0);"></div>
      <div class="round-content">
        <div class="round-label" style="color:#7ff0a0;">💥 BROKEN!</div>
        <div class="round-sub" style="color:#fff; font-size:24px;">${escapeHTML(partName||"パーツ")} を こわした！</div>
      </div>`;
    document.body.appendChild(overlay);
    // Distinct, satisfying break SFX — three descending tones ≠ sfxPop.
    if (SND.sfxBreak) SND.sfxBreak(); else SND.sfxHit();
    overlay.querySelector(".round-content").animate(
      [
        { transform: "translate(-50%, -50%) scale(0)",    opacity: 0 },
        { transform: "translate(-50%, -50%) scale(1.2)", opacity: 1, offset: 0.55 },
        { transform: "translate(-50%, -50%) scale(1)",    opacity: 1 }
      ],
      { duration: 350, easing: "cubic-bezier(.18,.89,.32,1.28)", fill: "forwards" }
    );
    setTimeout(() => overlay.remove(), 1000);
  }

  // Round 1 "FIGHT!" stinger — fills the awkward silence between the boss
  // intro and the first question. Ported pattern from showRoundIntro.
  function showFightStinger(onDone) {
    SND.unlock();
    const overlay = document.createElement("div");
    overlay.className = "round-intro-overlay";
    overlay.innerHTML = `
      <div class="round-flash"></div>
      <div class="round-content">
        <div class="round-label" style="color:#ff3b6b;">⚔ ROUND 1 ⚔</div>
        <div class="round-num" style="font-size:88px;color:var(--bad); text-shadow:0 8px 0 #000, 0 0 30px var(--bad);">FIGHT!</div>
      </div>`;
    document.body.appendChild(overlay);
    SND.sfxBoss();
    overlay.querySelector(".round-content").animate(
      [
        { transform: "translate(-50%, -50%) scale(0) rotate(-15deg)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(1.25) rotate(8deg)", opacity: 1, offset: 0.55 },
        { transform: "translate(-50%, -50%) scale(1) rotate(0)", opacity: 1 }
      ],
      { duration: 520, easing: "cubic-bezier(.18,.89,.32,1.28)", fill: "forwards" }
    );
    overlay.querySelector(".round-flash").animate(
      [
        { background: "rgba(255, 59, 107, 0)" },
        { background: "rgba(255, 59, 107, 0.5)", offset: 0.5 },
        { background: "rgba(255, 59, 107, 0)" }
      ],
      { duration: 440, iterations: 2 }
    );
    setTimeout(() => { overlay.remove(); if (onDone) onDone(); }, 1500);
  }

  function showRoundIntro(round, onDone) {
    SND.unlock();
    // Per-round tier so rounds 2/3/4 don't all flash identically.
    let label, sub, color;
    if (round >= 8) {
      label = "💀 FINAL ROUND"; sub = "けっちゃく！"; color = "#ff3b6b";
    } else if (round >= 5) {
      label = "🔥 ROUND";        sub = "きょくげん！"; color = "#ffcc00";
    } else if (round >= 4) {
      label = "⚡ ROUND";         sub = "ヒートアップ！"; color = "#ff9933";
    } else if (round >= 3) {
      label = "ROUND";            sub = "もうおどる！";   color = "#ffeb44";
    } else {
      label = "ROUND";            sub = "";              color = "#ffeb44";
    }
    const overlay = document.createElement("div");
    overlay.className = "round-intro-overlay";
    overlay.innerHTML = `
      <div class="round-flash"></div>
      <div class="round-content">
        <div class="round-label" style="color:${color};">${label}</div>
        <div class="round-num" style="color:${color}; text-shadow: 0 8px 0 #000, 0 0 30px ${color};">${round}</div>
        ${sub ? `<div class="round-sub">${sub}</div>` : ``}
      </div>`;
    document.body.appendChild(overlay);
    SND.sfxBoss();
    overlay.querySelector(".round-content").animate(
      [
        { transform: "translate(-50%, -50%) scale(0) rotate(-15deg)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(1.2) rotate(5deg)", opacity: 1, offset: 0.55 },
        { transform: "translate(-50%, -50%) scale(1) rotate(0)", opacity: 1 }
      ],
      { duration: 500, easing: "cubic-bezier(.18,.89,.32,1.28)", fill: "forwards" }
    );
    overlay.querySelector(".round-flash").animate(
      [
        { background: "rgba(255, 255, 255, 0)" },
        { background: "rgba(255, 255, 255, 0.4)", offset: 0.5 },
        { background: "rgba(255, 255, 255, 0)" }
      ],
      { duration: 400, iterations: 1 }
    );
    setTimeout(() => { overlay.remove(); if (onDone) onDone(); }, 1300);
  }

  // -------- RAGE ACTIVATION (boss core ≤ 25%) --------
  // Big red splash, boss SVG with red glow, rage phrase. Caller still owns
  // the game state changes (attacksPerRound++, raged flag); this is just the
  // show-and-tell.
  const RAGE_PHRASES = [
    "ぐぉぉぉぉ！", "もう ゆるさん！", "これからが ほんき！",
    "ぼくの ほんとうの すがた！", "ぐおおお〜！", "なめるなよ！",
    "本気[ほんき] モード！", "もう おこったぞ！"
  ];
  function showRageIntro(boss, onDone) {
    SND.unlock();
    const phrase = RAGE_PHRASES[(Math.random()*RAGE_PHRASES.length)|0];
    const overlay = document.createElement("div");
    overlay.className = "rage-overlay";
    overlay.innerHTML = `
      <div class="rage-flash"></div>
      <div class="rage-content">
        <div class="rage-label">⚠ RAGE ⚠</div>
        <div class="rage-name">${escapeHTML(boss.name_jp)}</div>
        <div class="rage-svg">${Monsters.renderBossSVG(boss)}</div>
        <div class="rage-phrase">${furigana(phrase)}</div>
      </div>`;
    document.body.appendChild(overlay);
    SND.sfxBoss();
    // Restart theme at a random offset to ramp up the energy.
    if (boss && boss.id) SND.playThemeSnippet(boss.id, 2400, 0.55);
    // Boss roars the rage phrase
    if (boss && boss.id) SND.playBossLine(boss.id, phrase);
    overlay.querySelector(".rage-content").animate(
      [
        { transform: "translate(-50%, -50%) scale(0) rotate(-15deg)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(1.15) rotate(3deg)", opacity: 1, offset: 0.6 },
        { transform: "translate(-50%, -50%) scale(1) rotate(0)", opacity: 1 }
      ],
      { duration: 600, easing: "cubic-bezier(.18,.89,.32,1.28)", fill: "forwards" }
    );
    overlay.querySelector(".rage-flash").animate(
      [
        { background: "rgba(255, 59, 0, 0)" },
        { background: "rgba(255, 59, 0, 0.55)", offset: 0.5 },
        { background: "rgba(255, 59, 0, 0)" }
      ],
      { duration: 400, iterations: 3 }
    );
    overlay.querySelector(".rage-svg").animate(
      [
        { transform: "scale(1) rotate(0)" },
        { transform: "scale(1.08) rotate(-2deg)" },
        { transform: "scale(1) rotate(2deg)" },
        { transform: "scale(1.08) rotate(0)" }
      ],
      { duration: 800, iterations: 3 }
    );
    setTimeout(() => { overlay.remove(); if (onDone) onDone(); }, 2400);
  }

  // -------- K.O. CINEMATIC (boss core destroyed) --------
  // Slow desaturating zoom on the boss SVG, big "K.O. !" reveal, confetti
  // burst, then the victory screen takes over.
  function showKO(boss, onDone) {
    SND.unlock();
    const overlay = document.createElement("div");
    overlay.className = "ko-overlay";
    overlay.innerHTML = `
      <div class="ko-flash"></div>
      <div class="ko-content">
        <div class="ko-svg">${Monsters.renderBossSVG(boss)}</div>
      </div>
      <div class="ko-label">K.O. !</div>
      <div class="confetti-layer"></div>`;
    document.body.appendChild(overlay);
    spawnConfetti(overlay.querySelector(".confetti-layer"), 50);
    SND.sfxVictory();
    // Duck the theme so the K.O. sting reads. Larger dip + longer hold than
    // a crit since this is a bigger moment.
    if (SND.duckTheme) SND.duckTheme(1500, 0.20);
    overlay.querySelector(".ko-svg").animate(
      [
        { transform: "scale(1) rotate(0)",            filter: "saturate(1) brightness(1)",      opacity: 1 },
        { transform: "scale(1.5) rotate(6deg)",       filter: "saturate(0.5) brightness(1.4)",  opacity: 1, offset: 0.55 },
        { transform: "scale(0.55) rotate(-25deg)",    filter: "saturate(0) brightness(0.4)",    opacity: 0.4 }
      ],
      { duration: 1800, easing: "ease-in", fill: "forwards" }
    );
    overlay.querySelector(".ko-flash").animate(
      [
        { background: "rgba(255,255,255,0)" },
        { background: "rgba(255,255,255,0.7)", offset: 0.5 },
        { background: "rgba(255,255,255,0)" }
      ],
      { duration: 350, iterations: 1, delay: 1100 }
    );
    overlay.querySelector(".ko-label").animate(
      [
        { transform: "translate(-50%, -50%) scale(0) rotate(-25deg)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(2.4) rotate(8deg)", opacity: 1, offset: 0.5 },
        { transform: "translate(-50%, -50%) scale(1.8) rotate(0deg)", opacity: 1 }
      ],
      { duration: 700, delay: 1100, easing: "cubic-bezier(.18,.89,.32,1.28)", fill: "forwards" }
    );
    setTimeout(() => { overlay.remove(); if (onDone) onDone(); }, 2400);
  }

  // Confetti spawner — used by K.O. cinematic and victory screen.
  function spawnConfetti(layer, count) {
    if (!layer) return;
    const emojis = ["🎉","🎊","⭐","🌟","✨","💫","🎈","🌈"];
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.textContent = emojis[(Math.random()*emojis.length)|0];
      piece.style.left = (Math.random()*100) + "%";
      piece.style.fontSize = (18 + Math.random()*22) + "px";
      piece.style.animationDuration = (2 + Math.random()*2) + "s";
      piece.style.animationDelay = (Math.random()*0.6) + "s";
      layer.appendChild(piece);
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

  // 🎤 クイズマスター — 20-second rapid-fire 1★ rush. Each correct = +2 dmg.
  const QUIZMASTER_SVG = `
    <svg viewBox="0 0 200 220" class="event-svg" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="200" rx="55" ry="14" fill="#000" opacity=".3"/>
      <ellipse cx="100" cy="180" rx="44" ry="22" fill="#1a1a3a" stroke="#000" stroke-width="3"/>
      <rect x="80" y="120" width="40" height="50" fill="#1a1a3a" stroke="#000" stroke-width="3"/>
      <polygon points="80,120 120,120 130,135 70,135" fill="#1a1a3a" stroke="#000" stroke-width="3"/>
      <rect x="84" y="135" width="32" height="6" fill="#fff"/>
      <polygon points="92,141 100,148 108,141" fill="#e02030" stroke="#000" stroke-width="2"/>
      <circle cx="100" cy="80" r="40" fill="#fde0c0" stroke="#000" stroke-width="3"/>
      <ellipse cx="100" cy="55" rx="32" ry="14" fill="#3a2a1a"/>
      <path d="M 70 70 Q 100 50 130 70" stroke="#3a2a1a" stroke-width="6" fill="none"/>
      <circle cx="86" cy="80" r="5" fill="#000"/>
      <circle cx="114" cy="80" r="5" fill="#000"/>
      <circle cx="87" cy="79" r="2" fill="#fff"/>
      <circle cx="115" cy="79" r="2" fill="#fff"/>
      <ellipse cx="78" cy="92" rx="6" ry="3" fill="#ff88bb" opacity=".7"/>
      <ellipse cx="122" cy="92" rx="6" ry="3" fill="#ff88bb" opacity=".7"/>
      <path d="M 88 96 Q 100 108 112 96" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <line x1="135" y1="140" x2="155" y2="100" stroke="#222" stroke-width="4" stroke-linecap="round"/>
      <ellipse cx="158" cy="92" rx="11" ry="14" fill="#222" stroke="#000" stroke-width="2"/>
      <ellipse cx="158" cy="88" rx="7" ry="9" fill="#666"/>
    </svg>`;

  // 🎩 ギャンブラー — wagers your HP for boss damage; coin-flip can double it.
  const GAMBLER_SVG = `
    <svg viewBox="0 0 200 220" class="event-svg" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="208" rx="55" ry="12" fill="#000" opacity=".3"/>
      <path d="M 60 120 L 60 200 L 140 200 L 140 120 L 130 110 L 70 110 Z" fill="#3a3a3a" stroke="#000" stroke-width="3"/>
      <path d="M 90 110 L 90 200 M 110 110 L 110 200" stroke="#1a1a1a" stroke-width="2"/>
      <rect x="92" y="115" width="16" height="20" fill="#fff"/>
      <line x1="100" y1="120" x2="100" y2="135" stroke="#000" stroke-width="2"/>
      <circle cx="100" cy="78" r="36" fill="#d4a878" stroke="#000" stroke-width="3"/>
      <ellipse cx="60" cy="48" rx="50" ry="8" fill="#1a1a1a" stroke="#000" stroke-width="2"/>
      <path d="M 70 50 L 70 36 L 130 36 L 130 50 Z" fill="#1a1a1a" stroke="#000" stroke-width="2"/>
      <rect x="68" y="48" width="64" height="6" fill="#8a3030" stroke="#000" stroke-width="1.5"/>
      <circle cx="86" cy="78" r="4" fill="#000"/>
      <circle cx="114" cy="78" r="4" fill="#000"/>
      <line x1="80" y1="72" x2="92" y2="72" stroke="#000" stroke-width="2"/>
      <line x1="108" y1="72" x2="120" y2="72" stroke="#000" stroke-width="2"/>
      <circle cx="100" cy="98" r="4" fill="#fff"/>
      <line x1="98" y1="100" x2="120" y2="106" stroke="#a06030" stroke-width="2"/>
      <g stroke="#3a2a1a" stroke-width=".5">
        <circle cx="80" cy="100" r=".5"/><circle cx="84" cy="102" r=".5"/>
        <circle cx="88" cy="103" r=".5"/><circle cx="92" cy="104" r=".5"/>
        <circle cx="108" cy="104" r=".5"/><circle cx="112" cy="103" r=".5"/>
        <circle cx="116" cy="102" r=".5"/><circle cx="120" cy="100" r=".5"/>
      </g>
      <ellipse cx="155" cy="115" rx="18" ry="18" fill="#ffe45c" stroke="#a08020" stroke-width="3"/>
      <text x="155" y="122" text-anchor="middle" font-size="22" font-weight="900" fill="#a08020">¥</text>
      <line x1="138" y1="118" x2="148" y2="115" stroke="#d4a878" stroke-width="6" stroke-linecap="round"/>
    </svg>`;

  // ✊ ジャンケン マスター — rock/paper/scissors duel.
  const JANKEN_SVG = `
    <svg viewBox="0 0 200 220" class="event-svg" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="208" rx="55" ry="12" fill="#000" opacity=".3"/>
      <path d="M 50 200 L 60 130 L 140 130 L 150 200 Z" fill="#5a3050" stroke="#000" stroke-width="3"/>
      <line x1="100" y1="130" x2="100" y2="200" stroke="#1a1a3a" stroke-width="2"/>
      <path d="M 60 130 Q 100 145 140 130" stroke="#ffe45c" stroke-width="4" fill="none"/>
      <circle cx="100" cy="92" r="38" fill="#fde0c0" stroke="#000" stroke-width="3"/>
      <path d="M 65 80 Q 100 60 135 80" stroke="#1a1a1a" stroke-width="6" fill="none" stroke-linecap="round"/>
      <ellipse cx="100" cy="60" rx="14" ry="10" fill="#1a1a1a" stroke="#000" stroke-width="2"/>
      <rect x="94" y="46" width="12" height="20" fill="#1a1a1a" stroke="#000" stroke-width="2"/>
      <ellipse cx="100" cy="46" rx="6" ry="5" fill="#1a1a1a"/>
      <path d="M 75 90 Q 80 86 85 90" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M 115 90 Q 120 86 125 90" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <line x1="93" y1="103" x2="107" y2="103" stroke="#000" stroke-width="2.5" stroke-linecap="round"/>
      <ellipse cx="160" cy="155" rx="18" ry="22" fill="#fde0c0" stroke="#000" stroke-width="3" transform="rotate(-15 160 155)"/>
      <text x="160" y="162" text-anchor="middle" font-size="20">✊</text>
    </svg>`;

  // 🥷 ニンジャ — silent strike, free 8 dmg to a random non-core part.
  const NINJA_SVG = `
    <svg viewBox="0 0 200 220" class="event-svg" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="208" rx="55" ry="12" fill="#000" opacity=".3"/>
      <path d="M 60 200 L 65 130 L 135 130 L 140 200 Z" fill="#1a1a1a" stroke="#000" stroke-width="3"/>
      <circle cx="100" cy="100" r="38" fill="#1a1a1a" stroke="#000" stroke-width="3"/>
      <rect x="60" y="90" width="80" height="14" fill="#fde0c0"/>
      <ellipse cx="84" cy="97" rx="5" ry="5" fill="#fff"/>
      <ellipse cx="116" cy="97" rx="5" ry="5" fill="#fff"/>
      <circle cx="84" cy="97" r="2" fill="#000"/>
      <circle cx="116" cy="97" r="2" fill="#000"/>
      <path d="M 60 110 Q 100 130 140 110" stroke="#000" stroke-width="2"/>
      <rect x="62" y="86" width="76" height="6" fill="#1a1a1a"/>
      <line x1="62" y1="86" x2="138" y2="86" stroke="#444" stroke-width="1"/>
      <g transform="translate(160,140) rotate(25)">
        <polygon points="0,-15 5,-5 15,-3 7,3 10,15 0,8 -10,15 -7,3 -15,-3 -5,-5" fill="#888" stroke="#000" stroke-width="2"/>
        <circle cx="0" cy="0" r="3" fill="#222"/>
      </g>
      <line x1="40" y1="60" x2="55" y2="75" stroke="#888" stroke-width="2" stroke-dasharray="4 2"/>
      <line x1="155" y1="135" x2="135" y2="115" stroke="#888" stroke-width="2" stroke-dasharray="4 2"/>
    </svg>`;

  function renderRushEvent(player, level, onResolve) {
    SND.unlock(); SND.sfxBoss();
    const intro = `
      <div class="event-rare">★ レアキャラ ★</div>
      <div class="event-name">クイズマスター 🎤</div>
      ${QUIZMASTER_SVG}
      <div class="event-line">「ラッシュ もんだい！20びょう で<br>なんもん こたえられる？！」</div>
      <div class="event-line subtle">せいかい × 2 ダメージ！</div>
      <div class="event-buttons">
        <button class="btn huge hot" id="ev-go">スタート！🔥</button>
      </div>`;
    const modal = showModal(intro);
    tap(modal.querySelector("#ev-go"), () => startRush());

    function startRush() {
      let correctCount = 0;
      let remaining = 20;
      let answered = false;
      let timerHandle = null;
      const ec = modal.querySelector(".event-card");

      function nextQ() {
        const q = Questions.pick(level || 2, 1, { misses: player.misses, seenIds: player.seenIds });
        if (!q) return finish();
        player.seenIds.push(q.id);
        answered = false;
        let displayPrompt = "";
        if (q.promptImage) displayPrompt += `<div style="font-size:48px;line-height:1;">${q.promptImage}</div>`;
        if (q.prompt) displayPrompt += `<div style="font-size:22px;font-weight:900;margin:6px 0;">${escapeHTML(q.prompt).replace(/\n/g,"<br>")}</div>`;
        ec.innerHTML = `
          <div style="font-size:14px;color:var(--accent);">クイズマスター ラッシュ</div>
          <div class="q-timer" id="q-timer" style="position:relative;display:inline-block;margin:6px 0;">⏱️ <span id="q-timer-num">${remaining}</span> / ✅ ${correctCount}</div>
          <div style="font-size:18px;color:#d8c8ff;">${q.prompt_jp}</div>
          ${displayPrompt}
          <div class="options" id="rush-opts" style="margin-top:8px;"></div>`;
        const optsEl = modal.querySelector("#rush-opts");
        q.options.forEach((opt, i) => {
          const o = document.createElement("div");
          o.className = "opt"; o.dataset.i = i; o.textContent = opt;
          o.style.fontSize = "20px"; o.style.padding = "10px"; o.style.minHeight = "56px";
          tap(o, () => {
            if (answered) return; answered = true;
            const correct = i === q.answer;
            o.classList.add(correct ? "right" : "wrong");
            optsEl.querySelectorAll(".opt").forEach(x => x.classList.add("disabled"));
            if (correct) { correctCount++; SND.sfxCorrect(); } else SND.sfxWrong();
            setTimeout(() => { if (remaining > 0) nextQ(); }, 250);
          });
          optsEl.appendChild(o);
        });
        if (q.audio) setTimeout(() => SND.speak(q.audio), 100);
      }
      function finish() {
        if (timerHandle) clearInterval(timerHandle);
        ec.innerHTML = `
          <div class="event-rare">★ レアキャラ ★</div>
          <div class="event-name">クイズマスター 🎤</div>
          ${QUIZMASTER_SVG}
          <div class="event-line">「${correctCount}もん せいかい！」</div>
          <div class="event-line" style="color:var(--good);">${correctCount * 2} ダメージ！</div>
          <div class="event-buttons">
            <button class="btn huge good" id="ev-ok">いっこう だ！⚔️</button>
          </div>`;
        tap(modal.querySelector("#ev-ok"), () => {
          closeModal(modal);
          onResolve(correctCount);
        });
      }
      timerHandle = setInterval(() => {
        remaining--;
        const tn = modal.querySelector("#q-timer-num");
        if (tn) tn.textContent = remaining;
        if (remaining <= 0) {
          clearInterval(timerHandle);
          finish();
        }
      }, 1000);
      nextQ();
    }
  }

  function renderGamblerEvent(player, onResolve) {
    SND.unlock(); SND.sfxPop();
    const html = `
      <div class="event-rare">★ レアキャラ ★</div>
      <div class="event-name">ギャンブラー 🎩</div>
      ${GAMBLER_SVG}
      <div class="event-line">「あんちゃん…じぶんの HP かけて<br>こうげき しねぇか？」</div>
      <div class="event-line subtle">HPを かける → ダメージ！コインで うんが よければ ×2！</div>
      <div class="event-buttons">
        <button class="btn good" id="ev-5">5 HP かける</button>
        <button class="btn cool" id="ev-10">10 HP かける</button>
        <button class="btn hot" id="ev-15">15 HP かける</button>
      </div>
      <button class="btn ghost" id="ev-no" style="margin-top:8px;">パス…</button>`;
    const modal = showModal(html);
    function pickWager(wager) {
      // Coin flip animation
      const ec = modal.querySelector(".event-card");
      ec.innerHTML = `
        <div class="event-name">コイン トス…</div>
        <div style="font-size:80px;animation:coin-spin .9s linear infinite;display:inline-block;">🪙</div>
        <style>@keyframes coin-spin{0%,100%{transform:rotateY(0)}50%{transform:rotateY(180deg)}}</style>`;
      const lucky = Math.random() < 0.5;
      setTimeout(() => {
        ec.innerHTML = `
          <div class="event-name">${lucky?'🎉 大あたり！':'😅 ふつう…'}</div>
          ${GAMBLER_SVG}
          <div class="event-line">${lucky?`「ラッキー！ダメージ ${wager*2}！」`:`「ざんねん！ダメージ ${wager}…」`}</div>
          <div class="event-buttons">
            <button class="btn huge ${lucky?'good':'cool'}" id="ev-ok">うけとる！</button>
          </div>`;
        tap(modal.querySelector("#ev-ok"), () => {
          closeModal(modal);
          onResolve({ wager, lucky });
        });
      }, 1300);
    }
    tap(modal.querySelector("#ev-5"),  () => pickWager(5));
    tap(modal.querySelector("#ev-10"), () => pickWager(10));
    tap(modal.querySelector("#ev-15"), () => pickWager(15));
    tap(modal.querySelector("#ev-no"), () => { closeModal(modal); onResolve({ wager: 0, lucky: false }); });
  }

  function renderJankenEvent(player, onResolve) {
    SND.unlock(); SND.sfxPop();
    const html = `
      <div class="event-rare">★ レアキャラ ★</div>
      <div class="event-name">ジャンケン マスター ✊</div>
      ${JANKEN_SVG}
      <div class="event-line">「ジャンケン しょうぶ じゃ！」</div>
      <div class="event-buttons">
        <button class="btn cool" id="j-rock">✊<br>グー</button>
        <button class="btn good" id="j-paper">✋<br>パー</button>
        <button class="btn hot" id="j-sci">✌️<br>チョキ</button>
      </div>`;
    const modal = showModal(html);
    function play(playerPick) {
      const choices = ["rock", "paper", "scissors"];
      const masterPick = choices[(Math.random()*3)|0];
      let outcome = "tie";
      if (playerPick !== masterPick) {
        const wins = { rock: "scissors", paper: "rock", scissors: "paper" };
        outcome = wins[playerPick] === masterPick ? "win" : "lose";
      }
      const emoji = { rock: "✊", paper: "✋", scissors: "✌️" };
      const ec = modal.querySelector(".event-card");
      ec.innerHTML = `
        <div class="event-name">じゃーんけーん…</div>
        <div style="font-size:48px;margin:14px 0;">
          <div style="display:inline-block;width:90px;text-align:center;">あなた<br>${emoji[playerPick]}</div>
          <div style="display:inline-block;width:90px;text-align:center;">マスター<br>${emoji[masterPick]}</div>
        </div>
        <div class="event-line" style="color:${outcome==='win'?'var(--good)':outcome==='tie'?'var(--accent)':'var(--bad)'};">
          ${outcome==='win'?'🎉 かち！ 10 ダメージ！':outcome==='tie'?'😐 あいこ！ 3 ダメージ':'😢 まけ… エナジー -1'}
        </div>
        <div class="event-buttons">
          <button class="btn huge cool" id="ev-ok">OK！</button>
        </div>`;
      tap(modal.querySelector("#ev-ok"), () => {
        closeModal(modal);
        onResolve({ playerPick, masterPick, outcome });
      });
    }
    tap(modal.querySelector("#j-rock"),  () => play("rock"));
    tap(modal.querySelector("#j-paper"), () => play("paper"));
    tap(modal.querySelector("#j-sci"),   () => play("scissors"));
  }

  function renderNinjaEvent(player, onResolve) {
    SND.unlock(); SND.sfxHit();
    const html = `
      <div class="event-rare">★ レアキャラ ★</div>
      <div class="event-name">にんじゃ 🥷</div>
      ${NINJA_SVG}
      <div class="event-line">「シュッ！しずかに ボスを いっげき！」</div>
      <div class="event-line" style="color:var(--good);">8 ダメージ！</div>
      <div class="event-buttons">
        <button class="btn huge good" id="ev-ok">サンキュー 🥷</button>
      </div>`;
    const modal = showModal(html);
    tap(modal.querySelector("#ev-ok"), () => { closeModal(modal); onResolve(); });
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
  // History buffers for de-duplicating phrase pickers — keep the last few
  // used so back-to-back duplicates don't happen on small pools.
  const _cheerHist = [];
  const _burnHist = [];
  function renderResult({ correct, energyEarned, cardsDrawn, question, chosen, player, boss, players }, onContinue) {
    show("result");
    const s = $("screen-result"); s.innerHTML = "";
    s.appendChild(el(buildHeader(boss, players, player)));
    // De-duped pickers so a 10-question battle doesn't surface the same
    // 5-line pool twice in a row.
    const pickFn = window.pickRandNoRepeat || ((arr, _h) => pickRand(arr));
    const cheer = correct
      ? pickFn(JP.correct_cheer || ["ナイス〜！"], _cheerHist, 3)
      : pickFn(JP.wrong_burn    || ["ボスが わらった"], _burnHist,  3);
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
    // Voice a mocking reaction on wrong answers using a line from the
    // boss's `hits` pool — that pool IS pre-rendered by the build
    // pipeline, unlike the locale's wrong_burn / correct_cheer pools.
    // (Tonally a "boss got hit" line is a stretch as a "kid got it
    // wrong" reaction, but they're typically goofy / mocking-ish so it
    // reads close enough.)
    if (!correct && boss && boss.id && Array.isArray(boss.hits) && boss.hits.length) {
      const line = boss.hits[(Math.random()*boss.hits.length)|0];
      setTimeout(() => SND.playBossLine(boss.id, line), 220);
    }
    // Speak the correct answer on wrong-answer to help kids who can't read it yet.
    if (!correct && question && question.options && typeof question.answer === "number") {
      const txt = question.options[question.answer];
      if (typeof txt === "string" && /[a-zA-Z]/.test(txt)) {
        setTimeout(() => SND.speak(txt), 350);
      }
    }
  }

  // -------- ACTION (now combined with target picker) --------
  // If hasAtk: show boss parts as direct attack targets + cards + end-turn link.
  // If no hasAtk: just cards + end-turn (after a wrong answer).
  // onAttack(target) is called with the same {kind, part/target} shape the old picker used.
  function renderAction(player, boss, players, onAttack, onCard, onEnd, extras) {
    show("action");
    const s = $("screen-action"); s.innerHTML = "";
    s.appendChild(el(buildHeader(boss, players, player)));
    const hasAtk = player.attackPower > 0;
    const isSpy = player.role === "spy";
    const ptarget = extras && extras.pronounceTarget;
    const speakHTML = (ptarget && SND.isSpeechSupported && SND.isSpeechSupported())
      ? `<button class="btn cool" id="speak-bonus" style="font-size:14px; min-height:44px; min-width:0; padding: 8px 14px; margin: 8px 0;">🎤 「${escapeHTML(ptarget)}」 を いって +2 ボーナス！</button>`
      : ``;
    // Boss taunt bubble — contextual line picked by game.js based on HP/combo/etc.
    const tauntText = extras && extras.taunt;
    if (tauntText) {
      // Voice the taunt as the bubble pops in
      if (boss && boss.id) SND.playBossLine(boss.id, tauntText);
      const stage = s.querySelector(".stage");
      if (stage) {
        const bubble = document.createElement("div");
        bubble.className = "boss-bubble taunt-bubble";
        bubble.innerHTML = furigana(tauntText);
        stage.appendChild(bubble);
      }
    }
    // Jinro mode: teammates and boss parts share the SAME unified target
    // grid so a spy's screen looks identical to a hero's screen. Tapping a
    // teammate fires "support" for heroes (+HP boost) or "sabotage" for spies
    // (damage) — game.js routes by role, the UI doesn't know which is which.
    const showTeammates = !!(extras && extras.jinro) && hasAtk;
    s.appendChild(el(`
      <div class="center" style="width:100%;">
        ${hasAtk ? `
          <h3>⚔️ こうげきパワー ${player.attackPower} ／ ⚡ ${player.energy}</h3>
          ${speakHTML}
          <div class="subtle">${showTeammates ? "こうげき または サポート する あいてを タップ！" : "こうげきしたい パーツを タップ！"}</div>
          <div class="parts-pick" id="parts"></div>
        ` : `
          <h3>ターンを おわるよ</h3>
          <div class="subtle">⚡ ${player.energy}</div>
        `}
        <h3 style="margin-top:14px; font-size:18px;">カード</h3>
        <div id="hand-area"></div>
        <button class="btn ${hasAtk?'ghost':'huge cool'}" id="end" style="margin-top:14px;${hasAtk?'font-size:14px;':''}">${JP.action_end} →</button>
      </div>
    `));
    const sb = $("speak-bonus");
    if (sb) tap(sb, () => {
      runSpeechChallenge(ptarget, (result) => { if (extras && extras.onSpeak) extras.onSpeak(result); });
    });
    if (hasAtk) {
      const partsEl = $("parts");
      boss.parts.forEach(p => {
        const dead = p.hp <= 0;
        const effLabel = effectLabel(p);
        const isCore = p.effect === "win";
        const cls = `part-btn ${dead?'dead':''} ${isCore?'core-btn':''}`;
        const icon = isCore ? "⭐ " : "";
        const node = el(`<button class="${cls}">
          <div class="pn">${icon}${p.name_jp}${isCore?' （よわてん）':''}</div>
          <div class="ph">${partHpDisplay(p)}</div>
          <div class="pe">${effLabel}</div>
        </button>`);
        if (!dead) tap(node, () => { SND.sfxSelect ? SND.sfxSelect() : SND.sfxPop(); onAttack({ kind: "boss-part", part: p }); });
        partsEl.appendChild(node);
      });
      // Teammate tiles in the SAME grid (jinro mode only). Identical styling
      // to part tiles — a spy can't visually distinguish their UI from a
      // hero's. Hero tap = support (+HP), spy tap = sabotage. game.js routes.
      if (showTeammates) {
        players.filter(pp => !pp.dead && pp.id !== player.id).forEach(teammate => {
          const node = el(`<button class="part-btn">
            <div class="pn">${teammate.avatar?teammate.avatar+' ':''}${escapeHTML(teammate.name)}</div>
            <div class="ph">なかま</div>
            <div class="pe">サポート / ?</div>
          </button>`);
          tap(node, () => { SND.sfxSelect ? SND.sfxSelect() : SND.sfxPop(); onAttack({ kind: "teammate", target: teammate }); });
          partsEl.appendChild(node);
        });
      }
    }
    tap($("end"), () => { SND.sfxConfirm ? SND.sfxConfirm() : SND.sfxPop(); onEnd(); });
    renderHandInto($("hand-area"), player, false, onCard);
  }

  // -------- PVP ACTION SCREEN --------
  // Shows the field of monsters (everyone's). Active player's monster is highlighted.
  // Tapping an opponent monster triggers onPickOpponent(opp); the game then drills
  // into that opponent's parts for the actual target choice.
  // Tracks which player's PvP turn theme has been auto-started, so a manual
  // mute via the 🎵 button isn't immediately reversed when the screen re-renders
  // (e.g., after canceling out of the target picker).
  let pvpThemePlayerId = null;

  function renderPvpAction(player, players, onPickOpponent, onCard, onEnd, extras) {
    show("action");
    const s = $("screen-action"); s.innerHTML = "";
    const hasAtk = player.attackPower > 0;
    const themePlaying = SND.isThemePlaying ? SND.isThemePlaying() : false;
    const isNewTurn = pvpThemePlayerId !== player.id;
    const ptarget = extras && extras.pronounceTarget;
    const speakHTML = (ptarget && SND.isSpeechSupported && SND.isSpeechSupported())
      ? `<button class="btn cool" id="speak-bonus" style="font-size:14px; min-height:44px; min-width:0; padding: 8px 14px; margin: 8px 0;">🎤 「${escapeHTML(ptarget)}」 を いって +2 ボーナス！</button>`
      : ``;
    s.appendChild(el(`
      <div class="center" style="width:100%; position:relative;">
        <button id="pvp-music" class="btn ghost" title="テーマソング ON/OFF"
                style="position:absolute; right:6px; top:0; padding:6px 10px; font-size:18px; min-height:0;">
          ${themePlaying ? '🎵' : '🔇'}
        </button>
        <h3 style="margin:6px 0;">${hasAtk?`⚔️ こうげきパワー ${player.attackPower}`:'こうげき できない'} ／ ⚡ ${player.energy}</h3>
        ${speakHTML}
        <div class="subtle">${hasAtk?'こうげきする モンスターを タップ！':'カードを つかうか ターンを おわってね'}</div>
        <div id="pvp-field" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; margin: 10px 0; max-width: 760px; width:100%;"></div>
        <h3 style="margin-top:14px; font-size:18px;">カード</h3>
        <div id="hand-area"></div>
        <button class="btn ${hasAtk?'ghost':'huge cool'}" id="end" style="margin-top:14px;${hasAtk?'font-size:14px;':''}">${JP.action_end} →</button>
      </div>`));
    const sb = $("speak-bonus");
    if (sb) tap(sb, () => {
      runSpeechChallenge(ptarget, (result) => { if (extras && extras.onSpeak) extras.onSpeak(result); });
    });
    // Start the active player's monster theme on loop on the first render of
    // their turn. On subsequent re-renders (e.g., after canceling out of the
    // target picker) we respect a prior manual mute — the kid sees 🔇 and can
    // re-enable.
    if (player.monster && player.monster.id && isNewTurn) {
      pvpThemePlayerId = player.id;
      SND.playTheme(player.monster.id, { loop: true, volume: 0.4, fadeIn: 500 });
      const b = $("pvp-music"); if (b) b.textContent = '🎵';
      // Catchphrase voice + brief toast — the monster "announces" itself when
      // the turn starts. No blocking overlay (would add 1.5s × players × rounds
      // of dead time per match), just audio + a passing toast.
      if (player.monster.catchphrase) {
        setTimeout(() => SND.playBossLine(player.monster.id, player.monster.catchphrase), 320);
      }
      toast(`🎤 ${player.monster.name_jp} のターン！`, 1600);
    }
    tap($("pvp-music"), () => {
      if (SND.isThemePlaying()) {
        SND.stopTheme(250);
        $("pvp-music").textContent = '🔇';
      } else if (player.monster && player.monster.id) {
        SND.playTheme(player.monster.id, { loop: true, volume: 0.4, fadeIn: 300 });
        $("pvp-music").textContent = '🎵';
      }
    });
    const field = $("pvp-field");
    players.forEach(pp => {
      const isSelf = pp.id === player.id;
      const isDead = pp.dead;
      const monster = pp.monster;
      const totalHp = monster ? monster.parts.reduce((s,part) => s + Math.max(0, part.hp), 0) : 0;
      const maxHp = monster ? monster.parts.reduce((s,part) => s + part.maxHP, 0) : 1;
      const core = monster ? monster.parts.find(x => x.effect === "win") : null;
      const coreHp = core ? Math.max(0, core.hp) : 0;
      const coreMax = core ? core.maxHP : 1;
      const corePct = coreMax > 0 ? Math.round((coreHp / coreMax) * 100) : 0;
      const tile = el(`
        <button class="part-btn ${isDead?'dead':''}" style="${isSelf?'border-color: var(--accent); background: linear-gradient(160deg, #5a3a00, #2a1500);':''}padding:8px;">
          <div class="pn" style="font-size:14px;color:${isSelf?'var(--accent)':'#fff'};">${pp.avatar?pp.avatar+' ':''}${escapeHTML(pp.name)}${isSelf?' (じぶん)':''}${isDead?' 💀':''}</div>
          <div style="height:90px;">${monster ? Monsters.renderBossSVG(monster) : ''}</div>
          <div class="ph" style="font-size:11px;">${monster ? escapeHTML(monster.name_jp) : ''}</div>
          ${monster ? `
            <div class="core-bar-row">
              <div class="core-bar-label">💎 コア</div>
              <div class="core-bar-track">
                <div class="core-bar-fill ${corePct<=20?'crit':corePct<=50?'warn':'ok'}" style="width:${corePct}%;"></div>
                <div class="core-bar-text">${coreHp}/${coreMax}</div>
              </div>
            </div>
            <div class="ph" style="font-size:10px; color:#aaa;">ぜんしん HP ${totalHp}/${maxHp}</div>
          ` : ''}
        </button>`);
      if (!isSelf && !isDead && hasAtk) {
        tap(tile, () => { SND.sfxSelect ? SND.sfxSelect() : SND.sfxPop(); onPickOpponent(pp); });
      }
      field.appendChild(tile);
    });
    tap($("end"), () => { SND.sfxConfirm ? SND.sfxConfirm() : SND.sfxPop(); onEnd(); });
    renderHandInto($("hand-area"), player, false, onCard);
  }

  // -------- TARGET PICKER --------
  // Unified target grid: boss parts + (in jinro mode) teammates in the same
  // grid for ALL roles. A spy's screen looks identical to a hero's. The
  // action that fires on a teammate tap is routed by role in game.js
  // (hero=support, spy=sabotage). Toasts are intentionally ambiguous.
  function renderTargetPicker(player, boss, players, onPick, onCancel) {
    show("action");
    const s = $("screen-action"); s.innerHTML = "";
    s.appendChild(el(buildHeader(boss, players, player)));
    // Jinro detection: any player has role "spy" → jinro mode is on.
    // (PvP players don't get "spy" role, so this is false there.)
    const jinroOn = (players || []).some(pp => pp.role === "spy");
    // Show a music toggle if a theme is currently playing (PvP turn music
    // started in renderPvpAction and persists into this screen). Hidden in
    // hero mode where no theme is running.
    const themePlaying = SND.isThemePlaying ? SND.isThemePlaying() : false;
    s.appendChild(el(`
      <div class="center" style="width:100%; position:relative;">
        ${themePlaying ? `<button id="tp-music" class="btn ghost" title="テーマソング ON/OFF"
                style="position:absolute; right:6px; top:0; padding:6px 10px; font-size:18px; min-height:0;">🎵</button>` : ``}
        <h3>${JP.pick_target}</h3>
        <div class="parts-pick" id="parts"></div>
        <button class="btn ghost" id="cancel">${JP.cancel}</button>
      </div>`));
    if (themePlaying) {
      tap($("tp-music"), () => {
        if (SND.isThemePlaying()) {
          SND.stopTheme(250);
          const b = $("tp-music"); if (b) b.textContent = '🔇';
        } else if (player.monster && player.monster.id) {
          SND.playTheme(player.monster.id, { loop: true, volume: 0.4, fadeIn: 300 });
          const b = $("tp-music"); if (b) b.textContent = '🎵';
        }
      });
    }
    const partsEl = $("parts");
    boss.parts.forEach(p => {
      const dead = p.hp <= 0;
      const effLabel = effectLabel(p);
      const isCore = p.effect === "win";
      const cls = `part-btn ${dead?'dead':''} ${isCore?'core-btn':''}`;
      const icon = isCore ? "⭐ " : "";
      const node = el(`<button class="${cls}">
        <div class="pn">${icon}${p.name_jp}${isCore?' （よわてん）':''}</div>
        <div class="ph">${partHpDisplay(p)}</div>
        <div class="pe">${effLabel}</div>
      </button>`);
      if (!dead) tap(node, () => { SND.sfxSelect ? SND.sfxSelect() : SND.sfxPop(); onPick({ kind: "boss-part", part: p }); });
      partsEl.appendChild(node);
    });
    if (jinroOn) {
      // Teammates appear in the same parts grid with identical styling.
      // Heroes get a support effect; spies sabotage. UI doesn't care.
      players.filter(pp => !pp.dead && pp.id !== player.id).forEach(teammate => {
        const node = el(`<button class="part-btn">
          <div class="pn">${teammate.avatar?teammate.avatar+' ':''}${escapeHTML(teammate.name)}</div>
          <div class="ph">なかま</div>
          <div class="pe">サポート / ?</div>
        </button>`);
        tap(node, () => { SND.sfxSelect ? SND.sfxSelect() : SND.sfxPop(); onPick({ kind: "teammate", target: teammate }); });
        partsEl.appendChild(node);
      });
    }
    tap($("cancel"), () => onCancel());
  }

  // Tiered text label for a part's HP — used in jinro mode during the round
  // when exact numbers are hidden. Lets kids see "is this nearly broken?"
  // without the precision a spy could exploit to track sabotage deltas.
  function partTierLabel(part) {
    if (!part) return "?";
    if (part.hp <= 0) return "こわれた 💀";
    const pct = part.hp / part.maxHP;
    if (pct >= 0.75) return "げんき 💪";
    if (pct >= 0.30) return "ヒビ ⚠️";
    return "こわれそう 💥";
  }
  function partHpDisplay(part) {
    const hidden = !!(window.Game && window.Game.isHpHidden && window.Game.isHpHidden());
    if (hidden) return partTierLabel(part);
    return `HP ${Math.max(0, part.hp)}/${part.maxHP}`;
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
    const headerLine = pickRand([boss.catchphrase, ...((boss.attacks && boss.attacks.length) ? boss.attacks : JP.boss_atk_words).map(a=>a.name)]);
    s.appendChild(el(`
      <div class="center" style="width:100%;">
        <h2>${JP.boss_turn(boss.name_jp)} 👹</h2>
        <div class="boss-bubble" style="position:static;display:inline-block;margin:12px;">${headerLine}</div>
        <div id="log" style="font-size:18px; margin: 12px auto; line-height:1.6; max-width:600px; max-height: 30vh; overflow-y: auto;"></div>
        <button class="btn huge cool" id="cont">${JP.next}</button>
      </div>`));
    const logEl = $("log");
    log.forEach(line => {
      const p = el(`<div>${line}</div>`);
      logEl.appendChild(p);
    });
    SND.sfxBoss();
    // Voice the header line so the boss-turn screen has audible presence
    if (boss && boss.id && headerLine) SND.playBossLine(boss.id, headerLine);
    tap($("cont"), () => { SND.stopBossVoice(); onContinue(); });
  }

  // -------- VICTORY / DEFEAT --------
  // Build a tiny end-of-battle recap. Returns an HTML string: lists English
  // words the kid got right (de-duped, capped) and missed (de-duped, capped).
  function buildRecap(stats) {
    if (!stats) return "";
    const dedupe = (arr) => Array.from(new Set((arr||[]).filter(Boolean)));
    const right = dedupe(stats.right);
    const wrong = dedupe(stats.wrong);
    const totalAns = (stats.right || []).length + (stats.wrong || []).length;
    const accuracyPct = totalAns > 0 ? Math.round(((stats.right||[]).length / totalAns) * 100) : 0;
    const elapsedSec = stats.startedAt ? Math.max(0, Math.round((Date.now() - stats.startedAt) / 1000)) : 0;
    const elapsedTxt = elapsedSec >= 60 ? `${Math.floor(elapsedSec/60)}:${String(elapsedSec%60).padStart(2,'0')}` : `${elapsedSec}s`;
    // Broadcast scorecard — TV-style stat block at the top of the recap.
    const scorecard = (totalAns > 0 || stats.biggestHit > 0) ? `
      <div class="match-scorecard">
        <div class="scorecard-title">📺 MATCH STATS</div>
        <div class="scorecard-grid">
          ${stats.biggestHit > 0 ? `<div class="scorecard-stat"><div class="scorecard-stat-label">BIGGEST HIT</div><div class="scorecard-stat-val">${stats.biggestHit}<span style="font-size:14px;"> dmg</span></div>${stats.biggestHitBy ? `<div class="scorecard-stat-by">${escapeHTML(stats.biggestHitBy)}</div>` : ''}</div>` : ''}
          ${totalAns > 0 ? `<div class="scorecard-stat"><div class="scorecard-stat-label">ACCURACY</div><div class="scorecard-stat-val">${accuracyPct}<span style="font-size:14px;">%</span></div><div class="scorecard-stat-by">${(stats.right||[]).length}/${totalAns} もんだい</div></div>` : ''}
          ${elapsedSec > 0 ? `<div class="scorecard-stat"><div class="scorecard-stat-label">TIME</div><div class="scorecard-stat-val">${elapsedTxt}</div></div>` : ''}
        </div>
      </div>` : "";
    if (!right.length && !wrong.length && !scorecard) return "";
    const cap = (arr, n=8) => arr.length > n ? arr.slice(0, n).concat([`+${arr.length-n}`]) : arr;
    const rightLine = right.length ? `<div style="margin:6px 0;"><span style="color:var(--good); font-weight:900;">🎯 おぼえた:</span> ${cap(right).map(escapeHTML).join(", ")}</div>` : "";
    const wrongLine = wrong.length ? `<div style="margin:6px 0;"><span style="color:var(--bad); font-weight:900;">🔁 ふくしゅう:</span> ${cap(wrong).map(escapeHTML).join(", ")}</div>` : "";
    return `
      ${scorecard}
      ${(rightLine || wrongLine) ? `<div style="background:var(--card); border-radius:12px; padding:12px 14px; margin: 14px auto; max-width: 520px; font-size: 16px; text-align:left; line-height:1.6;">
        <div style="font-size:14px; color:var(--accent); font-weight:900; margin-bottom:4px;">▶ きょうの ことば</div>
        ${rightLine}
        ${wrongLine}
      </div>` : ''}`;
  }

  function renderVictory({ players, jinro, spyWins, mode, winner, boss, stats, firstDefeat, unlockedCardId }, onAgain, onTitle) {
    show("victory");
    const s = $("screen-victory"); s.innerHTML = "";
    SND.sfxVictory();
    let title = JP.victory;
    if (mode === "pvp" && winner) title = JP.pvp_winner(winner.name);
    else if (jinro && spyWins) title = JP.spy_wins;
    else if (jinro && !spyWins) title = JP.hero_wins;
    const winnerMonster = mode === "pvp" && winner && winner.monster
      ? `<div style="height:200px; max-width:340px; margin: 8px auto;">${Monsters.renderBossSVG(winner.monster)}</div>
         <div style="color:var(--accent); font-size:18px; font-weight:900;">${escapeHTML(winner.monster.name_jp)}</div>` : "";
    // PvP: the champion monster's evil goal is now reality
    let endingHTML = "";
    if (mode === "pvp" && winner && winner.monster && window.Endings && Endings.exists(winner.monster.id)) {
      const e = Endings.render(winner.monster.id);
      if (e) {
        endingHTML = `
          <div style="background:#000; border:3px solid var(--accent); border-radius:14px; padding:6px; margin: 14px auto; max-width: 760px;">
            <div style="font-size:14px; letter-spacing:4px; color:var(--accent); padding:6px;">★ THIS IS THE WORLD NOW ★</div>
            <div style="line-height:0;">${e.svg}</div>
            <div style="font-size:18px; font-weight:900; color:#fff; padding:10px 6px;">${escapeHTML(e.captionJp)}</div>
          </div>`;
      }
    }
    // Card-unlock banner — first time this boss has been defeated.
    let unlockBanner = "";
    if (unlockedCardId && Cards.byId) {
      const c = Cards.byId(unlockedCardId);
      if (c) unlockBanner = `
        <div style="background: linear-gradient(135deg, var(--accent), #ff8800); color:#2a1500; border-radius:14px; padding:14px 18px; margin: 14px auto; max-width: 520px; box-shadow: var(--shadow); font-weight:900;">
          <div style="font-size:14px; letter-spacing:4px;">🎁 NEW CARD UNLOCKED!</div>
          <div style="font-size:24px; margin-top:4px;">${c.icon} ${escapeHTML(c.name_jp)}</div>
          <div style="font-size:14px; font-weight:700; opacity:.85;">${escapeHTML(c.text_jp)}</div>
        </div>`;
    } else if (firstDefeat && boss && boss.name_jp) {
      unlockBanner = `
        <div style="background: var(--card); color:#fff; border:2px solid var(--accent); border-radius:14px; padding:10px 14px; margin: 12px auto; max-width: 520px;">
          📖 ずかんに <b>${escapeHTML(boss.name_jp)}</b> を ろくおん！
        </div>`;
    }
    s.appendChild(el(`
      <div class="center" style="margin-top:6vh; position:relative;">
        <div class="confetti-layer" id="vc-confetti" style="position:absolute; inset:0;"></div>
        <h1 class="pop">${title} 🎉</h1>
        <div style="font-size:100px;" class="bob">🏆</div>
        ${winnerMonster}
        <div style="font-size:22px;color:var(--good);">${mode==='pvp'?'チャンピオン！':JP.victory_sub}</div>
        ${endingHTML}
        ${unlockBanner}
        <div style="margin-top:18px;">
          ${players.map(p => `<div>${p.avatar?p.avatar+' ':''}${p.name}${p.dead?' 💀':''} ${p.role==='spy'?'🕵️':''}${p.bestCombo>=3?` 🔥 さいこう ×${p.bestCombo}`:''}</div>`).join("")}
        </div>
        ${buildRecap(stats)}
        <div class="row" style="margin-top:24px;">
          <button class="btn huge good" id="again">${JP.play_again}</button>
          <button class="btn ghost" id="title">${JP.back_to_title}</button>
        </div>
      </div>`));
    spawnConfetti(s.querySelector("#vc-confetti"), 30);
    // Theme picks: PvP → champion's monster theme; hero → defeated boss's theme.
    const themeId = (mode === "pvp" && winner && winner.monster) ? winner.monster.id
                  : (boss && boss.id) ? boss.id : null;
    if (themeId) SND.playTheme(themeId, { loop: true, volume: 0.55, fadeIn: 800 });
    // Defeated boss says one last grumble — pulls from boss.hits (which
    // IS pre-rendered). Hero-mode only — PvP champion already had their
    // winning trash-talk during the K.O. cinematic.
    if (mode !== "pvp" && boss && boss.id && Array.isArray(boss.hits) && boss.hits.length) {
      const line = boss.hits[(Math.random()*boss.hits.length)|0];
      setTimeout(() => SND.playBossLine(boss.id, line), 1100);
    }
    tap($("again"), () => { SND.stopTheme(400); onAgain(); });
    tap($("title"), () => { SND.stopTheme(400); onTitle(); });
  }

  function renderDefeat({ players, jinro, spyWins, boss, stats }, onAgain, onTitle) {
    show("defeat");
    const s = $("screen-defeat"); s.innerHTML = "";
    SND.sfxDefeat();
    let title = JP.defeat;
    if (jinro && spyWins) title = JP.spy_wins;
    // Boss-victory ending picture: dystopian scene depicting the boss's evil
    // goal achieved (built from their backstory ambition).
    let endingHTML = "";
    if (boss && boss.id && window.Endings && Endings.exists(boss.id)) {
      const e = Endings.render(boss.id);
      if (e) {
        endingHTML = `
          <div style="background:#000; border:3px solid var(--bad); border-radius:14px; padding:6px; margin: 14px auto; max-width: 760px;">
            <div style="font-size:14px; letter-spacing:4px; color:var(--bad); padding:6px;">★ EVIL ENDING ★ ${escapeHTML(boss.name_jp||"")}</div>
            <div style="line-height:0;">${e.svg}</div>
            <div style="font-size:18px; font-weight:900; color:#fff; padding:10px 6px;">${escapeHTML(e.captionJp)}</div>
          </div>`;
      }
    }
    // CINEMATIC DEFEAT — multi-stage opener before the static recap loads.
    // Stage 0 (0–700ms):    Black screen + ROAR text + boss-line voice
    // Stage 1 (700–2100ms): Boss SVG looms huge, fades to red
    // Stage 2 (2100–3500ms):"TOKYO HAS FALLEN..." typography flash
    // Stage 3 (3500ms+):    The actual static recap content slides in
    const cinematic = document.createElement("div");
    cinematic.className = "defeat-cinematic";
    cinematic.innerHTML = `
      <div class="defeat-curtain"></div>
      <div class="defeat-stage" id="def-stage" style="opacity:0;"></div>
      <div class="defeat-headline" id="def-headline" style="opacity:0;">${title}</div>
      <div class="defeat-tagline" id="def-tagline" style="opacity:0;">— TOKYO HAS FALLEN —</div>
    `;
    s.appendChild(cinematic);
    // Stage 0: instant ROAR + sfx + voice. Use catchphrase (always
    // pre-rendered) — boss_taunts pool entries 404 because the build
    // pipeline doesn't render those.
    if (boss && boss.id && boss.catchphrase) {
      setTimeout(() => SND.playBossLine(boss.id, boss.catchphrase), 320);
    }
    // Stage 1 — looming boss
    setTimeout(() => {
      const stage = cinematic.querySelector("#def-stage");
      if (stage && boss) {
        stage.innerHTML = Monsters.renderBossSVG(boss);
        stage.style.opacity = "1";
        stage.animate(
          [
            { transform: "scale(0.4)", filter: "brightness(0.4) drop-shadow(0 0 6px #ff3b6b)" },
            { transform: "scale(1.0)", filter: "brightness(1.0) drop-shadow(0 0 30px #ff3b6b)" }
          ],
          { duration: 1200, easing: "cubic-bezier(.18,.89,.32,1.28)", fill: "forwards" }
        );
      }
    }, 700);
    // Stage 2 — headline + tagline slide in
    setTimeout(() => {
      const h = cinematic.querySelector("#def-headline");
      const t = cinematic.querySelector("#def-tagline");
      if (h) {
        h.style.opacity = "1";
        h.animate(
          [
            { transform: "translate(-50%, -50%) scale(0) rotate(-12deg)", opacity: 0 },
            { transform: "translate(-50%, -50%) scale(1.2) rotate(4deg)",  opacity: 1, offset: 0.6 },
            { transform: "translate(-50%, -50%) scale(1) rotate(0)",        opacity: 1 }
          ],
          { duration: 700, easing: "cubic-bezier(.18,.89,.32,1.28)", fill: "forwards" }
        );
      }
      if (t) {
        setTimeout(() => {
          t.style.opacity = "1";
          t.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, fill: "forwards" });
        }, 600);
      }
    }, 2100);
    // The boss's theme drones in heavy.
    if (boss && boss.id) SND.playTheme(boss.id, { loop: true, volume: 0.55, fadeIn: 1500 });
    // Stage 3 — recap + buttons (after cinematic finishes settling).
    setTimeout(() => {
      // Slide the cinematic up + reveal recap content beneath.
      cinematic.classList.add("defeat-cinematic-shrunk");
      const recap = el(`
        <div class="center defeat-body" style="margin-top:2vh; animation: fade-in .4s ease;">
          ${endingHTML}
          <div style="font-size:22px;color:var(--bad);">${JP.defeat_sub}</div>
          <div style="margin-top:18px;">
            ${players.map(p => `<div>${p.avatar?p.avatar+' ':''}${p.name}: HP ${p.hp} ${p.role==='spy'?'🕵️':''}${p.bestCombo>=3?` 🔥 さいこう ×${p.bestCombo}`:''}</div>`).join("")}
          </div>
          ${buildRecap(stats)}
          <div class="row" style="margin-top:22px;">
            <button class="btn huge bad" id="again">${JP.play_again}</button>
            <button class="btn ghost" id="title">${JP.back_to_title}</button>
          </div>
        </div>
      `);
      s.appendChild(recap);
      tap($("again"), () => { SND.stopTheme(400); onAgain(); });
      tap($("title"), () => { SND.stopTheme(400); onTitle(); });
    }, 3500);
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
    const ragedClass = boss && boss.raged ? " raged" : "";
    // PvP detection: any player has a .monster set means we're monster-vs-
    // monster. Player HP is meaningless there (no boss attacks the kid),
    // so we display the monster's CORE HP in its place — gives kids the same
    // "am I about to die?" glance value, but on the stat that actually matters.
    const isPvp = (players || []).some(p => p && p.monster);
    // Jinro stealth: hide per-player HP during the round so the team can't
    // diff-detect a sabotage. Revealed at boss-turn recap.
    const hpHidden = !!(window.Game && window.Game.isHpHidden && window.Game.isHpHidden());
    const playerTiles = (players||[]).map(p => {
      if (isPvp && p.monster) {
        const core = p.monster.parts.find(x => x.effect === "win");
        const coreHp = core ? Math.max(0, core.hp) : 0;
        const coreMax = core ? core.maxHP : 1;
        const corePct = coreMax > 0 ? coreHp / coreMax : 0;
        const lowCore = !p.dead && corePct <= 0.3;
        return `
        <div class="player ${currentPlayer && p.id===currentPlayer.id?'active':''} ${p.dead?'dead':''} ${lowCore?'low-hp':''}">
          <div class="name">${p.avatar?p.avatar+' ':''}${escapeHTML(p.name)}</div>
          <div class="hp ${corePct<=0.2?'low':''}">💎 ${coreHp}/${coreMax}</div>
          <div class="energy">⚡ ${p.energy} 🎴 ${p.hand?p.hand.length:0}${p.combo>=2?` 🔥×${p.combo}`:''}</div>
        </div>`;
      }
      const lowHp = !p.dead && p.maxHp && p.hp <= p.maxHp * 0.3;
      const hpDisplay = (hpHidden && !p.dead) ? "❤️ ?" : `❤️ ${p.hp}`;
      return `
      <div class="player ${currentPlayer && p.id===currentPlayer.id?'active':''} ${p.dead?'dead':''} ${(lowHp && !hpHidden)?'low-hp':''}">
        <div class="name">${p.avatar?p.avatar+' ':''}${escapeHTML(p.name)}</div>
        <div class="hp ${(!hpHidden && p.hp<=5)?'low':''}">${hpDisplay}</div>
        <div class="energy">⚡ ${p.energy} 🎴 ${p.hand?p.hand.length:0}${p.combo>=2?` 🔥×${p.combo}`:''}</div>
      </div>`;
    }).join("");
    // Boss core HP bar (hero mode). Mirrors the PvP per-tile core bar so
    // kids have one constant "is the boss about to die?" glance signal,
    // independent of the parts grid. Hidden if hpHidden (jinro round) —
    // shows a tier label instead.
    let bossCoreBar = "";
    if (boss && boss.parts) {
      const core = boss.parts.find(x => x.effect === "win");
      if (core) {
        const ch = Math.max(0, core.hp), cm = core.maxHP || 1;
        const pct = cm > 0 ? Math.round((ch / cm) * 100) : 0;
        const cls = pct <= 20 ? 'crit' : pct <= 50 ? 'warn' : 'ok';
        const text = hpHidden ? partTierLabel(core) : `${ch}/${cm}`;
        bossCoreBar = `
          <div class="core-bar-row" style="margin: 4px 8px;">
            <div class="core-bar-label">💎 ${escapeHTML(boss.name_jp || "ボス")}</div>
            <div class="core-bar-track">
              <div class="core-bar-fill ${cls}" style="width:${hpHidden?100:pct}%; ${hpHidden?'opacity:0.5;':''}"></div>
              <div class="core-bar-text">${text}</div>
            </div>
          </div>`;
      }
    }
    return `
      <div class="header-wrap">
        ${bossCoreBar}
        <div class="stage${ragedClass}">${svg}</div>
        <div class="boss-name">${boss ? `${boss.name_jp}${boss.raged?' 😡':''}` : ""}</div>
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
        // Long-press (≥500ms) opens a big-card preview modal so kids can read
        // what the card does without committing to play. Movement during the
        // hold cancels (treated as a scroll).
        attachLongPress(node, 500, () => showCardPreview(c));
        hand.appendChild(node);
      });
    }
    container.appendChild(hand);
  }

  // Long-press detector for any element. Cancels on move > a few px or on
  // pointerup before duration. Fires onLongPress() once.
  function attachLongPress(elNode, durationMs, onLongPress) {
    let timer = null;
    let startX = 0, startY = 0;
    let cancelled = false;
    function clear() { if (timer) { clearTimeout(timer); timer = null; } }
    elNode.addEventListener("pointerdown", (e) => {
      cancelled = false;
      startX = e.clientX; startY = e.clientY;
      clear();
      timer = setTimeout(() => {
        if (!cancelled) onLongPress();
      }, durationMs);
    }, { passive: true });
    elNode.addEventListener("pointermove", (e) => {
      if (Math.abs(e.clientX - startX) > 8 || Math.abs(e.clientY - startY) > 8) {
        cancelled = true; clear();
      }
    }, { passive: true });
    elNode.addEventListener("pointerup",     () => { cancelled = true; clear(); }, { passive: true });
    elNode.addEventListener("pointercancel", () => { cancelled = true; clear(); }, { passive: true });
    elNode.addEventListener("pointerleave",  () => { cancelled = true; clear(); }, { passive: true });
  }

  // Big card preview modal — tap outside to dismiss. Cards in hand can be
  // long-pressed to see this; useful for new players figuring out what a
  // card does before committing to play it.
  function showCardPreview(card) {
    if (!card) return;
    const overlay = document.createElement("div");
    overlay.className = "card-preview-overlay";
    overlay.innerHTML = `
      <div class="card-preview">
        <div class="card-preview-icon">${card.icon||"🎴"}</div>
        <div class="card-preview-name">${escapeHTML(card.name_jp||card.id||"")}</div>
        <div class="card-preview-text">${escapeHTML(card.text_jp||"")}</div>
        <div class="card-preview-cost">⚡ コスト: ${card.cost ?? 0}</div>
        <div class="card-preview-hint">タップで とじる</div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector(".card-preview").animate(
      [
        { transform: "scale(0.6) translateY(20px)", opacity: 0 },
        { transform: "scale(1) translateY(0)", opacity: 1 }
      ],
      { duration: 220, easing: "cubic-bezier(.18,.89,.32,1.28)", fill: "forwards" }
    );
    tap(overlay, () => overlay.remove());
  }

  // True if two strings differ by at most one edit (insert / delete / substitute).
  // Used by spelling mode to forgive a single typo at ★1 questions for younger kids.
  function levenshtein1(a, b) {
    if (a === b) return true;
    const la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1) return false;
    let i = 0, j = 0, edits = 0;
    while (i < la && j < lb) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++edits > 1) return false;
      if (la === lb) { i++; j++; }       // substitution
      else if (la > lb) { i++; }          // delete from a
      else { j++; }                       // insert into a
    }
    if (i < la || j < lb) edits++;
    return edits <= 1;
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
        <div style="font-size:12px; color:#aaa; margin-top:14px; line-height:1.5; text-align:center;">
          ボスの こえ: VOICEVOX 提供<br>
          ずんだもん／春日部つむぎ／玄野武宏／冥鳴ひまり／白上虎太郎／青山龍星
        </div>
        <button class="btn huge cool" id="back-rules" style="margin-top:18px;">${JP.back}</button>
      </div>`));
    tap($("back-rules"), () => onBack());
  }

  // -------- COMPENDIUM (📖 ずかん) --------
  // Grid of all 6 bosses. Defeated bosses show full art + name + tap-for-details.
  // Undefeated bosses are silhouetted with "?".
  function showCompendium(onBack) {
    show("title");
    const s = $("screen-title"); s.innerHTML = "";
    const factories = Monsters.listFactories();
    const total = factories.length;
    const defeatedCount = (window.Progress && Progress.totalDefeated()) || 0;
    s.appendChild(el(`
      <div class="center" style="max-width: 760px; margin: 18px auto; padding: 0 12px;">
        <h2>📖 カイジュウ ずかん</h2>
        <div class="subtle" style="margin-bottom:8px;">${defeatedCount} / ${total} たおした</div>
        <div id="cmp-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px;"></div>
        <button class="btn huge cool" id="cmp-back" style="margin-top:18px;">${JP.back}</button>
      </div>`));
    const grid = $("cmp-grid");
    factories.forEach((factory) => {
      const sample = factory();
      const defeated = window.Progress && Progress.isDefeated(sample.id);
      const tile = el(`
        <button class="part-btn" style="padding:8px;${defeated?'border-color:var(--accent);':'opacity:.7;'}">
          <div style="height:130px; ${defeated?'':'filter: brightness(0) opacity(0.55);'}">${Monsters.renderBossSVG(sample)}</div>
          <div class="pn" style="font-size:14px;color:${defeated?'var(--accent)':'#888'};">
            ${defeated ? escapeHTML(sample.name_jp) : "？？？"}
          </div>
          <div class="pe" style="font-size:11px;">
            ${defeated ? "タップで しょうかい" : "🔒 まだ"}
          </div>
        </button>`);
      if (defeated) {
        tap(tile, () => showCompendiumEntry(sample, () => showCompendium(onBack)));
      }
      grid.appendChild(tile);
    });
    tap($("cmp-back"), () => { SND.stopTheme(300); onBack(); });
  }

  // Detail screen for a single defeated boss (read-only version of the boss
  // intro). Shows backstory + plays theme on loop while open.
  function showCompendiumEntry(boss, onBack) {
    show("title");
    const s = $("screen-title"); s.innerHTML = "";
    const story = furigana(boss.backstory || "");
    s.appendChild(el(`
      <div class="center" style="max-width: 720px; margin: 12px auto; padding: 0 12px;">
        <div class="subtle" style="color:var(--accent); letter-spacing:4px;">★ ずかん ★</div>
        <h2 style="margin: 4px 0; color: var(--accent);">${escapeHTML(boss.name_jp)}</h2>
        <div class="subtle" style="font-size: 13px; opacity: .7;">${escapeHTML(boss.name_en||"")}</div>
        <div class="stage" style="height:240px; max-width:520px; margin: 8px auto;">${Monsters.renderBossSVG(boss)}</div>
        <div style="background:var(--card); border-radius:14px; padding:18px; box-shadow:var(--shadow); text-align:left; max-width:520px; margin: 0 auto; line-height: 2.2;">
          <div style="font-size:14px; color:var(--accent); font-weight:900; margin-bottom:6px;">▶ ストーリー</div>
          <div style="font-size:16px; white-space: pre-line;">${story}</div>
        </div>
        <button class="btn huge cool" id="cmp-back2" style="margin-top:18px;">${JP.back}</button>
      </div>`));
    SND.playTheme(boss.id, { loop: true, volume: 0.5, fadeIn: 600 });
    // Voice the catchphrase only — backstory text is read silently under the theme.
    if (boss.catchphrase) SND.playBossLine(boss.id, boss.catchphrase);
    tap($("cmp-back2"), () => { SND.stopBossVoice(); SND.stopTheme(400); onBack(); });
  }

  return { renderTitle, renderSetup, renderPass, renderRole, renderWager, renderQuestion,
           renderResult, renderAction, renderTargetPicker, renderBoss, renderVictory,
           renderDefeat, renderVote, renderDefenseQ, toast, show, showRules, tap,
           confirmModal,
           renderFairyEvent, renderBombEvent, renderThiefEvent,
           renderRushEvent, renderGamblerEvent, renderJankenEvent, renderNinjaEvent,
           renderBossIntro, showSlingshot, showMonsterAttackPicker, showBossAttackAnim,
           renderMonsterPick, renderPvpAction, renderPrivateScan, showRareEventIntro,
           showMatchTitleCard, renderBossPickerMap,
           showRoundIntro, showRageIntro, showPhase2Intro, showKO, showFightStinger, spawnConfetti,
           showComboSplash, showFirstBloodSplash, showPartDestroyedSplash, showSpeechBonusSplash,
           showCompendium, runSpeechChallenge,
           menuModal, showPvpFaceoff, showCliffhanger };
})();
