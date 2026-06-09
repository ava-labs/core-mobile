import Anthropic from '@anthropic-ai/sdk'
import { triggerBuild, getBuildStatus, type TestType } from './tools/bitrise'
import { createFailureTicket, createBugTicket, type FailedTest } from './tools/jira'

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
        tag: {
          type: 'string',
          description: 'Optional test tag filter (e.g. "[Payment]", "[Wallet]")',
        },
      },
      required: ['testType'],
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
        summary: { type: 'string', description: 'Ticket title — be descriptive and concise' },
        description: { type: 'string', description: 'Bug details gathered from the conversation' },
      },
      required: ['summary', 'description'],
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
]

async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  if (name === 'create_bug_ticket') {
    const result = await createBugTicket({
      summary: input.summary as string,
      description: input.description as string,
    })
    return JSON.stringify(result)
  }

  if (name === 'trigger_build') {
    const result = await triggerBuild({
      testType: ((input.testType as string) ?? 'smoke') as TestType,
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

  return 'Unknown tool'
}

export async function runAgent(userMessage: string): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userMessage },
  ]

  const systemPrompt = `You are core-mobile-QAi, a QA AI agent for the Core Mobile app (a crypto wallet by Ava Labs).
You help QA engineers run automated tests and manage failures.

When asked to run tests:
1. For smoke or performance tests: trigger immediately
2. For full regression: ALWAYS ask first — "Internal (Bitrise emulator) or External (AWS real device)?" before triggering
3. Confirm the build was triggered with the build URL

Test types:
- smoke: runs [Smoke] tagged tests on Bitrise emulator
- performance: runs [Performance] tagged tests on Bitrise emulator
- regression-internal: full regression on Bitrise emulator
- regression-external: full regression on AWS Device Farm (real devices)

Platform policy: ALL pipelines run BOTH iOS and Android together. If someone asks to run only one platform, tell them it's not supported — both platforms always run together.

When reporting test failures:
- Create ONE Jira ticket per spec file (not per individual test)
- Ticket title format: [Automated Test]: {describe title}
- If an open ticket with the same title already exists (not Done), skip creation and report the existing ticket
- Include all failed test names, error logs, and screenshots in the description

Always respond in the same language the user used (Korean or English).
Be concise and friendly.`

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
