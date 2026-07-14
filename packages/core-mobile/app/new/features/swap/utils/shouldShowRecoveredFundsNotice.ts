import { getRecoveredAtomicAmount } from '@avalabs/fusion-sdk'
import type { Quote } from '../types'

/**
 * True when the swap UI should note that the imported (received) amount includes
 * AVAX recovered from a previous incomplete cross-chain transfer, i.e. this CCT
 * quote sweeps in stuck atomic UTXOs alongside (or, for a zero-amount recovery,
 * instead of) the newly-transferred amount.
 *
 * Delegates to the SDK's `getRecoveredAtomicAmount`, which returns the recovered
 * portion of `amountOut` (`null` for non-CCT quotes), so the AVALANCHE_CCT gate
 * and the decimal-aware math both live in one place. No client-side atomic-UTXO
 * detection needed.
 */
export const shouldShowRecoveredFundsNotice = ({
  quote
}: {
  quote: Quote | null | undefined
}): boolean => !!quote && (getRecoveredAtomicAmount(quote) ?? 0n) > 0n
