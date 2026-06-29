#!/usr/bin/env python3
# Voice renderer for yoshitolesson. ずんだもん (speaker 3) guide lines.
# Output: voice/<id>.mp3 (mono 64k, trimmed). Idempotent unless --force.
import os, sys, json, subprocess, urllib.parse, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "voice")
VV = "http://127.0.0.1:50021"
FORCE = "--force" in sys.argv
os.makedirs(OUT, exist_ok=True)
ZUNDA = 3

# id -> text  (ずんだもん, friendly, hiragana, ends in のだ)
LINES = {
    "welcome":  "やあ！ ぼくは ずんだもん。いっしょに ゲームの つくりかたを まなぶのだ！",
    "l1_intro": "へんすうは、なまえの ついた はこ なのだ。すうじを かえると、キャラが つよく なるのだ！",
    "l2_intro": "いろも コードで きめるのだ。すきな いろを えらんでみるのだ！",
    "l3_intro": "くりかえしを つかうと、いちどに たくさん つくれるのだ！",
    "l4_intro": "もし〜なら、で コンピューターは かんがえるのだ。やってみるのだ！",
    "l5_intro": "じぶんだけの ステージを つくってみるのだ！ きみが ゲームデザイナー なのだ！",
    "praise1":  "すごいのだ！",
    "praise2":  "やったのだ！ てんさい なのだ！",
    "praise3":  "その ちょうし なのだ！",
    "correct":  "せいかい なのだ！",
    "clear":    "ぜんぶ クリア なのだ！ きみは りっぱな プログラマー なのだ！",
}

def ja(t):
    t = re.sub(r"(^|\s)は(?=$|[\s、。！？])", lambda m: m.group(1)+"わ", t)
    t = re.sub(r"(^|\s)へ(?=$|[\s、。！？])", lambda m: m.group(1)+"え", t)
    t = re.sub(r"\s+", "", t)
    return t.replace("・","").replace("〜","ー").replace("～","ー")

TRIM = ("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03:detection=peak,areverse,"
        "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03:detection=peak,areverse")

def render(key, raw):
    out = os.path.join(OUT, key+".mp3")
    if os.path.exists(out) and os.path.getsize(out) > 200 and not FORCE: return "skip"
    q = subprocess.run(["curl","-s","-X","POST",
        "%s/audio_query?speaker=%d&text=%s"%(VV,ZUNDA,urllib.parse.quote(ja(raw)))], capture_output=True)
    if not q.stdout or q.stdout[:1]!=b"{": return "FAIL(query)"
    query = json.loads(q.stdout); query["intonationScale"]=1.2; query["volumeScale"]=1.05
    open("/tmp/lv_q.json","w",encoding="utf-8").write(json.dumps(query))
    syn = subprocess.run(["curl","-s","-X","POST","%s/synthesis?speaker=%d"%(VV,ZUNDA),
        "-H","Content-Type: application/json","--data-binary","@/tmp/lv_q.json"], capture_output=True)
    if not syn.stdout or syn.stdout[:4]!=b"RIFF": return "FAIL(synth)"
    open("/tmp/lv_o.wav","wb").write(syn.stdout)
    r = subprocess.run(["ffmpeg","-y","-i","/tmp/lv_o.wav","-af",TRIM,"-ac","1","-b:a","64k",out], capture_output=True)
    return "made" if r.returncode==0 and os.path.exists(out) else "FAIL(ffmpeg)"

made=skip=fail=0
for k,t in LINES.items():
    r=render(k,t); print("%-10s %s"%(k,r))
    made+=(r=="made"); skip+=(r=="skip"); fail+=(r not in ("made","skip"))
print("\nmade=%d skip=%d fail=%d -> %s"%(made,skip,fail,OUT))
sys.exit(1 if fail else 0)
