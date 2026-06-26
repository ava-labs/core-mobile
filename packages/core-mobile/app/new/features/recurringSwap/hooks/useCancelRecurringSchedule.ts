import { TransferSignatureReason } from '@avalabs/fusion-sdk'
import { makeOrderActionHook } from './_makeOrderActionHook'

// Cancel is an on-chain TX. The SDK signs and broadcasts
// internally via `executeCancellation` — see `_makeOrderActionHook.ts` for
// the shared shape (side-channel set, pending mark, analytics, staggered
// invalidates, error mapping).
//
// Cancel-specific copy: HTTP 400 from Markr means the schedule can no
// longer be cancelled (already cancelled by another device, or has
// completed). HTTP 404 means Markr can't find it.

export const useCancelRecurringSchedule = makeOrderActionHook({
  type: TransferSignatureReason.CancelRecurringSwap,
  hookName: 'useCancelRecurringSchedule',
  pickExecute: ns => ns.executeCancellation,
  analyticsEvent: 'RecurringSwapCancelledByUser',
  errorCopy: {
    notActionable: 'This schedule can no longer be cancelled',
    notFound: 'Unable to remove',
    fallback: 'Try again',
    reverted: 'Cancel failed on-chain. Please try again'
  }
})
