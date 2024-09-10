#!/bin/bash

# AWS profile name
PROFILE_NAME="sso"

# Function to check if an AWS profile exists
awsConfigurationExists() {
    local profile_name="$1"
    local profile_status=$( (sudo aws configure --profile "$profile_name" list) 2>&1)

    if [[ $profile_status == *'could not be found'* ]]; then
        return 1
    else
        return 0
    fi
}

# Function to retrieve secret by ID from AWS Secrets Manager
getSecretFromAWS() {
    local secret_id="$1"
    sudo aws --profile $PROFILE_NAME secretsmanager get-secret-value --secret-id "$secret_id" | grep SecretString | sed 's/.*"SecretString": "\(.*\)".*/\1/'
}

# Function to check if AWS session is still valid
ensureAwsSession() {
    # Check if profile exists
    if ! awsConfigurationExists "$PROFILE_NAME"; then
        echo "Profile '$PROFILE_NAME' does not exist. Please create one first!"
        sudo aws configure sso --profile "$PROFILE_NAME"
    fi

    # Check if session is valid
    ACCOUNT=$(sudo aws --profile "$PROFILE_NAME" sts get-caller-identity --query "Account" --output text)

    # Account is valid if account is a 12 digit number
    if [[ ${#ACCOUNT} -ne 12 ]]; then
        echo "Logging in with profile '$PROFILE_NAME'"
        sudo aws sso login --profile "$PROFILE_NAME"
    fi
}