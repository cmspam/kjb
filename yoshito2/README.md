# ⭐ ニャーニャコ大戦争 〜インポスター × ブレインロッド〜 (enhanced edition)

A **Battle Cats (にゃんこ大戦争)**-style lane-battle game, **fully in Japanese**, made
in Yoshito's image. Among Us impostors are **fused with Italian brainrot** characters,
and you build an army to smash the enemy tower.

This is the enhanced edition. New since the first cut:

- **8 stages with a stage-select map** (はじめての たたかい → さいしゅう けっせん).
  Each stage introduces one mechanic, gets harder, and scales enemy strength so
  the late stages stay tough. Clear a stage to unlock the next; first clears pay
  double XP and a guaranteed gacha point.
- **Cutscenes with real voices** (VOICEVOX). The boss taunts you with a big render
  when it arrives, and the **へんしん！⚡** button plays a power-up cutscene that
  buffs your whole army for a few seconds.
- **Sound everywhere**: an iPad-safe audio bus (one AudioContext, pre-decoded
  buffers) with synthesized SFX and pre-rendered voice clips. 🔊 toggles it.
- **2x speed** toggle in battle, plus screen shake on big hits.
- **Make-your-own character**: a hero you design in the companion lab
  (`../yoshitolesson/`) shows up here as a real, deployable character (the **MY**
  badge in the shop).

## How to play (あそびかた)

**Open `index.html` in any browser** — no install. Tap **▶ たたかう** to pick a
stage, or **⬆ きょうか** to upgrade your characters with XP.

- Tap a character card at the bottom to send it marching right. Each costs **おかね 🪙**.
- Money refills over time. Tap **お財布Lv↑** to make it refill faster and hold more
  (costs more each level — like the Worker Cat wallet).
- Smash the **てきのタワー** to **0** → **かんぜんしょうり (complete victory)**.
- If **あなたのタワー** hits 0 → defeat.

### Types & combat (ぞくせい)
Enemies have types: 赤 / 浮遊 / 黒 / ゾンビ / エイリアン / 悪魔 / メタル / 星.
- If your character is **めっぽう強い** against that type → **1.5× damage**.
- **ゾンビ** revive once when killed, and come back at **FULL HP (ぜんかい)** — unless a
  **ゾンビキラー** finishes them (then they stay dead).
- **メタル** has **low HP** but shrugs off every hit for just **1 damage** — no matter how
  strong. The only way through is a **クリティカル⚡**, which deals full (3×) damage.
- **クリティカル⚡** characters have a **20% chance per attack** to land a critical for
  **3× damage** (and it's the only thing that hurts メタル).
- **黒 / エイリアン / 悪魔** carry a **シールド (barrier)** that must be broken before they
  take damage. Only a **バリアブレイカー** pops it instantly.
- The **BOSS (ギガ・インポスター)** has a big shield, a **knockback shockwave** that pushes
  your army back, and **warps**: once it charges up (green glow), the next hit makes it
  **blink to the left of the unit that hit it**, slipping past your front line.
- Characters **march, lunge on attack, and flinch when hit** — and every hit puffs **dust**.

The waves are **relentless** — many enemies, heavy shields, and **two boss** appearances.
Keep a layered army, break shields with **レポート!** / **バリアブレイカー**, and level up.

### 🚨 レポート! (Report the Impostor)
When the **レポート!** button glows, tap it to call an **きんきゅうしょうしゅう
(Emergency Meeting)** — it **strips the シールド (barriers) off every enemy** on the field,
but does **NOT** damage their HP. Use it to expose shielded enemies so your army can hit
them. Charges over time.

### Your team (味方)
| キャラ | タイプ | とくちょう |
|--------|--------|-----------|
| クルーメイト | ノーマル | やすい・きほん。Lv3で赤に強い、Lv7でふっとばし |
| トラレロ・トラララ | ノーマル | すばやい。Lv4で浮遊に強い、Lv8でバリアブレイカー |
| トゥントゥンサフール | ノーマル | 範囲こうげき＋ふっとばし。Lv9でクリティカル。ときどき **ホームラン**（バットで野球ボールを とばす遠距離こうげき＋ノックバック） |
| ボンバルディーロ | ノーマル | たいりょく多い・範囲。Lv4でエイリアン、Lv8で悪魔に強い |
| カプチーノ・アサシン | **EX** | 超こうげき・すばやい・**ゾンビキラー** |
| ボネカ・アンバラブ | **EX** | **バリアブレイカー**・ふっとばし・タンク |

### 🎰 Gacha (ガチャ)
Clearing the game is a **lucky draw** for **ガチャポイント**: sometimes you get **0**,
usually **1**, and rarely **2** (大あたり!). Spend points to **まわす** (pull):
- Every pull gives a **character**, picked by **rarity**: ★ノーマル 50% / ★★レア 30% /
  ★★★スーパーレア 14% / ★★★★レジェンド 6% (shown with color-coded frames).
- If you **already own** that character, it **converts to XP** (more XP for higher rarity).
- New surprise brainrot characters in the pool:
  チンパンジーニ・バナニーニ (★), ブルブル・パタピム (★★),
  バレリーナ・カプチーナ (★★), リリリ・ラリラ (★★★ タイムストップ),
  and the legendary **ラ・ヴァカ・サトゥルノ** (★★★★ Saturn cow).

### Upgrades (きょうか)
Spend **XP** (earned by winning and defeating enemies) to:
- **つよくする** — level up a character: stronger stats, **bigger + glowing aura**, and
  **new powers** unlock at certain levels (shown as Lv-tagged badges).
- A character also **visibly evolves** as it levels: a **★ at Lv3**, a **silver crown at
  Lv5**, a **jeweled gold crown at Lv8**, and **wings + sparkles at Lv10**.
- **かいきん** — unlock the **EX characters** with XP.

Progress (XP, levels, unlocks) is **saved automatically** in your browser.

### Keyboard (computer)
**1–9** deploy your owned characters · **W** upgrade wallet · **R** Report

## Files
- `index.html` — title / stage-select / shop / battle / gacha / cutscene screens, all UI
- `art.js` — every character & base, hand-drawn as SVG (incl. the fused impostors and boss)
- `game.js` — the engine: stages, economy, XP/upgrades, types, barriers, zombies, boss,
  hero power-up, cutscenes, particles, the lab's custom character
- `snd.js` — iPad-safe audio bus: synthesized SFX + pre-rendered voice playback
- `voice/` — VOICEVOX voice clips (boss taunts, power-up shouts, win/lose)
- `tools/render-voice.py` — regenerates `voice/` (needs a VOICEVOX engine on :50021)

たのしんでね！🎮🦈👟🐊
