#!/usr/bin/env bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

yarn start &

npm rebuild detox

adb install -r $BITRISE_APK_PATH
adb install -r $BITRISE_TEST_APK_PATH

echo "IS_REGRESSION_RUN should be true: $IS_REGRESSION_RUN"
echo "Got test list: $TESTS_TO_RUN"

if [ "$IS_REGRESSION_RUN" = true ]; then
  if ["$IS_INTERNAL_BUILD" = true ]; then
    if [ "$PARAMETERIZED_TESTS" = true ]; then
      echo "Running regression run on Pixel 6 for parameterized tests"
      QT_QPA_PLATFORM=xcb ./node_modules/.bin/detox test --configuration android.internal.release.regression.parameterized_tests.ci --headless
      test_result=$?
    else
      echo "Running regression run..."
      QT_QPA_PLATFORM=xcb ./node_modules/.bin/detox test --configuration android.internal.release.regression.ci --headless
      test_result=$?
  else 
    echo "Running regression on external build..."
    QT_QPA_PLATFORM=xcb ./node_modules/.bin/detox test --configuration android.external.release.regression.ci --headless
fi
else
  if [ "$PARAMETERIZED_TESTS" = true ]; then
    exit 0  # we don't run parameterized tests on smoke run
  else
    echo "The test list above will be reduced by the android smoke config ignoreTestList"
    echo "Running smoke run..."
    QT_QPA_PLATFORM=xcb ./node_modules/.bin/detox test --configuration android.internal.release.smoke.ci --headless
    test_result=$?
  fi
fi

npx ts-node ./e2e/attachLogsSendResultsToTestrail.ts

if ((test_result != 0)); then
  exit 1
fi
