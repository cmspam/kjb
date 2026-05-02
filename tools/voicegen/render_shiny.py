#!/usr/bin/env python3
"""
Render every shiny boss line via Edge TTS in the per-boss target language,
encode to 32 kbps mono Opus, output to assets/voices/<bossId>_shiny/<hash>.opus.

Reads tools/voicegen/work/shiny_lines/<bossId>.json (produced by
extract_shiny.js). Each file carries `voice` (Edge TTS voice id) and a
`lines` array of {hash, text, kind}. We tune intonation by `kind` for
shouts vs phrases, similar to the VOICEVOX renderer.
"""

import asyncio
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

import edge_tts

# Same emoji-strip as render_en.py — Edge TTS reads emojis aloud as their
# Unicode names. Strip for synthesis only; hash uses the original text.
EMOJI_RE = re.compile(
    "["
    "\U0001F000-\U0001FFFF"
    "\U00002600-\U000027BF"
    "\U00002B00-\U00002BFF"
    "‍️⃣〰"
    "]+", flags=re.UNICODE)
def strip_emoji(s):
    return EMOJI_RE.sub("", s).strip()

ROOT = Path(__file__).resolve().parent.parent.parent
LINES_DIR = ROOT / "tools" / "voicegen" / "work" / "shiny_lines"
TMP_DIR = ROOT / "tools" / "voicegen" / "work" / "shiny_render"
VOICES_DIR = ROOT / "assets" / "voices"
CONCURRENCY = 6

if not LINES_DIR.exists():
    print(f"missing {LINES_DIR} — run extract_shiny.js first", file=sys.stderr)
    sys.exit(1)

TMP_DIR.mkdir(parents=True, exist_ok=True)

# Edge TTS rate / pitch tuning per "kind" — slingshot heckles and rage
# cries are shouted; everything else stays at default cadence.
KIND_SSML = {
    "attack-name":   {"rate": "+10%", "pitch": "+5Hz",  "volume": "+10%"},
    "attack-phrase": {"rate": "+0%",  "pitch": "+0Hz",  "volume": "+5%"},
    "hit":           {"rate": "+5%",  "pitch": "+0Hz",  "volume": "+0%"},
    "catchphrase":   {"rate": "+0%",  "pitch": "+0Hz",  "volume": "+10%"},
}

async def render_line(voice, entry, out_dir, sem, counters):
    h = entry["hash"]
    text = entry["text"]
    kind = entry.get("kind", "attack-phrase")
    out_opus = out_dir / f"{h}.opus"
    if out_opus.exists() and out_opus.stat().st_size > 0:
        counters["skip"] += 1
        return
    tmp_mp3 = TMP_DIR / f"{out_dir.name}_{h}.mp3"
    tuning = KIND_SSML.get(kind, KIND_SSML["attack-phrase"])
    # Strip emojis for synthesis only — TTS otherwise reads their Unicode
    # names ("pile of poo", "reverse arrow"). Hash keeps the original.
    spoken = strip_emoji(text)
    if not spoken:
        counters["fail"] += 1
        return
    async with sem:
        for attempt in range(3):
            try:
                comm = edge_tts.Communicate(
                    spoken, voice,
                    rate=tuning["rate"],
                    pitch=tuning["pitch"],
                    volume=tuning["volume"],
                )
                await comm.save(str(tmp_mp3))
                break
            except Exception as e:
                if attempt == 2:
                    print(f"  FAIL render [{h}] {spoken!r}: {e}")
                    counters["fail"] += 1
                    return
                await asyncio.sleep(1.0 * (attempt + 1))
        if not tmp_mp3.exists() or tmp_mp3.stat().st_size == 0:
            counters["fail"] += 1
            return
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error",
             "-i", str(tmp_mp3),
             "-c:a", "libopus", "-b:a", "32k", "-ac", "1", "-ar", "48000",
             str(out_opus)],
            check=True,
        )
    except Exception as e:
        print(f"  FAIL encode [{h}]: {e}")
        counters["fail"] += 1
        return
    try:
        tmp_mp3.unlink()
    except Exception:
        pass
    counters["ok"] += 1

async def render_boss(boss_id):
    lines_file = LINES_DIR / f"{boss_id}.json"
    with open(lines_file, encoding="utf-8") as f:
        data = json.load(f)
    voice = data["voice"]
    lines = data["lines"]
    out_dir = VOICES_DIR / f"{boss_id}_shiny"
    out_dir.mkdir(parents=True, exist_ok=True)
    print(f"\n=== {boss_id} ({voice}, {len(lines)} lines) ===")
    counters = {"ok": 0, "skip": 0, "fail": 0}
    sem = asyncio.Semaphore(CONCURRENCY)
    tasks = [render_line(voice, e, out_dir, sem, counters) for e in lines]
    await asyncio.gather(*tasks)
    print(f"  done: {counters['ok']} new, {counters['skip']} skipped, {counters['fail']} failed")

async def main():
    boss_files = sorted(LINES_DIR.glob("*.json"))
    for f in boss_files:
        await render_boss(f.stem)

asyncio.run(main())
