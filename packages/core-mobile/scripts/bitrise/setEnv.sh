#!/usr/bin/env bash
set -ex

# grab the correct env file
if [ "$ENVIRONMENT" = "production" ]; then
    if [ "$APP_TITLE" = "Core Mobile Internal" ]; then
        PREFIX=".env.internal"
    else
        PREFIX=".env.production"
    fi

    if [ "$E2E" = "true" ]; then
        cp "$PREFIX.e2e" .env
    else
        cp "$PREFIX" .env
    fi
elif [ "$ENVIRONMENT" = "development" ]; then
    cp .env.development .env
else
    cp .env.production .env
fi

if [ "$APP_TITLE" = "Core Mobile Internal" ]; then
    echo "using internal Google services files"
    if [ "$PLATFORM" = "Android" ]; then
        cp './google-services-files/google-services.json.internal' android/app/google-services.json
    else
        cp './google-services-files/GoogleService-Info.plist.internal' ios/GoogleService-Info.plist
    fi
else
    echo "using external Google services files"
    if [ "$PLATFORM" = "Android" ]; then
        cp google-services.json.external android/app/google-services.json
    else
        cp GoogleService-Info.plist.external ios/GoogleService-Info.plist
    fi
fi