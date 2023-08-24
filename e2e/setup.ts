import { checkForRetries } from './getResultsFromLogs'
import sendResults from './sendResults'

export {}
const fs = require('fs')

afterAll(async () => {
  // If you want to post results to testrail, set the env variable POST_TO_TESTRAIL to true and run test_counter.sh or manually enter the test count in test_count.txt
  if (process.env.POST_TO_TESTRAIL === 'true') {
    const testCount = fs.readFile('./e2e/test_count.txt', 'utf8')
    let testCOuntLines = testCount.split('\n')
    const reducedCount = parseInt(testCOuntLines[0]) - 1
    console.log('This is the reducedCount ', reducedCount)
    testCOuntLines.shift()
    testCOuntLines.unshift(`${reducedCount}`)
    testCOuntLines = testCOuntLines.join('\n')
    fs.writeFileSync('./e2e/test_count.txt', `${testCOuntLines[0]}`)
    // Send results will only run after all the tests have finished and will run on every retry since the count will be less than zero
    if (reducedCount <= 0) {
      const retryCount = await checkForRetries()
      if (reducedCount + retryCount <= 0) {
        await sendResults()
      }
    }
  }
})
