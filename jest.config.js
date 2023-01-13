import setupTestRun from './e2e/setup'
import sendResults from './e2e/sendResults'

module.exports = async () => {
  await require('detox/runners/jest/index').globalSetup()
  await setupTestRun()
}

module.exports = async () => {
  try {
    await sendResults()
  } finally {
    await require('detox/runners/jest/index').globalTeardown()
  }
}
