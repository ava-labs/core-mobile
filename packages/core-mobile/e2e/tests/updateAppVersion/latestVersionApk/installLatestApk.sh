# install latest apk on test device
echo "Installing latest version apk on test device"
adb install -r ./e2e/tests/updateAppVersion/latestVersionApk/app-external-e2e-bitrise-signed.apk && sleep 5
echo "Installing latest version test apk on device"
adb install -r ./e2e/tests/updateAppVersion/latestVersionApk/app-external-e2e-androidTest-bitrise-signed.apk && sleep 5
