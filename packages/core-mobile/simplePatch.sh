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

# Resolve repo root and Yarn patches directory (works when run from subdirs)
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
PATCH_DIR="$REPO_ROOT/.yarn/patches"
mkdir -p "$PATCH_DIR"

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
# Use rsync to exclude android/build, android/.cxx, and node_modules if available
if command -v rsync >/dev/null 2>&1; then
  rsync -a \
    --exclude '/android/build/***' \
    --exclude '/android/.cxx/***' \
    --exclude '/**/node_modules/***' \
    "$PKG_DIR"/ "$TMP_DIR"/
else
  cp -a "$PKG_DIR"/. "$TMP_DIR"/
  # Remove android/build, android/.cxx, and node_modules directories if present
  find "$TMP_DIR" -type d \( -path '*/android/build' -o -path '*/android/.cxx' -o -path '*/node_modules' \) -prune -exec rm -rf {} +
fi

# Snapshot existing patches to reliably detect the new file
PRE_PATCH_LIST=$(ls -1 "$PATCH_DIR"/*.patch 2>/dev/null || true)

echo "→ yarn patch-commit"
# NOTE: On Yarn Berry, -s takes NO message string
PATCH_COMMIT_OUT="$(yarn patch-commit -s "$TMP_DIR" 2>&1 | tee /dev/stderr)"

# Try to extract the patch path directly from yarn output
PATCH_FROM_OUTPUT=$(echo "$PATCH_COMMIT_OUT" | grep -Eo '\.yarn/patches/[^[:space:]]+\.patch' | tail -n1 || true)
if [[ -n "$PATCH_FROM_OUTPUT" ]]; then
  # Normalize to absolute path
  if [[ "$PATCH_FROM_OUTPUT" = /* ]]; then
    LATEST_PATCH="$PATCH_FROM_OUTPUT"
  else
    LATEST_PATCH="$REPO_ROOT/$PATCH_FROM_OUTPUT"
  fi
else
  # Fallback: detect the newly created patch path via snapshot diff
  POST_PATCH_LIST=$(ls -1 "$PATCH_DIR"/*.patch 2>/dev/null || true)
  NEW_PATCH=""
  if [[ -n "$POST_PATCH_LIST" ]]; then
    for f in $POST_PATCH_LIST; do
      echo "$PRE_PATCH_LIST" | grep -qx "$f" || NEW_PATCH="$f"
    done
  fi
  # Final fallback to newest in PATCH_DIR
  LATEST_PATCH="${NEW_PATCH:-$(ls -t "$PATCH_DIR"/*.patch 2>/dev/null | head -n1 || true)}"
fi

if [[ -n "$LATEST_PATCH" && -f "$LATEST_PATCH" ]]; then
  echo "→ Filtering out diffs touching android/build, android/.cxx, and node_modules in: $LATEST_PATCH"
  TMP_FILTERED="$LATEST_PATCH.filtered"

  # Section-aware filter: drop entire diff sections that reference excluded paths anywhere in the section
  awk '
    BEGIN { havePrelude=1; prelude=""; section=""; seen=0 }
    /^diff --git / {
      if (seen==0) { # first diff: print prelude before deciding about sections
        if (prelude != "") printf "%s", prelude
        havePrelude=0
        seen=1
      }
      if (section != "") {
        if (section !~ /(android\/build\/|android\/.cxx\/|(^|\/)node_modules\/)/) {
          printf "%s", section
        }
      }
      section = $0 "\n"
      next
    }
    {
      if (seen==0) {
        prelude = prelude $0 "\n"
      } else {
        section = section $0 "\n"
      }
      next
    }
    END {
      if (seen==0) {
        # No diff sections at all; just output prelude
        if (prelude != "") printf "%s", prelude
      } else {
        if (section != "" && section !~ /(android\/build\/|android\/.cxx\/|(^|\/)node_modules\/)/) {
          printf "%s", section
        }
      }
    }
  ' "$LATEST_PATCH" > "$TMP_FILTERED"

  # Overwrite original with filtered result
  mv "$TMP_FILTERED" "$LATEST_PATCH"
else
  echo "⚠️  Could not locate generated patch to filter. Skipping filtering."
fi

echo "✅ Patch created under .yarn/patches (filtered)"
