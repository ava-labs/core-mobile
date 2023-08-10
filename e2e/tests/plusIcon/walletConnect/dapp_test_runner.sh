#!/usr/bin/env bash

cmds=(
'npx playwright test e2e/tests/playwright/traderjoe.spec.ts --project='chromium'' 
'npx playwright test e2e/tests/playwright/uniswap.spec.ts --project='chromium''
'npx playwright test e2e/tests/playwright/oasis.spec.ts --project='chromium''
'npx playwright test e2e/tests/playwright/core.spec.ts --project='firefox''
# gmx is not connecting and is even inconsistent in extension. will revisit later.
# 'npx playwright test e2e/tests/playwright/gmx.spec.ts --project='chromium''
'npx playwright test e2e/tests/playwright/benqi.spec.ts --project='chromium''
'npx playwright test e2e/tests/playwright/opensea.spec.ts --project='firefox''
'npx playwright test e2e/tests/playwright/pangolin.spec.ts --project='chromium''
'npx playwright test e2e/tests/playwright/multichain.spec.ts --project='chromium''
# yieldyak is not connecting and is even inconsistent in extension. will revisit later.
# 'npx playwright test e2e/tests/playwright/yieldyak.spec.ts --project='chromium''
)

eth_cmds=(
    'npx playwright test e2e/tests/playwright/uniswap.spec.ts --project='chromium''
    'npx playwright test e2e/tests/playwright/oasis.spec.ts --project='chromium''
    'npx playwright test e2e/tests/playwright/core.spec.ts --project='firefox''
    'npx playwright test e2e/tests/playwright/stakeLido.spec.ts --project='chromium''
    'npx playwright test e2e/tests/playwright/aave.spec.ts --project='chromium''
)

read -p "Did you start your emulator or simulator? (y/n)" reply
case $reply in 
    y) echo "Fantastic, you get a gold star!!!";;
    n) echo "Please start your emulator or simulator and try again"; exit;;
    *) echo "invalid option"; exit;;
esac

read -p $'Which dApp tests would you like to run? \n1)ios AVAX \n2)android AVAX\n3)ios ETH\n4)android ETH\n' answer
case $answer in 
    1)  echo "Running iOS dApp tests..."
        for cmd in "${cmds[@]}"; do
                    echo "Running ${cmd}..."
                    $cmd
                    echo "${cmd} finished"
                    echo "Now running the iOS detox test..."
                    node_modules/.bin/detox test dappIntegrations.e2e.ts --configuration ios.internal.debug 
                done;;
    2)  echo "Running Android dApp tests..."
        for cmd in "${cmds[@]}"; do
                    echo "Running ${cmd}..."
                    $cmd
                    echo "${cmd} finished"
                    echo "Now running the android detox test..."
                    node_modules/.bin/detox test dappIntegrations.e2e.ts --configuration android.internal.debug 
                done;;
    3)  echo "Running iOS ETH dApp tests..."
        for cmd in "${eth_cmds[@]}"; do
                    echo "Running ${cmd}..."
                    $cmd
                    echo "${cmd} finished"
                    echo "Now running the iOS detox test..."
                    node_modules/.bin/detox test dappEthIntegrations.e2e.ts --configuration ios.internal.debug 
                done;;
    4)  echo "Running Android ETH dApp tests..."
        for cmd in "${eth_cmds[@]}"; do
                    echo "Running ${cmd}..."
                    $cmd
                    echo "${cmd} finished"
                    echo "Now running the android detox test..."
                    node_modules/.bin/detox test dappEthIntegrations.e2e.ts --configuration android.internal.debug 
                done;;
    *) echo "invalid option"; exit;;
esac



