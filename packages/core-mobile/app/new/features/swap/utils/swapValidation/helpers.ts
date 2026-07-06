import { TokenBalanceChange } from './types'

// Native tokens match by missing or zero address; ERC-20s by
// case-insensitive address.
export function findTokenInBalanceChange(
  balanceChangeArray: TokenBalanceChange[],
  tokenAddress: string | undefined,
  isNative: boolean
): TokenBalanceChange | undefined {
  if (!balanceChangeArray || balanceChangeArray.length === 0) {
    return undefined
  }

  for (const item of balanceChangeArray) {
    const token = item.token
    if (!token) continue

    if (isNative) {
      if (
        !token.address ||
        token.address === '0x0000000000000000000000000000000000000000'
      ) {
        return item
      }
    } else if (
      tokenAddress &&
      token.address &&
      token.address.toLowerCase() === tokenAddress.toLowerCase()
    ) {
      return item
    }
  }

  return undefined
}
