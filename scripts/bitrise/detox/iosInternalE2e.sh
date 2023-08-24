#!/usr/bin/env bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

# debug log
set -x

npm rebuild detox
./node_modules/.bin/detox test --configuration ios.internal.release.smoke.ci --retries 1; test_result=$?

RUN_ID=$(head -n 1 ./e2e/testrailRunId.txt) 

ts-node ./e2e/sendResults.ts

envman add --key TESTRAIL_RUN --value $RUN_ID

if ((test_result != 0)); then
  exit 1
fi