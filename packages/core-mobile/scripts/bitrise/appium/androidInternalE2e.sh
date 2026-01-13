#!/usr/bin/env bash
set -ex

echo "Built app at: $BITRISE_APK_PATH"
ls -la "$BITRISE_APK_PATH" || true

echo "Setting animation scale to 0..."
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0
adb shell pm grant com.avaxwallet.internal android.permission.POST_NOTIFICATIONS


which node
node -v
yarn -v
npx appium -v || true
npx appium driver list || true


if [[ "$IS_SMOKE" == "true" ]]; then
  echo "Running ANDROID SMOKE tests"
  yarn appium:smokeAndroid
else
  echo "Running ANDROID FULL tests"
  yarn appium:android
fi
