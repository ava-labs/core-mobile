#!/usr/bin/env bash
# fail if any commands fails
set -e
# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail
# debug log
set -x

if [ "$PLATFORM" = "iOS" ]; then
  cp -R e2e/artifacts/ios $BITRISE_DEPLOY_DIR/detox    
else
  cp -R e2e/artifacts/android $BITRISE_DEPLOY_DIR/detox
fi