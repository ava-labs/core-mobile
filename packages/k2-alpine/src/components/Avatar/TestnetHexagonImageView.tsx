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
    <View style={{ width: height, height: height }}>
      {/* Hexagon background (replaces the legacy MaskedView clip) */}
      <Svg width={height} height={height} viewBox={`0 0 ${height} ${height}`}>
        <Path
          d={hexagonPath.path}
          transform={hexagonTransform(height)}
          fill={theme.colors.$borderPrimary}
        />
      </Svg>
      {/* Centered water-drop icon, sits within the hexagon bounds */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
        <Icons.Custom.WaterDrop
          width={iconHeight}
          height={iconHeight}
          color={theme.colors.$textPrimary}
        />
      </View>
    </View>
  )
}

// Matches the legacy MaskedView mask geometry: <Svg viewBox="0 0 130 144"> with
// the default preserveAspectRatio "xMidYMid meet" scales the hexagon UNIFORMLY
// to fit the square and centers it (it does NOT stretch to fill width).
const hexagonTransform = (height: number): string => {
  const scale = height / 144
  const translateX = (height - 130 * scale) / 2
  return `translate(${translateX}, 0) scale(${scale})`
}

const hexagonPath = {
  path: `
  M53 3.9282C60.4256 -0.358983 69.5744 -0.358984 77 3.9282L117.952 27.5718C125.378 31.859 129.952 39.782 129.952 48.3564V95.6436C129.952 104.218 125.378 112.141 117.952 116.428L77 140.072C69.5744 144.359 60.4256 144.359 53 140.072L12.0481 116.428C4.62247 112.141 0.0480957 104.218 0.0480957 95.6436V48.3564C0.0480957 39.782 4.62247 31.859 12.0481 27.5718L53 3.9282Z
`,
  viewBox: '0 0 130 144'
}
