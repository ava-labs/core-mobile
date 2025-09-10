#!/usr/bin/env bash
set -o pipefail


if [[ "$(uname -m)" == "arm64" ]]; then
  if ! /usr/bin/pgrep oahd >/dev/null 2>&1; then
    echo "[SETUP] Installing Rosetta..."
    sudo softwareupdate --install-rosetta --agree-to-license || true
  fi
fi


brew uninstall applesimutils || true
brew install applesimutils --HEAD


xcrun simctl boot "iPhone 15 Pro" || true
xcrun simctl bootstatus "iPhone 15 Pro" -b || true
open -a Simulator || true
sleep 3
xcrun simctl bootstatus booted -b || true


npx detox clean-framework-cache && npx detox build-framework-cache
npm rebuild detox


./node_modules/.bin/detox test \
  --configuration ios.internal.release.smoke.ci \
  --record-logs all \
  --cleanup \
  --retries 1 \
  --headless \
  --max-workers 1; test_result=$?


npx ts-node ./e2e/attachLogsSendResultsToTestrail.ts && sleep 5


if ((test_result != 0)); then
  exit 1
fi
