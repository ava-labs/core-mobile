import { alpha, useTheme, View } from '@avalabs/k2-alpine'
import {
  NETWORK_TOKEN_SYMBOL_TO_ICON,
  NetworkTokenSymbols
} from 'common/components/TokenIcon'
import React from 'react'
import { Image, ImageSourcePropType, ViewStyle } from 'react-native'
import { TokenSymbol } from 'store/network'

// Hello UI: limited-mode-only chain pack — Tether/Eth/Avax to match the
// signup splash exactly. PNGs ship in app/assets/icons/limited-mode.
const MOTO_RECEIVE_ICONS: ImageSourcePropType[] = [
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('assets/icons/limited-mode/usdt.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('assets/icons/limited-mode/eth.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('assets/icons/limited-mode/avax.png')
]

export const SupportedReceiveEvmTokens = ({
  iconSize,
  style
}: {
  iconSize: number
  style?: ViewStyle
}): JSX.Element => {
  const {
    theme,
    theme: { colors }
  } = useTheme()
  const isMoto = theme.variant === 'moto'

  const l2Tokens: NetworkTokenSymbols[] = [
    TokenSymbol.AVAX,
    TokenSymbol.ETH,
    TokenSymbol.BASE,
    TokenSymbol.OP,
    TokenSymbol.ARB
  ]

  if (isMoto) {
    // Hello UI: USDT/ETH/AVAX trio matching the signup splash. Slight
    // negative margin so the squircle icons overlap, with a thin black
    // outline lifting each one off its neighbour.
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
          ...style
        }}>
        {MOTO_RECEIVE_ICONS.map((source, index) => (
          <Image
            key={index}
            source={source}
            style={{
              width: iconSize,
              height: iconSize,
              borderRadius: Math.round(iconSize * 0.25),
              borderWidth: 1.5,
              borderColor: '#000000',
              marginLeft: index === 0 ? 0 : -Math.round(iconSize * 0.25)
            }}
          />
        ))}
      </View>
    )
  }

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
              marginRight: -2,
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
