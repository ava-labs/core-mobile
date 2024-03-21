#!/usr/bin/env bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

# debug log
set -x

yarn start &

npm rebuild detox

adb install -r $BITRISE_APK_PATH
adb install -r $BITRISE_TEST_APK_PATH

adb reverse tcp:8081 tcp:8081

QT_QPA_PLATFORM=xcb; ./node_modules/.bin/detox test --configuration android.internal.release.smoke.reuse_state.ci --reuse --headless --retries 1 --loglevel trace; test_result=$?

if ((test_result != 0)); then
  exit 1
fi