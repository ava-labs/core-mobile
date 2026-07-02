import FusionService from '../services/FusionService'
import type { Quote } from '../types'
import type { QuoterParams } from '../services/types'
import { logSdkError } from './fusionLogger'

/**
 * Subscribes to the first quote emitted by a Quoter for the given params, calls
 * `onQuote` with it, then unsubscribes. Calls `onFailed` if the stream ends
 * (`done`) or errors before a quote arrives. Returns a cleanup function, or
 * undefined if the quoter could not be created.
 *
 * Settles exactly once: `unsubscribe()` synchronously fires a `done`
 * (`unsubscribed`) event, which the `settled` guard ignores so a resolved quote
 * isn't clobbered.
 */
export const subscribeToFirstQuote = (
  params: QuoterParams,
  onQuote: (quote: Quote) => void,
  onFailed: () => void
): (() => void) | undefined => {
  try {
    const quoter = FusionService.getQuoter(params)
    if (!quoter) return undefined

    let settled = false
    const unsubscribe = quoter.subscribe((event, data) => {
      if (settled) return
      if (event === 'quote') {
        settled = true
        onQuote(data.bestQuote)
        unsubscribe()
      } else if (event === 'done' || event === 'error') {
        settled = true
        onFailed()
        unsubscribe()
      }
    })
    return () => {
      settled = true
      unsubscribe()
    }
  } catch (error) {
    logSdkError('[subscribeToFirstQuote] error', error)
    return undefined
  }
}
