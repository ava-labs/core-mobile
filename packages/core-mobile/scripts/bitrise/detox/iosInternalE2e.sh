#!/usr/bin/env bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

npm rebuild detox

echo "Check bundle: Testing app bundle path: $BITRISE_APP_DIR_PATH"

ls -la "$BITRISE_APP_DIR_PATH"
plutil -p "$BITRISE_APP_DIR_PATH/Info.plist" | grep CFBundleIdentifier

BUNDLE_ID=$(plutil -extract CFBundleIdentifier raw "$BITRISE_APP_DIR_PATH/Info.plist")
echo "Check bundle: Found CFBundleIdentifier: $BUNDLE_ID"

EXPECTED_BUNDLE_ID="org.avalabs.avaxwallet.internal"

if [ "$BUNDLE_ID" != "$EXPECTED_BUNDLE_ID" ]; then
  echo "Bundle ID mismatch!"
  echo "Expected: $EXPECTED_BUNDLE_ID"
  echo "Actual:   $BUNDLE_ID"
  exit 1
fi

echo "Bundle ID matches expected: $EXPECTED_BUNDLE_ID"

APP_BIN="$BITRISE_APP_DIR_PATH/$(defaults read "$BITRISE_APP_DIR_PATH/Info.plist" CFBundleExecutable)"
lipo -info "$APP_BIN"
echo "Check simulator app"

./node_modules/.bin/detox test --configuration ios.internal.release.smoke.ci --retries 1 --max-workers 1; test_result=$?

npx ts-node ./e2e/attachLogsSendResultsToTestrail.ts && sleep 5

if ((test_result != 0)); then
  exit 1
fi
