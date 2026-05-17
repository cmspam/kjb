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

// ---- Cross-game running gag (Shigeki's denture gambit) ----
//
// Every ~30s, a 1-in-30 roll fires: Temee Sarmagchin's dentures fly across
// the screen, hang briefly mid-flight (the silence sells the joke), then
// continue off the other side. Never explained, never announced — build
// the legend across all 6 games. The dentures themselves are an SVG;
// no audio (visual joke only). Easter-egg, not a feature.
window.startDenturesGag = (function () {
  let started = false;
  function spawn() {
    const teeth = document.createElement("div");
    teeth.className = "denture-teeth";
    teeth.innerHTML = `🦷`;
    teeth.style.cssText = `
      position: fixed; top: ${20 + Math.random() * 50}%; left: -120px;
      font-size: ${56 + Math.random() * 40}px;
      z-index: 999; pointer-events: none;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35));
      will-change: transform;
    `;
    document.body.appendChild(teeth);
    const distance = window.innerWidth + 240;
    const peak = 80 + Math.random() * 60;
    const rotEnd = 720 + Math.random() * 360;
    teeth.animate(
      [
        { transform: `translate(0, 0) rotate(0deg)` },
        { transform: `translate(${distance/2}px, -${peak}px) rotate(${rotEnd/2}deg)`, offset: 0.5 },
        { transform: `translate(${distance}px, 0) rotate(${rotEnd}deg)` },
      ],
      { duration: 3200, easing: "cubic-bezier(.22,.61,.36,1)", fill: "forwards" }
    );
    setTimeout(() => { try { teeth.remove(); } catch (_) {} }, 3400);
  }
  return function startDenturesGag() {
    if (started) return;
    started = true;
    setInterval(() => {
      if (Math.random() < 1 / 30) spawn();
    }, 1000);
  };
})();
