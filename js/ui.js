// All DOM rendering. Game logic calls these and provides callbacks.
window.UI = (() => {
  const SCREENS = ["title","setup","pass","role","wager","question","result","action","boss","victory","defeat","vote"];
  function $(id) { return document.getElementById(id); }
  function show(name) {
    SCREENS.forEach(n => { const el = $("screen-"+n); if (el) el.classList.toggle("hidden", n !== name); });
    window.scrollTo(0,0);
  }
  function el(html) { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }
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
        <div class="subtle" style="margin-top: 28px;">タップで おとが でます 🔊</div>
      </div>`));
    $("btn-start").onclick = () => { SND.unlock(); SND.sfxPop(); onStart(); };
  }

  // -------- SETUP --------
  function renderSetup({ onConfirm }) {
    show("setup");
    clear("setup");
    const s = $("screen-setup");
    let count = 3;
    let level = 2;
    let jinro = false;
    const names = ["","","","","",""];

    function redraw() {
      s.innerHTML = "";
      s.appendChild(el(`
        <div class="center" style="width:100%;">
          <h2>${JP.setup_title}</h2>
          <div class="subtle">${JP.player_count}</div>
          <div class="row" id="count-row"></div>
          <div class="subtle" style="margin-top:12px;">${JP.level}</div>
          <div class="row" id="lvl-row"></div>
          <div class="row" id="names-row"></div>
          <div class="subtle" style="margin-top:12px;">${JP.jinro_hint}</div>
          <div class="row"><button class="toggle ${jinro?'on':''}" id="jinro-toggle">${jinro?JP.jinro_on:JP.jinro_off}</button></div>
          <div class="row" style="margin-top:24px;">
            <button class="btn huge good" id="go">${JP.start_battle} 🚀</button>
            <button class="btn ghost" id="back">${JP.back}</button>
          </div>
        </div>
      `));
      const cr = $("count-row");
      [2,3,4,5,6].forEach(n => {
        const b = el(`<button class="toggle ${count===n?'on':''}">${n}</button>`);
        b.onclick = () => { count = n; redraw(); };
        cr.appendChild(b);
      });
      const lr = $("lvl-row");
      [[1,JP.level1],[2,JP.level2],[3,JP.level3]].forEach(([n, lbl]) => {
        const b = el(`<button class="toggle ${level===n?'on':''}" style="font-size:14px;">${lbl}</button>`);
        b.onclick = () => { level = n; redraw(); };
        lr.appendChild(b);
      });
      const nr = $("names-row");
      for (let i = 0; i < count; i++) {
        const inp = el(`<input class="player-input" maxlength="8" placeholder="${JP.player_n(i+1)}" value="${names[i]||""}"/>`);
        inp.oninput = (e) => { names[i] = e.target.value; };
        nr.appendChild(inp);
      }
      $("jinro-toggle").onclick = () => { jinro = !jinro; redraw(); };
      $("go").onclick = () => {
        const finalNames = names.slice(0, count).map((n,i)=> n.trim() || JP.player_n(i+1));
        SND.sfxPop();
        onConfirm({ count, level, jinro: jinro && count >= 4, names: finalNames });
      };
      $("back").onclick = () => location.reload();
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
    $("ready").onclick = () => { SND.sfxPop(); onReady(); };
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
    $("ok").onclick = () => onDone();
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
    s.querySelectorAll(".wager-btn").forEach(b => b.onclick = () => {
      SND.sfxPop();
      onPick(parseInt(b.dataset.stars,10));
    });
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
        o.onclick = () => {
          const correct = i === question.answer;
          o.classList.add(correct ? "right" : "wrong");
          if (!correct) {
            // Reveal correct
            const right = optsEl.querySelector(`[data-i="${question.answer}"]`);
            if (right) right.classList.add("right");
          }
          // Disable all
          optsEl.querySelectorAll(".opt").forEach(x => x.classList.add("disabled"));
          if (correct) SND.sfxCorrect(); else SND.sfxWrong();
          setTimeout(() => onAnswer(correct, i), 850);
        };
      }
      optsEl.appendChild(o);
    });

    if (question.audio) {
      const speak = () => SND.speak(question.audio);
      const lb = $("listen-btn"); if (lb) lb.onclick = speak;
      const sa = $("say-again"); if (sa) sa.onclick = speak;
      // Auto-speak after a tick if listen-only
      if (!question.prompt && !question.promptImage) {
        setTimeout(speak, 350);
      }
    }
  }

  // -------- RESULT --------
  function renderResult({ correct, energyEarned, cardsDrawn, dmgPreview, player, boss, players }, onContinue) {
    show("result");
    const s = $("screen-result"); s.innerHTML = "";
    s.appendChild(el(buildHeader(boss, players, player)));
    const cheer = correct ? pickRand(JP.correct_cheer) : pickRand(JP.wrong_burn);
    s.appendChild(el(`
      <div class="center" style="width:100%;">
        <h2 class="${correct?'pop':''}">${correct?JP.correct:JP.wrong}</h2>
        <div style="font-size:28px;color:${correct?'var(--good)':'var(--bad)'};margin: 6px 0;">${cheer}</div>
        ${correct ? `
          <div style="font-size:22px;">${JP.earned_energy(energyEarned)}</div>
          <div style="font-size:22px;">${JP.draw_card(cardsDrawn)}</div>
        ` : `
          <div style="font-size:80px;">😝</div>
        `}
        <button class="btn huge ${correct?'good':'ghost'}" id="cont">${JP.next}</button>
      </div>`));
    $("cont").onclick = () => onContinue();
  }

  // -------- ACTION (attack / cards) --------
  function renderAction(player, boss, players, onAttack, onCard, onEnd) {
    show("action");
    const s = $("screen-action"); s.innerHTML = "";
    s.appendChild(el(buildHeader(boss, players, player)));
    s.appendChild(el(`
      <div class="center" style="width:100%;">
        <h3>${JP.action_title}</h3>
        <div class="subtle">エナジー ${player.energy} / こうげきパワー ${player.attackPower || 0}</div>
        <div class="row">
          <button class="btn big hot" id="atk" ${player.attackPower>0?"":"disabled style='opacity:.45'"}>${JP.action_attack} ⚔️</button>
          <button class="btn big ghost" id="end">${JP.action_end}</button>
        </div>
        <h3 style="margin-top:16px;">カード</h3>
        <div id="hand-area"></div>
      </div>
    `));
    $("atk").onclick = () => { if (player.attackPower>0) onAttack(); };
    $("end").onclick = () => { SND.sfxPop(); onEnd(); };
    renderHandInto($("hand-area"), player, false, onCard);
  }

  // -------- TARGET PICKER --------
  function renderTargetPicker(player, boss, players, onPick, onCancel) {
    show("action");
    const s = $("screen-action"); s.innerHTML = "";
    s.appendChild(el(buildHeader(boss, players, player)));
    s.appendChild(el(`
      <div class="center" style="width:100%;">
        <h3>${JP.pick_target}</h3>
        <div class="parts-pick" id="parts"></div>
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
      if (!dead) node.onclick = () => { SND.sfxPop(); onPick(p); };
      partsEl.appendChild(node);
    });
    $("cancel").onclick = () => onCancel();
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
        <div id="log" style="font-size:20px; margin: 12px; line-height:1.6; max-width:600px;"></div>
        <button class="btn huge cool" id="cont">${JP.next}</button>
      </div>`));
    const logEl = $("log");
    log.forEach(line => {
      const p = el(`<div>${line}</div>`);
      logEl.appendChild(p);
    });
    SND.sfxBoss();
    $("cont").onclick = () => onContinue();
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
    $("again").onclick = () => onAgain();
    $("title").onclick = () => onTitle();
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
    $("again").onclick = () => onAgain();
    $("title").onclick = () => onTitle();
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
      b.onclick = () => onVote(p);
      vr.appendChild(b);
    });
    $("skip").onclick = () => onSkip();
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
      <div class="round-banner">${boss ? `${boss.name_jp}` : ""}</div>
      <div class="stage">${svg}</div>
      <div class="boss-name">${boss ? boss.name_jp : ""}</div>
      <div class="players">${playerTiles}</div>
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
        if (playable) node.onclick = () => { SND.sfxCard(); onCard(c, idx); };
        hand.appendChild(node);
      });
    }
    container.appendChild(hand);
  }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }

  return { renderTitle, renderSetup, renderPass, renderRole, renderWager, renderQuestion,
           renderResult, renderAction, renderTargetPicker, renderBoss, renderVictory,
           renderDefeat, renderVote, toast, show };
})();
