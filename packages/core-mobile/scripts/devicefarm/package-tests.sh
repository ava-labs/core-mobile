#!/usr/bin/env bash
set -euo pipefail

# Script to package Appium tests for AWS Device Farm upload.
# Creates appium-tests-devicefarm.zip via zip(1) (not npm-bundle): sources, package.json, package-lock.json;
# Device Farm runs npm ci from the extracted tree.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Script is in packages/core-mobile/scripts/devicefarm/
# So we need to go up 2 levels to get to packages/core-mobile
CORE_MOBILE_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
E2E_DIR="$CORE_MOBILE_DIR/e2e-appium"
OUTPUT_DIR="$E2E_DIR"
ZIP_NAME="appium-tests-devicefarm.zip"

echo "📦 Packaging Appium tests for AWS Device Farm..."

# Change to e2e-appium directory
cd "$E2E_DIR"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -f "$E2E_DIR"/*.tgz
rm -f "$OUTPUT_DIR/$ZIP_NAME"
rm -rf "$E2E_DIR/node_modules"

# Copy devicefarm config to wdio.conf.ts for zipping only; restore tracked file on exit (avoid dirty tree).
WDIO_CONF_BACKUP=""
WDIO_CONF_EXISTED=false
if [[ -f wdio.conf.ts ]]; then
  WDIO_CONF_EXISTED=true
  WDIO_CONF_BACKUP=$(mktemp)
  cp wdio.conf.ts "$WDIO_CONF_BACKUP"
fi
restore_wdio_conf() {
  if [[ "$WDIO_CONF_EXISTED" == true ]] && [[ -n "${WDIO_CONF_BACKUP}" ]] && [[ -f "${WDIO_CONF_BACKUP}" ]]; then
    cp "$WDIO_CONF_BACKUP" wdio.conf.ts
    rm -f "${WDIO_CONF_BACKUP}"
  elif [[ "$WDIO_CONF_EXISTED" == false ]]; then
    rm -f wdio.conf.ts
  fi
}
trap restore_wdio_conf EXIT INT TERM

echo "📋 Setting up configuration for Device Farm..."
cp wdio.devicefarm.conf.ts wdio.conf.ts

# Create zip file directly with all test files
echo "🗜️  Creating zip file for AWS Device Farm..."
if [[ ! -f package-lock.json ]]; then
  echo "❌ e2e-appium/package-lock.json is missing (required for deterministic npm ci on Device Farm)." >&2
  echo "   From e2e-appium: npm install" >&2
  exit 1
fi

zip -r "$OUTPUT_DIR/$ZIP_NAME" . \
  -x "*.tgz" \
  -x "*.zip" \
  -x "node_modules/*" \
  -x ".git/*" \
  -x "*.DS_Store" \
  -x "*.log" \
  -x ".npm/*" \
  -x ".yarn/*" \
  -x "yarn.lock"

echo "✅ Package created: $OUTPUT_DIR/$ZIP_NAME"
echo "📊 Package size: $(du -h "$OUTPUT_DIR/$ZIP_NAME" | cut -f1)"

# Verify package.json is included
echo "📋 Verifying package contents..."
ZIP_LIST=$(unzip -l "$OUTPUT_DIR/$ZIP_NAME" 2>&1)
if echo "$ZIP_LIST" | grep -q "package.json"; then
  echo "✅ Verified package.json is included"
else
  echo "⚠️  Warning: package.json not found in zip file"
  echo "$ZIP_LIST" | grep -E "(package|json)" | head -5
  exit 1
fi
if echo "$ZIP_LIST" | grep -q "package-lock.json"; then
  echo "✅ Verified package-lock.json is included (npm ci on Device Farm)"
else
  echo "❌ package-lock.json missing from zip" >&2
  exit 1
fi
echo "🎉 Packaging complete!"
