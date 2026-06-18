import React from 'react'
import { Icons, useTheme, View } from '@avalabs/k2-alpine'
import { Network } from '@avalabs/core-chains-sdk'
import { TokenLogo } from 'common/components/TokenLogo'
import { isPChain, isXChain } from 'utils/network/isAvalancheNetwork'

interface Props {
  token: { symbol: string; logoUri?: string; chainId?: number }
  network: Network
  size?: 'small' | 'medium' | 'large'
  outerBorderColor: string // this color should match the background color of the parent view
}

export const LogoWithNetwork = ({
  token,
  network,
  size = 'large',
  outerBorderColor
}: Props): React.JSX.Element => {
  const {
    theme: { isDark }
  } = useTheme()
  const width = size === 'small' ? 32 : size === 'medium' ? 36 : 42
  const networkLogoWidth = size === 'small' ? 10 : size === 'medium' ? 12 : 16
  const borderWidth = 2
  const offset = size === 'small' ? -2 : size === 'medium' ? -4 : -6

  const renderNetworkBadge = (n: Network): React.JSX.Element => {
    if (isPChain(n.chainId)) {
      return isDark ? (
        <Icons.TokenLogos.AVAX_P_DARK
          testID="network_logo__p_chain"
          width={networkLogoWidth}
          height={networkLogoWidth}
        />
      ) : (
        <Icons.TokenLogos.AVAX_P_LIGHT
          testID="network_logo__p_chain"
          width={networkLogoWidth}
          height={networkLogoWidth}
        />
      )
    }
    if (isXChain(n.chainId)) {
      return isDark ? (
        <Icons.TokenLogos.AVAX_X_DARK
          testID="network_logo__x_chain"
          width={networkLogoWidth}
          height={networkLogoWidth}
        />
      ) : (
        <Icons.TokenLogos.AVAX_X_LIGHT
          testID="network_logo__x_chain"
          width={networkLogoWidth}
          height={networkLogoWidth}
        />
      )
    }
    return (
      <TokenLogo
        size={networkLogoWidth}
        symbol={n.networkToken.symbol}
        chainId={n.chainId}
        logoUri={n.logoUri}
        isNetworkToken
      />
    )
  }

  return (
    <View sx={{ width }}>
      <TokenLogo
        size={width}
        symbol={token.symbol}
        chainId={token.chainId}
        logoUri={token.logoUri}
      />
      {network ? (
        <View
          sx={{
            width: networkLogoWidth + borderWidth * 2,
            height: networkLogoWidth + borderWidth * 2,
            borderRadius: 20 / 2,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: borderWidth,
            borderColor: outerBorderColor,
            position: 'absolute',
            bottom: offset,
            right: offset,
            backgroundColor: 'transparent'
          }}
          testID={`network_logo__${network.chainName}`}>
          {renderNetworkBadge(network)}
        </View>
      ) : undefined}
    </View>
  )
}
