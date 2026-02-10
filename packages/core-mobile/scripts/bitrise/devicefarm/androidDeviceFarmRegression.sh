#!/usr/bin/env bash
set -ex

echo "🚀 Running Android Appium tests on AWS Device Farm via API..."

# Change to the core-mobile directory
cd "$BITRISE_SOURCE_DIR/packages/core-mobile"

# Verify Node.js is available
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Please ensure Node.js is installed in Bitrise."
  exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Verify AWS credentials are configured
# Bitrise should provide these via environment variables
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "⚠️  AWS credentials not found in environment variables."
  echo "Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in Bitrise secrets."
  exit 1
fi

# Set AWS region if not already set
if [ -z "$AWS_DEFAULT_REGION" ] && [ -z "$AWS_REGION" ]; then
  export AWS_DEFAULT_REGION="us-west-2"
fi

# Verify APK exists
if [ ! -f "$BITRISE_APK_PATH" ]; then
  echo "❌ APK not found at: $BITRISE_APK_PATH"
  exit 1
fi

echo "📱 APK path: $BITRISE_APK_PATH"
ls -lh "$BITRISE_APK_PATH"

# Package the tests
echo "📦 Packaging tests for Device Farm..."
yarn devicefarm:package

# Verify test package was created
TEST_PACKAGE="$BITRISE_SOURCE_DIR/packages/core-mobile/e2e-appium/appium-tests-devicefarm.zip"
if [ ! -f "$TEST_PACKAGE" ]; then
  echo "❌ Test package not found at: $TEST_PACKAGE"
  exit 1
fi

echo "✅ Test package created: $TEST_PACKAGE"
ls -lh "$TEST_PACKAGE"

# Verify test spec exists
TEST_SPEC="$BITRISE_SOURCE_DIR/packages/core-mobile/e2e-appium/aws_test_spec.yaml"
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

# Install AWS SDK if not already installed
echo "📦 Installing AWS SDK for Device Farm..."
npm install @aws-sdk/client-device-farm --no-save

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

if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ Device Farm test run triggered successfully via API"
else
  echo "❌ Device Farm test run failed with exit code: $EXIT_CODE"
  exit $EXIT_CODE
fi

