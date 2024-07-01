#!/usr/bin/env bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

yarn start &

npm rebuild detox

QT_QPA_PLATFORM=xcb; ./node_modules/.bin/detox test --workers 3 -c ios.internal.release.ci --headless --retries 1 --detectOpenHandles; test_result=$?

if ((test_result != 0)); then
  exit 1
fi