#!/bin/bash

cd /Users/tyler.hackett/avalanche-wallet-apps/e2e/tests/playwright/ && npx playwright test /Users/tyler.hackett/avalanche-wallet-apps/e2e/tests/playwright/traderjoe.spec.ts && sleep 5

cd /Users/tyler.hackett/avalanche-wallet-apps/e2e/tests/plusIcon/walletConnect && detox test -c ios.internal.debug traderjoe