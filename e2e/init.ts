export { }
import * as fs from 'fs'

const detox = require('detox')
const config = require('../package.json').detox

jest.setTimeout(120000)

beforeAll(async () => {
  // custom setup
  console.log('Initializing Detox')
  await detox.init(config, { launchApp: false })
})

afterAll(async () => {
  const testName = testNames[0].split(',')
  const testResult = testResults[0]
  fs.writeFileSync('./tests_to_report.txt', `${testName}, ${testResult}\n`, {
    flag: 'a+'
  })
  await detox.cleanup()
})
