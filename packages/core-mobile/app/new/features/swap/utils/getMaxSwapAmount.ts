import { TokenType } from '@avalabs/vm-module-types'
import { LocalTokenWithBalance } from 'store/balance'

export type GetMaxSwapAmountParams = {
  fromToken: LocalTokenWithBalance | undefined
  gasCost: bigint | undefined
}

/**
 * Calculate the maximum swap amount based on token type.
 * - ERC20/SPL tokens: full balance (fees paid in native token)
 * - Native tokens (AVAX/SOL): balance minus gas cost
 */
export const getMaxSwapAmount = ({
  fromToken,
  gasCost
}: GetMaxSwapAmountParams): bigint | undefined => {
  if (!fromToken?.balance) {
    return undefined
  }

  // ERC20, SPL tokens: return full balance
  if (fromToken.type === TokenType.ERC20 || fromToken.type === TokenType.SPL) {
    return fromToken.balance
  }

  // Native tokens (AVAX, SOL): balance - gasCost
  if (fromToken.type === TokenType.NATIVE) {
    const max = fromToken.balance - (gasCost ?? 0n)
    return max > 0n ? max : 0n
  }

  return undefined
}
