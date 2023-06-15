import { androidRunID, iosRunID } from './generateTestrailObjects'
import sendResultsToTestrail from './sendResults'

beforeAll(async () => {
  if (process.env.POST_TO_TESTRAIL === 'true') {
    if (process.env.TEST_RUN_NAME) {
      if (!androidRunID) {
        console.log('Creating empty test run for android...')
      } else {
        const myAndroidRunID = await androidRunID()
        console.log(
          `Android test run already exists for today. updating test run id ${myAndroidRunID.runID?.toString()}`
        )
      }
      if (!iosRunID) {
        console.log('Creating empty test run for ios...')
      } else {
        const myIosRunID = await iosRunID()
        console.log(
          `ios test run already exists for today. updating test run id ${myIosRunID.runID?.toString()}`
        )
      }
    }
  }
})

afterAll(async () => {
  if (process.env.POST_TO_TESTRAIL === 'true') {
    console.log('Sending results to testrail...')
    await sendResultsToTestrail()
  }
})
