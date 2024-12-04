import { execSync } from 'child_process'

const runTests = () => {
  const testFile = 'e2e/tests/playwright/core/core.spec.ts'
  const testFile2 = 'e2e/tests/playwright/core/core.e2e.playwright.ts'

  try {
    // Test Playwright
    console.log('Running Playwright tests...')
    execSync(`npx playwright test ${testFile} --project=chromium`, {
      stdio: 'inherit'
    })

    // Test Detox
    console.log('Running Detox tests...')
    execSync(`detox test -c ios.internal.debug ${testFile2}`, {
      stdio: 'inherit'
    })

    console.log('All tests completed successfully.')
  } catch (error) {
    if (error instanceof Error) {
      console.error('Test execution failed:', error.message)
    } else {
      console.error('Unexpected error occurred:', error)
    }
    process.exit(1)
  }
}

runTests()
