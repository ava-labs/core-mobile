#!/bin/bash

set -e

cd ~/avalanche-wallet-apps/e2e/tests/playwright/ && npx playwright test traderjoe.spec.ts && sleep 5

cd ~/avalanche-wallet-apps && node_modules/.bin/detox test traderjoe --configuration ios.internal.debug