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
TEST_SPEC="$CORE_MOBILE_DIR/e2e-appium/aws_test_spec_ios.yaml"

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

# 4. Seedless test flags
export IS_SEEDLESS="true"
export IS_SEEDLESS_TRANSACTIONS="true"

# 5. Load all E2E env vars from shared helper
source "$_SCRIPT_DIR/../load-e2e-env.sh"

if [ -z "${TEST_OIDC_PRIVATE_KEY:-}" ] || [ -z "${TEST_OIDC_ISSUER:-}" ] || [ -z "${TEST_OIDC_AUDIENCE:-}" ]; then
  echo "❌ TEST_OIDC_PRIVATE_KEY, TEST_OIDC_ISSUER, TEST_OIDC_AUDIENCE must be set (in .env.production.e2e or Bitrise secrets)"
  exit 1
fi

# 6. Finally trigger test run
node scripts/devicefarm/test.js
EXIT_CODE=$?
cleanup_client_device_farm_tmp

[ $EXIT_CODE -eq 0 ] || exit $EXIT_CODE
