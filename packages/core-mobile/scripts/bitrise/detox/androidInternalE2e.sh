#!/usr/bin/env bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

# debug log
set -x

yarn start &

npm rebuild detox
QT_QPA_PLATFORM=xcb; ./node_modules/.bin/detox test --configuration android.internal.release.smoke.ci --headless --retries 1; test_result=$?

if ((test_result != 0)); then
  exit 1
fi