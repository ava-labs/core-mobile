/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck comment at the top of the file
import * as fs from 'fs'
import {
  getTestCaseId,
  api,
  createNewTestSectionsAndCases,
  getTestCasesFromRun,
  currentRunID
} from './generateTestrailObjects'
import getTestLogs, { isResultPresent } from './getResultsFromLogs'
const fs = require('fs')

async function parseResultsFile() {
  const jsonResultsArray = await getTestLogs()

  await createNewTestSectionsAndCases(jsonResultsArray)

  const testIdArrayForTestrail = []
  const casesToAddToRun = []
  for (const result of jsonResultsArray) {
    // Todo add more status ids for different results such as skipped tests or untested
    const statusId = result.testResult
    const failedScreenshot = result.failedScreenshot

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
  const resultsToSendObject = await parseResultsFile()

  const testIdArrayForTestrail = resultsToSendObject.testIdArrayForTestrail
  const casesToAddToRun = resultsToSendObject.casesToAddToRun

  const uniqueCaseIdArray = [...new Set(testIdArrayForTestrail)]

  // Payload for testrail to add the casses to the test run before the results are sent
  const testCasesToSend = {
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

  const resultsToSendToTestrail = []

  // This takes the array of tests in the test run and applies the results to each of the tests
  for (const testCaseResultObject of casesToAddToRun) {
    const testRunCaseStatusId = testCaseResultObject.status_id
    const testId = testCaseResultObject.test_id
    const screenshot = testCaseResultObject.failed_screenshot
    const platform = testCaseResultObject.platform
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

  if (await isResultPresent('android')) {
    const runID = process.env.TESTRAIL_RUN_ID
    console.log('The run id is ' + runID)
    await generatePlatformResults(
      testCasesToSend,
      resultsToSendToTestrail,
      'android'
    )
  }
  if (await isResultPresent('ios')) {
    const runID = (await currentRunID('ios')).runID
    console.log('The run id is ' + runID)
    await generatePlatformResults(
      testCasesToSend,
      resultsToSendToTestrail,
      'ios',
      runID
    )
  }
}

// Todo: Write a check for a different result and if the existing result differs from the result being sent update the result in testrail
// Checks to see if a result already exists in testrail
export async function isResultExistsInTestrail(runID: number, caseId: number) {
  const caseDetails = await api.getResultsForCase(runID, caseId)
  if (caseDetails.length > 0) {
    return !(caseDetails[0].status_id === 5 && caseDetails.length < 2)
  } else {
    return false
  }
}

// Updates the results for an existing test run or an empty test run
// eslint-disable-next-line sonarjs/cognitive-complexity
async function generatePlatformResults(
  testCasesToSend: any,
  resultsToSendToTestrail: [],
  platform: string,
  runID?: number
) {
  try {
    const resultArray = resultsToSendToTestrail.filter(
      result => result.platform === platform
    )
    try {
      const existingTestCases = await getTestCasesFromRun(runID)
      // Adds the existing test case results to the results array so they are not overwritten in testrail when using the updateRun endpoint
      existingTestCases.forEach((testCase: any) => {
        resultArray.forEach((result: any) => {
          if (testCase.case_id !== result.case_id && testCase.status_id !== 3) {
            resultArray.push(testCase)
          }
        })
      })

      // Add already existing test cases to the testCasesToSend array
      if (resultArray.length > 0) {
        resultArray.forEach((testCase: object) => {
          testCasesToSend.case_ids.push(Number(testCase.case_id))
        })
      }

      const uniqueCaseIdArray = [...new Set(testCasesToSend.case_ids)]
      const testCasePayload = {
        include_all: false,
        case_ids: uniqueCaseIdArray
      }
      // Takes the array of test cases and adds them to the test run
      await api.updateRun(Number(runID), testCasePayload)
      console.log(
        'Test cases have been sent to the test run...' + uniqueCaseIdArray
      )
    } catch (TestRailException) {
      console.log(
        'Invalid test case ids found in ' +
          uniqueCaseIdArray +
          ' with run id ' +
          runID
      )
    }

    const testResults = []
    for (let i = 0; i < resultArray.length; i++) {
      const resultObject = resultArray[i]
      const statusId = resultObject?.status_id
      const comment = `Test case result for ${resultObject?.case_id} and has a status of ${statusId}`

      if (resultObject) {
        const testResult = {
          case_id: Number(resultObject?.case_id),
          status_id: statusId,
          comment: comment
        }
        if (testResult !== undefined) {
          testResults.push(testResult)
        }
      }
    }

    // Send the results to testrail
    await api.addResultsForCases(Number(runID), { results: testResults })

    // Adds the screenshot to the test case in testrail if the test failed
    for (let i = 0; i < testResults.length; i++) {
      if (testResults[i].status_id === 5) {
        // This is the path to the screenshot for when the test fails
        const failScreenshot = `./e2e/artifacts/${platform}/${testResults[i].screenshot}`
        if (failScreenshot) {
          const failedPayload = {
            name: 'failed.png',
            value: await fs.createReadStream(failScreenshot)
          }
          // Attaches the screenshot to the corressponding case in the test run
          const attachmentID = await api.addAttachmentToResult(
            testResults[i]?.status_id,
            failedPayload
          )
          console.log(`${attachmentID.attachment_id} is the attachment ID...`)
        }
      }
    }
  } catch (error) {
    console.log(error)
  }
}
