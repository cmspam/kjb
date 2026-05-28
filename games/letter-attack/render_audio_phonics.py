#!/usr/bin/env python3
"""Render the 26 PURE PHONICS letter sounds for もじ アタック (Letter Attack).

These are the letter SOUNDS, never the letter names: B -> /b/ ("buh"),
S -> /s/ ("sss"), A -> short /a/ ("ah"). The spelling text comes from
words.js (window.LA_PHONICS[*].say) so JS and audio never drift.

Output: assets/audio/phonics/<letter>.opus  (looked up by main.js
speakPhonics()). Idempotent — existing files are skipped.

Voice: en-US-AnaNeural (matches the kid voice used for spell-word
pronunciation) at a slowed rate for clarity. ffmpeg required on PATH.

NOTE: the short-vowel spellings (ah/eh/ih/oh/uh) are best-effort for the
neural voice and may need an ear-tune. Edit the `say` values in words.js
and re-run; this script re-renders only what changed if you also delete
the stale opus.
"""
import asyncio
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import edge_tts

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
OUT_DIR = ROOT / "assets" / "audio" / "phonics"
OUT_DIR.mkdir(parents=True, exist_ok=True)

VOICE = "en-US-AriaNeural"   # clear STANDARD adult voice (not the baby voice)
RATE = "-10%"        # slow it down a touch — phonics needs to be clear
CONCURRENCY = 6
# Phonics opus are NORMALLY the real human recordings split out of the
# Yellow Door source by split_phonics.py — this script only fills in
# letters whose opus is missing (e.g., after deleting one to A/B test a
# TTS variant). It will NOT overwrite the human recordings.
SYNTH = set()

# ---- parse LA_PHONICS `say` values out of words.js ----
words_js = (HERE / "words.js").read_text(encoding="utf-8")
# match lines like:  a: { say: "ah",   desc: "..." },
phon = {}
for m in re.finditer(r'(\b[a-z]):\s*\{\s*say:\s*"([^"]+)"', words_js):
    phon[m.group(1)] = m.group(2)

# Safety: ensure all 26 letters present.
for ch in "abcdefghijklmnopqrstuvwxyz":
    phon.setdefault(ch, ch)

print(f"phonics letters parsed: {len(phon)}")

missing = [(ltr, say, OUT_DIR / f"{ltr}.opus")
           for ltr, say in sorted(phon.items())
           if ltr not in SYNTH and not (OUT_DIR / f"{ltr}.opus").exists()]
print(f"missing (will render as TTS fallback): {len(missing)}")
if not missing:
    print("nothing to render — phonics pack is complete")
    sys.exit(0)


async def render_one(text: str, out_path: Path) -> bool:
    tmp = tempfile.NamedTemporaryFile(suffix='.mp3', delete=False)
    tmp.close()
    try:
        comm = edge_tts.Communicate(text, VOICE, rate=RATE)
        with open(tmp.name, 'wb') as f:
            async for chunk in comm.stream():
                if chunk.get('type') == 'audio':
                    f.write(chunk['data'])
        if os.path.getsize(tmp.name) < 256:
            return False
        result = subprocess.run([
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", tmp.name,
            "-c:a", "libopus", "-b:a", "32k", "-ac", "1", "-ar", "48000",
            str(out_path),
        ], check=False, capture_output=True)
        return result.returncode == 0
    except Exception as e:
        print(f"  FAIL [{text!r}]: {e}", file=sys.stderr)
        return False
    finally:
        try: os.unlink(tmp.name)
        except: pass


async def main():
    sem = asyncio.Semaphore(CONCURRENCY)
    done = fail = 0
    async def worker(ltr, text, path):
        nonlocal done, fail
        async with sem:
            ok = await render_one(text, path)
            if ok: done += 1
            else:  fail += 1
            print(f"  {ltr} = {text!r}  {'ok' if ok else 'FAIL'}")
    await asyncio.gather(*[worker(l, t, p) for l, t, p in missing])
    print(f"Done. ok={done} fail={fail}")

asyncio.run(main())
