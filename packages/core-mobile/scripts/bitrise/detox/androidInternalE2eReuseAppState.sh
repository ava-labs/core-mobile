#!/usr/bin/env bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

yarn start &

npm rebuild detox

adb install -r $BITRISE_TEST_APK_PATH
adb install -r $BITRISE_APK_PATH

echo "IS_REGRESSION_RUN should be true: $IS_REGRESSION_RUN"

if (($IS_REGRESSION_RUN=='true')); then
  ./node_modules/.bin/detox test --listTests --configuration android.internal.release.regression.ci
  QT_QPA_PLATFORM=xcb; ./node_modules/.bin/detox test --configuration android.internal.release.regression.ci --headless; test_result=$?
else
  ./node_modules/.bin/detox test --listTests --configuration android.internal.release.smoke.reuse_state.ci 
  QT_QPA_PLATFORM=xcb; ./node_modules/.bin/detox test --configuration android.internal.release.smoke.reuse_state.ci --headless; test_result=$?
fi

npx ts-node ./e2e/attachLogsSendResultsToTestrail.ts

if ((test_result != 0)); then
  exit 1
fi