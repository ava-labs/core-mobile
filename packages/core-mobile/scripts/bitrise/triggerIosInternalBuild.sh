
# Gets the builds that are currently in progress
BUILDS_IN_PROGRESS=$(
  curl -X 'GET' \
  "https://api.bitrise.io/v0.1/apps/$BITRISE_APP_SLUG/builds?status=0" \
  -H 'accept: application/json' \
  -H "Authorization: $BITRISE_ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
  \"build_params\": {
    \"branch\": \"$BITRISE_GIT_BRANCH\",
    \"pipeline_id\": \"build-ios-apps-internal-triggered-e2e\",
    \"commit_message\": \"No commit message\",
  },
  \"hook_info\": {
    \"type\": \"bitrise\"
  }
}"
)

# Parses the first two builds in progress for their build numbers. 
# If the builds are triggered in the same workflow then the build numbers will be the same and we don't need to trigger the ios build
# If the build numbers are different then we can trigger the ios build
build_number=$( jq -r '.data[0].build_number' <<< "$BUILDS_IN_PROGRESS" )
build_number_two=$( jq -r '.data[1].build_number' <<< "$BUILDS_IN_PROGRESS" )

if [[ "$build_number" != "$build_number_two" ]]; then
  echo "start the ios build"

  PIPELINE=$(
  curl -X 'POST' \
  "https://api.bitrise.io/v0.1/apps/$BITRISE_APP_SLUG/builds" \
  -H 'accept: application/json' \
  -H "Authorization: $BITRISE_ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{
  \"build_params\": {
    \"branch\": \"$BITRISE_GIT_BRANCH\",
    \"pipeline_id\": \"build-ios-apps-internal-triggered-e2e\",
    \"commit_message\": \"No commit message\",
  },
  \"hook_info\": {
    \"type\": \"bitrise\"
  }
}"
else
  echo "Build already in progress"
fi




