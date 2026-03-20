import React from 'react'
import { Image, useTheme, View } from '@avalabs/k2-alpine'
import { Logo } from 'common/components/Logo'
import { MarketNames } from '../types'

type DefiMarketLogoProps = {
  marketName: MarketNames | 'aave' | 'benqi'
  networkLogoUri?: string
  width?: number
  networkLogoWidth?: number
  borderWidth?: number
  borderColor?: string
}

export const DefiMarketLogo = ({
  marketName,
  networkLogoUri,
  width = 36,
  networkLogoWidth = 18,
  borderWidth = 2,
  borderColor: borderColorProp
}: DefiMarketLogoProps): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const borderColor = borderColorProp ?? colors.$surfaceSecondary

  const networkLogoInset = -4

  const isAave =
    marketName === MarketNames.aave || marketName.toLowerCase() === 'aave'

  return (
    <View sx={{ width: width, height: width }}>
      <Image
        source={
          isAave
            ? require('../../../assets/icons/aave.png')
            : require('../../../assets/icons/benqi.png')
        }
        style={{
          width: width,
          height: width,
          borderRadius: width / 2,
          borderWidth,
          borderColor,
          backgroundColor: borderColor
        }}
        testID={`protocol_logo__${marketName}`}
      />
      {networkLogoUri && (
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
            logoUri={networkLogoUri}
            size={networkLogoWidth - borderWidth * 2}
            testID={`protocol_logo__${marketName}`}
          />
        </View>
      )}
    </View>
  )
}
