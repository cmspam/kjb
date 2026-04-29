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

  return { recordDefeat, isDefeated, getDefeatedAt, getAllDefeated, totalDefeated, reset };
})();
