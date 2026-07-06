#!/bin/bash
# Script to run Appium tests locally on a connected Android device
# Usage: ./scripts/run-local-appium-test.sh [path-to-apk] [test-spec]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Script is in packages/core-mobile/scripts/, so go up one level to get core-mobile directory
CORE_MOBILE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MONOREPO_ROOT="$(cd "$CORE_MOBILE_DIR/../.." && pwd)"

# Appium CLI from the workspace (package.json devDependency), not global PATH — same idea as bitrise InternalE2e scripts.
APPIUM_BIN=""
if [ -x "$CORE_MOBILE_DIR/node_modules/.bin/appium" ]; then
  APPIUM_BIN="$CORE_MOBILE_DIR/node_modules/.bin/appium"
elif [ -x "$MONOREPO_ROOT/node_modules/.bin/appium" ]; then
  APPIUM_BIN="$MONOREPO_ROOT/node_modules/.bin/appium"
fi

# Default values: positional APK overrides APP_PATH env
APP_PATH="${1:-${APP_PATH:-}}"
TEST_SPEC="${2:-specs/debug/recoveryPhraseLocator.spec.ts}"

# Check if device is connected and authorized
echo "🔍 Checking for connected Android devices..."
DEVICES=$(adb devices | grep -v "List" | grep "device$" | wc -l | tr -d ' ')

if [ "$DEVICES" -eq 0 ]; then
  echo "❌ No authorized Android devices found!"
  echo ""
  echo "Please:"
  echo "1. Connect an Android device or start an emulator via USB"
  echo "2. Enable USB debugging on physical devices"
  echo "3. Authorize the computer when prompted (physical devices)"
  echo "4. Run 'adb devices' to verify it shows 'device' (not 'unauthorized')"
  echo "   If multiple devices are listed, set ANDROID_SERIAL to pick one."
  exit 1
fi

echo "✅ Found $DEVICES authorized device(s)"

# Match resolve-local-device.ts: prefer ANDROID_SERIAL when set; otherwise first authorized device
if [ -n "${ANDROID_SERIAL:-}" ]; then
  DEVICE_STATE=$(adb devices | awk -v s="$ANDROID_SERIAL" '$1 == s { print $2 }')
  if [ "$DEVICE_STATE" = "device" ]; then
    DEVICE_UDID="$ANDROID_SERIAL"
    echo "📌 Using ANDROID_SERIAL=$DEVICE_UDID"
  else
    echo "❌ ANDROID_SERIAL=$ANDROID_SERIAL is not listed as an authorized device."
    echo "   Run adb devices — the second column must be \"device\" (not unauthorized or offline)."
    exit 1
  fi
else
  DEVICE_UDID=$(adb devices | grep -v "List" | grep "device$" | head -1 | awk '{print $1}')
  export ANDROID_SERIAL="$DEVICE_UDID"
  echo "📌 ANDROID_SERIAL was unset; using first device and exporting ANDROID_SERIAL=$DEVICE_UDID"
  echo "   (Set ANDROID_SERIAL yourself when multiple devices are connected.)"
fi

# Get device info
DEVICE_MODEL=$(adb -s "$DEVICE_UDID" shell getprop ro.product.model | tr -d '\r\n')
ANDROID_VERSION=$(adb -s "$DEVICE_UDID" shell getprop ro.build.version.release | tr -d '\r\n')

echo "📱 Device: $DEVICE_MODEL"
echo "🤖 Android Version: $ANDROID_VERSION"
echo "🔢 UDID: $DEVICE_UDID"

# Check if APK path is provided
if [ -z "$APP_PATH" ]; then
  echo ""
  echo "⚠️  No APK path provided!"
  echo ""
  echo "Usage: $0 [path-to-apk] [test-spec]"
  echo ""
  echo "Example:"
  echo "  $0 ./app-internal-e2e-bitrise-signed.apk specs/debug/recoveryPhraseLocator.spec.ts"
  echo ""
  echo "Or set APP_PATH environment variable:"
  echo "  export APP_PATH=/path/to/app.apk"
  echo "  $0"
  exit 1
fi

if [ ! -f "$APP_PATH" ]; then
  echo "❌ APK file not found: $APP_PATH"
  exit 1
fi

echo "📦 APK: $APP_PATH"

# Change to core-mobile directory (where package.json has the appium scripts)
cd "$CORE_MOBILE_DIR"

# Load .env.development.e2e if it exists
# Use a safer method that properly handles values with spaces
if [ -f "$CORE_MOBILE_DIR/.env.development.e2e" ]; then
  echo "📝 Loading environment variables from .env.development.e2e"
  # Read the file and export each variable, properly handling values with spaces
  while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty lines and comments
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    # Remove leading/trailing whitespace
    line=$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    # Skip if line doesn't contain =
    [[ ! "$line" =~ = ]] && continue
    
    # Split on first = only
    key="${line%%=*}"
    value="${line#*=}"
    key=$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    # export KEY=value
    if [[ "$key" =~ ^export[[:space:]]+(.+)$ ]]; then
      key="${BASH_REMATCH[1]}"
      key=$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    fi
    [[ -z "$key" ]] && continue
    if [[ ! "$key" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]]; then
      echo "⚠️  Skipping invalid env variable name in .env.development.e2e: $key" >&2
      continue
    fi

    value=$(echo "$value" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    # Remove quotes if present (but preserve the value)
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")

    # Export using declare for safer handling of special characters
    declare -x "${key}"="${value}"
  done < "$CORE_MOBILE_DIR/.env.development.e2e"
fi

# Export environment variables
export PLATFORM=android
export APP_PATH="$APP_PATH"
# WDIO devicefarm template reads AWS_DEVICE_FARM_APP_PATH; keep in sync for local runs.
export AWS_DEVICE_FARM_APP_PATH="$APP_PATH"
export DEVICE_UDID="$DEVICE_UDID"
export DEVICE_NAME="$DEVICE_MODEL"
export PLATFORM_VERSION="$ANDROID_VERSION"

# Verify E2E_MNEMONIC is set
if [ -z "$E2E_MNEMONIC" ]; then
  echo "⚠️  Warning: E2E_MNEMONIC is not set. Tests requiring recovery phrase will fail."
  echo "   Set it in .env.development.e2e or export it before running the test."
else
  echo "✅ E2E_MNEMONIC is set (${#E2E_MNEMONIC} characters)"
fi

echo ""
echo "🚀 Starting Appium test..."
echo "   Test spec: $TEST_SPEC"
echo ""

# Check if Appium is already running
if ! curl -s http://localhost:4723/status > /dev/null 2>&1; then
  echo "⚠️  Appium is not running on port 4723"
  echo ""
  if [ -z "$APPIUM_BIN" ]; then
    echo "❌ Appium CLI not found. Install monorepo dependencies, then retry:"
    echo "   cd \"$MONOREPO_ROOT\" && yarn install"
    echo "   Expected: $CORE_MOBILE_DIR/node_modules/.bin/appium (or hoisted: $MONOREPO_ROOT/node_modules/.bin/appium)"
    exit 1
  fi
  echo "Starting Appium with compatible Node version..."
  echo "   Using: $APPIUM_BIN"
  
  # Try to source nvm and use a compatible Node version
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
    # Try Node 20 first (most stable)
    if nvm use 20 > /dev/null 2>&1 || nvm use 22 > /dev/null 2>&1 || nvm use 24 > /dev/null 2>&1; then
      echo "✅ Using Node $(node --version)"
      # Start Appium in the background
      "$APPIUM_BIN" > /tmp/appium.log 2>&1 &
      APPIUM_PID=$!
      echo "🚀 Started Appium (PID: $APPIUM_PID)"
      echo "   Logs: /tmp/appium.log"
      # Wait for Appium to start
      echo "   Waiting for Appium to start..."
      for i in {1..30}; do
        if curl -s http://localhost:4723/status > /dev/null 2>&1; then
          echo "✅ Appium is ready!"
          break
        fi
        sleep 1
      done
      # Cleanup function
      trap "kill $APPIUM_PID 2>/dev/null" EXIT
    else
      echo "❌ Could not switch to compatible Node version"
      echo ""
      echo "Please start Appium manually in another terminal:"
      echo "  source ~/.nvm/nvm.sh"
      echo "  nvm use 20  # or 22, or 24"
      echo "  \"$APPIUM_BIN\""
      echo ""
      read -p "Press Enter once Appium is running, or Ctrl+C to cancel..."
    fi
  else
    echo "Please start Appium manually in another terminal:"
    echo "  \"$APPIUM_BIN\""
    echo ""
    echo "Or if you have Node version issues, use a compatible Node version:"
    echo "  source ~/.nvm/nvm.sh"
    echo "  nvm use 20  # or 22, or 24"
    echo "  \"$APPIUM_BIN\""
    echo ""
    read -p "Press Enter once Appium is running, or Ctrl+C to cancel..."
  fi
fi

# Run the test using the appium:android script from package.json
# The script expects specs relative to e2e-appium directory
#
# e2e-appium/wdio.conf.ts registers @wdio/appium-service when NOT on Device Farm and
# APPIUM_MANUAL is unset/false (see useWdioAppiumService and `services`). This script often
# starts Appium above (or you start it yourself), so we set APPIUM_MANUAL=true to connect
# to that existing server and avoid spawning a second Appium process.
export APPIUM_MANUAL=true
yarn appium:android --spec="e2e-appium/$TEST_SPEC"
