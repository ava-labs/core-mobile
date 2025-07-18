import { Separator, View } from '@avalabs/k2-alpine'
import React from 'react'
import { BalanceChange, TokenType } from '@avalabs/vm-module-types'
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

  const filteredOuts = isSwapLikeTransaction
    ? balanceChange.outs // Show all tokens for swaps
    : hasSplTokens
    ? balanceChange.outs.filter(tokenDiff => 'type' in tokenDiff.token)
    : balanceChange.outs

  const filteredIns = isSwapLikeTransaction
    ? balanceChange.ins // Show all tokens for swaps
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
