#!/bin/bash
require 'jq'
require 'date'

TIMESTAMP=$(date +%s)

TEST_RUN_NAME="Android Smoke Test run $TIMESTAMP"

echo 'Creating new android test run...'

JSON_DATA=$(jq -n --arg test_name "$TEST_RUN_NAME" '{name: $test_name}')

TEST_RUN_DETAILS=$(curl -H "Content-Type: application/json" \
-u "mobiledevs@avalabs.org:$TESTRAIL_API_KEY" \
-d "$JSON_DATA" \
-X POST "https://avalabs.testrail.net/index.php?/api/v2/add_run/$TESTRAIL_PROJECT_ID")

TESTRAIL_RUN_ID="$TEST_RUN_DETAILS" | jq -r '.id'

envman add --key TESTRAIL_RUN --value $TESTRAIL_RUN_ID
