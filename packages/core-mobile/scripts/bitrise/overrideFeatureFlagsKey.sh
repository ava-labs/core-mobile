#!/usr/bin/env bash
# fail if any commands fails
set -e
# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail
# debug log
set -x

# Check if the environment variable USE_TEST_FEATURE_FLAGS is set to "true"
if [ "$USE_TEST_FEATURE_FLAGS" = "true" ]; then

    # Read the value of POSTHOG_FEATURE_FLAGS_KEY from .env.development file
    feature_flags_key=$(grep '^POSTHOG_FEATURE_FLAGS_KEY=' .env.development | cut -d '=' -f2)

    # Check if the value is not empty (found in .env.development)
    if [ -n "$feature_flags_key" ]; then
        # Create a temporary file for the in-place edit
        temp_file=$(mktemp)

        # Replace the value of POSTHOG_FEATURE_FLAGS_KEY in the .env file and save it in the temporary file
        sed "s/^POSTHOG_FEATURE_FLAGS_KEY=.*/POSTHOG_FEATURE_FLAGS_KEY=$feature_flags_key/" .env > "$temp_file"

        # Replace the original .env file with the modified temporary file
        mv "$temp_file" .env

        echo "Updated POSTHOG_FEATURE_FLAGS_KEY in .env"
    else
        echo "POSTHOG_FEATURE_FLAGS_KEY not found in .env.development or is empty."
    fi
    
fi
