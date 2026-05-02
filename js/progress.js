// Cross-session progress tracking. Single localStorage source of truth for
// which bosses the kid has defeated, with timestamps. Used by the Compendium
// (📖 ずかん) screen and by the card-unlock pipeline.
//
// Card unlocks live in js/cards.js (kjb_unlocked_cards) since they're tied
// to the card system. This module owns kjb_defeated only.
window.Progress = (() => {
  const KEY = "kjb_defeated";

  function loadAll() {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; }
    catch(_) { return {}; }
  }
  function saveAll(obj) {
    try { localStorage.setItem(KEY, JSON.stringify(obj)); } catch(_) {}
  }

  // Returns true if this is the first time defeating bossId.
  function recordDefeat(bossId) {
    if (!bossId) return false;
    const all = loadAll();
    const isFirst = !all[bossId];
    if (isFirst) { all[bossId] = Date.now(); saveAll(all); }
    return isFirst;
  }
  function isDefeated(bossId)   { return !!loadAll()[bossId]; }
  function getDefeatedAt(bossId){ return loadAll()[bossId] || 0; }
  function getAllDefeated()     { return loadAll(); }
  function totalDefeated()      { return Object.keys(loadAll()).length; }

  // Reset (debug / "start over" feature). Not wired to any UI yet but useful
  // from the console.
  function reset() { try { localStorage.removeItem(KEY); } catch(_) {} }

  // ---------- SHINY TRACKING ----------
  // Persistent log of shiny encounters and defeats per boss id. Drives the
  // ✨ marker on the boss-picker map and unlocks the shiny variant card on
  // first defeat. Stored separately from defeated/stats so resetting one
  // doesn't blow away the others.
  const SHINY_KEY = "kjb_shiny";
  function loadShiny() {
    try { return JSON.parse(localStorage.getItem(SHINY_KEY) || "{}") || {}; }
    catch(_) { return {}; }
  }
  function saveShiny(s) {
    try { localStorage.setItem(SHINY_KEY, JSON.stringify(s)); } catch(_) {}
  }
  function recordShinyEncounter(bossId) {
    if (!bossId) return;
    const s = loadShiny();
    if (!s[bossId]) s[bossId] = { firstSeen: Date.now(), defeated: 0 };
    s[bossId].lastSeen = Date.now();
    s[bossId].seen = (s[bossId].seen || 0) + 1;
    saveShiny(s);
  }
  function recordShinyDefeat(bossId) {
    if (!bossId) return false;
    const s = loadShiny();
    if (!s[bossId]) s[bossId] = { firstSeen: Date.now(), seen: 1 };
    const isFirst = !s[bossId].defeated;
    s[bossId].defeated = (s[bossId].defeated || 0) + 1;
    if (isFirst) s[bossId].firstDefeated = Date.now();
    saveShiny(s);
    return isFirst;
  }
  function hasShinyDefeated(bossId) {
    const s = loadShiny();
    return !!(s[bossId] && s[bossId].defeated > 0);
  }
  function hasShinyEncountered(bossId) {
    const s = loadShiny();
    return !!s[bossId];
  }
  function getAllShiny() { return loadShiny(); }
  function resetShiny() { try { localStorage.removeItem(SHINY_KEY); } catch(_) {} }

  // ---------- LIFETIME STATS (N5) ----------
  // Persistent across sessions: aggregate stats kids accumulate over many
  // battles. Drives rank progression (NOVICE → LEGEND) and the title-screen
  // status line. Stored separately from defeated-bosses so a reset of one
  // doesn't blow away the other.
  const STATS_KEY = "kjb_stats";
  const RANKS = [
    { id: "novice",     name_jp: "🟢 ノービス",     min: 0    },
    { id: "apprentice", name_jp: "🔵 アプレンティス", min: 60   },
    { id: "ace",        name_jp: "🟣 エース",         min: 250  },
    { id: "champion",   name_jp: "🟠 チャンピオン",   min: 600  },
    { id: "legend",     name_jp: "🌟 レジェンド",     min: 1200 },
  ];
  function loadStats() {
    try { return JSON.parse(localStorage.getItem(STATS_KEY) || "{}") || {}; }
    catch(_) { return {}; }
  }
  function saveStats(s) {
    try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch(_) {}
  }
  // Record a finished battle. Caller passes a small summary; we accumulate.
  // Won / lost is just += 1 each. Questions and damage stats sum up. Best
  // values are kept as max-of.
  function recordBattle(summary) {
    const s = loadStats();
    s.battles      = (s.battles      || 0) + 1;
    s.wins         = (s.wins         || 0) + (summary && summary.won ? 1 : 0);
    s.losses       = (s.losses       || 0) + (summary && !summary.won ? 1 : 0);
    s.questionsRight = (s.questionsRight || 0) + (summary && summary.questionsRight || 0);
    s.questionsWrong = (s.questionsWrong || 0) + (summary && summary.questionsWrong || 0);
    if (summary && summary.biggestHit) {
      s.bestHit = Math.max(s.bestHit || 0, summary.biggestHit);
    }
    if (summary && summary.bestCombo) {
      s.bestCombo = Math.max(s.bestCombo || 0, summary.bestCombo);
    }
    if (summary && summary.bossId && summary.won) {
      s.bossesDefeated = s.bossesDefeated || {};
      s.bossesDefeated[summary.bossId] = (s.bossesDefeated[summary.bossId] || 0) + 1;
    }
    saveStats(s);
    return s;
  }
  function getStats() { return loadStats(); }
  function rankFor(stats) {
    const s = stats || loadStats();
    // Rank score: weighted blend so wins matter most but answered Qs help
    // a kid grinding through level-1 questions still feel progress.
    const score = (s.wins || 0) * 12 + (s.questionsRight || 0) + (s.bossesDefeated ? Object.keys(s.bossesDefeated).length * 30 : 0);
    let pick = RANKS[0];
    for (const r of RANKS) if (score >= r.min) pick = r;
    // Find the next rank for "X more to next rank" UI.
    const nextIdx = RANKS.indexOf(pick) + 1;
    const next = nextIdx < RANKS.length ? RANKS[nextIdx] : null;
    return { rank: pick, score, next, toNext: next ? Math.max(0, next.min - score) : 0 };
  }
  function getFavoriteBoss() {
    const s = loadStats();
    if (!s.bossesDefeated) return null;
    let best = null, bestN = 0;
    for (const id in s.bossesDefeated) {
      if (s.bossesDefeated[id] > bestN) { best = id; bestN = s.bossesDefeated[id]; }
    }
    return best;
  }
  function resetStats() { try { localStorage.removeItem(STATS_KEY); } catch(_) {} }

  return {
    recordDefeat, isDefeated, getDefeatedAt, getAllDefeated, totalDefeated, reset,
    recordBattle, getStats, rankFor, getFavoriteBoss, resetStats, RANKS,
    recordShinyEncounter, recordShinyDefeat, hasShinyDefeated, hasShinyEncountered,
    getAllShiny, resetShiny,
  };
})();
