#!/usr/bin/env bash
set -o pipefail

if [[ "$(uname -m)" == "arm64" ]]; then
  if ! /usr/bin/pgrep oahd >/dev/null 2>&1; then
    echo "[E2E] Installing Rosetta..."
    sudo softwareupdate --install-rosetta --agree-to-license || true
  fi
fi

if [ -d /opt/homebrew/bin ]; then export PATH="/opt/homebrew/bin:$PATH"; fi
if [ -d /usr/local/bin ];  then export PATH="/usr/local/bin:$PATH";  fi
brew tap wix/brew || true
brew uninstall --ignore-dependencies applesimutils || true
brew install applesimutils --HEAD
applesimutils --version

xcrun simctl boot "iPhone 15 Pro" || true
xcrun simctl bootstatus "iPhone 15 Pro" -b || true
open -a Simulator || true
sleep 3
xcrun simctl bootstatus booted -b || true

xcrun simctl launch booted com.apple.Preferences >/dev/null 2>&1 || true
sleep 2
xcrun simctl terminate booted com.apple.Preferences >/dev/null 2>&1 || true

UDID=$(xcrun simctl list devices | awk -F '[()]' '/iPhone 15 Pro/ && /Booted/ {print $2; exit}')
if [[ -n "$UDID" ]]; then
  applesimutils --byId "$UDID" --bundle org.avalabs.avaxwallet.internal \
    --setPermissions "notifications=YES,photos=YES,calendar=YES,medialibrary=YES,contacts=YES,location=always" || true
fi

export RCT_NO_LAUNCH_PACKAGER=1
export CI=true

npm rebuild detox

if ! xcrun simctl get_app_container booted org.avalabs.avaxwallet.internal >/dev/null 2>&1; then
  echo "[E2E] App not installed. Installing..."
  if [[ -z "${BITRISE_APP_DIR_PATH:-}" || ! -d "$BITRISE_APP_DIR_PATH" ]]; then
    echo "BITRISE_APP_DIR_PATH not found: ${BITRISE_APP_DIR_PATH:-<empty>}"
    exit 1
  fi
  echo "Installing app from: $BITRISE_APP_DIR_PATH"
  xcrun simctl install booted "$BITRISE_APP_DIR_PATH"
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
