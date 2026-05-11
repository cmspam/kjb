#!/usr/bin/env python3
"""
Render the Japanese (non-shiny) voice pack for キャッチャースキー クレーノフ
via a locally-running VOICEVOX engine, encode each line to 32 kbps mono
Opus, and write to assets/voices/catcherski/<hash>.opus.

See tools/voicegen/render_temee_jp.py for the full workflow notes.

Speaker selection: looks up "青山龍星" in /speakers and picks the first
style for a deeper adult-male delivery that suits the menacing-arcade-
machine vibe. Falls back to 玄野武宏 or ちび式じい if not found.
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
OUT_DIR = ROOT / "assets" / "voices" / "catcherski"
OUT_DIR.mkdir(parents=True, exist_ok=True)
TMP_DIR = ROOT / "tools" / "voicegen" / "work" / "catcherski_jp"
TMP_DIR.mkdir(parents=True, exist_ok=True)

ENGINE_URL = "http://127.0.0.1:50021"
# Prefer a deep adult-male voice for the machine-with-Russian-hacker
# personality. ちび式じい fallback in case the others aren't found.
PREFERRED_NAMES = ["青山龍星", "玄野武宏", "ちび式じい"]

# ---- line list (mirrors js/locale/ja.js catcherski block) ----
CATCHPHRASE = "キャッチャースキー クレーノフ、 100円[えん] イレロ ピッ！"
ATTACK_NAMES = [
    "プランジング クロー 🦞",
    "100円[えん] ブリザード 🪙",
    "ハズレ・ガッカリ 🚫",
    "エモジ シャワー 💢",
    "ハック ビーム 💻",
]
ATTACK_PHRASES = [
    "クロー イクゾ ピッ！", "ガッシャン アタック！", "Хорошо、 ガシッ！",
    "100円 ふぶき じゃ〜！", "コイン ぜんぶ いれろ ピッ！", "Больше コイン よこせ！",
    "あと ちょっと だった ぞ！", "ザンネン ピッ！もう 1回[いっかい]！", "Жаль〜、 ハズレ じゃ！",
    "エモジ ぜんぶ ハッキング ずみ！", "ハコ から ハッシン ピッ！", "Эмодзи アタック ぱぱぱぱ！",
    "ロシアン・ハック ビーム！", "アンチウィルス? ムダ じゃ ピッ！", "Хакер パワー、 ガード ぶち抜[ぬ]き！",
]
HITS = [
    "ピッ！", "ザンネン！", "もう 1回[いっかい] ピッ！", "100円 いれろ！",
    "アンチウィルス か？", "Ой!", "Больно〜！", "Не работает!",
    "クロー こわれた ピッ！", "ハック されとる！", "БИП БИП БИП！", "Сломался…",
    "Привет こども！", "Хорошо〜", "Жаль〜", "Стоп ピッ！",
    "ロシア・パワー が…！", "コイン うけつけられん！", "プログラム エラー！", "ファイアウォール 突破[とっぱ] されとる！",
    "ВЫ ВЫИГРАЛИ?? いや、 ハズレ！", "ガラス わるな ピッ！", "あと ちょっと だった！", "もう ちょっと！もう ちょっと！",
    "Дай мне デンキ！", "おでこ ピッ！", "コインが…！", "Где мои コイン？",
    "アーケード モード OFF…", "Перезагрузка ぴっ！", "リブート ちゅう…", "Ошибка システム！",
    "ウィンドウズ XP みたい じゃ！", "ブルー スクリーン ピッ！", "Синий экран！", "アップデート しろ ぴっ！",
    "ニコ動 みすぎ じゃ ピッ！", "2ch カイザー！", "Привет 5ch！", "Спасибо コイン〜",
    "草 草 草 ピッ！", "やばたん ピッ！", "ぴえん超[こ]え ぱおん БИП！", "それな〜 ピッ",
    "ゲーセン パワー！", "アキバ パワー！", "Москва アキバ ハイブリッド！",
    "クレーン ぐにゃっ！", "ピッ、 ぴっ、 ぴ〜", "ガシャン！", "ボロン！",
    "アー ア〜 ハック されとる ぞ！", "Хакер！誰[だれ]だ！", "ハッカー、 でてこい ピッ！",
    "Конец игры…か？", "まだ おわらん ピッ！",
]
TAUNTS = {
    "slingshot": ["ねらえ ヘタクソ ピッ！", "あたるかな〜 ぴっ ぴっ！", "100円 たりん ぞ！", "Давай！うってこい！", "ザンネン ばかり ぞ ピッ！", "Промахнёшься〜！", "ワシ ガード つよい ぞ！", "Привет こども！"],
    "rage":      ["БОМБА！ハック モード ぴっ！", "ロシア・パワー で つぶす ぞ！", "Хакер 本気[ほんき]！", "100円 100まい よこせ！", "Гнев モード ピッ！"],
    "healthy":   ["ワシ ぜんぜん ダメージ なし ピッ！", "もっと 100円 いれろ ぞ！", "Хорошо、 まだまだ じゃ！", "ハック ふせげない ぞ ピッ！", "Привет こども、 まだ つよい ぞ！", "ふっ、 よわい ぞ ピッ"],
    "hurt":      ["イタッ ピッ！", "やられた ぞ ピッ！", "Ой! まだまだ じゃ！", "アンチウィルス か？", "ザンネン ピッ！", "Больно〜！"],
    "desperate": ["100円 たりん ぞ！", "Помогите〜！", "もう ダメ ピッ…", "セキュリティ・パッチ よこせ！", "ばってり きれ ピッ…", "Сломался…"],
    "raged":     ["БОМБА！ハック モード ぴっ！", "Гнев モード ピッ！", "ロシア・パワー で つぶす ぞ！", "Хакер 本気[ほんき]！", "100円 100まい よこせ！"],
    "player_low_hp": ["とどめ ピッ！", "もう おわり ぞ ぴっ！", "Конец игры！", "Game Over ピッ〜！"],
    "high_combo": ["ザンネン ザンネン ぴっ！", "コンボ ハック されろ！", "Стоп! やめろ！", "プログラム エラー ピッ！"],
    "part_lost": ["パーツ! ワシの パーツ ピッ！", "それは ずるい ぞ！", "Сломал! こわした な！", "イタッ ピッ！", "Не трогай！"],
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
    """Match js/audio.js _hashFor exactly. JS strings are UTF-16; codepoints
    > 0xFFFF (most emojis) are stored as surrogate pairs."""
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
    """Remove emojis + collapse ALL whitespace (incl U+3000) before
    synthesis. Hash uses single-space-collapsed form; spoken pass strips
    spaces entirely so VOICEVOX doesn't insert phrase-pauses between
    word groups (which would make catcherski sound like a slow robot)."""
    s = strip_furigana(s)
    s = EMOJI_RE.sub("", s)
    s = re.sub(r"[\s　]+", "", s)
    return s.strip()

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
    q = parse.urlencode({"text": spoken, "speaker": speaker_id})
    audio_query = json.loads(http_post(f"{ENGINE_URL}/audio_query?{q}"))
    # Arcade-robot tuning: slightly faster, neutral pitch, full volume.
    audio_query["speedScale"] = 1.05
    audio_query["pitchScale"] = 0.0
    audio_query["volumeScale"] = 1.05
    q2 = parse.urlencode({"speaker": speaker_id})
    wav = http_post(f"{ENGINE_URL}/synthesis?{q2}", payload=audio_query,
                    headers={"Accept": "audio/wav"})
    out_wav.write_bytes(wav)
    return True

def encode_opus(in_wav, out_opus):
    # VOICEVOX output is clean — minimal leading trim, no tail trim
    # (avoid clipping the soft "ぴっ" beeps that end most lines).
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

    seen = set()
    lines = []
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

    print(f"\nDone: {ok} rendered, {skip} skipped, {fail} failed")
    print(f"Output dir: {OUT_DIR}")
    print(f"Used speaker: {sp_name} / {style_name} (id={speaker_id})")

if __name__ == "__main__":
    main()
