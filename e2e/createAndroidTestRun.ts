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
  const date = new Date()
  const utcDate = new Date(
    date.getTime() + date.getTimezoneOffset() * 60000
  ).toISOString()
  return utcDate
}

writeRunIdToTextFile(`${createAndroidTestRun()}`)
