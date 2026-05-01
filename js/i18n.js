// I18N system. Locales register dictionaries via window.I18N.register(); the
// active locale's dictionary is mirrored onto window.JP for backward-compat
// with the rest of the codebase (game.js, ui.js, monsters.js, cards.js still
// read JP.foo as before — they don't have to know about the locale system).
//
// To add a new locale (e.g., zh):
//   1. Copy js/locale/ja.js → js/locale/zh.js, change "ja" to "zh", translate
//      the strings inside.
//   2. Add <script src="js/locale/zh.js"></script> to index.html after ja.js.
//   3. The user picks it via ?lang=zh URL param or localStorage `kjb_locale`.
//
// What this system covers:
//   - All UI strings (locale dict body)
//   - Boss flavor: name, catchphrase, attacks, hits, backstory, part names
//     (under `bosses.<id>`)
//   - Card flavor: name + description text (under `cards.<id>`)
//   - Funny default player-name pool (`funny_names`)
//
// What this system does NOT yet cover (next layer of localization work):
//   - data/questions_level*.js — these contain bilingual EN/JA vocab tuples
//     and Japanese-language prompt strings. Localizing them means duplicating
//     each file per locale (e.g., data/zh/questions_level2.js) and swapping
//     the JA column. The engine's question loader is global so adding more
//     locale-specific banks is mostly a load-order tweak in index.html.
//
// Note: field names like `name_jp` and `text_jp` are historical. They hold
// the *active locale's* string, not literally Japanese. We kept the names
// stable so the rest of the engine doesn't need touching.
window.I18N = (() => {
  const locales = {};
  let active = "ja";

  // Apply the active locale to window.JP. We mutate the existing JP object
  // (rather than reassigning the property) so any captured `const jp = JP`
  // reference stays live.
  function applyActive() {
    const dict = locales[active] || locales.ja || Object.values(locales)[0];
    if (!dict) return;
    if (!window.JP) window.JP = {};
    Object.keys(window.JP).forEach(k => delete window.JP[k]);
    Object.assign(window.JP, dict);
    // Convenience globals legacy code reads directly.
    window.FUNNY_NAMES = dict.funny_names || [];
    if (document && document.documentElement) document.documentElement.lang = active;
  }

  function register(code, dict) {
    locales[code] = dict;
    if (active === code) applyActive();
    // Auto-activate the first locale registered, in case it's not the default
    // and no other has been registered yet.
    else if (Object.keys(locales).length === 1 && !locales[active]) applyActive();
  }

  function setLocale(code) {
    if (!locales[code]) {
      console.warn(`I18N: unknown locale "${code}", staying on "${active}".`);
      return false;
    }
    active = code;
    try { localStorage.setItem("kjb_locale", code); } catch (_) {}
    applyActive();
    return true;
  }
  function getLocale()   { return active; }
  function getDict()     { return locales[active]; }
  function getAvailable(){ return Object.keys(locales); }

  // Flat-key lookup with fallback chain: active → ja → undefined.
  function t(key) {
    const a = locales[active];
    if (a && key in a) return a[key];
    const j = locales.ja;
    if (j && key in j) return j[key];
    return undefined;
  }

  // Boss flavor lookup. Returns {} if missing in every dict so callers can
  // safely destructure.
  function boss(id) {
    const a = locales[active];
    if (a && a.bosses && a.bosses[id]) return a.bosses[id];
    const j = locales.ja;
    if (j && j.bosses && j.bosses[id]) return j.bosses[id];
    return {};
  }
  // Card flavor lookup. Returns { name_jp, text_jp } or {} if missing.
  function card(id) {
    const a = locales[active];
    if (a && a.cards && a.cards[id]) return a.cards[id];
    const j = locales.ja;
    if (j && j.cards && j.cards[id]) return j.cards[id];
    return {};
  }

  // Read the desired locale at startup (URL ?lang=… or localStorage). The
  // string is remembered now and applied as soon as a matching locale registers.
  (function init() {
    let want = null;
    try {
      const url = new URLSearchParams(location.search);
      want = url.get("lang") || localStorage.getItem("kjb_locale");
    } catch (_) {}
    if (want) active = want;
    if (document && document.documentElement) document.documentElement.lang = active;
  })();

  return { register, setLocale, getLocale, getDict, getAvailable, t, boss, card };
})();

// ---- Utility helpers (locale-independent) ----

window.pickRand = (arr) => arr[Math.floor(Math.random()*arr.length)];

// Pick from `arr` avoiding entries seen in `historyArr` (the most recent N
// picks). Mutates historyArr — caller passes the same ring buffer each call
// (e.g. a stash on a boss object). Falls back to pickRand for tiny pools.
window.pickRandNoRepeat = function(arr, historyArr, avoidLast) {
  if (!Array.isArray(arr) || !arr.length) return undefined;
  const avoid = Math.min(avoidLast == null ? 3 : avoidLast, Math.max(0, arr.length - 1));
  if (avoid <= 0 || arr.length <= 1) return arr[0];
  const hist = Array.isArray(historyArr) ? historyArr : [];
  let pick;
  let tries = 0;
  do {
    pick = arr[(Math.random() * arr.length) | 0];
    tries++;
  } while (hist.includes(pick) && tries < 12);
  if (Array.isArray(historyArr)) {
    historyArr.push(pick);
    while (historyArr.length > avoid) historyArr.shift();
  }
  return pick;
};

// Furigana helper. Authors write 漢字[よみ] and this turns it into proper
// HTML <ruby> tags so kanji shows the hiragana reading above it (kids' book
// style). Locale-independent — non-JA locales simply won't use the markup.
window.furigana = function(s) {
  if (!s) return "";
  return String(s).replace(/([一-鿿々ヶ]+)\[([^\]]+)\]/g, '<ruby>$1<rt>$2</rt></ruby>');
};
