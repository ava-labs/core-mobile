import { globalTeardown } from 'detox/runners/jest'
import sendResults from './sendResults'

async function sendMyResults() {
  console.log('Sending results to TestRail...')
  await sendResults()
}

module.exports = async () => {
  await globalTeardown()
  await sendMyResults()
}
