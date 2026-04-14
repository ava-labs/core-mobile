#!/usr/bin/env bash
set -ex

echo "Built app at: $BITRISE_APP_DIR_PATH"
ls -la "$BITRISE_APP_DIR_PATH" || true

DEVICE_NAME="iPhone 17 Pro"

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

# Install xcuitest driver for Appium 2.x+
# Note: "yarn appium" maps to wdio, so use npx for driver management
echo "Installing Appium xcuitest driver..."
npx appium driver install xcuitest || npx appium driver update xcuitest || true

# Verify installation
npx appium -v || true
npx appium driver list --installed || true

if [[ "$IS_SMOKE" == "true" ]]; then
  echo "Running iOS SMOKE tests"
  yarn appium:smokeIos
else
  echo "Running iOS FULL tests"
  yarn appium:ios
fi
