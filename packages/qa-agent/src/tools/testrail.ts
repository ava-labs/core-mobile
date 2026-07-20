import '../loadEnv'
import axios from 'axios'

function testrailClient() {
  return axios.create({
    baseURL: process.env.TESTRAIL_BASE_URL ?? 'https://avalabs.testrail.io',
    auth: {
      username: process.env.TESTRAIL_EMAIL ?? '',
      password: process.env.TESTRAIL_API_KEY ?? '',
    },
  })
}

const AUTOMATION_PROJECT_ID = 3
const MANUAL_PROJECT_ID = 4

interface TestRailRun {
  id: number
  name: string
  passed_count: number
  failed_count: number
  untested_count: number
  blocked_count: number
  retest_count: number
}

interface TestRailTest {
  id: number
  title: string
  status_id: number
}

async function getRuns(projectId: number, limit = 250): Promise<TestRailRun[]> {
  const response = await testrailClient().get(`/index.php?/api/v2/get_runs/${projectId}`, {
    params: { limit },
  })
  return response.data.runs ?? response.data ?? []
}

async function getFailedTests(runId: number): Promise<TestRailTest[]> {
  const response = await testrailClient().get(`/index.php?/api/v2/get_tests/${runId}`, {
    params: { status_id: '5' }, // 5 = Failed
  })
  return response.data.tests ?? response.data ?? []
}

export interface RunSummary {
  name: string
  passed: number
  failed: number
  untested: number
  total: number
  passRate: string
  progressRate?: string
}

export interface AutomationReport {
  date?: string
  version?: string
  runs: RunSummary[]
  totalPassed: number
  totalFailed: number
  totalTests: number
  overallPassRate: string
  failedTestTitles: string[]
  /** true when we filtered by version/tag and found zero matching runs */
  noMatchingRuns?: boolean
}

async function buildReportFromRuns(runs: TestRailRun[]): Promise<{
  runs: RunSummary[]
  totalPassed: number
  totalFailed: number
  totalTests: number
  overallPassRate: string
  failedTestTitles: string[]
}> {
  let totalPassed = 0
  let totalFailed = 0
  let totalTests = 0
  const failedTestTitles: string[] = []
  const runSummaries: RunSummary[] = []

  for (const run of runs) {
    const passed = run.passed_count ?? 0
    const failed = run.failed_count ?? 0
    const untested = run.untested_count ?? 0
    const total = passed + failed + untested + (run.blocked_count ?? 0) + (run.retest_count ?? 0)

    totalPassed += passed
    totalFailed += failed
    totalTests += total

    runSummaries.push({
      name: run.name,
      passed,
      failed,
      untested,
      total,
      passRate: total > 0 ? `${Math.round((passed / total) * 100)}%` : 'N/A',
    })

    if (failed > 0) {
      const failedTests = await getFailedTests(run.id)
      for (const test of failedTests) {
        if (test.title && !failedTestTitles.includes(test.title)) {
          failedTestTitles.push(test.title)
        }
      }
    }
  }

  return {
    runs: runSummaries,
    totalPassed,
    totalFailed,
    totalTests,
    overallPassRate: totalTests > 0 ? `${Math.round((totalPassed / totalTests) * 100)}%` : 'N/A',
    failedTestTitles,
  }
}

/** Daily report for main/CI runs named with today's date (NOT for RC status). */
export async function getDailyAutomationReport(date?: string): Promise<AutomationReport> {
  const targetDate = date ?? new Date().toISOString().split('T')[0] ?? ''
  const allRuns = await getRuns(AUTOMATION_PROJECT_ID)
  const todaysRuns = allRuns.filter(r => r.name.includes(targetDate))
  const built = await buildReportFromRuns(todaysRuns)
  return { date: targetDate, ...built }
}

/**
 * RC / tagged automation only — TestRail run name MUST contain the version string
 * (e.g. "1.0.35" or "1.0.35-rc1"). Never falls back to today's main-branch date runs.
 */
export async function getAutomationReportForVersion(version: string): Promise<AutomationReport> {
  const allRuns = await getRuns(AUTOMATION_PROJECT_ID)
  const matching = allRuns.filter(r => r.name.includes(version))
  if (matching.length === 0) {
    return {
      version,
      runs: [],
      totalPassed: 0,
      totalFailed: 0,
      totalTests: 0,
      overallPassRate: 'N/A',
      failedTestTitles: [],
      noMatchingRuns: true,
    }
  }
  const built = await buildReportFromRuns(matching)
  return { version, noMatchingRuns: false, ...built }
}

export interface ManualRunSummary {
  name: string
  passed: number
  failed: number
  untested: number
  total: number
  passRate: string
  progressRate: string
  /** Compact display: "98% Passing / 100% Tested" */
  compact: string
}

export interface ManualTestProgress {
  version: string
  runs: ManualRunSummary[]
}

export async function getManualTestProgress(version: string): Promise<ManualTestProgress> {
  const allRuns = await getRuns(MANUAL_PROJECT_ID)
  const versionRuns = allRuns.filter(r => r.name.includes(version))

  const runs: ManualRunSummary[] = versionRuns.map(run => {
    const passed = run.passed_count ?? 0
    const failed = run.failed_count ?? 0
    const untested = run.untested_count ?? 0
    const blocked = run.blocked_count ?? 0
    const total = passed + failed + untested + blocked + (run.retest_count ?? 0)
    const tested = passed + failed + blocked
    const passRate = tested > 0 ? `${Math.round((passed / tested) * 100)}%` : 'N/A'
    const progressRate = total > 0 ? `${Math.round((tested / total) * 100)}%` : 'N/A'

    return {
      name: run.name,
      passed,
      failed,
      untested,
      total,
      passRate,
      progressRate,
      compact: `${passRate} Passing / ${progressRate} Tested`,
    }
  })

  return { version, runs }
}
