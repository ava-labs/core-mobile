/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck comment at the top of the file
/* eslint-disable no-var */
import * as fs from 'fs'
import {
  getTestCaseId,
  api,
  createNewTestSectionsAndCases,
  currentRunID
} from './generateTestrailObjects'
import getTestLogs, { isResultPresent } from './getResultsFromLogs'

async function parseResultsFile() {
  const jsonResultsArray = await getTestLogs()

  // If this env variable is set to true it will update the test cases in testrail
  if (process.env.UPDATE_TESTRAIL_CASES) {
    await createNewTestSectionsAndCases(jsonResultsArray)
  } else {
    console.log('Not updating testrail cases...')
  }

  const testIdArrayForTestrail = []
  const casesToAddToRun = []
  for (const result of jsonResultsArray) {
    // Todo add more status ids for different results such as skipped tests or untested
    const testResult = result.testResult
    if (testResult === 'passed') {
      var statusId = 1
    } else {
      var statusId = 5
      var failedScreenshot = result.failedScreenshot
    }
    const testName = result.testCase
    const testCaseId = await getTestCaseId(result.testCase)
    const platform = result.platform

    if (testCaseId !== null) {
      testIdArrayForTestrail.push(testCaseId)
      casesToAddToRun.push({
        test_id: testCaseId,
        status_id: statusId,
        test_name: testName,
        failed_screenshot: failedScreenshot,
        platform: platform
      })
    }
  }
  console.log(casesToAddToRun)
  return { casesToAddToRun, testIdArrayForTestrail }
}

export async function prepareResults() {
  const resultsToSendObject = await parseResultsFile()

  const testIdArrayForTestrail = resultsToSendObject.testIdArrayForTestrail
  const casesToAddToRun = resultsToSendObject.casesToAddToRun

  const uniqueCaseIdArray = [...new Set(testIdArrayForTestrail)]

  // Payload for testrail to add the casses to the test run before the results are sent
  var testCasesToSend = {
    include_all: false,
    case_ids: uniqueCaseIdArray
  }

  return { casesToAddToRun, testCasesToSend }
}

export async function prepareFinalResults() {
  const preparedResults = await prepareResults()
  const casesToAddToRun = preparedResults.casesToAddToRun
  const testCasesToSend = preparedResults.testCasesToSend
  /*/ 
Creates an array of test case objects from the current test run in testrail. This is done because a 'test case id' in a test run is different than a 'case id'.
A 'case id' is the permanent test case in our suite, a 'test case id' is a part of the test run only. It can get confusing so please be sure to ask questions if you need help.
/*/

  var resultsToSendToTestrail = []

  // This takes the array of tests in the test run and applies the results to each of the tests
  for (var testCaseResultObject of casesToAddToRun) {
    var testRunCaseStatusId = testCaseResultObject.status_id
    var testId = testCaseResultObject.test_id
    var screenshot = testCaseResultObject.failed_screenshot
    var platform = testCaseResultObject.platform
    if (testRunCaseStatusId === 1) {
      // Sends a passed test to testrail with no comment
      resultsToSendToTestrail.push({
        case_id: testId,
        status_id: testRunCaseStatusId,
        platform: platform
      })
    } else {
      // If the test failed then it adds the error stack as a comment to the test case in testrail
      // var failedTest = await this.getLogFilesForFailedTests(testCaseName)
      // var errorMessage = fs.readFileSync(`./output_logs/${failedTest}`, 'utf8')
      resultsToSendToTestrail.push({
        case_id: testId,
        status_id: testRunCaseStatusId,
        screenshot: screenshot,
        platform: platform
        //comment: `${errorMessage}`
      })
    }
  }
  return { resultsToSendToTestrail, testCasesToSend }
}

export default async function sendResults() {
  const preparedFinalResults = await prepareFinalResults()
  const testCasesToSend = preparedFinalResults.testCasesToSend
  const resultsToSendToTestrail = preparedFinalResults.resultsToSendToTestrail

  if (process.env.POST_TO_TESTRAIL) {
    if (
      (await isResultPresent('android')) &&
      (await isSmokeTestRunFinished('android'))
    ) {
      await generatePlatformResults(
        testCasesToSend,
        resultsToSendToTestrail,
        'android',
        (
          await currentRunID('android')
        ).runID
      )
    }
    if (
      (await isResultPresent('ios')) &&
      (await isSmokeTestRunFinished('ios'))
    ) {
      await generatePlatformResults(
        testCasesToSend,
        resultsToSendToTestrail,
        'ios',
        (
          await currentRunID('ios')
        ).runID
      )
    }
  }
}

// Updates the results for an existing test run or and empty test run
async function generatePlatformResults(
  testCasesToSend: any,
  resultsToSendToTestrail: any,
  platform: any,
  runId?: any
) {
  try {
    const resultArray = resultsToSendToTestrail.filter(
      result => result.platform === platform
    )
    try {
      // Takes the array of test cases and adds them to the test run
      await api.updateRun(Number(runId), testCasesToSend)
      console.log(
        'Test cases have been sent to the test run...' +
          testCasesToSend.case_ids
      )
    } catch (TestRailException) {
      console.log(
        'Invalid test case ids found in ' +
          testCasesToSend.case_ids +
          ' with run id ' +
          runId
      )
    }

    for (let i = 0; i < resultArray.length; i++) {
      const resultObject = resultArray[i]
      const payload = {
        status_id: resultObject?.status_id
      }
      if (resultObject) {
        const testResult = await api.addResultForCase(
          Number(runId),
          resultObject?.case_id,
          payload
        )
        if (testResult.status_id === 5) {
          // This is the path to the screenshot for when the test fails
          const failScreenshot = `./e2e/artifacts/${platform}/${resultObject.screenshot}`
          if (failScreenshot) {
            const failedPayload = {
              name: 'failed.png',
              value: fs.createReadStream(failScreenshot)
            }
            // Attaches the screenshot to the corressponding case in the test run
            const attachmentID = await api.addAttachmentToResult(
              testResult.id,
              failedPayload
            )
            console.log(`${attachmentID.attachment_id} is the attachment ID...`)
          }
        }
      } else {
        console.log(
          'result object is null so no results were sent to testrail!!!'
        )
      }
    }
  } catch (error) {
    console.log(error)
  }
}
