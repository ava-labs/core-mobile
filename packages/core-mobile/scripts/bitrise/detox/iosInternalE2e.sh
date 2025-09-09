#!/usr/bin/env bash
set -o pipefail

xcrun simctl boot "iPhone 15 Pro" || true
xcrun simctl bootstatus "iPhone 15 Pro" -b || true
open -a Simulator || true
sleep 3


xcrun simctl bootstatus booted -b || true

xcrun simctl launch booted com.apple.Preferences >/dev/null 2>&1 || true
sleep 2
xcrun simctl terminate booted com.apple.Preferences >/dev/null 2>&1 || true

export RCT_NO_LAUNCH_PACKAGER=1
export CI=true

npm rebuild detox


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
