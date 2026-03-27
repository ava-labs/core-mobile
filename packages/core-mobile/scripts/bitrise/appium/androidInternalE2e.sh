#!/usr/bin/env bash
set -ex

# package.json defines yarn script "appium" → wdio; use node_modules/.bin/appium for the real CLI.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CORE_MOBILE_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$CORE_MOBILE_DIR"
APPIUM_BIN="$CORE_MOBILE_DIR/node_modules/.bin/appium"

echo "Built app at: $BITRISE_APK_PATH"
ls -la "$BITRISE_APK_PATH" || true

export APP_PATH="${APP_PATH:-$BITRISE_APK_PATH}"
export AWS_DEVICE_FARM_APP_PATH="$APP_PATH"

echo "Setting animation scale to 0..."
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0

# Ensure uiautomator2 driver exists (install errors if already registered via npm deps)
echo "Ensuring Appium uiautomator2 driver..."
if "$APPIUM_BIN" driver list --installed 2>/dev/null | grep -qE 'uiautomator2@'; then
  echo "uiautomator2 driver already installed"
else
  "$APPIUM_BIN" driver install uiautomator2
fi

# Verify installation
"$APPIUM_BIN" driver list || true

if [[ "$IS_SMOKE" == "true" ]]; then
  echo "Running ANDROID SMOKE tests"
  yarn appium:smokeAndroid
else
  echo "Running ANDROID FULL tests"
  yarn appium:android
fi
