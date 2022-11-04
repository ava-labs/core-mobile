import * as fs from 'fs'
import {
  createEmptyTestRun,
  generateTimestamp,
  parseTestName
} from './testrail_generate_tcs'

const detox = require('detox')
const config = require('../package.json').detox

jest.setTimeout(120000)

beforeAll(async () => {
  // custom setup
  console.log('Initializing Detox')
  await detox.init(config, { launchApp: false })
})

afterAll(async () => {
  const testName: string = testNames[0].split(',')[0]
  const testResult = testResults[0]
  const nameAndResultsObject = { testName, testPaths, testResult }

  fs.writeFileSync(
    './tests_to_report.txt',
    `${JSON.stringify(nameAndResultsObject)}\n`,
    {
      flag: 'a+'
    }
  )
  await detox.cleanup()
})
