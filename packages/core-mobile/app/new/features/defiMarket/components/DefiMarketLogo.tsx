import React from 'react'
import { Image, useTheme, View } from '@avalabs/k2-alpine'
import { Logo } from 'common/components/Logo'
import { DefiMarket, MarketNames } from '../types'

export const DefiMarketLogo = ({
  item,
  width = 36,
  networkLogoWidth = 18
}: {
  item: DefiMarket
  width?: number
  networkLogoWidth?: number
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const borderColor = colors.$surfaceSecondary

  const networkLogoInset = -4
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
          width: networkLogoWidth,
          height: networkLogoWidth,
          borderRadius: networkLogoWidth / 2,
          position: 'absolute',
          bottom: networkLogoInset,
          right: networkLogoInset,
          borderColor,
          borderWidth
        }}>
        <Logo
          logoUri={item.network.logoUri}
          size={networkLogoWidth - borderWidth * 2}
          testID={`network_logo__${item.network.chainName}`}
        />
      </View>
    </View>
  )
}
