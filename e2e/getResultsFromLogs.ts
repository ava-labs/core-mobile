/* eslint-disable @typescript-eslint/no-explicit-any */
import { readdir } from 'fs/promises'
require('ts-node').register()
const fsPromises = require('fs').promises
const path = require('path')

export const getDirectories = async (source: any): Promise<any[]> =>
  (await readdir(source, { withFileTypes: true }))
    .filter((dirent: { isDirectory: () => any }) => dirent.isDirectory())
    .map((dirent: { name: any }) => dirent.name)

async function readdirChronoSorted(dirpath: any, order: any): Promise<any[]> {
  order = order || 1
  const files = await fsPromises.readdir(dirpath)
  const stats = await Promise.all(
    files.map((filename: any) =>
      fsPromises
        .stat(path.join(dirpath, filename))
        .then((stat: { mtime: any }) => ({ filename, mtime: stat.mtime }))
    )
  )
  return stats
    .sort((a, b) => order * (b.mtime.getTime() - a.mtime.getTime()))
    .map(stat => stat.filename)
}

export default async function getTestLogs(): Promise<
  {
    sectionName?: string
    testCase?: string
    subsection?: string
    platform?: string
  }[]
> {
  const folders = await getDirectories('./e2e/artifacts/')
  const testResults = []

  for (let i = 0; i < folders.length; i++) {
    const nonSplitFolders = await getDirectories(
      `./e2e/artifacts/${folders[i]}`
    )
    const splitFolder = nonSplitFolders[0]?.split('.')
    if (!splitFolder) {
      console.log('Why is there not splitfolder? ' + nonSplitFolders)
      console.log(
        'There may not be a folder for android or ios yet. Dont worry about this!'
      )
      return []
    }
    const platform = splitFolder[0]
    const resultFolders = await readdirChronoSorted(
      `./e2e/artifacts/${folders[i]}`,
      -1
    )

    const parsedResultFolder = resultFolders[resultFolders.length - 1]
    const attachmentFolders = await getDirectories(
      `./e2e/artifacts/${folders[i]}/${parsedResultFolder}`
    )
    for (const result of attachmentFolders) {
      const splitTestFolder = await splitTestResult(result)
      const testResult = result?.includes('✓') ? 'passed' : 'failed'
      const failedScreenshot =
        testResult === 'failed'
          ? `${parsedResultFolder}/${result}/testDone.png`
          : undefined
      if (splitTestFolder) {
        Object.assign(splitTestFolder, {
          testResult: testResult,
          platform: platform,
          failedScreenshot
        })
        testResults.push(splitTestFolder)
      }
    }
  }
  return testResults
}

export const getScreenshotOnFailure = async (
  imagePath: string
): Promise<string | undefined> => {
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

async function splitTestResult(testItem: string | undefined): Promise<
  | {
      sectionName: string | undefined
      testCase: string | undefined
    }
  | undefined
> {
  const shouldTxt = 'should'
  const regEscape = (v: string): string =>
    v.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
  const splitTestArrayItem = testItem?.split(
    new RegExp(regEscape(shouldTxt), 'ig')
  )
  //const splitTestArrayItem = testItem?.split('should')
  if (splitTestArrayItem) {
    const rawSectionName = splitTestArrayItem[0]
    const testCase = 'Should' + splitTestArrayItem[1]
    if (testCase.includes('(')) {
      const splitTestCase = testCase.split('(')
      const rejoinedString = splitTestCase[0]
      const trimmedTestCase = rejoinedString?.trim()
      const sectionName = removeTestSectionExtraChars(rawSectionName)
      const trimmedSectionName = sectionName?.trim()
      return { sectionName: trimmedSectionName, testCase: trimmedTestCase }
    }
    const sectionName = removeTestSectionExtraChars(rawSectionName)
    const trimmedSectionName = sectionName?.trim()
    return { sectionName: trimmedSectionName, testCase }
  }
}

function removeTestSectionExtraChars(
  testSection: string | undefined
): string | undefined {
  if (testSection) {
    const splitTestSection = testSection.split(' ')
    return splitTestSection.slice(1).join(' ')
  } else {
    console.log('Test section is undefined, something went wrong!!!')
  }
}

export async function isResultPresent(platform: any): Promise<boolean> {
  try {
    const resultsFolder = await getDirectories(`./e2e/artifacts/${platform}`)
    if (resultsFolder.length > 0) {
      return true
    } else {
      console.log(
        `No results were found for ${platform} so not sending anything to testrail...`
      )
      return false
    }
  } catch (error) {
    console.log(
      `No results folder found for ${platform} so nothing the send to testrail...`
    )
    return false
  }
}

export async function isSmokeTestRun(platform: any): Promise<boolean> {
  try {
    const parsedTestRunName = await parseTestRun(platform)
    if (parsedTestRunName.includes('smoke')) {
      console.log('Its a smoke test run!!!')
      return true
    } else {
      console.log('Its a regression run!!!')
      return false
    }
  } catch (error) {
    console.log(
      `No ${platform} folder found so not sending any results to testrail!!!`
    )
    return false
  }
}

export const testRunTimestamp = async (platform: any): Promise<any> => {
  const testRunFolder = await parseTestRun(platform)
  return testRunFolder[testRunFolder.length - 1]
}

export async function parseTestRun(platform: any): Promise<any> {
  const folders: any = await getDirectories(`./e2e/artifacts/${platform}`)
  return folders[folders.length - 1].split('.')
}
