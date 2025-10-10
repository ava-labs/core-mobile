/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/no-explicit-any */

import TestRail from 'testrail-api'
import getTestLogs, {
  isSmokeTestRun,
  testRunTimestamp
} from './getResultsFromLogs'
const fs = require('fs')

const projectId = 3
const password = String(process.env.TESTRAIL_API_KEY)

export var api = new TestRail({
  host: 'https://avalabs.testrail.net',
  username: 'mobiledevs@avalabs.org',
  password: password
})

export async function createEmptyTestRun(
  testRunName: string,
  description: string
) {
  const content = {
    name: testRunName,
    description: description,
    include_all: false
  }

  try {
    const testRun = await api.addRun(projectId, content)
    console.log(
      `The test run "${testRunName}" with id ${testRun.id} has been successfully created in TestRail...`
    )
    return testRun.id
  } catch (error) {
    console.error('Test run was not created!!!')
    console.log(error)
  }
}

export async function getRunIdFromName() {
  const todaysDate = new Date()

  const midnight = todaysDate.setHours(0, 0, 0, 0) / 1000

  const content = {
    created_after: midnight
  }
  const myRun = await api.getRuns(projectId, content)

  return myRun[0]?.id
}

export async function getTestCaseId(testCaseName: any) {
  const content = {
    filter: testCaseName
  }

  const my_case = await api.getCases(projectId, content)
  if (my_case[0] !== undefined) {
    return my_case[0].id
  } else {
    return null
  }
}

async function createTestCase(sectionID: any, title: any) {
  const content = {
    title: title
  }
  console.log(`${title} is a new test case and was added to the test suite`)
  await api.addCase(sectionID, content)
}

async function getAllSectionsFromTestrail() {
  const sections = await api.getSections(projectId)
  const sectionNamesAndIds: { sectionName: any; sectionID: any }[] = []
  sections.forEach(function (section: { name: any; id: any }) {
    const sectionName = section.name
    const sectionID = section.id
    sectionNamesAndIds.push({ sectionName, sectionID })
  })
  // console.log(sectionNamesAndIds)
  return sectionNamesAndIds
}

// Creates new test section in TestRail
async function createNewTestSection(sectionName: any) {
  const content = {
    name: sectionName
  }
  console.log(
    `${content.name} is a new section and has been added to the test suite`
  )
  await api.addSection(projectId, content)
}

// Todo grab the test case names using the method
export async function sectionsAndCases() {
  const rawSectionsAndCases = await getTestLogs()
  const testCaseSectionsAndCases = []

  for await (const test of rawSectionsAndCases) {
    const sectionName: any = test.sectionName
    const subsection: any = test.subsection
    const testCase = test.testCase
    const platform = test.platform

    const testCaseObject = { sectionName, subsection, testCase, platform }

    testCaseSectionsAndCases.push(testCaseObject)
  }
  return testCaseSectionsAndCases
}

// Function to create new test cases based on the test run and compares them to what's in TestRail
export async function createNewTestSectionsAndCases(casesArray: any) {
  const theTestrailSections = await getSectionsFromTestRail()
  const casesAndSections = await casesArray

  // Gets the sections and subsections from the test run
  const sectionsAndSubsections = getSectionsAndSubsFromTestRun(casesAndSections)

  const sectionNames: any[] = []
  sectionsAndSubsections.forEach(async function (section) {
    sectionNames.push(section.section)
  })

  // Creates an object of the existing sections and subsections from testrail

  var testrailSectionsAndSubsections =
    sectionsAndSubsectionsTestrail(theTestrailSections)

  createNewSections(testrailSectionsAndSubsections, sectionNames)

  const subsectionsToAddSet: any[] = []

  const sections = await getSectionsFromTestRail()

  var testrailSectionsAndSubsections = sectionsAndSubsectionsTestrail(sections)
  // If a section already exists in testrail this checks to see if there are any new subsections that need to be added
  createNewSubsections(
    testrailSectionsAndSubsections,
    sectionsAndSubsections,
    subsectionsToAddSet
  )

  const newTCTitlesToAdd = await newTCTitles()
  const allTestrailSections = await getAllSectionsFromTestrail()

  await createTestCases(newTCTitlesToAdd, allTestrailSections)
  return theTestrailSections
}

function getSectionsAndSubsFromTestRun(casesAndSections: any[]) {
  const output: { testRunSection: any; testSubsection: any }[] = []

  casesAndSections.forEach(function (caseAndSection: {
    sectionName: any
    subsection: any
  }) {
    const testRunSection = caseAndSection.sectionName
    const testSubsection = caseAndSection.subsection
    output.push({ testRunSection, testSubsection })
  })

  // Puts the sections from the test run into an array and removes any duplicates
  const testRunSections: any[] = []
  output.forEach(function (outputObject) {
    testRunSections.indexOf(outputObject.testRunSection) === -1
      ? testRunSections.push(outputObject.testRunSection)
      : undefined
  })

  // Creates an object for each of the sections and the corresponding subsections
  const sectionsAndSubsections: { section: any; subsections: any[] }[] = []
  testRunSections.forEach(function (section) {
    const subsections: any[] = []
    output.forEach(function (subsectionItem) {
      if (subsectionItem.testRunSection === section) {
        subsections.indexOf(subsectionItem.testSubsection) === -1
          ? subsections.push(subsectionItem.testSubsection)
          : undefined
      }
    })
    sectionsAndSubsections.push({ section, subsections })
  })

  return sectionsAndSubsections
}

function createNewSections(
  testrailSectionsAndSubsections: any[],
  sectionNames: any[]
) {
  const testrailSectionNames: any[] = []
  testrailSectionsAndSubsections.forEach(function (testrailSection) {
    testrailSectionNames.push(testrailSection.testrailSection)
  })

  // const newSections: any[] = []
  const newSections = sectionNames.filter(function (section) {
    return testrailSectionNames.indexOf(section) === -1
  })

  // Adds any new sections found to testrail
  const uniqueSectionsSet = new Set(newSections)
  const uniqueSections = [...uniqueSectionsSet]
  uniqueSections.forEach(async function (newSectionName) {
    try {
      await createNewTestSection(newSectionName)
    } catch (error) {
      console.log(newSectionName + ' newSectionName error found!!!')
    }
  })
}

function createNewSubsections(
  testrailSectionsAndSubsections: any[],
  sectionsAndSubsections: any[],
  subsectionsToAddSet: any[]
) {
  testrailSectionsAndSubsections.forEach(function (testrailSection: any) {
    sectionsAndSubsections.forEach(function (section: any) {
      if (section.section === testrailSection.testrailSection) {
        // Check for any new subsections
        const checkedSubsections = section.subsections
        const checkedTestrailSubsections = testrailSection.testrailSubsections
        checkedSubsections.forEach(function (newSubsection: string) {
          // If the subsection is not in the checkedTestrailSubsections array it's new and appended to the subsectionsToAdd array
          if (checkedTestrailSubsections.indexOf(newSubsection) === -1) {
            const testrailSectionID = testrailSection.sectionID
            subsectionsToAddSet.push({ newSubsection, testrailSectionID })
          }
        })
      }
    })
  })

  subsectionsToAddSet.forEach(async function (subsection) {
    if (subsection.newSubsection !== undefined) {
      const subsectionName = subsection.newSubsection
      const sectionID = subsection.testrailSectionID
      await createSubsection(sectionID, subsectionName)
      console.log(
        `${subsectionName} is a new subsection and was added to the test suite`
      )
    }
  })
}

function sectionsAndSubsectionsTestrail(sections: any) {
  const testrailSectionsAndSubsections: {
    testrailSection: any
    testrailSubsections: any[]
    sectionID: any
  }[] = []
  sections.forEach(function (arrayItem: { name: any; children: any; id: any }) {
    const testrailSection = arrayItem.name
    const subsection = arrayItem.children
    const sectionID = arrayItem.id
    const testrailSubsections = []
    for (let i = 0; i < subsection.length; i++) {
      const convSubsection = JSON.parse(subsection[i])
      testrailSubsections.push(convSubsection.name)
    }
    testrailSectionsAndSubsections.push({
      testrailSection,
      testrailSubsections,
      sectionID
    })
  })
  return testrailSectionsAndSubsections
}

async function newTCTitles() {
  const testCasesFromTestrail = await getAllTestCasesFromTestrail()
  const allTestCasesFromTestRun = await testCasesFromTestRun()

  const allTestCaseTitlesFromRun: { testTitle: any; testSection: any }[] = []
  const theNewTCTitles = []

  allTestCasesFromTestRun.forEach(function (title) {
    const testTitle = title.testCase
    const testSection = title.sectionName
    allTestCaseTitlesFromRun.push({ testTitle, testSection })
  })

  // eslint-disable-next-line sonarjs/no-ignored-return
  allTestCaseTitlesFromRun.filter(function (item) {
    testCasesFromTestrail.indexOf(item.testTitle) === -1
      ? theNewTCTitles.push(item)
      : undefined
  })
  return allTestCaseTitlesFromRun
}

async function createSubsection(parentID: number, sectionName: string) {
  const content = {
    parent_id: parentID,
    name: sectionName
  }
  await api.addSection(projectId, content)
}

async function getSectionsFromTestRail() {
  const sections = await api.getSections(projectId)
  const children: any[] = []

  sections.forEach(function (arrayItem) {
    if (arrayItem.parent_id !== null) {
      children.push(arrayItem)
    }
  })

  sections.forEach(function (childArrayItem) {
    const childArray: string[] = []
    children.forEach(function (theChildItem) {
      if (theChildItem.parent_id === childArrayItem.id) {
        childArray.push(JSON.stringify(theChildItem))
      }
    })
    childArrayItem.children = childArray
  })

  sections.forEach(function (item) {
    if (item.parent_id !== null) {
      const index = sections.indexOf(item)
      delete sections[index]
    }
  })
  // console.log(sections)
  return sections
}

async function getAllTestCasesFromTestrail() {
  const tcArray: any[] = []
  const cases = await api.getCases(projectId)
  cases.forEach(function (testCase: { title: any }) {
    const testCaseTitle = testCase.title
    tcArray.push(testCaseTitle)
  })
  // console.log(tcArray)
  return tcArray
}

async function testCasesFromTestRun() {
  const casesArray: {
    testCase?: string
    subsection: string
    sectionName: string
  }[] = []
  const casesAndSections = await sectionsAndCases()
  casesAndSections.forEach(function (caseAndSection) {
    // console.log(JSON.stringify(caseAndSection) + ' this is caseAndSection')
    const testCase = caseAndSection.testCase
    const subsection = caseAndSection.subsection
    const sectionName = caseAndSection.sectionName
    casesArray.push({ testCase, sectionName, subsection })
  })
  // console.log(JSON.stringify(casesArray) + ' cases from test run are here!')
  return casesArray
}

async function createTestCases(
  testRunNames: Array<any>,
  testrailSections: Array<any>
) {
  const noDupsTCs: { sectionID: any; testTitle: any }[] = []
  testRunNames.forEach(function (testCase) {
    testrailSections.forEach(function (testrailCase) {
      if (testCase.testSection === testrailCase.sectionName) {
        const sectionID = testrailCase.sectionID
        const testTitle = testCase.testTitle
        noDupsTCs.push({ sectionID, testTitle })
      }
    })
  })
  // console.log(noDupsTCs + ' test run names')
  // Removes the duplicates from the array of objects due to an edge case where two subsections from different sections could have the same title
  noDupsTCs.forEach(async function (testCase) {
    const myNewTestCases = []
    const sectionID = testCase.sectionID
    const myTestCaseTitle = testCase.testTitle
    const testCasesInSection = await getTestCasesBySection(sectionID)
    // console.log(myTestCaseTitle)
    const index = testCasesInSection.findIndex(
      x => x.testCaseTitle === myTestCaseTitle && x.sectionID === sectionID
    )
    index === -1
      ? myNewTestCases.push({ myTestCaseTitle, sectionID })
      : undefined
    myNewTestCases.forEach(async function (newTestCase) {
      const testCaseName = newTestCase.myTestCaseTitle
      const testCaseSection = newTestCase.sectionID
      await createTestCase(testCaseSection, testCaseName)
    })
  })
}

// Gets all the test cases in testrail for the project id and the section id specified
async function getTestCasesBySection(section_id: number) {
  const tcArray: { testCaseTitle: any; sectionID: any }[] = []

  const content = {
    section_id: section_id
  }
  const cases = await api.getCases(projectId, content)

  cases.forEach(function (arrayItem: { title: any; section_id: any }) {
    const testCaseTitle = arrayItem.title
    const sectionID = arrayItem.section_id
    // console.log(tCtitle)
    tcArray.push({ testCaseTitle, sectionID })
  })
  return tcArray
}

//getTestCasesBySection(518)

export async function deleteEmptyTestSections() {
  const sections = await api.getSections(projectId)
  sections.forEach(async function (section: { name: any; id: any }) {
    const sectionName = section.name
    const sectionID = section.id
    try {
      const cases = await getTestCasesBySection(sectionID)
      if (cases.length === 0) {
        console.log(sectionName + ' is empty and will be deleted!!!')
        await api.deleteSection(sectionID)
      }
    } catch (error) {
      console.log(error)
    }
  })
}
// only run this if a mistake was made and emtpy sections were created
// deleteEmptyTestSections()

export async function getTestRunCases(testRunId: any) {
  const cases = await api.getTests(testRunId)
  const caseTitles: {
    caseTitle: string
    testRunCaseId: number
    result: number
  }[] = []
  cases.forEach(
    (testRunCase: { title: string; id: number; status_id: number }) => {
      const caseTitle = testRunCase.title
      const testRunCaseId = testRunCase.id
      const result = testRunCase.status_id
      caseTitles.push({ caseTitle, testRunCaseId, result })
    }
  )
  return caseTitles
}

export function parseTestName(testName: any) {
  const specName = testName.substring(testName.lastIndexOf('\\') + 1)
  const splitLine = specName.split('/')
  const sectionName: string = splitLine.slice(-4)[0]
  const subsection: string = splitLine.slice(-2)[0]
  const testCaseNotSplit = splitLine.slice(-1)[0]
  const testCase: string = testCaseNotSplit.split('.').slice(0)[0]

  return { sectionName, subsection, testCase }
}

// Checks to see if a regression run has been created within the last 24 hours and returns the testrun id if one exists or returns false if none exists
export async function createNewTestRunBool(platform: any) {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setUTCHours(0, 0, 0, 0)
  const yesterdayUTC = Number(yesterday) / 1000
  const content = {
    created_after: yesterdayUTC
  }
  const runDetails = await api.getRuns(projectId, content)
  if (
    runDetails.length === 0 ||
    (runDetails[0] as TestRail.Run).created_on < yesterdayUTC
  ) {
    return false
  } else {
    for (let i = 0; i < runDetails.length; i++) {
      const testRunName = runDetails[i]?.name
      const testRunID = runDetails[i]?.id
      if (testRunName?.includes(platform)) {
        return testRunID
      }
    }
  }
}

// Gets a list of test runs from testrail and then checks the timestamps in the names and returns false if there are no existing test runs with the timestamp
export const isExistingSmokeTestRun = async (platform: any) => {
  const timestamp = await testRunTimestamp(platform)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 2)
  const yesterdayUTC = Number(yesterday) / 1000
  const content = {
    created_after: Math.ceil(yesterdayUTC)
  }
  const testRuns = await api.getRuns(projectId, content)
  const runIDs = []
  for (const run of testRuns) {
    const testRunName = run.name
    if (testRunName.includes(timestamp) && testRunName.includes(platform)) {
      runIDs.push(run.id)
    }
  }
  if (runIDs.length === 0) {
    return false
  } else {
    return runIDs[0]
  }
}

export const currentRunID = async (platform: any) => {
  const smokeTestRunExists = await isExistingSmokeTestRun(platform)

  const timestamp = await testRunTimestamp(platform)
  // Checks if its a smoke test run
  if (await isSmokeTestRun(platform)) {
    // Checks the folder timestamp against the runs in testrail and if its not found, creates a new test run
    if (!smokeTestRunExists) {
      const runID = await createEmptyTestRun(
        `${platform} smoke test run ${timestamp}`,
        `This is a smoke test run on ${platform}`
      )
      await writeRunIdToTextFile(`${runID}`)
      return { runID, emptyTestRun: false }
    } else {
      return { runID: smokeTestRunExists, emptyTestRun: true }
    }
  } else {
    console.log(
      'This is a local run and regression test run logic has not been implemented yet!!!'
    )
    //   // This is for regression runs which run on a daily cadence
    //   var runID = await createNewTestRunBool(platform)
    //   if (runID) {
    //     return { runID: runID, emptyTestRun: true }
    //   } else {
    //     const newRunID = await createEmptyTestRun(
    //       `${platform} smoke test run`,
    //       `This is a smoke test run for ${platform}!`
    //     )
    //     return { runID: newRunID, emptyTestRun: false }
    //   }
    // }
  }
}

export function getUniqueListBy(arr: any, key: string) {
  return [
    ...new Map(
      arr.map((item: { [x: string]: any }) => [item[key], item])
    ).values()
  ]
}

export async function getTestCasesFromRun(runId: number): Promise<object[]> {
  const casesObject = await api.getTests(runId)
  const titleArray = []
  for (const testCase of casesObject) {
    const testCaseName = testCase.title
    const testResult = testCase.status_id
    const caseId = testCase.case_id
    titleArray.push({
      case_id: caseId,
      title: testCaseName,
      status_id: testResult,
      // This is so we don't try to attach a screenshot that doesn't exist
      already_posted: true
    })
  }
  return titleArray
}

export async function compareTestCaseArrays(
  casesToBeAdded: any,
  casesInRun: any
) {
  return casesToBeAdded
    .filter((x: any) => !casesInRun.includes(x))
    .concat(casesInRun.filter((x: any) => !casesToBeAdded.includes(x)))
}

export async function writeRunIdToTextFile(runId: string) {
  await fs.writeFile('./e2e/testrailRunID.txt', runId, (err: any) => {
    if (err) throw err
  })
}

export function generateUtcTimestamp() {
  return new Date().getUTCDate().toString()
}
