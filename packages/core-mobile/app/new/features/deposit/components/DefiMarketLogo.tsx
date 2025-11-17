import React from 'react'
import { Image, useTheme, View } from '@avalabs/k2-alpine'
import { Logo } from 'common/components/Logo'
import { DefiMarket, MarketNames } from '../types'

export const DefiMarketLogo = ({
  item
}: {
  item: DefiMarket
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const borderColor = colors.$surfaceSecondary

  const width = 36
  const networkLogoInset = -4
  const networkLogoSize = 18
  const borderWidth = 2

  return (
    <View sx={{ width: width, height: width }}>
      <Image
        source={
          item.marketName === MarketNames.aave
            ? require('../../../assets/icons/aave.png')
            : require('../../../assets/icons/benqi.png')
        }
        style={{
          width: width,
          height: width,
          borderRadius: width / 2
        }}
        testID="protocol_logo"
      />
      <View
        style={{
          width: networkLogoSize,
          height: networkLogoSize,
          borderRadius: networkLogoSize / 2,
          position: 'absolute',
          bottom: networkLogoInset,
          right: networkLogoInset,
          borderColor,
          borderWidth
        }}>
        <Logo
          logoUri={item.network.logoUri}
          size={networkLogoSize - borderWidth * 2}
          testID={`network_logo__${item.network.chainName}`}
        />
      </View>
    </View>
  )
}
