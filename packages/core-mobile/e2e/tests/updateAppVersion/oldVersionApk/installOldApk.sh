# install old apk on test device

adb install -r ./oldVersionApk/app-external-e2e-bitrise-signed.apk && sleep 5
adb install -r ./oldVersionApk/app-external-e2e-androidTest-bitrise-signed.apk && sleep 5

../../node_modules/.bin/detox test --configuration 