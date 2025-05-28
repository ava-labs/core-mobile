import { alpha, useTheme, View } from '@avalabs/k2-alpine'
import {
  NETWORK_TOKEN_SYMBOL_TO_ICON,
  NetworkTokenSymbols
} from 'common/components/TokenIcon'
import React from 'react'
import { ViewStyle } from 'react-native'
import { TokenSymbol } from 'store/network'

export const SupportedReceiveEvmTokens = ({
  iconSize,
  style
}: {
  iconSize: number
  style?: ViewStyle
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  const l2Tokens: NetworkTokenSymbols[] = [
    TokenSymbol.AVAX,
    TokenSymbol.ETH,
    TokenSymbol.BASE,
    TokenSymbol.OP,
    TokenSymbol.ARB
  ]

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        ...style
      }}>
      {l2Tokens.map((symbol, index) => {
        const Icon = NETWORK_TOKEN_SYMBOL_TO_ICON[symbol as NetworkTokenSymbols]
        return (
          <View
            key={symbol}
            style={{
              width: iconSize,
              height: iconSize,
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1 - index,
              marginRight: -4,
              borderRadius: 1000,
              borderWidth: 1,
              borderColor: alpha(colors.$textPrimary, 0.1),
              overflow: 'hidden'
            }}>
            <Icon width={iconSize} height={iconSize} />
          </View>
        )
      })}
    </View>
  )
}
