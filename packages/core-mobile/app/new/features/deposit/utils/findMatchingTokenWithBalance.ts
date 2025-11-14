import { TokenType } from '@avalabs/vm-module-types'
import { LocalTokenWithBalance } from 'store/balance'
import { isNetworkContractToken } from 'utils/isNetworkContractToken'

/**
 * Finds a token with balance that matches the given asset criteria.
 * Matches by contract address (for ERC20 tokens) or symbol (for native tokens).
 *
 * @param asset - Asset criteria containing symbol and optional contract address
 * @param tokenList - List of tokens with balances to search through
 * @returns Matching token with balance, or undefined if not found
 */
export const findMatchingTokenWithBalance = (
  asset: {
    symbol: string
    contractAddress?: string
  },
  tokensWithBalance: LocalTokenWithBalance[]
): LocalTokenWithBalance | undefined => {
  return tokensWithBalance.find(tokenWithBalance => {
    // For native tokens (e.g., AVAX), match by symbol
    if (tokenWithBalance.type === TokenType.NATIVE && !asset.contractAddress) {
      return (
        asset.symbol.toLowerCase() === tokenWithBalance.symbol.toLowerCase()
      )
    }

    // For ERC20 tokens, match by contract address
    if (isNetworkContractToken(tokenWithBalance)) {
      return (
        asset.contractAddress?.toLowerCase() ===
        tokenWithBalance.address.toLowerCase()
      )
    }

    return false
  })
}
