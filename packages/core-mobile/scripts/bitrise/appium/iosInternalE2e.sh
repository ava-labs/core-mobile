#!/usr/bin/env bash
set -ex

echo "Built app at: $BITRISE_APP_DIR_PATH"
ls -la "$BITRISE_APP_DIR_PATH" || true

asdf plugin add nodejs || true
asdf install nodejs 20.19.0 || true
asdf global nodejs 20.19.0
asdf reshim
which node
node -v
yarn -v

npm install -g appium@next
npm install -g @wdio/cli
appium driver install xcuitest || echo "xcuitest already installed, skipping"

yarn appium:ios
