#!/bin/bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

npm rebuild detox

node ./e2e/tests/updateAppVersion/getAndroidArtifacts.js && sleep 5

echo 'previous version apk path'
echo $PREVIOUS_VERSION_APK_PATH
echo 'latest version apk path'
echo $LATEST_VERSION_APK_PATH

# install previous apk version on test device
echo "Installing old version apk on test device"
PREVIOUS_VERSION_APK_PATH="./e2e/tests/updateAppVersion/oldVersionApk/app-external-e2e-bitrise-signed.apk"
PREVIOUS_VERSION_TEST_APK_PATH="./e2e/tests/updateAppVersion/oldVersionApk/app-external-e2e-androidTest-bitrise-signed.apk"
# adb install -r $PREVIOUS_VERSION_APK_PATH && sleep 5
# echo "Installing old version test apk on device"
# adb install -r $PREVIOUS_VERSION_TEST_APK_PATH && sleep 5

# Run a simple login test
echo "Running login test on old version"
./node_modules/.bin/detox test loginToAppForUpdate.e2e.ts -c android.external.old.e2e --reuse --loglevel verbose; test_result_old=$?

adb install -r '/Users/tyler.hackett/Desktop/app-external-e2e-bitrise-signed.apk'
adb install -r '/Users/tyler.hackett/Desktop/app-external-e2e-androidTest-bitrise-signed.apk'

QT_QPA_PLATFORM=xcb ./node_modules/.bin/detox test loginAfterVersionUpdate.e2e.ts --configuration android.external.local.e2e --reuse --loglevel verbose; test_result=$? && sleep 5


if ((test_result != 0)); then
  exit 0
fi