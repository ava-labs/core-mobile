#!/usr/bin/env bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

# debug log
set -x

npm rebuild detox


xcrun simctl boot 'iPhone 16 Pro' || true
xcrun simctl bootstatus booted -b

if [ -z "$CI" ] || [ "$CI" = "false" ]; then
  echo "CI is not set or is false, opening Simulator"
  open -a Simulator
fi

./node_modules/.bin/detox test --maxWorkers 2 --configuration ios.internal.release.smoke.ci.reuse_state --reuse --retries 1; test_result=$?

RUN_ID=$(head -n 1 ./e2e/testrailRunId.txt) 

envman add --key TESTRAIL_RUN_ID --value $RUN_ID

if ((test_result != 0)); then
  exit 1
fi