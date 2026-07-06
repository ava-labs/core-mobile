import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Address } from 'viem'
import type {
  Chain,
  RecurringExecuteResult,
  RecurringNamespace
} from '@avalabs/fusion-sdk'
import { isHttpError } from '@avalabs/fusion-sdk'
import type { Network } from '@avalabs/core-chains-sdk'
import { showSnackbar } from 'common/utils/toast'
import FusionService from 'features/swap/services/FusionService'
import { isUserRejectionError } from 'features/swap/utils/fusionErrors'
import AnalyticsService from 'services/analytics/AnalyticsService'
import Logger from 'utils/Logger'
import { useNetworks } from 'hooks/networks/useNetworks'
import { getEvmProvider } from 'services/network/utils/providerUtils'
import {
  pendingActionStore,
  RecurringOrderActionType
} from '../store/pendingActionStore'
import type { RecurringOrderActionSignerContext } from '../services/recurringSignerContext'
import { scheduleStaggeredInvalidate } from '../utils/staggeredInvalidate'
import { recurringSchedulesQueryKey } from './useRecurringSchedules'

// Ceiling for the post-broadcast action-TX receipt wait. Mirrors the swap
// signer's receipt wait (`features/swap/store/listeners.ts`): 1 confirmation,
// 60s. Long enough for normal inclusion, short enough that a reverted/dropped
// cancel/pause/resume surfaces an error well before the 10-min pending-action
// TTL would otherwise strand the row on its "-ing" spinner.
const ACTION_RECEIPT_TIMEOUT_MS = 60_000

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
  // Forwarded onto `step.signerContext` so EvmSigner.signOne can attach it as
  // the approval modal's RECURRING_SWAP context. The approval-side schema uses
  // the payload's `action` field (cancel/pause/resume) to select the preview copy.
  signerContext: RecurringOrderActionSignerContext
}) => Promise<RecurringExecuteResult>

type ErrorSnackbarCopy = {
  /** HTTP 400 — order isn't in a state the action accepts (e.g. cancelling
   *  a Completed order, pausing a Paused one). */
  notActionable: string
  /** HTTP 404 — order vanished from Markr's view. */
  notFound: string
  /** Anything else (network, signer rejection, unauthorised, etc.). */
  fallback: string
  /** The action TX broadcast successfully but then reverted on-chain. Markr's
   *  `RecurringOrderStatus` is a closed enum with no failed state, so the
   *  status never advances and the reconciler can't clear the entry — without
   *  surfacing this the row's "-ing" spinner would hang until the 10-min TTL.
   *  The post-broadcast receipt watcher detects the revert and shows this. */
  reverted: string
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
 * Background receipt watch for a broadcast cancel/pause/resume TX.
 *
 * `executeX` resolves at broadcast, and `RecurringOrderStatus` has no failed
 * state, so a reverted/dropped action TX never advances the status the
 * listeners-side reconciler keys on — its only escape would be the 10-min TTL,
 * leaving the row stuck on its "-ing" spinner with no feedback. This waits for
 * the receipt and, on an explicit on-chain revert (`status === 0`), clears the
 * pending entry and surfaces a failure snackbar right away.
 *
 * Deliberately conservative about NOT clearing:
 *   - No network resolvable for `chainId` → can't watch; leave to the TTL.
 *   - Wait times out / RPC error → a late confirmation may still land, so
 *     leave the entry for the reconciler (TTL remains the final backstop).
 * Only a confirmed `status === 0` clears the entry here.
 */
async function watchActionTxReceipt({
  orderId,
  chainId,
  txHash,
  network,
  errorCopy,
  hookName
}: {
  orderId: string
  chainId: number
  txHash: `0x${string}`
  network: Network | undefined
  errorCopy: ErrorSnackbarCopy
  hookName: string
}): Promise<void> {
  if (!network) return
  try {
    const provider = await getEvmProvider(network)
    const receipt = await provider.waitForTransaction(
      txHash,
      1,
      ACTION_RECEIPT_TIMEOUT_MS
    )
    if (receipt && receipt.status === 0) {
      pendingActionStore.getState().clearPending(orderId)
      showSnackbar(errorCopy.reverted)
      Logger.error(
        `[${hookName}] action TX ${txHash} reverted on chain ${chainId}; cleared pending entry for order ${orderId}`
      )
    }
  } catch (err) {
    // Timeout / RPC error — don't clear; the reconciler + TTL remain the
    // backstop in case a confirmation lands later.
    Logger.error(
      `[${hookName}] action receipt watch did not confirm for order ${orderId}; leaving pending for reconciler/TTL`,
      err
    )
  }
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
    // The receipt watcher needs the source network for `args.chainId`, which
    // is only known per-call. Hold the live networks map in a ref so the
    // empty-deps `run` reads the latest without churning its identity (which
    // the SchedulesScreen's stable `mutate` reference depends on).
    const { networks } = useNetworks()
    const networksRef = useRef(networks)
    // Sync the ref in an effect, not in the render body — mutating a ref
    // during render breaks render purity (a discarded concurrent render would
    // still mutate it). `useRef(networks)` seeds the first render, and `run`
    // only reads `networksRef.current` post-commit (on a user tap), so the
    // effect-timed update is always in place by the time it's read.
    useEffect(() => {
      networksRef.current = networks
    }, [networks])
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
      // Flips to `true` the instant we hand off to the SDK's `executeX`, which
      // signs *and broadcasts* internally. Used in the catch to tell a
      // pre-broadcast failure (orchestrator 400, user rejection, missing
      // namespace) — safe to re-enable the button — from a post-broadcast
      // reject (e.g. the sendRawTransaction response read times out while the
      // TX is already in the mempool) — where re-enabling invites a
      // double-submit.
      let didCallExecute = false
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
        // `executeX` resolves at *broadcast* (returns the txHash), NOT at
        // on-chain confirmation — see the SDK's recurring `_namespace`.
        didCallExecute = true
        const { txHash } = await execute({
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
        // Scope the entry to (account, chain) so the listeners-side reconciler
        // only clears it when THIS account/chain's listOrders catches up — a
        // sibling account's refetch must not clobber this in-flight action.
        pendingActionStore.getState().markPending(args.orderId, config.type, {
          ownerAddress: args.address,
          chainId: args.chainId
        })

        // Because broadcast ≠ confirmation and `RecurringOrderStatus` has no
        // failed state, a reverted/dropped action TX would never advance the
        // status the reconciler keys on — the spinner would hang until the
        // TTL. Watch the receipt in the background: on an explicit on-chain
        // revert, clear the entry and surface a failure snackbar immediately.
        // Fire-and-forget — confirmation may land after the screen unmounts,
        // and the store/snackbar are module-level (no React state touched).
        // The watcher swallows its own errors, so the no-op `.catch` only
        // satisfies the floating-promise lint.
        watchActionTxReceipt({
          orderId: args.orderId,
          chainId: args.chainId,
          txHash,
          network: networksRef.current[args.chainId],
          errorCopy: config.errorCopy,
          hookName: config.hookName
        }).catch(() => undefined)

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
        //
        // Scope the key to THIS (account, chain) via the shared builder rather
        // than the bare `[RECURRING_SCHEDULES]` prefix. The catch-up should
        // refetch the account the action was for — not whatever account
        // happens to be active when a timer fires up to 30s later. These timers
        // are module-scoped and aren't cleared on unmount/account-switch; with
        // the bare prefix a post-switch firing would refetch the *new*
        // account's query, whereas the scoped key only ever touches the
        // (now-inactive) query it was meant for — a harmless stale-mark, never
        // a cross-account refetch. The builder lowercases the owner so this
        // matches the query key even though `args.address` (Markr's per-order
        // owner) may differ in checksum casing from the wallet's `addressC`.
        scheduleStaggeredInvalidate(
          recurringSchedulesQueryKey(args.address, args.chainId)
        )
      } catch (err) {
        // A user rejection or an `HttpError` (orchestrator 400/404 from the
        // calldata fetch) can only happen *before* the TX broadcasts. Anything
        // else thrown out of `executeX` is ambiguous: the raw TX may already be
        // in the mempool even though the awaited promise rejected (e.g. a read
        // timeout on the broadcast response). In that case, re-enabling the
        // buttons would let the user re-tap and double-submit a second on-chain
        // action. So mark the order pending instead — the spinner persists and
        // blocks the re-tap, and the listeners-side reconciler (or the TTL)
        // clears it once Markr reflects the result. No toast: we don't actually
        // know it failed. (No txHash is available here, so the receipt watcher
        // can't run — the reconciler/TTL is the sole backstop for this path.)
        const mayHaveBroadcast =
          didCallExecute && !isUserRejectionError(err) && !isHttpError(err)
        if (mayHaveBroadcast) {
          pendingActionStore.getState().markPending(args.orderId, config.type, {
            ownerAddress: args.address,
            chainId: args.chainId
          })
          Logger.error(
            `[${config.hookName}] action settled ambiguously after broadcast for order ${args.orderId}; keeping pending to block a double-submit`,
            err
          )
        } else {
          showOrderActionErrorSnackbar(err, config.errorCopy, config.hookName)
        }
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
