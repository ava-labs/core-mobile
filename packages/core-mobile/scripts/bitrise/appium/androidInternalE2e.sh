#!/usr/bin/env bash
set -ex

echo "Built app at: $BITRISE_APK_PATH"
ls -la "$BITRISE_APK_PATH" || true

echo "Setting animation scale to 0..."
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0

echo "Checking emulator status..."
adb devices
adb shell getprop ro.build.version.sdk
adb shell getprop ro.product.model

# Clear logcat before starting
adb logcat -c || true

# Start logcat in background to capture logs during test
adb logcat -v time > "$BITRISE_DEPLOY_DIR/logcat.txt" 2>&1 &
LOGCAT_PID=$!
echo "Started logcat capture with PID: $LOGCAT_PID"

which node
node -v
yarn -v
npx appium -v || true
npx appium driver list || true

cleanup() {
  echo "Stopping logcat capture..."
  kill $LOGCAT_PID 2>/dev/null || true
  
  # Print last 500 lines of logcat for debugging
  echo "=== Last 500 lines of logcat ==="
  tail -500 "$BITRISE_DEPLOY_DIR/logcat.txt" || true
  
  # Filter for React Native and app-specific logs
  echo "=== React Native / App specific logs ==="
  grep -E "(ReactNative|AvaxWallet|EncryptedStore|BootSplash|Keychain|BiometricsSDK)" "$BITRISE_DEPLOY_DIR/logcat.txt" | tail -200 || true
}
trap cleanup EXIT

if [[ "$SMOKE_SUITE" == "true" ]]; then
  echo "Running ANDROID SMOKE tests"
  yarn appium:smokeAndroid
else
  echo "Running ANDROID FULL tests"
  yarn appium:android
fi
