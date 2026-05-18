#!/usr/bin/env python3
"""
Render the story-quest audio pack WITHOUT a node dependency.

Parses dialogue.js + dialogue-deep.js + dialogue-help.js via regex to
extract per-kaiju voice profiles and all unique English lines. Then
calls Edge TTS to produce pre-rendered .opus files in:

  assets/voices/story/<kaiju>/<hash>.opus  — kaiju lines
  assets/voices/story/kid/<hash>.opus       — kid response lines
  assets/voices/story/word/<hash>.opus      — single-word glosses

Hash = djb2 over (lowercase, whitespace-collapsed) English text, the
same hash main.js uses at runtime.
"""

import asyncio
import re
import subprocess
import sys
import shutil
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent.parent
OUT_ROOT = ROOT / "assets" / "voices" / "story"
TMP_DIR = ROOT / "games" / "story-quest" / "_tmp_audio_v2"
OUT_ROOT.mkdir(parents=True, exist_ok=True)
TMP_DIR.mkdir(parents=True, exist_ok=True)
SQ_DIR = Path(__file__).resolve().parent

KID_VOICE  = "en-US-AnaNeural"
WORD_VOICE = "en-US-AnaNeural"

# ---- djb2 / clean (matching js/audio.js _hashFor) ------------------
def djb2(s: str) -> str:
    h = 5381
    for c in s:
        h = ((h << 5) + h + ord(c)) & 0xFFFFFFFF
    return f"{h:08x}"

def clean(s: str) -> str:
    s = re.sub(r"\s+", " ", s).strip()
    return s

def hash_for(s: str) -> str:
    return djb2(clean(s))


# ---- parser --------------------------------------------------------
def read(path):
    return Path(path).read_text(encoding="utf-8")

def parse_voices_base(text):
    """From dialogue.js, build {kaiju_id: voice}. Looks for lines like:
       tako: { ... voice: "en-US-AndrewMultilingualNeural", ... }
    Done with a forgiving regex over the section header.
    """
    voices = {}
    # Match `  kaiju_id: {` at indent 2, then capture up to `voice: "..."`.
    pat = re.compile(
        r"^  ([a-z]+): \{\s*\n(?:.*\n)*?\s*voice: \"([^\"]+)\"",
        re.MULTILINE
    )
    for m in pat.finditer(text):
        voices[m.group(1)] = m.group(2)
    return voices

def parse_lines_base(text):
    """For each `  kaiju_id: {` section, extract all en: "..." lines
    until the matching closing `  },` at indent 2 (next sibling key or
    object close).
    Returns dict kaiju_id -> list of english lines (in source order).
    """
    out = {}
    # Find each kaiju header
    headers = [(m.group(1), m.start(), m.end()) for m in re.finditer(
        r"^  ([a-z]+): \{\s*\n", text, re.MULTILINE)]
    headers.append((None, len(text), len(text)))
    for i in range(len(headers) - 1):
        kid, _, sec_start = headers[i]
        sec_end = headers[i+1][1]
        section = text[sec_start:sec_end]
        ens = re.findall(r"\ben:\s*\"((?:[^\"\\]|\\.)*)\"", section)
        # Skip the "voice" lines: those aren't "en:" so they don't match.
        out[kid] = [e.encode().decode("unicode_escape") for e in ens]
    return out

def parse_extension_file(text):
    """For dialogue-deep.js / dialogue-help.js, find each
    `["kaijuId", { ... }]` entry and capture all en: "..." inside.
    Returns dict kaiju_id -> list of english lines.
    """
    out = {}
    # Find each entry by ["kid", { header
    for m in re.finditer(r'\["([a-z]+)",\s*\{', text):
        kid = m.group(1)
        # Walk braces to find end of object literal
        start = m.end() - 1  # at '{'
        depth = 0
        i = start
        while i < len(text):
            c = text[i]
            if c == '"':
                # Skip string
                i += 1
                while i < len(text) and text[i] != '"':
                    if text[i] == '\\':
                        i += 2; continue
                    i += 1
                i += 1
                continue
            if c == '{': depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0:
                    block = text[start:i+1]
                    ens = re.findall(r"\ben:\s*\"((?:[^\"\\]|\\.)*)\"", block)
                    out.setdefault(kid, []).extend(
                        e.encode().decode("unicode_escape") for e in ens)
                    i += 1
                    break
            i += 1
    return out


# ---- collect work --------------------------------------------------
base_text = read(SQ_DIR / "dialogue.js")
deep_text = read(SQ_DIR / "dialogue-deep.js")     if (SQ_DIR / "dialogue-deep.js").exists() else ""
help_text = read(SQ_DIR / "dialogue-help.js")     if (SQ_DIR / "dialogue-help.js").exists() else ""
msg_text  = read(SQ_DIR / "dialogue-messages.js") if (SQ_DIR / "dialogue-messages.js").exists() else ""

VOICES = parse_voices_base(base_text)
LINES_BASE = parse_lines_base(base_text)
LINES_DEEP = parse_extension_file(deep_text) if deep_text else {}
LINES_HELP = parse_extension_file(help_text) if help_text else {}
LINES_MSG  = parse_extension_file(msg_text)  if msg_text  else {}

# Heuristic: in the base file, each conversation lists kaiju-spoken
# lines (nodes) AND kid-spoken lines (choices). We can't easily tell
# them apart with regex alone, so we render BOTH the kaiju voice and
# the kid voice for every line. This is wasteful but small: edge-tts
# is free and the dedup happens via file-path uniqueness anyway.
# Single-word gloss audio comes from WORD_GLOSS — we extract those.
WORD_GLOSS_KEYS = []
gloss_match = re.search(r"window\.WORD_GLOSS\s*=\s*\{(.*?)\n\};", base_text, re.DOTALL)
if gloss_match:
    body = gloss_match.group(1)
    WORD_GLOSS_KEYS = re.findall(r"\"([^\"]+)\":", body)

# Also pick up the extra gloss words from Object.assign blocks.
for ext_text in (deep_text, help_text):
    for m in re.finditer(r"Object\.assign\(window\.WORD_GLOSS[^,]+,\s*\{([^}]*)\}", ext_text):
        WORD_GLOSS_KEYS.extend(re.findall(r"\"([^\"]+)\":", m.group(1)))

# Dedup
WORD_GLOSS_KEYS = list(dict.fromkeys(WORD_GLOSS_KEYS))


# ---- build render queue --------------------------------------------
to_render = []  # tuples (out_dir, voice, text, dedup_key)
seen = set()

def add_line(out_dir: Path, voice: str, text: str):
    text_c = clean(text)
    if not text_c: return
    key = (str(out_dir), hash_for(text_c))
    if key in seen: return
    seen.add(key)
    out = out_dir / (hash_for(text_c) + ".opus")
    if out.exists():
        return  # already rendered
    to_render.append((out_dir, voice, text_c, key))

# Per-kaiju lines (assume each line is kaiju-spoken)
for kid in sorted(set(list(VOICES.keys()) + list(LINES_BASE.keys()) + list(LINES_DEEP.keys()) + list(LINES_HELP.keys()) + list(LINES_MSG.keys()))):
    voice = VOICES.get(kid)
    if not voice: continue
    out_dir = OUT_ROOT / kid
    out_dir.mkdir(exist_ok=True, parents=True)
    for src in (LINES_BASE.get(kid, []), LINES_DEEP.get(kid, []), LINES_HELP.get(kid, []), LINES_MSG.get(kid, [])):
        for ln in src:
            add_line(out_dir, voice, ln)

# Kid voice — same lines, rendered in Ana for choice picks. The
# runtime calls playKidAudio(choice.en); if the file is missing it
# falls back to browser TTS. We render kid voice for ALL en lines we
# saw across all kaiju (overkill but cheap).
kid_dir = OUT_ROOT / "kid"
kid_dir.mkdir(exist_ok=True, parents=True)
all_lines = set()
for d in (LINES_BASE, LINES_DEEP, LINES_HELP, LINES_MSG):
    for kid, lst in d.items():
        for ln in lst:
            all_lines.add(ln)
for ln in all_lines:
    add_line(kid_dir, KID_VOICE, ln)

# Single-word gloss audio
word_dir = OUT_ROOT / "word"
word_dir.mkdir(exist_ok=True, parents=True)
for w in WORD_GLOSS_KEYS:
    add_line(word_dir, WORD_VOICE, w)

print(f"queued {len(to_render)} lines to render")


# ---- render --------------------------------------------------------
# Uses chunk-write rather than comm.save() because edge-tts's save()
# silently fails to flush bytes on Windows in some versions. Also
# substituted Brandon→Guy in the voice map below when needed since
# en-US-BrandonNeural appears retired from the service.
async def render_one(out_dir, voice, text, key):
    safe_name = hash_for(text)
    out_path = out_dir / (safe_name + ".opus")
    tmp_mp3  = TMP_DIR / (safe_name + ".mp3")
    try:
        comm = edge_tts.Communicate(text, voice)
        with open(tmp_mp3, "wb") as f:
            async for chunk in comm.stream():
                if chunk.get("type") == "audio":
                    f.write(chunk["data"])
    except Exception as e:
        print(f"  render fail [{voice}] {text[:40]!r}: {e}", file=sys.stderr)
        return False
    if not tmp_mp3.exists() or tmp_mp3.stat().st_size < 256:
        return False
    try:
        subprocess.run([
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", str(tmp_mp3),
            "-c:a", "libopus", "-b:a", "32k", "-ac", "1", "-ar", "48000",
            str(out_path),
        ], check=True)
    except Exception as e:
        print(f"  ffmpeg fail {text[:40]!r}: {e}", file=sys.stderr)
        return False
    try: tmp_mp3.unlink()
    except: pass
    return True

async def main():
    sem = asyncio.Semaphore(6)
    done = 0
    fail = 0
    async def worker(args):
        nonlocal done, fail
        async with sem:
            ok = await render_one(*args)
            if ok: done += 1
            else:  fail += 1
            if (done + fail) % 25 == 0:
                print(f"  progress {done + fail}/{len(to_render)} (ok={done} fail={fail})")
    await asyncio.gather(*[worker(a) for a in to_render])
    print(f"\nDone. ok={done} fail={fail}")

if to_render:
    asyncio.run(main())
else:
    print("nothing to render — all up to date")

# Cleanup tmp
try: shutil.rmtree(TMP_DIR)
except: pass
