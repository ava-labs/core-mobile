import { tokenLookupResponseKey } from './tokenLookup'
import {
  lookupTokens,
  type LookupChunkResult,
  type LookupToken
} from './tokenLookupRequest'

type PendingLookup = {
  token: LookupToken
  resolve: (value: LookupChunkResult) => void
  reject: (reason: unknown) => void
}

let queue: PendingLookup[] = []
let flushScheduled = false

const flush = async (): Promise<void> => {
  const batch = queue
  queue = []
  flushScheduled = false

  if (batch.length === 0) return

  try {
    const { data, failedTokens } = await lookupTokens(
      batch.map(pending => pending.token)
    )

    const failed = new Set<LookupToken>(failedTokens)

    batch.forEach(pending => {
      if (failed.has(pending.token)) {
        pending.reject(new Error('Token lookup failed for this batch'))
        return
      }

      const key = tokenLookupResponseKey(pending.token)
      const info = data[key]
      pending.resolve(info ? { [key]: info } : {})
    })
  } catch (error) {
    batch.forEach(pending => pending.reject(error))
  }
}

export const enqueueTokenLookup = (
  token: LookupToken
): Promise<LookupChunkResult> => {
  return new Promise((resolve, reject) => {
    queue.push({ token, resolve, reject })

    if (!flushScheduled) {
      flushScheduled = true
      // Run after this tick so concurrent enqueues (e.g. several useQueries
      // queryFns in the same render) land in one batch / one request.
      queueMicrotask(() => {
        flush().catch(() => {
          // flush settles every entry itself; this only stops an unhandled
          // rejection escaping the microtask.
        })
      })
    }
  })
}
