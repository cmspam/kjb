// Game state machine. Wires UI + Cards + Monsters + Questions together.
window.Game = (() => {
  const STARTING_HP = 25;
  const STARTING_HAND = 3;
  const MAX_HAND = 6;
  // Avatar emoji pool — kid picks one at setup (or a random one is assigned).
  // Shows on player tiles, pass screen, etc., for instant "this is me" recognition.
  const AVATAR_POOL = ['🐶','🦄','🥷','👻','🤖','🐱','🐰','🐯','🐼','🦊','🐲','👽','🎃','🌟','🍕','🍣','⚔️','🔥','💎','🎨','🐸','🐙','🐝','🦖'];
  function pickRandAvatar() { return AVATAR_POOL[(Math.random()*AVATAR_POOL.length)|0]; }
  // Damage tier — drives the dmg-num font size, the .stage shake intensity,
  // and whether to flash the screen for crits. Thresholds tuned so a typical
  // ★1 hit feels light and a combo+weakness+wager stack feels huge.
  function dmgTier(d) {
    if (d >= 16) return "crit";
    if (d >= 8)  return "heavy";
    if (d >= 4)  return "medium";
    return "light";
  }
  function applyDamageTier(stage, dmg) {
    if (!stage) return;
    const tier = dmgTier(dmg);
    stage.classList.remove("shake","shake-light","shake-medium","shake-heavy","shake-crit");
    void stage.offsetWidth; // restart the animation
    // Crit gets its own dedicated class — was shake-heavy before, which made
    // a 16dmg crit feel identical to a 9dmg heavy. Now distinctly bigger.
    stage.classList.add("shake-" + tier);
    if (tier === "crit") {
      const flash = document.createElement("div");
      flash.className = "crit-flash";
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 600);
      // Crit hit-stop: 180ms freeze frame on the stage so the impact lands.
      // Done via a CSS class that pauses any running animation; cleared
      // on the same frame as flash removal.
      stage.classList.add("hit-stop");
      setTimeout(() => stage.classList.remove("hit-stop"), 180);
      // Crit-specific SFX — distinct rising chord vs. sfxHit's two-tone bonk.
      if (SND.sfxCrit) SND.sfxCrit();
      // Duck the theme briefly so the crit-flash + sting punch through.
      if (SND.duckTheme) SND.duckTheme(700, 0.30);
      UI.toast("⚡ クリティカル！", 1400);
    }
    return tier;
  }

  // Attack types for monster-vs-monster (PvP) and boss-vs-player (hero) play.
  // Each attack defined under a monster's `attacks` carries a `type` field
  // (set in js/locale/<lang>.js). The type controls damage multiplier, hit
  // count, target rule, side effects, and a label kids can read. Resolving
  // an attack means: pick a type-def, multiply baseDmg by mult, then apply
  // `hits` separate damage events. For "wild", each hit picks a fresh random
  // alive part on the target. For "pierce", core armor is ignored. For
  // "stun", the target gains a `_stunned` flag for one upcoming action
  // (boss skips next attack / opponent loses 1 energy next turn).
  //
  // Attacks with no `type` (or unknown type) fall through to the BASIC
  // default, which behaves like the legacy single-hit single-target attack
  // — ensures pre-typed callers (the slingshot path before the picker is
  // wired in) keep working unchanged.
  const ATTACK_TYPES = {
    heavy:  { mult: 1.5,  hits: 1, shakeTier: "heavy",  label: "💪 ヘビー",   tagline: "おおきい いっぱつ" },
    quick:  { mult: 0.7,  hits: 2, shakeTier: "light",  label: "⚡ クイック",  tagline: "すばやい にれん" },
    wild:   { mult: 0.5,  hits: 3, shakeTier: "medium", label: "🌪️ ワイルド", tagline: "ランダム みだれ", randomTarget: true },
    pierce: { mult: 1.0,  hits: 1, shakeTier: "medium", label: "🎯 ピアス",    tagline: "アーマー つらぬき", ignoreArmor: true },
    stun:   { mult: 0.7,  hits: 1, shakeTier: "light",  label: "❄️ スタン",    tagline: "つぎの ターン ふうじ", stun: true },
  };
  const BASIC_ATTACK_TYPE = { mult: 1.0, hits: 1, shakeTier: "medium", label: "", tagline: "" };
  function attackTypeDef(type) {
    return ATTACK_TYPES[type] || BASIC_ATTACK_TYPE;
  }
  // Build a hit plan: an array of damage events to apply in sequence. Each
  // event has { dmg, ignoreArmor, stun, randomTarget }. Hits are distributed
  // so total damage approximately matches `mult × baseDmg` (with rounding
  // applied to each hit). Crits are still rolled per-hit by the caller.
  function buildAttackPlan(type, baseDmg) {
    const def = attackTypeDef(type);
    const total = Math.max(0, Math.round(baseDmg * def.mult));
    const hits = Math.max(1, def.hits);
    // Distribute total across hits: first N-1 get floor(total/N), last one
    // gets the remainder so we don't drop fractional damage. Each hit deals
    // at minimum 1 damage if the total is non-zero.
    const events = [];
    let left = total;
    for (let i = 0; i < hits; i++) {
      const remainingHits = hits - i;
      const dmg = i === hits - 1 ? left : Math.max(1, Math.floor(total / remainingHits));
      left = Math.max(0, left - dmg);
      events.push({
        dmg,
        ignoreArmor: !!def.ignoreArmor,
        stun:        !!def.stun,
        randomTarget: !!def.randomTarget,
        shakeTier:   def.shakeTier,
      });
    }
    return { def, events, totalDmg: total };
  }

  let S = null; // current game state

  function newGame(opts) {
    const isPvP = opts.mode === "pvp" && opts.names.length >= 2;
    const players = opts.names.map((name, i) => ({
      id: "p"+i, name, hp: STARTING_HP, maxHp: STARTING_HP,
      avatar: (opts.avatars && opts.avatars[i]) || pickRandAvatar(),
      level: (opts.levels && opts.levels[i]) || opts.level,
      energy: 2, hand: [], role: "hero",
      shield: false, skipBossAtk: false,
      attackPower: 0, dead: false, scanned: false,
      combo: 0,        // consecutive correct answers; resets on wrong
      bestCombo: 0,    // tracked for end-of-battle recap (Pass 3)
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
      // Per-battle stats for the end-of-fight recap. Stores the English answer
      // text of each question got right / wrong this battle so kids can see
      // what they learned.
      // Per-battle scorecard inputs. right/wrong are word lists used for
      // the recap word-pick view. biggestHit + biggestHitBy track the
      // single largest damage event for the "BIGGEST HIT" highlight in
      // the broadcast scorecard. startedAt drives the elapsed-time stat.
      battleStats: { right: [], wrong: [], biggestHit: 0, biggestHitBy: null, startedAt: Date.now() },
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
      // Cache factory ids once so cycleBoss doesn't rebuild the full list each tap.
      let factoryIds = null;
      const cycleBoss = () => {
        if (!S.boss) return;
        const factories = Monsters.listFactories();
        if (!factoryIds) factoryIds = factories.map(f => f().id);
        const cur = factoryIds.indexOf(S.boss.id);
        const next = (cur + 1 + factories.length) % factories.length;
        S.boss = factories[next]();
        // Re-apply the per-party-size scaling that newGame() applied to the
        // original boss; otherwise the new boss attacks the wrong number of times.
        if (S.scaling) S.boss.attacksPerRound = S.scaling.attacks;
        beginMatch();
      };
      const beginMatch = () => {
        if (S.mode === "pvp") {
          // PvP: each kid picks their monster, then go straight to first turn.
          // No boss intro, so no cycle button either.
          pickMonstersSequentially(0, () => startRound());
        } else if (S.jinro) {
          UI.renderBossIntro(S.boss,
            () => revealRolesSequentially(0, () => startRound()),
            cycleBoss);
        } else {
          UI.renderBossIntro(S.boss, () => startRound(), cycleBoss);
        }
      };
      beginMatch();
    }});
  }

  function pickMonstersSequentially(idx, done) {
    if (idx >= S.players.length) { done(); return; }
    const p = S.players[idx];
    const usedIds = S.players.slice(0, idx).map(x => x.monster && x.monster.id).filter(Boolean);
    UI.renderPass(p, () => {
      UI.renderMonsterPick(p.name, usedIds, (chosenFactory) => {
        p.monster = chosenFactory();
        pickMonstersSequentially(idx+1, done);
      });
    });
  }

  function revealRolesSequentially(idx, done) {
    if (idx >= S.players.length) { done(); return; }
    const p = S.players[idx];
    UI.renderPass(p, () => {
      UI.renderRole(p, p.role === "spy", () => revealRolesSequentially(idx+1, done));
    });
  }

  // Snapshot HP / part HP at the start of a jinro round so finishBossTurn can
  // show aggregate deltas ("team -12, boss -28") in the recap. Used only when
  // S.jinro is true; null otherwise.
  function snapshotRoundHp() {
    return {
      players: S.players.map(p => ({ id: p.id, hp: p.hp })),
      boss: S.boss ? S.boss.parts.map(part => ({ name: part.name_jp, hp: part.hp })) : null,
    };
  }

  function startRound() {
    S.voteUsedThisRound = false;
    S.players.forEach(p => { p.shield = false; p.skipBossAtk = false; p.attackPower = 0; });
    S.currentIdx = 0;
    S.pendingDamageBonus = 0;
    S.doubleNextAttack = false;
    // Jinro stealth: hide everyone's HP / exact part HP during the round so
    // teammates can't decode whether a teammate-tap was a buff or a sabotage
    // by watching the HP delta. Cleared on finishBossTurn for the recap.
    S.hpHiddenThisRound = !!S.jinro;
    S.roundStartSnap = S.jinro ? snapshotRoundHp() : null;
    // PvP round 1: boxer-entrance face-off splash showing every kid's monster.
    // Replaces the generic round splash on the very first round of PvP.
    if (S.mode === "pvp" && S.round === 1) {
      const lineup = S.players.filter(p => p.monster);
      if (lineup.length >= 2) {
        UI.showPvpFaceoff(lineup, () => nextTurn());
        return;
      }
    }
    // Boxing-card "ROUND N" splash from round 2 onward; round 1 hero-mode
    // gets a "FIGHT!" stinger between the boss intro and the first question
    // so the action starts with a beat.
    if (S.round >= 2) UI.showRoundIntro(S.round, () => nextTurn());
    else if (UI.showFightStinger && S.mode !== "pvp") UI.showFightStinger(() => nextTurn());
    else nextTurn();
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
    else UI.renderPass(p, () => maybeRandomEvent(p, () => goWager()));
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
    // Pass event type so the splash takes a per-event color/icon tint.
    UI.showRareEventIntro(() => runEvent(which, p, onContinue), which);
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
    UI.renderQuestion(p, S.currentQuestion, S.boss, S.players, { hintMaskIdx: hintIdx, timerSec: S.timerSec, slowAudio: S.hintForCurrentQ },
      (correct, chosen) => handleAnswer(correct, chosen),
      () => {});
  }

  function handleAnswer(correct, chosen, softFail) {
    const p = currentPlayer();
    // Battle stats + cross-session history. Use the English answer text as the
    // "word" so the end-of-battle recap is useful as a vocabulary list.
    const q = S.currentQuestion;
    if (q) {
      const word = (q.options && q.answer != null) ? q.options[q.answer] : null;
      if (word) {
        if (correct) S.battleStats.right.push(word);
        else         S.battleStats.wrong.push(word);
      }
      if (Questions.recordAnswer) Questions.recordAnswer(q.id, !!correct);
    }
    if (!correct) S.pronounceTarget = null; // no bonus for wrong-answer turns
    if (correct) {
      const stars = S.currentWager;
      p.energy += stars;
      p.attackPower = stars;
      // Stun lingers from a previous opponent's stun-type attack: zero the
      // attack power for this turn (cards still work, energy still flows).
      if (p._stunnedNextTurn) {
        p.attackPower = 0;
        p._stunnedNextTurn = false;
        UI.toast(`❄️ ${p.name} は スタン中… こうげき できない！`, 1500);
      }
      drawCard(p);
      // Pronunciation challenge: if the answer is a single short English word
      // and SpeechRecognition is available, offer a "say it" bonus button on
      // the action screen. Filtered to short English words so we don't ask
      // kids to pronounce a full grammar sentence.
      S.pronounceTarget = null;
      if (q && q.options && q.answer != null && SND.isSpeechSupported && SND.isSpeechSupported()) {
        const w = String(q.options[q.answer] || "").trim();
        if (w && w.length <= 20 && /^[ -~]+$/.test(w)) {
          S.pronounceTarget = w;
        }
      }
      // Combo: streak of consecutive correct answers. Bonus damage at 3+,
      // bonus card draw at 5+. Resets on a wrong answer.
      p.combo = (p.combo || 0) + 1;
      if (p.combo > (p.bestCombo || 0)) p.bestCombo = p.combo;
      let bonusDmg = 0;
      let bonusCard = false;
      if (p.combo >= 3) { p.attackPower += 1; bonusDmg = 1; }
      if (p.combo >= 5) { drawCard(p);          bonusCard = true; }
      // First-blood splash on the very first correct of the battle (this
      // is correct #1 since we just pushed to battleStats.right above).
      if (S.battleStats.right.length === 1 && UI.showFirstBloodSplash) {
        UI.showFirstBloodSplash();
      }
      // Combo-tier banners at 3 / 5 / 7 / 10 — shows above the toast.
      if ((p.combo === 3 || p.combo === 5 || p.combo === 7 || p.combo === 10) && UI.showComboSplash) {
        UI.showComboSplash(p.combo);
      }
      const cheer = pickRand(JP.correct_cheer || ["ナイス〜！"]);
      const comboTxt = p.combo >= 2 ? ` 🔥×${p.combo}` : "";
      const bonusTxt = (bonusDmg||bonusCard) ? ` (+${bonusDmg?'⚔️':''}${bonusCard?'🎴':''} ボーナス！)` : "";
      UI.toast(`✨ ${cheer} ⚡+${stars} ⚔️${stars}${bonusDmg?'+'+bonusDmg:''} 🎴+${bonusCard?2:1}${comboTxt}${bonusTxt}`, 1800);
      SND.sfxCorrect();
      setTimeout(() => goAction(), 1500);
    } else {
      const t = S.currentQuestion?.ptype;
      if (t) p.misses[t] = (p.misses[t] || 0) + 1;
      // Spelling-mode soft fail: kid was off-by-one Levenshtein (a typo, not
      // a wrong answer). No reward, but combo is preserved — typing speed
      // shouldn't ruin a streak the kid earned with comprehension.
      if (softFail) {
        UI.toast(`✏️ おしい！ スペル ミス。 コンボは キープ！ 🔥×${p.combo}`, 1800);
      } else {
        p.combo = 0; // streak broken
      }
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
    const onSpeak = (result) => {
      if (result && result.ok) {
        p.attackPower = (p.attackPower || 0) + 2;
        if (UI.showSpeechBonusSplash) UI.showSpeechBonusSplash(S.pronounceTarget);
        else UI.toast("⭐ +2 ボーナス！", 1300);
      }
      S.pronounceTarget = null;
      goAction();
    };
    const taunt = (S.mode !== "pvp") ? pickBossTaunt(p) : null;
    const extras = { pronounceTarget: S.pronounceTarget, onSpeak, taunt, jinro: !!S.jinro };
    if (S.mode === "pvp") {
      UI.renderPvpAction(p, S.players,
        (opp) => goPvpPickAttack(p, opp),
        (card, idx) => playCardInAction(p, card, idx),
        () => endTurn(),
        extras
      );
      return;
    }
    UI.renderAction(p, S.boss, S.players,
      (target) => doAttack(p, target),
      (card, idx) => playCardInAction(p, card, idx),
      () => endTurn(),
      extras
    );
  }

  // PvP attack flow:
  //   goPvpPickAttack    — kid picks which of THEIR monster's attacks to use
  //   goPvpPickPart      — kid picks which part to hit (skipped for Wild)
  //   doAttack pvp-part  — applies the chosen attack type's damage plan
  function goPvpPickAttack(p, opponent) {
    if (p.attackPower <= 0) {
      UI.toast("こうげきパワーが ないよ！");
      return goAction();
    }
    UI.showMonsterAttackPicker(p.monster, opponent.name,
      (attack) => {
        if (!attack) return goAction();
        const def = attackTypeDef(attack.type);
        if (def.randomTarget) {
          // Wild: hits go to random parts at apply time, no part picker.
          doAttack(p, { kind: "pvp-part", targetPlayer: opponent, part: null, attack });
        } else {
          goPvpPickPart(p, opponent, attack);
        }
      },
      () => goAction()
    );
  }
  function goPvpPickPart(p, opponent, attack) {
    UI.renderTargetPicker(p, opponent.monster, S.players,
      (target) => {
        if (target.kind === "boss-part") {
          doAttack(p, { kind: "pvp-part", targetPlayer: opponent, part: target.part, attack });
        } else {
          // No spy options in PvP
          goAction();
        }
      },
      () => goAction()
    );
  }

  // Pick a contextual boss taunt based on the current game state. Returns a
  // string from the JP.boss_taunts pool best matching the situation, or null
  // if nothing fits / the data isn't loaded.
  function pickBossTaunt(p) {
    if (!S.boss || S.boss._lostPartTaunt) {
      // _lostPartTaunt is one-shot — applyPartHit sets it after a part dies
      // so the next render's taunt reflects that, then we clear it below.
    }
    const T = (window.JP && JP.boss_taunts) || null;
    if (!T) return null;
    const core = S.boss.parts.find(x => x.effect === "win");
    const corePct = core ? core.hp / core.maxHP : 1;
    // One-shot: a part was just destroyed → boss whines about it.
    if (S.boss._lostPartTaunt) {
      S.boss._lostPartTaunt = false;
      const pool = T.part_lost; if (pool && pool.length) return pool[(Math.random()*pool.length)|0];
    }
    if (S.boss.raged && T.raged && T.raged.length) {
      return T.raged[(Math.random()*T.raged.length)|0];
    }
    if (p && p.combo >= 3 && T.high_combo && T.high_combo.length) {
      return T.high_combo[(Math.random()*T.high_combo.length)|0];
    }
    if (p && p.maxHp && p.hp <= p.maxHp * 0.3 && T.player_low_hp && T.player_low_hp.length) {
      return T.player_low_hp[(Math.random()*T.player_low_hp.length)|0];
    }
    let pool;
    if (corePct <= 0.30)      pool = T.desperate;
    else if (corePct <= 0.65) pool = T.hurt;
    else                       pool = T.healthy;
    if (pool && pool.length) return pool[(Math.random()*pool.length)|0];
    return null;
  }

  // Classify a question's ptype into broad categories so a single boss
  // weakness can match many specific question variants.
  function questionCategory(q) {
    if (!q || !q.ptype) return "other";
    const p = q.ptype;
    if (/listen/i.test(p)) return "listening";
    if (/^(vocab|ppl|adj|subj|sight|alpha_(?:upper|lower)|color|body|verb|num|greet|food|family|class|animal)/i.test(p))
      return "vocab";
    return "grammar";
  }

  function doAttack(p, target) {
    if (p.attackPower <= 0) { UI.toast("こうげきパワーが ないよ！"); return goAction(); }
    let dmg = p.attackPower + S.pendingDamageBonus;
    // In PvP S.boss is null — apply weak-spot multiplier against the opponent's monster instead.
    const damageMonster = target.kind === "pvp-part" ? target.targetPlayer.monster : S.boss;
    const mult = damageMonster ? Monsters.damageMultiplier(damageMonster) : 1;
    dmg = Math.round(dmg * mult);
    if (S.doubleNextAttack) { dmg *= 2; S.doubleNextAttack = false; }
    // Boss weakness: ×1.5 damage when the question category matches the boss's
    // declared weakness. Only applies in hero mode (PvP monsters don't carry
    // their own weakness in this iteration).
    if (S.boss && S.boss.weakness && S.currentQuestion) {
      const cat = questionCategory(S.currentQuestion);
      if (cat === S.boss.weakness && target.kind !== "pvp-part") {
        dmg = Math.round(dmg * 1.5);
        UI.toast(`⚡ よわてん ヒット！ ×1.5 (${S.boss.weakness_label||cat})`, 1400);
      }
    }

    // PvP: target an opponent's monster part
    if (target.kind === "pvp-part") {
      const opponent = target.targetPlayer;
      const opMon = opponent.monster;
      const attack = target.attack || null;
      // Build the damage plan from the chosen attack's type. Untyped (legacy)
      // callers fall back to BASIC = single hit ×1.0 — same behavior as before.
      const baseDmg = dmg;
      const plan = buildAttackPlan(attack ? attack.type : null, baseDmg);
      const def  = plan.def;

      // Apply each hit in plan.events sequentially. For Wild, each hit picks a
      // fresh random alive part. For others, all hits land on the picked part.
      // Damage numbers float per-hit so multi-hit attacks read as 3 small bites
      // rather than one big chunk.
      function applyHits(onAllHitsApplied) {
        let i = 0;
        function nextHit() {
          if (i >= plan.events.length) { onAllHitsApplied(); return; }
          const ev = plan.events[i++];
          let hitPart = ev.randomTarget
            ? (() => {
                const alive = opMon.parts.filter(x => x.hp > 0);
                if (!alive.length) return null;
                return alive[(Math.random() * alive.length) | 0];
              })()
            : target.part;
          if (!hitPart) { setTimeout(nextHit, 80); return; }
          let hitDmg = ev.dmg;
          if (hitPart.effect === "win" && !ev.ignoreArmor) {
            const armor = Monsters.coreArmor(opMon);
            const reduced = Math.max(1, hitDmg - armor);
            if (armor > 0 && reduced < hitDmg && i === 1) {
              UI.toast(`コアの シールドが ${hitDmg - reduced} ダメージを ふせいだ！`, 1200);
            }
            hitDmg = reduced;
          } else if (hitPart.effect === "win" && ev.ignoreArmor) {
            // Pierce: armor ignored. One-shot toast on the first piercing hit.
            if (i === 1) UI.toast(`🎯 アーマー つらぬき！`, 1100);
          }
          hitPart.hp = Math.max(0, hitPart.hp - hitDmg);
          if (S.battleStats && hitDmg > (S.battleStats.biggestHit || 0)) {
            S.battleStats.biggestHit = hitDmg;
            S.battleStats.biggestHitBy = p ? p.name : null;
          }
          SND.sfxHit();
          const stage = document.querySelector(".stage");
          if (stage) {
            const tier = applyDamageTier(stage, hitDmg);
            const num = document.createElement("div");
            num.className = "dmg-num tier-" + tier; num.textContent = "-" + hitDmg;
            // For multi-hit, jitter the position so numbers don't pile up.
            if (plan.events.length > 1) {
              num.style.left = (45 + Math.random() * 10) + "%";
            }
            stage.appendChild(num);
            setTimeout(() => num.remove(), 1100);
          }
          S.log.push(`${p.name} → ${opponent.name}.${hitPart.name_jp}: ${hitDmg}${ev.ignoreArmor ? ' (pierce)' : ''}`);
          if (hitPart.hp === 0) {
            S.log.push(`${opponent.name} の ${hitPart.name_jp} を こわした！`);
            if (UI.showPartDestroyedSplash) UI.showPartDestroyedSplash(`${opponent.name} の ${hitPart.name_jp}`);
            else if (SND.sfxBreak) SND.sfxBreak();
            else SND.sfxPop();
          }
          // 220ms gap between hits — feels like a beat without dragging.
          setTimeout(nextHit, 220);
        }
        nextHit();
      }

      function finishTurn() {
        // Hit reaction voice — opponent monster yelps after the dust settles.
        const hits = opMon.hits || [];
        if (hits.length) {
          opMon._hitsHist = opMon._hitsHist || [];
          const line = window.pickRandNoRepeat
            ? pickRandNoRepeat(hits, opMon._hitsHist, 3)
            : hits[(Math.random()*hits.length)|0];
          setTimeout(() => {
            const stageNow = document.querySelector(".stage");
            if (stageNow) {
              const bubble = document.createElement("div");
              bubble.className = "hit-bubble pop";
              bubble.textContent = line;
              stageNow.appendChild(bubble);
              setTimeout(() => bubble.remove(), 2000);
            }
            if (opMon.id) SND.playBossLine(opMon.id, line);
          }, 200);
        }
        // Stun: opponent loses next turn's attack power.
        if (def.stun) {
          opponent._stunnedNextTurn = true;
          UI.toast(`❄️ ${opponent.name} は つぎの ターン スタン！`, 1700);
        }
        UI.toast(`${p.name} → ${opponent.name} に ${plan.totalDmg} ダメージ！${def.label?` (${def.label})`:''}`, 1800);
        p.attackPower = 0;
        S.pendingDamageBonus = 0;
        const oppCore = opMon.parts.find(x => x.effect === "win");
        if (oppCore && oppCore.hp <= 0) {
          opponent.dead = true;
          UI.toast(JP.pvp_eliminated(opponent.name), 2000);
          UI.showKO(opMon, () => {
            const winner = checkPvpWinner();
            if (winner) doVictory({ winner });
            else endTurn();
          });
          return;
        }
        if (!opMon._cliffShown && oppCore && oppCore.hp === 1) {
          opMon._cliffShown = true;
          setTimeout(() => UI.showCliffhanger(opMon, () => endTurn()), 1300);
          return;
        }
        if (!opMon.raged && oppCore && oppCore.hp > 0 && oppCore.hp <= oppCore.maxHP * 0.25) {
          opMon.raged = true;
          UI.toast(`😡 ${opMon.name_jp} は ぶちぎれた！`, 2000);
          setTimeout(() => UI.showRageIntro(opMon, () => endTurn()), 1500);
          return;
        }
        const winner = checkPvpWinner();
        if (winner) { setTimeout(() => doVictory({ winner }), 3000); return; }
        setTimeout(() => endTurn(), 3000);
      }

      // If we have an attack object, run the dramatic monster-vs-monster
      // cinematic before applying hits. If not (legacy untyped callers, e.g.
      // a card with hard-coded damage), fall back to the slingshot path so
      // existing flows keep working.
      if (attack) {
        const partLabel = target.part ? `${opponent.name} ${target.part.name_jp}` : opponent.name;
        UI.showBossAttackAnim(
          p.monster, attack, partLabel, plan.totalDmg, false,
          () => applyHits(finishTurn),
          null,
          { byPlayer: true, attackerName: p.monster.name_jp, typeLabel: def.label }
        );
      } else {
        // Untyped fallback — single hit, slingshot animation if enabled.
        const fire = () => applyHits(finishTurn);
        if (SND.getSlingshot && SND.getSlingshot() && target.part) {
          UI.showSlingshot(opMon, `${opponent.name} ${target.part.name_jp}`, fire);
        } else {
          fire();
        }
      }
      return;
    }

    // Unified teammate-target action — same UI tile for all roles. Heroes
    // who tap a teammate deliver a small support boost (+HP); spies sabotage
    // (damage). The toast text is intentionally ambiguous so the team can't
    // read role from a single action — coupled with hidden HP during round
    // (P2.2), the kid can't easily decode whether they were buffed or hit.
    if (target.kind === "teammate") {
      const t = target.target;
      const isSpy = p.role === "spy";
      if (isSpy) {
        t.hp = Math.max(0, t.hp - dmg);
        SND.sfxHit();
        S.log.push(`${p.name} → ${t.name}: ${dmg} ダメージ (うらぎり)`);
        if (t.hp === 0) { t.dead = true; S.log.push(`${t.name} は たおれた…`); }
      } else {
        // Hero support: small +HP to teammate. Cost = same attack power
        // (so the hero gives up their attack for this turn).
        const heal = Math.min(t.maxHp - t.hp, p.attackPower + 1);
        t.hp = Math.min(t.maxHp, t.hp + heal);
        SND.sfxCard();
        S.log.push(`${p.name} → ${t.name}: +${heal} サポート HP`);
      }
      // Neutral toast — same text regardless of role. With HP hidden during
      // the round (P2.2), the kid can't tell from numbers which way it went.
      UI.toast(`🌀 ${t.name} に なにか おこった！`, 1700);
      p.attackPower = 0;
      S.pendingDamageBonus = 0;
      if (S.players.every(x => x.dead)) return doDefeat();
      setTimeout(() => endTurn(), 1400);
      return;
    }
    // heal-boss kind dropped — was a spy-only action that visually outed the
    // spy (only spies had the button). May resurface as a card-only ability.
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
    // Track the biggest single hit for the post-battle scorecard.
    if (S.battleStats && dmg > (S.battleStats.biggestHit || 0)) {
      S.battleStats.biggestHit = dmg;
      S.battleStats.biggestHitBy = p ? p.name : null;
    }
    SND.sfxHit();
    const stage = document.querySelector(".stage");
    if (stage) {
      const tier = applyDamageTier(stage, dmg);
      const num = document.createElement("div");
      num.className = "dmg-num tier-" + tier; num.textContent = "-" + dmg;
      stage.appendChild(num);
      setTimeout(() => num.remove(), 1100);
      // Boss reaction speech bubble — sequenced AFTER the damage number floats away
      // (both sit near the top of the stage and would otherwise overlap).
      const hits = S.boss.hits || [];
      if (hits.length) {
        // Avoid back-to-back duplicate lines — small per-boss ring buffer.
        S.boss._hitsHist = S.boss._hitsHist || [];
        const line = window.pickRandNoRepeat
          ? pickRandNoRepeat(hits, S.boss._hitsHist, 3)
          : hits[(Math.random()*hits.length)|0];
        setTimeout(() => {
          const stageNow = document.querySelector(".stage");
          if (!stageNow) return;
          const bubble = document.createElement("div");
          bubble.className = "hit-bubble pop";
          bubble.textContent = line;
          stageNow.appendChild(bubble);
          setTimeout(() => bubble.remove(), 2000);
          // Voice the reaction
          if (S.boss && S.boss.id) SND.playBossLine(S.boss.id, line);
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
      // Don't sfxPop on part destroy anymore — sfxBreak is a glass-shatter
      // chord that actually feels like something broke. Splash overlay too.
      if (UI.showPartDestroyedSplash) UI.showPartDestroyedSplash(part.name_jp);
      else SND.sfxBreak ? SND.sfxBreak() : SND.sfxPop();
      S.boss._lostPartTaunt = true; // one-shot: next taunt reflects this loss
    }
    // Check win — doVictory wraps the K.O. cinematic so all kill paths
    // (this one, card effects, etc.) get the same reveal.
    const core = S.boss.parts.find(x => x.effect === "win");
    if (core && core.hp <= 0) { return doVictory(); }
    // Cliffhanger: core sits at exactly 1 HP. Drop the music, show a splash,
    // beat of silence — then continue. One shot per fight.
    if (!S.boss._cliffShown && core && core.hp === 1) {
      S.boss._cliffShown = true;
      setTimeout(() => UI.showCliffhanger(S.boss, () => endTurn()), 1300);
      return;
    }
    // Rage activation: core just dropped to ≤25% maxHP. Bumps the boss's
    // attacks-per-round and shows a dramatic splash. Only fires once per fight.
    if (!S.boss.raged && core && core.hp > 0 && core.hp <= core.maxHP * 0.25) {
      S.boss.raged = true;
      S.boss.attacksPerRound = (S.boss.attacksPerRound || 1) + 1;
      S.log.push(`${S.boss.name_jp} は ぶちぎれた！ 😡`);
      setTimeout(() => UI.showRageIntro(S.boss, () => endTurn()), 1500);
      return;
    }
    // Bubble appears at +1100ms with 2000ms life — hold endTurn so kids read the boss line.
    setTimeout(() => endTurn(), 3200);
  }

  function endTurn() {
    S.pronounceTarget = null; // bonus is one-shot per turn
    // Discard unspent attackPower; leftover energy stays (banked for cards next turn)
    currentPlayer().attackPower = 0;
    // Bug fix: doubleNextAttack used to leak across rounds — if a player
    // played `combo` and ended turn without attacking, the flag persisted and
    // the NEXT-NEXT player's first attack would unexpectedly double. Now
    // cleared at end-of-turn, scoped to the activating turn only.
    S.doubleNextAttack = false;
    S.pendingDamageBonus = 0;
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
      discardOrSink(card);
      const ef = card.effect;
      if (ef.type === Cards.C.HINT) {
        // Max one hint per question — refund if already used.
        if (S.hintForCurrentQ) { p.energy += card.cost; p.hand.push(card); S.discard.pop(); UI.toast("もう ヒントを つかった！", 1500); return redrawCb(); }
        S.hintForCurrentQ = true; UI.toast("ヒント！ まちがいを 1つ けして、おとも ゆっくり〜");
      }
      else if (ef.type === Cards.C.REROLL_Q) {
        if (S.rerolledThisQ) { p.energy += card.cost; p.hand.push(card); S.discard.pop(); UI.toast("もう やりなおした！", 1500); return redrawCb(); }
        S.rerolledThisQ = true; UI.toast("やりなおし！");
      }
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
      // ACCUSE card: gated to round ≥ 4 and not yet locked. One-shot per game
      // — locked after first play (right or wrong). Right = team wins +
      // cinematic; wrong = -5HP to accuser + lock.
      if (card.id === "accuse") {
        if (S.round < 4) { UI.toast("ラウンド 4 まで まちなさい！", 1800); return; }
        if (S.accuseLocked) { UI.toast("もう こくはつ できない！", 1800); return; }
      }
      // Cards that need a target
      if (card.needsTarget && card.targetType === "player") {
        // In PvP, heal cards target the kid's OWN monster's parts (no team
        // exists — everyone's a competitor), so we skip the player picker
        // entirely. applyCardEffect's heal branch detects PvP and routes to
        // healMonsterPart.
        const ef0 = card.effect;
        const isHealCard = ef0 && (ef0.type === Cards.C.HEAL_TARGET || ef0.type === Cards.C.HEAL_SELF);
        if (S.mode === "pvp" && isHealCard) {
          p.energy -= card.cost; p.hand.splice(idx,1); discardOrSink(card);
          applyCardEffect(p, card, p);  // target=self for typing safety
          SND.sfxCard();
          goAction();
          return;
        }
        pickPlayer(p, (target) => {
          try {
            p.energy -= card.cost; p.hand.splice(idx,1); discardOrSink(card);
            SND.sfxCard();
            // Reveal and Accuse drive their own continuation flow (private
            // overlay / cinematic toast → goAction). applyCardEffect's
            // branches for these are no-ops; we route directly.
            if (card.id === "reveal") {
              handleReveal(p, target, () => goAction());
              return;
            }
            if (card.id === "accuse") {
              handleAccuse(p, target, () => goAction());
              return;
            }
            applyCardEffect(p, card, target);
            goAction();
          } catch (e) {
            console.error("targeted card play failed:", e, "card:", card, "target:", target);
            UI.toast("カードエラー！", 1800);
            goAction();
          }
        }, () => goAction());
        return;
      }
      p.energy -= card.cost; p.hand.splice(idx,1); discardOrSink(card);
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

  // Anti-stall: heal cards go to the BOTTOM of the deck rather than the
  // discard pile, so the player can't loop heal-draw-heal-draw to outpace
  // boss damage forever. Card mechanically exits hand (energy spent, hand
  // slot freed) but waits its full turn through the deck before redraw.
  function discardOrSink(card) {
    const ef = card && card.effect;
    if (ef && (ef.type === Cards.C.HEAL_TARGET || ef.type === Cards.C.HEAL_TEAM || ef.type === Cards.C.HEAL_SELF)) {
      S.deck.push(card);
    } else {
      S.discard.push(card);
    }
  }

  // Heal helpers for PvP: heal cards in PvP target the kid's OWN monster's
  // parts (since there's no team and player.hp is meaningless there). Auto-
  // pick the most-damaged alive part — keeps card play single-tap.
  function healMostDamagedPart(p, v) {
    const m = p.monster;
    if (!m) return false;
    const hurt = m.parts.filter(x => x.hp > 0 && x.hp < x.maxHP);
    if (!hurt.length) {
      UI.toast(`${p.name} の モンスターは げんき！ なおすところ ない`);
      return false;
    }
    hurt.sort((a, b) => (a.hp / a.maxHP) - (b.hp / b.maxHP));
    const part = hurt[0];
    const restore = Math.min(v, part.maxHP - part.hp);
    part.hp += restore;
    UI.toast(`💚 ${p.name} の ${part.name_jp} +${restore} HP！`);
    return true;
  }
  function healAllOwnParts(p, v) {
    const m = p.monster;
    if (!m) return false;
    const hurt = m.parts.filter(x => x.hp > 0 && x.hp < x.maxHP);
    if (!hurt.length) {
      UI.toast(`${p.name} の モンスターは げんき！`);
      return false;
    }
    let total = 0;
    hurt.forEach(x => {
      const before = x.hp;
      x.hp = Math.min(x.maxHP, x.hp + v);
      total += x.hp - before;
    });
    UI.toast(`💚 ${p.name} の モンスター ぜんぶ +${v} HP！(けい +${total})`);
    return true;
  }

  function applyCardEffect(p, card, target) {
    const ef = card.effect, C = Cards.C;
    if (ef.type === C.DMG_BONUS) {
      S.pendingDamageBonus += ef.v;
      UI.toast(`つぎの こうげきに +${ef.v}！`);
    } else if (ef.type === C.HEAL_TARGET) {
      if (S.mode === "pvp") healMostDamagedPart(p, ef.v);
      else { target.hp = Math.min(target.maxHp, target.hp + ef.v); UI.toast(`${target.name}: HP +${ef.v}`); }
    } else if (ef.type === C.HEAL_TEAM) {
      if (S.mode === "pvp") healAllOwnParts(p, ef.v);
      else { S.players.filter(x=>!x.dead).forEach(x => x.hp = Math.min(x.maxHp, x.hp + ef.v)); UI.toast(`みんな +${ef.v} HP`); }
    } else if (ef.type === C.HEAL_SELF) {
      if (S.mode === "pvp") healMostDamagedPart(p, ef.v);
      else { p.hp = Math.min(p.maxHp, p.hp + ef.v); UI.toast(`+${ef.v} HP`); }
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
      // Generalized toast — the previous "ベロ ビーム" copy was tako-themed
      // even when the boss was a different monster. Now uses the card's name
      // ("ベロ ビーム" / "Whip Splash" / etc. depending on locale) so flavor
      // matches the played card.
      const cardName = card && (card.name_jp || card.id) || "スプレッド";
      UI.toast(`${cardName}！${oppName?` ${oppName} に`:''} ${ef.v}ダメ ×${n}`);
    } else if (ef.type === C.REVEAL_ROLE) {
      // Private reveal handled at playCardInAction level — see below — so the
      // overlay can drive its own continuation cleanly. Should not be reached
      // here; if it is, fall back to a silent log.
      S.log.push(`(ひみつ) ${p.name} が ${target.name} を スキャン: ${target.role==="spy"?"スパイ":"シロ"}`);
    } else if (ef.type === C.ACCUSE_PLAYER) {
      // Same: handled at playCardInAction level.
    }
  }
  function handleReveal(asker, target, onDone) {
    target.scanned = true;
    const isSpy = target.role === "spy";
    S.log.push(`(ひみつ) ${asker.name} → ${target.name}: ${isSpy?"スパイ":"シロ"}`);
    if (UI.renderPrivateScan) {
      UI.renderPrivateScan(asker, target, isSpy, onDone);
    } else {
      UI.toast("ひみつ スキャン!", 1500);
      onDone();
    }
  }
  function handleAccuse(asker, target, onDone) {
    S.accuseLocked = true;
    const isSpy = target.role === "spy";
    if (isSpy) {
      UI.toast(`⚖️ ${asker.name} が ${target.name} を こくはつ… せいかい！ チームの しょうり！`, 3200);
      S.revealedThisGame.push(target.id);
      S.log.push(`${asker.name} → ${target.name}: ACCUSE 成功 (スパイ)`);
      setTimeout(() => doVictory({ jinroForced: true, accusedSpy: target.name }), 1200);
    } else {
      UI.toast(`⚖️ ${asker.name} の こくはつ… はずれ！ ${target.name} は シロ。 −5 HP & ロック！`, 3200);
      asker.hp = Math.max(0, asker.hp - 5);
      S.log.push(`${asker.name} → ${target.name}: ACCUSE 失敗 (-5HP, ロック)`);
      if (asker.hp === 0) {
        asker.dead = true;
        if (S.players.every(x => x.dead)) { setTimeout(doDefeat, 800); return; }
      }
      setTimeout(onDone, 1500);
    }
  }

  // -------- BOSS TURN --------
  // INVARIANT: every boss turn produces at least one full attack animation
  // (WARNING flash + boss charge + theme snippet + dramatic resolution),
  // even when the boss is too broken to actually hit anyone. The "fizzle"
  // reason covers can't-attack outcomes so kids never see a flat log line.
  function bossTurn() {
    const mods = Monsters.bossModifiers(S.boss);
    const lines = [];
    lines.push(`${S.boss.name_jp}: 「${S.boss.catchphrase}」`);
    const aliveHeroes = S.players.filter(p => !p.dead);
    if (aliveHeroes.length === 0) return finishBossTurn(lines);

    // Each boss has its own signature attacks; fall back to the shared pool only
    // if a boss is missing them.
    const bossAttacks = (S.boss.attacks && S.boss.attacks.length) ? S.boss.attacks : JP.boss_atk_words;

    const queue = [];
    {
      // Pre-determine the targeted attacks (without yet applying damage). All
      // "didn't damage" outcomes (escape / miss / shield) still queue so they
      // get the full animation; only the final reveal text differs. The boss
      // always attacks ≥1 time per round (bossModifiers floors atks at 1) —
      // when legs are destroyed the missChance climbs instead.
      for (let i = 0; i < mods.atks; i++) {
        const stillAlive = S.players.filter(p => !p.dead);
        if (stillAlive.length === 0) break;
        // Pick the attack first so we can read its type and apply type effects
        // (×1.5 for heavy, ×0.7 for stun, ignore shield for pierce, etc.).
        const atk = bossAttacks[(Math.random()*bossAttacks.length)|0];
        const def = attackTypeDef(atk && atk.type);
        // Wild attacks pick a fresh random target each time; others pick once.
        const target = def.randomTarget
          ? stillAlive[(Math.random()*stillAlive.length)|0]
          : stillAlive[(Math.random()*stillAlive.length)|0];
        if (target.skipBossAtk) {
          queue.push({ target, dmg: 0, missed: true, missReason: "escape", atk, def });
          target.skipBossAtk = false;
          continue;
        }
        if (Math.random() < mods.missChance) {
          queue.push({ target, dmg: 0, missed: true, missReason: "miss", atk, def });
          continue;
        }
        // Pierce ignores shields: shield doesn't trigger a "shield" miss outcome
        // for a piercing attack — instead the shield is left intact and the
        // damage lands as if no shield were present.
        if (target.shield && !def.ignoreArmor) {
          queue.push({ target, dmg: 0, missed: true, missReason: "shield", atk, def });
          target.shield = false;
          continue;
        }
        let dmg = 4 + Math.floor(S.round/2);
        const mouthAlive = S.boss.parts.find(p=>p.type==="mouth" && p.hp>0);
        if (mouthAlive && mods.hasSpecial && Math.random() < 0.35) dmg += 2;
        // Apply attack-type multiplier (Heavy 1.5×, Pierce 1.0×, Stun/Quick
        // 0.7×, Wild 0.5×). Pure single-hit for boss-side; the multi-hit
        // mechanic is left for the player-side PvP path.
        dmg = Math.max(1, Math.round(dmg * def.mult));
        queue.push({ target, dmg, atk, def });
      }
    }
    // Defensive fallback: if the loop produced nothing (all heroes died
    // mid-turn, etc.), still give the kid one fizzle for the warning beat.
    if (queue.length === 0) {
      const t = aliveHeroes[(Math.random()*aliveHeroes.length)|0];
      queue.push({ target: t, dmg: 0, missed: true, missReason: "fizzle" });
    }
    processBossAttack(queue, 0, lines);
  }

  // Process attacks one at a time. Three modes:
  //   • Hard mode: target answers a defensive Q to dodge
  //   • Boss anim: powerup → emoji burst → attack name reveal
  //   • Plain: apply damage immediately
  function processBossAttack(queue, idx, lines) {
    if (idx >= queue.length) return finishBossTurn(lines);
    const entry = queue[idx];
    const { target, dmg, missed, missReason } = entry;
    // Use the attack chosen at queue-build time (which carries the type def)
    // — falls back to a random pick for legacy fizzle entries.
    const atk = entry.atk || pickRand((S.boss.attacks && S.boss.attacks.length) ? S.boss.attacks : JP.boss_atk_words);
    const def = entry.def || attackTypeDef(atk && atk.type);
    if (target.dead) return processBossAttack(queue, idx+1, lines);

    // Hard-mode defensive Q only fires for hits (a miss already misses).
    if (!missed && S.hardMode) {
      const q = Questions.pick(target.level || S.level, 1, { misses: target.misses, seenIds: target.seenIds });
      if (q) {
        target.seenIds.push(q.id);
        UI.renderDefenseQ(target, q, dmg, S.boss, S.players, (correct) => {
          if (correct) {
            lines.push(`${target.name} は こたえて かわした！ ✨`);
          } else {
            target.hp = Math.max(0, target.hp - dmg);
            lines.push(`${target.name} に ${atk.name} → ${dmg} ダメージ！${def.label ? ' ('+def.label+')' : ''}`);
            if (def.stun) {
              target._stunnedNextTurn = true;
              lines.push(`❄️ ${target.name} は スタン！ つぎの ターン こうげき できない`);
            }
            if (target.hp === 0) { target.dead = true; lines.push(`${target.name} は たおれた…💀`); }
            const t = q.ptype; if (t) target.misses[t] = (target.misses[t]||0)+1;
          }
          setTimeout(() => processBossAttack(queue, idx+1, lines), 500);
        });
        return;
      }
    }

    const apply = () => {
      if (missed) {
        // Log line varies by why the attack didn't connect.
        let line;
        switch (missReason) {
          case "escape": line = `${target.name} は ${atk.name} を かわした！ 🏃`; break;
          case "shield": line = `${target.name} は シールドで ${atk.name} を ふせいだ！ 🛡️`; break;
          case "fizzle": line = `${atk.name} … よわくなりすぎて しっぱい！ 💤`; break;
          default:       line = `${target.name} に ${atk.name} … はずれ〜！ 💨`; break;
        }
        lines.push(line);
      } else {
        target.hp = Math.max(0, target.hp - dmg);
        lines.push(`${target.name} に ${atk.name} → ${dmg} ダメージ！${def.label ? ' ('+def.label+')' : ''}`);
        if (def.stun) {
          target._stunnedNextTurn = true;
          lines.push(`❄️ ${target.name} は スタン！ つぎの ターン こうげき できない`);
        }
        if (target.hp === 0) { target.dead = true; lines.push(`${target.name} は たおれた…💀`); }
      }
      processBossAttack(queue, idx+1, lines);
    };
    if (SND.getBossAnim && SND.getBossAnim()) {
      UI.showBossAttackAnim(S.boss, atk, target.name, dmg, !!missed, apply, missReason, { typeLabel: def.label });
    } else {
      apply();
    }
  }

  function finishBossTurn(lines) {
    // Reveal HP for the recap (jinro mode hides during round).
    S.hpHiddenThisRound = false;
    if (S.roundStartSnap) {
      const teamDmg = S.roundStartSnap.players.reduce((sum, snap) => {
        const cur = S.players.find(p => p.id === snap.id);
        return sum + Math.max(0, snap.hp - (cur ? cur.hp : 0));
      }, 0);
      const bossDmg = S.roundStartSnap.boss && S.boss
        ? S.roundStartSnap.boss.reduce((sum, snap, i) => {
            const part = S.boss.parts[i];
            return sum + Math.max(0, snap.hp - (part ? part.hp : 0));
          }, 0)
        : 0;
      if (teamDmg || bossDmg) {
        lines.unshift(`📊 ラウンド ${S.round} まとめ: チーム −${teamDmg} HP / ボス −${bossDmg} HP`);
      }
      S.roundStartSnap = null;
    }
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

  // Maximum number of rounds before the spy wins by clock-pressure timeout.
  // If the team can't kill the boss by then, the spy "escapes with the boss"
  // and wins. Combined with hidden HP and the soft skip-vote, this creates
  // a real urgency that the spy can play around.
  const JINRO_MAX_ROUND = 10;

  function showVoteOption() {
    // Skip-vote: if the round timeout is reached, spy wins immediately.
    if (S.round >= JINRO_MAX_ROUND) {
      UI.toast(`⏰ ラウンド ${JINRO_MAX_ROUND} タイムアップ！ スパイの しょうり！`, 3000);
      return doDefeat();
    }
    const candidates = S.players.filter(p=>!p.dead);
    if (candidates.length <= 1) {
      S.round++; return startRound();
    }
    UI.renderVote(S.players, (target) => {
      S.voteUsedThisRound = true;
      const isSpy = target.role === "spy";
      // Skip-vote semantics: the voted player's NEXT TURN forfeits attack
      // power (cards still work). No instant-win on correct vote, no -HP on
      // wrong vote. Soft tactical pressure both ways.
      target._stunnedNextTurn = true;
      // Identical toast/log regardless of role — the team has to deduce from
      // later play whether the suspicion stuck on the spy. No instant-reveal.
      UI.toast(`🌀 ${target.name} は あやしまれた… つぎの ターン こうげき できない！`, 2400);
      S.log.push(`とうひょう → ${target.name}: こうげき ふうじ ×1ターン (じっさい: ${isSpy ? "スパイ" : "ヒーロー"})`);
      S.round++; startRound();
    }, () => {
      S.voteUsedThisRound = true;
      S.round++; startRound();
    });
  }

  // -------- WIN / LOSE --------
  function doVictory(opts={}) {
    if (S.mode === "pvp" && opts.winner) {
      // PvP K.O. is shown per-opponent at the kill moment by the attack flow.
      // PvP doesn't unlock cards — those are tied to defeating campaign bosses.
      UI.renderVictory({
        players: S.players, mode: "pvp", winner: opts.winner,
        stats: S.battleStats,
      }, () => location.reload(), () => location.reload());
      return;
    }
    // Hero mode: play the K.O. cinematic once before the victory screen.
    // _koShown flag guards against re-entry from any of the many paths that
    // can detect a core kill (card effects, normal attack, etc.).
    if (S.boss && !S.boss._koShown) {
      S.boss._koShown = true;
      UI.showKO(S.boss, () => doVictory(opts));
      return;
    }
    // Persistent progress: mark this boss as defeated and unlock its tied card
    // on first defeat. The victory screen will show the unlock banner.
    let unlockedCardId = null;
    let firstDefeat = false;
    if (S.boss && S.boss.id) {
      firstDefeat = Progress.recordDefeat(S.boss.id);
      if (firstDefeat) unlockedCardId = Cards.unlockCardForBoss(S.boss.id);
    }
    let spyWins = false;
    if (S.jinro) spyWins = false;
    UI.renderVictory({
      players: S.players, jinro: S.jinro, spyWins, boss: S.boss,
      stats: S.battleStats,
      firstDefeat, unlockedCardId,
    }, () => location.reload(), () => location.reload());
  }
  function doDefeat() {
    let spyWins = S.jinro;
    UI.renderDefeat({
      players: S.players, jinro: S.jinro, spyWins, boss: S.boss,
      stats: S.battleStats,
    }, () => location.reload(), () => location.reload());
  }

  return {
    start,
    AVATARS: AVATAR_POOL,
    ATTACK_TYPES,           // exposed so UI.renderMonsterAttackPicker can show labels
    attackTypeDef,
    buildAttackPlan,        // exposed for UI preview ("this would deal X damage")
    // Jinro HP-hidden gate so UI renders "?" / part-tier labels during the
    // round and exact numbers on the recap. Cheap getter — reads S.
    isHpHidden: () => !!(S && S.hpHiddenThisRound),
  };
})();
