import React from 'react'
import { useTheme, View } from '@avalabs/k2-alpine'
import { DefiMarket } from '../types'
import { DefiAssetLogo } from './DefiAssetLogo'
import { DefiMarketLogo } from './DefiMarketLogo'

export const DefiMarketAssetLogo = ({
  market,
  logoWidth = 62,
  networkLogoWidth = 20,
  overwrappingWidth = 20,
  borderColor: borderColorProp
}: {
  market: DefiMarket
  logoWidth?: number
  networkLogoWidth?: number
  overwrappingWidth?: number
  borderColor?: string
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const borderColor = borderColorProp ?? colors.$surfaceSecondary

  return (
    <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
      <DefiAssetLogo asset={market.asset} width={logoWidth} />
      <View
        sx={{
          marginLeft: -overwrappingWidth
        }}>
        <DefiMarketLogo
          marketName={market.marketName}
          networkLogoUri={market.network.logoUri}
          width={logoWidth + BORDER_WIDTH * 2}
          networkLogoWidth={networkLogoWidth}
          borderColor={borderColor}
          borderWidth={BORDER_WIDTH}
        />
      </View>
    </View>
  )
}

const BORDER_WIDTH = 2
