#!/bin/bash
# Source the AWS utilities script
source ./scripts/common/awsUtils.sh

# Ensure AWS session is valid
ensureAwsSession

# Function to download and save a secret
download_and_save_secret() {
  local secret_key=$1
  local output_file=$2
  local format=$3

  # Retrieve the secret from AWS
  secret_value=$(getSecretFromAWS "$secret_key")

  # Unescape JSON or Plist based on format
  if [ "$format" == "json" ]; then
    unescaped_value=$(echo "$secret_value" | sed 's/\\n/\n/g' | sed 's/\\"/"/g' | sed 's/\\\\/\\/g')
  elif [ "$format" == "plist" ]; then
    unescaped_value=$(echo "$secret_value" | sed 's/\\t/\t/g' | sed 's/\\n/\n/g' | sed 's/\\"/"/g' | sed 's/\\\\/\\/g')
  else
    echo "unsupported format: $format"
    return 1
  fi

  # Write to the output file
  echo "$unescaped_value" > "$output_file"
  echo "saved to $output_file"
}

# Retrieve all google services files from AWS
echo "retrieving Google services files from AWS Secrets Manager..."

# Download and save Google services files
download_and_save_secret "core/dev/mobile/android/internal/google-services.json" "google-services.json.internal" "json"
download_and_save_secret "core/dev/mobile/ios/internal/GoogleService-Info.plist" "GoogleService-Info.plist.internal" "plist"
download_and_save_secret "core/dev/mobile/android/prod/google-services.json" "google-services.json.external" "json"
download_and_save_secret "core/dev/mobile/ios/prod/GoogleService-Info.plist" "GoogleService-Info.plist.external" "plist"

cp google-services.json.internal android/app/google-services.json
cp GoogleService-Info.plist.internal ios/GoogleService-Info.plist
echo "using internal Google services files as the default"
echo "Google services files successfully retrieved and saved 🥳"