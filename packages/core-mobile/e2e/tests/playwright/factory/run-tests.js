const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function runPlaywright(playwrightPath) {
  // Test Playwright
  try {
    console.log('Running Playwright tests...')
    execSync(`npx playwright test ${playwrightPath} --project=chromium`, {
      stdio: 'inherit'
    })
    return true
  } catch (e) {
    return false
  }
}

function runDetox(detoxPath, dappName) {
  // Test Detox
  try {
    console.log(`Running Detox tests for ${dappName}...`)
    process.env.DAPP_NAME = dappName
    execSync(`detox test -c ios.internal.debug ${detoxPath} --reuse`, {
      stdio: 'inherit'
    })
  } catch (e) {
    console.error(`Detox tests failed for ${dappName}`)
  }
}

function runSingleTest(playwrightPath, detoxPath, dappName) {
  const isPassed = runPlaywright(playwrightPath)
  if (isPassed) {
    runDetox(detoxPath, dappName)
  }
}

function runFullTests() {
  const playwrightDir = 'e2e/tests/playwright/'
  const playwrightTests = fs
    .readdirSync(playwrightDir)
    .filter(file => file.endsWith('.spec.ts'))

  for (const test of playwrightTests) {
    const detoxPath = 'e2e/tests/playwright/factory/connect.e2e.playwright.ts'
    const playwrightPath = path.join(playwrightDir, test)
    const dappName = path.basename(playwrightPath, '.spec.ts')
    console.log(`Running tests for: ${playwrightPath}`)
    runSingleTest(playwrightPath, detoxPath, dappName)
  }
}

runFullTests()
