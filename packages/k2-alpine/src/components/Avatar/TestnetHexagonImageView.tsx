import MaskedView from '@react-native-masked-view/masked-view'
import React from 'react'
import Svg, { Path } from 'react-native-svg'
import { useTheme } from '../../hooks'
import { Icons } from '../../theme/tokens/Icons'
import { View } from '../Primitives'

export const TestnetHexagonImageView = ({
  height,
  size
}: {
  height: number
  size: number | 'small' | 'large'
}): JSX.Element => {
  const { theme } = useTheme()
  const iconHeight =
    (typeof size === 'number' && size >= 150) || size === 'large'
      ? height / 3
      : height / 2

  return (
    <MaskedView
      maskElement={
        <Svg width={height} height={height} viewBox={hexagonPath.viewBox}>
          <Path d={hexagonPath.path} fill={theme.colors.$surfacePrimary} />
        </Svg>
      }>
      <View
        sx={{
          width: height,
          height: height,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '$borderPrimary'
        }}>
        <Icons.Custom.WaterDrop
          width={iconHeight}
          height={iconHeight}
          color={theme.colors.$textPrimary}
        />
      </View>
    </MaskedView>
  )
}

const hexagonPath = {
  path: `
  M53 3.9282C60.4256 -0.358983 69.5744 -0.358984 77 3.9282L117.952 27.5718C125.378 31.859 129.952 39.782 129.952 48.3564V95.6436C129.952 104.218 125.378 112.141 117.952 116.428L77 140.072C69.5744 144.359 60.4256 144.359 53 140.072L12.0481 116.428C4.62247 112.141 0.0480957 104.218 0.0480957 95.6436V48.3564C0.0480957 39.782 4.62247 31.859 12.0481 27.5718L53 3.9282Z
`,
  viewBox: '0 0 130 144'
}
