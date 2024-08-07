#!/usr/bin/env bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

yarn start &

npm rebuild detox

QT_QPA_PLATFORM=xcb; ./node_modules/.bin/detox test addCustomToken.e2e.smoke.ts createNewWallet.e2e.smoke.ts unlockWithRecoveryPhrase.e2e.ts recoverMetaMaskWallet.e2e.smoke.ts showRecoveryPhrase.e2e.smoke.ts performanceHelpUsImproveScreen.e2e.ts recoverWallet.e2e.smoke.ts --configuration android.internal.release.smoke.ci --headless --retries 1; test_result=$?

npx ts-node ./e2e/attachLogsSendResultsToTestrail.ts

if ((test_result != 0)); then
  exit 1
fi