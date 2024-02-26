#!/bin/bash
set -e

# Check if the correct number of parameters are provided
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <env_var> <output_filename>"
    exit 1
fi

# Retrieve the env value and assign it to the data variable
data=$1

output_file=$2 

# Check if the secret value is empty
if [ -z "$data" ]; then
    echo "Error: Failed to retrieve secret value"
    exit 1
fi

# Parse the string to extract key-value pairs
pairs=$(echo "$data" | sed 's/[{}"]//g' | tr ',' '\n' | sed 's/:/=/')

# Erase the content of the output file
> "$output_file"

# Write the key-value pairs to the output file
echo "$pairs" | while IFS= read -r line; do
    echo "$line" | sed 's/\\//g' >> "$output_file"
done

echo "envs saved to $output_file"