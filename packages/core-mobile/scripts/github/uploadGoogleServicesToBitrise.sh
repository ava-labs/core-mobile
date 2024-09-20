#!/bin/bash
set -e

# Source the bitrise utils file
source ./scripts/common/bitriseUtils.sh

# Check if the correct number of parameters are provided
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <bitrise_access_token>"
    exit 1
fi

app_slug="7d7ca5af7066e290"
file_name="google-services-files.zip"
bitrise_file_name=GOOGLE_SERVICES_FILES
access_token=$1
base_url="https://api.bitrise.io/v0.1/apps/$app_slug"

# Delete existing file if it exists
deleteExistingFile "$access_token" "$base_url" "$bitrise_file_name"

# List of files to be included in the zip
files=(
  "google-services.json.internal"
  "GoogleService-Info.plist.internal"
  "google-services.json.external"
  "GoogleService-Info.plist.external"
)

# Compress the specified files into a single zip file
zip $file_name "${files[@]}"

# Upload the zip file to Bitrise
uploadFileToBitrise "$access_token" "$base_url" "$file_name" "$bitrise_file_name"