/* eslint-disable @typescript-eslint/no-explicit-any */
import { createEmptyTestRun } from './generateTestrailObjects'
import { testRunTimestamp } from './getResultsFromLogs'
const fs = require('fs')

export async function createAndroidTestRun() {
  const timestamp = await testRunTimestamp('Android')
  const runID = createEmptyTestRun('Android', timestamp)
  return runID
}

export async function writeRunIdToTextFile(runId: string) {
  fs.writeFile('e2e/testrailRunID.txt', runId, (err: any) => {
    if (err) throw err
  })
}

writeRunIdToTextFile(`${createAndroidTestRun()}`)
