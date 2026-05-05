/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable no-console */
/**
 * Parses a manual test plan markdown file and syncs it to TestRail:
 * - Creates a top-level section (feature name)
 * - Creates subsections under it (each ## heading)
 * - Creates test cases under each subsection (each - list item)
 *
 * Usage (from packages/core-mobile):
 *   TESTRAIL_API_KEY=xxx node scripts/createManualTestPlan.js <path-to.md>
 * Set TESTRAIL_USERNAME if your API key is not for the default shared TestRail user.
 *
 * Example:
 *   node scripts/createManualTestPlan.js docs/manual-test-plan-Fusion-sample.md
 *
 * Optional env:
 *   TESTRAIL_USERNAME  (default: mobiledevs@avalabs.org — must match API key owner)
 *   TESTRAIL_SUITE_ID  (default: 4 — from URL .../suites/view/4)
 */

const fs = require('fs')
const path = require('path')
const axios = require('axios')

const TESTRAIL_DOMAIN =
  process.env.TESTRAIL_DOMAIN || 'https://avalabs.testrail.io'
const TESTRAIL_USERNAME =
  process.env.TESTRAIL_USERNAME || 'mobiledevs@avalabs.org'
const TESTRAIL_API_KEY = process.env.TESTRAIL_API_KEY
const TESTRAIL_PROJECT_ID = 4
const TESTRAIL_SUITE_ID =
  process.env.TESTRAIL_SUITE_ID != null
    ? parseInt(process.env.TESTRAIL_SUITE_ID, 10)
    : 4

const api = axios.create({
  baseURL: `${TESTRAIL_DOMAIN}/index.php?/api/v2`,
  auth: {
    username: TESTRAIL_USERNAME,
    password: TESTRAIL_API_KEY
  },
  headers: { 'Content-Type': 'application/json' }
})

/**
 * Parse manual test plan MD into { sectionName, subsections: [ { name, cases: [title] } ] }
 */
function parseManualTestPlanMd(content) {
  const lines = content.split(/\r?\n/)
  let sectionName = null
  const subsections = []
  let currentSub = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const sectionMatch = line.match(/^\*\*Section\*\*:\s*(.+)$/)
    const h2Match = line.match(/^##\s+(.+)$/)
    const bulletMatch = line.match(/^-\s+(.+)$/)

    if (sectionMatch) {
      sectionName = sectionMatch[1].trim()
      continue
    }
    if (!sectionName && line.match(/^#\s+Manual Test Plan:\s*(.+)$/)) {
      sectionName = line
        .replace(/^#\s+Manual Test Plan:\s*/, '')
        .replace(/\s*\(.*\)$/, '')
        .trim()
      continue
    }
    if (h2Match) {
      currentSub = { name: h2Match[1].trim(), cases: [] }
      subsections.push(currentSub)
      continue
    }
    if (bulletMatch && currentSub) {
      currentSub.cases.push(bulletMatch[1].trim())
    }
  }

  return { sectionName, subsections }
}

async function getSections(projectId, suiteId) {
  const params = suiteId != null ? { suite_id: suiteId } : {}
  const { data } = await api.get(`/get_sections/${projectId}`, { params })
  return data.sections || data || []
}

function findSectionByName(sections, name, parentId = null) {
  const list = Array.isArray(sections) ? sections : [sections]
  return (
    list.find(s => {
      if (s.name !== name) return false
      if (parentId == null) return s.parent_id == null
      return s.parent_id === parentId
    }) || null
  )
}

async function addSection(projectId, name, parentId = null, suiteId = null) {
  const body = { name }
  if (parentId != null) body.parent_id = parentId
  if (suiteId != null) body.suite_id = suiteId
  const { data } = await api.post(`/add_section/${projectId}`, body)
  return data.id
}

async function getCases(projectId, sectionId, suiteId) {
  const params = { section_id: sectionId }
  if (suiteId != null) params.suite_id = suiteId
  const { data } = await api.get(`/get_cases/${projectId}`, { params })
  return data.cases || data || []
}

async function addCase(sectionId, title) {
  const { data } = await api.post(`/add_case/${sectionId}`, { title })
  return data.id
}

async function ensureSection(projectId, name, parentId, suiteId) {
  const sections = await getSections(projectId, suiteId)
  const found = findSectionByName(sections, name, parentId)
  if (found) {
    console.log(`Section "${name}" already exists (id=${found.id})`)
    return found.id
  }
  const id = await addSection(projectId, name, parentId, suiteId)
  console.log(`Created section "${name}" (id=${id})`)
  return id
}

async function run(filePath) {
  if (!TESTRAIL_API_KEY) {
    console.error('Set TESTRAIL_API_KEY')
    process.exit(1)
  }

  const resolved = path.resolve(filePath)
  if (!fs.existsSync(resolved)) {
    console.error('File not found:', resolved)
    process.exit(1)
  }

  const content = fs.readFileSync(resolved, 'utf8')
  const { sectionName, subsections } = parseManualTestPlanMd(content)

  if (!sectionName) {
    console.error(
      'Could not parse section name from MD (use **Section**: FeatureName or # Manual Test Plan: FeatureName)'
    )
    process.exit(1)
  }
  if (!subsections.length) {
    console.error('No subsections (##) found in MD')
    process.exit(1)
  }

  console.log('Section:', sectionName)
  console.log('Subsections:', subsections.length)

  const sectionId = await ensureSection(
    TESTRAIL_PROJECT_ID,
    sectionName,
    null,
    TESTRAIL_SUITE_ID
  )

  for (const sub of subsections) {
    const subId = await ensureSection(
      TESTRAIL_PROJECT_ID,
      sub.name,
      sectionId,
      TESTRAIL_SUITE_ID
    )
    const existingCases = await getCases(
      TESTRAIL_PROJECT_ID,
      subId,
      TESTRAIL_SUITE_ID
    )
    const existingTitles = new Set(
      (existingCases || []).map(c => (c.title || '').trim())
    )
    for (const title of sub.cases) {
      const trimmed = title.trim()
      if (existingTitles.has(trimmed)) {
        console.log(`  Skipped (already exists): "${trimmed.slice(0, 50)}..."`)
        continue
      }
      try {
        const caseId = await addCase(subId, title)
        existingTitles.add(trimmed)
        console.log(`  Added case: "${trimmed.slice(0, 50)}..." (id=${caseId})`)
      } catch (e) {
        const msg = e.response?.data?.error || e.message
        console.error(`  Failed to add case "${trimmed.slice(0, 50)}...":`, msg)
      }
    }
  }

  console.log('Done.')
}

const filePath = process.argv[2]
if (!filePath) {
  console.error(
    'Usage: TESTRAIL_API_KEY=xxx node scripts/createManualTestPlan.js <path-to.md>'
  )
  console.error(
    'Example: node scripts/createManualTestPlan.js docs/manual-test-plan-Fusion-sample.md'
  )
  process.exit(1)
}

run(filePath).catch(err => {
  console.error(err.response?.data || err.message)
  process.exit(1)
})
