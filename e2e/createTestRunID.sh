#!/usr/bin/env bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

# debug log
set -x

./node_modules/.bin/ts-node -e 'require ("./e2e/generateTestrailObjects").createAndroidTestRun();'

RUN_ID=$(head -n 1 ./e2e/testrailRunID.txt) 

envman add --key TESTRAIL_RUN --value $RUN_ID