#!/bin/bash
# Script to run Appium tests locally on a connected Android device
# Usage: ./scripts/run-local-appium-test.sh [path-to-apk] [test-spec]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Script is in packages/core-mobile/scripts/, so go up one level to get core-mobile directory
CORE_MOBILE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Default values
APP_PATH="${1:-}"
TEST_SPEC="${2:-specs/debug/recoveryPhraseLocator.spec.ts}"

# Check if device is connected and authorized
echo "🔍 Checking for connected Android devices..."
DEVICES=$(adb devices | grep -v "List" | grep "device$" | wc -l | tr -d ' ')

if [ "$DEVICES" -eq 0 ]; then
  echo "❌ No authorized Android devices found!"
  echo ""
  echo "Please:"
  echo "1. Connect your Pixel 5 via USB"
  echo "2. Enable USB debugging on your device"
  echo "3. Authorize the computer when prompted"
  echo "4. Run 'adb devices' to verify it shows 'device' (not 'unauthorized')"
  exit 1
fi

echo "✅ Found $DEVICES authorized device(s)"

# Get device info
DEVICE_UDID=$(adb devices | grep -v "List" | grep "device$" | head -1 | awk '{print $1}')
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
    
    # Remove quotes if present (but preserve the value)
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    # Export using declare for safer handling of special characters
    declare -x "${key}"="${value}"
  done < "$CORE_MOBILE_DIR/.env.development.e2e"
fi

# Export environment variables
export PLATFORM=android
export APP_PATH="$APP_PATH"
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
  echo "Starting Appium with compatible Node version..."
  
  # Try to source nvm and use a compatible Node version
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
    # Try Node 20 first (most stable)
    if nvm use 20 > /dev/null 2>&1 || nvm use 22 > /dev/null 2>&1 || nvm use 24 > /dev/null 2>&1; then
      echo "✅ Using Node $(node --version)"
      # Start Appium in the background
      appium > /tmp/appium.log 2>&1 &
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
      echo "  appium"
      echo ""
      read -p "Press Enter once Appium is running, or Ctrl+C to cancel..."
    fi
  else
    echo "Please start Appium manually in another terminal:"
    echo "  appium"
    echo ""
    echo "Or if you have Node version issues, use a compatible Node version:"
    echo "  source ~/.nvm/nvm.sh"
    echo "  nvm use 20  # or 22, or 24"
    echo "  appium"
    echo ""
    read -p "Press Enter once Appium is running, or Ctrl+C to cancel..."
  fi
fi

# Run the test using the appium:android script from package.json
# The script expects specs relative to e2e-appium directory
# Set APPIUM_MANUAL=true to skip the Appium service (assumes Appium is already running)
export APPIUM_MANUAL=true
yarn appium:android --spec="e2e-appium/$TEST_SPEC"
