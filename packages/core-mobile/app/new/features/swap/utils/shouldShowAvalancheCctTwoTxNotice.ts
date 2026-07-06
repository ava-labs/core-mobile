import { ServiceType } from '@avalabs/fusion-sdk'
import type { Quote } from '../types'

/**
 * True when the swap UI should warn the user that this transfer requires two
 * signatures (an X/P export tx and a destination-chain import tx).
 *
 * - Live quote routes through the CCT service.
 * - Not a recovery quote (`amountIn === 0n` means import-only — a single tx).
 *
 * Unlike core-web's `shouldShowAvalancheCctTransactionsInfo`, this does NOT
 * carve out Seedless. On web the Seedless connector signs both legs in-session
 * with no approval prompt, so there's nothing to warn about. Mobile routes
 * every leg through the in-app approval pipeline (see `createCctCallbacks`), so
 * a Seedless user still approves both the export and import — the warning
 * applies to every wallet type.
 */
export const shouldShowAvalancheCctTwoTxNotice = ({
  quote
}: {
  quote: Quote | null | undefined
}): boolean => {
  if (!quote) return false
  return (
    quote.serviceType === ServiceType.AVALANCHE_CCT &&
    quote.amountIn !== undefined &&
    quote.amountIn > 0n
  )
}
