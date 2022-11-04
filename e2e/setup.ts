import { createEmptyTestRun, generateTimestamp } from './testrail_generate_tcs'

module.exports = async function setupTestRun() {
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
}
