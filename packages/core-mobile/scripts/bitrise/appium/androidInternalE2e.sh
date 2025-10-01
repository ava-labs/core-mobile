#!/usr/bin/env bash
set -ex

echo "Built app at: $BITRISE_APK_PATH"
ls -la "$BITRISE_APK_PATH" || true

echo "Installing APK manually..."
adb -s emulator-5554 install -r "$BITRISE_APK_PATH" || {
  echo "Failed to install APK"
  adb logcat -d | tail -n 200
  exit 1
}

echo "APK installed successfully."

adb devices || true

echo "Getting animation scale..."
adb shell settings get global window_animation_scale
adb shell settings get global transition_animation_scale
adb shell settings get global animator_duration_scale

echo "Setting animation scale to 0..."
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0


which node
node -v
yarn -v
npx appium -v || true
npx appium driver list || true


yarn appium:android
