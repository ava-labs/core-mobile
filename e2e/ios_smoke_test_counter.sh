#!/usr/bin/env bash

OUTPUT=$(./node_modules/.bin/detox test --configuration ios.internal.smoke.debug --listTests)

OUTPUT_ARR=($OUTPUT)

echo "OUTPUT_ARR: ${OUTPUT_ARR[@]}"

len=${#OUTPUT_ARR[@]}

echo "$len" >> ./e2e/test_count.txt





