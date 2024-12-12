set -o pipefail
if [ $IS_REGRESSION_RUN = true ]; then

  npm rebuild detox
  adb uninstall com.avaxwallet
  npx ts-node ./e2e/tests/updateAppVersion/getOldAndroidVersion.js

  adb install -r "./e2e/tests/updateAppVersion/oldVersionApk/app-external-e2e-bitrise-signed.apk"
  adb install -r "./e2e/tests/updateAppVersion/oldVersionApk/app-external-e2e-androidTest-bitrise-signed.apk"

  QT_QPA_PLATFORM=xcb ./node_modules/.bin/detox test loginWithOlderVersion.e2e.smoke.ts --configuration android.external.e2e.old_version; test_result=$? && sleep 5

  if ((test_result != 0)); then
    exit 1
  fi
else
  echo "This is not a regression run so not running the updateAppVersion tests"
fi
