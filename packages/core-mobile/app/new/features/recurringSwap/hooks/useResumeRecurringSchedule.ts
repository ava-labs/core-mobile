import { TransferSignatureReason } from '@avalabs/fusion-sdk'
import { makeOrderActionHook } from './_makeOrderActionHook'

// Resume is an on-chain TX. See `_makeOrderActionHook.ts` for the
// shared shape (signerContext payload, pending mark, analytics, staggered
// invalidates, error mapping).

export const useResumeRecurringSchedule = makeOrderActionHook({
  type: TransferSignatureReason.ResumeRecurringSwap,
  // SDK still names the namespace method `executeUnpause`; only the
  // mobile-side terminology was renamed to "resume" for clarity.
  hookName: 'useResumeRecurringSchedule',
  pickExecute: ns => ns.executeUnpause,
  analyticsEvent: 'RecurringSwapResumedByUser',
  errorCopy: {
    notActionable: 'This recurring schedule cannot be resumed right now',
    notFound: 'Recurring schedule not found',
    fallback: 'Try again',
    reverted: 'Resume failed on-chain. Please try again'
  }
})
