# install old apk on test device
echo "Installing old version apk on test device"
adb install -r ./e2e/tests/updateAppVersion/oldVersionApk/app-external-e2e-bitrise-signed.apk && sleep 5
echo "Installing old version test apk on device"
adb install -r ./e2e/tests/updateAppVersion/oldVersionApk/app-external-e2e-androidTest-bitrise-signed.apk && sleep 5

