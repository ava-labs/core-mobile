# install latest apk on test device
echo "Installing latest version apk on test device"
LATEST_VERSION_APK_PATH="./e2e/tests/updateAppVersion/latestVersionApk/app-external-e2e-bitrise-signed.apk"
LATEST_VERSION_TEST_APK_PATH="./e2e/tests/updateAppVersion/latestVersionApk/app-external-e2e-androidTest-bitrise-signed.apk"
adb install -r $LATEST_VERSION_APK_PATH && sleep 5
echo "Installing latest version test apk on device"
adb install -r $LATEST_VERSION_TEST_APK_PATH && sleep 5

envman add --key LATEST_VERSION_APK_PATH --value "$LATEST_VERSION_APK_PATH"
envman add --key LATEST_VERSION_TEST_APK_PATH --value "$LATEST_VERSION_TEST_APK_PATH"
