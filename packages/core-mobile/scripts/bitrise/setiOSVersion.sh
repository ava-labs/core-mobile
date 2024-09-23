#!/usr/bin/env bash
set -e

if [ -z "$APP_VERSION" ]; then
    echo "Error: APP_VERSION is not set. Please set it globally before running this script."
    exit 1
fi

if [ -z "$BUILD_NUMBER" ]; then
    echo "Error: BUILD_NUMBER is not set. Please set it globally before running this script."
    exit 1
fi

# Update the build number (CURRENT_PROJECT_VERSION)
xcrun agvtool new-version -all $BUILD_NUMBER

# Update the version number (MARKETING_VERSION)
xcrun agvtool new-marketing-version $APP_VERSION

echo "Updated build number to: $BUILD_NUMBER"
echo "Updated version to: $APP_VERSION"