import React from 'react'
import { alpha, Icons, useTheme, View } from '@avalabs/k2-alpine'
import { TokenType } from '@avalabs/vm-module-types'
import { AVAX_P_ID, AVAX_X_ID, LocalTokenWithBalance } from 'store/balance'
import { useSelector } from 'react-redux'
import { selectNetwork } from 'store/network'
import { Network } from '@avalabs/core-chains-sdk'
import { TokenLogo } from '../TokenLogo'

interface Props {
  token: LocalTokenWithBalance
}

export const LogoWithNetwork = ({ token }: Props): React.JSX.Element => {
  const {
    theme: { colors, isDark }
  } = useTheme()
  const borderColor = isDark ? colors.$borderPrimary : alpha('#000000', 0.15)

  const network = useSelector(selectNetwork(token.networkChainId))

  const shouldShowNetworkLogo =
    token.type !== TokenType.NATIVE ||
    token.localId === AVAX_X_ID ||
    token.localId === AVAX_P_ID

  const renderNetworkLogo = (
    t: LocalTokenWithBalance,
    n: Network
  ): React.JSX.Element | undefined => {
    if (t.localId === AVAX_X_ID) {
      return isDark ? (
        <Icons.Logos.AvaxXDark width={12} height={12} />
      ) : (
        <Icons.Logos.AvaxX width={12} height={12} />
      )
    }
    if (t.localId === AVAX_P_ID) {
      return isDark ? (
        <Icons.Logos.AvaxPDark width={12} height={12} />
      ) : (
        <Icons.Logos.AvaxP width={12} height={12} />
      )
    }

    return <TokenLogo size={12} symbol={token.symbol} logoUri={n.logoUri} />
  }

  return (
    <View style={{ marginRight: 16, width: 36 }}>
      <TokenLogo
        size={36}
        symbol={token.symbol}
        logoUri={token.logoUri}
        backgroundColor={colors.$borderPrimary}
        borderColor={borderColor}
      />
      {shouldShowNetworkLogo && network ? (
        <View
          sx={{
            width: 16,
            height: 16,
            borderRadius: 16 / 2,
            position: 'absolute',
            bottom: -2,
            right: -2,
            backgroundColor: colors.$surfacePrimary,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden'
          }}
          testID="network_logo">
          <View
            sx={{
              borderColor: borderColor,
              borderWidth: 1,
              width: 14,
              height: 14,
              borderRadius: 14 / 2,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            {renderNetworkLogo(token, network)}
          </View>
        </View>
      ) : undefined}
    </View>
  )
}
