import { makeOrderActionHook } from './_makeOrderActionHook'

// Pause is an on-chain TX. See `_makeOrderActionHook.ts` for the
// shared shape (side-channel set, pending mark, analytics, staggered
// invalidates, error mapping).
//
// Pausing preserves the schedule's existing ERC-20 allowance — when the
// user later unpauses, no re-approval and no new native schedule fee
// are required (the UX win over cancel-and-recreate).

export const usePauseRecurringSchedule = makeOrderActionHook({
  type: 'pause',
  hookName: 'usePauseRecurringSchedule',
  pickExecute: ns => ns.executePause,
  analyticsEvent: 'RecurringSwapPausedByUser',
  errorCopy: {
    notActionable: 'This schedule cannot be paused right now',
    notFound: 'Schedule not found',
    fallback: 'Try again'
  }
})
