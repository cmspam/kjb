#!/usr/bin/env node
// Walk the question pool and emit a JSON array of unique English strings
// that need pre-rendered audio. Each entry: { hash, text }.
//
// What counts as English:
//   • q.audio (always)
//   • q.options[i] when it looks ASCII (a-z A-Z digits/space/punct)
//   • q.prompt when it looks ASCII (so "I ___ a student." gets rendered)
//
// Hash is djb2 over the raw text (matches js/audio.js _hashFor).
// Output: tools/voicegen/work/en_lines.json

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const OUT_DIR = path.join(__dirname, "work");
fs.mkdirSync(OUT_DIR, { recursive: true });

// Stub the registration globals the question files write into.
global.window = global;
global.QUESTIONS_LEVEL0 = []; global.QUESTIONS_LEVEL1 = [];
global.QUESTIONS_LEVEL2 = []; global.QUESTIONS_LEVEL3 = []; global.QUESTIONS_LEVEL4 = [];

// Load each level. Each file ends with `window.QUESTIONS_LEVEL<N> = all;` so
// our stubbed globals get filled in.
for (const lvl of [0, 1, 2, 3, 4]) {
  require(path.join(ROOT, "data", `questions_level${lvl}.js`));
}

const all = [].concat(
  global.QUESTIONS_LEVEL0, global.QUESTIONS_LEVEL1,
  global.QUESTIONS_LEVEL2, global.QUESTIONS_LEVEL3, global.QUESTIONS_LEVEL4
);

function djb2(s) {
  let h = 5381 | 0;
  const str = String(s);
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return ((h >>> 0).toString(16)).padStart(8, "0");
}

// Test: is this string ASCII English (no Japanese chars), starts with a letter
// or punctuation, has actual word chars? Filters out e.g. emoji-only options.
function isEnglishLike(s) {
  if (typeof s !== "string") return false;
  const t = s.trim();
  if (!t) return false;
  // Skip if any Japanese (hiragana/katakana/CJK)
  if (/[぀-ヿ㐀-鿿]/.test(t)) return false;
  // Must contain at least one ASCII letter
  if (!/[a-zA-Z]/.test(t)) return false;
  return true;
}

const seen = new Set();
const out = [];
function add(s) {
  if (!isEnglishLike(s)) return;
  const trimmed = String(s).trim();
  const hash = djb2(trimmed);
  if (seen.has(hash)) return;
  seen.add(hash);
  out.push({ hash, text: trimmed });
}

for (const q of all) {
  if (!q) continue;
  if (q.audio) add(q.audio);
  if (q.prompt) add(q.prompt);
  if (Array.isArray(q.options)) for (const o of q.options) add(o);
}

// Non-question English strings that the engine speaks. Settings voice-test
// button + any other UI prompt that calls SND.speak() with a hardcoded
// English line. Append after the question pass so they get the same opus
// pipeline.
const extras = [
  "Hello! Let's play.",
];
for (const e of extras) add(e);

fs.writeFileSync(path.join(OUT_DIR, "en_lines.json"), JSON.stringify(out, null, 0));
console.log(`extracted ${out.length} unique English lines`);
