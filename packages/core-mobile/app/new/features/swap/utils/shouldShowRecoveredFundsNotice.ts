import { ServiceType } from '@avalabs/fusion-sdk'
import type { Quote } from '../types'

/**
 * True when the swap UI should note that the imported (received) amount includes
 * AVAX recovered from a previous incomplete cross-chain transfer — i.e. this CCT
 * quote sweeps in stuck atomic UTXOs alongside (or, for a zero-amount recovery,
 * instead of) the newly-transferred amount.
 *
 * Driven entirely by the SDK's `recoveredAmountOut` (the portion of `amountOut`
 * attributable to recovered funds), so no client-side atomic-UTXO detection is
 * needed. Covers both a normal swap that folds in stuck funds and a zero-amount
 * pure recovery (where `recoveredAmountOut === amountOut`).
 *
 * Gated on the AVALANCHE_CCT service type (like `shouldShowAvalancheCctTwoTxNotice`)
 * so the AVAX-specific copy can never surface on another service's quote, even
 * if that service were to populate `recoveredAmountOut`.
 */
export const shouldShowRecoveredFundsNotice = ({
  quote
}: {
  quote: Quote | null | undefined
}): boolean =>
  quote?.serviceType === ServiceType.AVALANCHE_CCT &&
  (quote.recoveredAmountOut ?? 0n) > 0n
