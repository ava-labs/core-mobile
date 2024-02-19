#!/bin/bash

# Retrieve secret by id from AWS Secrets Manager
getSecretFromAWS() {
    local secret_id="$1"
    sudo aws secretsmanager get-secret-value --secret-id "$secret_id" | grep SecretString | sed 's/.*"SecretString": "\(.*\)".*/\1/'
}

# Check if a AWS profile exists
awsConfigurationExists() {
    local profile_name="${1}"
    local profile_status=$( (sudo aws configure --profile ${1} list) 2>&1)

    if [[ $profile_status = *'could not be found'* ]]; then
        return 1
    else
        return 0
    fi
}

# Check if profile "default" exists. If not, ask to create one
if ! $(awsConfigurationExists "default"); then
    echo 'Profile "default" does not exist. Please create one first!'
    sudo aws configure sso
fi

# Check if the session is still valid. If not, ask to re-login
ACCOUNT=$(sudo aws sts get-caller-identity --query "Account")

# Account is valid if account is a 12 digit account number plus surrounding double-quotes
if [ ${#ACCOUNT} -ne 14 ]; then
    echo 'logging in with profile "default"'
    sudo aws sso login --profile default
fi

# Retrieve all envs from AWS
echo "retrieving envs from AWS Secrets Manager..."
ENV_DEV=$(getSecretFromAWS "core/dev/mobile/.env.development")
ENV_DEV_E2E=$(getSecretFromAWS "core/dev/mobile/.env.development.e2e")
ENV_PROD=$(getSecretFromAWS "core/dev/mobile/.env.production")
ENV_PROD_E2E=$(getSecretFromAWS "core/dev/mobile/.env.production.e2e")

# Write to .env files
./scripts/common/writeEnvsToFile.sh "$ENV_DEV" ".env.development"
./scripts/common/writeEnvsToFile.sh "$ENV_DEV_E2E" ".env.development.e2e"
./scripts/common/writeEnvsToFile.sh "$ENV_PROD" ".env.production"
./scripts/common/writeEnvsToFile.sh "$ENV_PROD_E2E" ".env.production.e2e"

# Use .env.development as the default
cp .env.development .env
echo ".env.development copied to .env"
echo "envs successfully retrieved and saved 🥳"
