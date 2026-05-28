#!/usr/bin/env python3
"""Render the 3-letter CVC spelling words for もじ アタック (Letter Attack).

Spell-mode word pronunciation uses SND.speakEn(), which looks up the
generic pack at assets/audio/en/<djb2-hash>.opus. This renders any of
words.js's CVC words that aren't already in that pack (many common ones
already are), so every spelling word is voiced without falling back to
browser TTS.

Voice: en-US-AnaNeural (the generic kid voice). Idempotent.
ffmpeg required on PATH.
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
OUT_DIR = ROOT / "assets" / "audio" / "en"
OUT_DIR.mkdir(parents=True, exist_ok=True)

VOICE = "en-US-AnaNeural"
CONCURRENCY = 6


def djb2(s: str) -> str:
    h = 5381
    for c in s:
        h = ((h << 5) + h + ord(c)) & 0xFFFFFFFF
    return f"{h:08x}"


# ---- parse the CVC word list out of words.js (SPELL block only, so we
#      don't pick up the PHONICS `say` strings like "buh"/"kuh") ----
words_js = (HERE / "words.js").read_text(encoding="utf-8")
start = words_js.index("const SPELL = {")
end = words_js.index("\n  };", start)
spell_block = words_js[start:end]
words = sorted(set(re.findall(r'"([a-z]{2,5})"', spell_block)))
print(f"spell words: {len(words)}")

missing = [(w, OUT_DIR / f"{djb2(w)}.opus") for w in words
           if not (OUT_DIR / f"{djb2(w)}.opus").exists()]
print(f"missing opus: {len(missing)}")
if not missing:
    print("nothing to render — every spell word already in the pack")
    sys.exit(0)


async def render_one(text: str, out_path: Path) -> bool:
    tmp = tempfile.NamedTemporaryFile(suffix='.mp3', delete=False)
    tmp.close()
    try:
        comm = edge_tts.Communicate(text, VOICE)
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
    async def worker(text, path):
        nonlocal done, fail
        async with sem:
            ok = await render_one(text, path)
            if ok: done += 1
            else:  fail += 1
            if (done + fail) % 20 == 0:
                print(f"  progress {done+fail}/{len(missing)} (ok={done} fail={fail})")
    await asyncio.gather(*[worker(t, p) for t, p in missing])
    print(f"Done. ok={done} fail={fail}")

asyncio.run(main())
