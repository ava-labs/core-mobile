#!/usr/bin/env bash
set -euo pipefail

# Script to download APK from Bitrise and trigger AWS Device Farm tests
# Can be used in Bitrise workflows or run locally
#
# Usage:
#   ./bitrise-to-devicefarm.sh [options]
#
# Environment variables (required):
#   BITRISE_APP_SLUG - Bitrise app slug
#   BITRISE_ARTIFACTS_TOKEN - Bitrise artifacts access token
#   DEVICEFARM_PROJECT_ARN - AWS Device Farm project ARN
#   DEVICEFARM_DEVICE_POOL_ARN - AWS Device Farm device pool ARN
#   AWS_ACCESS_KEY_ID - AWS access key
#   AWS_SECRET_ACCESS_KEY - AWS secret access key
#
# Environment variables (optional):
#   BITRISE_BUILD_INDEX - Which build to download (0 = latest). Default: 0
#   DEVICEFARM_APP_PATH - Where to save/download APK. Default: auto-determined
#   WAIT_FOR_COMPLETION - Wait for test completion (true/false). Default: false
#   AWS_REGION - AWS region. Default: us-west-2
#   PLATFORM - Platform (android/ios). Default: android

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CORE_MOBILE_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BITRISE_BUILD_INDEX="${BITRISE_BUILD_INDEX:-0}"
PLATFORM="${PLATFORM:-android}"
AWS_REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-us-west-2}}"
WAIT_FOR_COMPLETION="${WAIT_FOR_COMPLETION:-false}"

# Default APK path
if [ -z "${DEVICEFARM_APP_PATH:-}" ]; then
  if [ "$PLATFORM" = "android" ]; then
    DEVICEFARM_APP_PATH="$CORE_MOBILE_DIR/android/app/build/outputs/apk/internal/e2e/app-internal-e2e.apk"
  else
    DEVICEFARM_APP_PATH="$CORE_MOBILE_DIR/ios/build/AvaxWalletInternal.ipa"
  fi
fi

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js not found. Please install Node.js.${NC}"
  exit 1
fi

if [ -z "${BITRISE_APP_SLUG:-}" ]; then
  echo -e "${RED}❌ BITRISE_APP_SLUG environment variable is required${NC}"
  echo "   Get it from: https://app.bitrise.io/app/<your-app-slug>"
  exit 1
fi

if [ -z "${BITRISE_ARTIFACTS_TOKEN:-}" ]; then
  echo -e "${RED}❌ BITRISE_ARTIFACTS_TOKEN environment variable is required${NC}"
  echo "   Get it from: Bitrise Dashboard > Settings > API > Artifacts Access Token"
  exit 1
fi

if [ -z "${DEVICEFARM_PROJECT_ARN:-}" ]; then
  echo -e "${RED}❌ DEVICEFARM_PROJECT_ARN environment variable is required${NC}"
  exit 1
fi

if [ -z "${DEVICEFARM_DEVICE_POOL_ARN:-}" ]; then
  echo -e "${RED}❌ DEVICEFARM_DEVICE_POOL_ARN environment variable is required${NC}"
  exit 1
fi

if [ -z "${AWS_ACCESS_KEY_ID:-}" ] || [ -z "${AWS_SECRET_ACCESS_KEY:-}" ]; then
  echo -e "${RED}❌ AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables are required${NC}"
  exit 1
fi

export AWS_REGION
export AWS_DEFAULT_REGION="$AWS_REGION"

echo -e "${GREEN}✅ Prerequisites check passed${NC}\n"

# Step 1: Download APK from Bitrise
echo -e "${BLUE}📥 Step 1: Downloading APK from Bitrise...${NC}"
echo "   Build index: $BITRISE_BUILD_INDEX"
echo "   Output path: $DEVICEFARM_APP_PATH"

cd "$CORE_MOBILE_DIR"

# Ensure output directory exists
mkdir -p "$(dirname "$DEVICEFARM_APP_PATH")"

# Download the APK
if ! node "$SCRIPT_DIR/download-bitrise-apk.js" e2e "$BITRISE_BUILD_INDEX" "$DEVICEFARM_APP_PATH"; then
  echo -e "${RED}❌ Failed to download APK from Bitrise${NC}"
  exit 1
fi

if [ ! -f "$DEVICEFARM_APP_PATH" ]; then
  echo -e "${RED}❌ APK file not found after download: $DEVICEFARM_APP_PATH${NC}"
  exit 1
fi

APK_SIZE=$(ls -lh "$DEVICEFARM_APP_PATH" | awk '{print $5}')
echo -e "${GREEN}✅ APK downloaded successfully (${APK_SIZE})${NC}\n"

# Step 2: Package tests (if not already packaged)
echo -e "${BLUE}📦 Step 2: Packaging tests for Device Farm...${NC}"
TEST_PACKAGE="$CORE_MOBILE_DIR/e2e-appium/appium-tests-devicefarm.zip"

if [ ! -f "$TEST_PACKAGE" ]; then
  echo "   Test package not found, creating it..."
  if ! "$SCRIPT_DIR/package-tests.sh"; then
    echo -e "${RED}❌ Failed to package tests${NC}"
    exit 1
  fi
else
  echo "   Test package already exists"
fi

if [ ! -f "$TEST_PACKAGE" ]; then
  echo -e "${RED}❌ Test package not found: $TEST_PACKAGE${NC}"
  exit 1
fi

TEST_PACKAGE_SIZE=$(ls -lh "$TEST_PACKAGE" | awk '{print $5}')
echo -e "${GREEN}✅ Test package ready (${TEST_PACKAGE_SIZE})${NC}\n"

# Step 3: Verify test spec exists
echo -e "${BLUE}📋 Step 3: Verifying test spec...${NC}"
TEST_SPEC="$CORE_MOBILE_DIR/e2e-appium/aws_test_spec.yaml"

if [ ! -f "$TEST_SPEC" ]; then
  echo -e "${RED}❌ Test spec not found: $TEST_SPEC${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Test spec found${NC}\n"

# Step 4: Install AWS SDK if needed
echo -e "${BLUE}📦 Step 4: Checking AWS SDK...${NC}"
if [ ! -d "$CORE_MOBILE_DIR/node_modules/@aws-sdk/client-device-farm" ]; then
  echo "   Installing AWS SDK..."
  cd "$CORE_MOBILE_DIR"
  npm install @aws-sdk/client-device-farm --no-save --silent
else
  echo "   AWS SDK already installed"
fi

echo -e "${GREEN}✅ AWS SDK ready${NC}\n"

# Step 5: Trigger Device Farm tests
echo -e "${BLUE}🚀 Step 5: Triggering AWS Device Farm tests...${NC}"
echo "   Project ARN: $DEVICEFARM_PROJECT_ARN"
echo "   Device Pool ARN: $DEVICEFARM_DEVICE_POOL_ARN"
echo "   Platform: $PLATFORM"
echo "   App: $DEVICEFARM_APP_PATH"
echo "   Test Package: $TEST_PACKAGE"
echo "   Test Spec: $TEST_SPEC"
echo "   Wait for completion: $WAIT_FOR_COMPLETION"

# Set environment variables for the Node.js script
export DEVICEFARM_PROJECT_ARN
export DEVICEFARM_DEVICE_POOL_ARN
export DEVICEFARM_APP_PATH
export DEVICEFARM_TEST_PACKAGE_PATH="$TEST_PACKAGE"
export DEVICEFARM_TEST_SPEC_PATH="$TEST_SPEC"
export PLATFORM
export WAIT_FOR_COMPLETION

# Run the Device Farm trigger script
if node "$SCRIPT_DIR/trigger-devicefarm-api.js"; then
  echo -e "\n${GREEN}✅ Device Farm test run triggered successfully!${NC}"
  
  if [ "$WAIT_FOR_COMPLETION" = "true" ]; then
    echo -e "${GREEN}✅ Test run completed${NC}"
  else
    echo -e "${YELLOW}ℹ️  Test run is executing in the background${NC}"
    echo "   Check AWS Device Farm console for progress"
  fi
  
  exit 0
else
  EXIT_CODE=$?
  echo -e "\n${RED}❌ Device Farm test run failed with exit code: $EXIT_CODE${NC}"
  exit $EXIT_CODE
fi
