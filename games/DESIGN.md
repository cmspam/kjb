# ESL Games Suite — Design Doc

6 mini-games for Japanese kids ages 7-12, built on top of the KJB (Kaiju
Brawl) cast. Each game lives in a subfolder of `eslgame/games/`. Shared
utilities at `games/shared/`.

## Source of truth — agent personas consulted

Six Japanese persona agents gave the design feedback this suite is built
on. The condensed gold from each:

### 1. 田中サクラ (mom of 8yo + 10yo)
- "Riku rage-quits if failure costs more than ~10 seconds of replay."
- Make sentences absurd. "Why is the kaiju narrating a textbook sentence? Make it ridiculous: 'Unkodilo eats my homework.'"
- Voice the **full sentence** at the end as a reward, not isolated words.
- Visible progression between sessions — Yuki needs to see her shelf of unlocked kaiju growing.

### 2. 山田みお (12yo, BT21/Pokemon/TikTok)
- Flappy Bird is "おばあちゃんのゲーム" (grandma's game). Old.
- "ALL viral kids' games hinge on the result screen kids can screenshot."
- Death-collection-of-100 mechanic. Diagnosis-meter results screens.
- Wants weird/long absurd sentences ("He is a camel old man who smells like poop and loves spaghetti")

### 3. 佐藤健太先生 (ESL teacher, 22 years)
- THE principle: **Audio first, always — child must hear English before seeing it written**. Otherwise Japanese phonology fossilizes.
- Article practice (a/an/the) is THE biggest Japanese-learner persistent gap (Butler 2002).
- R/L minimal-pair forced-choice with pictures (Iverson studies).
- Plural -s morphology with quantity scaffolding (Shibuya & Wakabayashi 2008).
- The one change that 10x's sentence-flappy: "Each word speaks itself when collected, full sentence plays after completion, kaiju acts it out."

### 4. 高橋ケンタ (10yo gamer)
- "Flappy Bird? My DAD played that." → make it loud/gross/fast.
- "Bombardiro flying, pipes are giant toilets, wrong word = he face-plants into poop with a loud splat."
- Combo meter. Super mode. Brainrot King chase if you're too slow.
- "If some cheerful voice goes 'Hiiii! Hellooo friend!' and makes me tap a glowing arrow 12 times before I can DO anything — gone. Deleted."

### 5. 鈴木はな (7yo absolute beginner)
- Wants: tap-the-color, feed-the-kaiju, hello/thank-you with mic.
- Cute kaiju only — Parfait Iwashi, Pampamu, Tako Tako.
- AFRAID OF Brainrot King + Catcherski Kranov — keep her in cute-kaiju zone.
- Stickers, dance animations, "Hana-chan sugoi!" praise.
- "He is a camel" — she doesn't know "camel"!

### 6. 岡本シゲキ (comedian)
- **5 comedy mechanics**: scatological+dignity collision; authority-figure breakdown; repetition-with-one-variable-wrong; wrong-mouth voice; the character who's just slightly off.
- **8 usable lines** (paste into games):
  1. (Bombardiro, success): "I detonated. With LOVE."
  2. (Temee, failure): "In my village... we also failed. It is tradition."
  3. (Tralalero, wrong, opera voice): "INCORRRRRRECTO MIO DIO~~~ ...try again sweetie."
  4. (Catcherski, deadpan): "I have stolen your answer. It was wrong. I am returning it."
  5. (Tako, bingo win): "BINGO. BONGO. BUNGO. ...the third one is my brother."
  6. (Parfait, level-up): "Ohonhonhon, you are now SLIGHTLY less of a sardine."
  7. (Anpan, NPC): "I cannot help you. I am bread. Also fish. It is complicated."
  8. (Brainrot, game over): "The cosmos has observed your spelling. The cosmos is disappointed but not surprised."
- **Biggest mistake**: "Explaining the joke or softening it for safety. Japanese kids smell condescension instantly."
- **Running gag**: Temee Sarmagchin's dentures fly across the screen at random across all 6 games. Never explained.

## Cross-game design rules

1. **Audio first** — every English word/phrase plays audio when revealed.
2. **Tap-to-skip never disables the audio replay** — kid can re-hear by tapping the word.
3. **Failure animations are silly, never shaming** — splat, faceplant, opera-cry, "I am bread also fish."
4. **Praise is in-character, deadpan-absurd, not cheerleader** — use Shigeki's lines.
5. **All games have 3 difficulty levels**: 入門 (Hana — single word/match), ふつう (kid — phrase), むずかしい (advanced — full sentence/typing/complex).
6. **Result screens are screenshot-worthy** — big visual, kaiju cameo, diagnosis sentence ("あなたは今日 Bombardiro Unkodilo です").
7. **Denture gag wired up via `window.startDenturesGag()`** in every game's init.

## Boss roster — quick reference for word/scene choices

| id | name (jp) | distinctive thing | English voice candidates |
|---|---|---|---|
| tako | タコタコ サフール | octopus, cone hat, 8 legs, ink | octopus, cap, leg, ink, salty |
| unko | ボンバルディロ ウンコディロ | poop, crocodile, bomb, robot | bomb, smell, brown, crocodile, fly |
| tral | トラララ パクパク | fish-frog, blue Nike, opera | fish, sing, jump, shoe |
| pamp | ブルブル パムパム | fluffy plushy, ribbons, pink | fluffy, soft, hug, pink |
| parfait | パフェ イワシ | parfait, sardine, cherry, cream | sweet, cold, fish, cream |
| anpan | アンパン マグロ | red-bean bun, tuna fish | bread, fish, red, sweet |
| temee | ティメー サルマクチン | camel, monkey, two humps, beard | camel, monkey, hump, old |
| catcherski | キャッチャースキー クレーノフ | UFO catcher, coins, hacked | claw, coin, robot, broken |
| brainrot | ブレインロット・キング | space lion, black hole, mane | lion, star, space, scary |

## Boss-friendliness ranking (for 7yo+ inclusion)

Hana-safe (cute): parfait, pamp, tako, tral
Mid: anpan, temee, unko
Scary (exclude from beginner modes): catcherski (the hacking glitch), brainrot (cosmic apocalypse)
