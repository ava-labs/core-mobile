import './loadEnv'
console.log('[env] JIRA_BASE_URL=', process.env.JIRA_BASE_URL)
console.log(
  '[env] QA_ANTHROPIC_API_KEY:',
  process.env.QA_ANTHROPIC_API_KEY ? 'SET' : 'MISSING'
)

import fs from 'fs'
import path from 'path'
import { App } from '@slack/bolt'
import { runAgent, type AgentMedia } from './agent'
import { extractSlackChannelIds } from './tools/slackSearch'
import { addMessage, getRecentMessages } from './store'
import {
  collectThreadFiles,
  downloadSlackFiles,
  filesFromMessage,
  pickJiraAttachments,
  pickVisionImages,
  type SlackFileRef,
} from './tools/slackFiles'

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
})

const ONE_WEEK_IN_SECONDS = 7 * 24 * 60 * 60
const ACTIVE_THREADS_FILE = path.join(process.cwd(), '.active-threads.json')

/** Threads where the bot was @mentioned (or already replied). Follow-ups need no mention. */
const activeThreads = new Set<string>()

let botUserId: string | undefined

function loadActiveThreads(): void {
  try {
    if (!fs.existsSync(ACTIVE_THREADS_FILE)) return
    const parsed = JSON.parse(fs.readFileSync(ACTIVE_THREADS_FILE, 'utf8')) as string[]
    const cutoff = Date.now() / 1000 - ONE_WEEK_IN_SECONDS
    for (const key of parsed) {
      const ts = Number(key.split(':').pop())
      if (!Number.isFinite(ts) || ts >= cutoff) activeThreads.add(key)
    }
  } catch (err) {
    console.warn('[threads] failed to load active threads:', err)
  }
}

function persistActiveThreads(): void {
  try {
    fs.writeFileSync(ACTIVE_THREADS_FILE, JSON.stringify([...activeThreads], null, 0))
  } catch (err) {
    console.warn('[threads] failed to persist active threads:', err)
  }
}

function threadKey(channel: string, threadTs: string): string {
  return `${channel}:${threadTs}`
}

function markThreadActive(channel: string, threadTs: string): void {
  const key = threadKey(channel, threadTs)
  if (activeThreads.has(key)) return
  activeThreads.add(key)
  persistActiveThreads()
  console.log(`[threads] active ← ${key}`)
}

function isThreadActive(channel: string, threadTs: string): boolean {
  return activeThreads.has(threadKey(channel, threadTs))
}

loadActiveThreads()
console.log(`[threads] loaded ${activeThreads.size} active thread(s) from disk`)

type HistoryMessage = { role: 'user' | 'assistant'; content: string }

async function fetchThreadHistory(
  client: InstanceType<typeof App>['client'],
  channel: string,
  threadTs: string,
  currentTs: string
): Promise<HistoryMessage[]> {
  const oldest = String(Date.now() / 1000 - ONE_WEEK_IN_SECONDS)

  const result = await client.conversations.replies({
    channel,
    ts: threadTs,
    oldest,
    limit: 200,
  })

  const ackOnly =
    /^(on it[,!]?\s*)?(checking now|looking into it|one moment|working on it)\b/i

  const raw: HistoryMessage[] = []
  for (const msg of result.messages ?? []) {
    if (!msg.ts || msg.ts === currentTs) continue
    // Exclude bot "On it…" posted *after* the current user message — including it
    // can make the next Anthropic call look like assistant prefill (400).
    if (Number(msg.ts) >= Number(currentTs)) continue

    const text = msg.text?.replace(/<@[^>]+>\s*/g, '').trim()
    if (!text) continue
    if (ackOnly.test(text.replace(/[^\w\s]/g, '').trim())) continue

    const isBot =
      !!msg.bot_id || (botUserId != null && msg.user === botUserId)
    raw.push({ role: isBot ? 'assistant' : 'user', content: text })
  }

  // Claude requires strict user/assistant alternation starting with user
  const normalized: HistoryMessage[] = []
  for (const msg of raw) {
    if (normalized.length === 0 && msg.role === 'assistant') continue
    const last = normalized[normalized.length - 1]
    if (last?.role === msg.role) {
      // Merge consecutive same-role turns (Slack often has multiple human posts)
      last.content = `${last.content}\n${msg.content}`
      continue
    }
    normalized.push(msg)
  }

  // runAgent appends the current user turn — history must not end on assistant
  while (normalized.length > 0 && normalized[normalized.length - 1]?.role === 'assistant') {
    normalized.pop()
  }

  return normalized
}

async function botAlreadyInThread(
  client: InstanceType<typeof App>['client'],
  channel: string,
  threadTs: string
): Promise<boolean> {
  if (isThreadActive(channel, threadTs)) return true

  try {
    const result = await client.conversations.replies({
      channel,
      ts: threadTs,
      limit: 50,
    })

    const participated = (result.messages ?? []).some(
      m => !!m.bot_id || (botUserId != null && m.user === botUserId)
    )
    if (participated) markThreadActive(channel, threadTs)
    return participated
  } catch (err) {
    console.warn(
      `[threads] conversations.replies failed for ${threadKey(channel, threadTs)}:`,
      err instanceof Error ? err.message : err
    )
    return false
  }
}

async function resolveUserName(
  client: InstanceType<typeof App>['client'],
  userId: string
): Promise<string> {
  const info = await client.users.info({ user: userId }).catch(() => null)
  return info?.user?.real_name ?? info?.user?.name ?? userId
}

async function loadThreadMedia(
  client: InstanceType<typeof App>['client'],
  channel: string,
  threadTs: string,
  currentFiles: SlackFileRef[]
): Promise<AgentMedia> {
  const threadFiles = await collectThreadFiles(client, channel, threadTs).catch(() => [] as SlackFileRef[])
  const merged = [...filesFromMessage({ files: currentFiles }), ...threadFiles]
  const seen = new Set<string>()
  const unique = merged.filter(f => {
    const key = f.id || f.url_private || f.name || ''
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })

  const downloaded = await downloadSlackFiles(unique)
  const visionImages = pickVisionImages(downloaded)
  // Attach Slack originals only — never Claude vision re-encodes / HTML junk
  return {
    attachmentPaths: pickJiraAttachments(downloaded),
    visionImages,
  }
}

async function handleUserRequest(params: {
  client: InstanceType<typeof App>['client']
  say: (args: { text: string; thread_ts?: string }) => Promise<unknown>
  channel: string
  threadTs: string
  messageTs: string
  userId: string
  userMessage: string
  files?: SlackFileRef[]
  storeAsDirect?: boolean
}): Promise<void> {
  const {
    client,
    say,
    channel,
    threadTs,
    messageTs,
    userId,
    userMessage,
    files = [],
    storeAsDirect = true,
  } = params

  const media = await loadThreadMedia(client, channel, threadTs, files)
  const hasMedia = media.attachmentPaths.length > 0
  const text =
    userMessage.trim() ||
    (hasMedia
      ? 'Please review the attached screenshot(s)/video(s) and help create a bug ticket.'
      : '')

  if (!text) return

  markThreadActive(channel, threadTs)

  if (storeAsDirect) {
    const userName = await resolveUserName(client, userId)
    addMessage({
      ts: messageTs,
      userName,
      text: hasMedia ? `${text} [+${media.attachmentPaths.length} attachment(s)]` : text,
      source: 'direct',
    })
  }

  await say({ text: 'On it, checking now... 🔍', thread_ts: threadTs })

  try {
    const history = await fetchThreadHistory(client, channel, threadTs, messageTs)
    const recentContext = getRecentMessages()
    const threadLink = `https://slack.com/app_redirect?channel=${channel}&message_ts=${threadTs}`
    const response = await runAgent(text, history, recentContext, threadLink, media, {
      client,
      channelId: channel,
      mentionedChannelIds: extractSlackChannelIds(text),
    })
    await say({ text: response, thread_ts: threadTs })
  } catch (err) {
    console.error(err)
    const detail = err instanceof Error ? err.message : 'Please try again.'
    await say({ text: `Something went wrong: ${detail}`, thread_ts: threadTs })
  }
}

// First touch: @core-mobile-qai ...
app.event('app_mention', async ({ event, client, say }) => {
  const threadTs = event.thread_ts ?? event.ts
  // Mark immediately so no-@ follow-ups work even if agent is still running
  markThreadActive(event.channel, threadTs)

  const userMessage = event.text.replace(/<@[^>]+>/g, '').trim()
  const files = filesFromMessage(event as { files?: SlackFileRef[] })

  await handleUserRequest({
    client,
    say,
    channel: event.channel,
    threadTs,
    messageTs: event.ts,
    userId: event.user ?? '',
    userMessage,
    files,
  })
})

/**
 * Thread follow-ups (no @ required), DMs, and @qa-core capture.
 * Requires Slack Event Subscriptions: message.channels + message.groups
 * (app_mention alone is NOT enough for no-mention replies).
 */
app.event('message', async ({ event, client, say }) => {
  const msg = event as {
    subtype?: string
    bot_id?: string
    text?: string
    ts: string
    user?: string
    channel: string
    thread_ts?: string
    channel_type?: string
    files?: SlackFileRef[]
  }

  // Allow file_share; skip other subtypes / bots
  if (msg.bot_id) return
  if (msg.subtype && msg.subtype !== 'file_share') return
  if (!msg.user) return

  const files = filesFromMessage(msg)
  const text = (msg.text ?? '').trim()
  if (!text && files.length === 0) return

  // Mentions are handled by app_mention — avoid double replies
  if (botUserId && text.includes(`<@${botUserId}>`)) return

  try {
    // 1) DM — always respond
    if (msg.channel_type === 'im') {
      console.log(`[message] DM from ${msg.user}`)
      await handleUserRequest({
        client,
        say,
        channel: msg.channel,
        threadTs: msg.thread_ts ?? msg.ts,
        messageTs: msg.ts,
        userId: msg.user,
        userMessage: text,
        files,
      })
      return
    }

    // 2) Reply inside a thread the bot is already in — no @ needed
    if (msg.thread_ts) {
      const inBotThread = await botAlreadyInThread(client, msg.channel, msg.thread_ts)
      console.log(
        `[message] thread reply channel=${msg.channel} thread=${msg.thread_ts} ` +
          `inBotThread=${inBotThread} text=${text.slice(0, 80)}`
      )
      if (inBotThread) {
        await handleUserRequest({
          client,
          say,
          channel: msg.channel,
          threadTs: msg.thread_ts,
          messageTs: msg.ts,
          userId: msg.user,
          userMessage: text,
          files,
        })
        return
      }
    } else {
      console.log(
        `[message] channel msg (no thread) channel=${msg.channel} — ignored unless @qa-core`
      )
    }

    // 3) @qa-core group mention — store only (no reply)
    const qaGroupId = process.env.SLACK_QA_GROUP_ID
    const rawText = msg.text ?? ''
    const isGroupMention = qaGroupId
      ? rawText.includes(qaGroupId)
      : rawText.includes('<!subteam^')

    if (!isGroupMention) return

    const userName = await resolveUserName(client, msg.user)
    let sanitizedText = rawText
    let previousText: string
    do {
      previousText = sanitizedText
      sanitizedText = sanitizedText.replace(/<[^>]+>/g, '')
    } while (sanitizedText !== previousText)
    const groupText = sanitizedText.trim()
    if (!groupText) return

    const threadLink = msg.thread_ts
      ? `https://slack.com/app_redirect?channel=${msg.channel}&message_ts=${msg.thread_ts}`
      : `https://slack.com/app_redirect?channel=${msg.channel}&message_ts=${msg.ts}`

    addMessage({
      ts: msg.ts,
      userName,
      text: groupText,
      source: 'group',
      ...(threadLink ? { threadLink } : {}),
    } as Parameters<typeof addMessage>[0] & { threadLink?: string })
  } catch (err) {
    console.error('[message] handler error:', err)
    try {
      await say({
        text: `Something went wrong handling that message: ${
          err instanceof Error ? err.message : 'please try again'
        }`,
        thread_ts: msg.thread_ts ?? msg.ts,
      })
    } catch {
      // ignore
    }
  }
})

;(async () => {
  const auth = await app.client.auth.test()
  botUserId = typeof auth.user_id === 'string' ? auth.user_id : undefined
  await app.start()
  console.log(`⚡ mobile-qai is running! (bot user: ${botUserId ?? 'unknown'})`)
  console.log(
    '[slack] Thread follow-ups without @ require Event Subscriptions: ' +
      'message.channels + message.groups (and scopes channels:history, groups:history). ' +
      'app_mention alone will NOT deliver no-mention replies.'
  )
})()
