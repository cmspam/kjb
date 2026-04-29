// Game state machine. Wires UI + Cards + Monsters + Questions together.
window.Game = (() => {
  const STARTING_HP = 25;
  const STARTING_HAND = 3;
  const MAX_HAND = 6;

  let S = null; // current game state

  function newGame(opts) {
    const isPvP = opts.mode === "pvp" && opts.names.length >= 2;
    const players = opts.names.map((name, i) => ({
      id: "p"+i, name, hp: STARTING_HP, maxHp: STARTING_HP,
      level: (opts.levels && opts.levels[i]) || opts.level,
      energy: 2, hand: [], role: "hero",
      shield: false, skipBossAtk: false,
      attackPower: 0, dead: false, scanned: false,
      misses: {},
      seenIds: [],
      monster: null,  // set in PvP mode by pickMonstersSequentially
    }));
    if (!isPvP && opts.jinro && players.length >= 4) {
      const spyIdx = Math.floor(Math.random()*players.length);
      players[spyIdx].role = "spy";
    }
    S = {
      players,
      boss: isPvP ? null : Monsters.randomBoss(),
      level: opts.level,
      mode: isPvP ? "pvp" : "hero",
      jinro: !isPvP && opts.jinro && players.length >= 4,
      solo: !isPvP && players.length === 1,
      timerSec: opts.timerSec || 0,
      hardMode: !isPvP && !!opts.hardMode,
      eventProb: 0,
      turnsTaken: 0,
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
    // Deal starting hands (3 cards default)
    players.forEach(p => { for (let i = 0; i < STARTING_HAND; i++) drawCard(p); });
    // Per-count balancing. Goals:
    //   • each player tanks ~the same wall-clock damage regardless of party size
    //   • boss fight ends in ~6–11 rounds for any count
    //   • core stays reachable (armor doesn't choke small parties)
    const N = S.players.length;
    const scaling = (function (n) {
      if (n === 1) return { attacks: 1, hp: 50, energy: 4, extraCards: 2, armorDiv: 2 };
      if (n === 2) return { attacks: 1, hp: 35, energy: 3, extraCards: 1, armorDiv: 1.5 };
      if (n === 3) return { attacks: 2, hp: 25, energy: 2, extraCards: 0, armorDiv: 1 };
      if (n === 4) return { attacks: 2, hp: 25, energy: 2, extraCards: 0, armorDiv: 1 };
      if (n === 5) return { attacks: 3, hp: 25, energy: 2, extraCards: 0, armorDiv: 1 };
      return        { attacks: 4, hp: 25, energy: 2, extraCards: 0, armorDiv: 1 };  // 6+
    })(N);
    S.scaling = scaling;
    if (S.mode === "pvp") {
      // PvP: each player has their OWN monster (assigned later by pickMonsters).
      // Standard energy/cards; player HP isn't really tracked — death = own
      // monster's core destroyed.
      S.players.forEach(p => {
        p.hp = 100; p.maxHp = 100;  // generous so heal cards still feel useful
        p.energy = 3;
        drawCard(p); // 4-card opening hand
      });
    } else {
      S.boss.attacksPerRound = scaling.attacks;
      S.players.forEach(p => {
        p.hp = scaling.hp; p.maxHp = scaling.hp;
        p.energy = scaling.energy;
        for (let i = 0; i < scaling.extraCards; i++) drawCard(p);
      });
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
    UI.renderTitle({ onStart: ({ count, mode }) => showSetup(count, mode) });
  }

  function showSetup(count, mode) {
    UI.renderSetup({ count, onConfirm: (opts) => {
      opts.mode = mode;  // Pipe through from title
      newGame(opts);
      const beginMatch = () => {
        if (S.mode === "pvp") {
          // PvP: each kid picks their monster, then go straight to first turn.
          pickMonstersSequentially(0, () => startRound());
        } else if (S.jinro) {
          UI.renderBossIntro(S.boss, () => revealRolesSequentially(0, () => startRound()));
        } else {
          UI.renderBossIntro(S.boss, () => startRound());
        }
      };
      beginMatch();
    }});
  }

  function pickMonstersSequentially(idx, done) {
    if (idx >= S.players.length) { done(); return; }
    const p = S.players[idx];
    const usedIds = S.players.slice(0, idx).map(x => x.monster && x.monster.id).filter(Boolean);
    UI.renderPass(p.name, () => {
      UI.renderMonsterPick(p.name, usedIds, (chosenFactory) => {
        p.monster = chosenFactory();
        pickMonstersSequentially(idx+1, done);
      });
    });
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
      if (S.mode === "pvp") {
        // No central boss — just advance the round and continue with the next alive player.
        S.round++;
        S.currentIdx = 0;
        while (S.currentIdx < S.players.length && S.players[S.currentIdx].dead) S.currentIdx++;
        if (S.currentIdx >= S.players.length) return doDefeat(); // shouldn't happen
        // fall through to start the next player's turn
      } else {
        bossTurn();
        return;
      }
    }
    const p = S.players[S.currentIdx];
    p.attackPower = 0;
    S.pendingDamageBonus = 0;
    S.hintForCurrentQ = false;
    S.rerolledThisQ = false;
    S.currentQuestion = null;
    S.currentWager = null;
    if (S.solo) maybeRandomEvent(p, () => goWager());
    else UI.renderPass(p.name, () => maybeRandomEvent(p, () => goWager()));
  }

  // True when only one player has an alive monster (PvP win condition).
  function checkPvpWinner() {
    if (S.mode !== "pvp") return null;
    const alive = S.players.filter(p => !p.dead);
    if (alive.length <= 1) return alive[0] || null;
    return null;
  }

  // Random pop-in events with ramping probability:
  //   • Never on the first player turn of the whole game
  //   • Each turn that doesn't fire: probability += 3% (capped at 20%)
  //   • When it fires: drops back to 5%
  // Then randomly picks one of 7 events: fairy, bomb, thief, rush, gambler, janken, ninja.
  function maybeRandomEvent(p, onContinue) {
    // Random events reference S.boss, which doesn't exist in PvP — skip in PvP for now.
    if (S.mode === "pvp") return onContinue();
    S.turnsTaken = (S.turnsTaken || 0) + 1;
    if (S.turnsTaken <= 1) {
      // Skip events on the very first turn — the player needs to learn the basics first.
      S.eventProb = 0.03;
      return onContinue();
    }
    const fire = Math.random() < (S.eventProb || 0);
    if (!fire) {
      S.eventProb = Math.min(0.20, (S.eventProb || 0) + 0.03);
      return onContinue();
    }
    S.eventProb = 0.05;
    const events = ["fairy", "bomb", "thief", "rush", "gambler", "janken", "ninja"];
    const which = events[Math.floor(Math.random() * events.length)];
    // Hype splash first, then run the event.
    UI.showRareEventIntro(() => runEvent(which, p, onContinue));
  }

  function runEvent(which, p, onContinue) {
    if (which === "fairy") return UI.renderFairyEvent(p, () => {
      p.hp = p.maxHp;
      UI.toast(`✨ ${p.name} は HP まんたん！`, 1600);
      onContinue();
    });
    if (which === "bomb") {
      const q = Questions.pick(p.level || S.level, 1, { misses: p.misses, seenIds: p.seenIds });
      if (!q) return onContinue();
      p.seenIds.push(q.id);
      return UI.renderBombEvent(p, q, ({ correct }) => {
        if (correct) {
          const aliveNonCore = S.boss.parts.filter(pp => pp.hp > 0 && pp.effect !== "win");
          const targets = aliveNonCore.length ? aliveNonCore : S.boss.parts.filter(pp => pp.hp > 0);
          if (targets.length) {
            const tp = targets[(Math.random()*targets.length)|0];
            tp.hp = Math.max(0, tp.hp - 15);
            UI.toast(`💥 ${tp.name_jp} に 15 ダメージ！`, 1800);
            const core = S.boss.parts.find(x => x.effect === "win");
            if (core && core.hp <= 0) return doVictory();
          }
        } else {
          p.hp = Math.max(0, p.hp - 8);
          UI.toast(`💥 ${p.name} に 8 ダメージ！`, 1800);
          if (p.hp === 0) {
            p.dead = true;
            if (S.players.every(x => x.dead)) return doDefeat();
          }
        }
        onContinue();
      });
    }
    if (which === "thief") return UI.renderThiefEvent(p, () => {
      const aliveParts = S.boss.parts.filter(pp => pp.hp > 0);
      if (aliveParts.length) {
        const tp = aliveParts[(Math.random()*aliveParts.length)|0];
        tp.hp = Math.max(0, tp.hp - 5);
      }
      p.hp = Math.min(p.maxHp, p.hp + 5);
      UI.toast(`🐱 ${p.name} は HP +5！ボス -5！`, 1600);
      const core = S.boss.parts.find(x => x.effect === "win");
      if (core && core.hp <= 0) return doVictory();
      onContinue();
    });
    if (which === "rush") return UI.renderRushEvent(p, S.level, (correctCount) => {
      // Each correct = +2 dmg, dealt to a random non-core part
      const dmg = correctCount * 2;
      if (dmg > 0) {
        const aliveNonCore = S.boss.parts.filter(pp => pp.hp > 0 && pp.effect !== "win");
        const targets = aliveNonCore.length ? aliveNonCore : S.boss.parts.filter(pp => pp.hp > 0);
        if (targets.length) {
          const tp = targets[(Math.random()*targets.length)|0];
          tp.hp = Math.max(0, tp.hp - dmg);
          UI.toast(`🎤 ${correctCount}もん せいかい！${tp.name_jp} に ${dmg} ダメージ！`, 2000);
          const core = S.boss.parts.find(x => x.effect === "win");
          if (core && core.hp <= 0) return doVictory();
        }
      } else {
        UI.toast(`🎤 ざんねん…0もん`, 1500);
      }
      onContinue();
    });
    if (which === "gambler") return UI.renderGamblerEvent(p, ({ wager, lucky }) => {
      // Player loses `wager` HP; deals wager (or wager*2 on lucky) to a random non-core part
      p.hp = Math.max(0, p.hp - wager);
      const dmg = lucky ? wager * 2 : wager;
      const aliveNonCore = S.boss.parts.filter(pp => pp.hp > 0 && pp.effect !== "win");
      const targets = aliveNonCore.length ? aliveNonCore : S.boss.parts.filter(pp => pp.hp > 0);
      if (targets.length) {
        const tp = targets[(Math.random()*targets.length)|0];
        tp.hp = Math.max(0, tp.hp - dmg);
        UI.toast(`🎩 -${wager} HP → ${tp.name_jp} に ${dmg} ダメージ${lucky?'！(大あたり!)':'！'}`, 2200);
      }
      if (p.hp === 0) {
        p.dead = true;
        if (S.players.every(x => x.dead)) return doDefeat();
      }
      const core = S.boss.parts.find(x => x.effect === "win");
      if (core && core.hp <= 0) return doVictory();
      onContinue();
    });
    if (which === "janken") return UI.renderJankenEvent(p, ({ playerPick, masterPick, outcome }) => {
      let dmg = 0;
      if (outcome === "win") dmg = 10;
      else if (outcome === "tie") dmg = 3;
      if (dmg > 0) {
        const aliveNonCore = S.boss.parts.filter(pp => pp.hp > 0 && pp.effect !== "win");
        const targets = aliveNonCore.length ? aliveNonCore : S.boss.parts.filter(pp => pp.hp > 0);
        if (targets.length) {
          const tp = targets[(Math.random()*targets.length)|0];
          tp.hp = Math.max(0, tp.hp - dmg);
          UI.toast(`✊ ${tp.name_jp} に ${dmg} ダメージ！`, 1800);
          const core = S.boss.parts.find(x => x.effect === "win");
          if (core && core.hp <= 0) return doVictory();
        }
      } else {
        UI.toast(`✊ まけ… エナジー -1`, 1500);
        p.energy = Math.max(0, p.energy - 1);
      }
      onContinue();
    });
    if (which === "ninja") return UI.renderNinjaEvent(p, () => {
      const aliveNonCore = S.boss.parts.filter(pp => pp.hp > 0 && pp.effect !== "win");
      const targets = aliveNonCore.length ? aliveNonCore : S.boss.parts.filter(pp => pp.hp > 0);
      const dmg = 8;
      if (targets.length) {
        const tp = targets[(Math.random()*targets.length)|0];
        tp.hp = Math.max(0, tp.hp - dmg);
        UI.toast(`🥷 シュッ！ ${tp.name_jp} に ${dmg} ダメージ！`, 1800);
        const core = S.boss.parts.find(x => x.effect === "win");
        if (core && core.hp <= 0) return doVictory();
      }
      onContinue();
    });
    onContinue();
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
    if (correct) {
      const stars = S.currentWager;
      p.energy += stars;
      p.attackPower = stars;
      drawCard(p);
      // Skip the result screen on correct — too many taps. Toast + go to action.
      const cheer = pickRand(JP.correct_cheer || ["ナイス〜！"]);
      UI.toast(`✨ ${cheer} ⚡+${stars} ⚔️${stars} 🎴+1`, 1800);
      SND.sfxCorrect();
      setTimeout(() => goAction(), 1500);
    } else {
      const t = S.currentQuestion?.ptype;
      if (t) p.misses[t] = (p.misses[t] || 0) + 1;
      // Wrong answers still go through the result screen so kids see the correct
      // answer + explanation.
      UI.renderResult({
        correct: false, energyEarned: 0, cardsDrawn: 0,
        question: S.currentQuestion, chosen,
        player: p, boss: S.boss, players: S.players
      }, () => goAction());
    }
  }

  // -------- ACTION (combined: attack + cards on one screen) --------
  function goAction() {
    const p = currentPlayer();
    if (S.mode === "pvp") {
      UI.renderPvpAction(p, S.players,
        (opp) => goPvpPickPart(p, opp),
        (card, idx) => playCardInAction(p, card, idx),
        () => endTurn()
      );
      return;
    }
    UI.renderAction(p, S.boss, S.players,
      (target) => doAttack(p, target),
      (card, idx) => playCardInAction(p, card, idx),
      () => endTurn()
    );
  }

  function goPvpPickPart(p, opponent) {
    UI.renderTargetPicker(p, opponent.monster, S.players,
      (target) => {
        if (target.kind === "boss-part") {
          doAttack(p, { kind: "pvp-part", targetPlayer: opponent, part: target.part });
        } else {
          // No spy options in PvP
          goAction();
        }
      },
      () => goAction()
    );
  }

  function doAttack(p, target) {
    if (p.attackPower <= 0) { UI.toast("こうげきパワーが ないよ！"); return goAction(); }
    let dmg = p.attackPower + S.pendingDamageBonus;
    // In PvP S.boss is null — apply weak-spot multiplier against the opponent's monster instead.
    const damageMonster = target.kind === "pvp-part" ? target.targetPlayer.monster : S.boss;
    const mult = damageMonster ? Monsters.damageMultiplier(damageMonster) : 1;
    dmg = Math.round(dmg * mult);
    if (S.doubleNextAttack) { dmg *= 2; S.doubleNextAttack = false; }

    // PvP: target an opponent's monster part
    if (target.kind === "pvp-part") {
      const opponent = target.targetPlayer;
      const part = target.part;
      // Apply armor to core hits, scaled per-monster (no party-size division in PvP)
      if (part.effect === "win") {
        const armor = Monsters.coreArmor(opponent.monster);
        const reduced = Math.max(1, dmg - armor);
        if (armor > 0 && reduced < dmg) {
          UI.toast(`コアの シールドが ${dmg - reduced} ダメージを ふせいだ！`, 1500);
        }
        dmg = reduced;
      }
      const fire = () => {
        part.hp = Math.max(0, part.hp - dmg);
        SND.sfxHit();
        const stage = document.querySelector(".stage");
        if (stage) {
          stage.classList.remove("shake"); void stage.offsetWidth; stage.classList.add("shake");
          const num = document.createElement("div");
          num.className = "dmg-num"; num.textContent = "-" + dmg;
          stage.appendChild(num);
          setTimeout(() => num.remove(), 1100);
          // Hold the monster's reaction until the damage number has floated up and out
          // (otherwise the dmg-num overlays the speech bubble at the same y-band).
          const hits = opponent.monster.hits || [];
          if (hits.length) {
            setTimeout(() => {
              const stageNow = document.querySelector(".stage");
              if (!stageNow) return;
              const bubble = document.createElement("div");
              bubble.className = "hit-bubble pop";
              bubble.textContent = hits[(Math.random()*hits.length)|0];
              stageNow.appendChild(bubble);
              setTimeout(() => bubble.remove(), 2000);
            }, 1100);
          }
        }
        UI.toast(`${p.name} → ${opponent.name} の ${part.name_jp} に ${dmg} ダメージ！`, 1800);
        S.log.push(`${p.name} → ${opponent.name}.${part.name_jp}: ${dmg}`);
        if (part.hp === 0) {
          S.log.push(`${opponent.name} の ${part.name_jp} を こわした！`);
          SND.sfxPop();
        }
        p.attackPower = 0;
        S.pendingDamageBonus = 0;
        // If opponent's core is destroyed, they're eliminated
        const oppCore = opponent.monster.parts.find(x => x.effect === "win");
        if (oppCore && oppCore.hp <= 0) {
          opponent.dead = true;
          UI.toast(JP.pvp_eliminated(opponent.name), 2000);
        }
        const winner = checkPvpWinner();
        if (winner) {
          setTimeout(() => doVictory({ winner }), 3200);
          return;
        }
        // Bubble appears at +1100ms with ~2000ms life; hold endTurn so kids can read it.
        setTimeout(() => endTurn(), 3200);
      };
      if (SND.getSlingshot && SND.getSlingshot()) {
        UI.showSlingshot(opponent.monster, `${opponent.name} ${part.name_jp}`, fire);
      } else {
        fire();
      }
      return;
    }

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
    // Armored core: damage reduced by intact non-core parts, scaled per party size.
    if (part.effect === "win") {
      const div = (S.scaling && S.scaling.armorDiv) || 1;
      const armor = Math.floor(Monsters.coreArmor(S.boss) / div);
      const reduced = Math.max(1, dmg - armor);
      if (armor > 0 && reduced < dmg) {
        UI.toast(`コアの シールドが ${dmg - reduced} ダメージを ふせいだ！`, 1500);
      }
      dmg = reduced;
    }
    // Optional slingshot animation before damage applies
    if (SND.getSlingshot && SND.getSlingshot()) {
      UI.showSlingshot(S.boss, part.name_jp, () => applyPartHit(p, part, dmg));
      return;
    }
    applyPartHit(p, part, dmg);
  }

  function applyPartHit(p, part, dmg) {
    part.hp = Math.max(0, part.hp - dmg);
    SND.sfxHit();
    const stage = document.querySelector(".stage");
    if (stage) {
      stage.classList.remove("shake"); void stage.offsetWidth; stage.classList.add("shake");
      const num = document.createElement("div");
      num.className = "dmg-num"; num.textContent = "-" + dmg;
      stage.appendChild(num);
      setTimeout(() => num.remove(), 1100);
      // Boss reaction speech bubble — sequenced AFTER the damage number floats away
      // (both sit near the top of the stage and would otherwise overlap).
      const hits = S.boss.hits || [];
      if (hits.length) {
        setTimeout(() => {
          const stageNow = document.querySelector(".stage");
          if (!stageNow) return;
          const bubble = document.createElement("div");
          bubble.className = "hit-bubble pop";
          bubble.textContent = hits[(Math.random()*hits.length)|0];
          stageNow.appendChild(bubble);
          setTimeout(() => bubble.remove(), 2000);
        }, 1100);
      }
    }
    UI.toast(JP.hit_part(p.name, part.name_jp, dmg), 1800);
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
    // Bubble appears at +1100ms with 2000ms life — hold endTurn so kids read the boss line.
    setTimeout(() => endTurn(), 3200);
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
    try {
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
    } catch (e) {
      console.error("playCardBeforeQuestion failed:", e, "card:", card);
      UI.toast("カードエラー。もういちど！", 1800);
      try { redrawCb(); } catch (e2) { console.error("redraw also failed:", e2); }
    }
  }

  // Cards usable in the action phase
  function playCardInAction(p, card, idx) {
    try {
      if (p.energy < card.cost) return;
      const ef = card.effect;
      // Cards that need a target
      if (card.needsTarget && card.targetType === "player") {
        pickPlayer(p, (target) => {
          try {
            p.energy -= card.cost; p.hand.splice(idx,1); S.discard.push(card);
            applyCardEffect(p, card, target);
            SND.sfxCard();
            goAction();
          } catch (e) {
            console.error("targeted card play failed:", e, "card:", card, "target:", target);
            UI.toast("カードエラー！", 1800);
            goAction();
          }
        }, () => goAction());
        return;
      }
      p.energy -= card.cost; p.hand.splice(idx,1); S.discard.push(card);
      applyCardEffect(p, card, null);
      SND.sfxCard();
      if (S.mode === "pvp") {
        // Did any card-play kill an opponent? (HIT_RANDOM_2 in PvP can hit core)
        S.players.forEach(pp => {
          if (pp.dead || !pp.monster) return;
          const c = pp.monster.parts.find(x => x.effect === "win");
          if (c && c.hp <= 0) pp.dead = true;
        });
        const winner = checkPvpWinner();
        if (winner) { setTimeout(() => doVictory({ winner }), 600); return; }
      } else {
        const core = S.boss.parts.find(x => x.effect === "win");
        if (core && core.hp <= 0) { setTimeout(doVictory, 600); return; }
      }
      goAction();
    } catch (e) {
      console.error("playCardInAction failed:", e, "card:", card);
      UI.toast("カードエラー！", 1800);
      goAction();
    }
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
      // PvP: hit a random opponent's parts. Hero: hit boss parts.
      let aliveParts; let oppName = "";
      if (S.mode === "pvp") {
        const opps = S.players.filter(pp => !pp.dead && pp.id !== p.id && pp.monster);
        if (!opps.length) return;
        const opp = opps[(Math.random()*opps.length)|0];
        oppName = opp.name;
        aliveParts = opp.monster.parts.filter(pp => pp.hp > 0);
      } else {
        aliveParts = S.boss.parts.filter(pp => pp.hp > 0);
      }
      const n = Math.min(2, aliveParts.length);
      const used = [];
      for (let i = 0; i < n; i++) {
        let pick;
        do { pick = aliveParts[(Math.random()*aliveParts.length)|0]; } while (used.includes(pick) && used.length < aliveParts.length);
        used.push(pick);
        pick.hp = Math.max(0, pick.hp - ef.v);
        SND.sfxHit();
      }
      UI.toast(`ベロ ビーム！${oppName?` ${oppName} に`:''} ${ef.v}ダメ ×${n}`);
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
    // Each boss has its own signature attacks; fall back to the shared pool only
    // if a boss is missing them.
    const bossAttacks = (S.boss.attacks && S.boss.attacks.length) ? S.boss.attacks : JP.boss_atk_words;
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
        queue.push({ target, dmg: 0, missed: true });
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
    if (queue.length) processBossAttack(queue, 0, lines);
    else finishBossTurn(lines);
  }

  // Process attacks one at a time. Three modes:
  //   • Hard mode: target answers a defensive Q to dodge
  //   • Boss anim: powerup → emoji burst → attack name reveal
  //   • Plain: apply damage immediately
  function processBossAttack(queue, idx, lines) {
    if (idx >= queue.length) return finishBossTurn(lines);
    const { target, dmg, missed } = queue[idx];
    if (target.dead) return processBossAttack(queue, idx+1, lines);

    // Hard-mode defensive Q only fires for hits (a miss already misses).
    if (!missed && S.hardMode) {
      const q = Questions.pick(target.level || S.level, 1, { misses: target.misses, seenIds: target.seenIds });
      if (q) {
        target.seenIds.push(q.id);
        UI.renderDefenseQ(target, q, dmg, S.boss, S.players, (correct) => {
          const atk = pickRand((S.boss.attacks && S.boss.attacks.length) ? S.boss.attacks : JP.boss_atk_words);
          if (correct) {
            lines.push(`${target.name} は こたえて かわした！ ✨`);
          } else {
            target.hp = Math.max(0, target.hp - dmg);
            lines.push(`${target.name} に ${atk.name} → ${dmg} ダメージ！`);
            if (target.hp === 0) { target.dead = true; lines.push(`${target.name} は たおれた…💀`); }
            const t = q.ptype; if (t) target.misses[t] = (target.misses[t]||0)+1;
          }
          setTimeout(() => processBossAttack(queue, idx+1, lines), 500);
        });
        return;
      }
    }

    const atk = pickRand((S.boss.attacks && S.boss.attacks.length) ? S.boss.attacks : JP.boss_atk_words);
    const apply = () => {
      if (missed) {
        lines.push(`${target.name} に ${atk.name} … はずれ〜！ 💨`);
      } else {
        target.hp = Math.max(0, target.hp - dmg);
        lines.push(`${target.name} に ${atk.name} → ${dmg} ダメージ！`);
        if (target.hp === 0) { target.dead = true; lines.push(`${target.name} は たおれた…💀`); }
      }
      processBossAttack(queue, idx+1, lines);
    };
    if (SND.getBossAnim && SND.getBossAnim()) {
      UI.showBossAttackAnim(S.boss, atk, target.name, dmg, !!missed, apply);
    } else {
      apply();
    }
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
    if (S.mode === "pvp" && opts.winner) {
      UI.renderVictory({ players: S.players, mode: "pvp", winner: opts.winner },
        () => location.reload(), () => location.reload());
      return;
    }
    let spyWins = false;
    if (S.jinro) spyWins = false;
    UI.renderVictory({ players: S.players, jinro: S.jinro, spyWins, boss: S.boss },
      () => location.reload(),
      () => location.reload());
  }
  function doDefeat() {
    let spyWins = S.jinro;
    UI.renderDefeat({ players: S.players, jinro: S.jinro, spyWins, boss: S.boss },
      () => location.reload(),
      () => location.reload());
  }

  return { start };
})();
