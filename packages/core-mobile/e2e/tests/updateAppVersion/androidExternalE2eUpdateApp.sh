set -o pipefail

yarn start &

npm rebuild detox

adb install -r "$BITRISE_APK_PATH"
adb install -r "$BITRISE_TEST_APK_PATH"

QT_QPA_PLATFORM=xcb ./node_modules/.bin/detox test loginAfterVersionUpdate.e2e.ts --configuration android.external.release.smoke.ci --headless --reuse; test_result=$?

npx ts-node ./e2e/attachLogsSendResultsToTestrail.ts

if ((test_result != 0)); then
  exit 1
fi