#!/usr/bin/env bash
# fail if any commands fails
set -e
# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

# download and unzip env files
curl -Lfo "$BITRISE_SOURCE_DIR/envs.zip" "$BITRISEIO_ENV_FILES_URL"
unzip -u "$BITRISE_SOURCE_DIR/envs" -d "$BITRISE_SOURCE_DIR"

# download and unzip google services files
curl -Lfo "$BITRISE_SOURCE_DIR/googleservices.zip" "$BITRISEIO_GOOGLE_SERVICES_FILES_URL"
unzip -u "$BITRISE_SOURCE_DIR/googleservices" -d "$BITRISE_SOURCE_DIR"