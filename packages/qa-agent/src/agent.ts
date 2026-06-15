import Anthropic from '@anthropic-ai/sdk'
import { triggerBuild, getBuildStatus, type TestType } from './tools/bitrise'
import { createFailureTicket, createBugTicket, searchVersionTickets, type FailedTest } from './tools/jira'
import { getDailyAutomationReport, getManualTestProgress } from './tools/testrail'
import type { StoredMessage } from './store'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const tools: Anthropic.Tool[] = [
  {
    name: 'trigger_build',
    description: 'Trigger automated tests on Bitrise',
    input_schema: {
      type: 'object' as const,
      properties: {
        testType: {
          type: 'string',
          enum: ['smoke', 'regression-internal', 'regression-external', 'performance'],
          description: 'Type of test to run. regression-internal = Bitrise emulator, regression-external = AWS real device',
        },
        branch: {
          type: 'string',
          description: 'Branch name or RC tag to run tests against (e.g. "main", "feat/my-feature", "1.0.34-rc1")',
        },
        tag: {
          type: 'string',
          description: 'Optional test tag filter (e.g. "[Payment]", "[Wallet]")',
        },
      },
      required: ['testType', 'branch'],
    },
  },
  {
    name: 'get_build_status',
    description: 'Check the status of a Bitrise build',
    input_schema: {
      type: 'object' as const,
      properties: {
        buildSlug: { type: 'string', description: 'Bitrise build slug' },
      },
      required: ['buildSlug'],
    },
  },
  {
    name: 'create_bug_ticket',
    description: 'Create a Jira bug ticket from a casual Slack conversation. Use this when someone reports a bug or asks to create a ticket without structured test data.',
    input_schema: {
      type: 'object' as const,
      properties: {
        summary: { type: 'string', description: 'Ticket title provided by the user (e.g. "Swap - unable to tap swap button")' },
        description: { type: 'string', description: 'Bug details gathered from the conversation' },
        priority: {
          type: 'string',
          enum: ['Highest', 'High', 'Medium', 'Low'],
          description: 'Priority chosen by the user',
        },
        threadLink: { type: 'string', description: 'Slack thread link to attach to the ticket' },
      },
      required: ['summary', 'description', 'priority'],
    },
  },
  {
    name: 'create_failure_ticket',
    description: 'Create a Jira bug ticket for a failed test spec. One ticket per spec file. Skips if an open ticket with the same title already exists.',
    input_schema: {
      type: 'object' as const,
      properties: {
        specTitle: {
          type: 'string',
          description: 'The describe() title from the spec file, e.g. "[Smoke] Stake on Testnet"',
        },
        specFile: {
          type: 'string',
          description: 'Relative path to the spec file, e.g. "specs/transactions/cChain/stakeTestnet.spec.ts"',
        },
        failedTests: {
          type: 'array',
          description: 'List of failed tests with their error logs and optional screenshot paths',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Test name (it() title)' },
              errorLog: { type: 'string', description: 'Error message and stack trace' },
              screenshotPath: { type: 'string', description: 'Absolute path to screenshot file' },
            },
            required: ['name', 'errorLog'],
          },
        },
        buildUrl: { type: 'string', description: 'Bitrise build URL' },
      },
      required: ['specTitle', 'specFile', 'failedTests', 'buildUrl'],
    },
  },
  {
    name: 'get_daily_automation_report',
    description: 'Fetch automation test results from TestRail for a given date. Use for "automation daily report" or Feature 5 daily report.',
    input_schema: {
      type: 'object' as const,
      properties: {
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format. Defaults to today if omitted.',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_manual_test_progress',
    description: 'Fetch manual TestRail test run progress filtered by RC version string (e.g. "1.0.34").',
    input_schema: {
      type: 'object' as const,
      properties: {
        version: {
          type: 'string',
          description: 'RC version string to filter test runs by (e.g. "1.0.34")',
        },
      },
      required: ['version'],
    },
  },
  {
    name: 'search_version_tickets',
    description: 'Search Jira for Bug tickets whose title contains the given version string (e.g. "1.0.34"). Use for RC blocker status.',
    input_schema: {
      type: 'object' as const,
      properties: {
        version: {
          type: 'string',
          description: 'RC version string (e.g. "1.0.34")',
        },
      },
      required: ['version'],
    },
  },
]

async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  if (name === 'create_bug_ticket') {
    const result = await createBugTicket({
      summary: input.summary as string,
      description: input.description as string,
      priority: input.priority as string,
      threadLink: input.threadLink as string | undefined,
    })
    return JSON.stringify(result)
  }

  if (name === 'trigger_build') {
    const result = await triggerBuild({
      testType: ((input.testType as string) ?? 'smoke') as TestType,
      branch: input.branch as string,
      tag: input.tag as string | undefined,
    })
    return JSON.stringify(result)
  }

  if (name === 'get_build_status') {
    const result = await getBuildStatus((input.buildSlug as string) ?? '')
    return JSON.stringify(result)
  }

  if (name === 'create_failure_ticket') {
    const result = await createFailureTicket({
      specTitle: input.specTitle as string,
      specFile: input.specFile as string,
      failedTests: input.failedTests as FailedTest[],
      buildUrl: input.buildUrl as string,
    })
    if (result.skipped) {
      return JSON.stringify({ ...result, message: 'Open ticket already exists, skipped creation' })
    }
    return JSON.stringify(result)
  }

  if (name === 'get_daily_automation_report') {
    const result = await getDailyAutomationReport(input.date as string | undefined)
    return JSON.stringify(result)
  }

  if (name === 'get_manual_test_progress') {
    const result = await getManualTestProgress(input.version as string)
    return JSON.stringify(result)
  }

  if (name === 'search_version_tickets') {
    const result = await searchVersionTickets(input.version as string)
    return JSON.stringify(result)
  }

  return 'Unknown tool'
}

type HistoryMessage = { role: 'user' | 'assistant'; content: string }

function buildRecentContextSection(messages: StoredMessage[]): string {
  if (messages.length === 0) return ''

  const lines = messages.map((m, i) => {
    const source = m.source === 'group' ? '[group mention]' : '[direct]'
    const link = m.threadLink ? ` — ${m.threadLink}` : ''
    return `${i + 1}. [${m.date}] ${source} ${m.userName}: ${m.text}${link}`
  })

  return `\n\nRecent recorded interactions (up to 7 days, use for briefing and RC announcement checks):\n${lines.join('\n')}`
}

export async function runAgent(
  userMessage: string,
  history: HistoryMessage[] = [],
  todaysContext: StoredMessage[] = [],
  currentThreadLink?: string
): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    ...history,
    { role: 'user', content: userMessage },
  ]

  const todaysContextSection = buildRecentContextSection(todaysContext)
  const threadSection = currentThreadLink
    ? `\n\nCurrent Slack thread link (use as threadLink when creating a bug ticket): ${currentThreadLink}`
    : ''

  const systemPrompt = `You are core-mobile-QAi, a QA AI agent for the Core Mobile app (a crypto wallet by Ava Labs).
You help QA engineers run automated tests and manage failures.

When asked to run tests, ALWAYS ask for BOTH of the following before triggering — even if one seems obvious:
1. Branch or tag: ask "Which branch or tag should I run this on? (e.g. main, feat/my-feature, 1.0.34-rc1)"
2. Test type (if not already specified): ask which of the four types — smoke, performance, regression-internal, regression-external

Only call trigger_build after you have both answers. Never assume a default branch.
After triggering, always share the Bitrise build URL with the user.

Test types:
- smoke: runs [Smoke] tagged tests on Bitrise emulator
- performance: runs [Performance] tagged tests on Bitrise emulator
- regression-internal: full regression on Bitrise emulator (internal virtual devices)
- regression-external: full regression on AWS Device Farm (real physical devices)

Platform policy: ALL pipelines run BOTH iOS and Android together. If someone asks to run only one platform, tell them it's not supported — both platforms always run together.

When reporting test failures:
- Create ONE Jira ticket per spec file (not per individual test)
- Ticket title format: [Automated Test]: {describe title}
- If an open ticket with the same title already exists (not Done), skip creation and report the existing ticket
- Include all failed test names, error logs, and screenshots in the description

When asked to create a Jira bug ticket from Slack (feature 4 — manual bug report):
1. FIRST ask: "What should the ticket title be? (e.g. Swap - unable to tap swap button)"
2. THEN ask: "What priority? Highest / High / Medium / Low"
3. Call create_bug_ticket with the title, priority, description gathered from the thread, and the current thread link
4. After creation, reply in the thread with the Jira ticket link

Automation daily report (Feature 5):
- Triggered by "automation daily report", "today's automation report", or similar
- Call get_daily_automation_report (defaults to today)
- Report format: overall pass rate, total/passed/failed counts, then numbered list of failed test titles
- Keep it concise — spec titles only, no per-test details

RC release testing status (Feature 6):
- Triggered by "[version] RC status", "[version] release status", or similar (e.g. "1.0.34 RC status")
- FIRST check the recent recorded interactions for an RC announcement containing that version (look for patterns like "X.X.XX RC", "is now available for testing", "available for testing")
- If NO announcement found → respond: "No RC has been released for [version] yet." — do NOT call any tools
- If announcement found → call all three tools: search_version_tickets + get_manual_test_progress + get_daily_automation_report
- Report in three sections:
  1. 🐛 Bug Status: list version-tagged Jira tickets with their current status
  2. 🧪 Manual Testing: per-run progress% and pass% (e.g. "1.0.34 Mnemonic: 95% tested, 90% passing")
  3. 🤖 Automation: today's overall pass rate and failed test titles

Today's QA briefing:
- When someone says "today's qa briefing" (or similar), summarize today's recorded interactions as a numbered list
- Each item should include: who requested it, what was requested, and a link to the Slack thread if available
- Format: "1. [name] requested [action] — [link]"
- Cover both direct requests and group (@qa-core) mentions

Always respond in the same language the user used.
Be concise and friendly.${todaysContextSection}${threadSection}`

  // Agent loop
  while (true) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages,
    })

    messages.push({ role: 'assistant', content: response.content })

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find(b => b.type === 'text')
      return textBlock?.type === 'text' ? textBlock.text : ''
    }

    if (response.stop_reason === 'tool_use') {
      const toolResults: Anthropic.ToolResultBlockParam[] = []

      for (const block of response.content) {
        if (block.type === 'tool_use') {
          const result = await executeTool(block.name, block.input as Record<string, unknown>)
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result })
        }
      }

      messages.push({ role: 'user', content: toolResults })
    }
  }
}
