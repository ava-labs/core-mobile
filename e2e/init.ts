export {}

const detox = require('detox')
const config = require('../package.json').detox

jest.setTimeout(120000)

beforeAll(async () => {
  // custom setup
  console.log('Initializing Detox')
  await detox.init(config, { launchApp: false })
})

beforeEach(async () => {
  console.log(testNames[0].split(',') + ' This is the test name!')
})

afterAll(async () => {
  // custom teardown
  await detox.cleanup()
})
