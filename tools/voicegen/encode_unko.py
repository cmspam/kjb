#!/usr/bin/env python3
"""
Encode user-recorded m4a unko-shiny lines into the runtime opus pipeline.

Inputs:
  ~/Documents/Sound Recordings/Recording.m4a       (line 1)
  ~/Documents/Sound Recordings/Recording (2).m4a   (line 2)
  ...
  ~/Documents/Sound Recordings/Recording (54).m4a  (line 54)

Hashes each line text via djb2 (matching js/audio.js _hashFor / playBossLine
runtime path), encodes the corresponding m4a → 32 kbps mono 48 kHz opus, and
writes assets/voices/unko_shiny/<hash>.opus, replacing the Edge TTS render.

The line list MUST stay in sync with what was given to the user when they
recorded — same order as the markdown shown to them. Index 28 ("Capisce?"
under hits) is a hash duplicate of index 11 ("Capisce?" under attack
phrases) — both recordings encode to the same destination, second wins.
"""

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
RECORDINGS = Path.home() / "Documents" / "Sound Recordings"
OUT_DIR = ROOT / "assets" / "voices" / "unko_shiny"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Ordered exactly as presented to the user. Emojis are part of the text
# because the runtime hash uses the bubble text including emojis.
LINES = [
    # 1: catchphrase
    "Bombardiro Unkodilo, fuhgeddaboudit!",
    # 2-6: attack names
    "Stink Shooter \U0001F4A9",      # 💩
    "Bomba Boom \U0001F4A3",          # 💣
    "Croco Chomp \U0001F40A",         # 🐊
    "Robo Arm Grab \U0001F9BE",       # 🦾
    "Tail Roll \U0001F504",           # 🔄
    # 7-9: Stink Shooter phrases
    "Yo, here it comes!",
    "Smell THIS!",
    "Brown shower, ay!",
    # 10-12: Bomba Boom phrases
    "Three two one, KABOOM!",
    "Capisce?",
    "Bada-BING!",
    # 13-15: Croco Chomp phrases
    "I'm bitin' here!",
    "Get over here!",
    "These teeth, ay!",
    # 16-18: Robo Arm Grab phrases
    "Mecha power!",
    "Gotcha!",
    "Squeeze this!",
    # 19-21: Tail Roll phrases
    "Tail's a-swingin'!",
    "Watch out!",
    "Roll with me!",
    # 22-41: hit reactions
    "Yo!",
    "Fuhgeddaboudit!",
    "Ay you!",
    "Bada bing!",
    "I'm walkin' here!",
    "Whatcha lookin' at?",
    "Capisce?",                       # dup of #11
    "Forget about it!",
    "Get outta here!",
    "Robot, but funky!",
    "Inside? POOP!",
    "This stinks!",
    "Yer kiddin' me!",
    "Mama mia!",
    "Don't poke the bomba!",
    "Give me a break!",
    "I oughta!",
    "Ya killin' me here!",
    "Brooklyn baby!",
    "Robot crocodile, ay!",
    # 42-49: slingshot taunts
    "Try me, kid!",
    "Bring it!",
    "Take ya shot!",
    "Aim, will ya?",
    "I'm waitin'!",
    "Whatcha got?",
    "Ya kiddin'?",
    "Show me whatcha got!",
    # 50-54: rage cries
    "BADA-BOOM!",
    "I'M MAD NOW!",
    "FUHGEDDABOUDIT!",
    "BROOKLYN RAGE!",
    "DROP DEAD MODE!",
]
assert len(LINES) == 54, f"expected 54 lines, got {len(LINES)}"

def djb2(s):
    """Match js/audio.js _hashFor exactly. JS strings are UTF-16: charCodeAt
    returns surrogate code units for codepoints > 0xFFFF (i.e. most emojis),
    not the codepoint itself. Iterating Python str gives codepoints, so we
    have to split codepoints > 0xFFFF into their surrogate pair manually."""
    h = 5381
    for c in s:
        cp = ord(c)
        if cp > 0xFFFF:
            cp2 = cp - 0x10000
            hi = 0xD800 + (cp2 >> 10)
            lo = 0xDC00 + (cp2 & 0x3FF)
            h = ((h << 5) + h + hi) & 0xFFFFFFFF
            h = ((h << 5) + h + lo) & 0xFFFFFFFF
        else:
            h = ((h << 5) + h + cp) & 0xFFFFFFFF
    return f"{h:08x}"

def clean(s):
    """Match runtime cleaning: collapse whitespace + trim. Furigana strip is
    a no-op for unko lines (no kanji[よみ] markup)."""
    import re
    return re.sub(r"\s+", " ", s).strip()

ffmpeg = "ffmpeg"  # on PATH via msys2

ok, fail = 0, 0
for i, text in enumerate(LINES, start=1):
    src = RECORDINGS / ("Recording.m4a" if i == 1 else f"Recording ({i}).m4a")
    if not src.exists():
        print(f"  MISS {i}: {src.name} not found — skipping")
        fail += 1
        continue
    h = djb2(clean(text))
    dst = OUT_DIR / f"{h}.opus"
    try:
        subprocess.run(
            [ffmpeg, "-y", "-loglevel", "error",
             "-i", str(src),
             "-c:a", "libopus", "-b:a", "32k", "-ac", "1", "-ar", "48000",
             # Trim leading/trailing silence — Voice Recorder leaves dead air.
             # Keep 80ms of leading silence (start_silence=0.08) so soft
             # initial consonants like "F" in "Fuhgeddaboudit" or "T" in
             # "Try me" don't get clipped. Stop_threshold tightened to -42dB
             # so quiet ambient noise doesn't get treated as speech.
             "-af", "silenceremove=start_periods=1:start_silence=0.08:start_duration=0.15:start_threshold=-42dB:"
                    "stop_periods=1:stop_silence=0.15:stop_duration=0.5:stop_threshold=-42dB",
             str(dst)],
            check=True,
        )
        ok += 1
        print(f"  {i:2d} {h}.opus  ←  {text!r}")
    except subprocess.CalledProcessError as e:
        print(f"  FAIL {i}: {e}")
        fail += 1

print(f"\nDone: {ok} encoded, {fail} skipped/failed")
print(f"Output dir: {OUT_DIR}")
