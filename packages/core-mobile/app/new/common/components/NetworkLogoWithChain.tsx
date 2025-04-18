import { Network } from '@avalabs/core-chains-sdk'
import { Icons, useTheme, View } from '@avalabs/k2-alpine'
import { TokenLogo } from 'common/components/TokenLogo'
import React from 'react'
import { isPChain, isXChain, isXPChain } from 'utils/network/isAvalancheNetwork'

export const NetworkLogoWithChain = ({
  network,
  networkSize = 24,
  outerBorderColor,
  showChainLogo = true
}: {
  network: Network
  networkSize?: number
  outerBorderColor: string
  showChainLogo?: boolean
  chainLogoSize?: number
}): React.JSX.Element => {
  const { theme } = useTheme()

  const renderChainLogo = (): React.JSX.Element | undefined => {
    if (isXPChain(network.chainId)) {
      return theme.isDark ? (
        <Icons.TokenLogos.AVAX_XP_DARK
          testID="network_logo__xp_chain"
          width={16}
          height={16}
        />
      ) : (
        <Icons.TokenLogos.AVAX_XP_LIGHT
          testID="network_logo__xp_chain"
          width={16}
          height={16}
        />
      )
    }

    if (isPChain(network.chainId)) {
      return theme.isDark ? (
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

    if (isXChain(network.chainId)) {
      return theme.isDark ? (
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
        size={12}
        symbol={network.networkToken.symbol ?? 'AVAX'}
        logoUri={network.logoUri}
        isNetworkToken
      />
    )
  }

  return (
    <View>
      <TokenLogo
        size={networkSize}
        symbol={network.networkToken.symbol ?? 'AVAX'}
        logoUri={network.logoUri}
      />
      {showChainLogo && (
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 16 / 2,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: outerBorderColor,
            position: 'absolute',
            bottom: -5,
            right: -5,
            backgroundColor: 'transparent'
          }}
          testID="network_logo">
          {renderChainLogo()}
        </View>
      )}
    </View>
  )
}
