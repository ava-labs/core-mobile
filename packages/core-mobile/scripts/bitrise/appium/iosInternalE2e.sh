#!/usr/bin/env bash
set -ex

echo "Built app at: $BITRISE_APP_DIR_PATH"
ls -la "$BITRISE_APP_DIR_PATH" || true

which node
node -v
yarn -v

npm install -g appium@next
npm install -g @wdio/cli
appium driver install xcuitest || echo "xcuitest already installed, skipping"

yarn appium:ios
