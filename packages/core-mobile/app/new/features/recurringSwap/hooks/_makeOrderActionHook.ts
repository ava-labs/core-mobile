import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Address } from 'viem'
import type { Chain, RecurringNamespace } from '@avalabs/fusion-sdk'
import { isHttpError } from '@avalabs/fusion-sdk'
import { showSnackbar } from 'common/utils/toast'
import FusionService from 'features/swap/services/FusionService'
import AnalyticsService from 'services/analytics/AnalyticsService'
import Logger from 'utils/Logger'
import {
  pendingActionStore,
  RecurringOrderActionType
} from '../store/pendingActionStore'
import type { RecurringOrderActionSignerContext } from '../services/recurringSignerContext'
import { scheduleStaggeredInvalidate } from '../utils/staggeredInvalidate'
import { RECURRING_SCHEDULES_QK } from './useRecurringSchedules'

// Cancel / pause / resume are all on-chain TXs; the SDK signs + broadcasts
// internally. The three hooks all follow the identical shape:
//   1. Validate `markrRecurring` is initialised
//   2. Build the display-metadata payload (including `action: config.type`
//      so the approval modal can render the right cancel/pause/resume
//      copy) and pass it through the SDK's `signerContext` field — the
//      SDK echoes it back on `step.signerContext`, where EvmSigner.signOne
//      attaches it as `RECURRING_SWAP` context on the approval modal
//      request
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
  // Forwarded onto `step.signerContext` so EvmSigner.signOne can tag and
  // attach it as the approval modal's RECURRING_SWAP context. The action
  // type the approval-side schema discriminates on is derived from
  // `step.currentSignatureReason` (Cancel/Pause/ResumeRecurringSwap), not
  // carried on this payload.
  signerContext: RecurringOrderActionSignerContext
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
    | 'RecurringSwapResumedByUser'
  errorCopy: ErrorSnackbarCopy
}

/**
 * Builds a `useCancelRecurringSchedule` / `usePauseRecurringSchedule` /
 * `useResumeRecurringSchedule` hook. See file header for the shared shape.
 */
export function makeOrderActionHook(
  config: OrderActionConfig
): () => UseRecurringOrderAction {
  return function useRecurringOrderAction(): UseRecurringOrderAction {
    const [isPending, setIsPending] = useState(false)
    // Track mount state so `setIsPending(false)` (and any other deferred
    // state updates) don't fire after unmount.
    const isMountedRef = useRef(true)
    // Re-entrancy guard: the disabled-button UX prevents most double-fires,
    // but two `mutate` calls in the same tick still start two `run`s and
    // the first to settle would flip `isPending` off mid-flight on the
    // second. Drop calls while one is already in flight.
    const inFlightRef = useRef(false)
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
      if (inFlightRef.current) return
      inFlightRef.current = true
      if (isMountedRef.current) setIsPending(true)
      try {
        const markrRecurring = FusionService.markrRecurring
        if (!markrRecurring) {
          throw new Error(
            `${config.hookName}: markrRecurring namespace not available`
          )
        }

        // Pass the display metadata through the SDK's `signerContext`
        // field; the SDK forwards it unchanged onto `step.signerContext`,
        // where EvmSigner.signOne attaches it to the approval modal's
        // request as `RECURRING_SWAP` context. `action` drives the
        // cancel/pause/resume copy distinction on the approval preview.
        // Riding the payload with the request itself means two concurrent
        // same-type actions (rare, but unblocked by the UI) can no longer
        // overwrite each other's preview.
        const signerContext: RecurringOrderActionSignerContext = {
          action: config.type,
          fromTokenSymbol: args.fromTokenSymbol,
          toTokenSymbol: args.toTokenSymbol
        }
        const execute = config.pickExecute(markrRecurring)
        await execute({
          orderId: args.orderId,
          address: args.address as Address,
          sourceChain: args.sourceChain,
          signerContext
        })

        // Mark pending after broadcast so the card's button stays in its
        // "-ing" spinner state until Markr's next listOrders refetch
        // reports the destination status. The reconciler in listeners.ts
        // clears this entry once the server reflects the new state (or
        // the TTL elapses).
        pendingActionStore.getState().markPending(args.orderId, config.type)

        AnalyticsService.capture(config.analyticsEvent, {
          chainId: args.chainId,
          encrypted: {
            orderId: args.orderId
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
        inFlightRef.current = false
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
    // over `cancel`/`pause`/`resume` stay stable too — see the screen's
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
