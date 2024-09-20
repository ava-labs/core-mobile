# Function to unescape and save the google services to file
write_to_file() {
  local secret_value=$1
  local output_file=$2
  local format=$3

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