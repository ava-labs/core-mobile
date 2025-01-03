const fs = require('fs')
const { spawn } = require('child_process')
const path = require('path')

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

function runPlaywrightSwap(testPath) {
  return runCommand('npx', ['playwright', 'test', testPath, '--reporter=dot'], {
    stdio: 'pipe'
  })
}

async function runDetoxSwap(dappName) {
  process.env.DAPP_NAME = dappName
  console.log('Step 2: Connect Playground on Detox')
  return runCommand(
    'detox',
    [
      'test',
      '-c',
      'ios.internal.debug',
      'e2e/tests/dapps/playwright/swap/swap.e2e.playwright.ts',
      '--reuse'
    ],
    { stdio: 'pipe' }
  )
}

async function runTestsSimultaneously(playwrightPath, dappName) {
  try {
    console.log(`Starting Dapp Swap Testing for ${dappName}....`)

    const detoxProcess = runDetoxSwap(dappName)

    // Kick off Playwright after 15 seconds
    const playwrightPromise = new Promise(resolve => {
      setTimeout(() => {
        resolve(runPlaywrightSwap(playwrightPath))
      }, 15000)
    })

    // If Playwright fails, log and stop Detox
    const result = await Promise.allSettled([detoxProcess, playwrightPromise])

    // Check the result statuses
    const playwrightResult = result[1].status === 'fulfilled' ? 'PASS' : 'FAIL'
    const detoxResult = result[0].status === 'fulfilled' ? 'PASS' : 'FAIL'

    // Return the results for logging later
    return {
      dappName,
      playwrightResult,
      detoxResult
    }
  } catch (error) {
    console.error(`Fail in runTestsSimultaneously for ${dappName}:`, error)
    return {
      dappName,
      playwrightResult: 'FAIL',
      detoxResult: 'FAIL'
    }
  }
}

// Function to log the final test results at the end
function logFinalTestResults(testResults) {
  console.log('\n--- Final Test Results ---')
  testResults.forEach(result => {
    if (result.playwrightResult === 'PASS' && result.detoxResult === 'PASS') {
      console.log(`${result.dappName}: PASS`)
    } else {
      console.log(
        `${result.dappName}: ${result.playwrightResult}(PlayWright) | ${result.detoxResult}(Detox)`
      )
    }
  })
}

async function runFullTests() {
  const playwrightDir = 'e2e/tests/dapps/playwright/swap/'
  const playwrightTests = fs
    .readdirSync(playwrightDir)
    .filter(file => file.endsWith('.spec.ts'))

  // Array to store the test results
  const testResults = []

  for (let i = 0; i < playwrightTests.length; i++) {
    const test = playwrightTests[i]
    const playwrightPath = path.join(playwrightDir, test)
    const dappName = path.basename(playwrightPath, '.spec.ts')
    console.log(`Running tests for: ${dappName}`)

    // PlayWright & Detox Run in parallel and collect results
    const result = await runTestsSimultaneously(playwrightPath, dappName)
    testResults.push(result) // Store the result for final logging
  }

  // After all tests are done, log the final results
  logFinalTestResults(testResults)
}

runFullTests()
