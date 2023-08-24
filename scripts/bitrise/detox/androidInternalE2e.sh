#!/usr/bin/env bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

# debug log
set -x

.e2e/android_smoke_test_counter.sh

npm rebuild detox
QT_QPA_PLATFORM=xcb; ./node_modules/.bin/detox test --configuration android.internal.release.smoke.ci --headless --retries 1; test_result=$?

RUN_ID=$(head -n 1 ./e2e/testrailRunId.txt) 

envman add --key TESTRAIL_RUN --value $RUN_ID

if ((test_result != 0)); then
  exit 1
fi