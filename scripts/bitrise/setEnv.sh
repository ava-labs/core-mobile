#!/usr/bin/env bash
set -ex

# grab the correct env file based on ENVIRONMENT and E2E env vars
if [ "$ENVIRONMENT" = "production" ]; then
    if [ "$E2E" = "true" ]; then
        cp .env.production.e2e .env
    else
        cp .env.production .env
    fi
elif [ "$ENVIRONMENT" = "development" ]; then
    cp .env.development .env
else
    cp .env.production .env
fi