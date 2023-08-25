#!/usr/bin/env bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

# debug log
set -x

npm rebuild detox
./node_modules/.bin/detox test --configuration ios.external.release.smoke.ci --retries 2