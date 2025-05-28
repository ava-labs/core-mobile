import { useTheme, View } from '@avalabs/k2-alpine'
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
      {l2Tokens.map(symbol => {
        const Icon = NETWORK_TOKEN_SYMBOL_TO_ICON[symbol as NetworkTokenSymbols]
        return (
          <View
            key={symbol}
            style={{
              marginRight: -4,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.$surfaceSecondary,
              overflow: 'hidden'
            }}>
            <Icon width={iconSize} height={iconSize} />
          </View>
        )
      })}
    </View>
  )
}
