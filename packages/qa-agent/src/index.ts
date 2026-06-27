import 'dotenv/config'
import { App } from '@slack/bolt'
import { runAgent } from './agent'
import { addMessage, getRecentMessages } from './store'

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
})

const ONE_WEEK_IN_SECONDS = 7 * 24 * 60 * 60

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

  const raw: HistoryMessage[] = []
  for (const msg of result.messages ?? []) {
    if (msg.ts === currentTs) continue
    const text = msg.text?.replace(/<@[^>]+>\s*/g, '').trim()
    if (!text) continue
    raw.push({ role: msg.bot_id ? 'assistant' : 'user', content: text })
  }

  // Claude requires strict user/assistant alternation starting with user
  const normalized: HistoryMessage[] = []
  for (const msg of raw) {
    if (normalized.length === 0 && msg.role === 'assistant') continue
    const last = normalized[normalized.length - 1]
    if (last?.role === msg.role) continue
    normalized.push(msg)
  }

  return normalized
}

async function resolveUserName(
  client: InstanceType<typeof App>['client'],
  userId: string
): Promise<string> {
  const info = await client.users.info({ user: userId }).catch(() => null)
  return info?.user?.real_name ?? info?.user?.name ?? userId
}

// Respond to direct mentions: @mobile-qai <message>
app.event('app_mention', async ({ event, client, say }) => {
  const threadTs = event.thread_ts ?? event.ts
  const userMessage = event.text.replace(/<@[^>]+>/g, '').trim()

  // Store this direct interaction for today's briefing
  const userName = await resolveUserName(client, event.user ?? '')
  addMessage({ ts: event.ts, userName, text: userMessage, source: 'direct' })

  await say({ text: 'On it, checking now... 🔍', thread_ts: threadTs })

  try {
    const history = await fetchThreadHistory(client, event.channel, threadTs, event.ts)
    const recentContext = getRecentMessages()
    const threadLink = `https://slack.com/app_redirect?channel=${event.channel}&message_ts=${threadTs}`
    const response = await runAgent(userMessage, history, recentContext, threadLink)
    await say({ text: response, thread_ts: threadTs })
  } catch (err) {
    console.error(err)
    await say({ text: 'Something went wrong. Please try again.', thread_ts: threadTs })
  }
})

// Listen for group (@qa-core) mentions — store without responding
app.event('message', async ({ event, client }) => {
  const msg = event as {
    subtype?: string
    bot_id?: string
    text?: string
    ts: string
    user?: string
    channel: string
    thread_ts?: string
  }

  if (msg.subtype || msg.bot_id) return // skip edits, deletes, and bot messages

  const qaGroupId = process.env.SLACK_QA_GROUP_ID
  const isGroupMention = qaGroupId
    ? msg.text?.includes(qaGroupId)
    : msg.text?.includes('<!subteam^')

  if (!isGroupMention || !msg.text || !msg.user) return

  const userName = await resolveUserName(client, msg.user)
  const text = msg.text.replace(/<[^>]+>/g, '').trim()
  if (!text) return

  const threadLink = msg.thread_ts
    ? `https://slack.com/app_redirect?channel=${msg.channel}&message_ts=${msg.thread_ts}`
    : `https://slack.com/app_redirect?channel=${msg.channel}&message_ts=${msg.ts}`

  addMessage({
    ts: msg.ts,
    userName,
    text,
    source: 'group',
    // attach thread link for briefing
    ...(threadLink ? { threadLink } : {}),
  } as Parameters<typeof addMessage>[0] & { threadLink?: string })
})

// Respond to direct messages
app.message(async ({ message, say }) => {
  if (message.subtype) return

  const userMessage = (message as { text: string }).text?.trim()
  if (!userMessage) return

  await say('On it, checking now... 🔍')

  try {
    const recentContext = getRecentMessages()
    const response = await runAgent(userMessage, [], recentContext)
    await say(response)
  } catch (err) {
    console.error(err)
    await say('Something went wrong. Please try again.')
  }
})

;(async () => {
  await app.start()
  console.log('⚡ mobile-qai is running!')
})()
