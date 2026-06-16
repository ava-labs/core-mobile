import Logger from 'utils/Logger'
import { commonStorage } from 'utils/mmkv/storages'

// Cap the persisted set so a power user with years of recurring schedules
// can't grow it unboundedly. Each entry is `${orderId}:${executionIndex}` —
// realistically ~50 bytes — so 1000 entries ≈ 50KB per (account, chain). On
// overflow we drop the oldest insertions (Set preserves insertion order),
// which is fine because the failure snackbar is a one-shot notification and
// stale "seen" state for a long-dead schedule has no UI consequence.
const MAX_SEEN_FAILURES = 1000

// Persisted shape: `{ initialised: boolean, entries: string[] }`. The
// `initialised` flag distinguishes "fresh install, no history yet" (don't
// snackbar pre-existing failures) from "device with history, missing entries
// are genuinely new failures." See loadSeenFailures + isSeenFailuresInitialised.
type PersistedShape = { initialised: boolean; entries: string[] }

// Per-(account, chain) key. The previous version keyed only on ownerAddress;
// scoping by chain ensures dedupe state can't leak across chains if Markr
// ever surfaces the same orderId twice for the same address on different
// chains.
const storageKeyFor = (ownerAddress: string, chainId: number): string =>
  `recurringSwap.seenFailures.${ownerAddress.toLowerCase()}.${chainId}`

function readPersisted(
  ownerAddress: string,
  chainId: number
): PersistedShape | undefined {
  const raw = commonStorage.getString(storageKeyFor(ownerAddress, chainId))
  if (!raw) return undefined
  try {
    const parsed = JSON.parse(raw) as unknown
    // New shape.
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      'initialised' in parsed &&
      'entries' in parsed
    ) {
      const { initialised, entries } = parsed as Partial<PersistedShape>
      if (typeof initialised === 'boolean' && Array.isArray(entries)) {
        return {
          initialised,
          entries: entries.filter((v): v is string => typeof v === 'string')
        }
      }
    }
    // Legacy shape (raw string array). Treat as already-initialised so a user
    // upgrading from the previous build keeps their dedupe history without
    // re-surfacing every historical failure on the next refetch.
    if (Array.isArray(parsed)) {
      return {
        initialised: true,
        entries: parsed.filter((v): v is string => typeof v === 'string')
      }
    }
    return undefined
  } catch (err) {
    Logger.warn('[seenFailures] failed to parse stored set; resetting', err)
    return undefined
  }
}

export function loadSeenFailures(
  ownerAddress: string,
  chainId: number
): Set<string> {
  const persisted = readPersisted(ownerAddress, chainId)
  return new Set(persisted?.entries ?? [])
}

// Returns `true` when this (account, chain) has a stored snapshot — i.e. the
// failure watcher has seen at least one listOrders response on this device.
// On the first observation we *seed* the set without surfacing snackbars so
// users with pre-existing failures don't get spammed (e.g. fresh install,
// app reinstall, or wallet swap clears MMKV).
export function isSeenFailuresInitialised(
  ownerAddress: string,
  chainId: number
): boolean {
  return readPersisted(ownerAddress, chainId)?.initialised ?? false
}

export function saveSeenFailures(
  ownerAddress: string,
  chainId: number,
  set: Set<string>
): void {
  // Trim from the front (oldest insertions) when over the cap. Array.from on a
  // Set preserves insertion order, so this keeps the most recently observed
  // failures — the ones whose snackbars the user most recently saw.
  const arr = Array.from(set)
  const trimmed =
    arr.length > MAX_SEEN_FAILURES
      ? arr.slice(arr.length - MAX_SEEN_FAILURES)
      : arr
  const payload: PersistedShape = { initialised: true, entries: trimmed }
  commonStorage.set(
    storageKeyFor(ownerAddress, chainId),
    JSON.stringify(payload)
  )
}

export const makeFailureKey = (
  orderId: string,
  executionIndex: number
): string => `${orderId}:${executionIndex}`
