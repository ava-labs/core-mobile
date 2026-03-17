import { TokenType } from '@avalabs/vm-module-types'
import { LocalTokenWithBalance } from 'store/balance'

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
):
  | (LocalTokenWithBalance & { type: TokenType.ERC20 | TokenType.NATIVE })
  | undefined => {
  return tokensWithBalance
    .filter(
      tokenWithBalance =>
        tokenWithBalance.type === TokenType.ERC20 ||
        tokenWithBalance.type === TokenType.NATIVE
    )
    .find(tokenWithBalance => {
      // For native tokens (e.g., AVAX), match by symbol
      if (
        tokenWithBalance.type === TokenType.NATIVE &&
        !asset.contractAddress
      ) {
        return (
          asset.symbol.toLowerCase() === tokenWithBalance.symbol.toLowerCase()
        )
      }

      // For ERC20 tokens, match by contract address
      if (tokenWithBalance.type === TokenType.ERC20) {
        return (
          asset.contractAddress?.toLowerCase() ===
          tokenWithBalance.address.toLowerCase()
        )
      }

      return false
    })
}
