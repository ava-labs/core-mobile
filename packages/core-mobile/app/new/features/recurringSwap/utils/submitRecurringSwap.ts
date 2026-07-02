import type { Hex } from 'viem'
import type { Chain, RecurringQuoteResponse } from '@avalabs/fusion-sdk'
import {
  ApprovalRevertedError,
  ErrorReason,
  InvalidParamsError,
  isInvalidParamsError
} from '@avalabs/fusion-sdk'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { queryClient } from 'contexts/ReactQueryProvider'
import { showSnackbar } from 'common/utils/toast'
import { deriveIntervalSeconds } from '@avalabs/fusion-sdk'
import FusionService from 'features/swap/services/FusionService'
import { bigintToBig } from 'utils/bigNumbers/bigintToBig'
import { formatTokenAmount } from 'utils/Utils'
import Logger from 'utils/Logger'
import { recurringSchedulesQueryKey } from '../hooks/useRecurringSchedules'
import { buildRecurringQuoteQueryKey } from '../hooks/useRecurringQuote'
import type { RecurringFillSignerContext } from '../services/recurringSignerContext'
import type { Frequency, NumberOfOrders } from '../types'
import { scheduleStaggeredInvalidate } from './staggeredInvalidate'

const LOG_TAG = '[RecurringSwap]'

// The SDK's recurring namespace signs and broadcasts internally, so this
// flow is now a single SDK call. The SDK reads on-chain allowance against the
// router it derives internally, signs an `approve` when needed (attempting a
// one-click `signBatch` first, falling back to two sequential signatures on
// wallet rejection), then signs the swap and returns the broadcast `txHash`.
//
// Everything the old code did manually — `getRouterAddress`, `readErc20Allowance`,
// the `approve` dispatch through ApprovalController, `waitForTransaction` on
// the receipt, the second `prepareFirstFill` → fill dispatch — now lives
// inside `executeFirstFill`. Mobile's signer (`features/swap/services/signers/EvmSigner.ts`)
// still routes each `sign` call through ApprovalController, so the user
// continues to see the in-app approval modal(s).

export type SubmitRecurringSwapParams = {
  quote: RecurringQuoteResponse
  fromAddress: string
  /** Full `Chain` for the swap's source network — build via
   *  `toChain(network)` (mobile's `features/swap/utils/fusionTypeConverters`).
   *  The SDK reads `rpcUrl` for the allowance + gas calls and cross-checks
   *  `chainId` against `quote.chainId`. */
  sourceChain: Chain
  // Display metadata threaded through to the success-path analytics and to
  // the recurring-action side-channel (so `<RecurrenceDetails />` can render
  // the preview on the in-app approval modal). The SDK doesn't echo these
  // on `executeFirstFill`'s return; we keep them on mobile and forward them.
  fromTokenSymbol: string
  fromTokenDecimals: number
  toTokenSymbol: string
  frequency: Frequency
  numberOfOrders: NumberOfOrders
  amountPerOrder: bigint
  // Identifiers needed to reconstruct the exact `useRecurringQuote` queryKey
  // for scoped invalidations on quote-expiry / SDK boundary throws — without
  // these we'd fall back to a `[RECURRING_QUOTE]` prefix invalidation that
  // would nuke every cached recurring quote in the app.
  fromTokenLocalId: string
  toTokenLocalId: string
  fromTokenNetworkChainId: number
  toTokenNetworkChainId: number
  slippageBps?: number
}

export type SubmitRecurringSwapResult = { txHash: Hex }

/**
 * Submits a recurring-swap schedule by invoking the SDK's
 * `markr.recurring.executeFirstFill`. The SDK handles the entire
 * allowance + approval + first-fill sign/broadcast sequence internally.
 * On success, fires the `RecurringSwapScheduled` analytics,
 * shows the in-app success snackbar, and staggers React Query
 * invalidations to catch Markr's indexer up with on-chain truth.
 *
 * @throws `InvalidParamsError(QUOTE_EXPIRED)` if the quote's `expiredAt`
 *   has elapsed (the SDK guards this synchronously).
 * @throws `InvalidParamsError` if `sourceChain.chainId` doesn't resolve to
 *   the numeric chainId on `quote.chainId`.
 * @throws `ApprovalRevertedError` if the SDK-driven ERC-20 approve was
 *   mined as reverted on-chain. Caller surfaces a dedicated message;
 *   distinct from a generic signer failure.
 * @throws Any signer/network error from the underlying `evmSigner.sign`
 *   or `signBatch` call (e.g. user rejection bubbles up as the signer's
 *   own rejection error).
 */
export async function submitRecurringSwap(
  params: SubmitRecurringSwapParams
): Promise<SubmitRecurringSwapResult> {
  const {
    quote,
    fromAddress,
    sourceChain,
    fromTokenSymbol,
    fromTokenDecimals,
    toTokenSymbol,
    frequency,
    numberOfOrders,
    amountPerOrder,
    fromTokenLocalId,
    toTokenLocalId,
    fromTokenNetworkChainId,
    toTokenNetworkChainId,
    slippageBps
  } = params

  // Exact key to invalidate just this quote on expiry / SDK rejection (and
  // NOT every other recurring quote cached for different pairs/amounts).
  // Must mirror `useRecurringQuote`'s queryKey shape — both go through
  // `buildRecurringQuoteQueryKey` for that reason.
  const expiredQuoteKey = buildRecurringQuoteQueryKey({
    fromTokenNetworkChainId,
    fromTokenLocalId,
    toTokenNetworkChainId,
    toTokenLocalId,
    amountPerOrder,
    numberOfOrders,
    frequency,
    slippageBps
  })
  const overallStartedAt = Date.now()
  Logger.info(`${LOG_TAG} ▶️ submitRecurringSwap — START`, {
    chainId: quote.chainId,
    fromTokenSymbol,
    toTokenSymbol,
    amountPerOrder: amountPerOrder.toString(),
    numberOfOrders,
    frequency,
    quoteUuid: quote.uuid,
    totalAmountIn: quote.totalAmountIn.toString(),
    expiredAt: quote.expiredAt
  })

  const markrRecurring = FusionService.markrRecurring
  if (!markrRecurring) {
    throw new Error(
      'submitRecurringSwap: markrRecurring namespace not available'
    )
  }

  // Pre-flight quote expiry check. The SDK throws `InvalidParamsError(QUOTE_EXPIRED)`
  // internally when it sees a stale `quote.expiredAt`, but only AFTER setting up
  // the side-channel context and beginning the sign flow — which means we'd flash
  // the approval modal then immediately fail. Catch it synchronously so the
  // caller can surface "Quote expired" without any modal flicker, and invalidate
  // the cached quote so a retry refetches instead of replaying the same stale
  // payload from React Query's 30s staleTime window. Throw the same
  // `InvalidParamsError(QUOTE_EXPIRED)` class as the SDK so SwapScreen's
  // `isInvalidParamsError` catch lights up the "Quote expired" snackbar
  // (the previous `new Error('QUOTE_EXPIRED:...')` slipped through to the
  // generic "try again" copy).
  if (Date.now() >= quote.expiredAt * 1000) {
    queryClient.invalidateQueries({
      queryKey: expiredQuoteKey,
      exact: true
    })
    throw new InvalidParamsError(
      ErrorReason.QUOTE_EXPIRED,
      'Recurring quote expired — refresh the quote and try again.'
    )
  }

  // Build the display-metadata payload for the in-flight first-fill action
  // and pass it through the SDK's `signerContext` field. The SDK forwards
  // it unchanged onto `step.signerContext`; `EvmSigner.signOne` reads it
  // back for the `ScheduleRecurringSwap` step and attaches it as
  // `RECURRING_SWAP` context so `<RecurrenceDetails />` renders above the
  // approval modal. See `services/recurringSignerContext.ts` for the
  // producer/consumer contract.
  //
  // Default 2 max-fraction digits matches the rest of the app's
  // `formatTokenAmount` usage. Sub-cent amounts (e.g. 0.001 AVAX) will
  // render as "0.00" by design — consistent with how send/swap previews
  // format elsewhere, and not worth diverging just for this preview.
  const amountPerOrderFormatted = formatTokenAmount(
    bigintToBig(amountPerOrder, fromTokenDecimals)
  )
  // `quote.numberOfOrders` is the wire value Markr signs: the unlimited
  // sentinel (`-1`) if the user picked Unlimited, else a finite count.
  // Forwarding it verbatim keeps the signed value and the preview's
  // displayed value structurally identical — no `isUnlimited` boolean to
  // disagree with the sentinel.
  const signerContext: RecurringFillSignerContext = {
    fromTokenSymbol,
    toTokenSymbol,
    amountPerOrderFormatted,
    numberOfOrders: quote.numberOfOrders,
    frequency
  }

  let result: { txHash: Hex }
  try {
    // `fallbackToDefaultOnBatchFailure` MUST be false for recurring.
    //
    // The SDK's `executeFirstFill` attempts `signBatch` first (it's defined on
    // mobile's signer) and, when this flag is true, silently re-runs the whole
    // wrap→approve→swap sequence on ANY throw from that attempt. That fallback
    // is only safe when `signBatch` is atomic (a true `eth_sendTransactionBatch`
    // where a throw means nothing was signed). Mobile's `signBatch` is NOT
    // atomic for recurring: `EvmSigner.signBatch` routes recurring straight to
    // `signEachManually`, which signs and BROADCASTS wrap + approve before the
    // swap step. So a partway throw leaves those txs on-chain, and the SDK's
    // re-run prompts a SECOND spend-limit approval and surfaces a spurious
    // "User rejected the request." from a superseded approval sheet.
    //
    // With `false`, mobile's sequential `signBatch` is the single execution
    // path; a real failure propagates once. Ledger/WC peers are unaffected —
    // recurring never issues a true atomic batch, so there is no batch
    // rejection for the SDK fallback to recover from.
    result = await markrRecurring.executeFirstFill({
      quote,
      fromAddress: fromAddress as `0x${string}`,
      sourceChain,
      fallbackToDefaultOnBatchFailure: false,
      signerContext
    })
  } catch (err) {
    if (err instanceof ApprovalRevertedError) {
      Logger.error(
        `${LOG_TAG} ❌ submitRecurringSwap — approval reverted on-chain`,
        err
      )
    } else if (isInvalidParamsError(err)) {
      // SDK boundary throws (quote expired, sourceChain ≠ quote.chainId,
      // bad fromAddress, etc.) — log distinctly so analytics can separate
      // these from generic signer failures. Also invalidate the cached
      // quote so a retry refetches a fresh one instead of replaying the
      // same stale payload (the pre-flight expiry check above usually
      // catches QUOTE_EXPIRED, but this covers SDK clock-skew + other
      // invalidating reasons that share this error class).
      Logger.error(`${LOG_TAG} ❌ submitRecurringSwap — invalid params`, err)
      queryClient.invalidateQueries({
        queryKey: expiredQuoteKey,
        exact: true
      })
    } else {
      Logger.error(`${LOG_TAG} ❌ submitRecurringSwap — failed`, err)
    }
    throw err
  }

  Logger.info(
    `${LOG_TAG} 🎉 submitRecurringSwap — COMPLETE in ${
      Date.now() - overallStartedAt
    }ms`,
    { txHash: result.txHash }
  )

  // ── Post-broadcast effects ──────────────────────────────────────────────
  // These used to fire from a Redux listener watching the `step: 'fill'`
  // `onInAppRequestSucceeded` action. Now that the SDK signs and broadcasts
  // internally, the SDK call's own resolution is the success signal; we
  // fire the same effects here.

  AnalyticsService.capture('RecurringSwapScheduled', {
    chainId: quote.chainId,
    encrypted: {
      scheduleUuid: quote.uuid,
      fromTokenSymbol,
      toTokenSymbol,
      amountPerOrder: amountPerOrder.toString(),
      // Wire value Markr signs — the unlimited sentinel (-1) or a finite
      // count. Downstream dashboards filter on `numberOfOrders === -1`
      // for the unlimited cohort; no separate boolean is emitted.
      numberOfOrders: quote.numberOfOrders,
      intervalSeconds: deriveIntervalSeconds(frequency)
    }
  })

  showSnackbar('Recurring swap scheduled')

  // Markr's `listOrders` lags on-chain confirmation by a few seconds while it
  // observes and indexes the fill tx. A single invalidate-at-broadcast almost
  // always lands before that record materialises, so the banner stays empty
  // even though everything succeeded. Kick off one immediate invalidate plus
  // a staggered batch at t=5s/15s/30s so the cache catches up without the
  // user needing to navigate. The shared helper dedupes against any prior
  // pending batch for the same key (e.g. user submits, errors, retries) so
  // repeated calls don't stack timers.
  //
  // Scope to this (account, chain) rather than the bare `[RECURRING_SCHEDULES]`
  // prefix: the staggered timers are module-scoped and outlive this call, so a
  // firing up to 30s later must refetch the schedule's own account — not
  // whatever account is active by then. The scoped key matches exactly the
  // observers of this account's schedules (banner / manage screen) and never
  // prefix-matches another account.
  const schedulesKey = recurringSchedulesQueryKey(fromAddress, quote.chainId)
  queryClient.invalidateQueries({ queryKey: schedulesKey })
  scheduleStaggeredInvalidate(schedulesKey)

  return result
}
