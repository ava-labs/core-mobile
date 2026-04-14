#!/usr/bin/env bash
set -ex

echo "Built app at: $BITRISE_APK_PATH"
ls -la "$BITRISE_APK_PATH" || true

# Wait for emulator to be fully booted
echo "Waiting for emulator to be ready..."
adb wait-for-device
adb shell 'while [[ -z $(getprop sys.boot_completed) ]]; do sleep 1; done'
echo "Emulator boot completed"

# Diagnostics
adb shell getprop ro.product.cpu.abi
adb shell getprop ro.build.version.sdk
adb shell cat /proc/meminfo | head -3

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
# Note: "yarn appium" maps to wdio, so use npx for driver management
echo "Installing Appium uiautomator2 driver..."
npx appium driver install uiautomator2 || npx appium driver update uiautomator2 || true

# Verify installation
npx appium driver list --installed || true

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
