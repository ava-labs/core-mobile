#!/usr/bin/env bash

cmds=(
    'npx playwright test e2e/tests/playwright/traderjoe.spec.ts --project='chromium'' 
    'npx playwright test e2e/tests/playwright/uniswap.spec.ts --project='chromium''
    'npx playwright test e2e/tests/playwright/oasis.spec.ts --project='chromium''
    'npx playwright test e2e/tests/playwright/core.spec.ts --project='firefox''
    'npx playwright test e2e/tests/playwright/benqi.spec.ts --project='chromium''
    'npx playwright test e2e/tests/playwright/opensea.spec.ts --project='firefox''
    'npx playwright test e2e/tests/playwright/pangolin.spec.ts --project='chromium''
    # Multichain is using wallet connect v1 and is not compatible with the new wallet connect v2.  need to revisit later.
    # 'npx playwright test e2e/tests/playwright/multichain.spec.ts --project='chromium''
    # yieldyak and gmx are not connecting and is even inconsistent in extension. will revisit later.
    # 'npx playwright test e2e/tests/playwright/yieldyak.spec.ts --project='chromium''
    # 'npx playwright test e2e/tests/playwright/gmx.spec.ts --project='chromium''
)

eth_cmds=(
    'npx playwright test e2e/tests/playwright/uniswap.spec.ts --project='chromium''
    # Oasis is not compatible with the eth network.  need to revisit later.
    # 'npx playwright test e2e/tests/playwright/oasis.spec.ts --project='chromium''
    'npx playwright test e2e/tests/playwright/core.spec.ts --project='firefox''
    'npx playwright test e2e/tests/playwright/stakeLido.spec.ts --project='chromium''
    'npx playwright test e2e/tests/playwright/aave.spec.ts --project='chromium''
    'npx playwright test e2e/tests/playwright/convexFinance.spec.ts --project='chromium''
    'npx playwright test e2e/tests/playwright/compoundFinance.spec.ts --project='chromium''
    'npx playwright test e2e/tests/playwright/instadapp.spec.ts --project='chromium''
    'npx playwright test e2e/tests/playwright/balancer.spec.ts --project='chromium''
)

echo "Running iOS AVAX dApp tests..."
        for cmd in "${cmds[@]}"; do
                    echo "Running ${cmd}..."
                    $cmd
                    echo "${cmd} finished"
                    echo "Now running the iOS detox test..."
                    node_modules/.bin/detox test dappIntegrations.e2e.ts --configuration ios.internal.release.ci 
                done;;

echo "Running iOS ETH dApp tests..."
        for eth_cmd in "${eth_cmds[@]}"; do
                    echo "Running ${cmd}..."
                    $cmd
                    echo "${cmd} finished"
                    echo "Now running the iOS detox test..."
                    node_modules/.bin/detox test dappEthIntegrations.e2e.ts --configuration ios.internal.release.ci 
                done;;
    
