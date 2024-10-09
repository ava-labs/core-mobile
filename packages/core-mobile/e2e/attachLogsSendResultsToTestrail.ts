import sendResults from './sendResults'

async function sendMyResults() {
  if (process.env.POST_TO_TESTRAIL === 'false') {
    console.log('TESTRAIL is false, skipping sending results to TestRail')
    return
  }
  console.log('Sending results to TestRail...')
  await sendResults()
}

sendMyResults()
