import React from 'react'
import { View } from '@avalabs/k2-alpine'
import { Network } from '@avalabs/core-chains-sdk'
import { TokenLogo } from 'common/components/TokenLogo'

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
  const width = size === 'small' ? 32 : size === 'medium' ? 36 : 42
  const networkLogoWidth = size === 'small' ? 10 : size === 'medium' ? 12 : 16
  const borderWidth = 2
  const offset = size === 'small' ? -2 : size === 'medium' ? -4 : -6

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
          testID="network_logo">
          <TokenLogo
            testID={`network_logo__${network.chainName}`}
            size={networkLogoWidth}
            symbol={network.networkToken.symbol}
            chainId={network.chainId}
            logoUri={network.logoUri}
            isNetworkToken
          />
        </View>
      ) : undefined}
    </View>
  )
}
