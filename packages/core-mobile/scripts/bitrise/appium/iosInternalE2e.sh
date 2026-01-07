#!/usr/bin/env bash
set -ex

echo "Built app at: $BITRISE_APP_DIR_PATH"
ls -la "$BITRISE_APP_DIR_PATH" || true

DEVICE_NAME="iPhone 16 Pro"

SIM_STATUS=$(xcrun simctl list devices | grep "$DEVICE_NAME" | grep -o "Booted" || true)

if [ "$SIM_STATUS" = "Booted" ]; then
  echo "$DEVICE_NAME already booted"
else
  echo "Booting $DEVICE_NAME..."
  xcrun simctl boot "$DEVICE_NAME"
  xcrun simctl bootstatus "$DEVICE_NAME" -b
fi

which node
node -v
yarn -v
npx appium -v || true
npx appium driver list || true

if [[ "$SMOKE_SUITE" == "true" ]]; then
  echo "Running iOS SMOKE tests"
  yarn appium:smokeIos
else
  echo "Running iOS FULL tests"
  yarn appium:ios
fi
