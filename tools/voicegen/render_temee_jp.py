#!/usr/bin/env python3
"""
Render the Japanese (non-shiny) voice pack for ティメー サルマクチン via a
locally-running VOICEVOX engine, encode each line to 32 kbps mono Opus, and
write to assets/voices/temee/<hash>.opus.

Workflow (run from msys2 ucrt64 with python+ffmpeg installed):
  1. Download + extract the VOICEVOX engine to a tmp dir
  2. Start `run.exe` (default port 50021)
  3. Run this script
  4. Stop the engine, delete the tmp dir
  5. `pacman -Rsn` the temporary deps if you want to clean up

Speaker selection: looks up "ちび式じい" in /speakers and picks the
first style — the explicit old-man character whose tone matches the
backstory's wise-but-unhinged 300-year-old Gobi camel. If not found,
falls back to a deeper adult male (青山龍星 ノーマル).

The line list mirrors the temee block in js/locale/ja.js — keep them in
sync. Hash includes emojis (matches js/audio.js _hashFor) but the synth
input has emojis stripped because VOICEVOX reads them as Unicode names.
"""

import argparse
import json
import re
import subprocess
import sys
import time
from pathlib import Path
from urllib import request, parse, error

ROOT = Path(__file__).resolve().parent.parent.parent
OUT_DIR = ROOT / "assets" / "voices" / "temee"
OUT_DIR.mkdir(parents=True, exist_ok=True)
TMP_DIR = ROOT / "tools" / "voicegen" / "work" / "temee_jp"
TMP_DIR.mkdir(parents=True, exist_ok=True)

ENGINE_URL = "http://127.0.0.1:50021"
PREFERRED_NAMES = ["ちび式じい", "青山龍星", "玄野武宏"]

# ---- line list (mirrors js/locale/ja.js temee block) ----
CATCHPHRASE = "ティメー サルマクチン、ここに あり〜！こぶ なき者[もの]、すべて 生[は]やすべし のじゃ〜！"
ATTACK_NAMES = [
    "凍[こお]り マントゥーン バースト 🥟",
    "ゴビ サンドストーム 🌪️",
    "マイナス40度[ど]の 冬[ふゆ] ❄️",
    "草原[そうげん] スラッシュ 🌿",
    "2[ふた]つの こぶ スラム 🐫",
]
ATTACK_PHRASES = [
    "冷凍[れいとう]ブーズ、いくぞい！", "ガチガチに こおっとる ぞい！", "ワシの ばんごはん や〜！",
    "ゴビの あらし じゃ〜！", "砂[すな]に うもれて しまえ！", "目[め]を あけられん じゃろ？",
    "ゴビの 冬[ふゆ] しらんのか？", "マイナス40度[ど]、こおりつけ！", "ふるえて ねむれい！",
    "ステップの 草[くさ] は かみそりじゃ！", "シャキーン と いくぞい！", "モンゴルの 草[くさ] あなどるな！",
    "こぶ で つぶす ぞい！", "2[ふた]つも あるからの〜！", "ラクダ・パワー じゃ〜！",
]
HITS = [
    "うむ、なかなか やるのう", "ワシの ヒゲ が…！", "こぶ に 当[あ]たった のう", "やるのう、こぞう",
    "ぐぬぬ…", "サルの 頭[あたま]、痛[いた]いぞい！", "な、なんと…！", "ワシ、まだまだ じゃぞ",
    "ふぬぬ、効[き]いとる…", "砂[すな]が 目[め]に 入[はい]った わい", "ラクダ も 痛[いた]いんじゃ！", "なんじゃ、その 力[ちから]…",
    "ワシ、年寄[としよ]り じゃぞ…？", "こぶ が 凹[へこ]んだ…", "むむむ、つよい のう", "ぐ、まだ じゃ…",
    "ワシの しっぽ が…", "ゴビ の こおりも 溶[と]ける ぞい！", "やるのう、にんげんの 子[こ]", "ぐっ、肉[にく]まんが…！",
    "300年[ねん]で はじめて じゃ こんな こと…", "ブーズが こぼれた のう…", "ふぉっふぉっ、おもろい！", "あちゃ〜！",
    "サル の 反射[はんしゃ]神経[しんけい]、なめるな！", "ラクダ・スピード じゃ！", "Tralalero と 友[とも]だち じゃ ぞ！", "Bombardiro と さばく で あった のう",
    "Brrr…さむい のう", "ゴビ の 風[かぜ] じゃ", "肉[にく]まん の 革命[かくめい] じゃ！", "ぜんぶ ブーズに してやる！",
    "ワシ、サル じゃ…？ ラクダ じゃ…？", "わすれた のう、 どっち だったか…", "サル も ラクダ も みんな 友[とも]じゃ！",
    "ピカチュウ より つよい ぞ！", "ポケモン に なる ぞい！", "ドラえも〜ん、ブーズ ちょうだい！",
    "もうマンパイ じゃ…！", "ぴえん、 ぴえん…", "ぐぬぬぬ、 草[くさ] 草[くさ] 草[くさ]",
    "ふぉっふぉっふぉ", "ふがっ！", "ぬっ！", "あぱっ！", "ほぇ〜！", "ぼけ〜！",
    "300年[ねん]の 経験[けいけん] が…！", "ハーン に なる のじゃ〜！", "ゲル に かえりたい…", "オボー が こいしい のう",
]
TAUNTS = {
    "slingshot": ["ねらいは あまい のじゃ〜！", "あたるかのう？", "ワシ ラクダ じゃぞ、にげ足[あし] はやい！", "ほれ、うってみい！", "年寄[としよ]り、なめる でない！", "ワシに あたる は 100年[ねん] 早[はや]い のう！", "シャキッと せい！", "ふぉっふぉっ、たのしい のう"],
    "rage": ["ワシ おこったぞ！", "もう ゆるさん のじゃ！", "ゴビ の せかいで けっとう じゃ！", "サルの 怒[いか]り、しれ！", "チンギス・ハーン の 子孫[しそん] じゃ ぞ！"],
    "healthy": ["ワシ まだ げんき じゃ！", "サル + ラクダ、最強[さいきょう] じゃ！", "こんな こぶ、こわせまい！", "ゴビ で 鍛[きた]えた 体[からだ] ぞ！", "300年[ねん]の けいけん じゃ！", "もっと もんだい とけ や"],
    "hurt": ["ワシ、まだ 負[ま]けん のじゃ！", "年寄[としよ]りを なめるな よ！", "こぶ に エネルギー 蓄[たくわ]えとる ぞい！", "ふぬぬ、効[き]いとる…", "ワシ、まだまだ じゃぞ", "うむ、なかなか やるのう"],
    "desperate": ["むむむ、これは まずい のう…", "ワシの こぶ が…！", "ま、まだ じゃ…", "ゴビ に かえりたい のう…", "ぐぬぬ、ワシ まけそう…", "ブーズ 食[た]べたい…"],
    "raged": ["ゴビの あらし、ふけ！", "ワシ、本気[ほんき] じゃぞ！", "サル の 怒[いか]り、しれ！", "チンギス モード じゃ！", "ぜんいん こぶ じゃ〜！"],
    "player_low_hp": ["とどめ じゃ〜！", "もう おわり じゃ のう？", "ラクダ騎馬[きば]隊[たい]、あつまれ！", "ゴビ送[おく]り じゃ〜！"],
    "high_combo": ["うぬ、ワシ 油断[ゆだん] したか…", "やるのう こども、やるのう！", "とまらん のじゃ、こやつ…", "300年[ねん]で はじめての ピンチ じゃ！"],
    "part_lost": ["ワシの 体[からだ] が…！", "こぶ ひとつ うしなった ぞ！", "あ、サル の しっぽ が…", "それ、 だいじ なやつ ぞい！", "ぐぬぬぬ、 やられた のう…"],
}

# ---- hash + clean (mirror js/audio.js) ----
FURIGANA_RE = re.compile(r'([一-鿿々ヶ]+)\[([^\]]+)\]')
EMOJI_RE = re.compile(
    "[" "\U0001F000-\U0001FFFF"
        "\U00002600-\U000027BF"
        "\U00002B00-\U00002BFF"
        "‍️⃣〰" "]+", flags=re.UNICODE)

def strip_furigana(s):
    return FURIGANA_RE.sub(r"\2", s)

def clean_for_hash(s):
    return re.sub(r"\s+", " ", strip_furigana(s)).strip()

def djb2(s):
    """Match js/audio.js _hashFor exactly. JS uses UTF-16 code units;
    codepoints > 0xFFFF (most emojis) are stored as surrogate pairs."""
    h = 5381
    for c in s:
        cp = ord(c)
        if cp > 0xFFFF:
            cp2 = cp - 0x10000
            hi = 0xD800 + (cp2 >> 10)
            lo = 0xDC00 + (cp2 & 0x3FF)
            h = ((h << 5) + h + hi) & 0xFFFFFFFF
            h = ((h << 5) + h + lo) & 0xFFFFFFFF
        else:
            h = ((h << 5) + h + cp) & 0xFFFFFFFF
    return f"{h:08x}"

def strip_emoji(s):
    """Remove emojis for synthesis (VOICEVOX would otherwise pronounce them
    as their text fallback names). Hash is computed on the original."""
    return EMOJI_RE.sub("", strip_furigana(s)).strip()

# ---- VOICEVOX HTTP API ----
def http_get(url):
    with request.urlopen(url, timeout=30) as r:
        return r.read()

def http_post(url, payload=None, headers=None):
    body = json.dumps(payload).encode("utf-8") if payload is not None else b""
    h = {"Content-Type": "application/json"} if payload is not None else {}
    if headers: h.update(headers)
    req = request.Request(url, data=body, headers=h, method="POST")
    with request.urlopen(req, timeout=60) as r:
        return r.read()

def wait_for_engine(timeout_s=60):
    start = time.time()
    while time.time() - start < timeout_s:
        try:
            http_get(f"{ENGINE_URL}/version")
            return True
        except Exception:
            time.sleep(1)
    return False

def pick_speaker():
    speakers = json.loads(http_get(f"{ENGINE_URL}/speakers"))
    for name in PREFERRED_NAMES:
        for sp in speakers:
            if sp.get("name") == name and sp.get("styles"):
                style = sp["styles"][0]
                print(f"  speaker: {name} / {style.get('name','?')} (id={style['id']})")
                return style["id"], name, style.get("name", "")
    # Last-ditch: any male-ish adult voice
    for sp in speakers:
        if sp.get("styles"):
            style = sp["styles"][0]
            print(f"  fallback speaker: {sp['name']} / {style.get('name','?')} (id={style['id']})")
            return style["id"], sp["name"], style.get("name", "")
    raise RuntimeError("no speakers available")

def synth_line(speaker_id, text, out_wav):
    spoken = strip_emoji(text)
    if not spoken:
        return False
    # 1) audio_query
    q = parse.urlencode({"text": spoken, "speaker": speaker_id})
    audio_query = json.loads(http_post(f"{ENGINE_URL}/audio_query?{q}"))
    # Old-man voice tuning: slightly slower, slightly lower pitch.
    audio_query["speedScale"] = 0.95
    audio_query["pitchScale"] = -0.02
    audio_query["volumeScale"] = 1.05
    # 2) synthesis
    q2 = parse.urlencode({"speaker": speaker_id})
    wav = http_post(f"{ENGINE_URL}/synthesis?{q2}", payload=audio_query,
                    headers={"Accept": "audio/wav"})
    out_wav.write_bytes(wav)
    return True

def encode_opus(in_wav, out_opus):
    # VOICEVOX output is already clean (no leading/trailing silence to speak
    # of). The previous aggressive silenceremove (-45dB threshold, 0.4s
    # stop_duration) was clipping the tails of words that ended on a soft
    # consonant or trailing vowel — kid heard "ぞい" cut to "ぞ", "じゃ〜！"
    # cut to "じゃ". Just trim a tiny bit of leading silence and leave the
    # tail completely alone.
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error",
         "-i", str(in_wav),
         "-c:a", "libopus", "-b:a", "32k", "-ac", "1", "-ar", "48000",
         "-af", "silenceremove=start_periods=1:start_silence=0.04:start_duration=0.08:start_threshold=-50dB",
         str(out_opus)],
        check=True,
    )

def main():
    global ENGINE_URL
    ap = argparse.ArgumentParser()
    ap.add_argument("--engine-url", default=ENGINE_URL)
    args = ap.parse_args()
    ENGINE_URL = args.engine_url

    print(f"Waiting for engine at {ENGINE_URL} ...")
    if not wait_for_engine():
        print("engine never came up", file=sys.stderr)
        sys.exit(1)
    print("engine OK")

    speaker_id, sp_name, style_name = pick_speaker()

    # Build deduped line list with kind for tuning later if needed.
    seen = set()
    lines = []  # (text, kind)
    def add(t, kind):
        c = clean_for_hash(t)
        if not c: return
        h = djb2(c)
        if h in seen: return
        seen.add(h)
        lines.append((t, kind, h))
    add(CATCHPHRASE, "catchphrase")
    for n in ATTACK_NAMES: add(n, "attack-name")
    for p in ATTACK_PHRASES: add(p, "attack-phrase")
    for hit in HITS: add(hit, "hit")
    for cat, items in TAUNTS.items():
        for it in items: add(it, f"taunt-{cat}")

    print(f"rendering {len(lines)} unique lines → {OUT_DIR}")
    ok, fail, skip = 0, 0, 0
    for i, (text, kind, h) in enumerate(lines, 1):
        out_opus = OUT_DIR / f"{h}.opus"
        if out_opus.exists() and out_opus.stat().st_size > 0:
            skip += 1
            continue
        wav = TMP_DIR / f"{h}.wav"
        try:
            if not synth_line(speaker_id, text, wav):
                print(f"  EMPTY {i}: {text!r}")
                fail += 1
                continue
            encode_opus(wav, out_opus)
            ok += 1
            print(f"  {i:3d}/{len(lines)} {h}.opus  {kind:14s}  {text!r}")
        except (subprocess.CalledProcessError, error.URLError, error.HTTPError) as e:
            print(f"  FAIL {i}: {e}", file=sys.stderr)
            fail += 1
        finally:
            try: wav.unlink()
            except FileNotFoundError: pass

    print(f"\nDone: {ok} rendered, {skip} skipped (already present), {fail} failed")
    print(f"Output dir: {OUT_DIR}")
    print(f"Used speaker: {sp_name} / {style_name} (id={speaker_id})")

if __name__ == "__main__":
    main()
