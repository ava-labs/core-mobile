#!/usr/bin/env bash
# fail if any commands fails
set -e
# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail
# debug log
set -x

# when a pipeline starts, it triggers both iOS and Android workflows
# in order for iOS and Android to have different build numbers, we increment build number by 1 for Android
if [ "$PLATFORM" = "iOS" ]; then
  buildNumber=$BITRISE_BUILD_NUMBER       
else
  buildNumber=$((BITRISE_BUILD_NUMBER+1))
fi

envman add --key BUILD_NUMBER --value "${buildNumber}"