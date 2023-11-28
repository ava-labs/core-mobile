PIPELINE=$(
  curl -X 'POST' \
  "https://api.bitrise.io/v0.1/apps/$BITRISE_APP_SLUG/builds" \
  -H 'accept: application/json' \
  -H "Authorization: $BITRISE_ACCESS_TOKEN"\
  -H 'Content-Type: application/json' \
  -d '{
  "build_params": {
    "branch": "development",
    "pipeline_id": "build-ios-apps-internal-e2e"
  },
  "hook_info": {
    "type": "bitrise"
  }
}'
)

echo $PIPELINE