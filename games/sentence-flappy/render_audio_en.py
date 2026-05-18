#!/usr/bin/env python3
"""Render missing English audio for sentence-flappy.

Walks the three sentence pools (sentences.js, sentences-extra.js,
sentences-real.js), collects every unique pureWord(token) AND every
unique full sentence, computes the djb2 hash that flappy's
speakEn() looks up, and renders any opus file that doesn't already
exist via Edge TTS (en-US-AnaNeural — kid voice, matches the rest
of the pack).

Outputs to assets/audio/en/<hash>.opus to extend the existing pack.
ffmpeg required on PATH (msys2 ucrt64 has it).
"""
import asyncio
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent.parent
OUT_DIR = ROOT / "assets" / "audio" / "en"
OUT_DIR.mkdir(parents=True, exist_ok=True)

VOICE = "en-US-AnaNeural"
CONCURRENCY = 6

# ---- hashing (must match audio.js djb2 + cleanForHash exactly) ----
def djb2(s: str) -> str:
    h = 5381
    for c in s:
        h = ((h << 5) + h + ord(c)) & 0xFFFFFFFF
    return f"{h:08x}"

FURIGANA_RE = re.compile(r'([一-鿿々ヶ]+)\[([^\]]+)\]')
WS_RE = re.compile(r'\s+')

def clean_for_hash(s: str) -> str:
    s = FURIGANA_RE.sub(r'\2', s)
    return WS_RE.sub(' ', s).strip()

PUNCT_TRAIL = re.compile(r'[.,!?;:]+$')
PUNCT_LEAD = re.compile(r'^[.,!?;:]+')

def pure_word(tok: str) -> str:
    return PUNCT_LEAD.sub('', PUNCT_TRAIL.sub('', tok))

# ---- parse SENTENCES out of the three JS files ----
SQ_DIR = Path(__file__).resolve().parent
JS_FILES = [
    SQ_DIR / "sentences.js",
    SQ_DIR / "sentences-extra.js",
    SQ_DIR / "sentences-real.js",
]

sentences: set[str] = set()
words: set[str] = set()
for f in JS_FILES:
    if not f.exists():
        continue
    txt = f.read_text(encoding="utf-8")
    for m in re.finditer(r'en\s*:\s*"((?:[^"\\]|\\.)*)"', txt):
        raw = m.group(1)
        try:
            en = raw.encode().decode("unicode_escape")
        except Exception:
            en = raw
        sentences.add(en)
        for tok in en.split():
            w = pure_word(tok)
            if w:
                words.add(w)

print(f"sentences: {len(sentences)}, unique words: {len(words)}")

# ---- find missing opus ----
missing: list[tuple[str, Path]] = []
for s in (sentences | words):
    h = djb2(clean_for_hash(s))
    out = OUT_DIR / f"{h}.opus"
    if not out.exists():
        missing.append((s, out))

print(f"missing opus files: {len(missing)}")
if not missing:
    print("nothing to render — pack is up to date")
    sys.exit(0)

# ---- render via Edge TTS ----
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
        print(f"  FAIL [{text[:48]!r}]: {e}", file=sys.stderr)
        return False
    finally:
        try: os.unlink(tmp.name)
        except: pass

async def main():
    sem = asyncio.Semaphore(CONCURRENCY)
    done = 0
    fail = 0
    async def worker(text: str, path: Path):
        nonlocal done, fail
        async with sem:
            ok = await render_one(text, path)
            if ok: done += 1
            else:  fail += 1
            if (done + fail) % 25 == 0:
                print(f"  progress {done+fail}/{len(missing)} (ok={done} fail={fail})")
    await asyncio.gather(*[worker(t, p) for t, p in missing])
    print(f"Done. ok={done} fail={fail}")

asyncio.run(main())
