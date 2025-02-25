#!/usr/bin/env bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

yarn start &

npm rebuild detox

./node_modules/.bin/detox reset-lock-file

xcrun simctl create iPhone-15-Pro com.apple.CoreSimulator.SimRuntime.iOS-16-4 com.apple.CoreSimulator.SimDeviceType.iPhone-15-Pro 
xcrun simctl boot iPhone-15-Pro
xcrun simctl bootstatus iPhone-15-Pro -w booted

if [ "$IS_INTERNAL_BUILD" = true ]; then
  QT_QPA_PLATFORM=xcb; ./node_modules/.bin/detox test -c ios.internal.release.regression.ci --headless --max-workers 3; test_result=$?
else
  QT_QPA_PLATFORM=xcb; ./node_modules/.bin/detox test -c ios.external.release.ci --headless --max-workers 3; test_result=$?
fi

./scripts/datadog/updateIosDashboard.sh && sleep 5

npx ts-node ./e2e/attachLogsSendResultsToTestrail.ts && sleep 5


if ((test_result != 0)); then
  exit 1
fi