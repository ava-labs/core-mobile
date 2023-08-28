#!/usr/bin/env bash
# fail if any commands fails
set -e

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

# debug log
set -x

npm rebuild detox
QT_QPA_PLATFORM=xcb; ./node_modules/.bin/detox test --configuration android.external.release.smoke.ci --headless --retries 1