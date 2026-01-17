import React from 'react'
import { View } from '@avalabs/k2-alpine'
import { DefiMarket } from '../types'
import { DefiAssetLogo } from './DefiAssetLogo'
import { DefiMarketLogo } from './DefiMarketLogo'

export const DefiMarketAssetLogo = ({
  market,
  logoWidth = 62,
  networkLogoWidth = 20
}: {
  market: DefiMarket
  logoWidth?: number
  networkLogoWidth?: number
}): JSX.Element => {
  return (
    <View sx={{ flexDirection: 'row', alignItems: 'center' }}>
      <DefiAssetLogo asset={market.asset} width={logoWidth} />
      <View
        sx={{
          marginLeft: -20,
          borderWidth: 2,
          borderRadius: logoWidth / 2,
          borderColor: '$surfaceSecondary'
        }}>
        <DefiMarketLogo
          marketName={market.marketName}
          networkLogoUri={market.network.logoUri}
          width={logoWidth}
          networkLogoWidth={networkLogoWidth}
        />
      </View>
    </View>
  )
}
