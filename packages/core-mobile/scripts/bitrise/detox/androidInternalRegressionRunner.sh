#!/usr/bin/env bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

yarn start &

npm rebuild detox

QT_QPA_PLATFORM=xcb; ./node_modules/.bin/detox test -c android.internal.release.regression.ci --headless --retries 1; test_result=$?

npx ts-node ./e2e/attachLogsSendResultsToTestrail.ts

if ((test_result != 0)); then
  exit 1
fi