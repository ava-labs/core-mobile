/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck comment at the top of the file
/* eslint-disable no-var */
// import * as fs from 'fs'
import {
  getTestCaseId,
  api,
  createNewTestSectionsAndCases
} from './generateTestrailObjects'
import getTestLogs, { isResultPresent } from './getResultsFromLogs'
const fs = require('fs')
const path = require('path')

async function parseResultsFile() {
  const jsonResultsArray = await getTestLogs()

  await createNewTestSectionsAndCases(jsonResultsArray)

  const testIdArrayForTestrail = []
  const casesToAddToRun = []
  for (const result of jsonResultsArray) {
    // Todo add more status ids for different results such as skipped tests or untested
    const statusId = result.testResult

    const testName = result.testCase
    const testCaseId = await getTestCaseId(result.testCase)
    const platform = result.platform
    const screenshot = result.screen_shot

    if (testCaseId !== null) {
      testIdArrayForTestrail.push(testCaseId)
      casesToAddToRun.push({
        test_id: testCaseId,
        status_id: statusId,
        test_name: testName,
        platform: platform,
        screen_shot: screenshot
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
  casesToAddToRun.forEach(testCaseResultObject => {
    var testRunCaseStatusId = testCaseResultObject.status_id
    var testId = testCaseResultObject.test_id
    var platform = testCaseResultObject.platform
    var testCaseName = testCaseResultObject.test_name
    var screenshot = testCaseResultObject.screen_shot

    // Sends a passed test to testrail with no comment
    resultsToSendToTestrail.push({
      case_id: testId,
      status_id: testRunCaseStatusId,
      platform: platform,
      test_name: testCaseName,
      screenshot: screenshot
    })
  })
  // } else {
  //   // If the test failed then it adds the error stack as a comment to the test case in testrail
  //   // var failedTest = await this.getLogFilesForFailedTests(testCaseName)
  //   // var errorMessage = fs.readFileSync(`./output_logs/${failedTest}`, 'utf8')
  //   resultsToSendToTestrail.push({
  //     case_id: testId,
  //     status_id: testRunCaseStatusId,
  //     screenshot: screenshot,
  //     platform: platform
  //     //comment: `${errorMessage}`
  //   })
  // }
  // }
  return { resultsToSendToTestrail, testCasesToSend }
}

export default async function sendResults() {
  const preparedFinalResults = await prepareFinalResults()
  const testCasesToSend = preparedFinalResults.testCasesToSend
  const resultsToSendToTestrail = preparedFinalResults.resultsToSendToTestrail

  if (process.env.POST_TO_TESTRAIL === 'true') {
    if (await isResultPresent('android')) {
      const runID = process.env.TESTRAIL_RUN_ID
      console.log('The run id is ' + runID)
      await generatePlatformResults(
        testCasesToSend,
        resultsToSendToTestrail,
        'android',
        Number(runID)
      )
    }
    if (await isResultPresent('ios')) {
      const runID = Number(process.env.IOS_TESTRAIL_RUN_ID)
      console.log('The run id is ' + runID)
      await generatePlatformResults(
        testCasesToSend,
        resultsToSendToTestrail,
        'ios',
        runID
      )
    }
  } else {
    console.log(
      'POST_TO_TESTRAIL is false, skipping sending results to TestRail',
      process.env.POST_TO_TESTRAIL
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
// eslint-disable-next-line max-params
async function generatePlatformResults(
  testCasesToSend: any,
  resultsToSendToTestrail: [],
  platform: string,
  runId?: number
) {
  try {
    var resultArray = resultsToSendToTestrail
    // Gets the existing test cases in the test run
    // const existingTestCases = await getTestCasesFromRun(runId)
    // Adds the existing test case results to the results array so they are not overwritten in testrail when using the updateRun endpoint
    // resultArray = resultArray.concat(existingTestCases)
    // Add already existing test cases to the testCasesToSend array
    // Takes the array of test cases and adds them to the test run
    await api.updateRun(Number(runId), testCasesToSend)
  } catch (TestRailException) {
    console.log(
      'Invalid test case ids found in ' +
        testCasesToSend.case_ids +
        ' with run id ' +
        Number(runId)
    )
  }

  const testResults = []
  const failedTests = []
  for (let i = 0; i < resultArray.length; i++) {
    const resultObject = resultArray[i]
    const statusId = Number(resultObject?.status_id)
    const comment = `Test case result for ${resultObject?.case_id} and has a status of ${statusId} for ${platform}`
    const testName = resultObject?.test_name
    const screenshot = resultObject?.screenshot

    const failedTest = {
      case_id: resultObject?.case_id,
      status_id: statusId,
      comment: comment,
      test_name: testName,
      screenshot: screenshot
    }

    if (statusId === 5) {
      failedTests.push(failedTest)
    }

    const testResult = {
      case_id: resultObject?.case_id,
      status_id: statusId,
      comment: comment
    }
    testResults.push(testResult)
  }

  // Send the results to testrail
  await api.addResultsForCases(Number(runId), {
    results: testResults
  })

  // Adds the screenshot to the test case in testrail if the test failed
  for (let i = 0; i < failedTests.length; i++) {
    if (failedTests[i].status_id === 5 && failedTests[i].screenshot) {
      // This is the path to the screenshot for when the test fails
      const failScreenshot = path.resolve(
        `./e2e/artifacts/${platform}/${failedTests[i].screenshot}`
      )
      if (failScreenshot) {
        const failedPayload = {
          name: 'failed.png',
          value: await fs.createReadStream(failScreenshot)
        }
        // Attaches the screenshot to the corressponding case in the test run
        await api.addAttachmentToCase(failedTests[i].case_id, failedPayload)
      }
    }
  }
}
