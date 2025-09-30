#!/usr/bin/env bash
set -ex

echo "Built app at: $BITRISE_APK_PATH"
ls -la "$BITRISE_APK_PATH" || true

which node
node -v
yarn -v
npx appium -v || true
npx appium driver list || true

npx appium --base-path /wd/hub --port 4723 & yarn appium:android
