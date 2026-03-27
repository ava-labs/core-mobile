#!/usr/bin/env bash
set -ex

# package.json defines yarn script "appium" → wdio; never use `yarn appium` for the Appium CLI (driver install, -v, etc.).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CORE_MOBILE_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$CORE_MOBILE_DIR"
APPIUM_BIN="$CORE_MOBILE_DIR/node_modules/.bin/appium"

echo "Built app at: $BITRISE_APP_DIR_PATH"
ls -la "$BITRISE_APP_DIR_PATH" || true

# wdio reads APP_PATH / AWS_DEVICE_FARM_APP_PATH for appium:app (Bitrise exposes the .app via BITRISE_APP_DIR_PATH)
export APP_PATH="${APP_PATH:-$BITRISE_APP_DIR_PATH}"
export AWS_DEVICE_FARM_APP_PATH="$APP_PATH"

DEVICE_NAME="iPhone 17 Pro"

SIM_STATUS=$(xcrun simctl list devices | grep "$DEVICE_NAME" | grep -o "Booted" || true)

if [ "$SIM_STATUS" = "Booted" ]; then
  echo "$DEVICE_NAME already booted"
else
  echo "Booting $DEVICE_NAME..."
  xcrun simctl boot "$DEVICE_NAME"
  xcrun simctl bootstatus "$DEVICE_NAME" -b
fi

which node
node -v
yarn -v

# Ensure xcuitest driver exists (install is non-idempotent — fails if already present after yarn hoists appium-xcuitest-driver)
echo "Ensuring Appium xcuitest driver..."
if "$APPIUM_BIN" driver list --installed 2>/dev/null | grep -qE 'xcuitest@'; then
  echo "xcuitest driver already installed"
else
  "$APPIUM_BIN" driver install xcuitest
fi

# Verify installation
"$APPIUM_BIN" -v || true
"$APPIUM_BIN" driver list || true

if [[ "$IS_SMOKE" == "true" ]]; then
  echo "Running iOS SMOKE tests"
  yarn appium:smokeIos
else
  echo "Running iOS FULL tests"
  yarn appium:ios
fi
