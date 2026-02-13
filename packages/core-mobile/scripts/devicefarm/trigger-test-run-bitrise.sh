#!/usr/bin/env bash
set -euo pipefail

# Script to trigger AWS Device Farm test run from Bitrise CI/CD
# This script uses the APK artifact from the current Bitrise build
# and triggers Device Farm tests using the Node.js API script
#
# Usage:
#   This script is designed to run in Bitrise CI/CD workflows
#   It expects the APK to be available at $BITRISE_APK_PATH
#
# Required Bitrise Environment Variables:
#   BITRISE_APK_PATH - Path to the APK artifact from the current build
#   DEVICEFARM_PROJECT_ARN - AWS Device Farm project ARN
#   DEVICEFARM_DEVICE_POOL_ARN - AWS Device Farm device pool ARN
#   AWS_ACCESS_KEY_ID - AWS access key ID
#   AWS_SECRET_ACCESS_KEY - AWS secret access key
#
# Optional Environment Variables:
#   PLATFORM - Platform (android/ios). Default: android
#   AWS_REGION - AWS region. Default: us-west-2

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CORE_MOBILE_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Triggering AWS Device Farm Test Run from Bitrise${NC}\n"

# Check required environment variables
if [ -z "${BITRISE_APK_PATH:-}" ]; then
  echo -e "${RED}❌ BITRISE_APK_PATH environment variable is required${NC}"
  echo "   This should be set automatically by Bitrise when APK artifacts are available"
  exit 1
fi

if [ -z "${DEVICEFARM_PROJECT_ARN:-}" ]; then
  echo -e "${RED}❌ DEVICEFARM_PROJECT_ARN environment variable is required${NC}"
  echo "   Set it in Bitrise Secrets or Workflow environment variables"
  exit 1
fi

if [ -z "${DEVICEFARM_DEVICE_POOL_ARN:-}" ]; then
  echo -e "${RED}❌ DEVICEFARM_DEVICE_POOL_ARN environment variable is required${NC}"
  echo "   Set it in Bitrise Secrets or Workflow environment variables"
  exit 1
fi

if [ -z "${AWS_ACCESS_KEY_ID:-}" ] || [ -z "${AWS_SECRET_ACCESS_KEY:-}" ]; then
  echo -e "${RED}❌ AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables are required${NC}"
  echo "   Set them in Bitrise Secrets"
  exit 1
fi

# Set defaults for optional variables
DEVICEFARM_APP_PATH="${BITRISE_APK_PATH}"
DEVICEFARM_TEST_PACKAGE_PATH="${DEVICEFARM_TEST_PACKAGE_PATH:-$CORE_MOBILE_DIR/e2e-appium/appium-tests-devicefarm.zip}"
DEVICEFARM_TEST_SPEC_PATH="${DEVICEFARM_TEST_SPEC_PATH:-$CORE_MOBILE_DIR/e2e-appium/aws_test_spec.yaml}"
PLATFORM="${PLATFORM:-android}"
AWS_REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-us-west-2}}"

# Verify APK exists
if [ ! -f "$DEVICEFARM_APP_PATH" ]; then
  echo -e "${RED}❌ APK file not found: $DEVICEFARM_APP_PATH${NC}"
  echo "   Expected APK artifact from Bitrise build"
  exit 1
fi

APK_SIZE=$(ls -lh "$DEVICEFARM_APP_PATH" 2>/dev/null | awk '{print $5}' || echo "unknown")
echo -e "${GREEN}✅ Using APK from Bitrise build: $DEVICEFARM_APP_PATH (${APK_SIZE})${NC}\n"

# Change to core-mobile directory
cd "$CORE_MOBILE_DIR"

# Verify test package exists, create if needed
if [ ! -f "$DEVICEFARM_TEST_PACKAGE_PATH" ]; then
  echo -e "${YELLOW}⚠️  Test package not found. Packaging tests...${NC}"
  bash scripts/devicefarm/package-tests.sh
fi

# Verify test spec exists
if [ ! -f "$DEVICEFARM_TEST_SPEC_PATH" ]; then
  echo -e "${RED}❌ Test spec file not found: $DEVICEFARM_TEST_SPEC_PATH${NC}"
  exit 1
fi

# Install AWS SDK if needed
if [ ! -d "node_modules/@aws-sdk/client-device-farm" ]; then
  echo -e "${BLUE}📦 Installing AWS SDK for Device Farm...${NC}"
  npm install @aws-sdk/client-device-farm --no-save --silent
fi

# Export environment variables for the Node.js script
export DEVICEFARM_PROJECT_ARN
export DEVICEFARM_DEVICE_POOL_ARN
export DEVICEFARM_APP_PATH
export DEVICEFARM_TEST_PACKAGE_PATH
export DEVICEFARM_TEST_SPEC_PATH
export PLATFORM
export AWS_REGION
export AWS_DEFAULT_REGION="$AWS_REGION"

echo -e "${GREEN}✅ Configuration:${NC}"
echo "   Project ARN: $DEVICEFARM_PROJECT_ARN"
echo "   Device Pool ARN: $DEVICEFARM_DEVICE_POOL_ARN"
echo "   Platform: $PLATFORM"
echo "   App: $DEVICEFARM_APP_PATH"
echo "   Test Package: $DEVICEFARM_TEST_PACKAGE_PATH"
echo "   Test Spec: $DEVICEFARM_TEST_SPEC_PATH"
echo "   AWS Region: $AWS_REGION"
echo ""

# Trigger the test run
echo -e "${BLUE}🚀 Triggering Device Farm test run...${NC}\n"

if node "$SCRIPT_DIR/trigger-devicefarm-api.js"; then
  echo -e "\n${GREEN}✅ Device Farm test run triggered successfully!${NC}"
  echo -e "${BLUE}💡 Check the AWS Device Farm console for progress${NC}"
else
  EXIT_CODE=$?
  echo -e "\n${RED}❌ Device Farm test run failed with exit code: $EXIT_CODE${NC}"
  exit $EXIT_CODE
fi
