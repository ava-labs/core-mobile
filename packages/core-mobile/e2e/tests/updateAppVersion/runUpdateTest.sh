#!/bin/bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

#yarn start &

npm rebuild detox

node ./e2e/tests/updateAppVersion/getAndroidArtifacts.js && sleep 5

./e2e/tests/updateAppVersion/oldVersionApk/installOldApk.sh  && sleep 5

.QT_QPA_PLATFORM=xcb; ./node_modules/.bin/detox test loginToAppForUpdate.e2e.ts -c android.external.old.e2e --reuse; test_result=$?

./e2e/tests/updateAppVersion/latestVersionApk/installLatestApk.sh && sleep 5

.QT_QPA_PLATFORM=xcb; ./node_modules/.bin/detox test loginToAppForUpdate.e2e.ts -c android.external.latest.e2e --reuse; test_result=$?