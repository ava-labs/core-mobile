#!/usr/bin/env bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

npm rebuild detox

./node_modules/.bin/detox test --maxWorkers 1 --configuration ios.internal.release.smoke.ci.reuse_state --retries 1; test_result=$?

if ((test_result != 0)); then
  exit 1
fi