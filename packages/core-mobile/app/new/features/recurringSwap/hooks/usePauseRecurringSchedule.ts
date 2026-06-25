import { TransferSignatureReason } from '@avalabs/fusion-sdk'
import { makeOrderActionHook } from './_makeOrderActionHook'

// Pause is an on-chain TX. See `_makeOrderActionHook.ts` for the
// shared shape (side-channel set, pending mark, analytics, staggered
// invalidates, error mapping).
//
// Pausing preserves the schedule's existing ERC-20 allowance — when the
// user later resumes, no re-approval and no new native schedule fee
// are required (the UX win over cancel-and-recreate).

export const usePauseRecurringSchedule = makeOrderActionHook({
  type: TransferSignatureReason.PauseRecurringSwap,
  hookName: 'usePauseRecurringSchedule',
  pickExecute: ns => ns.executePause,
  analyticsEvent: 'RecurringSwapPausedByUser',
  errorCopy: {
    notActionable: 'This recurring schedule cannot be paused right now',
    notFound: 'Recurring schedule not found',
    fallback: 'Try again',
    reverted: 'Pause failed on-chain. Please try again'
  }
})
