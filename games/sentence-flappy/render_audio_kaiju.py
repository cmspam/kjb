#!/usr/bin/env python3
"""Render each kaiju's flappy sentences in THEIR English voice.

The prep-screen sentence and the post-win sentence playback are
called via SND.playKaijuEn(bossId, text), which reads:

    assets/audio/en/<bossId>/<djb2-hash>.opus

So we render one file per (bossId, sentence) pair using the same
per-kaiju English voices that story-quest uses (Andrew for Tako,
Christopher for Unko, Ryan for Tral, etc.). The generic AnaNeural
pack at assets/audio/en/<hash>.opus stays in place as a fallback
for when bossId isn't passed (e.g. single-word collection feedback).

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

ROOT = Path(__file__).resolve().parent.parent.parent
OUT_ROOT = ROOT / "assets" / "audio" / "en"

# Per-kaiju English voices — same as story-quest's STORY[].voice so a
# kid hears the same voice for that kaiju everywhere.
VOICES = {
    "tako":       "en-US-AndrewMultilingualNeural",
    "unko":       "en-US-ChristopherNeural",
    "tral":       "en-GB-RyanNeural",
    "pamp":       "en-US-AvaMultilingualNeural",
    "parfait":    "en-US-EmmaMultilingualNeural",
    "anpan":      "en-US-EricNeural",
    # en-US-BrandonNeural appears retired from Edge TTS (returns
    # zero audio bytes); fall back to GuyNeural which is similarly
    # weighty for the old-camel-monkey character.
    "temee":      "en-US-GuyNeural",
    "catcherski": "en-US-RogerNeural",
    "brainrot":   "en-US-DavisNeural",
}
CONCURRENCY = 6

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

# ---- Parse per-kaiju sentence pools ---------------------------------
# Each of the three JS files lays out:
#
#   <varname> = {
#     tako: { 0: [...], 1: [...], 2: [...] },
#     unko: { ... },
#     ...
#   };
#
# We track current_kaiju by spotting "<id>: {" at indent depth 2 (the
# top-level keys inside the outer object). Inside each kaiju's block
# we collect every en: "..." string.

SQ_DIR = Path(__file__).resolve().parent
JS_FILES = [
    SQ_DIR / "sentences.js",
    SQ_DIR / "sentences-extra.js",
    SQ_DIR / "sentences-real.js",
]
KAIJU_HEADER_RE = re.compile(r'^\s*([a-z]+):\s*\{\s*$', re.MULTILINE)
EN_LINE_RE = re.compile(r'en\s*:\s*"((?:[^"\\]|\\.)*)"')

PUNCT_TRAIL = re.compile(r'[.,!?;:]+$')
PUNCT_LEAD = re.compile(r'^[.,!?;:]+')
def pure_word(tok: str) -> str:
    return PUNCT_LEAD.sub('', PUNCT_TRAIL.sub('', tok))

per_kaiju: dict[str, set[str]] = {}

for f in JS_FILES:
    if not f.exists():
        continue
    txt = f.read_text(encoding="utf-8")
    headers = [(m.group(1), m.start(), m.end()) for m in KAIJU_HEADER_RE.finditer(txt)
               if m.group(1) in VOICES]
    headers.append((None, len(txt), len(txt)))
    for i in range(len(headers) - 1):
        kid, _, body_start = headers[i]
        depth = 1
        j = body_start
        while j < len(txt) and depth > 0:
            ch = txt[j]
            if ch == '"':
                j += 1
                while j < len(txt) and txt[j] != '"':
                    if txt[j] == '\\': j += 2; continue
                    j += 1
                j += 1
                continue
            if ch == '{': depth += 1
            elif ch == '}': depth -= 1
            j += 1
        body = txt[body_start:j]
        per_kaiju.setdefault(kid, set())
        for em in EN_LINE_RE.finditer(body):
            try:
                en = em.group(1).encode().decode('unicode_escape')
            except Exception:
                en = em.group(1)
            # Full sentence
            per_kaiju[kid].add(en)
            # Plus every individual word a kid could grab — they'll
            # hear it in this kaiju's voice when collected.
            for tok in en.split():
                w = pure_word(tok)
                if w:
                    per_kaiju[kid].add(w)

# Print summary
for k in VOICES:
    print(f"  {k}: {len(per_kaiju.get(k, set()))} unique strings (sentences + words)")

# ---- Build render queue ---------------------------------------------
queue: list[tuple[str, str, Path]] = []
for kid, sents in per_kaiju.items():
    voice = VOICES.get(kid)
    if not voice: continue
    out_dir = OUT_ROOT / kid
    out_dir.mkdir(parents=True, exist_ok=True)
    for s in sents:
        h = djb2(clean_for_hash(s))
        out = out_dir / f"{h}.opus"
        if not out.exists():
            queue.append((s, voice, out))

print(f"\nto render: {len(queue)} files")
if not queue:
    print("nothing to do — per-kaiju pack is up to date")
    sys.exit(0)

# ---- Render ----------------------------------------------------------
async def render_one(text: str, voice: str, out_path: Path) -> bool:
    tmp = tempfile.NamedTemporaryFile(suffix='.mp3', delete=False)
    tmp.close()
    try:
        comm = edge_tts.Communicate(text, voice)
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
        print(f"  FAIL [{voice}] [{text[:40]!r}]: {e}", file=sys.stderr)
        return False
    finally:
        try: os.unlink(tmp.name)
        except: pass

async def main():
    sem = asyncio.Semaphore(CONCURRENCY)
    done = 0; fail = 0
    async def worker(text, voice, path):
        nonlocal done, fail
        async with sem:
            ok = await render_one(text, voice, path)
            if ok: done += 1
            else:  fail += 1
            if (done + fail) % 25 == 0:
                print(f"  progress {done+fail}/{len(queue)} (ok={done} fail={fail})")
    await asyncio.gather(*[worker(t, v, p) for t, v, p in queue])
    print(f"Done. ok={done} fail={fail}")

asyncio.run(main())
