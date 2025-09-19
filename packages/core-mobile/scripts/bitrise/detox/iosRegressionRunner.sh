#!/usr/bin/env bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

yarn start &

npm rebuild detox

./node_modules/.bin/detox reset-lock-file

if [ "$IS_INTERNAL_BUILD" = true ]; then
  QT_QPA_PLATFORM=xcb; ./node_modules/.bin/detox test -c ios.internal.release.regression.ci --headless --max-workers 2; test_result=$?
else
  QT_QPA_PLATFORM=xcb; ./node_modules/.bin/detox test -c ios.external.release.ci --headless --max-workers 2; test_result=$?
fi

npx ts-node ./e2e/attachLogsSendResultsToTestrail.ts && sleep 5

./scripts/datadog/updateIosDashboard.sh && sleep 5

if ((test_result != 0)); then
  exit 1
fi