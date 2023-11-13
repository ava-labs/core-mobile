/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { globalTeardown } from 'detox/runners/jest'
import sendResults from './sendResults'

async function sendMyResults() {
  if (process.env.POST_TO_TESTRAIL === 'false') {
    console.log('TESTRAIL is false, skipping sending results to TestRail')
    return
  }
  console.log('Sending results to TestRail...')
  await sendResults()
}

module.exports = async () => {
  await globalTeardown()
  await sendMyResults()
}
