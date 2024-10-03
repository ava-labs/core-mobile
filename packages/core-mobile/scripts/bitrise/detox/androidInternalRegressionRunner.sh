#!/usr/bin/env bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

yarn start &

npm rebuild detox

if [ "$IS_INTERNAL_BUILD" = true ]; then
  QT_QPA_PLATFORM=xcb; ./node_modules/.bin/detox test -c android.internal.release.regression.ci --headless --retries 1 --reuse; test_result=$?
else
  QT_QPA_PLATFORM=xcb; ./node_modules/.bin/detox test -c android.external.release.regression.ci --headless --retries 1 --reuse; test_result=$?
fi

npx ts-node ./e2e/attachLogsSendResultsToTestrail.ts

if ((test_result != 0)); then
  exit 1
fi
