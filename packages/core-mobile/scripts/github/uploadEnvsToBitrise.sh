#!/bin/bash
set -e

# Source the bitrise utils file
source ../common/bitriseUtils.sh

# Check if the correct number of parameters are provided
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <bitrise_access_token>"
    exit 1
fi

app_slug="7d7ca5af7066e290"
file_name="env-files.zip"
bitrise_file_name=ENV_FILES
access_token=$1
base_url="https://api.bitrise.io/v0.1/apps/$app_slug"

# Delete existing file if it exists
deleteExistingFile "$access_token" "$base_url" "$bitrise_file_name"

# Compress all env files into a single zip file
zip $file_name .env.*

# Upload the zip file to Bitrise
uploadFileToBitrise "$access_token" "$base_url" "$file_name" "$bitrise_file_name"