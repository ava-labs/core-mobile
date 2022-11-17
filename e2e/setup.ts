import {
  createEmptyTestRun,
  generateTimestamp,
  createNewTestRunBool
} from './testrail_generate_tcs'

module.exports = async function setupTestRun() {
  if (process.env.TEST_RUN_NAME) {
    const testRunName = process.env.TEST_RUN_NAME
    const testRunBool = await createNewTestRunBool()
    if (!testRunBool) {
      console.log('Creating empty test run...')
      const timestamp = generateTimestamp()

      const testRunId = await createEmptyTestRun(
        testRunName + timestamp,
        'This is a smoke test run'
      )
      process.env.TEST_RUN_ID = testRunId?.toString()
    } else {
      const testRunId = testRunBool
      process.env.TEST_RUN_ID = testRunId?.toString()
      console.log(
        `Updating results for latest test run with id ${testRunId}...`
      )
    }
  } else {
    console.log(
      'TEST_RUN_NAME variable is set to false or does not exist so not creating a test run...'
    )
  }
}
