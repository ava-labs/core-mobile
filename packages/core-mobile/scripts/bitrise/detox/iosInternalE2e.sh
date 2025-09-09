#!/usr/bin/env bash
set -o pipefail

xcrun simctl boot "iPhone 15 Pro" || true
xcrun simctl bootstatus "iPhone 15 Pro" -b || true
open -a Simulator || true
sleep 3
xcrun simctl bootstatus booted -b || true

npm rebuild detox


APP_PATH="$BITRISE_APP_DIR_PATH"

echo "[DEBUG] App dir: $APP_PATH"


defaults read "$APP_PATH/Info.plist" CFBundleIdentifier || true
defaults read "$APP_PATH/Info.plist" MinimumOSVersion || true
defaults read "$APP_PATH/Info.plist" DTPlatformName || true


EXE_NAME=$(defaults read "$APP_PATH/Info.plist" CFBundleExecutable)
BIN="$APP_PATH/$EXE_NAME"
echo "[DEBUG] Binary path: $BIN"

file "$BIN" || true

echo "[DEBUG] vtool build info:"
xcrun vtool -show-build -arch arm64 "$BIN" || true

echo "[DEBUG] otool LC_BUILD_VERSION:"
xcrun otool -l "$BIN" | sed -n '/LC_BUILD_VERSION/,+6p' || true


./node_modules/.bin/detox test \
  --configuration ios.internal.release.smoke.ci \
  --record-logs all \
  --retries 1 \
  --headless \
  --max-workers 1; test_result=$?

npx ts-node ./e2e/attachLogsSendResultsToTestrail.ts && sleep 5

if ((test_result != 0)); then
  exit 1
fi
