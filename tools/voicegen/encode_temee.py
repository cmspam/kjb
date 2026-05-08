#!/usr/bin/env python3
"""
Encode user-recorded m4a Temee-shiny lines into the runtime opus pipeline.

Inputs:
  ~/Documents/Sound Recordings/Recording.m4a       (line 1)
  ~/Documents/Sound Recordings/Recording (2).m4a   (line 2)
  ...
  ~/Documents/Sound Recordings/Recording (53).m4a  (line 53)

Hashes each Mongolian line via djb2 (matching js/audio.js _hashFor /
playBossLine runtime path), encodes each m4a → 32 kbps mono 48 kHz opus,
and writes assets/voices/temee_shiny/<hash>.opus.

The line list MUST match tools/voicegen/temee_shiny_script.md (and
js/locale/ja_shiny.js temee block) — same order as the script the user
recorded against. If the user re-worded a line during recording, update
both the script.md AND the matching ja_shiny.js entry to keep the
runtime hash aligned with the recorded audio.
"""

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
RECORDINGS = Path.home() / "Documents" / "Sound Recordings"
OUT_DIR = ROOT / "assets" / "voices" / "temee_shiny"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Ordered exactly as in temee_shiny_script.md.
LINES = [
    # 1: catchphrase
    "Би Тэмээ Сармагчин энд байна! Бөхгүй хүн бүхэн, бөх ургуул!",
    # 2-4: ATK1 frozen mantuun buuz
    "Хөлдөөсөн бууз ниснэ!",
    "Хатуу хөлдсөн!",
    "Энэ миний оройн хоол!",
    # 5-7: ATK2 Gobi sandstorm
    "Говийн шуурга!",
    "Элсэнд булагд!",
    "Нүдээ нээж чадахгүй биз?",
    # 8-10: ATK3 -40 winter
    "Говийн өвлийг мэдэх үү?",
    "Хасах дөчин градус, хөлдөөнө!",
    "Чичирч унт!",
    # 11-13: ATK4 steppe slash
    "Талын өвс хутга мэт!",
    "Шааж явъя!",
    "Монгол өвсийг бүү басамжил!",
    # 14-16: ATK5 two-hump slam
    "Бөхөөрөө дарна!",
    "Хоёр бөхтэй шүү!",
    "Тэмээний хүч!",
    # 17-33: hits (17 lines)
    "За, чи их сайн юм байна",
    "Сахал минь...!",
    "Бөхөнд минь хүрчихлээ",
    "Сайн юм байна, бяцхан",
    "Хэхэхэ...",
    "Сармагчин толгой минь өвдөж байна!",
    "Юу гэж...!",
    "Элс нүдэнд орлоо",
    "Тэмээ ч бас өвддөг шүү!",
    "Би өвгөн шүү дээ...?",
    "Бөх минь хонхойлоо...",
    "Ммм, хүчтэй юм байна",
    "Сүүл минь...",
    "Гнг, хараахан...",
    "Би хараахан унаагүй ээ",
    "Үнэхээр өвдөж байна...",
    "Гнг, бууз минь...!",
    # 34-39: slingshot taunts (6 lines)
    "Чиг нь сулхан байна!",
    "Хүрэх болов уу?",
    "Би тэмээ шүү, хурдан зугтдаг!",
    "Бууд л доо!",
    "Өвгөнийг бүү басамжил!",
    "Над хүрэхэд зуун жил эрт байна!",
    # 40-44: rage cries (5 lines)
    "БИ УУРЛАЛАА!",
    "ӨРШӨӨХГҮЙ ЭЭ!",
    "ГОВИД ТЭМЦЭЛДЬЕ!",
    "САРМАГЧНЫ УУРЫГ МЭД!",
    "ЧИНГИС ХААНЫ ҮР УДАМ!",
    # 45-47: desperate (3 lines)
    "Ммм, энэ муу боллоо...",
    "Бөх минь...!",
    "Хараахан болоогүй...",
    # 48-50: high-combo (3 lines)
    "Хайхрамжгүй байжээ...",
    "Сайн юм байна, хүүхэд!",
    "Зогсохгүй байна, энэ...",
    # 51-53: part-lost (3 lines)
    "Бие минь...!",
    "Нэг бөхөө алдчихлаа!",
    "Аа, сармагчны сүүл...",
]
assert len(LINES) == 53, f"expected 53 lines, got {len(LINES)}"

def djb2(s):
    """Match js/audio.js _hashFor exactly. JS strings are UTF-16; codepoints
    > 0xFFFF (most emojis) are stored as surrogate pairs, NOT raw codepoints.
    Mongolian Cyrillic is BMP so the surrogate branch never fires — but
    keep the logic in case a line ever gets an emoji added."""
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
    """Match runtime cleaning: collapse whitespace + trim. No furigana in
    Mongolian lines so the strip is a no-op."""
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
             # Trim leading/trailing silence with an 80ms head pad so soft
             # initial consonants aren't clipped (matches encode_unko.py).
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
