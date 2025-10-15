#!/usr/bin/env bash
set -ex

echo "Built app at: $BITRISE_APK_PATH"
ls -la "$BITRISE_APK_PATH" || true

adb shell pm grant com.avaxwallet.internal android.permission.POST_NOTIFICATIONS

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
