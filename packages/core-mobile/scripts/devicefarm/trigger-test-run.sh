#!/usr/bin/env bash
set -euo pipefail

# Script to trigger AWS Device Farm test run
# This script packages tests and triggers Device Farm using the Node.js API script
# When running locally, it automatically downloads the latest internalE2E APK from Bitrise
#
# Usage:
#   ./trigger-test-run.sh [--branch BRANCH_NAME]
#
# Options:
#   --branch BRANCH_NAME  Specify a branch to download the APK from (local runs only)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CORE_MOBILE_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
BRANCH_FILTER=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --branch)
      BRANCH_FILTER="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}❌ Unknown option: $1${NC}"
      echo "Usage: $0 [--branch BRANCH_NAME]"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}🚀 Triggering AWS Device Farm Test Run${NC}\n"
if [ -n "$BRANCH_FILTER" ]; then
  echo -e "${BLUE}🌿 Branch filter: ${BRANCH_FILTER}${NC}\n"
fi

# Check required environment variables
if [ -z "${DEVICEFARM_PROJECT_ARN:-}" ]; then
  echo -e "${RED}❌ DEVICEFARM_PROJECT_ARN environment variable is required${NC}"
  echo "   Set it with: export DEVICEFARM_PROJECT_ARN=\"arn:aws:devicefarm:us-west-2:...\""
  exit 1
fi

if [ -z "${DEVICEFARM_DEVICE_POOL_ARN:-}" ]; then
  echo -e "${RED}❌ DEVICEFARM_DEVICE_POOL_ARN environment variable is required${NC}"
  echo "   Set it with: export DEVICEFARM_DEVICE_POOL_ARN=\"arn:aws:devicefarm:us-west-2:...\""
  exit 1
fi

# Set defaults for optional variables
DEVICEFARM_APP_PATH="${DEVICEFARM_APP_PATH:-$CORE_MOBILE_DIR/android/app/build/outputs/apk/internal/e2e/app-internal-e2e.apk}"
DEVICEFARM_TEST_PACKAGE_PATH="${DEVICEFARM_TEST_PACKAGE_PATH:-$CORE_MOBILE_DIR/e2e-appium/appium-tests-devicefarm.zip}"
DEVICEFARM_TEST_SPEC_PATH="${DEVICEFARM_TEST_SPEC_PATH:-$CORE_MOBILE_DIR/e2e-appium/aws_test_spec.yaml}"
PLATFORM="${PLATFORM:-android}"
AWS_REGION="${AWS_REGION:-us-west-2}"

# Check if running locally (not on Device Farm)
# Device Farm sets AWS_DEVICE_FARM_APPIUM_SERVER_URL
IS_LOCAL_RUN="${IS_LOCAL_RUN:-}"
if [ -z "${AWS_DEVICE_FARM_APPIUM_SERVER_URL:-}" ]; then
  IS_LOCAL_RUN="true"
fi

# If running locally, download latest APK from Bitrise
if [ "$IS_LOCAL_RUN" = "true" ]; then
  echo -e "${BLUE}📥 Running locally - downloading latest internalE2E APK from Bitrise...${NC}"
  
  # Check for Bitrise credentials
  if [ -z "${BITRISE_APP_SLUG:-}" ]; then
    echo -e "${RED}❌ BITRISE_APP_SLUG environment variable is required for local runs${NC}"
    echo "   Set it with: export BITRISE_APP_SLUG=\"your-app-slug\""
    exit 1
  fi
  
  if [ -z "${BITRISE_ARTIFACTS_TOKEN:-}" ]; then
    echo -e "${RED}❌ BITRISE_ARTIFACTS_TOKEN environment variable is required for local runs${NC}"
    echo "   Get it from: Bitrise Dashboard > Settings > API > Artifacts Access Token"
    exit 1
  fi
  
  # Ensure output directory exists
  mkdir -p "$(dirname "$DEVICEFARM_APP_PATH")"
  
  # Download the latest internalE2E APK (buildIndex 0 = latest)
  # If branch filter is specified, pass it as the 4th argument
  cd "$CORE_MOBILE_DIR"
  if [ -n "$BRANCH_FILTER" ]; then
    echo -e "${BLUE}   Filtering by branch: ${BRANCH_FILTER}${NC}"
    if node "$SCRIPT_DIR/download-bitrise-apk.js" e2e 0 "$DEVICEFARM_APP_PATH" "$BRANCH_FILTER"; then
      APK_SIZE=$(ls -lh "$DEVICEFARM_APP_PATH" 2>/dev/null | awk '{print $5}' || echo "unknown")
      echo -e "${GREEN}✅ Downloaded APK from branch '${BRANCH_FILTER}': $DEVICEFARM_APP_PATH (${APK_SIZE})${NC}\n"
    else
      echo -e "${RED}❌ Failed to download APK from Bitrise (branch: ${BRANCH_FILTER})${NC}"
      exit 1
    fi
  else
    if node "$SCRIPT_DIR/download-bitrise-apk.js" e2e 0 "$DEVICEFARM_APP_PATH"; then
      APK_SIZE=$(ls -lh "$DEVICEFARM_APP_PATH" 2>/dev/null | awk '{print $5}' || echo "unknown")
      echo -e "${GREEN}✅ Downloaded APK: $DEVICEFARM_APP_PATH (${APK_SIZE})${NC}\n"
    else
      echo -e "${RED}❌ Failed to download APK from Bitrise${NC}"
      exit 1
    fi
  fi
fi

# Verify APK exists
if [ ! -f "$DEVICEFARM_APP_PATH" ]; then
  echo -e "${RED}❌ APK file not found: $DEVICEFARM_APP_PATH${NC}"
  exit 1
fi

# Verify test package exists
if [ ! -f "$DEVICEFARM_TEST_PACKAGE_PATH" ]; then
  echo -e "${YELLOW}⚠️  Test package not found. Packaging tests...${NC}"
  cd "$CORE_MOBILE_DIR"
  bash scripts/devicefarm/package-tests.sh
fi

# Verify test spec exists
if [ ! -f "$DEVICEFARM_TEST_SPEC_PATH" ]; then
  echo -e "${RED}❌ Test spec file not found: $DEVICEFARM_TEST_SPEC_PATH${NC}"
  exit 1
fi

# Install AWS SDK if needed
cd "$CORE_MOBILE_DIR"
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

echo -e "${GREEN}✅ Configuration:${NC}"
echo "   Project ARN: $DEVICEFARM_PROJECT_ARN"
echo "   Device Pool ARN: $DEVICEFARM_DEVICE_POOL_ARN"
echo "   Platform: $PLATFORM"
echo "   App: $DEVICEFARM_APP_PATH"
echo "   Test Package: $DEVICEFARM_TEST_PACKAGE_PATH"
echo "   Test Spec: $DEVICEFARM_TEST_SPEC_PATH"
echo ""

# Trigger the test run
echo -e "${BLUE}🚀 Triggering Device Farm test run...${NC}\n"
cd "$CORE_MOBILE_DIR"

if node "$SCRIPT_DIR/trigger-devicefarm-api.js"; then
  echo -e "\n${GREEN}✅ Device Farm test run triggered successfully!${NC}"
  echo -e "${BLUE}💡 Check the AWS Device Farm console for progress${NC}"
else
  EXIT_CODE=$?
  echo -e "\n${RED}❌ Device Farm test run failed with exit code: $EXIT_CODE${NC}"
  exit $EXIT_CODE
fi
