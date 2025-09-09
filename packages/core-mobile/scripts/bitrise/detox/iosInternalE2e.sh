#!/usr/bin/env bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

sleep 10

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
