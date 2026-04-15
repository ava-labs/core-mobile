#!/usr/bin/env bash
set -ex

# package.json defines yarn script "appium" → wdio; never use `yarn appium` for the Appium CLI (driver install, -v, etc.).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CORE_MOBILE_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$CORE_MOBILE_DIR"
APPIUM_BIN="$CORE_MOBILE_DIR/node_modules/.bin/appium"

echo "Built app at: $BITRISE_APP_DIR_PATH"
ls -la "$BITRISE_APP_DIR_PATH" || true

# wdio reads APP_PATH / AWS_DEVICE_FARM_APP_PATH for appium:app (Bitrise exposes the .app via BITRISE_APP_DIR_PATH)
export APP_PATH="${APP_PATH:-$BITRISE_APP_DIR_PATH}"
export AWS_DEVICE_FARM_APP_PATH="$APP_PATH"

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

# Install xcuitest; Appium exits non-zero if already present — treat that as success.
echo "Ensuring Appium xcuitest driver..."
set +e
xcuitest_install_out=$("$APPIUM_BIN" driver install xcuitest 2>&1)
xcuitest_install_code=$?
set -e
if [ "$xcuitest_install_code" -ne 0 ]; then
  if echo "$xcuitest_install_out" | grep -qi 'already installed'; then
    echo "xcuitest driver already installed"
  else
    echo "$xcuitest_install_out" >&2
    exit "$xcuitest_install_code"
  fi
fi

# Verify installation
"$APPIUM_BIN" -v || true
"$APPIUM_BIN" driver list || true

if [[ "$IS_SMOKE" == "true" ]]; then
  echo "Running iOS SMOKE tests"
  yarn appium:smokeIos
else
  echo "Running iOS FULL tests"
  yarn appium:ios
fi
