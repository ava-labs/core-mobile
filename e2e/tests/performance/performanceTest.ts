/* eslint-disable @typescript-eslint/no-explicit-any */
import { execSync } from 'child_process'
import actions from '../../helpers/actions'
const fs = require('fs')

const testNames = [
  'performanceHelpUsImproveScreen.e2e',
  'performanceLaunchApp.e2e'
]

const filePath = './e2e/tests/performance/testResults/results.txt'
const tempfilePath = './e2e/tests/performance/testResults/tempResults.txt'

const platform = process.argv[2] || ''
const numberOfTests = testNames.length
const numberOfIterations = 1

function runDetoxTest(testName: string): number {
  const command = `detox test "${testName}" -c ${platform}.internal.debug`
  execSync(command)

  const output = fs.readFileSync(tempfilePath, 'utf8').trim()
  const time = parseFloat(output)

  return time
}

function runTests(): void {
  const results: number[] = []

  for (let i = 0; i < numberOfTests; i++) {
    const testName: any = testNames[i]
    const testResults: number[] = []

    for (let j = 0; j < numberOfIterations; j++) {
      const time = runDetoxTest(testName)
      testResults.push(time)
    }

    const averageTime =
      testResults.reduce((a, b) => a + b, 0) / testResults.length
    const status = averageTime > 24 ? 'fail' : 'pass'

    const currentDateTime = actions.getCurrentDateTime()
    const newValue = `${averageTime.toFixed(
      3
    )} sec  ${platform}  ${testName}  ${status} ${currentDateTime} [${testResults}]\n`

    let data = ''

    try {
      data = fs.readFileSync(filePath, 'utf8')
    } catch (err) {
      console.error('Error reading file:', err)
      continue
    }

    const existingLines = data.trim().split('\n')

    const updatedContent = existingLines.concat(newValue).join('\n')

    try {
      fs.writeFileSync(filePath, updatedContent, 'utf8')
      console.log('Value appended to file:', newValue)
    } catch (err) {
      console.error('Error writing file:', err)
    }

    results.push(...testResults)
  }

  console.log('Results saved to file.')
}

runTests()
