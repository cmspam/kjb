#!/usr/bin/env bash
# Run THIS only after the user confirms EN audio works.
# Removes the EN-only msys2 packages we installed and deletes tools/voicegen.
set -u
THIS_DIR="$(cd "$(dirname "$0")" && pwd)"
INSTALLED_FILE="$THIS_DIR/.installed_pkgs"
PACMAN="/c/msys64/usr/bin/pacman.exe"
if [ -f "$INSTALLED_FILE" ]; then
  while IFS= read -r p; do
    [ -z "$p" ] && continue
    "$PACMAN" -Rsn --noconfirm "$p" 2>/dev/null || echo "[cleanup] could not uninstall $p"
  done < "$INSTALLED_FILE"
fi
PARENT="$(cd "$THIS_DIR/.." && pwd)"
rm -rf "$THIS_DIR"
[ -d "$PARENT" ] && [ -z "$(ls -A "$PARENT" 2>/dev/null)" ] && rmdir "$PARENT"
echo "[cleanup_en] done"
