const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function runPlaywright(playwrightPath) {
  // Test Playwright
  try {
    console.log('Running Playwright tests...')
    execSync(`npx playwright test ${playwrightPath} --reporter=dot`, {
      stdio: 'inherit'
    })
    return true
  } catch (e) {
    console.error(`Playwright tests failed for ${playwrightPath}`)
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
    return true
  } catch (e) {
    console.error(`Detox tests failed for ${dappName}`)
    return false
  }
}

function runSingleTest(playwrightPath, detoxPath, dappName) {
  const isPlaywrightPassed = runPlaywright(playwrightPath)
  const isDetoxPassed = isPlaywrightPassed
    ? runDetox(detoxPath, dappName)
    : false
  return { dappName, playwright: isPlaywrightPassed, detox: isDetoxPassed }
}

function printResult(results) {
  console.log('\n==== TEST RESULTS SUMMARY ====')
  for (const result of results) {
    console.log(`DApp <${result.dappName}>:  PASS`)
  }

  const failedTests = results.filter(r => !r.playwright || !r.detox)
  if (failedTests.length > 0) {
    console.log('\nFAILED TESTS:')
    for (const result of failedTests) {
      console.log(`  DApp: ${result.dappName}`)
      if (!result.playwright) console.log('    - Playwright failed')
      if (!result.detox) console.log('    - Detox failed')
    }
  } else {
    console.log('\nAll tests passed! 🎉')
  }
}

function runFullTests() {
  const playwrightDir = 'e2e/tests/dapps/playwright/connect/'
  const playwrightTests = fs
    .readdirSync(playwrightDir)
    .filter(file => file.endsWith('.spec.ts'))

  const results = []

  for (const test of playwrightTests) {
    const detoxPath =
      'e2e/tests/dapps/playwright/connect/connectDapps.e2e.playwright.ts'
    const playwrightPath = path.join(playwrightDir, test)
    const dappName = path.basename(playwrightPath, '.spec.ts')
    console.log(`Running tests for: ${playwrightPath}`)

    try {
      const result = runSingleTest(playwrightPath, detoxPath, dappName)
      results.push(result)
    } catch (e) {
      console.error(`Error while running tests for ${dappName}:`, e)
      results.push({ dappName, playwright: false, detox: false })
    }
  }

  printResult(results)
}

runFullTests()
