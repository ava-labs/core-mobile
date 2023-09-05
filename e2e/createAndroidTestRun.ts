/* eslint-disable @typescript-eslint/no-explicit-any */
import { createEmptyTestRun } from './generateTestrailObjects'
const fs = require('fs')

export async function createAndroidTestRun() {
  const timestamp = generateUtcTimestamp()
  const runID = createEmptyTestRun('Android', timestamp)
  return runID
}

export async function writeRunIdToTextFile(runId: string) {
  fs.writeFile('./e2e/testrailRunID.txt', runId, (err: any) => {
    if (err) throw err
  })
}

export function generateUtcTimestamp() {
  const utcDate = new Date().getUTCDate().toString()
  return utcDate
}

writeRunIdToTextFile(`${createAndroidTestRun()}`)
