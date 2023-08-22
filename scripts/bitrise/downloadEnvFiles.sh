#!/usr/bin/env bash
# fail if any commands fails
set -e
# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail
# debug log
set -x

# download
curl -Lfo "$BITRISE_SOURCE_DIR/resource.zip" "$BITRISEIO_ENV_FILES_URL"

# unzip
unzip -u "$BITRISE_SOURCE_DIR/resource" -d "$BITRISE_SOURCE_DIR"