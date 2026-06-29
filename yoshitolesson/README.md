# 🛠️ ゲームスタジオ 〜じぶんで ゲームを つくろう〜

A game-design studio for an 8-year-old, **fully in Japanese**, with a ずんだもん
(VOICEVOX) guide. Build a whole game from scratch and play it: design any number
of characters, design the levels, choose who starts and who is gacha, then press
play. Save/load to slots, and move a game to another device by **file, link, or QR**.

## What he can do

### キャラを つくる (Character Maker)
- Any number of characters, from **11 base looks** (crewmate, shark, croc, log,
  coffee, frog, monkey, forest, ballerina, cactus, cosmic cow).
- **Recolor** any of them with a hue/saturation slider, **resize**, and set
  **strength** (たいりょく / こうげき / はやさ).
- Toggle **abilities** (はやい, はんい, ふっとばし, クリティカル, バリアこわし,
  ゾンビキラー, タンク).
- Choose availability: **さいしょから (start)**, **ガチャ** (with a rarity), or **あとで (locked)**.
- A live data panel shows the variables changing as he drags.

### ステージを つくる (Stage Maker)
- Any number of stages. For each: enemy tower HP, your tower HP, coin rate,
  **enemy strength (mag)**, and a **wave** — tap enemies (red / float / zombie /
  black / alien / demon / metal / boss) to add them, with adjustable timing.

### あそぶ (Play)
- Plays the game he built in `play/` — title → stage select → battles → gacha →
  boss/power-up cutscenes — all generated from his design.

### セーブ・ロード + わたす (Save / Load / Share)
- Three save slots (autosaved).
- **ゲームを わたす**: produces a **QR code**, a **shareable link** (the whole game
  is base64-encoded in the URL hash), and a downloadable **file**. Scan the QR or
  open the link on another tablet and the game loads there. Big games fall back to
  link/file when they exceed QR capacity.

## Files
- `index.html` — the studio (home, character maker, stage maker, slots, share)
- `studio.js` — studio logic, game definition (GDEF) model, save/load/share
- `play/index.html`, `play/engine.js` — the data-driven game engine that runs his game
- `art.js` — shared character art + `recolor()` (hue tint) + the ずんだもん guide
- `snd.js` — iPad-safe audio bus (SFX + voice)
- `qrcode.js` — vendored QR code generator (qrcode-generator, MIT)
- `voice/` — ずんだもん guide clips + the game's cutscene voices (VOICEVOX)
- `tools/render-voice.py` — regenerates the guide voice (needs a VOICEVOX engine on :50021)
