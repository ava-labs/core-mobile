import '../loadEnv'
import axios, { type AxiosInstance } from 'axios'
import fs from 'fs'
import path from 'path'
import FormData from 'form-data'
import { markdownToAdf } from './markdownToAdf'

function jiraClient(): AxiosInstance {
  const baseURL = process.env.JIRA_BASE_URL
  if (!baseURL) {
    throw new Error('JIRA_BASE_URL is not set (expected https://ava-labs.atlassian.net)')
  }
  return axios.create({
    baseURL,
    auth: {
      username: process.env.JIRA_EMAIL ?? '',
      password: process.env.JIRA_API_TOKEN ?? '',
    },
    headers: { 'Content-Type': 'application/json' },
  })
}

export interface FailedTest {
  name: string
  errorLog: string
  screenshotPath?: string
}

export interface CreateFailureTicketParams {
  specTitle: string       // e.g. "[Smoke] Stake on Testnet"
  specFile: string        // e.g. "specs/transactions/cChain/stakeTestnet.spec.ts"
  failedTests: FailedTest[]
  buildUrl: string
}

// Check if an open ticket with the same title already exists
async function findOpenTicket(ticketTitle: string): Promise<string | null> {
  const jql = `project = ${process.env.JIRA_PROJECT_KEY} AND summary = "${ticketTitle}" AND status != Done ORDER BY created DESC`
  const response = await jiraClient().post('/rest/api/3/issue/search', {
    jql,
    maxResults: 1,
    fields: ['summary', 'status'],
  })
  const issues = response.data.issues
  if (issues && issues.length > 0) {
    return issues[0].key
  }
  return null
}

function buildDescription(params: CreateFailureTicketParams): object {
  const failedTestNodes = params.failedTests.map(test => ({
    type: 'listItem',
    content: [{
      type: 'paragraph',
      content: [{ type: 'text', text: `❌ ${test.name}` }],
    }],
  }))

  const errorNodes = params.failedTests.flatMap(test => [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: `📌 ${test.name}`, marks: [{ type: 'strong' }] }],
    },
    {
      type: 'codeBlock',
      attrs: { language: 'text' },
      content: [{ type: 'text', text: test.errorLog }],
    },
  ])

  return {
    type: 'doc',
    version: 1,
    content: [
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'Failed Tests' }],
      },
      { type: 'bulletList', content: failedTestNodes },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'Error Logs' }],
      },
      ...errorNodes,
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'Build Info' }],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Spec file: ', marks: [{ type: 'strong' }] },
          { type: 'text', text: params.specFile },
        ],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Bitrise Build: ', marks: [{ type: 'strong' }] },
          {
            type: 'text',
            text: params.buildUrl,
            marks: [{ type: 'link', attrs: { href: params.buildUrl } }],
          },
        ],
      },
    ],
  }
}

type JiraAttachment = {
  id: string
  filename: string
  mimeType: string
  content: string
}

async function attachFile(issueKey: string, filePath: string): Promise<JiraAttachment | null> {
  if (!fs.existsSync(filePath)) return null

  const form = new FormData()
  form.append('file', fs.createReadStream(filePath), path.basename(filePath))

  const response = await axios.post<JiraAttachment[]>(
    `${process.env.JIRA_BASE_URL}/rest/api/3/issue/${issueKey}/attachments`,
    form,
    {
      auth: {
        username: process.env.JIRA_EMAIL ?? '',
        password: process.env.JIRA_API_TOKEN ?? '',
      },
      headers: {
        ...form.getHeaders(),
        'X-Atlassian-Token': 'no-check',
        Accept: 'application/json',
      },
      maxBodyLength: Infinity,
    }
  )

  return response.data?.[0] ?? null
}

/** Resolve Media Services file UUID so we can embed the image inline in ADF description */
async function resolveMediaFileId(attachmentId: string): Promise<string | null> {
  try {
    const response = await axios.get(
      `${process.env.JIRA_BASE_URL}/rest/api/3/attachment/content/${attachmentId}`,
      {
        auth: {
          username: process.env.JIRA_EMAIL ?? '',
          password: process.env.JIRA_API_TOKEN ?? '',
        },
        maxRedirects: 0,
        validateStatus: status => status >= 200 && status < 400,
      }
    )
    const location =
      (response.headers.location as string | undefined) ||
      (response.headers.Location as string | undefined) ||
      ''
    const match = location.match(/\/file\/([0-9a-fA-F-]{36})\//)
    return match?.[1] ?? null
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const location =
        (err.response?.headers.location as string | undefined) ||
        (err.response?.headers.Location as string | undefined) ||
        ''
      const match = location.match(/\/file\/([0-9a-fA-F-]{36})\//)
      if (match?.[1]) return match[1]
    }
    console.warn(
      `[jira] could not resolve media id for attachment ${attachmentId}:`,
      err instanceof Error ? err.message : err
    )
    return null
  }
}

function mediaSingleNode(mediaId: string, filename: string): object {
  return {
    type: 'mediaSingle',
    attrs: { layout: 'center' },
    content: [
      {
        type: 'media',
        attrs: {
          type: 'file',
          id: mediaId,
          collection: '',
          alt: filename,
        },
      },
    ],
  }
}

async function attachScreenshot(issueKey: string, screenshotPath: string): Promise<void> {
  await attachFile(issueKey, screenshotPath)
}

function containsHangul(text: string): boolean {
  return /[\uAC00-\uD7A3]/.test(text)
}

export async function createBugTicket(params: {
  summary: string
  description: string
  priority: string
  threadLink?: string
  /** Local file paths (screenshots/videos from Slack) to attach */
  attachmentPaths?: string[]
}): Promise<{ ticketKey: string; ticketUrl: string; attached: string[] }> {
  if (containsHangul(params.summary) || containsHangul(params.description)) {
    throw new Error(
      'Jira summary and description must be in English only. Translate to English and retry create_bug_ticket.'
    )
  }

  const descriptionContent: object[] = markdownToAdf(params.description)

  if (params.threadLink) {
    descriptionContent.push({ type: 'rule' })
    descriptionContent.push({
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Slack Thread: ', marks: [{ type: 'strong' }] },
        {
          type: 'text',
          text: params.threadLink,
          marks: [{ type: 'link', attrs: { href: params.threadLink } }],
        },
      ],
    })
  }

  const fields: Record<string, unknown> = {
    project: { key: process.env.JIRA_PROJECT_KEY },
    summary: params.summary,
    description: { type: 'doc', version: 1, content: descriptionContent },
    issuetype: { name: 'Bug' },
    labels: ['mobile-qai'],
    parent: { key: process.env.JIRA_BUG_PARENT_KEY || 'CP-32' },
    components: [{ name: 'Mobile Application' }],
    priority: { name: params.priority },
  }

  let response
  try {
    response = await jiraClient().post('/rest/api/3/issue', { fields })
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status
      const data = err.response?.data
      const detail =
        typeof data === 'string'
          ? data.slice(0, 300)
          : JSON.stringify(data?.errors || data?.errorMessages || data || {}).slice(0, 500)
      throw new Error(
        `Jira create issue failed (${status}): ${detail}. Check JIRA_BASE_URL (should be https://ava-labs.atlassian.net), token, parent, and components.`
      )
    }
    throw err
  }

  const ticketKey = response.data.key
  const ticketUrl = `${process.env.JIRA_BASE_URL}/browse/${ticketKey}`
  const attached: string[] = []
  const inlineMedia: object[] = []

  for (const filePath of params.attachmentPaths ?? []) {
    try {
      const uploaded = await attachFile(ticketKey, filePath)
      if (!uploaded) continue

      attached.push(uploaded.filename)
      if (uploaded.mimeType.startsWith('image/')) {
        const mediaId = await resolveMediaFileId(uploaded.id)
        if (mediaId) {
          inlineMedia.push(mediaSingleNode(mediaId, uploaded.filename))
        } else {
          console.warn(`[jira] attached ${uploaded.filename} but could not inline into description`)
        }
      }
    } catch (attachErr) {
      console.error(
        `[jira] attach failed for ${filePath}:`,
        attachErr instanceof Error ? attachErr.message : attachErr
      )
    }
  }

  // Re-write description so screenshots appear inline (like pasting images in the Jira UI)
  if (inlineMedia.length > 0) {
    const withScreenshots = [
      ...descriptionContent,
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'Screenshots', marks: [{ type: 'strong' }] }],
      },
      ...inlineMedia,
    ]
    try {
      await jiraClient().put(`/rest/api/3/issue/${ticketKey}`, {
        fields: {
          description: { type: 'doc', version: 1, content: withScreenshots },
        },
      })
    } catch (err) {
      console.error(
        '[jira] failed to update description with inline screenshots:',
        err instanceof Error ? err.message : err
      )
    }
  }

  return { ticketKey, ticketUrl, attached }
}

export async function createFailureTicket(params: CreateFailureTicketParams): Promise<{
  ticketKey: string
  ticketUrl: string
  skipped: boolean
}> {
  const ticketTitle = `[Automated Test]: ${params.specTitle}`

  // Check for existing open ticket
  const existingKey = await findOpenTicket(ticketTitle)
  if (existingKey) {
    return {
      ticketKey: existingKey,
      ticketUrl: `${process.env.JIRA_BASE_URL}/browse/${existingKey}`,
      skipped: true,
    }
  }

  const response = await jiraClient().post('/rest/api/3/issue', {
    fields: {
      project: { key: process.env.JIRA_PROJECT_KEY },
      summary: ticketTitle,
      description: buildDescription(params),
      issuetype: { name: 'Bug' },
      labels: ['mobile-qai', 'automation-failure'],
      parent: { key: 'CP-14439' },
      components: [{ name: 'Mobile Application' }],
      priority: { name: 'Medium' },
    },
  })

  const ticketKey = response.data.key
  const ticketUrl = `${process.env.JIRA_BASE_URL}/browse/${ticketKey}`

  // Attach screenshots if available
  for (const test of params.failedTests) {
    if (test.screenshotPath) {
      await attachScreenshot(ticketKey, test.screenshotPath).catch(() => {
        // screenshot attachment failure shouldn't block ticket creation
      })
    }
  }

  return { ticketKey, ticketUrl, skipped: false }
}

export interface VersionTicket {
  key: string
  summary: string
  status: string
  priority?: string
  url: string
}

/**
 * Find Bug tickets whose summary contains the version string (e.g. "1.0.34").
 * Not limited to Priority=Highest — any Bug with that version in the title.
 * Open (non-Done) tickets are listed first when Jira returns them.
 */
async function searchJqlOnce(
  jql: string,
  maxResults: number,
  fields: string[]
): Promise<{ issues: unknown[] }> {
  try {
    const response = await jiraClient().post('/rest/api/3/search/jql', {
      jql,
      maxResults,
      fields,
    })
    return { issues: response.data.issues ?? [] }
  } catch (err) {
    if (axios.isAxiosError(err) && (err.response?.status === 404 || err.response?.status === 405)) {
      const response = await jiraClient().post('/rest/api/3/search', {
        jql,
        maxResults,
        fields,
      })
      return { issues: response.data.issues ?? [] }
    }
    throw err
  }
}

export async function searchVersionTickets(version: string): Promise<VersionTicket[]> {
  const project = process.env.JIRA_PROJECT_KEY
  const jql =
    `project = ${project} AND issuetype = Bug AND summary ~ "\\"${version}\\"" ` +
    `AND status != Done ORDER BY priority DESC, updated DESC`

  const { issues } = await searchJqlOnce(jql, 30, ['summary', 'status', 'priority'])

  return (
    issues as Array<{
      key: string
      fields: { summary: string; status: { name: string }; priority?: { name: string } }
    }>
  ).map(issue => ({
    key: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status.name,
    priority: issue.fields.priority?.name,
    url: `${process.env.JIRA_BASE_URL}/browse/${issue.key}`,
  }))
}

const MOBILE_COMPONENT = 'Mobile Application'

export interface MobileTicketHit {
  key: string
  summary: string
  status: string
  issuetype?: string
  priority?: string
  updated?: string
  url: string
}

/**
 * Search CP tickets with Component = Mobile Application (keyword / phrase hunt).
 * Example: "1D select not working" → find the chart time-filter bug.
 */
export async function searchMobileTickets(params: {
  query: string
  /** Default: any type. Pass "Bug" to limit. */
  issueType?: string
  /** Default true — include Done/Declined so historical bugs are findable */
  includeClosed?: boolean
  maxResults?: number
}): Promise<{
  jql: string
  query: string
  component: string
  totalReturned: number
  tickets: MobileTicketHit[]
}> {
  const project = process.env.JIRA_PROJECT_KEY
  const maxResults = Math.min(Math.max(params.maxResults ?? 20, 1), 50)
  const includeClosed = params.includeClosed !== false

  // Sanitize for JQL text ~ "..." — keep letters/numbers and simple tokens
  const cleaned = params.query
    .replace(/["\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200)
  if (!cleaned) {
    throw new Error('query is empty')
  }

  // Prefer distinctive tokens (drop very short noise except alphanumerics like "1D")
  const tokens = cleaned
    .split(/\s+/)
    .map(t => t.replace(/^[^\w.+#-]+|[^\w.+#-]+$/g, ''))
    .filter(t => t.length >= 2 || /^[a-z0-9]$/i.test(t))

  const textClause =
    tokens.length > 0
      ? tokens.map(t => `text ~ "${t.replace(/"/g, '')}"`).join(' AND ')
      : `text ~ "${cleaned}"`

  const typeClause = params.issueType?.trim()
    ? ` AND issuetype = "${params.issueType.trim()}"`
    : ''
  const statusClause = includeClosed ? '' : ' AND status not in (Done, Declined)'

  const jql =
    `project = ${project} AND component = "${MOBILE_COMPONENT}"` +
    typeClause +
    statusClause +
    ` AND (${textClause}) ORDER BY updated DESC`

  let issues: Array<{
    key: string
    fields: {
      summary: string
      status: { name: string }
      issuetype?: { name: string }
      priority?: { name: string }
      updated?: string
    }
  }> = []

  try {
    const result = await searchJqlOnce(jql, maxResults, [
      'summary',
      'status',
      'priority',
      'issuetype',
      'updated',
    ])
    issues = result.issues as typeof issues
  } catch (err) {
    // Fallback: phrase search if AND-of-tokens JQL is rejected
    const phraseJql =
      `project = ${project} AND component = "${MOBILE_COMPONENT}"` +
      typeClause +
      statusClause +
      ` AND text ~ "${cleaned}" ORDER BY updated DESC`
    const result = await searchJqlOnce(phraseJql, maxResults, [
      'summary',
      'status',
      'priority',
      'issuetype',
      'updated',
    ])
    issues = result.issues as typeof issues
    return {
      jql: phraseJql,
      query: cleaned,
      component: MOBILE_COMPONENT,
      totalReturned: issues.length,
      tickets: issues.map(issue => ({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        issuetype: issue.fields.issuetype?.name,
        priority: issue.fields.priority?.name,
        updated: issue.fields.updated,
        url: `${process.env.JIRA_BASE_URL}/browse/${issue.key}`,
      })),
    }
  }

  return {
    jql,
    query: cleaned,
    component: MOBILE_COMPONENT,
    totalReturned: issues.length,
    tickets: issues.map(issue => ({
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status.name,
      issuetype: issue.fields.issuetype?.name,
      priority: issue.fields.priority?.name,
      updated: issue.fields.updated,
      url: `${process.env.JIRA_BASE_URL}/browse/${issue.key}`,
    })),
  }
}

/** Mobile scrum board — Story Points = customfield_10026 */
const STORY_POINTS_FIELD = 'customfield_10026'
const DEFAULT_MOBILE_BOARD_ID = '60'

export interface SprintTicketSample {
  key: string
  summary: string
  status: string
  url: string
  storyPoints?: number | null
}

export interface SprintStoryPoints {
  /** Jira field used (Story Points) */
  field: string
  /** Sum of Story Points on all sprint tickets (missing SP counts as 0) */
  plannedTotal: number
  /** Sum of Story Points in Done status */
  completed: number
  /** Sum of Story Points in Declined status (not counted as completed) */
  declined: number
  /** plannedTotal - completed - declined */
  remaining: number
  byStatus: Record<string, number>
  ticketsWithPoints: number
  ticketsWithoutPoints: number
}

export interface SprintTicketStats {
  sprintName: string
  sprintState?: string
  sprintStartDate?: string
  sprintEndDate?: string
  jql: string
  total: number
  byStatus: Record<string, number>
  storyPoints: SprintStoryPoints
  /** Present when statusFilter was provided */
  statusFilter?: string
  matchedStatusNames?: string[]
  matchedCount?: number
  matchedStoryPoints?: number
  samples?: SprintTicketSample[]
  /** Full(ish) ticket lists keyed by status name when listStatuses was requested */
  lists?: Record<string, SprintTicketSample[]>
}

export function isCurrentSprintAlias(raw: string): boolean {
  const key = raw.trim().toLowerCase()
  return (
    key === '' ||
    key === 'current' ||
    key === 'active' ||
    key === 'this' ||
    key === 'this week' ||
    key === 'this sprint' ||
    key === 'current sprint'
  )
}

/**
 * Normalize casual Sprint references to the Jira sprint board name.
 * Examples: "121" → "Mobile Sprint 121", "sprint 121" → "Mobile Sprint 121"
 * Does not resolve "current" — use resolveSprintName for that.
 */
export function normalizeSprintName(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, ' ')
  if (!trimmed) return trimmed

  // Already looks like "Mobile Sprint N"
  if (/^mobile\s+sprint\s+\d+$/i.test(trimmed)) {
    const num = trimmed.match(/\d+/)?.[0]
    return `Mobile Sprint ${num}`
  }

  // "sprint 121" / "Sprint #121"
  const sprintNum = trimmed.match(/^(?:sprint\s*#?\s*)?(\d+)$/i)
  if (sprintNum) {
    return `Mobile Sprint ${sprintNum[1]}`
  }

  // "mobile sprint 121 something"
  const embedded = trimmed.match(/mobile\s+sprint\s+(\d+)/i)
  if (embedded) {
    return `Mobile Sprint ${embedded[1]}`
  }

  const anySprint = trimmed.match(/sprint\s+#?(\d+)/i)
  if (anySprint) {
    return `Mobile Sprint ${anySprint[1]}`
  }

  return trimmed
}

export async function getActiveMobileSprint(): Promise<{
  id: number
  name: string
  state: string
  startDate?: string
  endDate?: string
}> {
  const boardId = process.env.JIRA_MOBILE_BOARD_ID || DEFAULT_MOBILE_BOARD_ID
  const response = await jiraClient().get(`/rest/agile/1.0/board/${boardId}/sprint`, {
    params: { state: 'active' },
  })
  const active = (response.data.values ?? [])[0]
  if (!active?.name) {
    throw new Error(`No active sprint on Mobile board ${boardId}`)
  }
  return {
    id: active.id,
    name: active.name,
    state: active.state,
    startDate: active.startDate,
    endDate: active.endDate,
  }
}

async function resolveSprintName(raw: string | undefined): Promise<{
  sprintName: string
  sprintState?: string
  sprintStartDate?: string
  sprintEndDate?: string
}> {
  if (raw == null || isCurrentSprintAlias(raw)) {
    const active = await getActiveMobileSprint()
    return {
      sprintName: active.name,
      sprintState: active.state,
      sprintStartDate: active.startDate,
      sprintEndDate: active.endDate,
    }
  }
  return { sprintName: normalizeSprintName(raw) }
}

/** Group of unfinished sprint work (excludes Done + Declined) */
const OPEN_STATUSES = ['To Do', 'Backlog', 'In Progress', 'Code Review', 'Testing', 'Blocked']

function statusAliases(filter: string): string[] {
  const key = filter.trim().toLowerCase()
  const aliases: Record<string, string[]> = {
    declined: ['Declined'],
    done: ['Done'],
    complete: ['Done'],
    completed: ['Done'],
    todo: ['To Do'],
    'to do': ['To Do'],
    'to-do': ['To Do'],
    backlog: ['Backlog'],
    'in progress': ['In Progress'],
    'in-progress': ['In Progress'],
    progress: ['In Progress'],
    wip: ['In Progress'],
    'code review': ['Code Review'],
    review: ['Code Review'],
    cr: ['Code Review'],
    testing: ['Testing'],
    qa: ['Testing'],
    blocked: ['Blocked'],
    block: ['Blocked'],
    // still open / remaining work in the sprint
    open: OPEN_STATUSES,
    remaining: OPEN_STATUSES,
    left: OPEN_STATUSES,
    unfinished: OPEN_STATUSES,
    outstanding: OPEN_STATUSES,
  }
  return aliases[key] ?? [filter.trim()]
}

type SprintIssue = {
  key: string
  fields: {
    summary: string
    status: { name: string }
    customfield_10026?: number | null
  }
}

async function searchJqlAllPages(
  jql: string,
  fields: string[],
  pageSize = 100
): Promise<SprintIssue[]> {
  const issues: SprintIssue[] = []
  let nextPageToken: string | undefined

  for (;;) {
    const body: Record<string, unknown> = {
      jql,
      maxResults: pageSize,
      fields,
    }
    if (nextPageToken) body.nextPageToken = nextPageToken

    let response
    try {
      response = await jiraClient().post('/rest/api/3/search/jql', body)
    } catch (err) {
      if (axios.isAxiosError(err) && (err.response?.status === 404 || err.response?.status === 405)) {
        response = await jiraClient().post('/rest/api/3/search', {
          jql,
          maxResults: pageSize,
          fields,
          startAt: issues.length,
        })
        const batch = response.data.issues ?? []
        issues.push(...batch)
        if (issues.length >= (response.data.total ?? issues.length) || batch.length === 0) break
        continue
      }
      throw err
    }

    const batch = response.data.issues ?? []
    issues.push(...batch)
    if (response.data.isLast !== false || !response.data.nextPageToken) break
    nextPageToken = response.data.nextPageToken
  }

  return issues
}

function storyPointsOf(issue: SprintIssue): number | null {
  const raw = issue.fields.customfield_10026
  if (raw == null || Number.isNaN(Number(raw))) return null
  return Number(raw)
}

/**
 * Count tickets + Story Points in a Mobile Jira sprint.
 * Pass sprint "current" / "this week" / omit to use the active Mobile board sprint.
 */
function toSample(issue: SprintIssue): SprintTicketSample {
  return {
    key: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status.name,
    storyPoints: storyPointsOf(issue),
    url: `${process.env.JIRA_BASE_URL}/browse/${issue.key}`,
  }
}

export async function getSprintTicketStats(params: {
  sprint?: string
  statusFilter?: string
  /** Comma-separated statuses to return full lists for, e.g. "Done,Declined" */
  listStatuses?: string
  /** Max tickets per listed status (default 80) */
  listLimit?: number
}): Promise<SprintTicketStats> {
  const project = process.env.JIRA_PROJECT_KEY
  const resolved = await resolveSprintName(params.sprint)
  const { sprintName } = resolved
  const jql = `project = ${project} AND sprint = "${sprintName}" ORDER BY status ASC, updated DESC`

  const issues = await searchJqlAllPages(jql, ['summary', 'status', STORY_POINTS_FIELD])
  const byStatus: Record<string, number> = {}
  const spByStatus: Record<string, number> = {}
  let plannedTotal = 0
  let completed = 0
  let declined = 0
  let ticketsWithPoints = 0
  let ticketsWithoutPoints = 0

  for (const issue of issues) {
    const status = issue.fields.status.name
    byStatus[status] = (byStatus[status] ?? 0) + 1

    const pts = storyPointsOf(issue)
    if (pts == null) {
      ticketsWithoutPoints += 1
    } else {
      ticketsWithPoints += 1
      plannedTotal += pts
      spByStatus[status] = (spByStatus[status] ?? 0) + pts
      if (status === 'Done') completed += pts
      if (status === 'Declined') declined += pts
    }
  }

  const result: SprintTicketStats = {
    sprintName,
    sprintState: resolved.sprintState,
    sprintStartDate: resolved.sprintStartDate,
    sprintEndDate: resolved.sprintEndDate,
    jql,
    total: issues.length,
    byStatus,
    storyPoints: {
      field: 'Story Points',
      plannedTotal,
      completed,
      declined,
      remaining: Math.max(0, plannedTotal - completed - declined),
      byStatus: spByStatus,
      ticketsWithPoints,
      ticketsWithoutPoints,
    },
  }

  if (params.statusFilter?.trim()) {
    const matchedStatusNames = statusAliases(params.statusFilter)
    const matched = issues.filter(i =>
      matchedStatusNames.some(s => s.toLowerCase() === i.fields.status.name.toLowerCase())
    )
    result.statusFilter = params.statusFilter.trim()
    result.matchedStatusNames = matchedStatusNames
    result.matchedCount = matched.length
    result.matchedStoryPoints = matched.reduce((sum, i) => sum + (storyPointsOf(i) ?? 0), 0)
    result.samples = matched.slice(0, 10).map(toSample)
  }

  const listRaw = params.listStatuses?.trim()
  if (listRaw) {
    const limit = Math.min(Math.max(params.listLimit ?? 80, 1), 150)
    const lists: Record<string, SprintTicketSample[]> = {}
    for (const part of listRaw.split(/[,/|]/).map(s => s.trim()).filter(Boolean)) {
      const names = statusAliases(part)
      const matched = issues.filter(i =>
        names.some(s => s.toLowerCase() === i.fields.status.name.toLowerCase())
      )
      // Multi-status aliases like "remaining" → one combined list under that label,
      // plus per-status buckets so the bot can answer "To Do vs In Progress".
      if (names.length > 1) {
        const groupLabel =
          /^(open|remaining|left|unfinished|outstanding)$/i.test(part) ? 'Remaining' : part
        lists[groupLabel] = matched.slice(0, limit).map(toSample)
        for (const statusName of names) {
          const subset = matched.filter(i => i.fields.status.name === statusName)
          if (subset.length > 0) {
            lists[statusName] = subset.slice(0, limit).map(toSample)
          }
        }
      } else {
        lists[names[0] ?? part] = matched.slice(0, limit).map(toSample)
      }
    }
    result.lists = lists
  }

  return result
}
