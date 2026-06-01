import { commonStorage } from 'utils/mmkv/storages'

const FAILURES_KEY = 'recurringSwap.seenFailures'
const AUTOCANCELLED_KEY = 'recurringSwap.autoCancelled'

function loadSet(key: string): Set<string> {
  const raw = commonStorage.getString(key)
  if (!raw) return new Set()
  try {
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function saveSet(key: string, set: Set<string>): void {
  commonStorage.set(key, JSON.stringify([...set]))
}

export const loadSeenFailures = (): Set<string> => loadSet(FAILURES_KEY)
export const saveSeenFailures = (s: Set<string>): void =>
  saveSet(FAILURES_KEY, s)

export const loadAutoCancelled = (): Set<string> => loadSet(AUTOCANCELLED_KEY)
export const saveAutoCancelled = (s: Set<string>): void =>
  saveSet(AUTOCANCELLED_KEY, s)

export const makeFailureKey = (
  orderId: string,
  executionIndex: number
): string => `${orderId}:${executionIndex}`
