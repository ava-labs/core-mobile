import { useQuery, UseQueryResult } from '@tanstack/react-query'
import type { Address } from 'viem'
import type { RecurringOrder } from '@avalabs/fusion-sdk'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import FusionService from 'features/swap/services/FusionService'
import { useIsFusionServiceReady } from 'features/swap/hooks/useZustandStore'
import Logger from 'utils/Logger'

export const RECURRING_SCHEDULES_QK = [
  ReactQueryKeys.RECURRING_SCHEDULES
] as const

type Options = {
  /**
   * Poll interval in milliseconds. When set, the observer refetches
   * `listOrders` on this cadence as long as the screen owning the observer
   * is mounted (React Query handles pause-on-background + cleanup on
   * unmount automatically).
   *
   * Only the management screen sets this — the banner / swap-modal
   * observers leave it `false` so they don't generate background traffic
   * when the user is on Activity / Swap without explicitly looking at
   * recurring schedules.
   */
  refetchIntervalMs?: number | false
  /**
   * Override the default 5-minute `staleTime`. The management screen passes
   * `0` so every mount refetches against Markr — the user is about to take
   * destructive per-row actions and shouldn't tap Cancel against a stale
   * snapshot. Banner / swap-modal observers omit it and keep the default.
   */
  staleTime?: number
}

/**
 * Lists recurring schedules for `(ownerAddress, chainId)` via the SDK.
 *
 * Status filter is intentionally omitted — the management screen renders all four
 * (`active | completed | cancelled | paused`) with per-state badges, so a single
 * query covers every UI surface that needs the list (banner count, in-modal row,
 * management screen).
 */
export function useRecurringSchedules(
  ownerAddress: string | undefined,
  chainId: number | undefined,
  options: Options = {}
): UseQueryResult<readonly RecurringOrder[], Error> {
  const [isFusionServiceReady] = useIsFusionServiceReady()
  const { refetchIntervalMs = false, staleTime = 5 * 60_000 } = options

  return useQuery<readonly RecurringOrder[]>({
    enabled:
      isFusionServiceReady &&
      ownerAddress !== undefined &&
      ownerAddress !== '' &&
      chainId !== undefined,
    queryKey: [...RECURRING_SCHEDULES_QK, ownerAddress, chainId],
    staleTime,
    refetchOnWindowFocus: true,
    // `refetchInterval` is per-observer in React Query — only the
    // management screen passes a value here, so the banner observers stay
    // event-driven (focus / unlock / staggered post-action invalidate).
    refetchInterval: refetchIntervalMs,
    queryFn: async () => {
      const markrRecurring = FusionService.markrRecurring
      if (!markrRecurring) {
        throw new Error(
          'useRecurringSchedules: markrRecurring namespace not available'
        )
      }
      try {
        // `listOrders` now returns the full `{ address, count, orders }`
        // response per the Markr OpenAPI spec. We only surface `orders` to
        // consumers — `address` is the echoed query input and `count` is just
        // `orders.length` on a non-paginated endpoint, so neither adds info
        // the UI needs today.
        const response = await markrRecurring.listOrders({
          address: ownerAddress as Address,
          chainId
        })
        return response.orders
      } catch (err) {
        Logger.error(
          `[recurring schedules] listOrders FAILED: ${
            err instanceof Error ? err.message : String(err)
          }`,
          err
        )
        throw err
      }
    }
  })
}
