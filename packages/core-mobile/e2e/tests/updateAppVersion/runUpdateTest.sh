#!/bin/bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

yarn start &

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
adb install -r $PREVIOUS_VERSION_APK_PATH && sleep 5
echo "Installing old version test apk on device"
adb install -r $PREVIOUS_VERSION_TEST_APK_PATH && sleep 5

# Run a simple login test
./node_modules/.bin/detox test loginToAppForUpdate.e2e.ts -c android.external.old.e2e --reuse; test_result=$?

# install latest apk on test device
echo "Installing latest version apk on test device"
LATEST_VERSION_APK_PATH="./e2e/tests/updateAppVersion/latestVersionApk/app-external-e2e-bitrise-signed.apk"
LATEST_VERSION_TEST_APK_PATH="./e2e/tests/updateAppVersion/latestVersionApk/app-external-e2e-androidTest-bitrise-signed.apk"
adb install -r $LATEST_VERSION_APK_PATH && sleep 5
echo "Installing latest version test apk on device"
adb install -r $LATEST_VERSION_TEST_APK_PATH && sleep 5

# Run same login test on latest version to test for a crash
./node_modules/.bin/detox test loginToAppForUpdate.e2e.ts -c android.external.latest.e2e --reuse; test_result=$?