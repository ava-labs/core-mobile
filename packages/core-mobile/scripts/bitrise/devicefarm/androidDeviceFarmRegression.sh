#!/usr/bin/env bash
set -ex

echo "🚀 Running Android Appium tests on AWS Device Farm via API..."

if [[ -z "${BITRISE_SOURCE_DIR:-}" ]]; then
  echo "❌ BITRISE_SOURCE_DIR is not set (expected on Bitrise CI)."
  exit 1
fi

# BITRISE_SOURCE_DIR may be monorepo root (/bitrise/src) or already packages/core-mobile
# (e.g. after Bitrise "Change Working Directory"). Resolve the package root once.
if [[ -d "${BITRISE_SOURCE_DIR}/packages/core-mobile/android" ]]; then
  CORE_MOBILE_DIR="${BITRISE_SOURCE_DIR}/packages/core-mobile"
elif [[ -d "${BITRISE_SOURCE_DIR}/android" ]]; then
  CORE_MOBILE_DIR="${BITRISE_SOURCE_DIR}"
else
  echo "❌ Could not find core-mobile Android project under BITRISE_SOURCE_DIR=${BITRISE_SOURCE_DIR}"
  exit 1
fi

cd "$CORE_MOBILE_DIR"

# Verify Node.js is available
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Please ensure Node.js is installed in Bitrise."
  exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Verify AWS credentials are configured
# Bitrise: set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in secrets (from the Device Farm IAM role)
if [ -z "${AWS_ACCESS_KEY_ID:-}" ] || [ -z "${AWS_SECRET_ACCESS_KEY:-}" ]; then
  echo "⚠️  AWS credentials not found in environment variables."
  echo "In Bitrise Secrets, set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY."
  exit 1
fi

# Set AWS region if not already set
if [ -z "$AWS_DEFAULT_REGION" ] && [ -z "$AWS_REGION" ]; then
  export AWS_DEFAULT_REGION="us-west-2"
fi

# Resolve APK path (Bitrise sets BITRISE_APK_PATH inconsistently across single builds vs Pipelines)
# 1) $BITRISE_APK_PATH — set by android-build / sign-apk / deploy-to-bitrise-io, or shared from another stage
# 2) Signed artifact path used by deploy-to-bitrise-io pipeline_intermediate_files in bitrise.yml
# 3) Gradle output when build ran on this machine but deploy path differs
APK_CANDIDATES=()
if [ -n "${BITRISE_APK_PATH:-}" ]; then
  APK_CANDIDATES+=("$BITRISE_APK_PATH")
fi
if [ -n "${BITRISE_DEPLOY_DIR:-}" ]; then
  APK_CANDIDATES+=("$BITRISE_DEPLOY_DIR/app-internal-e2e-bitrise-signed.apk")
fi
APK_CANDIDATES+=("$CORE_MOBILE_DIR/android/app/build/outputs/apk/internal/e2e/app-internal-e2e.apk")

RESOLVED_APK=""
for p in "${APK_CANDIDATES[@]}"; do
  if [ -f "$p" ]; then
    RESOLVED_APK="$p"
    break
  fi
done

if [ -z "$RESOLVED_APK" ]; then
  echo "❌ No internal E2E APK found."
  echo "   Tried:"
  for p in "${APK_CANDIDATES[@]}"; do
    echo "     - $p"
  done
  echo ""
  echo "   Single-workflow: use android-internal-e2e-aws-regression-run (builds APK in before_run)."
  echo "   Bitrise Pipeline stage 2: use workflow android-internal-e2e-aws-regression-from-pipeline"
  echo "   (runs pull-intermediate-files so the signed APK exists under BITRISE_DEPLOY_DIR)."
  if [ -n "${BITRISE_DEPLOY_DIR:-}" ]; then
    echo ""
    echo "   Listing $BITRISE_DEPLOY_DIR:"
    ls -la "$BITRISE_DEPLOY_DIR" 2>/dev/null || true
  fi
  exit 1
fi

export BITRISE_APK_PATH="$RESOLVED_APK"
echo "📱 APK path: $BITRISE_APK_PATH"
ls -lh "$BITRISE_APK_PATH"

# Package the tests
echo "📦 Packaging tests for Device Farm..."
yarn devicefarm:package

# Verify test package was created
TEST_PACKAGE="$CORE_MOBILE_DIR/e2e-appium/appium-tests-devicefarm.zip"
if [ ! -f "$TEST_PACKAGE" ]; then
  echo "❌ Test package not found at: $TEST_PACKAGE"
  exit 1
fi

echo "✅ Test package created: $TEST_PACKAGE"
ls -lh "$TEST_PACKAGE"

# Verify test spec exists
TEST_SPEC="$CORE_MOBILE_DIR/e2e-appium/aws_test_spec.yaml"
if [ ! -f "$TEST_SPEC" ]; then
  echo "❌ Test spec not found at: $TEST_SPEC"
  exit 1
fi

echo "✅ Test spec found: $TEST_SPEC"

# Verify required environment variables are set
if [ -z "$DEVICEFARM_PROJECT_ARN" ]; then
  echo "❌ DEVICEFARM_PROJECT_ARN not set"
  exit 1
fi

if [ -z "$DEVICEFARM_DEVICE_POOL_ARN" ]; then
  echo "❌ DEVICEFARM_DEVICE_POOL_ARN not set"
  exit 1
fi

# AWS SDK: listed in package.json devDependencies (installed by Bitrise yarn).
# Never `npm install` in this directory — npm errors on Yarn "workspace:*" (EUNSUPPORTEDPROTOCOL).
# shellcheck source=../../devicefarm/ensure-client-device-farm.sh
source "$CORE_MOBILE_DIR/scripts/devicefarm/ensure-client-device-farm.sh"
ensure_client_device_farm

# Set environment variables for Node.js script
export DEVICEFARM_APP_PATH="$BITRISE_APK_PATH"
export DEVICEFARM_TEST_PACKAGE_PATH="$TEST_PACKAGE"
export DEVICEFARM_TEST_SPEC_PATH="$TEST_SPEC"
export PLATFORM="android"
export WAIT_FOR_COMPLETION="${WAIT_FOR_COMPLETION:-true}"

echo "📤 Uploading and running tests on AWS Device Farm via API..."
echo "Project ARN: $DEVICEFARM_PROJECT_ARN"
echo "Device Pool ARN: $DEVICEFARM_DEVICE_POOL_ARN"
echo "App: $DEVICEFARM_APP_PATH"
echo "Test Package: $DEVICEFARM_TEST_PACKAGE_PATH"
echo "Test Spec: $DEVICEFARM_TEST_SPEC_PATH"

# Run the Node.js API script
node scripts/devicefarm/trigger-devicefarm-api.js
EXIT_CODE=$?
cleanup_client_device_farm_tmp

if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ Device Farm test run triggered successfully via API"
else
  echo "❌ Device Farm test run failed with exit code: $EXIT_CODE"
  exit $EXIT_CODE
fi

