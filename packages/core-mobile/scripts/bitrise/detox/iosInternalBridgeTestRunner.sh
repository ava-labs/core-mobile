#!/usr/bin/env bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

npm rebuild detox

./node_modules/.bin/detox test --configuration ios.internal.release.bridgeTests.ci; test_result=$?

npx ts-node ./e2e/attachLogsToTestrailResults.ts

if ((test_result != 0)); then
  exit 1
fi