import { Separator, View } from '@avalabs/k2-alpine'
import React from 'react'
import { BalanceChange, TokenDiff, TokenType } from '@avalabs/vm-module-types'
import { TokenDiffGroup } from './TokenDiffGroup'

const BalanceChangeComponent = ({
  balanceChange
}: {
  balanceChange: BalanceChange
}): JSX.Element | null => {
  // Check if this looks like a swap transaction (both ins and outs with different tokens)
  const isSwapLikeTransaction =
    balanceChange.outs.length > 0 &&
    balanceChange.ins.length > 0 &&
    // Check if we have different tokens in ins vs outs
    balanceChange.outs.some(
      outToken =>
        !balanceChange.ins.some(
          inToken => inToken.token.symbol === outToken.token.symbol
        )
    )

  // For swap transactions, show all tokens (including native SOL)
  // For other transactions, filter out native tokens when there are SPL tokens being sent
  // This mimics the behavior of ERC20 transactions where native tokens (ETH, AVAX) aren't shown
  const hasSplTokens =
    balanceChange.outs.some(
      tokenDiff =>
        'type' in tokenDiff.token && tokenDiff.token.type === TokenType.SPL
    ) ||
    balanceChange.ins.some(
      tokenDiff =>
        'type' in tokenDiff.token && tokenDiff.token.type === TokenType.SPL
    )

  // For swaps, identify if SOL is a main swap token or just for network fees
  const isNetworkFeeSol = (tokenDiff: TokenDiff): boolean => {
    // Only check SOL tokens
    if (!('type' in tokenDiff.token) && tokenDiff.token.symbol === 'SOL') {
      // In a Solana swap, if SOL is only used for network fees:
      // 1. It will only appear in the 'outs' array (fees are always outgoing)
      // 2. It won't be part of the main swap tokens (won't appear in ins)
      // 3. There will be exactly two other tokens involved (the actual swap pair)
      const isOnlyInOuts = !balanceChange.ins.some(
        inToken => !('type' in inToken.token) && inToken.token.symbol === 'SOL'
      )

      // Count unique tokens excluding SOL
      const uniqueNonSolTokens = new Set(
        [...balanceChange.ins, ...balanceChange.outs]
          .filter(t => t.token.symbol !== 'SOL')
          .map(t => t.token.symbol)
      )

      // For a swap, we should see exactly 2 other tokens (the swap pair)
      const isRegularSwap = uniqueNonSolTokens.size === 2

      return isOnlyInOuts && isRegularSwap
    }
    return false
  }

  const filteredOuts = isSwapLikeTransaction
    ? balanceChange.outs.filter(tokenDiff => !isNetworkFeeSol(tokenDiff))
    : hasSplTokens
    ? balanceChange.outs.filter(tokenDiff => 'type' in tokenDiff.token)
    : balanceChange.outs

  const filteredIns = isSwapLikeTransaction
    ? balanceChange.ins.filter(tokenDiff => !isNetworkFeeSol(tokenDiff))
    : hasSplTokens
    ? balanceChange.ins.filter(tokenDiff => 'type' in tokenDiff.token)
    : balanceChange.ins

  return (
    <View
      sx={{
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection: 'row',
        backgroundColor: '$surfaceSecondary',
        borderRadius: 12,
        marginBottom: 12
      }}>
      <View
        sx={{
          flexDirection: 'column'
        }}>
        {filteredOuts.map((outTokenDiff, index) => (
          <View key={index.toString()} sx={{ paddingVertical: 16 }}>
            <TokenDiffGroup tokenDiff={outTokenDiff} isOut={true} />
          </View>
        ))}
        {filteredOuts.length > 0 && filteredIns.length > 0 && (
          <Separator sx={{ marginHorizontal: 16 }} />
        )}
        {filteredIns.map((inTokenDiff, index) => (
          <View key={index.toString()} sx={{ paddingVertical: 16 }}>
            <TokenDiffGroup tokenDiff={inTokenDiff} isOut={false} />
          </View>
        ))}
      </View>
    </View>
  )
}

export default BalanceChangeComponent
