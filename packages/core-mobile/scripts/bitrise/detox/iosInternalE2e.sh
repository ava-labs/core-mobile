#!/usr/bin/env bash
set -euo pipefail

if xcrun simctl list devices | grep -q "(Booted)"; then
  xcrun simctl bootstatus booted -b || true
  echo "Booted device found"
else
  echo "No booted device found"
  UDID="$(xcrun simctl list devices --json | python3 - <<'PY' || true
import json, sys
data=json.load(sys.stdin)
for rt, devs in data.get("devices", {}).items():
    for d in devs:
        if d.get("isAvailable"):
            print(d["udid"]); sys.exit(0)
sys.exit(1)
PY
  )"
  xcrun simctl boot "$UDID" || true
  xcrun simctl bootstatus "$UDID" -b || true
fi

xcrun simctl launch booted com.apple.Preferences >/dev/null 2>&1 || true
sleep 2
xcrun simctl terminate booted com.apple.Preferences >/dev/null 2>&1 || true

export RCT_NO_LAUNCH_PACKAGER=1
export CI=true

npm rebuild detox

xcrun simctl spawn booted log stream --level debug --style compact \
  --predicate 'subsystem == "com.apple.FrontBoard" \
    OR process == "SpringBoard" \
    OR process == "assertiond" \
    OR eventMessage CONTAINS "org.avalabs.avaxwallet.internal" \
    OR eventMessage CONTAINS "avalabs"' > simulator_console.log 2>&1 &
LOG_PID=$?

trap 'kill '"$LOG_PID"' >/dev/null 2>&1 || true' EXIT

./node_modules/.bin/detox test \
  --configuration ios.internal.release.smoke.ci \
  --record-logs all \
  --retries 1 \
  --headless \
  --max-workers 1; test_result=$? || true


kill $LOG_PID >/dev/null 2>&1 || true
trap - EXIT


if (( test_result != 0 )); then
  echo "---- tail simulator_console.log ----"
  tail -n 200 simulator_console.log || true
fi

npx ts-node ./e2e/attachLogsSendResultsToTestrail.ts && sleep 5

if (( test_result != 0 )); then
  exit 1
fi
