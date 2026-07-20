import '../loadEnv'
import axios, { AxiosError, type AxiosInstance } from 'axios'

function bitriseClient(): AxiosInstance {
  return axios.create({
    baseURL: 'https://api.bitrise.io/v0.1',
    headers: { Authorization: `token ${process.env.BITRISE_API_TOKEN}` },
  })
}

function appSlug(): string {
  return process.env.BITRISE_APP_SLUG ?? ''
}

export type Platform = 'ios' | 'android'
export type TestType = 'smoke' | 'regression-internal' | 'regression-external' | 'performance'

const PIPELINE_MAP: Record<TestType, string> = {
  smoke: 'smoke-runs',
  performance: 'performance-runs',
  'regression-internal': 'full-regression-runs',
  'regression-external': 'aws-full-regression-runs',
}

const RC_TAG_PATTERN = /^\d+\.\d+\.\d+-.+$/

function bitriseErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<{ message?: string; message_to_user?: string }>
    const msg =
      ax.response?.data?.message_to_user ||
      ax.response?.data?.message ||
      ax.message
    const status = ax.response?.status
    return status ? `Bitrise API ${status}: ${msg}` : `Bitrise API error: ${msg}`
  }
  return err instanceof Error ? err.message : String(err)
}

export async function triggerBuild(params: {
  testType: TestType
  branch: string
  tag?: string
}): Promise<{ buildUrl: string; buildSlug: string }> {
  if (!appSlug()) {
    throw new Error('BITRISE_APP_SLUG is not set')
  }
  if (!process.env.BITRISE_API_TOKEN) {
    throw new Error('BITRISE_API_TOKEN is not set')
  }

  const pipelineId = PIPELINE_MAP[params.testType]
  const environments: { mapped_to: string; value: string; is_expand: boolean }[] = []

  if (params.tag) {
    environments.push({
      mapped_to: 'CUSTOM_GREP_TAG',
      value: params.tag,
      is_expand: false,
    })
  }

  const isRcTag = RC_TAG_PATTERN.test(params.branch)
  const buildParams: Record<string, unknown> = {
    pipeline_id: pipelineId,
    environments,
  }
  if (isRcTag) {
    buildParams.tag = params.branch
  } else {
    buildParams.branch = params.branch
  }

  try {
    // Correct Bitrise trigger API (pipelines go through /builds with pipeline_id)
    const response = await bitriseClient().post(`/apps/${appSlug()}/builds`, {
      hook_info: { type: 'bitrise' },
      build_params: buildParams,
      triggered_by: 'core-mobile-QAi',
    })

    const data = response.data as {
      build_slug?: string
      build_url?: string
      slug?: string
      service?: string
    }

    const buildSlug = data.build_slug ?? data.slug ?? ''
    const buildUrl =
      data.build_url ??
      (buildSlug ? `https://app.bitrise.io/build/${buildSlug}` : '')

    if (!buildSlug) {
      throw new Error(`Bitrise trigger succeeded but no build slug returned: ${JSON.stringify(data)}`)
    }

    return { buildUrl, buildSlug }
  } catch (err) {
    throw new Error(bitriseErrorMessage(err))
  }
}

export async function getBuildStatus(buildSlug: string): Promise<{
  status: string
  statusText: string
  isFinished: boolean
}> {
  try {
    const response = await bitriseClient().get(`/apps/${appSlug()}/builds/${buildSlug}`)
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
  } catch (err) {
    throw new Error(bitriseErrorMessage(err))
  }
}
