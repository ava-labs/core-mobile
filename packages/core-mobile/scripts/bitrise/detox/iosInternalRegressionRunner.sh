#!/usr/bin/env bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

yarn start &

npm rebuild detox

QT_QPA_PLATFORM=xcb; ./node_modules/.bin/detox test addressBook.e2e.smoke.ts enableTestnet.e2e.smoke.ts emptyAssets.e2e.ts changeNetwork.e2e.smoke.ts  --maxWorkers 3 -c ios.internal.release.ci --retries 1; test_result=$?

if ((test_result != 0)); then
  exit 1
fi