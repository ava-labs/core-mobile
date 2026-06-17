import { loadArrayFromStorage, saveArrayToStorage } from 'utils/mmkv/utils'
import { commonStorage } from 'utils/mmkv/storages'
import Logger from 'utils/Logger'

// Cap the persisted set so a power user with years of recurring schedules
// can't grow it unboundedly. Each entry is `${orderId}:${executionIndex}` —
// realistically ~50 bytes — so 1000 entries ≈ 50KB per (account, chain). On
// overflow we drop the oldest insertions (Set preserves insertion order),
// which is fine because the failure snackbar is a one-shot notification and
// stale "seen" state for a long-dead schedule has no UI consequence.
const MAX_SEEN_FAILURES = 1000

// Per-(account, chain) keys. Scoping by chain ensures dedupe state can't
// leak across chains if Markr ever surfaces the same orderId twice for the
// same address on different chains. `addresses.toLowerCase()` collapses
// checksum casing so callers don't have to normalise upstream.
const entriesKeyFor = (ownerAddress: string, chainId: number): string =>
  `recurringSwap.seenFailures.${ownerAddress.toLowerCase()}.${chainId}`

// Separate boolean key for the initialised flag distinguishes "fresh
// install / reinstall / wallet swap cleared MMKV" (don't snackbar
// pre-existing failures) from "device with history, missing entries are
// genuinely new failures." A separate key lets the entries shape stay as a
// bare array, parseable by the shared `loadArrayFromStorage` helper without
// a wrapper object.
const initKeyFor = (ownerAddress: string, chainId: number): string =>
  `${entriesKeyFor(ownerAddress, chainId)}:initialised`

// Returns `true` when this (account, chain) has been seeded with at least
// one snapshot. The watcher uses this gate to seed silently on the first
// observation so users with pre-existing failures don't get spammed.
export function isSeenFailuresInitialised(
  ownerAddress: string,
  chainId: number
): boolean {
  return commonStorage.getBoolean(initKeyFor(ownerAddress, chainId)) ?? false
}

export function loadSeenFailures(
  ownerAddress: string,
  chainId: number
): Set<string> {
  // `loadArrayFromStorage` handles missing keys + JSON parse errors
  // (returning []). We additionally guard the runtime type because the
  // helper's `as T[]` cast doesn't validate — a corrupted MMKV value of an
  // unexpected shape would otherwise reach the Set constructor.
  const raw = loadArrayFromStorage<unknown>(
    commonStorage,
    entriesKeyFor(ownerAddress, chainId)
  )
  if (!Array.isArray(raw)) return new Set()
  return new Set(raw.filter((v): v is string => typeof v === 'string'))
}

export function saveSeenFailures(
  ownerAddress: string,
  chainId: number,
  set: Set<string>
): void {
  // Trim from the front (oldest insertions). `Array.from(Set)` preserves
  // insertion order, so we keep the most recently observed failures —
  // the ones whose snackbars the user most recently saw.
  const arr = Array.from(set)
  const trimmed =
    arr.length > MAX_SEEN_FAILURES
      ? arr.slice(arr.length - MAX_SEEN_FAILURES)
      : arr
  saveArrayToStorage(
    commonStorage,
    entriesKeyFor(ownerAddress, chainId),
    trimmed
  )
  // Without a try/catch the init-flag write is the one silent failure
  // mode left on this path (`saveArrayToStorage` logs internally). If
  // this set throws and entries DID land, the next refetch sees
  // `isInitialised === false` and re-enters the silent-seed path, which
  // suppresses snackbars for genuinely new failures. Logging surfaces
  // the underlying MMKV problem in Sentry instead of letting the
  // suppression appear as "the watcher just isn't firing".
  try {
    commonStorage.set(initKeyFor(ownerAddress, chainId), true)
  } catch (err) {
    Logger.error('[seenFailures] init-flag persistence failed', err)
  }
}

export const makeFailureKey = (
  orderId: string,
  executionIndex: number
): string => `${orderId}:${executionIndex}`
