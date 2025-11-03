import axios from 'axios'
import { testRailConfig } from './testrail.config'

const { domain, username, apiKey, projectId, suiteId } = testRailConfig

const testrail = axios.create({
  baseURL: (domain ?? '') + '/index.php?/api/v2',
  auth: { username: username ?? '', password: apiKey ?? '' }
})

// 1. api call to create testrun
export async function getTestRun(platform: string) {
  // iOS: today
  const today = new Date().toISOString().split('T')[0]
  const title = `${platform} Test Run: ${today}`

  try {
    // testRun exists, return it
    const response = await testrail.get(`/get_runs/${projectId}`)
    const runs = response.data.runs || response.data
    const existing = Array.isArray(runs)
      ? runs.find(run => run.name === title)
      : undefined
    if (existing) {
      console.log('testRun found', existing.id)
      return existing.id
    }

    // testRun not exists, create it and return it
    const res = await testrail.post(`/add_run/${projectId}`, {
      suiteId: suiteId,
      name: title,
      include_all: false,
      case_ids: []
    })
    console.info('new testRun created', res.data.id)
    return res.data.id
  } catch (e: any) {
    console.error('error creating testRun', e.response?.data || e.message)
    return undefined
  }
}

// 2. api call to get test section
export async function getSection(name: string) {
  // if exists, get it
  const { data } = await testrail.get(
    `/get_sections/${projectId}&suite_id=${suiteId}`
  )
  const sections = data.sections
  const existing = Array.isArray(sections)
    ? sections.find(run => run.name === name)
    : undefined
  if (existing) return existing.id

  // if not exists, post it
  const res = await testrail.post(`/add_section/${projectId}`, {
    suiteId: suiteId,
    name
  })
  return res.data.id
}

// 3. create test case
export async function getTestCase(title: string, sectionId?: number) {
  // if exists, get it
  const { data } = await testrail.get(
    `/get_cases/${projectId}&suite_id=${suiteId}&section_id=${sectionId}`
  )
  const cases = data.cases
  const existing = Array.isArray(cases)
    ? cases.find(c => c.title === title)
    : undefined
  if (existing) return existing.id

  // if not exists, post it
  const res = await testrail.post(`/add_case/${sectionId}`, {
    title
  })
  return res.data.id
}

// 4. post result to testrail
export async function sendResult(
  runId: number,
  caseId: number,
  statusId: number
) {
  // post result to testrail
  try {
    await testrail.post(`/add_result_for_case/${runId}/${caseId}`, {
      status_id: statusId
    })
    console.info('result sent')
  } catch (e: any) {
    console.error('error sending result', e.response?.data || e.message)
  }
}

// 5. update run with new caseId
export async function addCaseToRun(runId: number, caseId: number) {
  try {
    // get current caseIds in run (via get_tests)
    const { data } = await testrail.get(`/get_tests/${runId}`)
    const tests = Array.isArray(data?.tests) ? data.tests : []
    const currentCaseIds: number[] = tests.map((t: any) => t.case_id)

    // prevent duplicate
    if (currentCaseIds.includes(caseId)) {
      console.log(`case ${caseId} already in run ${runId}`)
      return
    }

    const updatedCaseIds = [...currentCaseIds, caseId]

    // call update_run
    await testrail.post(`/update_run/${runId}`, {
      case_ids: updatedCaseIds,
      include_all: false
    })
    console.info(`case ${caseId} added to run ${runId}`)
  } catch (e: any) {
    console.error('error updating run with case', e.response?.data || e.message)
  }
}
