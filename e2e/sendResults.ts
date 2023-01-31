/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-var */
import * as fs from 'fs'
import {
  getTestCaseId,
  api,
  createNewTestSectionsAndCases,
  androidRunID,
  iosRunID
} from './testrail_generate_tcs'
import getTestLogs from './getResultsFromLogs'

const getAndroidTestRunId = async () => {
  const androidTestRunID = await androidRunID()
  return androidTestRunID
}

const getIosTestRunId = async () => {
  const iosTestRunID = await iosRunID()
  return iosTestRunID
}

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
  return { casesToAddToRun, testIdArrayForTestrail }
}

export async function prepareResults() {
  const androidTestRunID = await getAndroidTestRunId()
  const iosTestRunId = await getIosTestRunId()

  const resultsToSendObject = await parseResultsFile()

  const testIdArrayForTestrail = resultsToSendObject.testIdArrayForTestrail
  const casesToAddToRun = resultsToSendObject.casesToAddToRun

  // Payload for testrail to add the casses to the test run before the results are sent
  var testCasesToSend = {
    include_all: false,
    case_ids: testIdArrayForTestrail
  }

  // If POST_TO_TESTRAIL environment variable set to true the results will be posted to testrail in a test run
  if (process.env.POST_TO_TESTRAIL) {
    if (iosTestRunId.emptyTestRun && androidTestRunID.emptyTestRun) {
      try {
        // Takes the array of test cases and adds them to the test run
        await api.updateRun(Number(androidTestRunID.runID), testCasesToSend)
        await api.updateRun(Number(iosTestRunId.runID), testCasesToSend)
        console.log(
          'Test cases have been sent to the test run...' +
            JSON.stringify(testCasesToSend)
        )
      } catch (TestRailException) {
        console.log(
          'Invalid test case ids found in ' +
            testCasesToSend +
            'test cases sent'
        )
      }
    } else {
      console.log('Updating the existing test case results...')
    }
  }
  return casesToAddToRun
}

export default async function sendResults() {
  const casesToAddToRun = await prepareResults()
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

  // Sends the results to testrail using the resultsToSendToTestrail array if POST_TO_TESTRAIL env variable set to true
  if (process.env.POST_TO_TESTRAIL) {
    await generateAndroidsResults(resultsToSendToTestrail)
    await generateIosResults(resultsToSendToTestrail)
  }
}

async function generateAndroidsResults(resultsToSendToTestrail: any[]) {
  const androidRunId = await getAndroidTestRunId()

  try {
    // const resultsObject = await api.addResultsForCases(runId, resultsContent)
    const androidResultArray = resultsToSendToTestrail.filter(
      result => result.platform === 'android'
    )

    for (let i = 0; i < androidResultArray.length; i++) {
      const resultObject = androidResultArray[i]
      const payload = {
        status_id: resultObject?.status_id
      }
      if (resultObject) {
        const testResult = await api.addResultForCase(
          Number(androidRunId.runID),
          resultObject?.case_id,
          payload
        )
        if (testResult.status_id === 5) {
          const failScreenshot = `./e2e/artifacts/android/${resultObject.screenshot}`
          if (failScreenshot) {
            const failedPayload = {
              name: 'failed.png',
              value: fs.createReadStream(failScreenshot)
            }
            console.log('attachment to be sent!!!')
            const attachmentID = await api.addAttachmentToResult(
              testResult.id,
              failedPayload
            )
            console.log(`${attachmentID} is the attachment ID...`)
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

async function generateIosResults(resultsToSendToTestrail: any[]) {
  const iosTestRunId = await getIosTestRunId()

  try {
    // const resultsObject = await api.addResultsForCases(runId, resultsContent)
    const iosResultArray = resultsToSendToTestrail.filter(
      result => result.platform === 'ios'
    )

    for (let i = 0; i < iosResultArray.length; i++) {
      const resultObject = iosResultArray[i]
      const payload = {
        status_id: resultObject?.status_id
      }
      if (resultObject) {
        const testResult = await api.addResultForCase(
          Number(iosTestRunId.runID),
          resultObject?.case_id,
          payload
        )
        if (testResult.status_id === 5) {
          const failScreenshot = `./e2e/artifacts/ios/${resultObject.screenshot}`
          if (failScreenshot) {
            const failedPayload = {
              name: 'failed.png',
              value: fs.createReadStream(failScreenshot)
            }
            const attachmentID = await api.addAttachmentToResult(
              testResult.id,
              failedPayload
            )
            console.log(`${attachmentID} is the attachment ID...`)
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
