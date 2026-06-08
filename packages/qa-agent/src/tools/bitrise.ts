import axios from 'axios'

const client = axios.create({
  baseURL: 'https://api.bitrise.io/v0.1',
  headers: { Authorization: `token ${process.env.BITRISE_API_TOKEN}` },
})

const APP_SLUG = process.env.BITRISE_APP_SLUG

export type Platform = 'ios' | 'android'
export type TestType = 'smoke' | 'regression' | 'performance'

function resolveWorkflow(testType: TestType, platform: Platform): string {
  if (testType === 'regression') {
    return platform === 'ios' ? 'aws-ios-regression-test' : 'aws-android-regression-test'
  }
  if (testType === 'smoke') {
    return platform === 'ios' ? 'appium-ios-setup' : 'appium-android-setup'
  }
  // performance
  return platform === 'ios' ? 'appium-ios-setup' : 'appium-android-setup'
}

export async function triggerBuild(params: {
  testType: TestType
  platform: Platform
  tag?: string
}): Promise<{ buildUrl: string; buildSlug: string }> {
  const workflow = resolveWorkflow(params.testType, params.platform)

  const environments: { mapped_to: string; value: string }[] = []

  if (params.testType === 'smoke') {
    environments.push({ mapped_to: 'IS_SMOKE', value: 'true' })
  }
  if (params.testType === 'performance') {
    environments.push({ mapped_to: 'IS_PERFORMANCE', value: 'true' })
  }
  if (params.tag) {
    environments.push({ mapped_to: 'CUSTOM_GREP_TAG', value: params.tag })
  }

  const response = await client.post(`/apps/${APP_SLUG}/builds`, {
    hook_info: { type: 'bitrise' },
    build_params: {
      workflow_id: workflow,
      environments,
    },
  })

  const buildSlug = response.data.build_slug
  const buildUrl = `https://app.bitrise.io/build/${buildSlug}`
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
