#!/usr/bin/env bash
set -ex

echo "Built app at: $BITRISE_APK_PATH"
ls -la "$BITRISE_APK_PATH" || true

echo "Installing APK..."
adb install -r -d "$BITRISE_APK_PATH"
adb shell monkey -p com.avaxwallet.internal -c android.intent.category.LAUNCHER 1

sleep 5

adb shell uiautomator dump /sdcard/view.xml
adb shell cat /sdcard/view.xml | head -50

adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0

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
