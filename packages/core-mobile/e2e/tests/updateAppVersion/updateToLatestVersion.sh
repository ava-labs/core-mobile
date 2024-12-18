set -o pipefail
if [ "$IS_REGRESSION_RUN" = true ]; then
  npm rebuild detox

  adb install -r $BITRISE_APK_PATH
  adb install -r $BITRISE_TEST_APK_PATH

  QT_QPA_PLATFORM=xcb ./node_modules/.bin/detox test loginWithLatestVersion.e2e.ts --configuration android.external.release.ci --reuse; test_result=$? && sleep 5

  npx ts-node ./e2e/attachLogsSendResultsToTestrail.ts

  if ((test_result != 0)); then
    exit 1
  fi
else
  echo "This is not a regression run so not running the updateAppVersion tests"
fi
