#!/usr/bin/env bash
set -o pipefail

./node_modules/.bin/detox clean-framework-cache && ./node_modules/.bin/detox build-framework-cache

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