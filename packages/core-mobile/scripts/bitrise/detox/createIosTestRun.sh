#!/bin/bash

set -e

TIMESTAMP=$(date +%s)

TEST_RUN_NAME="iOS Smoke Test run $BITRISE_GIT_BRANCH $TIMESTAMP"

echo 'Creating new iOS test run...'

# Create a JSON object with the test run name and store in JSON_DATA to be passed to the TestRail API
JSON_DATA=$(jq -n --arg test_name "$TEST_RUN_NAME" \
            '{name: $test_name, include_all: false}'
) 

# Create a new test run and store the details in TEST_RUN_DETAILS
TEST_RUN_DETAILS=$(curl -H "Content-Type: application/json" \
-u "mobiledevs@avalabs.org:$TESTRAIL_API_KEY" \
-d "${JSON_DATA}" \
-X POST "https://avalabs.testrail.net/index.php?/api/v2/add_run/3")

# Extract the test run id from the details and store in TESTRAIL_RUN_ID
IOS_TESTRAIL_RUN_ID=$(jq -r ".id" <<< "$TEST_RUN_DETAILS")

echo "Test run id: $IOS_TESTRAIL_RUN_ID"

envman add --key TESTRAIL_RUN_ID --value "$IOS_TESTRAIL_RUN_ID"