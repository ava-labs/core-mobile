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


APP_BUNDLE_PATH="${APP_BUNDLE_PATH:-$BITRISE_DEPLOY_DIR/AvaWalletInternal.app}"
if ! xcrun simctl get_app_container booted org.avalabs.avaxwallet.internal >/dev/null 2>&1; then
  echo "[E2E] App not installed. Installing..."
  if [[ ! -d "$APP_BUNDLE_PATH" ]]; then
    echo "APP_BUNDLE_PATH not found: $APP_BUNDLE_PATH"
    exit 1
  fi
  xcrun simctl install booted "$APP_BUNDLE_PATH"
  echo "App installed"
fi


xcrun simctl terminate booted org.avalabs.avaxwallet.internal >/dev/null 2>&1 || true


BID="org.avalabs.avaxwallet.internal"
ok=0
for i in 1 2 3; do
  if xcrun simctl launch booted "$BID" >/dev/null 2>&1; then
    ok=1; echo "[E2E] Prelaunch succeeded (try #$i)"; break
  fi
  echo "[E2E] Prelaunch failed (try #$i); backing off..."
  sleep $((i*2))
done
xcrun simctl terminate booted "$BID" >/dev/null 2>&1 || true


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
