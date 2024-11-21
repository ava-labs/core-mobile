# install old apk on test device
echo "Installing old version apk on test device"
PREVIOUS_VERSION_APK_PATH="./e2e/tests/updateAppVersion/oldVersionApk/app-external-e2e-bitrise-signed.apk"
PREVIOUS_VERSION_TEST_APK_PATH="./e2e/tests/updateAppVersion/oldVersionApk/app-external-e2e-androidTest-bitrise-signed.apk"
adb install -r $PREVIOUS_VERSION_APK_PATH && sleep 5
echo "Installing old version test apk on device"
adb install -r $PREVIOUS_VERSION_TEST_APK_PATH && sleep 5

envman add --key PREVIOUS_VERSION_APK_PATH --value "$PREVIOUS_VERSION_APK_PATH"
envman add --key PREVIOUS_VERSION_TEST_APK_PATH --value "$PREVIOUS_VERSION_TEST_APK_PATH"

echo "PREVIOUS_VERSION_APK_PATH"
echo $PREVIOUS_VERSION_APK_PATH
echo "PREVIOUS_VERSION_TEST_APK_PATH"
echo $PREVIOUS_VERSION_TEST_APK_PATH


