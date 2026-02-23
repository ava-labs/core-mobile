import React from 'react'
import { useTheme, View } from '@avalabs/k2-alpine'
import { Logo } from 'common/components/Logo'
import { Network } from '@avalabs/core-chains-sdk'
import { DefiAssetDetails } from '../types'

export const DefiAssetLogo = ({
  asset,
  network,
  width = 36,
  networkLogoInset = -4
}: {
  asset: DefiAssetDetails
  network?: Network
  width?: number
  networkLogoInset?: number
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const borderColor = colors.$surfaceSecondary

  const networkLogoSize = 18

  return (
    <View
      sx={{
        width: width,
        height: width,
        borderRadius: width / 2
      }}>
      <Logo
        logoUri={asset.iconUrl}
        size={width}
        borderColor={colors.$borderPrimary}
      />
      {network && (
        <View
          style={{
            width: networkLogoSize,
            height: networkLogoSize,
            borderRadius: networkLogoSize / 2,
            position: 'absolute',
            bottom: networkLogoInset,
            right: networkLogoInset,
            borderColor,
            borderWidth: 2
          }}>
          <Logo
            logoUri={network.logoUri}
            size={networkLogoSize - 4}
            testID={`network_logo__${network.chainName}`}
          />
        </View>
      )}
    </View>
  )
}
