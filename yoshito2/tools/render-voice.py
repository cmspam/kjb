#!/usr/bin/env python3
# Voice renderer for yoshito2 cutscenes. JP only, VOICEVOX on :50021.
# Each line has an explicit id; output is voice/<id>.mp3 (mono 48k, trimmed).
# Idempotent: existing files are skipped unless --force.
import os, sys, json, subprocess, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "voice")
VV = "http://127.0.0.1:50021"
FORCE = "--force" in sys.argv
os.makedirs(OUT, exist_ok=True)

# id -> (speaker_id, text, intonation_boost)
#   81 = 青山龍星 熱血   (hero power-up shouts)
#   88 = 後鬼 鬼ver.     (boss taunts)
#   32 = 白上虎太郎 わーい (cheerful announcer)
LINES = {
    # ---- battle start ----
    "start":       (32, "たたかい かいし！ いくぞー！", 1.2),

    # ---- boss taunts ----
    "boss_appear": (88, "フハハハ！ ギガインポスターさまの おでましだ！", 1.1),
    "boss_taunt1": (88, "おまえの タワーは、わたしが こわす！", 1.1),
    "boss_enrage": (88, "もう ようしゃ しないぞ！ かくごしろ！", 1.2),

    # ---- hero power-up / henshin ----
    "power_1": (81, "パワーアップ！ いくぞー！", 1.4),
    "power_2": (81, "へんしん！ ニャーニャコ パワー！", 1.4),
    "power_3": (81, "うおおお！ ちからが あふれて くる！", 1.4),
    "power_4": (81, "みんな、ちからを かして！", 1.3),
    "power_5": (81, "ぜったいに まけないっ！", 1.4),

    # ---- win / lose ----
    "win":  (32, "やったー！ かんぜん しょうり！", 1.3),
    "lose": (32, "ああ、タワーが こわされちゃった…", 0.9),
}

def ja_synth_text(t):
    import re
    t = re.sub(r"(^|\s)は(?=$|[\s、。！？])", lambda m: m.group(1) + "わ", t)
    t = re.sub(r"(^|\s)へ(?=$|[\s、。！？])", lambda m: m.group(1) + "え", t)
    t = re.sub(r"\s+", "", t)
    return t.replace("・", "").replace("〜", "ー").replace("～", "ー")

TRIM = ("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03:detection=peak,"
        "areverse,"
        "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03:detection=peak,"
        "areverse")

def render(key, speaker, raw, inton):
    out = os.path.join(OUT, key + ".mp3")
    if os.path.exists(out) and os.path.getsize(out) > 200 and not FORCE:
        return "skip"
    t = ja_synth_text(raw)
    q = subprocess.run(["curl", "-s", "-X", "POST",
        "%s/audio_query?speaker=%d&text=%s" % (VV, speaker, urllib.parse.quote(t))],
        capture_output=True)
    if not q.stdout or q.stdout[:1] != b"{":
        return "FAIL(query)"
    query = json.loads(q.stdout)
    query["intonationScale"] = inton
    query["volumeScale"] = 1.05
    query["prePhonemeLength"] = 0.05
    query["postPhonemeLength"] = 0.1
    open("/tmp/vv_q.json", "w", encoding="utf-8").write(json.dumps(query))
    syn = subprocess.run(["curl", "-s", "-X", "POST", "%s/synthesis?speaker=%d" % (VV, speaker),
        "-H", "Content-Type: application/json", "--data-binary", "@/tmp/vv_q.json"], capture_output=True)
    if not syn.stdout or syn.stdout[:4] != b"RIFF":
        return "FAIL(synth)"
    open("/tmp/vv_o.wav", "wb").write(syn.stdout)
    r = subprocess.run(["ffmpeg", "-y", "-i", "/tmp/vv_o.wav", "-af", TRIM,
        "-ac", "1", "-b:a", "64k", out], capture_output=True)
    if r.returncode != 0 or not os.path.exists(out):
        return "FAIL(ffmpeg)"
    return "made"

made = skipped = failed = 0
for key, (sp, raw, inton) in LINES.items():
    res = render(key, sp, raw, inton)
    print("%-14s %s" % (key, res))
    if res == "made": made += 1
    elif res == "skip": skipped += 1
    else: failed += 1
print("\nmade=%d skipped=%d failed=%d  -> %s" % (made, skipped, failed, OUT))
sys.exit(1 if failed else 0)
