#!/usr/bin/env bash
set -e

# 1. Go to core-mobile directory
if [[ -d "${BITRISE_SOURCE_DIR}/packages/core-mobile/ios" ]]; then
  CORE_MOBILE_DIR="${BITRISE_SOURCE_DIR}/packages/core-mobile"
elif [[ -d "${BITRISE_SOURCE_DIR}/ios" ]]; then
  CORE_MOBILE_DIR="${BITRISE_SOURCE_DIR}"
else
  echo "❌ Could not find core-mobile under BITRISE_SOURCE_DIR=${BITRISE_SOURCE_DIR}"
  exit 1
fi

cd "$CORE_MOBILE_DIR"

# 2. Set AWS region
[ -z "${AWS_DEFAULT_REGION:-}" ] && [ -z "${AWS_REGION:-}" ] && export AWS_DEFAULT_REGION="us-west-2"

# 3. Packaging tests is required before running tests
echo "📦 Packaging tests..."
yarn devicefarm:package

TEST_PACKAGE="$CORE_MOBILE_DIR/e2e-appium/appium-tests-devicefarm.zip"
TEST_SPEC="$CORE_MOBILE_DIR/e2e-appium/aws_test_spec.yaml"

_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$_SCRIPT_DIR/../../../devicefarm/ensure-client-device-farm.sh"
ensure_client_device_farm

# DEVICEFARM_IOS_DEVICE_POOL_ARN takes precedence over DEVICEFARM_DEVICE_POOL_ARN
[ -n "${DEVICEFARM_IOS_DEVICE_POOL_ARN:-}" ] && export DEVICEFARM_DEVICE_POOL_ARN="$DEVICEFARM_IOS_DEVICE_POOL_ARN"

export DEVICEFARM_APP_PATH="$BITRISE_IPA_PATH"
export DEVICEFARM_TEST_PACKAGE_PATH="$TEST_PACKAGE"
export DEVICEFARM_TEST_SPEC_PATH="$TEST_SPEC"
export PLATFORM="ios"
export WAIT_FOR_COMPLETION="${WAIT_FOR_COMPLETION:-true}"

# 4. Extract only needed vars from env file
if [ -f "$CORE_MOBILE_DIR/.env.production.e2e" ]; then
  E2E_MNEMONIC=$(grep '^E2E_MNEMONIC=' "$CORE_MOBILE_DIR/.env.production.e2e" | cut -d'=' -f2-)
  E2E_METAMASK_MNEMONIC=$(grep '^E2E_METAMASK_MNEMONIC=' "$CORE_MOBILE_DIR/.env.production.e2e" | cut -d'=' -f2-)
  export E2E_MNEMONIC E2E_METAMASK_MNEMONIC
fi

# 5. Finally trigger test run
node scripts/devicefarm/test.js
EXIT_CODE=$?
cleanup_client_device_farm_tmp

[ $EXIT_CODE -eq 0 ] || exit $EXIT_CODE
