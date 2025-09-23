/* eslint-disable @typescript-eslint/explicit-function-return-type */
import axios from 'axios'
import Logger from 'utils/Logger'
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
  const title = `${platform}: ${today}`

  try {
    // testRun exists, return it
    const response = await testrail.get(`/get_runs/${projectId}`)
    const runs = response.data.runs || response.data
    const existing = Array.isArray(runs)
      ? runs.find(run => run.name === title)
      : undefined
    if (existing) {
      Logger.info('testRun found', existing.id)
      return existing.id
    }

    // testRun not exists, create it and return it
    const res = await testrail.post(`/add_run/${projectId}`, {
      suiteId: suiteId,
      name: title
    })
    Logger.info('new testRun created', res.data.id)
    return res.data.id
  } catch (e: any) {
    Logger.error('error creating testRun', e.response?.data || e.message)
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
export async function getTestCase(title: string, sectionId: number) {
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
    Logger.info('result sent')
  } catch (e: any) {
    Logger.error('error sending result', e.response?.data || e.message)
  }
}
