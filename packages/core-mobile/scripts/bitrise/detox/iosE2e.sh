#!/usr/bin/env bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

npm rebuild detox
./node_modules/.bin/detox test --maxWorkers 3 --configuration ios.external.release.smoke.ci --retries 2