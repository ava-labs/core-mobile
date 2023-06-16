/* eslint-disable @typescript-eslint/no-explicit-any */
import { readdir } from 'fs/promises'
require('ts-node').register()
// import * as fs from 'fs'
// import path from 'path'

export const getDirectories = async (source: any) =>
  (await readdir(source, { withFileTypes: true }))
    .filter((dirent: { isDirectory: () => any }) => dirent.isDirectory())
    .map((dirent: { name: any }) => dirent.name)

export default async function getTestLogs() {
  type TestResult = {
    sectionName?: string
    subsection?: string
    testCase?: string
    platform?: string
    testResult?: string
    failedScreenshot?: string
  }
  const folders: any = await getDirectories('./e2e/artifacts/')
  const testResults: Array<TestResult> = []

  for (let i = 0; i < folders.length; i++) {
    const nonSplitFolders = await getDirectories(
      `./e2e/artifacts/${folders[i]}`
    )
    const splitFolder: string[] | undefined = nonSplitFolders[0]?.split('.')
    const platform = splitFolder
      ? splitFolder[0]
      : console.log('Why is there not splitfolder? ' + nonSplitFolders)

    if (splitFolder) {
      const resultFolders: string[] = await getDirectories(
        `./e2e/artifacts/${folders[i]}`
      )
      // We want to grab the last folder in the directory and that's what parsed folder is
      const parsedResultFolder = resultFolders[resultFolders.length - 1]
      const attachmentFolders = await getDirectories(
        `./e2e/artifacts/${folders[i]}/${parsedResultFolder}`
      )
      for (const result of attachmentFolders) {
        const splitTestFolder = await splitTestResult(result)
        if (result?.includes('✓')) {
          const testResult = 'passed'
          if (splitTestFolder) {
            Object.assign(splitTestFolder, {
              testResult: testResult,
              platform: platform
            })
            testResults.push(splitTestFolder)
          }
        } else if (result?.includes('✗')) {
          const testResult = 'failed'
          if (splitTestFolder) {
            Object.assign(splitTestFolder, {
              testResult: testResult,
              platform: platform,
              failedScreenshot: `${parsedResultFolder}/${result}/testDone.png`
            })
            testResults.push(splitTestFolder)
          }
        }
      }
    } else {
      console.log(
        'There may not be a folder for android or ios yet. Dont worry about this!'
      )
    }
  }
  return testResults
}

export const getScreenshotOnFailure = async (imagePath: string) => {
  const failedTestFolders = await getDirectories(imagePath)
  const testFolder = failedTestFolders[0]
  const firstFailedTestFolder = await getDirectories(
    `${imagePath}/${testFolder}`
  )
  for (let i = 0; i < firstFailedTestFolder.length; i++) {
    if (firstFailedTestFolder[i]?.includes('✗')) {
      const filePath = `./e2e/artifacts/${testFolder}/${firstFailedTestFolder[i]}`
      return `${filePath}/testDone.png`
    }
  }
}

async function splitTestResult(testItem: string | undefined) {
  const shouldTxt = 'should'
  const regEscape = (v: string) => v.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
  const splitTestArrayItem = testItem?.split(
    new RegExp(regEscape(shouldTxt), 'ig')
  )
  //const splitTestArrayItem = testItem?.split('should')
  if (splitTestArrayItem) {
    const rawSectionName = splitTestArrayItem[0]
    const testCase = 'Should' + splitTestArrayItem[1]
    const sectionName = removeTestSectionExtraChars(rawSectionName)
    const trimmedSectionName = sectionName?.trim()
    return { sectionName: trimmedSectionName, testCase }
  }
}

function removeTestSectionExtraChars(testSection: string | undefined) {
  if (testSection) {
    const splitTestSection = testSection.split(' ')
    const rejoinedString = splitTestSection.slice(1).join(' ')
    return rejoinedString
  } else {
    console.log('Test section is undefined, something went wrong!!!')
  }
}

export const testDirectory = async () => {
  const directory = await getDirectories('./e2e/artifacts/ios')
  return directory[0]
}
