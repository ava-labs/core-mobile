import { ServiceType } from '@avalabs/fusion-sdk'
import type { Quote } from '../types'

/**
 * True when the swap UI should warn the user that this transfer requires two
 * signatures (an X/P export tx and a destination-chain import tx).
 *
 * Mirrors core-web's `shouldShowAvalancheCctTransactionsInfo`:
 * - Live quote routes through the CCT service.
 * - Not a recovery quote (`amountIn === 0n` means import-only).
 * - Wallet isn't Seedless — Seedless handles both signatures internally
 *   without surfacing two approval prompts to the user.
 */
export const shouldShowAvalancheCctTwoTxNotice = ({
  quote,
  isSeedlessWallet
}: {
  quote: Quote | null | undefined
  isSeedlessWallet: boolean
}): boolean => {
  if (!quote) return false
  return (
    quote.serviceType === ServiceType.AVALANCHE_CCT &&
    quote.amountIn !== undefined &&
    quote.amountIn > 0n &&
    !isSeedlessWallet
  )
}
