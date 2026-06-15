#!/usr/bin/env bash
set -euo pipefail

SPEC_ARG=""
if [ -n "${1:-}" ]; then
  SPEC_ARG="--spec $1"
fi

IOS_UDID="00008120-000E08C02EE1A01E" \
IOS_DEVICE_NAME="AVL-XL6236HF6T-iOS" \
IOS_PLATFORM_VERSION="26.5" \
APP_PATH="/Users/eunji.song/Downloads/AvaxWallet.ipa" \
PLATFORM=ios \
E2E="true" \
XCODE_ORG_ID="3LM5Z8T8J5" \
yarn appium:ios $SPEC_ARG
