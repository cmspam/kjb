#!/usr/bin/env python3
"""
Render the story-quest audio pack — every kaiju line in their own
distinct English Edge TTS voice, every kid response in en-US-AnaNeural
(child voice), every per-word gloss tap also pre-rendered in the kid
voice so single-word taps play instantly without a TTS roundtrip.

Output: ../../assets/voices/story/
  <kaiju>/<hash>.opus  — kaiju dialogue lines
  kid/<hash>.opus       — kid response lines
  word/<hash>.opus      — single-word taps (gloss audio)

Hash: djb2 over the cleaned (lowercased, whitespace-collapsed) English
text, matching the runtime lookup in main.js.
"""

import asyncio
import json
import re
import subprocess
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent.parent
OUT_ROOT = ROOT / "assets" / "voices" / "story"
TMP_DIR = ROOT / "games" / "story-quest" / "_tmp_audio"
OUT_ROOT.mkdir(parents=True, exist_ok=True)
TMP_DIR.mkdir(parents=True, exist_ok=True)

# Read dialogue.js and parse via regex / JSON-extract (simpler than
# spinning up node).
DIALOGUE_PATH = Path(__file__).resolve().parent / "dialogue.js"
js = DIALOGUE_PATH.read_text(encoding="utf-8")

# Strip JS shell to get just the object literals. Use a small Node
# subprocess to evaluate dialogue.js and emit JSON.
NODE_SCRIPT = f"""
const fs = require('fs');
global.window = global;
new Function('window', fs.readFileSync({json.dumps(str(DIALOGUE_PATH))}, 'utf8'))(global);
process.stdout.write(JSON.stringify({{ story: global.STORY, gloss: global.WORD_GLOSS }}));
"""
result = subprocess.run(
    ["node", "-e", NODE_SCRIPT],
    capture_output=True, text=True, encoding="utf-8",
)
if result.returncode != 0:
    print("node extraction failed:", result.stderr, file=sys.stderr)
    sys.exit(1)
data = json.loads(result.stdout)
STORY = data["story"]
GLOSS = data["gloss"]

# djb2 matching js/audio.js _hashFor — case-insensitive normalization.
def djb2(s):
    h = 5381
    for c in s:
        cp = ord(c)
        h = ((h << 5) + h + cp) & 0xFFFFFFFF
    return f"{h:08x}"

def clean(s):
    return re.sub(r"\s+", " ", s).strip()

def hash_for(s):
    return djb2(clean(s))

# Collect all unique lines to render.
# 3 buckets: kaiju (per-kaiju voice), kid (Ana), word (Ana single-word).
to_render = []   # list of (out_dir, voice, text)

for kaiju_id, kdata in STORY.items():
    voice = kdata["voice"]
    out_dir = OUT_ROOT / kaiju_id
    out_dir.mkdir(exist_ok=True)
    for conv in kdata.get("conversations", []):
        nodes = conv.get("nodes", {})
        for node_id, node in nodes.items():
            if node.get("en"):
                to_render.append((out_dir, voice, node["en"]))
            for choice in node.get("choices", []) or []:
                kid_dir = OUT_ROOT / "kid"
                kid_dir.mkdir(exist_ok=True)
                to_render.append((kid_dir, "en-US-AnaNeural", choice["en"]))

# Per-word gloss audio (Ana, for tap-to-hear)
word_dir = OUT_ROOT / "word"
word_dir.mkdir(exist_ok=True)
for word in GLOSS.keys():
    to_render.append((word_dir, "en-US-AnaNeural", word))

# Dedup by (out_dir, hash)
seen = set()
unique = []
for out_dir, voice, text in to_render:
    h = hash_for(text)
    key = (str(out_dir), h)
    if key in seen: continue
    seen.add(key)
    unique.append((out_dir, voice, text, h))
print(f"Will render {len(unique)} unique lines into {OUT_ROOT}")

CONCURRENCY = 8

async def render_one(sem, out_dir, voice, text, h):
    out_opus = out_dir / f"{h}.opus"
    if out_opus.exists() and out_opus.stat().st_size > 0:
        return ("skip", h)
    tmp_mp3 = TMP_DIR / f"{out_dir.name}_{h}.mp3"
    async with sem:
        for attempt in range(3):
            try:
                comm = edge_tts.Communicate(text, voice, rate="+5%", volume="+0%")
                await comm.save(str(tmp_mp3))
                break
            except Exception as e:
                if attempt == 2:
                    return ("fail", h, str(e))
                await asyncio.sleep(0.7 * (attempt + 1))
    # Encode to opus
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error",
             "-i", str(tmp_mp3),
             "-c:a", "libopus", "-b:a", "32k", "-ac", "1", "-ar", "48000",
             "-af", "silenceremove=start_periods=1:start_silence=0.04:start_duration=0.08:start_threshold=-50dB",
             str(out_opus)],
            check=True,
        )
    except subprocess.CalledProcessError as e:
        return ("ffmpeg-fail", h, str(e))
    finally:
        try: tmp_mp3.unlink()
        except FileNotFoundError: pass
    return ("ok", h, text)

async def main():
    sem = asyncio.Semaphore(CONCURRENCY)
    tasks = [render_one(sem, od, voice, text, h) for (od, voice, text, h) in unique]
    ok = skip = fail = 0
    for i, fut in enumerate(asyncio.as_completed(tasks), 1):
        res = await fut
        if res[0] == "ok": ok += 1
        elif res[0] == "skip": skip += 1
        else: fail += 1
        if i % 25 == 0 or i == len(tasks):
            print(f"  {i}/{len(tasks)} ok={ok} skip={skip} fail={fail}")
    print(f"Done — rendered {ok}, skipped {skip}, failed {fail}")

if __name__ == "__main__":
    asyncio.run(main())
