#!/usr/bin/env bash

# make pipelines' return status equal the last command to exit with a non-zero status, or zero if all commands exit successfully
set -o pipefail

yarn start &

npm rebuild detox
QT_QPA_PLATFORM=xcb; ./node_modules/.bin/detox createNewWallet.e2e.smoke.ts unlockWithRecoveryPhrase.e2e.ts recoverMetaMaskWallet.e2e.smoke.ts showRecoveryPhrase.e2e.smoke.ts performanceHelpUsImproveScreen.e2e.ts recoverWallet.e2e.smoke.ts test  --configuration android.internal.release.smoke.ci --headless --retries 1; test_result=$?

if ((test_result != 0)); then
  exit 1
fi