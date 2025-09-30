#!/usr/bin/env bash
set -ex

echo "Built app at: $BITRISE_APK_PATH"
ls -la "$BITRISE_APK_PATH" || true

which node
node -v
yarn -v
npx appium -v || true
npx appium driver list || true

yarn appium:android
