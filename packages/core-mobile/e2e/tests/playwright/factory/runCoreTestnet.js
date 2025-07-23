const { spawn } = require('child_process')
const fs = require('fs')

function runCommand(command, args, options) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, options)

    process.stdout.on('data', data => {
      console.log(data.toString())
    })

    process.stderr.on('data', data => {
      console.error(data.toString())
    })

    process.on('close', code => {
      if (code === 0) {
        resolve(true)
      } else {
        reject(new Error(`Process exited with code ${code}`))
      }
    })
  })
}

function connectAndSendRpcOnPlaywright() {
  console.log('Step 1: Connect Core.App')
  return runCommand(
    'npx',
    [
      'playwright',
      'test',
      'e2e/tests/dapps/playwright/core/stakingTestnet.spec.ts',
      '--reporter=dot'
    ],
    { stdio: 'pipe' }
  )
}

function connectAndApproveOnDetox() {
  console.log('Step 2: Connect Core.app on Detox')
  return runCommand(
    'detox',
    [
      'test',
      '-c',
      'ios.internal.debug',
      'e2e/tests/dapps/playwright/core/stakingTestnet.e2e.playwright.ts',
      '--reuse'
    ],
    { stdio: 'pipe' }
  )
}

async function runTestsSimultaneously() {
  try {
    console.log('Step 1 and 2: Starting')
    const connectOnDetox = connectAndApproveOnDetox()
    await new Promise(resolve => setTimeout(resolve, 25000))
    const connectOnPlaywright = connectAndSendRpcOnPlaywright()

    await Promise.all([connectOnDetox, connectOnPlaywright])
    console.log('Step 1 and 2 passed successfully')
    return true
  } catch (error) {
    console.error('Fail in runTestsSimultaneously:', error)
  } finally {
    printTestResults(
      './e2e/tests/dapps/playwright/factory/playwrightResults.json',
      'PlayWright'
    )
    printTestResults(
      './e2e/tests/dapps/playwright/factory/detoxResults.json',
      'Detox'
    )

    clearTestResults(
      './e2e/tests/dapps/playwright/factory/playwrightResults.json'
    )
    clearTestResults('./e2e/tests/dapps/playwright/factory/detoxResults.json')
  }
}

function safeReadJSON(filePath, framework) {
  try {
    const fileStats = fs.statSync(filePath)
    if (fileStats.size === 0) {
      console.warn(`${framework} results file is empty.`)
      return []
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(fileContent)
  } catch (error) {
    console.error(`Error reading ${framework} results:`, error)
    return []
  }
}

function printTestResults(filePath, framework) {
  const results = safeReadJSON(filePath, framework)

  console.log(`\n${framework} Test Results:`)
  if (results.length === 0) {
    console.log('No test results found.')
    return
  }

  results.forEach(result => {
    const { testName, result: status } = result
    console.log(`${testName}: ${status}`)
  })
}

function clearTestResults(filePath) {
  try {
    fs.writeFileSync(filePath, JSON.stringify([]), 'utf-8')
    console.log(`Cleared test results in ${filePath}`)
  } catch (error) {
    console.error(`Failed to clear test results in ${filePath}:`, error)
  }
}

runTestsSimultaneously()
