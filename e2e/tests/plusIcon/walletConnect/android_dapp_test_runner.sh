#!/usr/bin/env bash

cmds=('npx playwright test e2e/tests/playwright/traderjoe.spec.ts' 'npx playwright test e2e/tests/playwright/uniswap.spec.ts')
for cmd in "${cmds[@]}"; do
    echo "Running ${cmd}..."
    $cmd
    echo "${cmd} finished"
    node_modules/.bin/detox test dappIntegrations.e2e.ts --configuration android.internal.debug
    echo "Android Test Finished!!!"
done