// Shared boss-art helper for the ESL games suite.
//
// Loads the KJB monster factories so games can render any kaiju SVG via
// Monsters.renderBossSVG(boss). Also exposes a small index of all
// regular bosses (excludes the brainrot final boss by default, since
// kids reaching the brainrot fight in KJB is itself a milestone — we
// don't want to spoil the cosmic-lion reveal across the learning suite).
//
// Usage: in your game's index.html, load i18n.js, locale/ja.js,
// locale/ja_shiny.js, monsters.js, then this file.
window.GamesArt = (() => {
  let _bosses = null;

  // Build (and cache) the list of regular boss instances.
  function bosses() {
    if (_bosses) return _bosses;
    if (!window.Monsters || !window.Monsters.listFactories) return [];
    _bosses = window.Monsters.listFactories().map(f => f());
    return _bosses;
  }

  // Look up a boss by id. Force-rebuild = fresh instance (e.g. to
  // mutate .shiny without polluting the cached one).
  function get(bossId, fresh) {
    if (!window.Monsters || !window.Monsters.listFactories) return null;
    if (fresh) {
      const fac = window.Monsters.listFactories().find(f => f().id === bossId);
      return fac ? fac() : null;
    }
    return bosses().find(b => b.id === bossId) || null;
  }

  function renderSVG(boss) {
    if (!boss || !window.Monsters || !window.Monsters.renderBossSVG) return "";
    return window.Monsters.renderBossSVG(boss);
  }

  function renderById(bossId) {
    return renderSVG(get(bossId));
  }

  // Small emoji icon for menu tiles where the full SVG is overkill.
  const ICON = {
    tako:       "🐙",
    unko:       "💩",
    tral:       "🐟",
    pamp:       "🧸",
    parfait:    "🍦",
    anpan:      "🍞",
    temee:      "🐫",
    catcherski: "🎮",
    brainrot:   "🦁",
  };
  function emoji(bossId) { return ICON[bossId] || "👾"; }

  // Pretty JP+EN name pair from the locale.
  function name(boss) {
    if (!boss) return { jp: "", en: "" };
    return { jp: boss.name_jp || "", en: boss.name_en || "" };
  }

  return { bosses, get, renderSVG, renderById, emoji, name };
})();

// (Cross-game running gag removed — feedback was it wasn't funny.)
window.startDenturesGag = function () { /* no-op */ };
