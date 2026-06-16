import { makeOrderActionHook } from './_makeOrderActionHook'

// Unpause is an on-chain TX. See `_makeOrderActionHook.ts` for the
// shared shape (side-channel set, pending mark, analytics, staggered
// invalidates, error mapping).

export const useUnpauseRecurringSchedule = makeOrderActionHook({
  type: 'unpause',
  hookName: 'useUnpauseRecurringSchedule',
  pickExecute: ns => ns.executeUnpause,
  analyticsEvent: 'RecurringSwapUnpausedByUser',
  errorCopy: {
    notActionable: 'This schedule cannot be unpaused right now',
    notFound: 'Schedule not found',
    fallback: 'Try again'
  }
})
