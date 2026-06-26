import type { QueryKey } from '@tanstack/react-query'
import { queryClient } from 'contexts/ReactQueryProvider'

// Markr's `listOrders` indexer lags on-chain confirmation by a few seconds.
// A single invalidate-at-broadcast races the indexer and leaves the UI on
// the prior status; spreading three invalidates over ~30s lets the indexer
// catch up without the user having to navigate.
const STAGGERED_DELAYS_MS = [5_000, 15_000, 30_000] as const

// Per-queryKey tracking so successive recurring actions (e.g. cancel then
// pause on different cards within 30s) dedupe their timers against the
// pending batch instead of stacking. The keyed map uses JSON.stringify on
// the QueryKey — the recurring callers all pass a tiny constant-tuple key
// so the serialization cost is trivial and avoids needing a deep-equality
// helper.
const pending = new Map<string, Set<ReturnType<typeof setTimeout>>>()

const keyOf = (queryKey: QueryKey): string => JSON.stringify(queryKey)

/**
 * Schedule a staggered batch of `queryClient.invalidateQueries` calls for
 * `queryKey` at t=5s/15s/30s. Calling again for the same key clears the
 * prior batch first — protects against rapid repeated actions stacking
 * timers, and lets a fresh successful flow reset the catch-up window.
 *
 * Used by the recurring-swap hooks/util to settle the optimistic "pending"
 * UI back to server truth after `executeFirstFill` / `executeAction`.
 */
export function scheduleStaggeredInvalidate(queryKey: QueryKey): void {
  const k = keyOf(queryKey)

  const existing = pending.get(k)
  if (existing) {
    for (const id of existing) clearTimeout(id)
    existing.clear()
  }

  const set = new Set<ReturnType<typeof setTimeout>>()
  pending.set(k, set)

  for (const delayMs of STAGGERED_DELAYS_MS) {
    const id = setTimeout(() => {
      set.delete(id)
      // Drop the Map entry once the last timer in this batch fires — keeps
      // `pending` from growing unboundedly if a future caller passes
      // many distinct queryKeys. The recurring flow uses a single constant
      // key in practice, so this is mostly hygiene.
      if (set.size === 0 && pending.get(k) === set) {
        pending.delete(k)
      }
      queryClient.invalidateQueries({ queryKey })
    }, delayMs)
    set.add(id)
  }
}

/**
 * Test-only: cancel any pending staggered timers for `queryKey`. Production
 * code never calls this — the dedup-on-rescheduling behavior subsumes it.
 */
export function _cancelStaggeredInvalidateForTests(queryKey: QueryKey): void {
  const k = keyOf(queryKey)
  const existing = pending.get(k)
  if (!existing) return
  for (const id of existing) clearTimeout(id)
  existing.clear()
  pending.delete(k)
}
