#!/usr/bin/env bash
# fail if any commands fails
set -e
# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

if ! cat /etc/issue 2>/dev/null
then
    # do nothing
    :
else 
  stack=$( cat /etc/issue )
fi

# Check if the environment variable USE_SEEDLESS_GAMMA is set to "true"
if [ "$USE_SEEDLESS_GAMMA" = "true" ]; then

    # Loop through the fields to replace
    for field in "SEEDLESS_URL" "SEEDLESS_API_KEY" "SEEDLESS_ORG_ID" "SEEDLESS_ENVIRONMENT" "GOOGLE_OAUTH_CLIENT_WEB_ID" "GOOGLE_OAUTH_CLIENT_IOS_ID" "APPLE_OAUTH_CLIENT_ID" "APPLE_OAUTH_REDIRECT_URL"; do

        # Read the corresponding value from .env.development
        value=$(awk -F '=' -v field="$field" '$1 == field {print substr($0, length(field)+2)}' .env.development)

        # Check if the value is not empty (found in .env.development)
        if [ -n "$value" ]; then

            # Replace the value in .env
            if [[ $stack == *Ubuntu* ]]
            then
                # on ubuntu, the command doesn't need the empty string extension
                sed -i -e "s|$field=.*|$field=$value|g" ".env"
            else
                sed -i '' -e "s|$field=.*|$field=$value|g" ".env"
            fi
           
        fi

    done
    
fi


