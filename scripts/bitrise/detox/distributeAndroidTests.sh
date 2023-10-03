#!/bin/bash

TESTS_TO_BE_RUN=$(./node_modules/.bin/detox test --configuration android.internal.smoke.debug --listTests)

IFS=$'\n' read -r -d '' -a array <<< "$TESTS_TO_BE_RUN"

testCnt="${#array[@]}"

all_tests="${array[@]}"

firstThird=$(awk "BEGIN { print ($testCnt / 3) }")
roundedFirstThird=$(awk "BEGIN {print int($firstThird)}")
roundedUpFirstThird=$(awk "BEGIN {print int($firstThird+0.5)}")
secondThird=$(awk "BEGIN {print $roundedUpFirstThird * 2}")

testCnt1="${array[@]:0:$roundedUpFirstThird}"
testCnt2="${array[@]:$roundedUpFirstThird:$roundedUpFirstThird}"
testCnt3="${array[@]:$secondThird:$roundedFirstThird}"

envman add --key TESTS_ONE --value "$testCnt1"
envman add --key TESTS_TWO --value "$testCnt2"
envman add --key TESTS_THREE --value "$testCnt3"
envman add --key ALL_TESTS --value "$TESTS_TO_BE_RUN"

