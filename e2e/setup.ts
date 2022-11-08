import { createEmptyTestRun, generateTimestamp } from './testrail_generate_tcs'

module.exports = async function setupTestRun() {
  if (process.env.TEST_RUN_NAME) {
    console.log('Creating empty test run...')
    const testRunName = process.env.TEST_RUN_NAME
    const timestamp = generateTimestamp()
    try {
      await createEmptyTestRun(
        testRunName + timestamp,
        'This is a smoke test run'
      )
    } catch (error) {
      console.log(error)
    }
  } else {
    console.log(
      'TEST_RUN_NAME variable is set to false or does not exist so not creating a test run...'
    )
  }
}
