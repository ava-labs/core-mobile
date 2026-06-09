import axios from 'axios'

const client = axios.create({
  baseURL: 'https://api.bitrise.io/v0.1',
  headers: { Authorization: `token ${process.env.BITRISE_API_TOKEN}` },
})

const APP_SLUG = process.env.BITRISE_APP_SLUG

export type Platform = 'ios' | 'android'
export type TestType = 'smoke' | 'regression-internal' | 'regression-external' | 'performance'

const PIPELINE_MAP: Record<TestType, string> = {
  'smoke': 'smoke-runs',
  'performance': 'performance-runs',
  'regression-internal': 'full-regression-runs',
  'regression-external': 'aws-full-regression-runs',
}

export async function triggerBuild(params: {
  testType: TestType
  tag?: string
}): Promise<{ buildUrl: string; buildSlug: string }> {
  const pipelineId = PIPELINE_MAP[params.testType]

  const environments: { mapped_to: string; value: string }[] = []

  if (params.tag) {
    environments.push({ mapped_to: 'CUSTOM_GREP_TAG', value: params.tag })
  }

  const response = await client.post(`/apps/${APP_SLUG}/pipeline-runs`, {
    pipeline_id: pipelineId,
    triggered_by: 'core-mobile-QAi',
    environments,
  })

  const buildSlug = response.data.id ?? response.data.pipeline_run_slug ?? ''
  const buildUrl = `https://app.bitrise.io/pipeline-run/${buildSlug}`
  return { buildUrl, buildSlug }
}

export async function getBuildStatus(buildSlug: string): Promise<{
  status: string
  statusText: string
  isFinished: boolean
}> {
  const response = await client.get(`/apps/${APP_SLUG}/builds/${buildSlug}`)
  const build = response.data.data

  const statusMap: Record<number, string> = {
    0: 'in_progress',
    1: 'success',
    2: 'failed',
    3: 'aborted',
  }

  return {
    status: statusMap[build.status] ?? 'unknown',
    statusText: build.status_text,
    isFinished: build.status !== 0,
  }
}
