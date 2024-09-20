#!/bin/bash
set -e

# Get the value of a key
function getJsonVal () {
    python -c "import json,sys;sys.stdout.write(json.dumps(json.load(sys.stdin)$1))";
}

# Search for a value when key matches the provided condition
function searchJsonVal () {
    python -c "
import json, sys

# Load JSON data from stdin
data = json.load(sys.stdin)['data']

# Filter data based on the provided condition
filtered_data = [x for x in data if x.get('$1') == '$2']

# Print the filtered data as JSON
sys.stdout.write(json.dumps(filtered_data))
"
}

# Function to delete an existing file on Bitrise
function deleteExistingFile() {
    local access_token=$1
    local base_url=$2
    local bitrise_file_name=$3

    all_files=$(curl -X GET -H "Authorization: $access_token" "$base_url/generic-project-files") 
    existing_file_slug=$( echo $all_files | searchJsonVal "user_env_key" $bitrise_file_name | getJsonVal "[0]['slug']" | tr -d '"')
    if [ -n "$existing_file_slug" ]; then
        curl -X DELETE "$base_url/generic-project-files/$existing_file_slug" -H "Authorization: $access_token"
    fi
}

# Function to upload a file to Bitrise
function uploadFileToBitrise() {
    local access_token=$1
    local base_url=$2
    local file_name=$3
    local bitrise_file_name=$4

    # 1. Create a temporary pre-signed upload URL
    file_size=$(ls -l $file_name | awk '{print $5}')
    response_1=$(curl -H "Authorization: $access_token" -H "accept: application/json" -H "Content-Type: application/json" -d "{ \"upload_file_name\": \"$file_name\", \"upload_file_size\": $file_size, \"user_env_key\": \"$bitrise_file_name\"}" -X POST "$base_url/generic-project-files") 

    # 2. Upload the file to the pre-signed URL
    upload_url=$( echo $response_1 | getJsonVal "['data']['upload_url']" | tr -d '"' )
    curl -T $file_name $upload_url

    # 3. Confirm the file upload
    file_slug=$( echo $response_1 | getJsonVal "['data']['slug']" | tr -d '"' ) 
    curl -X POST -H "Authorization: $access_token" "$base_url/generic-project-files/$file_slug/uploaded"

    echo "File uploaded to Bitrise successfully"
}