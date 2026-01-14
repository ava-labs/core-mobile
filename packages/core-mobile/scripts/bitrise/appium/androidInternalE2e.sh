#!/usr/bin/env bash
set -ex

echo "Built app at: $BITRISE_APK_PATH"
ls -la "$BITRISE_APK_PATH" || true

echo "Installing APK..."
adb install -r -d "$BITRISE_APK_PATH"

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
