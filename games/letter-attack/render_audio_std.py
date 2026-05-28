#!/usr/bin/env python3
"""Render word/sentence pronunciation for もじ アタック in a STANDARD voice.

The shared generic pack (assets/audio/en) is en-US-AnaNeural — a child
("baby") voice the user found hard to hear. Letter Attack instead speaks
words/sentences from its own pack rendered in a clear standard adult voice
(en-US-AriaNeural), looked up by main.js via SND.tryOpus(en_std/<hash>).

Collects: every spell word (words.js) + every flappy sentence (full) and
its word tokens (window.SENTENCES, reused for sentence mode). Idempotent.
Output: assets/audio/en_std/<djb2-hash>.opus. ffmpeg on PATH.
"""
import asyncio, os, re, subprocess, sys, tempfile
from pathlib import Path
import edge_tts

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
OUT_DIR = ROOT / "assets" / "audio" / "en_std"
OUT_DIR.mkdir(parents=True, exist_ok=True)
VOICE = "en-US-AriaNeural"
CONCURRENCY = 6

def djb2(s):
    h = 5381
    for c in s: h = ((h << 5) + h + ord(c)) & 0xFFFFFFFF
    return f"{h:08x}"

FURIGANA_RE = re.compile(r'([一-鿿々ヶ]+)\[([^\]]+)\]')
WS_RE = re.compile(r'\s+')
def clean_for_hash(s):
    s = FURIGANA_RE.sub(r'\2', s)
    return WS_RE.sub(' ', s).strip()
PUNCT = re.compile(r'^[.,!?;:]+|[.,!?;:]+$')
def pure_word(t): return PUNCT.sub('', t)

texts = set()

# flappy sentences (full + tokens) — reused by Letter Attack sentence mode
for fn in ["sentences.js", "sentences-extra.js", "sentences-real.js"]:
    f = HERE.parent / "sentence-flappy" / fn
    if not f.exists(): continue
    txt = f.read_text(encoding="utf-8")
    for m in re.finditer(r'en\s*:\s*"((?:[^"\\]|\\.)*)"', txt):
        try: en = m.group(1).encode().decode("unicode_escape")
        except Exception: en = m.group(1)
        texts.add(en)
        for tok in en.split():
            w = pure_word(tok)
            if w: texts.add(w)

# spell words (SPELL block of words.js)
wjs = (HERE / "words.js").read_text(encoding="utf-8")
sb = wjs[wjs.index("const SPELL = {"):wjs.index("\n  };")]
for w in re.findall(r'"([a-z]{2,5})"', sb):
    texts.add(w)

texts = {clean_for_hash(t) for t in texts if clean_for_hash(t)}
missing = [(t, OUT_DIR / f"{djb2(t)}.opus") for t in texts
           if not (OUT_DIR / f"{djb2(t)}.opus").exists()]
print(f"unique texts: {len(texts)}, missing opus: {len(missing)}")
if not missing:
    print("nothing to render — std pack up to date")
    sys.exit(0)

async def render_one(text, out_path):
    tmp = tempfile.NamedTemporaryFile(suffix='.mp3', delete=False); tmp.close()
    try:
        comm = edge_tts.Communicate(text, VOICE)
        with open(tmp.name, 'wb') as f:
            async for ch in comm.stream():
                if ch.get('type') == 'audio': f.write(ch['data'])
        if os.path.getsize(tmp.name) < 256: return False
        r = subprocess.run(["ffmpeg","-y","-loglevel","error","-i",tmp.name,
                            "-c:a","libopus","-b:a","32k","-ac","1","-ar","48000",str(out_path)],
                           capture_output=True)
        return r.returncode == 0
    except Exception as e:
        print(f"  FAIL [{text[:40]!r}]: {e}", file=sys.stderr); return False
    finally:
        try: os.unlink(tmp.name)
        except: pass

async def main():
    sem = asyncio.Semaphore(CONCURRENCY); done = fail = 0
    async def worker(t, p):
        nonlocal done, fail
        async with sem:
            ok = await render_one(t, p)
            done += ok; fail += (not ok)
            if (done + fail) % 40 == 0:
                print(f"  progress {done+fail}/{len(missing)} (ok={done} fail={fail})")
    await asyncio.gather(*[worker(t, p) for t, p in missing])
    print(f"Done. ok={done} fail={fail}")

asyncio.run(main())
