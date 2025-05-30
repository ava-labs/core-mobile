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
import { TokenLogo } from 'common/components/TokenLogo'
import { CHAIN_IDS_WITH_INCORRECT_SYMBOL } from 'consts/chainIdsWithIncorrectSymbol'

interface Props {
  token: LocalTokenWithBalance
  sx?: SxProp
  outerBorderColor: string // this color should match the background color of the parent view
}

export const LogoWithNetwork = ({
  token,
  sx,
  outerBorderColor
}: Props): React.JSX.Element => {
  const {
    theme: { isDark }
  } = useTheme()
  const network = useSelector(selectNetwork(token.networkChainId))
  const isMalicious = isTokenMalicious(token)

  const shouldShowNetworkLogo =
    token.type !== TokenType.NATIVE ||
    isTokenWithBalanceAVM(token) ||
    isTokenWithBalancePVM(token) ||
    (network &&
      CHAIN_IDS_WITH_INCORRECT_SYMBOL.includes(network.chainId) &&
      token.type === TokenType.NATIVE)

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

    const symbol = CHAIN_IDS_WITH_INCORRECT_SYMBOL.includes(n.chainId)
      ? undefined
      : n.networkToken.symbol

    return (
      <TokenLogo
        testID={`network_logo__${n.chainName}`}
        size={12}
        symbol={symbol}
        chainId={n.chainId}
        logoUri={n.logoUri}
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
        isMalicious={isMalicious}
      />
      {shouldShowNetworkLogo && network ? (
        <View
          sx={{
            width: 16,
            height: 16,
            borderRadius: 16 / 2,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: outerBorderColor,
            position: 'absolute',
            bottom: -4,
            right: -4,
            backgroundColor: 'transparent'
          }}
          testID="network_logo">
          {renderNetworkLogo(token, network)}
        </View>
      ) : undefined}
    </View>
  )
}
