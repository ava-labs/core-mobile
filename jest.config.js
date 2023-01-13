import sendResults from './e2e/sendResults'

module.exports = async () => {
  await require('detox/runners/jest/index').globalSetup()
}

module.exports = async () => {
  try {
    await sendResults()
  } finally {
    await require('detox/runners/jest/index').globalTeardown()
  }
}
