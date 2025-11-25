import { Readable } from 'stream'
import FormData from 'form-data'
import axios from 'axios'
import { testRailConfig } from './testrail.config'

const { domain, username, apiKey, projectId, suiteId } = testRailConfig
const authConfig = {
  baseURL: (domain ?? '') + '/index.php?/api/v2',
  auth: { username: username ?? '', password: apiKey ?? '' }
}
const testrail = axios.create(authConfig)

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
  statusId: number,
  error?: any
) {
  let comment = ''

  if (error) {
    const msg = error?.message || error.toString()

    comment = `FAILED:\n\n${msg}`
  } else {
    comment = 'PASSED'
  }

  try {
    const resp = await testrail.post(
      `/add_result_for_case/${runId}/${caseId}`,
      {
        status_id: statusId,
        comment: comment
      }
    )
    console.info('result sent')
    return resp.data?.id
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

export async function uploadScreenshotToResult(
  resultId: number,
  base64: string
) {
  try {
    const buffer = Buffer.from(base64, 'base64')
    const stream = Readable.from(buffer)

    const form = new FormData()
    form.append('attachment', stream, {
      filename: 'screenshot.png',
      contentType: 'image/png'
    })

    await testrail.post(`/add_attachment_to_result/${resultId}`, form, {
      headers: form.getHeaders()
    })
    console.log(`Screenshot uploaded: result_id=${resultId}`)
  } catch (e: any) {
    console.log(
      `Screenshot upload failed: result_id=${resultId}`,
      e.response?.data || e.message
    )
  }
}
