#!/usr/bin/env bash
# Do not use set -x: xtrace expands variables and can leak AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY in CI logs.
set -e

echo "🚀 Running iOS Appium tests on AWS Device Farm via API..."

if [[ -z "${BITRISE_SOURCE_DIR:-}" ]]; then
  echo "❌ BITRISE_SOURCE_DIR is not set (expected on Bitrise CI)."
  exit 1
fi

# BITRISE_SOURCE_DIR may be monorepo root (/bitrise/src) or already packages/core-mobile
if [[ -d "${BITRISE_SOURCE_DIR}/packages/core-mobile/ios" ]]; then
  CORE_MOBILE_DIR="${BITRISE_SOURCE_DIR}/packages/core-mobile"
elif [[ -d "${BITRISE_SOURCE_DIR}/ios" ]]; then
  CORE_MOBILE_DIR="${BITRISE_SOURCE_DIR}"
else
  echo "❌ Could not find core-mobile iOS project under BITRISE_SOURCE_DIR=${BITRISE_SOURCE_DIR}"
  exit 1
fi

cd "$CORE_MOBILE_DIR"

if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Please ensure Node.js is installed in Bitrise."
  exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

if [ -z "${AWS_ACCESS_KEY_ID:-}" ] || [ -z "${AWS_SECRET_ACCESS_KEY:-}" ]; then
  echo "⚠️  AWS credentials not found in environment variables."
  echo "In Bitrise Secrets, set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY."
  exit 1
fi

if [ -z "$AWS_DEFAULT_REGION" ] && [ -z "$AWS_REGION" ]; then
  export AWS_DEFAULT_REGION="us-west-2"
fi

# Resolve IPA path
# 1) $BITRISE_IPA_PATH — set by xcode-archive / sign-apk step
# 2) Signed artifact path used by deploy-to-bitrise-io pipeline_intermediate_files
IPA_CANDIDATES=()
if [ -n "${BITRISE_IPA_PATH:-}" ]; then
  IPA_CANDIDATES+=("$BITRISE_IPA_PATH")
fi
if [ -n "${BITRISE_DEPLOY_DIR:-}" ]; then
  IPA_CANDIDATES+=("$BITRISE_DEPLOY_DIR/AvaxWalletInternal.ipa")
fi

RESOLVED_IPA=""
for p in "${IPA_CANDIDATES[@]}"; do
  if [ -f "$p" ]; then
    RESOLVED_IPA="$p"
    break
  fi
done

if [ -z "$RESOLVED_IPA" ]; then
  echo "❌ No internal E2E IPA found."
  echo "   Tried:"
  for p in "${IPA_CANDIDATES[@]}"; do
    echo "     - $p"
  done
  echo ""
  echo "   Single-workflow: use ios-internal-e2e-aws-regression-run (builds IPA in before_run)."
  echo "   Bitrise Pipeline stage 2: use workflow ios-internal-e2e-aws-regression-from-pipeline"
  echo "   (runs pull-intermediate-files so the IPA exists under BITRISE_DEPLOY_DIR)."
  if [ -n "${BITRISE_DEPLOY_DIR:-}" ]; then
    echo ""
    echo "   Listing $BITRISE_DEPLOY_DIR:"
    ls -la "$BITRISE_DEPLOY_DIR" 2>/dev/null || true
  fi
  exit 1
fi

export BITRISE_IPA_PATH="$RESOLVED_IPA"
echo "📱 IPA path: $BITRISE_IPA_PATH"
ls -lh "$BITRISE_IPA_PATH"

echo "📦 Packaging tests for Device Farm..."
yarn devicefarm:package

TEST_PACKAGE="$CORE_MOBILE_DIR/e2e-appium/appium-tests-devicefarm.zip"
if [ ! -f "$TEST_PACKAGE" ]; then
  echo "❌ Test package not found at: $TEST_PACKAGE"
  exit 1
fi

echo "✅ Test package created: $TEST_PACKAGE"
ls -lh "$TEST_PACKAGE"

TEST_SPEC="$CORE_MOBILE_DIR/e2e-appium/aws_test_spec.yaml"
if [ ! -f "$TEST_SPEC" ]; then
  echo "❌ Test spec not found at: $TEST_SPEC"
  exit 1
fi

echo "✅ Test spec found: $TEST_SPEC"

if [ -z "$DEVICEFARM_PROJECT_ARN" ]; then
  echo "❌ DEVICEFARM_PROJECT_ARN not set"
  exit 1
fi

# iOS uses a separate device pool (iOS devices only).
# DEVICEFARM_IOS_DEVICE_POOL_ARN takes precedence; falls back to DEVICEFARM_DEVICE_POOL_ARN.
if [ -n "${DEVICEFARM_IOS_DEVICE_POOL_ARN:-}" ]; then
  export DEVICEFARM_DEVICE_POOL_ARN="$DEVICEFARM_IOS_DEVICE_POOL_ARN"
fi

if [ -z "${DEVICEFARM_DEVICE_POOL_ARN:-}" ]; then
  echo "❌ DEVICEFARM_IOS_DEVICE_POOL_ARN (or DEVICEFARM_DEVICE_POOL_ARN) not set"
  exit 1
fi

_REGRESSION_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
_ENSURE_CLIENT_DEVICE_FARM="$_REGRESSION_SCRIPT_DIR/../../devicefarm/ensure-client-device-farm.sh"
if [[ ! -f "$_ENSURE_CLIENT_DEVICE_FARM" ]]; then
  echo "❌ Missing required helper (commit it to git): $_ENSURE_CLIENT_DEVICE_FARM"
  exit 1
fi
source "$_ENSURE_CLIENT_DEVICE_FARM"
ensure_client_device_farm

export DEVICEFARM_APP_PATH="$BITRISE_IPA_PATH"
export DEVICEFARM_TEST_PACKAGE_PATH="$TEST_PACKAGE"
export DEVICEFARM_TEST_SPEC_PATH="$TEST_SPEC"
export PLATFORM="ios"
export WAIT_FOR_COMPLETION="${WAIT_FOR_COMPLETION:-true}"

echo "📤 Uploading and running tests on AWS Device Farm via API..."
echo "Project ARN: $DEVICEFARM_PROJECT_ARN"
echo "Device Pool ARN: $DEVICEFARM_DEVICE_POOL_ARN"
echo "App: $DEVICEFARM_APP_PATH"
echo "Test Package: $DEVICEFARM_TEST_PACKAGE_PATH"
echo "Test Spec: $DEVICEFARM_TEST_SPEC_PATH"

node scripts/devicefarm/trigger-devicefarm-api.js
EXIT_CODE=$?
cleanup_client_device_farm_tmp

if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ Device Farm iOS test run triggered successfully via API"
else
  echo "❌ Device Farm iOS test run failed with exit code: $EXIT_CODE"
  exit $EXIT_CODE
fi
