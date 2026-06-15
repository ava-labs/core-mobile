import axios from 'axios'
import fs from 'fs'
import FormData from 'form-data'

const client = axios.create({
  baseURL: process.env.JIRA_BASE_URL,
  auth: {
    username: process.env.JIRA_EMAIL ?? '',
    password: process.env.JIRA_API_TOKEN ?? '',
  },
  headers: { 'Content-Type': 'application/json' },
})

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
  const response = await client.post('/rest/api/3/issue/search', {
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

async function attachScreenshot(issueKey: string, screenshotPath: string): Promise<void> {
  if (!fs.existsSync(screenshotPath)) return

  const form = new FormData()
  form.append('file', fs.createReadStream(screenshotPath))

  await axios.post(
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
      },
    }
  )
}

export async function createBugTicket(params: {
  summary: string
  description: string
  priority: string
  threadLink?: string
}): Promise<{ ticketKey: string; ticketUrl: string }> {
  const descriptionContent: object[] = [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: params.description }],
    },
  ]

  if (params.threadLink) {
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

  const response = await client.post('/rest/api/3/issue', {
    fields: {
      project: { key: process.env.JIRA_PROJECT_KEY },
      summary: params.summary,
      description: { type: 'doc', version: 1, content: descriptionContent },
      issuetype: { name: 'Bug' },
      labels: ['mobile-qai'],
      parent: { key: 'CP-32' },
      components: [{ name: 'Mobile Application' }],
      priority: { name: params.priority },
    },
  })

  const ticketKey = response.data.key
  const ticketUrl = `${process.env.JIRA_BASE_URL}/browse/${ticketKey}`
  return { ticketKey, ticketUrl }
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

  const response = await client.post('/rest/api/3/issue', {
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
  url: string
}

export async function searchVersionTickets(version: string): Promise<VersionTicket[]> {
  const jql = `project = ${process.env.JIRA_PROJECT_KEY} AND summary ~ "${version}" AND issuetype = Bug ORDER BY created DESC`
  const response = await client.post('/rest/api/3/issue/search', {
    jql,
    maxResults: 30,
    fields: ['summary', 'status'],
  })
  return (response.data.issues ?? []).map((issue: { key: string; fields: { summary: string; status: { name: string } } }) => ({
    key: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status.name,
    url: `${process.env.JIRA_BASE_URL}/browse/${issue.key}`,
  }))
}
