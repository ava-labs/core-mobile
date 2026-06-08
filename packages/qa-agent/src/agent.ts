import Anthropic from '@anthropic-ai/sdk'
import { triggerBuild, getBuildStatus } from './tools/bitrise'
import { createTicket } from './tools/jira'

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
          enum: ['smoke', 'regression', 'performance'],
          description: 'Type of test to run',
        },
        platform: {
          type: 'string',
          enum: ['ios', 'android'],
          description: 'Platform to run tests on',
        },
        tag: {
          type: 'string',
          description: 'Optional test tag filter (e.g. "[Payment]", "[Wallet]")',
        },
      },
      required: ['testType', 'platform'],
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
    name: 'create_jira_ticket',
    description: 'Create a Jira bug ticket for a test failure',
    input_schema: {
      type: 'object' as const,
      properties: {
        summary: { type: 'string', description: 'Ticket title' },
        description: { type: 'string', description: 'Failure details' },
        buildUrl: { type: 'string', description: 'Bitrise build URL' },
        testName: { type: 'string', description: 'Name of the failing test' },
      },
      required: ['summary', 'description', 'buildUrl'],
    },
  },
]

async function executeTool(name: string, input: Record<string, string | undefined>): Promise<string> {
  if (name === 'trigger_build') {
    const result = await triggerBuild({
      testType: (input.testType ?? 'smoke') as 'smoke' | 'regression' | 'performance',
      platform: (input.platform ?? 'ios') as 'ios' | 'android',
      tag: input.tag,
    })
    return JSON.stringify(result)
  }

  if (name === 'get_build_status') {
    const result = await getBuildStatus(input.buildSlug ?? '')
    return JSON.stringify(result)
  }

  if (name === 'create_jira_ticket') {
    const result = await createTicket({
      summary: input.summary ?? '',
      description: input.description ?? '',
      buildUrl: input.buildUrl ?? '',
      testName: input.testName,
    })
    return JSON.stringify(result)
  }

  return 'Unknown tool'
}

export async function runAgent(userMessage: string): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userMessage },
  ]

  const systemPrompt = `You are mobile-qai, a QA AI agent for the Core Mobile app (a crypto wallet by Ava Labs).
You help QA engineers run automated tests and manage failures.

When asked to run tests:
1. Trigger the appropriate Bitrise build
2. Confirm the build was triggered with the build URL

When tests fail and you're asked to report:
1. Create a Jira ticket for each failure
2. Report the ticket links back

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
          const result = await executeTool(block.name, block.input as Record<string, string>)
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result })
        }
      }

      messages.push({ role: 'user', content: toolResults })
    }
  }
}
