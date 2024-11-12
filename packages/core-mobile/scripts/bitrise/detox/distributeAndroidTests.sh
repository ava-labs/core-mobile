#!/usr/bin/env bash

echo $BITRISE_SIGNED_APK_PATH
echo $BITRISE_TEST_APK_PATH
echo $BITRISE_APK_PATH

IFS='|'
read -4ra newarray <<< "$paths"
signed_apk_path="${newarray[0]}"

echo "Signed APK path: $signed_apk_path"

envman add --key BITRISE_SIGNED_APK_PATH --value "$signed_apk_path"

# Command that returns the test files to be run and stores in TESTS_TO_BE_RUN
echo "IS_REGRESSION_RUN is true or false: $IS_REGRESSION_RUN"
TESTS_TO_BE_RUN=$(./node_modules/.bin/detox test --configuration "android.internal.release.ci" --listTests)

# This splits the string into an array of strings based on the newline character
IFS=$'\n' read -r -d '' -a array <<< "$TESTS_TO_BE_RUN"

# This replaces the test path prefix `/Users/vagrant/git` with `bitrise/src` which we need for the actual testing
for i in "${!array[@]}"; do
  array[$i]="${array[$i]//\/Users\/vagrant\/git\//\/bitrise\/src\/}"
done

# Returns the number of elements in the array
testCnt="${#array[@]}"
echo "Test count: $testCnt"

# Set the group number. we can increase the group number here in the future if needed
groups=4

# Calculate the number of items per groups
items_per_group=$((testCnt / groups))
# Get a remainder 
remainder=$((testCnt % groups))

# Variables to keep track of indices
start=0
# Divide the array into groups and save each groups as a string
for ((i=1; i<=groups; i++)); do
    end=$((start + items_per_group - 1))
    
    # If there are leftover items, distribute them
    if [ $remainder -gt 0 ]; then
        end=$((end + 1))
        remainder=$((remainder - 1))
    fi

    # Create the grouped string for the current groups
    group_string=$(printf "%s " "${array[@]:$start:$((end - start + 1))}")
    eval "TEST_GROUP_$i=\"$group_string\""
    envman add --key TESTS_$i --value "$group_string"
    
    # Print the indices and the grouped string
    echo "TEST_GROUP_$i indices: ${start} to ${end}"
    echo "TEST_GROUP_$i contents: ${group_string}"

    # Move to the next chunk
    start=$((end + 1))
done