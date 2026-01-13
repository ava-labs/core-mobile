#!/usr/bin/env bash
set -euo pipefail

# Script to upload and run tests on AWS Device Farm
# Requires AWS CLI and proper credentials configured

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
CORE_MOBILE_DIR="$PROJECT_ROOT/packages/core-mobile"
ZIP_FILE="$CORE_MOBILE_DIR/e2e-appium/appium-tests-devicefarm.zip"

# Configuration - update these values
PROJECT_ARN="${DEVICEFARM_PROJECT_ARN:-}"
DEVICE_POOL_ARN="${DEVICEFARM_DEVICE_POOL_ARN:-}"
APP_PATH="${DEVICEFARM_APP_PATH:-}"  # Path to .apk or .ipa file
PLATFORM="${PLATFORM:-android}"  # android or ios

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
if ! command -v aws &> /dev/null; then
  echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
  exit 1
fi

if ! command -v jq &> /dev/null; then
  echo -e "${YELLOW}⚠️  jq not found. Installing via brew or using alternative method...${NC}"
  if command -v brew &> /dev/null; then
    brew install jq
  else
    echo -e "${RED}❌ jq is required. Please install it: https://stedolan.github.io/jq/download/${NC}"
    exit 1
  fi
fi

if [ -z "$PROJECT_ARN" ]; then
  echo -e "${YELLOW}⚠️  DEVICEFARM_PROJECT_ARN not set. Please set it or provide as argument.${NC}"
  echo "Usage: DEVICEFARM_PROJECT_ARN=arn:... DEVICEFARM_DEVICE_POOL_ARN=arn:... DEVICEFARM_APP_PATH=path/to/app.apk ./run-devicefarm.sh"
  exit 1
fi

if [ -z "$DEVICE_POOL_ARN" ]; then
  echo -e "${YELLOW}⚠️  DEVICEFARM_DEVICE_POOL_ARN not set.${NC}"
  exit 1
fi

if [ ! -f "$APP_PATH" ]; then
  echo -e "${RED}❌ App file not found: $APP_PATH${NC}"
  exit 1
fi

if [ ! -f "$ZIP_FILE" ]; then
  echo -e "${YELLOW}⚠️  Test package not found. Creating it now...${NC}"
  "$SCRIPT_DIR/package-tests.sh"
fi

echo -e "${GREEN}🚀 Uploading and running tests on AWS Device Farm...${NC}"
echo "Project ARN: $PROJECT_ARN"
echo "Device Pool ARN: $DEVICE_POOL_ARN"
echo "Platform: $PLATFORM"
echo "App: $APP_PATH"
echo "Test Package: $ZIP_FILE"

# Upload app
echo -e "${GREEN}📤 Uploading app...${NC}"
APP_UPLOAD_OUTPUT=$(aws devicefarm create-upload \
  --project-arn "$PROJECT_ARN" \
  --name "$(basename "$APP_PATH")" \
  --type "$([ "$PLATFORM" = "android" ] && echo "ANDROID_APP" || echo "IOS_APP")" \
  --output json)

APP_UPLOAD_ARN=$(echo "$APP_UPLOAD_OUTPUT" | jq -r '.upload.arn')
APP_UPLOAD_URL=$(echo "$APP_UPLOAD_OUTPUT" | jq -r '.upload.url')

echo "App Upload ARN: $APP_UPLOAD_ARN"
echo "Uploading app to: $APP_UPLOAD_URL"

curl -T "$APP_PATH" "$APP_UPLOAD_URL"

# Wait for app upload to complete
echo -e "${GREEN}⏳ Waiting for app upload to complete...${NC}"
while true; do
  STATUS=$(aws devicefarm get-upload --arn "$APP_UPLOAD_ARN" --output json | jq -r '.upload.status')
  echo "App upload status: $STATUS"
  if [ "$STATUS" = "SUCCEEDED" ]; then
    break
  elif [ "$STATUS" = "FAILED" ]; then
    echo -e "${RED}❌ App upload failed${NC}"
    exit 1
  fi
  sleep 5
done

# Upload test package
echo -e "${GREEN}📤 Uploading test package...${NC}"
TEST_UPLOAD_OUTPUT=$(aws devicefarm create-upload \
  --project-arn "$PROJECT_ARN" \
  --name "appium-tests.zip" \
  --type "APPIUM_NODE_TEST_PACKAGE" \
  --output json)

TEST_UPLOAD_ARN=$(echo "$TEST_UPLOAD_OUTPUT" | jq -r '.upload.arn')
TEST_UPLOAD_URL=$(echo "$TEST_UPLOAD_OUTPUT" | jq -r '.upload.url')

echo "Test Upload ARN: $TEST_UPLOAD_ARN"
echo "Uploading test package to: $TEST_UPLOAD_URL"

curl -T "$ZIP_FILE" "$TEST_UPLOAD_URL"

# Wait for test upload to complete
echo -e "${GREEN}⏳ Waiting for test package upload to complete...${NC}"
while true; do
  STATUS=$(aws devicefarm get-upload --arn "$TEST_UPLOAD_ARN" --output json | jq -r '.upload.status')
  echo "Test upload status: $STATUS"
  if [ "$STATUS" = "SUCCEEDED" ]; then
    break
  elif [ "$STATUS" = "FAILED" ]; then
    echo -e "${RED}❌ Test package upload failed${NC}"
    exit 1
  fi
  sleep 5
done

# Upload test spec file (aws_test_spec.yaml)
echo -e "${GREEN}📤 Uploading test spec file...${NC}"
TEST_SPEC_PATH="$CORE_MOBILE_DIR/e2e-appium/aws_test_spec.yaml"
if [ ! -f "$TEST_SPEC_PATH" ]; then
  echo -e "${RED}❌ Test spec file not found: $TEST_SPEC_PATH${NC}"
  exit 1
fi

TEST_SPEC_UPLOAD_OUTPUT=$(aws devicefarm create-upload \
  --project-arn "$PROJECT_ARN" \
  --name "aws_test_spec.yaml" \
  --type "APPIUM_NODE_TEST_SPEC" \
  --output json)

TEST_SPEC_UPLOAD_ARN=$(echo "$TEST_SPEC_UPLOAD_OUTPUT" | jq -r '.upload.arn')
TEST_SPEC_UPLOAD_URL=$(echo "$TEST_SPEC_UPLOAD_OUTPUT" | jq -r '.upload.url')

echo "Test Spec Upload ARN: $TEST_SPEC_UPLOAD_ARN"
echo "Uploading test spec to: $TEST_SPEC_UPLOAD_URL"

curl -T "$TEST_SPEC_PATH" "$TEST_SPEC_UPLOAD_URL"

# Wait for test spec upload to complete
echo -e "${GREEN}⏳ Waiting for test spec upload to complete...${NC}"
while true; do
  STATUS=$(aws devicefarm get-upload --arn "$TEST_SPEC_UPLOAD_ARN" --output json | jq -r '.upload.status')
  echo "Test spec upload status: $STATUS"
  if [ "$STATUS" = "SUCCEEDED" ]; then
    break
  elif [ "$STATUS" = "FAILED" ]; then
    echo -e "${RED}❌ Test spec upload failed${NC}"
    exit 1
  fi
  sleep 5
done

# Schedule test run
echo -e "${GREEN}📅 Scheduling test run...${NC}"
RUN_NAME="Appium Test Run - $(date +%Y-%m-%d-%H-%M-%S)"

# Create test spec file that references both the test package and test spec
TEST_SPEC_FILE=$(mktemp)
cat > "$TEST_SPEC_FILE" <<EOF
{
  "type": "APPIUM_NODE",
  "testPackageArn": "$TEST_UPLOAD_ARN",
  "testSpecArn": "$TEST_SPEC_UPLOAD_ARN"
}
EOF

RUN_OUTPUT=$(aws devicefarm schedule-run \
  --project-arn "$PROJECT_ARN" \
  --app-arn "$APP_UPLOAD_ARN" \
  --device-pool-arn "$DEVICE_POOL_ARN" \
  --name "$RUN_NAME" \
  --test file://"$TEST_SPEC_FILE" \
  --output json)

rm -f "$TEST_SPEC_FILE"

RUN_ARN=$(echo "$RUN_OUTPUT" | jq -r '.run.arn')
RUN_URL="https://console.aws.amazon.com/devicefarm/home?region=us-west-2#/projects/$PROJECT_ARN/runs/$RUN_ARN"

echo -e "${GREEN}✅ Test run scheduled!${NC}"
echo "Run ARN: $RUN_ARN"
echo "View run at: $RUN_URL"

# Optionally wait for test completion
if [ "${WAIT_FOR_COMPLETION:-false}" = "true" ]; then
  echo -e "${GREEN}⏳ Waiting for test run to complete...${NC}"
  while true; do
    STATUS=$(aws devicefarm get-run --arn "$RUN_ARN" --output json | jq -r '.run.status')
    echo "Test run status: $STATUS"
    if [ "$STATUS" = "COMPLETED" ] || [ "$STATUS" = "ERRORED" ] || [ "$STATUS" = "STOPPED" ]; then
      break
    fi
    sleep 30
  done
  
  # Get results
  RESULT=$(aws devicefarm get-run --arn "$RUN_ARN" --output json)
  RESULT_STATUS=$(echo "$RESULT" | jq -r '.run.result')
  echo -e "${GREEN}📊 Test run completed with result: $RESULT_STATUS${NC}"
fi

