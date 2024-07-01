#!/usr/bin/env bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

yarn start &

npm rebuild detox

adb install -r $BITRISE_TEST_APK_PATH
adb install -r $BITRISE_APK_PATH

./node_modules/.bin/detox test --listTests --configuration android.internal.release.smoke.reuse_state.ci 

echo "IS_REGRESSION_RUN should be true: $IS_REGRESSION_RUN"

if [[$IS_REGRESSION_RUN="true"]]; then
  QT_QPA_PLATFORM=xcb; ./node_modules/.bin/detox test --configuration android.internal.release.regression.ci --headless --reuse --retries 1; test_result=$?
else
  QT_QPA_PLATFORM=xcb; ./node_modules/.bin/detox test --configuration android.internal.release.smoke.reuse_state.ci --headless --reuse --retries 1; test_result=$?
fi

if ((test_result != 0)); then
  exit 1
fi