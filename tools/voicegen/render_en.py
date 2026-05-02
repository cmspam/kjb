#!/usr/bin/env python3
"""
Render every English line in tools/voicegen/work/en_lines.json with Edge TTS,
encode to 32 kbps mono Opus at assets/audio/en/<hash>.opus, then write the
manifest.

Replaces the previous Piper pipeline; voice is en-US-AriaNeural (warm/clear,
kid-friendly). Concurrency capped at 8 to stay polite to the Edge TTS service.

Idempotent: skips any opus file that already exists. Safe to re-run after
adding new questions — only the new hashes render.

Usage (from project root):
    python tools/voicegen/render_en.py
"""

import asyncio
import json
import shutil
import subprocess
import sys
from pathlib import Path

import edge_tts

VOICE = "en-US-AriaNeural"
OUT_DIR = Path("assets/audio/en")
TMP_DIR = Path("tools/voicegen/work/en_render")
LINES   = Path("tools/voicegen/work/en_lines.json")
CONCURRENCY = 8

OUT_DIR.mkdir(parents=True, exist_ok=True)
TMP_DIR.mkdir(parents=True, exist_ok=True)

if not LINES.exists():
    print(f"missing {LINES} — run extract_en.js first", file=sys.stderr)
    sys.exit(1)

with open(LINES, encoding="utf-8") as f:
    lines = json.load(f)

print(f"Rendering {len(lines)} lines with {VOICE} (concurrency {CONCURRENCY})")

manifest = {}
sem = asyncio.Semaphore(CONCURRENCY)
counters = {"ok": 0, "skip": 0, "fail": 0}

async def render_one(entry, idx):
    h = entry["hash"]
    text = entry["text"]
    out_opus = OUT_DIR / f"{h}.opus"
    if out_opus.exists() and out_opus.stat().st_size > 0:
        manifest[h] = 1
        counters["skip"] += 1
        return
    tmp_mp3 = TMP_DIR / f"{h}.mp3"
    async with sem:
        # Edge TTS render with one retry on transient failure
        for attempt in range(3):
            try:
                comm = edge_tts.Communicate(text, VOICE)
                await comm.save(str(tmp_mp3))
                break
            except Exception as e:
                if attempt == 2:
                    print(f"FAIL render [{h}] {text!r}: {e}")
                    counters["fail"] += 1
                    return
                await asyncio.sleep(1.0 * (attempt + 1))
        if not tmp_mp3.exists() or tmp_mp3.stat().st_size == 0:
            counters["fail"] += 1
            return
    # Encode to opus via ffmpeg (sync — fast enough, <100ms each).
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error",
             "-i", str(tmp_mp3),
             "-c:a", "libopus", "-b:a", "32k", "-ac", "1", "-ar", "48000",
             str(out_opus)],
            check=True,
        )
    except Exception as e:
        print(f"FAIL encode [{h}] {text!r}: {e}")
        counters["fail"] += 1
        return
    try:
        tmp_mp3.unlink()
    except Exception:
        pass
    manifest[h] = 1
    counters["ok"] += 1
    if (counters["ok"] + counters["skip"]) % 50 == 0:
        print(f"  {counters['ok'] + counters['skip']}/{len(lines)} ...")

async def main():
    tasks = [render_one(e, i) for i, e in enumerate(lines)]
    await asyncio.gather(*tasks)
    print(f"\nTotals: {counters['ok']} new, {counters['skip']} skipped, {counters['fail']} failed")
    with open(OUT_DIR / "manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, separators=(",", ":"))
    print(f"Manifest written: {len(manifest)} entries → {OUT_DIR/'manifest.json'}")

asyncio.run(main())
