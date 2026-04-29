// Cards. Each card has a play(ctx) function. ctx provides refs to game state.
// type:"action" cards apply immediately. type:"reaction" needs target.
//
// Flavor text (name_jp, text_jp) lives in the locale dictionary under
// JP.cards[id] and is merged in at byId()/buildDeck() time. The mechanical
// fields (cost, effect, needsTarget, etc.) stay here.
window.Cards = (() => {

  // Effect type constants used by game.js when resolving plays
  const C = {
    DMG_BONUS: "dmg_bonus",      // adds dmg to current attack
    HEAL_SELF: "heal_self",
    HEAL_TARGET: "heal_target",
    HEAL_TEAM: "heal_team",
    SHIELD_SELF: "shield_self",
    SHIELD_TEAM: "shield_team",
    ENERGY: "energy",
    DRAW: "draw",
    DOUBLE_NEXT: "double_next",  // next teammate hit ×2
    HIT_RANDOM_2: "hit_random_2",// hits 2 random parts for 2 each
    REVEAL_ROLE: "reveal_role",
    SKIP_BOSS_ATK: "skip_boss_atk",
    REROLL_Q: "reroll_q",
    HINT: "hint",                // remove one wrong answer
  };

  // Mechanical card definitions (no localizable strings). Display text comes
  // from the active locale via window.JP.cards[id] (or window.I18N.card(id)).
  const POOL_BASE = [
    { id:"fart_bomb",  icon:"💨", cost:1, effect:{type:C.DMG_BONUS, v:3},    needsTarget:false, attackMod:true },
    { id:"mega_punch", icon:"👊", cost:2, effect:{type:C.DMG_BONUS, v:5},    needsTarget:false, attackMod:true },
    { id:"unko_shield",icon:"🛡️", cost:1, effect:{type:C.SHIELD_SELF},        needsTarget:false },
    { id:"team_shield",icon:"✨", cost:2, effect:{type:C.SHIELD_TEAM},        needsTarget:false },
    { id:"heal",       icon:"🍌", cost:1, effect:{type:C.HEAL_TARGET, v:5},   needsTarget:true, targetType:"player" },
    { id:"team_heal",  icon:"🌬️", cost:2, effect:{type:C.HEAL_TEAM, v:3},     needsTarget:false },
    { id:"energy",     icon:"🥤", cost:0, effect:{type:C.ENERGY, v:2},        needsTarget:false },
    { id:"draw_two",   icon:"🎴", cost:1, effect:{type:C.DRAW, v:2},          needsTarget:false },
    { id:"combo",      icon:"🔥", cost:1, effect:{type:C.DOUBLE_NEXT},        needsTarget:false },
    { id:"spread",     icon:"👅", cost:2, effect:{type:C.HIT_RANDOM_2, v:2},  needsTarget:false, attackMod:false },
    { id:"reveal",     icon:"🔍", cost:1, effect:{type:C.REVEAL_ROLE},        needsTarget:true, targetType:"player" },
    { id:"escape",     icon:"🏃", cost:1, effect:{type:C.SKIP_BOSS_ATK},      needsTarget:false },
    { id:"hint",       icon:"💡", cost:0, effect:{type:C.HINT},               needsTarget:false, beforeQ:true },
    { id:"reroll",     icon:"💪", cost:1, effect:{type:C.REROLL_Q},           needsTarget:false, beforeQ:true },
  ];

  // Look up flavor for a card id from the active locale, with safe fallback.
  function flavor(id) {
    if (window.I18N && typeof window.I18N.card === "function") return window.I18N.card(id);
    return (window.JP && window.JP.cards && window.JP.cards[id]) || {};
  }
  function withFlavor(c) {
    if (!c) return c;
    const f = flavor(c.id);
    return { ...c, name_jp: f.name_jp || c.id, text_jp: f.text_jp || "" };
  }

  // Public POOL (read-only convenience): mechanical fields + active-locale flavor.
  // Cards drawn into hands are fresh copies via buildDeck/byId, so locale switches
  // affect newly-built decks; existing cards in hand keep the old text until the
  // next deck build (acceptable since locale switches require a reload anyway).
  const POOL = POOL_BASE.map(withFlavor);

  // ---- Card unlocks via boss defeats ----
  // Always-available "starter" cards: damage, basic shield, energy, escape,
  // hint, basic draw. Everything else is unlocked by defeating a specific boss.
  const ALWAYS_UNLOCKED = new Set([
    "fart_bomb", "mega_punch", "unko_shield",
    "energy", "draw_two", "escape", "hint", "reveal",
  ]);
  // Each boss defeat unlocks one card. Mapping picked for thematic flavor:
  //   tako (8-legged)         → spread     (multi-target tongue)
  //   unko (poop bomb)        → team_shield (smelly cloud protects all)
  //   tral (operatic singer)  → combo       (chain attacks)
  //   pamp (fluffy plushie)   → heal        (a soft hug heals)
  //   parfait (sweet treat)   → team_heal   (sweets to share)
  //   anpan (new-face hero)   → reroll      (try again, like a fresh face)
  const BOSS_UNLOCKS = {
    tako: "spread",
    unko: "team_shield",
    tral: "combo",
    pamp: "heal",
    parfait: "team_heal",
    anpan: "reroll",
  };

  function loadUnlocked() {
    try { return JSON.parse(localStorage.getItem("kjb_unlocked_cards") || "[]"); }
    catch(_) { return []; }
  }
  function saveUnlocked(arr) {
    try { localStorage.setItem("kjb_unlocked_cards", JSON.stringify(arr)); } catch(_) {}
  }
  function isUnlocked(id) {
    if (ALWAYS_UNLOCKED.has(id)) return true;
    return loadUnlocked().includes(id);
  }
  // Returns the newly-unlocked card id if this boss defeat unlocked something
  // for the first time; null otherwise.
  function unlockCardForBoss(bossId) {
    const cardId = BOSS_UNLOCKS[bossId];
    if (!cardId || ALWAYS_UNLOCKED.has(cardId)) return null;
    const have = loadUnlocked();
    if (have.includes(cardId)) return null;
    have.push(cardId);
    saveUnlocked(have);
    return cardId;
  }
  function getBossUnlockMap() { return Object.assign({}, BOSS_UNLOCKS); }

  // Build the deck: more copies of cheap cards
  function buildDeck(jinroMode) {
    const deck = [];
    const counts = {
      fart_bomb: 6, mega_punch: 3, unko_shield: 4, team_shield: 2, heal: 4,
      team_heal: 2, energy: 4, draw_two: 3, combo: 3, spread: 2,
      reveal: jinroMode ? 3 : 0, escape: 3, hint: 4, reroll: 0
    };
    for (const c of POOL_BASE) {
      if (!isUnlocked(c.id)) continue; // locked until the right boss is defeated
      const n = counts[c.id] || 0;
      for (let i = 0; i < n; i++) deck.push(withFlavor(c));
    }
    // shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random()*(i+1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }
  function byId(id) { return withFlavor(POOL_BASE.find(c => c.id === id)); }

  return { POOL, buildDeck, byId, C,
           isUnlocked, unlockCardForBoss, getBossUnlockMap };
})();
