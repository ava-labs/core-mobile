#!/usr/bin/env bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

yarn start &

npm rebuild detox


adb install -r $BITRISE_TEST_APK_PATH
adb install -r $BITRISE_APK_PATH

echo "IS_REGRESSION_RUN should be true: $IS_REGRESSION_RUN"
echo "Got test list: $TESTS_TO_RUN"

if [ "$IS_REGRESSION_RUN" = true ]; then
  echo "running regression run..."
  QT_QPA_PLATFORM=xcb; ./node_modules/.bin/detox test --configuration android.internal.release.regression.ci; test_result=$?
else
  echo "The test list above will be reduced by the android smoke config ignoreTestList"
  echo "running smoke run..."
  QT_QPA_PLATFORM=xcb; ./node_modules/.bin/detox test --configuration android.internal.release.smoke.ci; test_result=$?
fi

npx ts-node ./e2e/attachLogsSendResultsToTestrail.ts

if ((test_result != 0)); then
  exit 1
fi
