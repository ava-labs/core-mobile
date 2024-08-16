#!/usr/bin/env bash

# Command that returns the test files to be run and stores in TESTS_TO_BE_RUN
if (($IS_REGRESSION_RUN=='true')); then
  echo "This is a regression run"
  TESTS_TO_BE_RUN=$(./node_modules/.bin/detox test --configuration "android.internal.release.ci" --listTests)
  echo $TESTS_TO_BE_RUN
else
  echo "This is a smoke test run"
  TESTS_TO_BE_RUN=$(./node_modules/.bin/detox test --configuration "android.internal.release.smoke.ci" --listTests)
fi
# TESTS_TO_BE_RUN=$(./node_modules/.bin/detox test --configuration android.internal.debug --listTests;)

# This splits the string into an array of strings based on the newline character
IFS=$'\n' read -r -d '' -a array <<< "$TESTS_TO_BE_RUN"

for i in "${!array[@]}"; do
  array[$i]="${array[$i]//\/Users\/vagrant\/git\//\/bitrise\/src\/}"
done

# Returns the number of elements in the array
testCnt="${#array[@]}"
echo "Test count: $testCnt"

# Split the tests into 3 groups and uses awk in case the number of tests is not divisible by 3
groups=4
# Calculate the number of items per groups
items_per_group=$((testCnt / groups))
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