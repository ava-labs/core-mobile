import axios from 'axios'

const client = axios.create({
  baseURL: process.env.JIRA_BASE_URL,
  auth: {
    username: process.env.JIRA_EMAIL ?? '',
    password: process.env.JIRA_API_TOKEN ?? '',
  },
  headers: { 'Content-Type': 'application/json' },
})

export async function createTicket(params: {
  summary: string
  description: string
  buildUrl: string
  testName?: string
}): Promise<{ ticketKey: string; ticketUrl: string }> {
  const response = await client.post('/rest/api/3/issue', {
    fields: {
      project: { key: process.env.JIRA_PROJECT_KEY },
      summary: params.summary,
      description: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: params.description },
            ],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: `Bitrise Build: ${params.buildUrl}` },
            ],
          },
        ],
      },
      issuetype: { name: 'Bug' },
      labels: ['mobile-qai', 'automation-failure'],
    },
  })

  const ticketKey = response.data.key
  const ticketUrl = `${process.env.JIRA_BASE_URL}/browse/${ticketKey}`
  return { ticketKey, ticketUrl }
}
