import { Network } from '@avalabs/core-chains-sdk'
import { Icons, useTheme, View } from '@avalabs/k2-alpine'
import { TokenLogo } from 'common/components/TokenLogo'
import { CHAIN_IDS_WITH_INCORRECT_SYMBOL } from 'consts/chainIdsWithIncorrectSymbol'
import React from 'react'
import { ViewStyle } from 'react-native'
import { isPChain, isXChain, isXPChain } from 'utils/network/isAvalancheNetwork'

export const NetworkLogoWithChain = ({
  network,
  networkSize = 24,
  outerBorderColor,
  showChainLogo = true,
  chainLogoSize,
  chainLogoStyle
}: {
  network: Network
  networkSize?: number
  outerBorderColor?: string // only needed if showChainLogo is true
  showChainLogo?: boolean
  chainLogoSize?: number
  chainLogoStyle?: ViewStyle
}): React.JSX.Element => {
  const { theme } = useTheme()

  const renderChainLogo = (): React.JSX.Element | undefined => {
    if (isXPChain(network.chainId)) {
      return theme.isDark ? (
        <Icons.TokenLogos.AVAX_XP_DARK
          testID="network_logo__xp_chain"
          width={chainLogoSize ?? 16}
          height={chainLogoSize ?? 16}
        />
      ) : (
        <Icons.TokenLogos.AVAX_XP_LIGHT
          testID="network_logo__xp_chain"
          width={chainLogoSize ?? 16}
          height={chainLogoSize ?? 16}
        />
      )
    }

    if (isPChain(network.chainId)) {
      return theme.isDark ? (
        <Icons.TokenLogos.AVAX_P_DARK
          testID="network_logo__p_chain"
          width={chainLogoSize ?? 12}
          height={chainLogoSize ?? 12}
        />
      ) : (
        <Icons.TokenLogos.AVAX_P_LIGHT
          testID="network_logo__p_chain"
          width={chainLogoSize ?? 12}
          height={chainLogoSize ?? 12}
        />
      )
    }

    if (isXChain(network.chainId)) {
      return theme.isDark ? (
        <Icons.TokenLogos.AVAX_X_DARK
          testID="network_logo__x_chain"
          width={chainLogoSize ?? 12}
          height={chainLogoSize ?? 12}
        />
      ) : (
        <Icons.TokenLogos.AVAX_X_LIGHT
          testID="network_logo__x_chain"
          width={chainLogoSize ?? 12}
          height={chainLogoSize ?? 12}
        />
      )
    }

    return (
      <TokenLogo
        size={chainLogoSize ?? 12}
        symbol={network.networkToken.symbol ?? 'AVAX'}
        chainId={network.chainId}
        logoUri={network.logoUri}
        isNetworkToken
      />
    )
  }

  const symbol = CHAIN_IDS_WITH_INCORRECT_SYMBOL.includes(network.chainId)
    ? undefined
    : network.networkToken.symbol

  return (
    <View>
      <TokenLogo
        size={networkSize}
        symbol={symbol}
        chainId={network.chainId}
        logoUri={network.logoUri}
      />
      {showChainLogo && (
        <View
          style={{
            width: chainLogoSize ?? 16,
            height: chainLogoSize ?? 16,
            borderRadius: 1000,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: outerBorderColor,
            position: 'absolute',
            bottom: -5,
            right: -5,
            backgroundColor: 'transparent',
            ...chainLogoStyle
          }}
          testID="network_logo">
          {renderChainLogo()}
        </View>
      )}
    </View>
  )
}
