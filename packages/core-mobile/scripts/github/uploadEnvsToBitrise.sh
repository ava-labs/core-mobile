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

# get all generic profile files
# if the bitrise_file_name already exists, delete it
all_files=$(curl -X GET -H "Authorization: $access_token" "$base_url/generic-project-files") 
existing_file_slug=$( echo $all_files | searchJsonVal "user_env_key" $bitrise_file_name | getJsonVal "[0]['slug']" | tr -d '"')
curl -X DELETE "$base_url/generic-project-files/$existing_file_slug" -H "Authorization: $access_token"

# compress all env files into a single zip file
zip $file_name .env.*

# upload the zip file to bitrise https://devcenter.bitrise.io/en/api/managing-files-in-generic-file-storage.html

# 1. create a temporary pre-signed upload URL
file_size=$(ls -l $file_name | awk '{print $5}')
response_1=$(curl -H "Authorization: $access_token" -H "accept: application/json" -H "Content-Type: application/json" -d "{ \"upload_file_name\": \"$file_name\", \"upload_file_size\": $file_size, \"user_env_key\": \"$bitrise_file_name\"}" -X POST "$base_url/generic-project-files") 

# 2. upload the file to the pre-signed URL
upload_url=$( echo $response_1 | getJsonVal "['data']['upload_url']" | tr -d '"' )

curl -T $file_name $upload_url

# 3. confirm the file upload
file_slug=$( echo $response_1 | getJsonVal "['data']['slug']" | tr -d '"' ) 
curl -X POST -H "Authorization: $access_token" "$base_url/generic-project-files/$file_slug/uploaded"

echo "envs uploaded to bitrise successfully"