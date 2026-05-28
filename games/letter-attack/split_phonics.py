#!/usr/bin/env python3
"""Split the Yellow Door 'Phonic_letter_sounds.mp3' into 26 phonics opus
files, one per letter A-Z, into assets/audio/phonics/.

The source MP3 has each letter spoken once with ~1.8 s of silence between
letters. We:
  1) detect inter-letter silence regions via ffmpeg silencedetect,
  2) take the speech segments between them as letters in alphabetical order,
  3) extract each with a small leading/trailing pad,
  4) trim each segment's internal silence to clean edges,
  5) encode opus into assets/audio/phonics/<letter>.opus (overwrites).

Source: https://www.yellow-door.net/file-downloads/Phonic_letter_sounds.mp3
(provided by the user as freely available for use). Recorded by Yellow Door.

Run with msys2 ucrt64 python; ffmpeg/ffprobe on PATH.
"""
import re, subprocess, sys, urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
OUT  = ROOT / "assets" / "audio" / "phonics"
OUT.mkdir(parents=True, exist_ok=True)

SRC_URL = "https://www.yellow-door.net/file-downloads/Phonic_letter_sounds.mp3"
SRC = HERE / "_yd_phonics_src.mp3"

def download():
    if SRC.exists() and SRC.stat().st_size > 100_000:
        return
    print(f"downloading {SRC_URL} ...")
    req = urllib.request.Request(SRC_URL, headers={"User-Agent": "letter-attack-edu/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r, open(SRC, "wb") as f:
        f.write(r.read())
    print(f"  -> {SRC} ({SRC.stat().st_size} bytes)")

def probe_duration(path):
    r = subprocess.run(["ffprobe","-v","error","-show_entries","format=duration",
                        "-of","csv=p=0",str(path)], capture_output=True, text=True)
    return float(r.stdout.strip())

def detect_silences(path, noise="-32dB", d="0.40"):
    """Return list of (start, end) silence intervals. Looser noise/larger d
    catches the long inter-letter gaps without slicing into letter audio."""
    out = subprocess.run(
        ["ffmpeg","-hide_banner","-i",str(path),"-af",f"silencedetect=noise={noise}:d={d}",
         "-f","null","-"], capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start:\s*([0-9.]+)", out)]
    ends   = [float(x) for x in re.findall(r"silence_end:\s*([0-9.]+)", out)]
    dur = probe_duration(path)
    # Pair them; if a final silence_start has no matching silence_end, it runs
    # to EOF.
    intervals = []
    for i, s in enumerate(starts):
        e = ends[i] if i < len(ends) else dur
        intervals.append((s, e))
    return intervals, dur

def speech_segments(silences, total_dur):
    """Complement of silence in [0, total_dur] -> the letter speech segments."""
    segs = []
    cur = 0.0
    for s, e in silences:
        if s - cur > 0.02:
            segs.append((cur, s))
        cur = max(cur, e)
    if total_dur - cur > 0.02:
        segs.append((cur, total_dur))
    return segs

def extract_letter(src, start, end, out_path, pad=0.06):
    """Cut [start-pad, end+pad] and encode opus.
    Use a VERY gentle edge-trim (-55 dB / 100 ms) — voiceless fricatives like
    /s/ and /h/ sit around -40 dB and were getting cut at tighter thresholds.
    A small fade-in/out kills micro-clicks; loudnorm keeps levels even."""
    s = max(0.0, start - pad)
    dur = (end - start) + 2 * pad
    cmd = ["ffmpeg","-y","-loglevel","error","-ss", f"{s:.3f}","-t", f"{dur:.3f}",
           "-i", str(src),
           "-af", ("silenceremove=start_periods=1:start_silence=0.10:start_threshold=-55dB:"
                   "stop_periods=1:stop_silence=0.10:stop_threshold=-55dB,"
                   "afade=t=in:d=0.015,areverse,afade=t=in:d=0.020,areverse,"
                   "loudnorm=I=-17:TP=-2:LRA=11,aresample=48000"),
           "-c:a","libopus","-b:a","48k","-ar","48000","-ac","1",
           str(out_path)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    return r.returncode == 0 and out_path.exists() and out_path.stat().st_size > 256

def main():
    download()
    silences, dur = detect_silences(SRC, noise="-32dB", d="0.40")
    segs = speech_segments(silences, dur)
    print(f"total {dur:.2f}s, silences={len(silences)}, speech segments={len(segs)}")
    if len(segs) != 26:
        # Retry with slightly different threshold if the count is off.
        for noise in ["-30dB", "-34dB", "-36dB"]:
            silences, dur = detect_silences(SRC, noise=noise, d="0.40")
            segs = speech_segments(silences, dur)
            print(f"  retry noise={noise}: segments={len(segs)}")
            if len(segs) == 26: break
    if len(segs) != 26:
        print(f"ERROR: expected 26 speech segments, found {len(segs)}", file=sys.stderr)
        for i,(a,b) in enumerate(segs): print(f"  {i}: {a:.3f}-{b:.3f} ({b-a:.3f}s)")
        sys.exit(1)
    letters = "abcdefghijklmnopqrstuvwxyz"
    ok = 0
    for (a, b), L in zip(segs, letters):
        out = OUT / f"{L}.opus"
        if extract_letter(SRC, a, b, out):
            ok += 1
            # report final duration
            d = probe_duration(out)
            print(f"  {L}: {a:.3f}-{b:.3f} ({b-a:.3f}s)  ->  {d:.2f}s")
        else:
            print(f"  {L}: FAIL", file=sys.stderr)
    print(f"Done. {ok}/26 extracted.")

if __name__ == "__main__":
    main()
