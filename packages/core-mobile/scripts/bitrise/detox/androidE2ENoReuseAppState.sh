#!/usr/bin/env bash

# Make pipelines' return status equal to the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

yarn start &

npm rebuild detox

adb install -r "$BITRISE_APK_PATH"
adb install -r "$BITRISE_TEST_APK_PATH"

echo "IS_REGRESSION_RUN should be true: $IS_REGRESSION_RUN"
echo "Got test list: $TESTS_TO_RUN"

if [ "$IS_REGRESSION_RUN" = true ]; then
  if [ "$IS_INTERNAL_BUILD" = true ]; then
    if [ "$PARAMETERIZED_TESTS" = true ]; then
      echo "Regression, Internal, Parameterized Test"
      echo "current detox config: android.internal.release.regression.parameterized_tests.ci"
      QT_QPA_PLATFORM=xcb ./node_modules/.bin/detox test --configuration android.internal.release.regression.parameterized_tests.ci --headless
      test_result=$?
    else
      echo "Regression, Internal, NON Parameterized Test"
      echo "current detox config: android.internal.release.regression.ci"
      QT_QPA_PLATFORM=xcb ./node_modules/.bin/detox test --configuration android.internal.release.regression.ci --headless
      test_result=$?
    fi
  else
    if [ "$PARAMETERIZED_TESTS" = true ]; then
      echo "Regression, External, Parameterized Test"
      echo "current detox config: android.external.release.regression.parameterized_tests.ci"
      QT_QPA_PLATFORM=xcb ./node_modules/.bin/detox test --configuration android.external.release.regression.parameterized_tests.ci --headless
      test_result=$?
    else
      echo "Regression, External, NON Parameterized Test"
      echo "current detox config: android.external.release.regression.ci"
      QT_QPA_PLATFORM=xcb ./node_modules/.bin/detox test --configuration android.external.release.regression.ci --headless
      test_result=$?
    fi
  fi
else
  if [ "$PARAMETERIZED_TESTS" = true ]; then
    echo "Smoke, Internal, Parameterized Test"
    exit 0  # We don't run parameterized tests on smoke run
  else
    echo "Smoke, Internal, NON Parameterized Test"
    echo "current detox config: android.internal.release.smoke.ci"
    QT_QPA_PLATFORM=xcb ./node_modules/.bin/detox test --configuration android.internal.release.smoke.ci --headless
    test_result=$?
  fi
fi

npx ts-node ./e2e/attachLogsSendResultsToTestrail.ts

if ((test_result != 0)); then
  exit 1
fi
