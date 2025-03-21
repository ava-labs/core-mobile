import React from 'react'
import { Icons, SxProp, useTheme, View } from '@avalabs/k2-alpine'
import { TokenType } from '@avalabs/vm-module-types'
import { LocalTokenWithBalance } from 'store/balance'
import { useSelector } from 'react-redux'
import { selectNetwork } from 'store/network'
import { Network } from '@avalabs/core-chains-sdk'
import { isTokenMalicious } from 'utils/isTokenMalicious'
import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import { TokenLogo } from './TokenLogo'

interface Props {
  token: LocalTokenWithBalance
  sx?: SxProp
}

export const LogoWithNetwork = ({ token, sx }: Props): React.JSX.Element => {
  const {
    theme: { colors, isDark }
  } = useTheme()
  const network = useSelector(selectNetwork(token.networkChainId))
  const isMalicious = isTokenMalicious(token)

  const shouldShowNetworkLogo =
    token.type !== TokenType.NATIVE ||
    isTokenWithBalanceAVM(token) ||
    isTokenWithBalancePVM(token)
  const renderNetworkLogo = (
    t: LocalTokenWithBalance,
    n: Network
  ): React.JSX.Element | undefined => {
    if (isTokenWithBalancePVM(t)) {
      return isDark ? (
        <Icons.TokenLogos.AVAX_P_DARK
          testID="network_logo__p_chain"
          width={12}
          height={12}
        />
      ) : (
        <Icons.TokenLogos.AVAX_P_LIGHT
          testID="network_logo__p_chain"
          width={12}
          height={12}
        />
      )
    }
    if (isTokenWithBalanceAVM(t)) {
      return isDark ? (
        <Icons.TokenLogos.AVAX_X_DARK
          testID="network_logo__x_chain"
          width={12}
          height={12}
        />
      ) : (
        <Icons.TokenLogos.AVAX_X_LIGHT
          testID="network_logo__x_chain"
          width={12}
          height={12}
        />
      )
    }
    return (
      <TokenLogo
        testID={`network_logo__${n.chainName}`}
        size={12}
        symbol={n.networkToken.symbol}
        logoUri={n.logoUri}
        borderColor={colors.$borderPrimary}
        isNetworkToken
      />
    )
  }

  return (
    <View sx={{ width: 36, ...sx }}>
      <TokenLogo
        size={36}
        symbol={token.symbol}
        logoUri={token.logoUri}
        backgroundColor={colors.$borderPrimary}
        borderColor={colors.$borderPrimary}
        isMalicious={isMalicious}
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
              borderColor: colors.$borderPrimary,
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
