#!/bin/bash

# Command that returns the test files to be run and stores in TESTS_TO_BE_RUN
TESTS_TO_BE_RUN=$(./node_modules/.bin/detox test --configuration android.internal.smoke.debug --listTests)

# This splits the string into an array of strings based on the newline character
IFS=$'\n' read -r -d '' -a array <<< "$TESTS_TO_BE_RUN"

# Returns the number of elements in the array
testCnt="${#array[@]}"

# Split the tests into 3 groups and uses awk in case the number of tests is not divisible by 3
firstThird=$(awk "BEGIN { print ($testCnt / 3) }")
roundedFirstThird=$(awk "BEGIN {print int($firstThird)}")
roundedUpFirstThird=$(awk "BEGIN {print int($firstThird+0.5)}")
secondThird=$(awk "BEGIN {print $roundedUpFirstThird * 2}")

# These are the 3 different arrays of tests that will be passed to the 3 different emulators
testCnt1="${array[@]:0:$roundedUpFirstThird}"
testCnt2="${array[@]:$roundedUpFirstThird:$roundedUpFirstThird}"
testCnt3="${array[@]:$secondThird:$roundedFirstThird}"

# These env vars are passed to the test emulators via the detox config TESTS_ONE to ui_test_pixel_4_one, TESTS_TWO to ui_test_pixel_4_two, and TESTS_THREE to ui_test_pixel_4_three
envman add --key TESTS_ONE --value "$testCnt1"
envman add --key TESTS_TWO --value "$testCnt2"
envman add --key TESTS_THREE --value "$testCnt3"
