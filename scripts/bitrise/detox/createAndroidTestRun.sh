#!/bin/bash

set -e

TIMESTAMP=$(date +%s)

TEST_RUN_NAME="Android Smoke Test run $TIMESTAMP"

echo 'Creating new android test run...'

JSON_DATA=$(jq -n --arg test_name "$TEST_RUN_NAME" \
            '{name: $test_name, include_all: false}'
) 

echo "JSON data: $JSON_DATA"

TEST_RUN_DETAILS=$(curl -H "Content-Type: application/json" \
-u "mobiledevs@avalabs.org:$TESTRAIL_API_KEY" \
-d "${JSON_DATA}" \
-X POST "https://avalabs.testrail.net/index.php?/api/v2/add_run/3")

echo "Test run details: $TEST_RUN_DETAILS"

TESTRAIL_RUN_ID=$(jq -r ".id" <<< "$TEST_RUN_DETAILS")

envman add --key TESTRAIL_RUN --value $TESTRAIL_RUN_ID

echo "Created test run with id: $TESTRAIL_RUN"

