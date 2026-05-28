#!/usr/bin/env python3
"""Auto-tune the phonics spellings so Edge TTS produces ONE sound per
letter — not the letter NAMES spelled out ("guh" -> "gee you aitch").

For each letter we try a few candidate spellings, render each, and count
how many distinct voiced segments it contains (via ffmpeg silencedetect).
A correct single phoneme/syllable is ONE segment; a spelled-out initialism
is several. We pick the highest-priority candidate that renders as a single
segment (and isn't absurdly long), render it to assets/audio/phonics/<l>.opus
at the final rate, and print the chosen map so words.js can be updated to
match (its `say` value is also the browser-TTS fallback text).

Run with msys2 ucrt64 python; ffmpeg/ffprobe on PATH.
"""
import asyncio, os, re, subprocess, sys, tempfile
from pathlib import Path
import edge_tts

HERE = Path(__file__).resolve().parent
OUT_DIR = HERE.parent.parent / "assets" / "audio" / "phonics"
OUT_DIR.mkdir(parents=True, exist_ok=True)
VOICE = "en-US-AnaNeural"
RATE = "-12%"

# Candidates per letter, best-guess first. Continuants want a sustained
# fricative (one long blob); stops carry the taught schwa ("buh").
CAND = {
    "a": ["ah", "aa", "a"],
    "b": ["buh", "bah", "bma"],
    "c": ["kuh", "cuh", "kah"],
    "d": ["duh", "dah", "dma"],
    "e": ["eh", "ehh", "e"],
    "f": ["ffff", "fff", "fuh", "ff"],
    "g": ["gah", "guhh", "ghuh", "gih", "guh"],
    "h": ["huh", "hah"],
    "i": ["ih", "ihh", "i"],
    "j": ["juh", "jah"],
    "k": ["kuh", "kah"],
    "l": ["llll", "lll", "luh", "ll"],
    "m": ["mmmm", "mmm", "muh", "mm"],
    "n": ["nnnn", "nnn", "nuh", "nn"],
    "o": ["oh", " awe", "o"],
    "p": ["puh", "pah"],
    "q": ["kwuh", "kwah", "quh"],
    "r": ["rrrr", "rrr", "ruh", "rr"],
    "s": ["ssss", "sss", "ss"],
    "t": ["tuh", "tah"],
    "u": ["uh", "uhh", "u"],
    "v": ["vvvv", "vvv", "vuh", "vv"],
    "w": ["wuh", "wah"],
    "x": ["kss", " kss", "ks"],
    "y": ["yuh", "yah"],
    "z": ["zzzz", "zzz", "zuh", "zz"],
}

def render_mp3(text, rate=None):
    tmp = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False); tmp.close()
    async def go():
        kw = {"rate": rate} if rate else {}
        comm = edge_tts.Communicate(text, VOICE, **kw)
        with open(tmp.name, "wb") as f:
            async for ch in comm.stream():
                if ch.get("type") == "audio":
                    f.write(ch["data"])
    asyncio.run(go())
    return tmp.name

def voiced_segments(mp3):
    """Return (segment_count, total_dur). Uses silencedetect; voiced
    regions are the complement of detected silence within [0,dur]."""
    dur = float(subprocess.run(
        ["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",mp3],
        capture_output=True, text=True).stdout.strip() or 0)
    out = subprocess.run(
        ["ffmpeg","-hide_banner","-i",mp3,"-af","silencedetect=noise=-35dB:d=0.10","-f","null","-"],
        capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start:\s*([0-9.]+)", out)]
    ends   = [float(x) for x in re.findall(r"silence_end:\s*([0-9.]+)", out)]
    # Build silence intervals
    sil = []
    si = 0
    for st in starts:
        en = ends[si] if si < len(ends) else dur
        si += 1
        sil.append((st, en))
    # Voiced = complement
    voiced = []
    cur = 0.0
    for st, en in sil:
        if st - cur > 0.05: voiced.append((cur, st))
        cur = max(cur, en)
    if dur - cur > 0.05: voiced.append((cur, dur))
    return len(voiced), dur

def to_opus(mp3, out_path):
    subprocess.run(["ffmpeg","-y","-loglevel","error","-i",mp3,
                    "-c:a","libopus","-b:a","32k","-ac","1","-ar","48000",str(out_path)],
                   check=False)

chosen = {}
for ltr in "abcdefghijklmnopqrstuvwxyz":
    best = None
    for cand in CAND[ltr]:
        mp3 = render_mp3(cand)
        segs, dur = voiced_segments(mp3)
        os.unlink(mp3)
        score = (segs, dur)   # prefer 1 segment, then shorter
        if best is None or score < best[0]:
            best = (score, cand, segs, dur)
        # perfect single-segment, stop early on the first such (priority order)
        if segs == 1 and dur < 2.6:
            best = (score, cand, segs, dur); break
    _, cand, segs, dur = best
    chosen[ltr] = cand
    # render the winner at the final rate into the pack
    mp3 = render_mp3(cand, RATE)
    to_opus(mp3, OUT_DIR / f"{ltr}.opus")
    os.unlink(mp3)
    print(f"  {ltr}: {cand!r:10} segments={segs} dur={dur:.2f}s")

print("\nChosen PHONICS say-values (update words.js to match):")
print("{ " + ", ".join(f'{k}:{v!r}' for k, v in chosen.items()) + " }")
