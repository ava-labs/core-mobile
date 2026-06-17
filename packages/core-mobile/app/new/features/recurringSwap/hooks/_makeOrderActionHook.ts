import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Address } from 'viem'
import type { Chain, RecurringNamespace } from '@avalabs/fusion-sdk'
import { isHttpError } from '@avalabs/fusion-sdk'
import { showSnackbar } from 'common/utils/toast'
import FusionService from 'features/swap/services/FusionService'
import AnalyticsService from 'services/analytics/AnalyticsService'
import Logger from 'utils/Logger'
import { pendingActionStore } from '../store/pendingActionStore'
import {
  clearActiveRecurringActionContext,
  setActiveRecurringActionContext
} from '../services/activeActionContext'
import { scheduleStaggeredInvalidate } from '../utils/staggeredInvalidate'
import { RECURRING_SCHEDULES_QK } from './useRecurringSchedules'

// Cancel / pause / unpause are all on-chain TXs; the SDK signs + broadcasts
// internally. The three hooks all follow the identical shape:
//   1. Validate `markrRecurring` is initialised
//   2. Stash the rich display metadata in `activeActionContext` so
//      EvmSigner.signOne can inject it as `RECURRING_SWAP` context on the
//      approval modal request
//   3. Call `markrRecurring.executeAction(...)`
//   4. Mark the orderId in `pendingActionStore` so the row stays visible
//      with an "-ing" spinner until Markr's next refetch shows the
//      destination status (the listeners.ts reconciler clears it)
//   5. Fire a step-specific analytics event
//   6. Stagger query invalidates (skip immediate to avoid race-with-indexer
//      flicker)
//   7. On HTTP error, map to a step-specific snackbar
//
// Only the SDK method, action type, analytics event name, and per-status
// snackbar copy differ. Factor the shared shape so a future bug fix lands
// in one place instead of three (the cancel reconciler "status !== Active"
// asymmetry is exactly the bug class that motivates this consolidation).
//
// `_makeOrderActionHook.ts` is leading-underscored to flag it as a feature-
// internal builder; the three named hooks below it remain the public surface.

export type RecurringOrderActionType = 'cancel' | 'pause' | 'unpause'

type HexOrderId = `0x${string}`

export type OrderActionArgs = {
  orderId: HexOrderId
  address: string
  /** Full `Chain` for the schedule's source network. Build via
   *  `toChain(network)` (`features/swap/utils/fusionTypeConverters`). */
  sourceChain: Chain
  /** Numeric chainId — used only for the analytics payload. The SDK derives
   *  the wire-level chainId from `sourceChain.chainId` internally. */
  chainId: number
  /** Threaded to the recurring-action side channel so `<RecurrenceDetails />`
   *  can label the in-app approval modal preview block. */
  fromTokenSymbol: string
  toTokenSymbol: string
}

export type UseRecurringOrderAction = {
  isPending: boolean
  mutate: (args: OrderActionArgs) => void
  mutateAsync: (args: OrderActionArgs) => Promise<void>
}

type ExecuteFn = (props: {
  orderId: HexOrderId
  address: Address
  sourceChain: Chain
}) => Promise<unknown>

type ErrorSnackbarCopy = {
  /** HTTP 400 — order isn't in a state the action accepts (e.g. cancelling
   *  a Completed order, pausing a Paused one). */
  notActionable: string
  /** HTTP 404 — order vanished from Markr's view. */
  notFound: string
  /** Anything else (network, signer rejection, unauthorised, etc.). */
  fallback: string
}

type OrderActionConfig = {
  type: RecurringOrderActionType
  hookName: string
  /** Pick the SDK method off the namespace. Encapsulating the access here
   *  (rather than passing a bound method) lets the hook check the namespace
   *  is initialised before invoking. */
  pickExecute: (ns: RecurringNamespace) => ExecuteFn
  analyticsEvent:
    | 'RecurringSwapCancelledByUser'
    | 'RecurringSwapPausedByUser'
    | 'RecurringSwapUnpausedByUser'
  errorCopy: ErrorSnackbarCopy
}

/**
 * Builds a `useCancelRecurringSchedule` / `usePauseRecurringSchedule` /
 * `useUnpauseRecurringSchedule` hook. See file header for the shared shape.
 */
export function makeOrderActionHook(
  config: OrderActionConfig
): () => UseRecurringOrderAction {
  return function useRecurringOrderAction(): UseRecurringOrderAction {
    const [isPending, setIsPending] = useState(false)
    // Track mount state so `setIsPending(false)` (and any other deferred
    // state updates) don't fire after unmount.
    const isMountedRef = useRef(true)
    useEffect(
      () => () => {
        isMountedRef.current = false
      },
      []
    )

    // Empty deps below are intentional: `config` is captured by the outer
    // `makeOrderActionHook(...)` call at module-import time (not on each
    // render), so it's referentially stable for the lifetime of the app.
    // Don't "fix" this by adding `[config]` — that would change `run`'s
    // identity unnecessarily and break the SchedulesScreen's stable
    // `mutate` reference that downstream `useCallback`s depend on.

    const run = useCallback(async (args: OrderActionArgs): Promise<void> => {
      if (isMountedRef.current) setIsPending(true)
      try {
        const markrRecurring = FusionService.markrRecurring
        if (!markrRecurring) {
          throw new Error(
            `${config.hookName}: markrRecurring namespace not available`
          )
        }

        // Stash the rich display metadata for the in-flight action BEFORE
        // invoking the SDK call — EvmSigner.signOne reads from the
        // per-type slot synchronously during request dispatch. Slots are
        // keyed by `type`, so a fill in flight and this order action can
        // coexist without overwriting each other's previews.
        setActiveRecurringActionContext({
          type: config.type,
          fromTokenSymbol: args.fromTokenSymbol,
          toTokenSymbol: args.toTokenSymbol
        })

        const execute = config.pickExecute(markrRecurring)
        await execute({
          orderId: args.orderId,
          address: args.address as Address,
          sourceChain: args.sourceChain
        })

        // Mark pending after broadcast so the card's button stays in its
        // "-ing" spinner state until Markr's next listOrders refetch
        // reports the destination status. The reconciler in listeners.ts
        // clears this entry once the server reflects the new state (or
        // the TTL elapses).
        pendingActionStore.getState().markPending(args.orderId, config.type)

        AnalyticsService.capture(config.analyticsEvent, {
          encrypted: {
            orderId: args.orderId,
            chainId: args.chainId
          }
        })

        // Skip an immediate invalidate: it would race the indexer and
        // briefly flash the row back to its prior status before the next
        // refetch settles. The shared helper schedules t=5s/15s/30s
        // catch-up invalidates and dedupes against any prior in-flight
        // batch for the same queryKey, so rapid repeat actions don't
        // stack timers.
        scheduleStaggeredInvalidate(RECURRING_SCHEDULES_QK)
      } catch (err) {
        showOrderActionErrorSnackbar(err, config.errorCopy, config.hookName)
        throw err
      } finally {
        // Always release this action's slot — independent of fill / other
        // action-type slots — so a stale entry can't leak past this call.
        clearActiveRecurringActionContext(config.type)
        if (isMountedRef.current) setIsPending(false)
      }
    }, [])

    const mutate = useCallback(
      (args: OrderActionArgs) => {
        // Fire-and-forget — failures already show snackbars from `run`.
        run(args).catch(() => undefined)
      },
      [run]
    )

    // Memoize so the returned object's identity only changes when
    // `isPending` flips. `run`/`mutate` are already stable (empty-deps
    // useCallback), so this lets downstream `useCallback`s that close
    // over `cancel`/`pause`/`unpause` stay stable too — see the screen's
    // `confirmAndRun` deps for the consumer that benefits.
    return useMemo(
      () => ({ isPending, mutate, mutateAsync: run }),
      [isPending, mutate, run]
    )
  }
}

// Matches the user-rejection detector in SwapScreen.submitRecurring. The
// underlying signer throws an Error whose message starts with
// "User rejected" / "User cancelled" / "User canceled" when the user taps
// Reject (or closes the modal) on the in-app approval sheet. These aren't
// failures we should surface — they're the user's deliberate action.
function isUserRejectionError(err: unknown): boolean {
  const message =
    err instanceof Error ? err.message : typeof err === 'string' ? err : ''
  return /User (rejected|cancel(l|led))/i.test(message)
}

function showOrderActionErrorSnackbar(
  err: unknown,
  copy: ErrorSnackbarCopy,
  hookName: string
): void {
  if (isUserRejectionError(err)) {
    // Log at info level so the path is observable but doesn't pipe to
    // Sentry (Logger.error does). No toast — the user knows they rejected.
    Logger.info(`[${hookName}] user-rejected`)
    return
  }
  if (isHttpError(err)) {
    if (err.status === 400) {
      showSnackbar(copy.notActionable)
      return
    }
    if (err.status === 404) {
      showSnackbar(copy.notFound)
      return
    }
  }
  showSnackbar(copy.fallback)
}
