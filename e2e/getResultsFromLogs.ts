import { readdir } from 'fs/promises'

interface TestResult {
  sectionName?: string
  subsection?: string
  testCase?: string
  platform?: string
  testResult?: string
  failedScreenshot?: string
}

export const getDirectories = async (source: string) =>
  (await readdir(source, { withFileTypes: true }))
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

export default async function getTestLogs() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const folders: any = await getDirectories('./e2e/artifacts')
  const testResults: Array<TestResult> = []

  for (let i = 0; i < folders.length; i++) {
    if (folders) {
      const splitFolder = folders[i].split('.')
      const platform = splitFolder[0]

      const resultFolders: string[] = await getDirectories(
        `./e2e/artifacts/ios/${folders[i]}`
      )

      for (let a = 0; a < resultFolders.length; a++) {
        const parsedResultFolder = resultFolders[a]
        const splitTestFolder = splitTestResult(parsedResultFolder)
        if (parsedResultFolder?.includes('✓')) {
          const testResult = 'passed'
          if (splitTestFolder) {
            Object.assign(splitTestFolder, {
              testResult: testResult,
              platform: platform
            })
            testResults.push(splitTestFolder)
          }
        } else if (parsedResultFolder?.includes('✗')) {
          const testResult = 'failed'
          if (splitTestFolder) {
            Object.assign(splitTestFolder, {
              testResult: testResult,
              platform: platform,
              failedScreenshot: `${parsedResultFolder}/testDone.png`
            })
            testResults.push(splitTestFolder)
          }
        }
      }
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
      console.log(`${filePath}/testDone.png`)
      return `${filePath}/testDone.png`
    }
  }
}

function splitTestResult(testItem: string | undefined) {
  const splitTestArrayItem = testItem?.split('should')
  if (splitTestArrayItem) {
    const rawSectionName = splitTestArrayItem[0]
    const testCase = 'should' + splitTestArrayItem[1]
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
  console.log(directory)
  return directory[0]
}

console.log(global.platform)
