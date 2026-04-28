// Game state machine. Wires UI + Cards + Monsters + Questions together.
window.Game = (() => {
  const STARTING_HP = 25;
  const STARTING_HAND = 3;
  const MAX_HAND = 6;

  let S = null; // current game state

  function newGame(opts) {
    const players = opts.names.map((name, i) => ({
      id: "p"+i, name, hp: STARTING_HP, maxHp: STARTING_HP,
      level: (opts.levels && opts.levels[i]) || opts.level,
      energy: 2, hand: [], role: "hero",
      shield: false, skipBossAtk: false,
      attackPower: 0, dead: false, scanned: false,
      misses: {},   // {ptype: count} - tracks struggle areas for adaptive picking
      seenIds: [],  // recent question ids — avoid repeats
    }));
    if (opts.jinro && players.length >= 4) {
      const spyIdx = Math.floor(Math.random()*players.length);
      players[spyIdx].role = "spy";
    }
    S = {
      players,
      boss: Monsters.randomBoss(),
      level: opts.level,
      jinro: opts.jinro && players.length >= 4,
      solo: players.length === 1,
      timerSec: opts.timerSec || 0,
      hardMode: !!opts.hardMode,
      currentIdx: 0,
      round: 1,
      voteUsedThisRound: false,
      deck: Cards.buildDeck(opts.jinro),
      discard: [],
      log: [],
      pendingDamageBonus: 0,
      pendingTeamShield: false,
      hintForCurrentQ: false,
      rerolledThisQ: false,
      currentQuestion: null,
      currentWager: null,
      doubleNextAttack: false,
      rolesRevealed: false,
      revealedThisGame: [],
    };
    // Deal starting hands
    players.forEach(p => { for (let i = 0; i < STARTING_HAND; i++) drawCard(p); });
    // Solo balance: a single player on multiplayer damage curves is unwinnable.
    // Boost HP, halve boss attacks, soften core armor, and start with extra cards.
    if (S.solo) {
      const p = S.players[0];
      p.hp = 50; p.maxHp = 50;
      p.energy = 4;
      drawCard(p); drawCard(p); // 5-card opening hand
      S.boss.attacksPerRound = 1;
    }
  }

  function drawCard(player) {
    if (S.deck.length === 0) {
      S.deck = S.discard;
      S.discard = [];
      // shuffle
      for (let i = S.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random()*(i+1));
        [S.deck[i], S.deck[j]] = [S.deck[j], S.deck[i]];
      }
    }
    const c = S.deck.shift();
    if (!c) return;
    if (player.hand.length >= MAX_HAND) {
      // discard the oldest
      S.discard.push(player.hand.shift());
    }
    player.hand.push(c);
  }

  function start() {
    UI.renderTitle({ onStart: showSetup });
  }

  function showSetup() {
    UI.renderSetup({ onConfirm: (opts) => {
      newGame(opts);
      // First-round role reveal
      if (S.jinro) {
        revealRolesSequentially(0, () => startRound());
      } else {
        startRound();
      }
    }});
  }

  function revealRolesSequentially(idx, done) {
    if (idx >= S.players.length) { done(); return; }
    const p = S.players[idx];
    UI.renderPass(p.name, () => {
      UI.renderRole(p, p.role === "spy", () => revealRolesSequentially(idx+1, done));
    });
  }

  function startRound() {
    S.voteUsedThisRound = false;
    S.players.forEach(p => { p.shield = false; p.skipBossAtk = false; p.attackPower = 0; });
    S.currentIdx = 0;
    S.pendingDamageBonus = 0;
    S.doubleNextAttack = false;
    nextTurn();
  }

  function nextTurn() {
    // Skip dead players
    while (S.currentIdx < S.players.length && S.players[S.currentIdx].dead) S.currentIdx++;
    if (S.currentIdx >= S.players.length) {
      bossTurn();
      return;
    }
    const p = S.players[S.currentIdx];
    p.attackPower = 0;
    S.pendingDamageBonus = 0;
    S.hintForCurrentQ = false;
    S.rerolledThisQ = false;
    S.currentQuestion = null;
    S.currentWager = null;
    // Solo mode: skip the pass screen — there's no one to hand off to.
    if (S.solo) goWager();
    else UI.renderPass(p.name, () => goWager());
  }

  function currentPlayer() { return S.players[S.currentIdx]; }

  // -------- WAGER --------
  function goWager() {
    const p = currentPlayer();
    UI.renderWager(p, S.boss, S.players,
      (stars) => {
        S.currentWager = stars;
        S.currentQuestion = Questions.pick(p.level || S.level, stars, { misses: p.misses, seenIds: p.seenIds });
        if (!S.currentQuestion) {
          UI.toast("もんだいが ない…");
          return;
        }
        p.seenIds.push(S.currentQuestion.id);
        if (p.seenIds.length > 80) p.seenIds.shift();
        showQuestion();
      },
      (card, idx) => playCardBeforeQuestion(p, card, idx, () => goWager())
    );
  }

  function showQuestion() {
    const p = currentPlayer();
    let hintIdx = -1;
    if (S.hintForCurrentQ) {
      // pick a wrong index to mask
      const wrong = S.currentQuestion.options.map((_,i)=>i).filter(i=>i!==S.currentQuestion.answer);
      hintIdx = wrong[(Math.random()*wrong.length)|0];
    }
    UI.renderQuestion(p, S.currentQuestion, S.boss, S.players, { hintMaskIdx: hintIdx, timerSec: S.timerSec },
      (correct, chosen) => handleAnswer(correct, chosen),
      () => {});
  }

  function handleAnswer(correct, chosen) {
    const p = currentPlayer();
    let energyEarned = 0, cardsDrawn = 0;
    if (correct) {
      energyEarned = S.currentWager;
      p.energy += energyEarned;
      p.attackPower = S.currentWager;
      drawCard(p); cardsDrawn = 1;
    } else {
      // Track miss so future Questions.pick can rebalance
      const t = S.currentQuestion?.ptype;
      if (t) p.misses[t] = (p.misses[t] || 0) + 1;
    }
    UI.renderResult({
      correct, energyEarned, cardsDrawn,
      question: S.currentQuestion, chosen,
      player: p, boss: S.boss, players: S.players
    }, () => goAction());
  }

  // -------- ACTION --------
  function goAction() {
    const p = currentPlayer();
    UI.renderAction(p, S.boss, S.players,
      () => goPickTarget(),
      (card, idx) => playCardInAction(p, card, idx),
      () => endTurn()
    );
  }

  function goPickTarget() {
    const p = currentPlayer();
    UI.renderTargetPicker(p, S.boss, S.players,
      (target) => doAttack(p, target),
      () => goAction());
  }

  function doAttack(p, target) {
    if (p.attackPower <= 0) { UI.toast("こうげきパワーが ないよ！"); return goAction(); }
    let dmg = p.attackPower + S.pendingDamageBonus;
    const mult = Monsters.damageMultiplier(S.boss);
    dmg = Math.round(dmg * mult);
    if (S.doubleNextAttack) { dmg *= 2; S.doubleNextAttack = false; }

    // Spy sabotage paths
    if (target.kind === "teammate") {
      const t = target.target;
      t.hp = Math.max(0, t.hp - dmg);
      SND.sfxHit();
      UI.toast(`😈 ${p.name} が ${t.name} を こうげき！ ${dmg} ダメージ！`, 1800);
      S.log.push(`${p.name} → ${t.name}: ${dmg} ダメージ (なかまを こうげき!)`);
      if (t.hp === 0) { t.dead = true; S.log.push(`${t.name} は たおれた…`); }
      p.attackPower = 0;
      S.pendingDamageBonus = 0;
      if (S.players.every(x => x.dead)) return doDefeat();
      setTimeout(() => endTurn(), 1400);
      return;
    }
    if (target.kind === "heal-boss") {
      const heal = 5;
      const aliveParts = S.boss.parts.filter(pp => pp.hp > 0 && pp.hp < pp.maxHP);
      if (aliveParts.length) {
        const r = aliveParts[(Math.random()*aliveParts.length)|0];
        r.hp = Math.min(r.maxHP, r.hp + heal);
      }
      SND.sfxCard();
      UI.toast(`😈 ${p.name} が ボスを かいふく！ +${heal} HP`, 1800);
      S.log.push(`${p.name}: ボスを かいふく (なかまを うらぎる!)`);
      p.attackPower = 0;
      setTimeout(() => endTurn(), 1400);
      return;
    }
    // Normal attack on a boss part
    const part = target.part;
    // Armored core: damage to core reduced by intact non-core parts.
    // Solo halves the armor so a single player can actually push damage through.
    if (part.effect === "win") {
      let armor = Monsters.coreArmor(S.boss);
      if (S.solo) armor = Math.floor(armor / 2);
      const reduced = Math.max(1, dmg - armor);
      if (armor > 0 && reduced < dmg) {
        UI.toast(`コアの シールドが ${dmg - reduced} ダメージを ふせいだ！`, 1500);
      }
      dmg = reduced;
    }
    part.hp = Math.max(0, part.hp - dmg);
    SND.sfxHit();
    const stage = document.querySelector(".stage");
    if (stage) {
      stage.classList.remove("shake"); void stage.offsetWidth; stage.classList.add("shake");
      const num = document.createElement("div");
      num.className = "dmg-num"; num.textContent = "-" + dmg;
      stage.appendChild(num);
      setTimeout(() => num.remove(), 1200);
      // Boss reaction speech bubble
      const hits = S.boss.hits || [];
      if (hits.length) {
        const bubble = document.createElement("div");
        bubble.className = "hit-bubble pop";
        bubble.textContent = hits[(Math.random()*hits.length)|0];
        stage.appendChild(bubble);
        setTimeout(() => bubble.remove(), 1400);
      }
    }
    UI.toast(JP.hit_part(p.name, part.name_jp, dmg), 1100);
    p.attackPower = 0;
    S.pendingDamageBonus = 0;
    S.log.push(`${p.name} → ${part.name_jp}: ${dmg} ダメージ！`);
    // shaking would be added with animation; we re-render to update HP.
    if (part.hp === 0) {
      S.log.push(`${part.name_jp} を こわした！`);
      SND.sfxPop();
    }
    // Check win
    const core = S.boss.parts.find(x => x.effect === "win");
    if (core && core.hp <= 0) { return doVictory(); }
    // Show boss reaction bubble briefly, then auto-end turn (no extra screen tap needed).
    setTimeout(() => endTurn(), 1400);
  }

  function endTurn() {
    // Discard unspent attackPower; leftover energy stays (banked for cards next turn)
    currentPlayer().attackPower = 0;
    S.currentIdx++;
    nextTurn();
  }

  // -------- CARD PLAY --------

  // Cards usable BEFORE the question (wager phase)
  function playCardBeforeQuestion(p, card, idx, redrawCb) {
    if (p.energy < card.cost) return;
    p.energy -= card.cost;
    p.hand.splice(idx, 1);
    S.discard.push(card);
    const ef = card.effect;
    if (ef.type === Cards.C.HINT) { S.hintForCurrentQ = true; UI.toast("ヒント! まちがいを 1つ けすよ"); }
    else if (ef.type === Cards.C.REROLL_Q) { S.rerolledThisQ = true; UI.toast("やりなおし！"); }
    else if (ef.type === Cards.C.ENERGY) { p.energy += ef.v; UI.toast(`エナジー +${ef.v}`); }
    else if (ef.type === Cards.C.DRAW) { for (let i=0;i<ef.v;i++) drawCard(p); UI.toast(`カードを ${ef.v}まい ひいた`); }
    else { UI.toast("いま つかえないよ"); p.energy += card.cost; p.hand.push(card); S.discard.pop(); return redrawCb(); }
    redrawCb();
  }

  // Cards usable in the action phase
  function playCardInAction(p, card, idx) {
    if (p.energy < card.cost) return;
    const ef = card.effect;
    // Cards that need a target
    if (card.needsTarget && card.targetType === "player") {
      // pick a player (alive)
      pickPlayer(p, (target) => {
        p.energy -= card.cost; p.hand.splice(idx,1); S.discard.push(card);
        applyCardEffect(p, card, target);
        SND.sfxCard();
        goAction();
      }, () => goAction());
      return;
    }
    p.energy -= card.cost; p.hand.splice(idx,1); S.discard.push(card);
    applyCardEffect(p, card, null);
    SND.sfxCard();
    const core = S.boss.parts.find(x => x.effect === "win");
    if (core && core.hp <= 0) { setTimeout(doVictory, 600); return; }
    goAction();
  }

  function pickPlayer(asker, onPick, onCancel) {
    const s = document.getElementById("screen-action");
    s.innerHTML = "";
    const header = document.createElement("div");
    header.innerHTML = `<h3 style="text-align:center;margin-top:24px;">だれに？</h3>`;
    s.appendChild(header);
    const row = document.createElement("div"); row.className = "vote-row";
    S.players.filter(p=>!p.dead).forEach(p => {
      const b = document.createElement("button");
      b.className = "vote-btn";
      b.textContent = p.name + (p.id===asker.id ? "（じぶん）" : "");
      UI.tap(b, () => onPick(p));
      row.appendChild(b);
    });
    s.appendChild(row);
    const c = document.createElement("button");
    c.className = "btn ghost"; c.textContent = JP.cancel;
    UI.tap(c, onCancel);
    s.appendChild(c);
  }

  function applyCardEffect(p, card, target) {
    const ef = card.effect, C = Cards.C;
    if (ef.type === C.DMG_BONUS) {
      S.pendingDamageBonus += ef.v;
      UI.toast(`つぎの こうげきに +${ef.v}！`);
    } else if (ef.type === C.HEAL_TARGET) {
      target.hp = Math.min(target.maxHp, target.hp + ef.v);
      UI.toast(`${target.name}: HP +${ef.v}`);
    } else if (ef.type === C.HEAL_TEAM) {
      S.players.filter(x=>!x.dead).forEach(x => x.hp = Math.min(x.maxHp, x.hp + ef.v));
      UI.toast(`みんな +${ef.v} HP`);
    } else if (ef.type === C.HEAL_SELF) {
      p.hp = Math.min(p.maxHp, p.hp + ef.v);
      UI.toast(`+${ef.v} HP`);
    } else if (ef.type === C.SHIELD_SELF) {
      p.shield = true; UI.toast(`シールド！`);
    } else if (ef.type === C.SHIELD_TEAM) {
      S.players.filter(x=>!x.dead).forEach(x => x.shield = true);
      UI.toast(`チーム シールド！`);
    } else if (ef.type === C.SKIP_BOSS_ATK) {
      p.skipBossAtk = true; UI.toast(`にげる じゅんび！`);
    } else if (ef.type === C.ENERGY) {
      p.energy += ef.v; UI.toast(`エナジー +${ef.v}`);
    } else if (ef.type === C.DRAW) {
      for (let i=0;i<ef.v;i++) drawCard(p);
      UI.toast(`カードを ${ef.v}まい ひいた`);
    } else if (ef.type === C.DOUBLE_NEXT) {
      S.doubleNextAttack = true;
      UI.toast(`つぎの こうげき ×2！`);
    } else if (ef.type === C.HIT_RANDOM_2) {
      const aliveParts = S.boss.parts.filter(pp=>pp.hp>0);
      const n = Math.min(2, aliveParts.length);
      const used = [];
      for (let i = 0; i < n; i++) {
        let pick;
        do { pick = aliveParts[(Math.random()*aliveParts.length)|0]; } while (used.includes(pick) && used.length < aliveParts.length);
        used.push(pick);
        pick.hp = Math.max(0, pick.hp - ef.v);
        SND.sfxHit();
      }
      UI.toast(`ベロ ビーム！ ${ef.v}ダメ ×${n}`);
    } else if (ef.type === C.REVEAL_ROLE) {
      const isSpy = target.role === "spy";
      UI.toast(isSpy ? `${target.name} は スパイ！` : `${target.name} は シロ！`, 2400);
      target.scanned = true;
      if (isSpy) {
        // Reveal publicly
        S.revealedThisGame.push(target.id);
      }
    }
  }

  // -------- BOSS TURN --------
  function bossTurn() {
    const mods = Monsters.bossModifiers(S.boss);
    const lines = [];
    lines.push(`${S.boss.name_jp}: 「${S.boss.catchphrase}」`);
    if (mods.atks <= 0) {
      lines.push("こうげき できない！ 😆");
      lines.push(pickRand(JP.boss_taunt_low_hp));
      return finishBossTurn(lines);
    }
    // Pre-determine the targeted attacks (without yet applying damage)
    const queue = [];
    for (let i = 0; i < mods.atks; i++) {
      const aliveHeroes = S.players.filter(p => !p.dead);
      if (aliveHeroes.length === 0) break;
      const target = aliveHeroes[(Math.random()*aliveHeroes.length)|0];
      if (target.skipBossAtk) {
        lines.push(`${target.name} は うまく にげた！ 🏃`);
        target.skipBossAtk = false; continue;
      }
      if (Math.random() < mods.missChance) {
        lines.push(`${target.name} に ${pickRand(JP.boss_atk_words)} … はずれ〜！`);
        continue;
      }
      if (target.shield) {
        lines.push(`${target.name} は シールドで ふせいだ！ 🛡️`);
        target.shield = false; continue;
      }
      let dmg = 4 + Math.floor(S.round/2);
      const mouthAlive = S.boss.parts.find(p=>p.type==="mouth" && p.hp>0);
      if (mouthAlive && mods.hasSpecial && Math.random() < 0.35) dmg += 2;
      queue.push({ target, dmg });
    }
    if (S.hardMode && queue.length) {
      processBossAttack(queue, 0, lines);
    } else {
      queue.forEach(({target, dmg}) => {
        target.hp = Math.max(0, target.hp - dmg);
        lines.push(`${target.name} に ${pickRand(JP.boss_atk_words)} → ${dmg} ダメージ！`);
        if (target.hp === 0) { target.dead = true; lines.push(`${target.name} は たおれた…💀`); }
      });
      finishBossTurn(lines);
    }
  }

  // Hard mode: targeted player must answer a quick question to dodge.
  function processBossAttack(queue, idx, lines) {
    if (idx >= queue.length) return finishBossTurn(lines);
    const { target, dmg } = queue[idx];
    if (target.dead) return processBossAttack(queue, idx+1, lines);
    const q = Questions.pick(target.level || S.level, 1, { misses: target.misses, seenIds: target.seenIds });
    if (!q) {
      target.hp = Math.max(0, target.hp - dmg);
      lines.push(`${target.name} に ${dmg} ダメージ！`);
      if (target.hp === 0) { target.dead = true; lines.push(`${target.name} は たおれた…`); }
      return processBossAttack(queue, idx+1, lines);
    }
    target.seenIds.push(q.id);
    UI.renderDefenseQ(target, q, dmg, S.boss, S.players, (correct) => {
      if (correct) {
        lines.push(`${target.name} は こたえて かわした！ ✨`);
      } else {
        target.hp = Math.max(0, target.hp - dmg);
        lines.push(`${target.name} に ${pickRand(JP.boss_atk_words)} → ${dmg} ダメージ！`);
        if (target.hp === 0) { target.dead = true; lines.push(`${target.name} は たおれた…💀`); }
        const t = q.ptype; if (t) target.misses[t] = (target.misses[t]||0)+1;
      }
      setTimeout(() => processBossAttack(queue, idx+1, lines), 600);
    });
  }

  function finishBossTurn(lines) {
    UI.renderBoss(S.boss, S.players, lines, () => {
      if (S.players.every(p => p.dead)) return doDefeat();
      if (S.jinro && !S.voteUsedThisRound) {
        showVoteOption();
      } else {
        S.round++;
        startRound();
      }
    });
  }

  function showVoteOption() {
    // Only call vote if any unscanned-as-spy player remains
    const candidates = S.players.filter(p=>!p.dead);
    if (candidates.length <= 1) {
      S.round++; return startRound();
    }
    UI.renderVote(S.players, (target) => {
      S.voteUsedThisRound = true;
      const isSpy = target.role === "spy";
      UI.toast(isSpy ? JP.vote_result_spy(target.name) : JP.vote_result_innocent(target.name), 2400);
      if (isSpy) {
        S.revealedThisGame.push(target.id);
        // Team wins jinro game
        return doVictory({jinroForced:true});
      } else {
        // small penalty to encourage caution
        target.hp = Math.max(0, target.hp - 2);
        S.log.push(`${target.name}: -2HP (まちがった とうひょう)`);
        S.round++; startRound();
      }
    }, () => {
      S.voteUsedThisRound = true;
      S.round++; startRound();
    });
  }

  // -------- WIN / LOSE --------
  function doVictory(opts={}) {
    let spyWins = false;
    if (S.jinro) {
      // Hero wins normally; spy never had explicit win path here unless team falls
      spyWins = false;
    }
    UI.renderVictory({ players: S.players, jinro: S.jinro, spyWins },
      () => location.reload(),
      () => location.reload());
  }
  function doDefeat() {
    let spyWins = S.jinro;
    UI.renderDefeat({ players: S.players, jinro: S.jinro, spyWins },
      () => location.reload(),
      () => location.reload());
  }

  return { start };
})();
