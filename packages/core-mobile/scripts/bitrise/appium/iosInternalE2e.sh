#!/usr/bin/env bash
set -ex

echo "Built app at: $BITRISE_APP_DIR_PATH"
ls -la "$BITRISE_APP_DIR_PATH" || true

which node
node -v
yarn -v
npx appium -v || true
npx appium driver list || true

yarn appium:ios
