#!/usr/bin/env bash
# EN-only re-run with the temp-file Piper fix. The previous run produced muffled
# static because Windows applied CRLF expansion to Piper's stdout pipe and
# corrupted the binary WAV data. This run writes Piper output to a temp .wav
# file (binary-safe), then reads it and encodes to Opus.
#
# Cleanup is NOT auto-run — the user wants to test first. Run cleanup_en.sh
# after confirming audio works.
set -euo pipefail
THIS_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$THIS_DIR/../.." && pwd)"
WORK="$THIS_DIR/work"
PIPER_DIR="$WORK/piper"
LOG="$THIS_DIR/build_en.log"

mkdir -p "$WORK"
exec > >(tee -a "$LOG") 2>&1
echo "==== en regen started: $(date) ===="

MSYS2_ROOT="/c/msys64"
PACMAN="$MSYS2_ROOT/usr/bin/pacman.exe"
export PATH="$MSYS2_ROOT/ucrt64/bin:$MSYS2_ROOT/usr/bin:$PATH"

INSTALLED_FILE="$THIS_DIR/.installed_pkgs"
: > "$INSTALLED_FILE"

ensure_pkg() {
  local p="$1"
  if "$PACMAN" -Qi "$p" >/dev/null 2>&1; then
    echo "[pkg] $p present"
  else
    echo "[pkg] installing $p"
    "$PACMAN" -S --noconfirm --needed "$p"
    echo "$p" >> "$INSTALLED_FILE"
  fi
}

ensure_pkg mingw-w64-ucrt-x86_64-nodejs
ensure_pkg mingw-w64-ucrt-x86_64-ffmpeg

echo "[ver] node=$(node -v)  ffmpeg=$(ffmpeg -version 2>&1 | head -1)"

PIPER_VERSION="2023.11.14-2"
PIPER_URL="https://github.com/rhasspy/piper/releases/download/${PIPER_VERSION}/piper_windows_amd64.zip"
PIPER_ARCHIVE="$WORK/piper.zip"

if [ ! -f "$PIPER_DIR/piper/piper.exe" ]; then
  if [ ! -f "$PIPER_ARCHIVE" ]; then
    echo "[dl] piper..."
    curl -L --fail --retry 3 -o "$PIPER_ARCHIVE" "$PIPER_URL"
  fi
  mkdir -p "$PIPER_DIR"
  unzip -q -o "$PIPER_ARCHIVE" -d "$PIPER_DIR"
fi
PIPER_EXE="$(find "$PIPER_DIR" -maxdepth 3 -iname piper.exe 2>/dev/null | head -1)"
echo "[piper] $PIPER_EXE"

VOICE_NAME="en_US-libritts_r-medium"
VOICE_BASE="https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/libritts_r/medium"
VOICE_DIR="$PIPER_DIR/voice"
mkdir -p "$VOICE_DIR"
ONNX="$VOICE_DIR/$VOICE_NAME.onnx"
JSON="$VOICE_DIR/$VOICE_NAME.onnx.json"
if [ ! -f "$ONNX" ]; then
  echo "[dl] piper voice..."
  curl -L --fail --retry 3 -o "$ONNX"  "$VOICE_BASE/$VOICE_NAME.onnx?download=true"
  curl -L --fail --retry 3 -o "$JSON"  "$VOICE_BASE/$VOICE_NAME.onnx.json?download=true"
fi

echo "[en] running synth..."
node "$THIS_DIR/build_en.js" --repo "$REPO_DIR" --piper "$PIPER_EXE" --voice "$ONNX"

echo "==== en regen finished: $(date) ===="
