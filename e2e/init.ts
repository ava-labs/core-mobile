import * as fs from 'fs'
import { createNewTestSectionsAndCases } from './testrail_generate_tcs'

const detox = require('detox')
//const config = require('../package.json').detox

jest.setTimeout(120000)

afterEach(async () => {
  console.log(expect.getState().currentTestName + ' this is the test name!!!')
})

beforeAll(async () => {
  // custom setup

  console.log('Initializing Detox')
  // await detox.init(config, { launchApp: false })
})

afterAll(async () => {
  const testCase: string | undefined = testNames
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
  } else {
    console.log('Not updating testrail cases...')
  }

  writeResults({ testCase, testResult })

  await detox.cleanup()
})

async function writeResults(resultObject: {
  testCase?: string
  testResult?: string
}) {
  fs.writeFileSync('./test_results.txt', `${JSON.stringify(resultObject)}\n`, {
    flag: 'a+'
  })
}
