

npx playwright install

npx playwright test e2e/tests/playwright/core.spec.ts --project='firefox'

npm rebuild detox

node_modules/.bin/detox test dappIntegrations.e2e.dapp.ts --configuration ios.internal.release.dapp.ci --loglevel trace