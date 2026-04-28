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
    const names = ["","","","","",""];
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
        const inp = el(`<input class="player-input" maxlength="10" placeholder="${JP.player_n(i+1)}" value="${names[i]||""}"/>`);
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
        onConfirm({ count, level, levels: finalLevels, jinro: jinro && count >= 4, names: finalNames });
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

    s.appendChild(el(`
      <div class="question-card">
        <div class="stars">${stars}</div>
        <div class="question-prompt-jp">${question.prompt_jp}</div>
        ${displayPrompt}
        <div class="options" id="opts"></div>
        ${question.audio ? `<div class="row" style="margin-top:12px;"><button class="btn ghost" id="say-again">🔊 もういっかい</button></div>` : ``}
      </div>
    `));
    const optsEl = $("opts");
    question.options.forEach((opt, i) => {
      const disabled = i === masked;
      const o = el(`<div class="opt ${disabled?'disabled':''}" data-i="${i}">${escapeHTML(opt)}</div>`);
      if (!disabled) {
        tap(o, () => {
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
      const node = el(`<button class="part-btn ${dead?'dead':''}">
        <div class="pn">${p.name_jp}</div>
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
           renderDefeat, renderVote, toast, show, showRules, tap };
})();
