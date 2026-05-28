#!/usr/bin/env python3
"""Synthesize the SUSTAINED continuant phonics sounds for もじ アタック.

TTS spells these out ("ffff" -> "eff eff eff") and Wikimedia's IPA clips
are vowel-flanked demos, so we generate them directly with ffmpeg — pure,
sustained, copyright-free, fully under our control:

  voiceless fricatives (s,f) = filtered noise (turbulence)
  nasals (m,n)               = harmonic voice-buzz low-passed (nasal murmur)
  voiced fricatives (z,v)    = fricative noise + voice-buzz mixed
  approximants (l,r)         = voice-buzz shaped to each sound's formants

Output: assets/audio/phonics/<letter>.opus  (overwrites the TTS versions).
The other 18 letters (stops, glides, vowels) are rendered by
render_audio_phonics.py in a clear standard voice.
ffmpeg required on PATH.
"""
import subprocess, sys
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent.parent / "assets" / "audio" / "phonics"
OUT.mkdir(parents=True, exist_ok=True)
SR = 48000
DUR = 0.55

# letters synthesized here (kept in sync with render_audio_phonics.py SYNTH)
SYNTH = ["s", "f", "z", "v", "m", "n", "l", "r"]

def buzz(f0, amp=0.5, n=9):
    """Glottal-ish buzz: sum of harmonics of f0 with 1/k falloff."""
    terms = "+".join(f"{(1.0/k):.3f}*sin(2*PI*{int(f0*k)}*t)" for k in range(1, n + 1))
    return f"aevalsrc=exprs='({terms})*{amp}':d={DUR}:s={SR}"

def noise(color, amp=0.6):
    return f"anoisesrc=color={color}:amplitude={amp}:duration={DUR + 0.05}:sample_rate={SR}"

TAIL = (f"afade=t=in:d=0.05,afade=t=out:st={DUR-0.10:.2f}:d=0.10,"
        f"loudnorm=I=-17:TP=-2:LRA=11,aresample={SR}")

RECIPES = {
    # s: high-frequency hiss
    "s": ([noise("white", 0.7)],
          f"[0:a]highpass=f=4200,highpass=f=4200,bandpass=f=7000:width_type=h:w=4000,{TAIL}[out]"),
    # f: softer broadband
    "f": ([noise("pink", 0.6)],
          f"[0:a]highpass=f=1000,lowpass=f=9500,volume=1.4,{TAIL}[out]"),
    # z: s-hiss + voicing
    "z": ([buzz(150), noise("white", 0.6)],
          f"[1:a]highpass=f=4000[n];[0:a][n]amix=inputs=2:weights=1 0.7:normalize=0[mx];[mx]{TAIL}[out]"),
    # v: f-noise + voicing
    "v": ([buzz(140), noise("pink", 0.5)],
          f"[1:a]highpass=f=1000,lowpass=f=9000[n];[0:a][n]amix=inputs=2:weights=1 0.6:normalize=0[mx];[mx]{TAIL}[out]"),
    # m: bilabial nasal murmur (low)
    "m": ([buzz(130)],
          f"[0:a]lowpass=f=900,equalizer=f=250:width_type=o:width=1:g=6,{TAIL}[out]"),
    # n: alveolar nasal (a touch brighter)
    "n": ([buzz(140)],
          f"[0:a]lowpass=f=1700,equalizer=f=300:width_type=o:width=1:g=5,equalizer=f=1500:width_type=o:width=1:g=4,{TAIL}[out]"),
    # l: lateral approximant formants
    "l": ([buzz(130)],
          f"[0:a]equalizer=f=360:width_type=o:width=1:g=6,equalizer=f=1300:width_type=o:width=1:g=5,lowpass=f=3000,{TAIL}[out]"),
    # r: approximant, low third formant
    "r": ([buzz(120)],
          f"[0:a]equalizer=f=320:width_type=o:width=1:g=6,equalizer=f=1100:width_type=o:width=1:g=5,equalizer=f=1600:width_type=o:width=1:g=5,lowpass=f=2600,{TAIL}[out]"),
}

def run(letter):
    inputs, fc = RECIPES[letter]
    out = OUT / f"{letter}.opus"
    cmd = ["ffmpeg", "-y", "-loglevel", "error"]
    for inp in inputs:
        cmd += ["-f", "lavfi", "-i", inp]
    cmd += ["-filter_complex", fc, "-map", "[out]",
            "-c:a", "libopus", "-b:a", "48k", "-ar", str(SR), "-ac", "1", str(out)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    ok = r.returncode == 0 and out.exists() and out.stat().st_size > 256
    print(f"  {letter}: {'ok' if ok else 'FAIL'}  {('' if ok else r.stderr[:300])}")
    return ok

if __name__ == "__main__":
    only = sys.argv[1:] or SYNTH
    n = sum(run(l) for l in only)
    print(f"Done. {n}/{len(only)} synthesized.")
