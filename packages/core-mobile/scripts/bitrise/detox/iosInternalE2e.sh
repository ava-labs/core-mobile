#!/usr/bin/env bash
set -o pipefail

if [[ "$(uname -m)" == "arm64" ]]; then
  if ! /usr/bin/pgrep oahd >/dev/null 2>&1; then
    echo "[E2E] Installing Rosetta..."
    sudo softwareupdate --install-rosetta --agree-to-license || true
  fi
fi

xcrun simctl boot "iPhone 15 Pro" || true
xcrun simctl bootstatus "iPhone 15 Pro" -b || true
open -a Simulator || true

npm rebuild detox

if ! xcrun simctl get_app_container booted org.avalabs.avaxwallet.internal >/dev/null 2>&1; then
  echo "[E2E] App not installed. Installing..."
  if [[ -z "${BITRISE_APP_DIR_PATH:-}" || ! -d "$BITRISE_APP_DIR_PATH" ]]; then
    echo "BITRISE_APP_DIR_PATH not found: ${BITRISE_APP_DIR_PATH:-<empty>}"
    exit 1
  fi
  echo "Installing app from: $BITRISE_APP_DIR_PATH"
  xcrun simctl install booted "$BITRISE_APP_DIR_PATH"
  echo "App installed!"
fi

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
