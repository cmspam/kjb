# 🧑‍💻 コードで あそぼう！ 〜ニャーニャコ プログラミング〜

A tiny, hands-on programming lab for an 8-year-old, **fully in Japanese**
(hiragana, with ずんだもん voice). It teaches real coding and game-design ideas
through the characters from the ニャーニャコ大戦争 game next door (`../yoshito2/`).

No typing. Everything is sliders, color swatches and taps. Every change updates a
live **code panel** and an instant **mini preview**, so the link between "the code"
and "what happens" is always on screen. ずんだもん introduces each lesson and cheers
with a real (VOICEVOX) voice.

## The five lessons

1. **へんすう (variables)** — drag たいりょく / こうげき / おおきさ on a crewmate,
   then たたかう！ to beat an enemy. Bigger numbers, stronger hero.
2. **いろ (values)** — pick a body and visor color, see `color = "#..."` update, and
   **add your hero to the game**.
3. **くりかえし (loops)** — a `for` loop spawns exactly the number of crewmates you set.
4. **もし〜なら (if / else)** — beat a metal enemy by choosing the branch that matches
   the `if`.
5. **つくってみよう (design)** — tap enemies into a `wave = [...]` array and press play to
   watch the level you authored.

## The payoff

The hero you design in lessons 1 and 2 is saved to shared browser storage and shows
up in `../yoshito2/` as a real, deployable character (the **MY** badge in the shop).
Change a few numbers and colors here, then go fight with the character you made.

## Files
- `index.html` — home (lesson map) + lesson screen + clear overlay
- `lesson.js` — lesson engine, the five lessons, the ずんだもん guide, custom-character save
- `art.js` — shared character art (a copy of the game's, plus the ずんだもん sprite)
- `snd.js` — iPad-safe audio bus (SFX + voice)
- `voice/` — ずんだもん guide clips (VOICEVOX)
- `tools/render-voice.py` — regenerates `voice/` (needs a VOICEVOX engine on :50021)
