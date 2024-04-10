#!/usr/bin/env bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

npm rebuild detox
./node_modules/.bin/detox test --maxWorkers 2 --configuration ios.internal.release.smoke.ci --retries 1; test_result=$?

if test -f ./e2e/testrailRunId.txt; then
  echo "TestRail run id file exists"
  RUN_ID=$(head -n 1 ./e2e/testrailRunId.txt) 
  envman add --key TESTRAIL_RUN_ID --value $RUN_ID
else
  echo "TestRail run id file does not exist"
fi


if ((test_result != 0)); then
  exit 1
fi