set -o pipefail

yarn start &

node ./e2e/tests/updateAppVersion/getAndroidArtifacts.js && sleep 5

npm rebuild detox

QT_QPA_PLATFORM=xcb ./node_modules/.bin/detox test loginAfterVersionUpdate.e2e.ts --configuration android.external.release.ci --headless --reuse; test_result=$? && sleep 5

npx ts-node ./e2e/attachLogsSendResultsToTestrail.ts

if ((test_result != 0)); then
  exit 1
fi