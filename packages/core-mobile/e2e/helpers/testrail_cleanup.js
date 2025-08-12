// delete-runs.js
const axios = require('axios')
const pLimit = require('p-limit')
require('dotenv').config()

const {
  TESTRAIL_BASE_URL,
  TESTRAIL_USER,
  TESTRAIL_API_KEY,
  PROJECT_ID,
  ONLY_OPEN = 'true',
  CREATED_BEFORE,
  CONCURRENCY = '1',
} = process.env

if (!TESTRAIL_BASE_URL || !TESTRAIL_USER || !TESTRAIL_API_KEY || !PROJECT_ID) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const client = axios.create({
  baseURL: TESTRAIL_BASE_URL,
  auth: { username: TESTRAIL_USER, password: TESTRAIL_API_KEY },
  timeout: 60_000,
})

async function fetchAllRuns(projectId) {
  const runs = []
  const limit = 250
  let offset = 0

  while (true) {
    const params = []

    if (ONLY_OPEN === 'true') params.push('is_completed=0')

    if (CREATED_BEFORE) {
      const ts = Math.floor(new Date(CREATED_BEFORE).getTime() / 1000)
      if (!isNaN(ts)) params.push(`created_before=${ts}`)
    }

    params.push(`limit=${limit}`)
    params.push(`offset=${offset}`)

    const url = `get_runs/${projectId}${params.length ? `&${params.join('&')}` : ''}`
    try {
      const { data } = await client.get(url)
      if (Array.isArray(data)) {
        runs.push(...data)
        break
      } else if (Array.isArray(data.runs)) {
        runs.push(...data.runs)
        if (data._links && data._links.next) {
          offset += limit
          continue
        } else {
          break
        }
      } else {
        console.warn('Something went wrong:', data)
        break
      }
    } catch (e) {
      if (offset === 0) {
        const fallbackUrl = `get_runs/${projectId}${params.filter(p => !p.startsWith('limit=') && !p.startsWith('offset=')).length ? `&${params.filter(p => !p.startsWith('limit=') && !p.startsWith('offset=')).join('&')}` : ''}`
        const { data } = await client.get(fallbackUrl)
        runs.push(...data)
        break
      }
      throw e
    }
  }

  return runs
}

async function deleteRun(runId, runName) {
  try {
    await client.post(`delete_run/${runId}`, {})
    console.log(`Deleted run ${runId}  | ${runName}`)
  } catch (err) {
    const msg = err.response?.data || err.message
    console.error(`Failed to delete run ${runId}:`, msg)
  }
}

(async () => {
  console.log('▶️ Fetching runs...')
  const runs = await fetchAllRuns(PROJECT_ID)

  if (!runs.length) {
    console.log('No runs to delete')
    return
  }

  console.log('Starting deletion...')
  const limit = pLimit(parseInt(CONCURRENCY, 10) || 5)
  const jobs = runs.map(r => limit(() => deleteRun(r.id, r.name)))
  await Promise.all(jobs)

  console.log('Done!')
})().catch(e => {
  console.error('Unexpected error:', e.response?.data || e.message)
  process.exit(1)
})
