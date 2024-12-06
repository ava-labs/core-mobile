set -o pipefail

yarn start &

npm rebuild detox

adb install -r "e2e/tests/updateAppVersion/oldVersionApk/app-external-e2e-bitrise-signed.apk"
adb install -r "e2e/tests/updateAppVersion/oldVersionApk/app-external-e2e-androidTest-bitrise-signed.apk"

QT_QPA_PLATFORM=xcb ./node_modules/.bin/detox test loginAfterVersionUpdate.e2e.ts --configuration android.external.old.e2e --headless --reuse; test_result=$? && sleep 5

npx ts-node ./e2e/attachLogsSendResultsToTestrail.ts

if ((test_result != 0)); then
  exit 1
fi