# ⭐ ニャーニャコ大戦争 〜インポスター × ブレインロッド〜

A **Battle Cats (にゃんこ大戦争)**-style lane-battle game, **fully in Japanese**, made
in Yoshito's image. Among Us impostors are **fused with Italian brainrot** characters,
and you build an army to smash the enemy tower.

## How to play (あそびかた)

**Open `index.html` in any browser** — no install. Tap **▶ たたかう** to fight,
or **⬆ きょうか** to upgrade your characters with XP.

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
- The **BOSS (ギガ・インポスター)** has a barrier, **warps** forward, and does a
  **knockback shockwave** that pushes your army back.
- Characters **march, lunge on attack, and flinch when hit** — and every hit puffs **dust**.

### 🚨 レポート! (Report the Impostor)
When the **レポート!** button glows, tap it to call an **きんきゅうしょうしゅう
(Emergency Meeting)** — it pops barriers and **blasts every impostor** on the field.
Charges over time.

### Your team (味方)
| キャラ | タイプ | とくちょう |
|--------|--------|-----------|
| クルーメイト | ノーマル | やすい・きほん。Lv3で赤に強い、Lv7でふっとばし |
| トラレロ・トラララ | ノーマル | すばやい。Lv4で浮遊に強い、Lv8でバリアブレイカー |
| トゥントゥンサフール | ノーマル | 範囲こうげき＋ふっとばし。Lv9でクリティカル |
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
- `index.html` — title / shop / battle screens, all UI, Japanese text
- `art.js` — every character & base, hand-drawn as SVG (incl. the fused impostors and boss)
- `game.js` — the engine: economy, XP/upgrades, types, barriers, zombies, boss, particles

たのしんでね！🎮🦈👟🐊
