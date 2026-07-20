import fs from 'fs'
import path from 'path'
import axios from 'axios'
import FormData from 'form-data'

const JIRA_BASE_URL =
  process.env.JIRA_BASE_URL ?? 'https://avalabs.atlassian.net'
const JIRA_EMAIL = process.env.JIRA_EMAIL ?? ''
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN ?? ''
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY ?? 'CP'

const client = axios.create({
  baseURL: JIRA_BASE_URL,
  auth: { username: JIRA_EMAIL, password: JIRA_API_TOKEN },
  headers: { 'Content-Type': 'application/json' }
})

export interface FailedTestInfo {
  name: string
  errorLog: string
  screenshotBase64?: string
}

async function findOpenTicket(ticketTitle: string): Promise<string | null> {
  const escapedTicketTitle = ticketTitle
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
  const jql = `project = ${JIRA_PROJECT_KEY} AND summary = "${escapedTicketTitle}" AND status != Done ORDER BY created DESC`
  const response = await client.post('/rest/api/3/issue/search', {
    jql,
    maxResults: 1,
    fields: ['summary', 'status']
  })
  const issues = response.data.issues
  return issues?.length > 0 ? issues[0].key : null
}

async function attachScreenshot(
  issueKey: string,
  screenshotBase64: string,
  testName: string
): Promise<void> {
  const tmpDir = path.join(__dirname, '../screenshots-tmp')
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

  const sanitized = testName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40)
  const filePath = path.join(tmpDir, `${sanitized}-${Date.now()}.png`)
  fs.writeFileSync(filePath, Buffer.from(screenshotBase64, 'base64'))

  const form = new FormData()
  form.append('file', fs.createReadStream(filePath))

  await axios.post(
    `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}/attachments`,
    form,
    {
      auth: { username: JIRA_EMAIL, password: JIRA_API_TOKEN },
      headers: { ...form.getHeaders(), 'X-Atlassian-Token': 'no-check' }
    }
  )

  fs.unlinkSync(filePath)
}

function buildDescription(
  specFile: string,
  failedTests: FailedTestInfo[],
  buildUrl?: string
): object {
  const failedListNodes = failedTests.map(t => ({
    type: 'listItem',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: `❌ ${t.name}` }] }
    ]
  }))

  const errorNodes = failedTests.flatMap(t => [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: `📌 ${t.name}`, marks: [{ type: 'strong' }] }
      ]
    },
    {
      type: 'codeBlock',
      attrs: { language: 'text' },
      content: [{ type: 'text', text: t.errorLog }]
    }
  ])

  const buildInfoNodes = buildUrl
    ? [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Bitrise Build: ',
              marks: [{ type: 'strong' }]
            },
            {
              type: 'text',
              text: buildUrl,
              marks: [{ type: 'link', attrs: { href: buildUrl } }]
            }
          ]
        }
      ]
    : []

  return {
    type: 'doc',
    version: 1,
    content: [
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'Failed Tests' }]
      },
      { type: 'bulletList', content: failedListNodes },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'Error Logs' }]
      },
      ...errorNodes,
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'Build Info' }]
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Spec file: ', marks: [{ type: 'strong' }] },
          { type: 'text', text: specFile }
        ]
      },
      ...buildInfoNodes
    ]
  }
}

export async function createFailureTicketIfNeeded(params: {
  specTitle: string
  specFile: string
  failedTests: FailedTestInfo[]
  buildUrl?: string
}): Promise<void> {
  if (params.failedTests.length === 0) return

  const ticketTitle = `[Automated Test]: ${params.specTitle}`

  const existingKey = await findOpenTicket(ticketTitle)
  if (existingKey) {
    console.log(
      `\n⚠️  Jira ticket already exists: ${JIRA_BASE_URL}/browse/${existingKey} — skipping creation`
    )
    return
  }

  const response = await client.post('/rest/api/3/issue', {
    fields: {
      project: { key: JIRA_PROJECT_KEY },
      summary: ticketTitle,
      description: buildDescription(
        params.specFile,
        params.failedTests,
        params.buildUrl
      ),
      issuetype: { name: 'Bug' },
      labels: ['mobile-qai', 'automation-failure'],
      parent: { key: 'CP-14439' },
      components: [{ name: 'Mobile Application' }],
      priority: { name: 'Medium' }
    }
  })

  const ticketKey = response.data.key
  console.log(`\n🎫 Jira ticket created: ${JIRA_BASE_URL}/browse/${ticketKey}`)

  // Attach screenshots
  for (const test of params.failedTests) {
    if (test.screenshotBase64) {
      await attachScreenshot(ticketKey, test.screenshotBase64, test.name).catch(
        e => {
          console.error(
            `Failed to attach screenshot for "${test.name}":`,
            e.message
          )
        }
      )
    }
  }
}
