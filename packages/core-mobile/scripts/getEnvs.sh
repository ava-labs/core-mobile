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
ENV_INTERNAL=$(getSecretFromAWS "core/dev/mobile/.env.internal")
ENV_INTERNAL_E2E=$(getSecretFromAWS "core/dev/mobile/.env.internal.e2e")

# Write to .env files
./scripts/common/writeEnvsToFile.sh "$ENV_DEV" ".env.development"
./scripts/common/writeEnvsToFile.sh "$ENV_DEV_E2E" ".env.development.e2e"
./scripts/common/writeEnvsToFile.sh "$ENV_PROD" ".env.production"
./scripts/common/writeEnvsToFile.sh "$ENV_PROD_E2E" ".env.production.e2e"
./scripts/common/writeEnvsToFile.sh "$ENV_INTERNAL" ".env.internal"
./scripts/common/writeEnvsToFile.sh "$ENV_INTERNAL_E2E" ".env.internal.e2e"

# Write to xcconfig files
./scripts/common/writeEnvsToXcConfig.sh "$ENV_PROD" "ios/Release.xcconfig" "BRANCH_KEY"
./scripts/common/writeEnvsToXcConfig.sh "$ENV_INTERNAL" "ios/Debug.xcconfig" "BRANCH_KEY"

# Use .env.development as the default
cp .env.development .env
echo ".env.development copied to .env"
echo "envs successfully retrieved and saved 🥳"
