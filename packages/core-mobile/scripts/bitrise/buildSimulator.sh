#!/usr/bin/env bash
set -euo pipefail

xcodebuild \
  -workspace "$IOS_PROJECT_PATH" \
  -scheme "$IOS_SCHEME" \
  -configuration "$IOS_CONFIGURATION" \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath "$BITRISE_DEPLOY_DIR/" \
  CODE_SIGNING_ALLOWED=YES \
  COMPILER_INDEX_STORE_ENABLE=NO \
  | xcpretty

APP_PATH="$BITRISE_DEPLOY_DIR/Build/Products/$IOS_CONFIGURATION-iphonesimulator/$IOS_SCHEME.app"

echo "Built app at: $APP_PATH"

# Export env
envman add --key BITRISE_APP_DIR_PATH --value "$APP_PATH"
envman add --key BITRISE_APP_DIR_PATH_LIST --value "$APP_PATH"

cd "$(dirname "$APP_PATH")"
zip -r "$BITRISE_DEPLOY_DIR/$IOS_SCHEME.app.zip" "$(basename "$APP_PATH")"
