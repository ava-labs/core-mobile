#!/usr/bin/env bash
set -e

usage() {
  echo "usage: $0 <package[@version]> [-v <version>] [--locator <locator>]"
  echo "examples:"
  echo "  $0 @walletconnect/core"
  echo "  $0 @walletconnect/utils -v 2.16.1"
  echo "  $0 @walletconnect/utils --locator @walletconnect/utils@npm:2.16.1"
  exit 1
}

[[ $# -ge 1 ]] || usage
PKG="$1"; shift || true

VER=""
LOC=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    -v|--version) VER="${2:-}"; shift 2 ;;
    --locator)    LOC="${2:-}"; shift 2 ;;
    -h|--help)    usage ;;
    *) echo "unknown arg: $1"; usage ;;
  esac
done

# If --locator given, use it verbatim. Else build from PKG + optional -v.
if [[ -n "$LOC" ]]; then
  PATCH_ARG="$LOC"
else
  if [[ -n "$VER" ]]; then
    # Yarn Berry expects protocol when multiple versions exist
    PATCH_ARG="${PKG%@*}@npm:${VER}"
  else
    PATCH_ARG="$PKG"
  fi
fi

# Resolve node_modules path (supports @scope/name and optional @version)
if [[ "$PKG" == @*/* ]]; then
  SCOPE="${PKG%%/*}"          # @scope
  REST="${PKG#*/}"            # name[@version]
  NAME="${REST%%@*}"          # name
  PKG_DIR="node_modules/$SCOPE/$NAME"
else
  NAME="${PKG%%@*}"
  PKG_DIR="node_modules/$NAME"
fi

echo "→ yarn patch $PATCH_ARG"
OUT="$(yarn patch "$PATCH_ARG" 2>&1 | tee /dev/stderr)"

# Handle the “multiple candidate packages found” case nicely
if grep -q "Multiple candidate packages found" <<<"$OUT"; then
  echo "❌ Multiple versions installed. Try:"
  echo "   yarn why ${PKG%@*}"
  echo "   then re-run with:"
  echo "   $0 ${PKG%@*} --locator ${PKG%@*}@npm:<version>"
  exit 1
fi

TMP_DIR="$(sed -nE 's/.*edit the following folder: (.*)$/\1/p' <<<"$OUT" | tail -n1)"
[[ -d "$TMP_DIR" ]] || { echo "❌ Failed to get yarn patch temp dir"; exit 1; }
[[ -d "$PKG_DIR" ]] || { echo "❌ Package dir not found: $PKG_DIR"; exit 1; }

echo "→ Copying $PKG_DIR → $TMP_DIR"
cp -a "$PKG_DIR"/. "$TMP_DIR"/

echo "→ yarn patch-commit"
# NOTE: On Yarn Berry, -s takes NO message string
yarn patch-commit -s "$TMP_DIR"

echo "✅ Patch created under .yarn/patches"
