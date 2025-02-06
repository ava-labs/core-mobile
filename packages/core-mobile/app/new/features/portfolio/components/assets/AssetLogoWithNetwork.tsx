import React from 'react'

import { alpha, Icons, useTheme, View } from '@avalabs/k2-alpine'
import { TokenType, TokenWithBalance } from '@avalabs/vm-module-types'
import { TokenLogo } from '../TokenLogo'

interface Props {
  token: TokenWithBalance
}

export const AssetLogoWithNetwork = ({ token }: Props): React.JSX.Element => {
  const {
    theme: { colors, isDark }
  } = useTheme()
  const borderColor = isDark ? colors.$borderPrimary : alpha('#000000', 0.15)

  const renderNetworkLogo = (
    tokenType: TokenType
  ): React.JSX.Element | undefined => {
    if (tokenType === TokenType.NATIVE) {
      return undefined
    }
    return (
      <View
        style={{
          width: 16,
          height: 16,
          borderRadius: 16 / 2,
          position: 'absolute',
          bottom: -2,
          right: -2,
          borderColor: colors.$surfacePrimary,
          borderWidth: 2,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden'
        }}
        testID="network_logo">
        <Icons.Logos.Eth width={12} height={12} />
      </View>
    )
  }

  return (
    <View style={{ marginRight: 16 }}>
      <TokenLogo
        size={36}
        symbol={token.symbol}
        logoUri={token.logoUri}
        backgroundColor={colors.$borderPrimary}
        borderColor={borderColor}
      />
      {renderNetworkLogo(token.type)}
    </View>
  )
}
