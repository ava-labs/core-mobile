import * as fs from 'fs'
import { createNewTestSectionsAndCases } from './testrail_generate_tcs'

const detox = require('detox')
const config = require('../package.json').detox

jest.setTimeout(120000)

beforeAll(async () => {
  // custom setup

  console.log('Initializing Detox')
  await detox.init(config, { launchApp: false })
})

afterAll(async () => {
  const testCase: string = testNames[0].split(',')[0]
  const testResult = testResults[0]
  const testPathArray = testPaths.split('/')
  const sectionName = testPathArray[6]
  const nameAndResultsObject = { testCase, sectionName, testResult }

  fs.writeFileSync(
    './tests_to_report.txt',
    `${JSON.stringify(nameAndResultsObject)}\n`,
    {
      flag: 'a+'
    }
  )
  // If this env variable is set to true it will update the test cases in testrail
  if (process.env.UPDATE_TESTRAIL_CASES) {
    await createNewTestSectionsAndCases([nameAndResultsObject])
    console.log(
      JSON.stringify(nameAndResultsObject) +
        ' this is the name and results object!'
    )
  } else {
    console.log('Not updating testrail cases...')
  }

  console.log(
    JSON.stringify(nameAndResultsObject) +
      ' this is the test results object from teardown!'
  )

  writeResults({ testCase, testResult })

  await detox.cleanup()
})

async function writeResults(resultObject: {
  testCase: string
  testResult: string
}) {
  fs.writeFileSync('./test_results.txt', `${JSON.stringify(resultObject)}\n`, {
    flag: 'a+'
  })
}
