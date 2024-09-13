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
    \"commit_message\": \"$GIT_CLONE_COMMIT_MESSAGE_SUBJECT\"
  },
  \"hook_info\": {
    \"type\": \"bitrise\"
  }
}"
)

echo "$PIPELINE"