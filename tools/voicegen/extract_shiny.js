#!/usr/bin/env node
// Walk window.I18N.shinyOverrides and emit per-boss JSON of {hash, text}
// entries to render with Edge TTS. Each boss has its own .voice attribute
// that drives the TTS voice selection during render. Hash matches what
// audio.playBossLine computes at runtime (djb2 over stripFurigana +
// whitespace-collapsed) so shiny lines line up with assets/voices/
// <bossId>_shiny/<hash>.opus.

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const OUT_DIR = path.join(__dirname, "work", "shiny_lines");
fs.mkdirSync(OUT_DIR, { recursive: true });

// Stub the I18N register hook then load locale files.
global.window = global;
global.I18N = { register: () => {}, shinyOverrides: null };
const localeJa = fs.readFileSync(path.join(ROOT, "js", "locale", "ja.js"), "utf8");
new Function("window", localeJa)(global);
const shinyJa = fs.readFileSync(path.join(ROOT, "js", "locale", "ja_shiny.js"), "utf8");
new Function("window", shinyJa)(global);

const overrides = global.I18N.shinyOverrides || {};

function djb2(s) {
  let h = 5381 | 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return ((h >>> 0).toString(16)).padStart(8, "0");
}
function stripFurigana(s) {
  return String(s || "").replace(/([一-鿿々ヶ]+)\[([^\]]+)\]/g, "$2");
}
function clean(s) {
  return stripFurigana(s).replace(/\s+/g, " ").trim();
}
function entry(text, kind) {
  const c = clean(text);
  if (!c) return null;
  return { text: c, raw: String(text), kind, hash: djb2(c) };
}

const summary = [];
for (const [bossId, ov] of Object.entries(overrides)) {
  const seen = new Set();
  const lines = [];
  const push = (e) => {
    if (!e || seen.has(e.hash)) return;
    seen.add(e.hash);
    lines.push(e);
  };
  push(entry(ov.catchphrase, "catchphrase"));
  for (const atk of (ov.attacks || [])) {
    push(entry(atk.name, "attack-name"));
    for (const p of (atk.phrases || [])) push(entry(p, "attack-phrase"));
  }
  for (const h of (ov.hits || [])) push(entry(h, "hit"));
  if (ov.taunts) {
    for (const [pool, items] of Object.entries(ov.taunts)) {
      const kind = (pool === "slingshot" || pool === "rage") ? "attack-name" : "attack-phrase";
      for (const t of (items || [])) push(entry(t, kind));
    }
  }
  fs.writeFileSync(path.join(OUT_DIR, `${bossId}.json`),
    JSON.stringify({
      voice: ov.voice,
      style: ov.style || null,
      styleDefault: ov.styleDefault || null,
      lines
    }, null, 2));
  summary.push(`${bossId} (${ov.voice}${ov.style?` style:${ov.style}`:''}): ${lines.length} lines`);
}
console.log(summary.join("\n"));
