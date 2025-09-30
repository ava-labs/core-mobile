#!/usr/bin/env bash
set -ex

echo "Built app at: $BITRISE_APK_PATH"
ls -la "$BITRISE_APK_PATH" || true

which node
node -v
yarn -v

npm install -g appium@next
npm install -g @wdio/cli
appium driver install uiautomator2 || echo "uiautomator2 already installed, skipping"

yarn appium:android
