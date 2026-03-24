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

# If running locally and APK does not exist, download latest from Bitrise
if [ "$IS_LOCAL_RUN" = "true" ] && [ ! -f "$DEVICEFARM_APP_PATH" ]; then
  echo -e "${BLUE}📥 Running locally - APK not found, downloading latest internalE2E APK from Bitrise...${NC}"
  
  # Check for Bitrise credentials
  if [ -z "${BITRISE_APP_SLUG:-}" ]; then
    echo -e "${RED}❌ BITRISE_APP_SLUG required when APK is missing. Set it or build locally and set DEVICEFARM_APP_PATH.${NC}"
    exit 1
  fi
  
  if [ -z "${BITRISE_ARTIFACTS_TOKEN:-}" ]; then
    echo -e "${RED}❌ BITRISE_ARTIFACTS_TOKEN required when APK is missing. Get it from Bitrise Dashboard > Settings > API.${NC}"
    exit 1
  fi
  
  # Ensure output directory exists
  mkdir -p "$(dirname "$DEVICEFARM_APP_PATH")"
  
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
elif [ "$IS_LOCAL_RUN" = "true" ] && [ -f "$DEVICEFARM_APP_PATH" ]; then
  echo -e "${GREEN}✅ Using local APK: $DEVICEFARM_APP_PATH${NC}\n"
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

cd "$CORE_MOBILE_DIR"
# shellcheck source=ensure-client-device-farm.sh
if [[ ! -f "$SCRIPT_DIR/ensure-client-device-farm.sh" ]]; then
  echo -e "${RED}❌ Missing $SCRIPT_DIR/ensure-client-device-farm.sh (must be committed to git)${NC}"
  exit 1
fi
source "$SCRIPT_DIR/ensure-client-device-farm.sh"
ensure_client_device_farm

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
  cleanup_client_device_farm_tmp
  echo -e "\n${GREEN}✅ Device Farm test run triggered successfully!${NC}"
  echo -e "${BLUE}💡 Check the AWS Device Farm console for progress${NC}"
else
  EXIT_CODE=$?
  cleanup_client_device_farm_tmp
  echo -e "\n${RED}❌ Device Farm test run failed with exit code: $EXIT_CODE${NC}"
  exit $EXIT_CODE
fi
