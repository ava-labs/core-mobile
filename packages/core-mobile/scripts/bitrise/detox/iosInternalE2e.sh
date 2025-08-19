#!/usr/bin/env bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

npm rebuild detox

xcrun simctl boot 'iPhone 16 Pro' || true
xcrun simctl bootstatus booted -b

if [ -z "$CI" ] || [ "$CI" = "false" ]; then
  echo "CI is not set or is false, opening Simulator"
  open -a Simulator
fi


./node_modules/.bin/detox test --configuration ios.internal.release.smoke.ci --retries 1 --max-workers 2; test_result=$?

npx ts-node ./e2e/attachLogsSendResultsToTestrail.ts && sleep 5

if ((test_result != 0)); then
  exit 1
fi
