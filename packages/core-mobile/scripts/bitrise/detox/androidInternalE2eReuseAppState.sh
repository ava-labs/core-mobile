#!/usr/bin/env bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

yarn start &

npm rebuild detox

adb install -r $BITRISE_TEST_APK_PATH

./node_modules/.bin/detox test --listTests --configuration android.internal.release.smoke.reuse_state.ci

QT_QPA_PLATFORM=xcb; ./node_modules/.bin/detox test --configuration android.internal.release.smoke.reuse_state.ci --reuse --headless --retries 1 --loglevel trace; test_result=$?

if ((test_result != 0)); then
  exit 1
fi