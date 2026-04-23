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

# Install uiautomator2; non-zero if already present — treat as success (same as iOS xcuitest).
echo "Ensuring Appium uiautomator2 driver..."
set +e
u2_install_out=$("$APPIUM_BIN" driver install uiautomator2 2>&1)
u2_install_code=$?
set -e
if [ "$u2_install_code" -ne 0 ]; then
  if echo "$u2_install_out" | grep -qi 'already installed'; then
    echo "uiautomator2 driver already installed"
  else
    echo "$u2_install_out" >&2
    exit "$u2_install_code"
  fi
fi

# Verify installation
"$APPIUM_BIN" driver list || true

echo "=== Installing APK ==="
adb install -r "$APP_PATH"

echo "=== Checking app installation ==="
adb shell pm list packages | grep com.avaxwallet.internal || echo "WARNING: com.avaxwallet.internal not found — app may not be installed yet"

echo "=== Launching app manually to verify startup ==="
adb shell am force-stop com.avaxwallet.internal || true
adb logcat -c || true
adb shell am start -W com.avaxwallet.internal/com.avaxwallet.MainActivity || echo "WARNING: Failed to launch app"

sleep 3
echo "=== Current top activity ==="
adb shell dumpsys activity activities | grep -E "mResumedActivity|topResumedActivity" || true

echo "=== Crash / ANR / Splash logs ==="
adb logcat -d | grep -E "AndroidRuntime|ANR|FATAL EXCEPTION|com.avaxwallet.internal|Splash|ReactNativeJS|AppRegistry" | tail -30 || true

if [[ "$IS_SMOKE" == "true" ]]; then
  echo "Running ANDROID SMOKE tests"
  yarn appium:smokeAndroid
else
  echo "Running ANDROID FULL tests"
  yarn appium:android
fi
