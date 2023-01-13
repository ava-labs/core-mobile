/* eslint-disable no-var */
import {
  getTestCaseId,
  api,
  createNewTestSectionsAndCases
} from './testrail_generate_tcs'
import getTestLogs from './getResultsFromLogs'

async function parseResultsFile() {
  const nameAndResultsObject = await getTestLogs()

  // If this env variable is set to true it will update the test cases in testrail
  if (process.env.UPDATE_TESTRAIL_CASES) {
    await createNewTestSectionsAndCases(nameAndResultsObject)
  } else {
    console.log('Not updating testrail cases...')
  }

  const jsonResultsArray = await getTestLogs()

  const testIdArrayForTestrail = []
  const casesToAddToRun = []
  for (const result of jsonResultsArray) {
    // Todo add more status ids for different results such as skipped tests or untested
    const testResult = result.testResult
    if (testResult === 'passed') {
      var statusId = 1
    } else {
      var statusId = 5
    }
    const testName = result.testCase
    const testCaseId = await getTestCaseId(result.testCase)

    if (testCaseId !== null) {
      testIdArrayForTestrail.push(testCaseId)
      casesToAddToRun.push({
        test_id: testCaseId,
        status_id: statusId,
        test_name: testName
      })
    }
  }
  return { casesToAddToRun, testIdArrayForTestrail }
}

export default async function sendResults() {
  const runId = Number(process.env.TEST_RUN_ID)
  const resultsToSendObject = parseResultsFile()

  const testIdArrayForTestrail = (await resultsToSendObject)
    .testIdArrayForTestrail
  const casesToAddToRun = (await resultsToSendObject).casesToAddToRun

  // Payload for testrail to add the casses to the test run before the results are sent
  var testCasesToSend = {
    include_all: false,
    case_ids: testIdArrayForTestrail
  }
  // If POST_TO_TESTRAIL environment variable set to true the results will be posted to testrail in a test run
  if (process.env.POST_TO_TESTRAIL) {
    try {
      // Takes the array of test cases and adds them to the test run
      await api.updateRun(runId, testCasesToSend)
      console.log('Test cases have been sent to the test run...')
    } catch (TestRailException) {
      console.log(
        'Invalid test case ids found in ' + testCasesToSend + 'test cases sent'
      )
    }
  }
  /*/ 
Creates an array of test case objects from the current test run in testrail. This is done because a 'test case id' in a test run is different than a 'case id'.
A 'case id' is the permanent test case in our suite, a 'test case id' is a part of the test run only. It can get confusing so please be sure to ask questions if you need help.
/*/

  var resultsToSendToTestrail = []

  // This takes the array of tests in the test run and applies the results to each of the tests
  for (var testCaseResultObject of casesToAddToRun) {
    var testRunCaseStatusId = testCaseResultObject.status_id
    var testId = testCaseResultObject.test_id
    if (testRunCaseStatusId === 1) {
      // Sends a passed test to testrail with no comment
      resultsToSendToTestrail.push({
        case_id: testId,
        status_id: testRunCaseStatusId
      })
    } else {
      // If the test failed then it adds the error stack as a comment to the test case in testrail
      // var failedTest = await this.getLogFilesForFailedTests(testCaseName)
      // var errorMessage = fs.readFileSync(`./output_logs/${failedTest}`, 'utf8')
      resultsToSendToTestrail.push({
        case_id: testId,
        status_id: testRunCaseStatusId
        //comment: `${errorMessage}`
      })
    }
  }

  var resultsContent = {
    results: resultsToSendToTestrail
  }
  // Sends the results to testrail using the resultsToSendToTestrail array if POST_TO_TESTRAIL env variable set to true
  if (process.env.POST_TO_TESTRAIL) {
    try {
      await api.addResultsForCases(runId, resultsContent)
    } catch (error) {
      console.log(error)
    }
  }
}
