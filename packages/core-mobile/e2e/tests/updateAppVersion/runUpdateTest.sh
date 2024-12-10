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

envman add --key PREVIOUS_VERSION_APK_PATH --value "$PREVIOUS_VERSION_APK_PATH"
envman add --key PREVIOUS_VERSION_TEST_APK_PATH --value "$PREVIOUS_VERSION_TEST_APK_PATH"

# Run a simple login test
echo "Running login test on old version"
./node_modules/.bin/detox test loginToAppForUpdate.e2e.ts -c android.external.old.e2e --reuse --loglevel trace --headless; test_result_old=$?

killall node

if ((test_result != 0)); then
  exit 0
fi