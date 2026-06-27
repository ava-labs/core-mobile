#!/usr/bin/env bash
set -euo pipefail

SPEC_ARG=""
if [ -n "${1:-}" ]; then
  SPEC_ARG="--spec $1"
fi

APP_PATH="/Users/eunji.song/Downloads/app-external-e2e-bitrise-signed.apk" \
PLATFORM=android \
E2E="true" \
yarn appium:android $SPEC_ARG
