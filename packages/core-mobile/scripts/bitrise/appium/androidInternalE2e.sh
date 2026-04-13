#!/usr/bin/env bash
set -ex

echo "Built app at: $BITRISE_APK_PATH"
ls -la "$BITRISE_APK_PATH" || true

echo "Setting animation scale to 0..."
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0

# Capture logcat in background for debugging
adb logcat -c
adb logcat > /tmp/android_logcat.txt 2>&1 &
LOGCAT_PID=$!
echo "Logcat capture started (PID: $LOGCAT_PID)"

# Install uiautomator2 driver for Appium 2.x+
echo "Installing Appium uiautomator2 driver..."
yarn appium driver install uiautomator2 || npx appium driver install uiautomator2 || true

# Verify installation
yarn appium driver list || true

if [[ "$IS_SMOKE" == "true" ]]; then
  echo "Running ANDROID SMOKE tests"
  yarn appium:smokeAndroid || true
else
  echo "Running ANDROID FULL tests"
  yarn appium:android || true
fi

# Stop logcat and print last 200 lines for debugging
kill $LOGCAT_PID || true
echo "=== LOGCAT (last 200 lines) ==="
tail -200 /tmp/android_logcat.txt || true
