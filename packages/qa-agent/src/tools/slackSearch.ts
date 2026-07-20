import type { WebClient } from '@slack/web-api'

export type RcHitKind = 'submission' | 'sign_off' | 'rc_cut' | 'testing' | 'other'

export type RcAnnouncementHit = {
  text: string
  user?: string
  ts: string
  channelId?: string
  permalink?: string
  kind: RcHitKind
  /** Higher = more important for RC status summary */
  priority: number
  source?: 'history' | 'search'
}

const ONE_WEEK_SECONDS = 7 * 24 * 60 * 60

const SUBMISSION_SIGNALS = [
  'submitted to app store',
  'submitted to play store',
  'submitted to the app store',
  'submitted to the play store',
  'submitted to app store and play store',
  'app store and play store',
  'play store for review',
  'app store for review',
  'for review',
  'submitted for review',
  'store submission',
  'sent to review',
  'uploaded to app store',
  'uploaded to play store',
]

/** "1.0.35-rc3" → "1.0.35" so channel posts that omit the rc tag still match */
export function baseVersion(version: string): string {
  return version.trim().replace(/-rc\d+$/i, '')
}

/** Extract Slack channel IDs from message text: <#C123> or <#C123|name> */
export function extractSlackChannelIds(text: string): string[] {
  const ids: string[] = []
  const seen = new Set<string>()
  for (const match of text.matchAll(/<#(C[A-Z0-9]+)(?:\|[^>]*)?>/gi)) {
    const id = match[1]
    if (id && !seen.has(id)) {
      seen.add(id)
      ids.push(id)
    }
  }
  return ids
}

function textMentionsVersion(text: string, version: string): boolean {
  const t = text.toLowerCase()
  const full = version.toLowerCase().trim()
  const base = baseVersion(version).toLowerCase()
  if (full && t.includes(full)) return true
  if (base && t.includes(base)) return true
  return false
}

const SIGN_OFF_SIGNALS = [
  'signed off',
  'sign off',
  'sign-off',
  'qa sign off',
  'testing complete',
  'testing completed',
  'ready to ship',
  'ready for release',
  'approved for release',
]

const RC_CUT_SIGNALS = [
  'rc1',
  'rc2',
  'rc3',
  'rc4',
  'release candidate',
  'rc is out',
  'rc out',
  'cut the rc',
  'rc tagged',
  'tag the rc',
]

const TESTING_SIGNALS = [
  'available for testing',
  'now available',
  'ready for testing',
  'released for testing',
  'please test',
  'testing begins',
  'smoke test',
  'run smoke',
  'regression',
]

export function classifyHit(text: string, version: string): RcHitKind | null {
  const t = text.toLowerCase()
  if (!textMentionsVersion(text, version)) return null

  if (SUBMISSION_SIGNALS.some(s => t.includes(s))) return 'submission'
  if (SIGN_OFF_SIGNALS.some(s => t.includes(s))) return 'sign_off'
  if (RC_CUT_SIGNALS.some(s => t.includes(s)) || /\brc\d+\b/i.test(text) || /\brc\b/i.test(text)) {
    return 'rc_cut'
  }
  if (TESTING_SIGNALS.some(s => t.includes(s))) return 'testing'
  if (/\b(release|released|shipping|shipped|live)\b/i.test(text)) return 'other'
  return null
}

function priorityFor(kind: RcHitKind): number {
  switch (kind) {
    case 'submission':
      return 100
    case 'sign_off':
      return 90
    case 'rc_cut':
      return 50
    case 'testing':
      return 40
    default:
      return 10
  }
}

function cleanText(text: string): string {
  let sanitized = text
  let previous: string
  do {
    previous = sanitized
    sanitized = sanitized.replace(/<[^>]+>/g, ' ')
  } while (sanitized !== previous)
  return sanitized.replace(/\s+/g, ' ').trim().slice(0, 500)
}

async function permalinkFor(
  client: WebClient,
  channelId: string,
  ts: string
): Promise<string | undefined> {
  try {
    const link = await client.chat.getPermalink({ channel: channelId, message_ts: ts })
    return link.permalink
  } catch {
    return undefined
  }
}

function pushHit(
  hits: RcAnnouncementHit[],
  hit: Omit<RcAnnouncementHit, 'priority'> & { priority?: number }
): void {
  hits.push({
    ...hit,
    priority: hit.priority ?? priorityFor(hit.kind),
  })
}

function resolveScanChannels(params: {
  channelId: string
  extraChannelIds?: string[]
}): string[] {
  const ids: string[] = []
  const seen = new Set<string>()
  const add = (id: string | undefined) => {
    const trimmed = id?.trim()
    if (!trimmed || seen.has(trimmed)) return
    seen.add(trimmed)
    ids.push(trimmed)
  }

  for (const id of params.extraChannelIds ?? []) add(id)

  const fromEnv = process.env.SLACK_RC_CHANNEL_ID?.trim()
  if (fromEnv) add(fromEnv)

  // Always include the asking context channel last (DM chatter is low value vs team channel)
  add(params.channelId)

  // If asker is in a DM (D…) and we have team channels, prefer those — still keep DM
  return ids
}

async function scanChannelHistory(
  client: WebClient,
  channelId: string,
  matchVersion: string,
  oldest: string,
  hits: RcAnnouncementHit[]
): Promise<number> {
  let scanned = 0
  let cursor: string | undefined

  const consider = async (
    text: string | undefined,
    user: string | undefined,
    ts: string,
    source: 'history' | 'search'
  ) => {
    if (!text) return
    const kind = classifyHit(text, matchVersion)
    if (!kind) return
    const permalink = await permalinkFor(client, channelId, ts)
    pushHit(hits, {
      text: cleanText(text),
      user,
      ts,
      channelId,
      permalink,
      kind,
      source,
    })
  }

  for (let page = 0; page < 15; page++) {
    let result
    try {
      result = await client.conversations.history({
        channel: channelId,
        oldest,
        limit: 200,
        cursor,
      })
    } catch (err) {
      console.warn(
        `[search_rc_announcement] history failed channel=${channelId}:`,
        err instanceof Error ? err.message : err
      )
      break
    }

    for (const msg of result.messages ?? []) {
      if (msg.subtype && msg.subtype !== 'file_share' && msg.subtype !== 'thread_broadcast') {
        continue
      }

      if (msg.text && !msg.bot_id && msg.ts) {
        scanned++
        await consider(msg.text, msg.user, msg.ts, 'history')
      }

      // Open bot/human parents so replies like Ray's store submission are found
      const replyCount = msg.reply_count ?? 0
      if (replyCount > 0 && msg.ts) {
        try {
          const replies = await client.conversations.replies({
            channel: channelId,
            ts: msg.ts,
            limit: 200,
          })
          for (const reply of replies.messages ?? []) {
            if (reply.ts === msg.ts) continue
            if (!reply.text || reply.bot_id) continue
            if (Number(reply.ts) < Number(oldest)) continue
            scanned++
            await consider(reply.text, reply.user, reply.ts!, 'history')
          }
        } catch {
          // missing scope / private — skip thread
        }
      }
    }

    cursor = result.response_metadata?.next_cursor
    if (!cursor || !(result.messages?.length)) break
  }

  return scanned
}

/**
 * Scan channel(s) for RC / store-submission signals (incl. casual thread replies).
 *
 * When asked from a DM, pass the team channel id(s) via extraChannelIds
 * (parsed from <#C…> in the user message) or set SLACK_RC_CHANNEL_ID.
 */
export async function searchRcAnnouncement(
  client: WebClient,
  params: {
    version: string
    channelId: string
    /** Additional channels (e.g. <#C046…> mentioned in the ask, or env default) */
    extraChannelIds?: string[]
  }
): Promise<{
  found: boolean
  version: string
  matchVersion: string
  channelId: string
  scannedChannels: string[]
  hits: RcAnnouncementHit[]
  scannedMessages: number
  hasSubmission: boolean
  hasSignOff: boolean
  latestLifecycle?: RcHitKind
  summary?: string
}> {
  const { version, channelId } = params
  const matchVersion = baseVersion(version) || version
  const oldest = String(Date.now() / 1000 - ONE_WEEK_SECONDS)
  const channels = resolveScanChannels({
    channelId,
    extraChannelIds: params.extraChannelIds,
  })
  const hits: RcAnnouncementHit[] = []
  let scannedMessages = 0

  for (const ch of channels) {
    scannedMessages += await scanChannelHistory(client, ch, matchVersion, oldest, hits)
  }

  // Optional user-token search across workspace, filtered to scanned channels
  const userToken = process.env.SLACK_USER_TOKEN?.trim()
  if (userToken) {
    const channelSet = new Set(channels)
    try {
      const queries = [
        `${matchVersion} submitted`,
        `${matchVersion} "app store"`,
        `${matchVersion} "for review"`,
        `${matchVersion} "play store"`,
      ]
      for (const query of queries) {
        const found = await client.search.messages({
          token: userToken,
          query,
          count: 20,
          sort: 'timestamp',
          sort_dir: 'desc',
        })
        for (const match of found.messages?.matches ?? []) {
          const ch = typeof match.channel === 'object' ? match.channel?.id : undefined
          if (!ch || !channelSet.has(ch)) continue
          const ts = match.ts
          const text = match.text
          if (!ts || !text) continue
          if (Number(ts) < Number(oldest)) continue
          scannedMessages++
          const kind = classifyHit(text, matchVersion)
          if (!kind) continue
          const permalink = await permalinkFor(client, ch, ts)
          pushHit(hits, {
            text: cleanText(text),
            user: match.user,
            ts,
            channelId: ch,
            permalink,
            kind,
            source: 'search',
          })
        }
      }
    } catch (err) {
      console.warn(
        '[search_rc_announcement] search.messages failed:',
        err instanceof Error ? err.message : err
      )
    }
  }

  const byTs = new Map<string, RcAnnouncementHit>()
  for (const hit of hits) {
    const key = `${hit.channelId ?? ''}:${hit.ts}`
    const prev = byTs.get(key)
    if (!prev || hit.priority > prev.priority) byTs.set(key, hit)
  }

  const sorted = Array.from(byTs.values()).sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority
    return Number(b.ts) - Number(a.ts)
  })

  const hasSubmission = sorted.some(h => h.kind === 'submission')
  const hasSignOff = sorted.some(h => h.kind === 'sign_off')
  const top = sorted[0]
  let summary: string | undefined
  if (hasSubmission) {
    summary =
      'STORE SUBMISSION DETECTED (hasSubmission=true). e.g. "1.0.35 submitted to App store and Play store for review". Lead with store submission — do NOT say submission was not detected.'
  } else if (hasSignOff) {
    summary = 'QA / release sign-off message detected (hasSignOff=true).'
  } else if (top?.kind === 'rc_cut') {
    summary = 'RC cut / RC tag discussion detected (testing may still be in progress).'
  }

  console.log(
    `[search_rc_announcement] version=${version} match=${matchVersion} channels=${channels.join(',')} ` +
      `scanned=${scannedMessages} hits=${sorted.length} hasSubmission=${hasSubmission} ` +
      `top=${top?.kind ?? 'none'} sample=${sorted
        .slice(0, 3)
        .map(h => `${h.kind}:${h.text.slice(0, 60)}`)
        .join(' | ')}`
  )

  return {
    found: sorted.length > 0,
    version,
    matchVersion,
    channelId,
    scannedChannels: channels,
    hits: sorted.slice(0, 15),
    scannedMessages,
    hasSubmission,
    hasSignOff,
    latestLifecycle: hasSubmission ? 'submission' : hasSignOff ? 'sign_off' : top?.kind,
    summary,
  }
}
