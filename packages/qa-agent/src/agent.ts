import './loadEnv'
import Anthropic from '@anthropic-ai/sdk'
import type { WebClient } from '@slack/web-api'
import { triggerBuild, getBuildStatus, type TestType } from './tools/bitrise'
import {
  createFailureTicket,
  createBugTicket,
  searchVersionTickets,
  getSprintTicketStats,
  searchMobileTickets,
  type FailedTest,
} from './tools/jira'
import {
  getDailyAutomationReport,
  getAutomationReportForVersion,
  getManualTestProgress,
} from './tools/testrail'
import { extractSlackChannelIds, searchRcAnnouncement } from './tools/slackSearch'
import type { StoredMessage } from './store'
import type { DownloadedSlackFile } from './tools/slackFiles'

export type AgentMedia = {
  /** Files to attach to Jira (images + videos) */
  attachmentPaths: string[]
  /** Images Claude can see */
  visionImages: DownloadedSlackFile[]
}

export type AgentSlackContext = {
  client: WebClient
  channelId: string
  /** Channels mentioned in the user text, e.g. <#C046YF16REU> */
  mentionedChannelIds?: string[]
}


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
    description:
      'Create a Jira bug ticket from a casual Slack conversation. Use this when someone reports a bug or asks to create a ticket without structured test data. summary and description MUST be written in English even if the Slack conversation is in Korean or another language.',
    input_schema: {
      type: 'object' as const,
      properties: {
        summary: {
          type: 'string',
          description:
            'English ticket title only (e.g. "Swap - unable to tap swap button"). Never use Korean or other non-English text.',
        },
        description: {
          type: 'string',
          description:
            'English bug details as Markdown (rendered as rich Jira ADF). Prefer this exact structure with blank lines between sections:\n\n## Steps to Reproduce\n1. ...\n2. ...\n\n## Expected Result\n...\n\n## Actual Result\n...\n\n## Notes\n- ...\n\nUse ## headings (not **bold** labels). Never use Korean.',
        },
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
    description:
      'Fetch automation TestRail runs for a calendar date (main/CI). Use ONLY for "automation daily report" (Feature 5). Do NOT use for RC status.',
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
    name: 'get_automation_report_for_version',
    description:
      'Fetch automation TestRail runs whose run NAME contains the version/tag (e.g. "1.0.35" or "1.0.35-rc1"). Use this for RC status Feature 6. Never use today\'s main-branch date runs.',
    input_schema: {
      type: 'object' as const,
      properties: {
        version: {
          type: 'string',
          description: 'Version or RC tag string that appears in the TestRail run title (e.g. "1.0.35-rc1")',
        },
      },
      required: ['version'],
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
    description:
      'Search open Jira Bug tickets whose summary/title contains the version string (e.g. "1.0.34"). Used for RC bug/blocker status — match is by title containing the version, not a special blocker field.',
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
  {
    name: 'search_rc_announcement',
    description:
      'Scan Slack channel history + thread replies (last 7 days) for ANY messages about a version — not only formal announcements. Includes casual posts like "1.0.35 submitted to App store and Play store for review". When the user asks from a DM but points at a team channel (<#C…>), pass that channelId so Ray-style thread replies are found. Classifies submission / sign_off / rc_cut / testing.',
    input_schema: {
      type: 'object' as const,
      properties: {
        version: {
          type: 'string',
          description: 'RC version string (e.g. "1.0.35") — prefer base version without -rcN',
        },
        channelId: {
          type: 'string',
          description:
            'Optional Slack channel ID to scan (e.g. C046YF16REU from <#C046YF16REU>). If omitted, uses the current channel plus any mentioned/env RC channels.',
        },
      },
      required: ['version'],
    },
  },
  {
    name: 'search_mobile_jira_tickets',
    description:
      'Search Jira for Core Mobile tickets (ALWAYS scoped to component = "Mobile Application"). Use when someone asks to find a past bug/ticket by symptoms or keywords, e.g. "1D select not working bug", "swap button bug". Not for sprint board status (use get_sprint_ticket_stats) and not for RC version title bugs (use search_version_tickets).',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description:
            'Search keywords in English when possible (UI labels, feature names). Example: "1D select chart" for a chart time-filter bug. Extract distinctive terms from the user request.',
        },
        issueType: {
          type: 'string',
          description: 'Optional. Pass "Bug" to only search bugs. Omit for all issue types.',
        },
        includeClosed: {
          type: 'boolean',
          description:
            'Include Done/Declined tickets (default true). Set false only when user wants open tickets only.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_sprint_ticket_stats',
    description:
      'Jira Mobile sprint ticket counts, optional per-status lists, and Story Points. Handles ANY status question — Done, Declined, To Do, In Progress, Blocked, Code Review, Testing, Backlog, or "remaining/open". Pass sprint "current" for the active sprint.',
    input_schema: {
      type: 'object' as const,
      properties: {
        sprint: {
          type: 'string',
          description:
            'Sprint reference: "Mobile Sprint 121", "121", or "current"/"this week"/"this sprint". Defaults to current if omitted.',
        },
        statusFilter: {
          type: 'string',
          description:
            'Optional status for count + samples, e.g. "Blocked", "In Progress", "To Do", "Declined", "Done", or "remaining" (all open statuses).',
        },
        listStatuses: {
          type: 'string',
          description:
            'Comma-separated statuses to return ticket lists for. Examples: "To Do", "In Progress,Blocked", "Done,Declined", "remaining". Use whenever the user asks what tickets are in a status (not only Done/Declined).',
        },
      },
      required: [],
    },
  },
]

async function executeTool(
  name: string,
  input: Record<string, unknown>,
  media?: AgentMedia,
  slack?: AgentSlackContext
): Promise<string> {
  try {
    if (name === 'create_bug_ticket') {
      const result = await createBugTicket({
        summary: input.summary as string,
        description: input.description as string,
        priority: input.priority as string,
        threadLink: input.threadLink as string | undefined,
        attachmentPaths: media?.attachmentPaths,
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

    if (name === 'get_automation_report_for_version') {
      const result = await getAutomationReportForVersion(input.version as string)
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

    if (name === 'search_rc_announcement') {
      if (!slack?.client || !slack.channelId) {
        return JSON.stringify({
          error: true,
          message: 'No Slack channel context — cannot scan channel history',
        })
      }
      const toolChannel = (input.channelId as string | undefined)?.trim()
      const extra = [
        ...(slack.mentionedChannelIds ?? []),
        ...(toolChannel ? [toolChannel] : []),
      ]
      const result = await searchRcAnnouncement(slack.client, {
        version: input.version as string,
        channelId: slack.channelId,
        extraChannelIds: extra,
      })
      return JSON.stringify(result)
    }

    if (name === 'get_sprint_ticket_stats') {
      const result = await getSprintTicketStats({
        sprint: input.sprint as string | undefined,
        statusFilter: input.statusFilter as string | undefined,
        listStatuses: input.listStatuses as string | undefined,
      })
      return JSON.stringify(result)
    }

    if (name === 'search_mobile_jira_tickets') {
      const result = await searchMobileTickets({
        query: input.query as string,
        issueType: input.issueType as string | undefined,
        includeClosed: input.includeClosed as boolean | undefined,
      })
      return JSON.stringify(result)
    }

    return 'Unknown tool'
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[tool:${name}]`, message)
    return JSON.stringify({ error: true, tool: name, message })
  }
}

type HistoryMessage = { role: 'user' | 'assistant'; content: string }

function buildRecentContextSection(messages: StoredMessage[]): string {
  if (messages.length === 0) return ''

  const lines = messages.map((m, i) => {
    const source = m.source === 'group' ? '[group mention]' : '[direct]'
    const link = m.threadLink ? ` — ${m.threadLink}` : ''
    return `${i + 1}. [${m.date}] ${source} ${m.userName}: ${m.text}${link}`
  })

  return `\n\nRecent recorded interactions (up to 7 days — ONLY messages where the bot was @mentioned or @qa-core was tagged; NOT the full channel. For RC status use search_rc_announcement instead):\n${lines.join('\n')}`
}

function buildUserContent(
  userMessage: string,
  media: AgentMedia | undefined,
  includeVision: boolean
): Anthropic.ContentBlockParam[] {
  const visionBlocks: Anthropic.ImageBlockParam[] = includeVision
    ? (media?.visionImages ?? []).flatMap(img => {
        if (!img.base64 || !img.mediaType) return []
        return [
          {
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: img.mediaType,
              data: img.base64,
            },
          },
        ]
      })
    : []

  const mediaNoteParts: string[] = []
  if (includeVision && (media?.visionImages.length ?? 0) > 0) {
    mediaNoteParts.push(
      `There are ${media!.visionImages.length} screenshot(s)/image(s) attached — you CAN see them below. Describe what you see and use that for the bug write-up.`
    )
  } else if (!includeVision && (media?.attachmentPaths.length ?? 0) > 0) {
    mediaNoteParts.push(
      'Media files were downloaded for Jira, but vision failed/was skipped. Ask for a short text description if needed.'
    )
  } else if ((media?.attachmentPaths.length ?? 0) === 0) {
    mediaNoteParts.push(
      'WARNING: No Slack media was successfully downloaded for this turn (common cause: missing files:read Slack bot scope, or auth redirected to HTML). Do NOT claim screenshots were attached unless create_bug_ticket returns attached filenames.'
    )
  }

  const videoPaths = (media?.attachmentPaths ?? []).filter(
    p => !(media?.visionImages ?? []).some(v => v.localPath === p)
  )
  if (videoPaths.length > 0) {
    mediaNoteParts.push(
      `There are also ${videoPaths.length} other media file(s) (e.g. video) prepared for Jira. You cannot analyze video frames; ask for a short text description if needed.`
    )
  }

  return [
    ...visionBlocks,
    {
      type: 'text',
      text:
        mediaNoteParts.length > 0
          ? `${mediaNoteParts.join('\n')}\n\nUser message:\n${userMessage}`
          : userMessage,
    },
  ]
}

export async function runAgent(
  userMessage: string,
  history: HistoryMessage[] = [],
  todaysContext: StoredMessage[] = [],
  currentThreadLink?: string,
  media?: AgentMedia,
  slack?: AgentSlackContext
): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.QA_ANTHROPIC_API_KEY })

  const wantVision = (media?.visionImages.length ?? 0) > 0
  let includeVision = wantVision

  // Sanitize thread history: models like claude-sonnet-4-6 reject assistant prefill
  // (conversation must end with a user message before each create call).
  const safeHistory: HistoryMessage[] = []
  for (const msg of history) {
    if (safeHistory.length === 0 && msg.role === 'assistant') continue
    const last = safeHistory[safeHistory.length - 1]
    if (last?.role === msg.role) {
      last.content = `${last.content}\n${msg.content}`
      continue
    }
    safeHistory.push({ ...msg })
  }
  while (safeHistory.length > 0 && safeHistory[safeHistory.length - 1]?.role === 'assistant') {
    safeHistory.pop()
  }

  const messages: Anthropic.MessageParam[] = [
    ...safeHistory,
    { role: 'user', content: buildUserContent(userMessage, media, includeVision) },
  ]

  // Ensure mentioned channels from this turn are available to tools even if the model forgets
  if (slack) {
    const fromText = extractSlackChannelIds(userMessage)
    slack.mentionedChannelIds = [
      ...new Set([...(slack.mentionedChannelIds ?? []), ...fromText]),
    ]
  }

  const todaysContextSection = buildRecentContextSection(todaysContext)
  const mentionedChannels = slack?.mentionedChannelIds?.length
    ? `\n\nSlack channels mentioned in this request (scan these for RC status): ${slack.mentionedChannelIds.join(', ')}`
    : ''
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

Screenshots & media from Slack:
- You CAN view screenshots/images when they are provided in the user message (vision). NEVER say you cannot view screenshots if images are attached.
- Use screenshots to infer the bug title and description (screen name, broken UI, error text, etc.).
- Videos cannot be frame-analyzed; they are still attached to Jira automatically. Ask for a brief text summary of the video if needed.
- Screenshots are embedded inline in the Jira description when download+upload succeeds.
- ONLY say screenshots were added if create_bug_ticket returns a non-empty "attached" array. If attached is [] / missing, say the media could not be downloaded (often Slack files:read scope) and ask the user to re-upload or paste.

When asked to create a Jira bug ticket from Slack (feature 4 — manual bug report):
1. If screenshots are available, propose a title + description from what you see (user can edit). Still ask for priority if unknown.
2. If no media and details are missing, ask for title then priority.
3. Call create_bug_ticket with the title, priority, description gathered from the thread/images, and the current thread link
4. After creation, reply in the thread with the Jira ticket link and note any attached media

CRITICAL — Jira ticket language (always enforce):
- Even if the user writes in Korean (or any non-English language), the Jira ticket **summary (title) and description MUST be in English**.
- Translate the user's request and screenshot findings into clear English before calling create_bug_ticket.
- You may still reply to the user in Korean (or whatever language they used), but the ticket fields themselves are English-only.
- Do not put Korean text in the Jira summary or description.

CRITICAL — Jira description formatting (always enforce):
- Write description as Markdown with ## section headings and numbered/bulleted lists.
- Required sections when applicable:
  ## Steps to Reproduce
  ## Expected Result
  ## Actual Result
  ## Notes
- Do NOT use **Bold Label:** lines for section titles — use ## headings so Jira renders them as real headings.
- Example:

## Steps to Reproduce
1. Navigate to the chart screen
2. Tap the "1D" time filter button

## Expected Result
The "1D" button shows a black selected background.

## Actual Result
The "1D" button looks selected but the black background does not render correctly.

## Notes
- Red circle in the screenshot highlights the affected area
- Screenshot and video attached for reference

Automation daily report (Feature 5):
- Triggered by "automation daily report", "today's automation report", or similar
- Call get_daily_automation_report (defaults to today)
- Report format: overall pass rate, total/passed/failed counts, then numbered list of failed test titles
- Keep it concise — spec titles only, no per-test details

RC release testing status (Feature 6):
- Triggered by "[version] RC status", "[version] release status", or similar (e.g. "1.0.35 RC status")
- Do NOT rely only on the in-memory "recorded interactions" store.
- ALWAYS call search_rc_announcement(version) first (channel history + threads, last 7 days).
  - This is NOT limited to formal announcements — treat casual thread replies the same
    (e.g. Ray: "1.0.35 submitted to App store and Play store for review").
  - Prefer the *base* version for channel search (e.g. "1.0.35", not only "1.0.35-rc3").
  - CRITICAL: If the user asks from a DM but mentions a team channel (<#C…> / "read from the channel"),
    pass that channelId to search_rc_announcement (or rely on mentioned channels in context).
    Do NOT only scan the DM — store submissions live in the team channel threads.
- Then ALWAYS call: search_version_tickets + get_manual_test_progress + get_automation_report_for_version
- CRITICAL: For automation under RC status, use get_automation_report_for_version(version) ONLY. NEVER use get_daily_automation_report for RC status.
- For automation/manual/bugs you may try both base version and -rcN tag.
- If get_automation_report_for_version returns noMatchingRuns=true → say no TestRail automation runs whose *title* contains that version/tag. Do NOT show main-branch date runs.
- Bug filter: open Bugs whose *title* contains the version string. List key/summary/status/priority.
- Manual: use each run's "compact" field (e.g. "98% Passing / 100% Tested").

Channel lifecycle hits from search_rc_announcement (VERY IMPORTANT):
- Read hasSubmission / hasSignOff / summary / latestLifecycle from the tool JSON first.
- If hasSubmission === true OR any hit.kind === submission OR summary mentions STORE SUBMISSION:
  - MUST lead with "*🚀 Store submission*" and quote/link the hit.
  - NEVER say "submission not detected" in that case.
  - rc3 smoke / rc_cut hits are secondary context only.
- Else if hasSignOff: lead with sign-off.
- Else report rc_cut / testing as current stage.
- Casual thread replies count (not only formal announcements). Use hit.permalink when present.

Slack mrkdwn formatting (ALWAYS — Slack does NOT support ## headings or GitHub tables):
- NEVER use "##", "###", or markdown tables (|---|).
- Section titles: "*🐛 Bug Status*" (single * for bold), blank line, then bullets.
- Manual example: "• *1.0.34 Final* — 98% Passing / 100% Tested :white_check_mark:"
- Automation: "*🤖 Automation (version X)*" then pass rate + failed list. No suite tables.
- Keep the reply scannable and short.

Today's QA briefing:
- When someone says "today's qa briefing" (or similar), summarize today's recorded interactions as a numbered list
- Each item should include: who requested it, what was requested, and a link to the Slack thread if available
- Format: "1. [name] requested [action] — [link]"
- Cover both direct requests and group (@qa-core) mentions

Find a Mobile Jira ticket by symptom/keyword (Feature 8):
- Triggered by: "find the bug about…", "find the 1D select bug", "what was that old swap ticket"
- ALWAYS call search_mobile_jira_tickets — it is hard-scoped to Component = "Mobile Application" only.
- Put distinctive English keywords in query (e.g. "1D select", "chart time filter"). May retry with fewer/broader terms if empty.
- For bugs specifically, pass issueType "Bug". includeClosed defaults true (historical tickets).
- Reply: best match first with key + link + summary + status; then a few alternatives if several hit. If none, say so and suggest better keywords.
- Do NOT use this for sprint status counts (Feature 7) or RC version title search (Feature 6).

Sprint status check (Feature 7 — Jira board, NOT RC version):
- Triggered by ANY sprint board question: status breakdown, how many / list for a status, or story points.
  Examples: declined count, "what's left in To Do", "how many In Progress", "Blocked list", "Done and Declined lists", SP planned vs completed
- Supported statuses (not only Done/Declined): Done, Declined, To Do, Backlog, In Progress, Code Review, Testing, Blocked
- "remaining" / "open" → listStatuses or statusFilter "remaining" (excludes Done + Declined)
- "sprint 121" = Mobile Sprint 121. "this sprint"/current = active board sprint. NEVER confuse with app version 1.0.x / RC tools.
- ALWAYS call get_sprint_ticket_stats(sprint?, statusFilter?, listStatuses?)
  - Count only ("how many Blocked?") → statusFilter "Blocked" OR read byStatus
  - Want the actual tickets → listStatuses with that status (e.g. "To Do", "In Progress,Blocked")
  - Multiple statuses → comma-separated listStatuses
  - Current sprint → sprint "current" or omit
  - Story points → storyPoints (plannedTotal / completed / declined / remaining)
- Reply: name the sprint, give counts first, then bullets "• CP-123 — summary" when lists are requested (truncate if long).

Always respond in the same language the user used.
Be concise and friendly.
Use Slack mrkdwn only (*bold*, bullets). Never use ## headings in Slack replies.${todaysContextSection}${mentionedChannels}${threadSection}`

  // Agent loop
  while (true) {
    let response: Anthropic.Message
    try {
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: systemPrompt,
        tools,
        messages,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const visionFailed = includeVision && /could not process image/i.test(msg)
      if (visionFailed) {
        console.warn('[agent] vision rejected by API — retrying without images:', msg)
        includeVision = false
        // Reset to history + text-only user turn (drop failed assistant-less state)
        messages.length = 0
        messages.push(...safeHistory)
        messages.push({
          role: 'user',
          content: buildUserContent(userMessage, media, false),
        })
        continue
      }
      throw err
    }

    messages.push({ role: 'assistant', content: response.content })

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find(b => b.type === 'text')
      return textBlock?.type === 'text' ? textBlock.text : ''
    }

    if (response.stop_reason === 'tool_use') {
      const toolResults: Anthropic.ToolResultBlockParam[] = []

      for (const block of response.content) {
        if (block.type === 'tool_use') {
          const result = await executeTool(
            block.name,
            block.input as Record<string, unknown>,
            media,
            slack
          )
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result })
        }
      }

      if (toolResults.length === 0) {
        return 'I tried to use a tool but got no result. Please try again.'
      }
      messages.push({ role: 'user', content: toolResults })
      continue
    }

    // max_tokens / other — don't loop with a trailing assistant turn (prefill 400)
    const textBlock = response.content.find(b => b.type === 'text')
    if (textBlock?.type === 'text' && textBlock.text.trim()) return textBlock.text
    return 'I hit a response limit mid-reply. Ask me to continue, or narrow the request.'
  }
}
