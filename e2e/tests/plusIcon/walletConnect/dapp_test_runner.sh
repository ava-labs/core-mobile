#!/usr/bin/env bash

cmds=('npx playwright test e2e/tests/playwright/traderjoe.spec.ts' 'npx playwright test e2e/tests/playwright/uniswap.spec.ts')
for cmd in "${cmds[@]}"; do
    echo "Running ${cmd}..."
    $cmd
    echo "${cmd} finished"
    echo "Now running the detox test..."
    node_modules/.bin/detox test traderjoe.e2e.ts --configuration ios.internal.debug
    echo "Detox test finished!!!"
done

