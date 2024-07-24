#!/usr/bin/env bash
# fail if any commands fails
set -e
# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

# write your script here
# without this fix, we can't start emulator due to this error
# "Could not find the Qt platform plugin "offscreen" in "/opt/android-sdk-linux/emulator/lib64/qt/plugins"
# "Available platform plugins are: xcb."
envman add --key QT_QPA_PLATFORM --value xcb