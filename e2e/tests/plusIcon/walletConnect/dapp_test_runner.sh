#!/usr/bin/env bash

cmds=('npx playwright test e2e/tests/playwright/traderjoe.spec.ts' 'node_modules/.bin/detox test traderjoe.e2e.ts --configuration ios.internal.debug')
for cmd in "${cmds[@]}"; do
    pwd
    echo "Running ${cmd}"
    $cmd
    echo "${cmd} finished"
done

