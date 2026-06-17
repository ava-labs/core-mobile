import { addListener } from '@reduxjs/toolkit'
import type { QueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { onAppUnlocked } from 'store/app'
import { RECURRING_SCHEDULES_QK } from './useRecurringSchedules'

// `refetchOnWindowFocus: true` on `useRecurringSchedules` already handles the
// brief-backgrounding case — React Query's `focusManager` is wired to
// `AppState` in `ReactQueryProvider`, so any active observer refetches when
// the app transitions to foreground.
//
// That covers `AppState` foregrounding, but NOT the post-PIN/biometric unlock
// transition (WalletState LOCKED/NONEXISTENT → ACTIVE), which can happen
// while `AppState === 'active'` (cold start, return after lock timeout,
// re-auth). At that point the user hasn't necessarily landed on a screen
// observing the schedules query yet — they might be on Portfolio. Marking
// the query stale here means the next mount of the banner / manage screen
// refetches against Markr.
//
// Mirrors `useNetworksListener`'s shape.
export const useRecurringSchedulesListener = (
  queryClient: QueryClient
): void => {
  const dispatch = useDispatch()

  // `dispatch(addListener(...))` returns the unsubscribe fn when the
  // listener middleware is registered, but the default redux typings for
  // `dispatch` don't reflect that overload — the return is widened to
  // `unknown` and the `useEffect` cleanup contract rejects it. Use
  // `@ts-expect-error` (not `@ts-ignore`) so this suppression breaks
  // loudly the day redux's typings catch up.
  useEffect(() => {
    // @ts-expect-error see comment above
    const unsubscribe: () => void = dispatch(
      addListener({
        actionCreator: onAppUnlocked,
        effect: () => {
          queryClient.invalidateQueries({ queryKey: RECURRING_SCHEDULES_QK })
        }
      })
    )
    return unsubscribe
  }, [dispatch, queryClient])
}
