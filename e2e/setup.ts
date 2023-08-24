/* eslint-disable @typescript-eslint/no-explicit-any */

import sendResults from './sendResults'

export {}
const fs = require('fs')

afterAll(async () => {
  // If you want to post results to testrail, set the env variable POST_TO_TESTRAIL to true and run test_counter.sh or manually enter the test count in test_count.txt
  if (process.env.POST_TO_TESTRAIL === 'true') {
    const testCount = fs.readFileSync('./e2e/test_count.txt', 'utf8')
    const reducedCount = parseInt(testCount) - 1
    console.log('This is the reducedCount ', reducedCount)
    fs.writeFile('./e2e/test_count.txt', `${reducedCount}`, (err: any) => {
      if (err) throw err
    })
    // Send results will only run after all the tests have finished and will run on every retry since the count will be less than zero
    if (reducedCount <= 0) {
      await sendResults()
    }
  }
})
