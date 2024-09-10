#!/bin/bash
# Source the AWS utilities script
source ./scripts/common/awsUtils.sh

# Ensure AWS session is valid
ensureAwsSession

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
