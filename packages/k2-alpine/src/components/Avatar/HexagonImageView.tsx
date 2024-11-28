import MaskedView from '@react-native-masked-view/masked-view'
import React, { useEffect } from 'react'
import { ImageSourcePropType, Image, Platform } from 'react-native'
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'
import { alpha } from '../../utils'
import {
  colors,
  darkModeColors,
  lightModeColors
} from '../../theme/tokens/colors'
import { useTheme } from '../..'

export const HexagonImageView = ({
  source,
  height,
  isSelected
}: {
  source: ImageSourcePropType
  height: number
  isSelected?: boolean
}): JSX.Element => {
  const { theme } = useTheme()
  const selectedAnimation = useSharedValue(0)
  const selectedAnimatedStyle = useAnimatedStyle(() => ({
    opacity: selectedAnimation.value
  }))

  useEffect(() => {
    selectedAnimation.value = withTiming(isSelected ? 1 : 0, {
      duration: 200,
      easing: Easing.inOut(Easing.ease)
    })
  }, [isSelected, selectedAnimation])

  return (
    <MaskedView
      style={{ flex: 1 }}
      maskElement={
        <Svg width={height} height={height} viewBox={hexagonPath.viewBox}>
          <Path d={hexagonPath.path} fill="black" />
        </Svg>
      }>
      <Image
        key={`image-${source}`}
        resizeMode="cover"
        source={source}
        style={{ width: height, height: height }}
      />
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: alpha(
              theme.isDark ? colors.$neutralWhite : colors.$neutral850,
              0.8
            ),
            alignItems: 'center',
            justifyContent: 'center'
          },
          selectedAnimatedStyle
        ]}>
        <Arrow isSelected={isSelected} />
      </Animated.View>
    </MaskedView>
  )
}

export const HexagonBorder = ({ height }: { height: number }): JSX.Element => {
  const { theme } = useTheme()

  return (
    <Svg
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      width={height}
      height={height}
      viewBox={hexagonPath.viewBox}>
      <Path
        d={hexagonPath.path}
        fill="none"
        stroke={theme.isDark ? 'white' : 'black'}
        strokeOpacity={0.1}
        strokeWidth="1"
      />
    </Svg>
  )
}

const Arrow = ({ isSelected }: { isSelected?: boolean }): JSX.Element => {
  const { theme } = useTheme()
  const arrowAnimation = useSharedValue(
    Platform.OS === 'ios' ? arrowPath.length : 0
  )
  const arrowAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: arrowAnimation.value
  }))

  useEffect(() => {
    if (Platform.OS === 'ios') {
      arrowAnimation.value = isSelected
        ? withTiming(0, {
            duration: 400,
            easing: Easing.inOut(Easing.ease)
          })
        : arrowPath.length
    }
  }, [isSelected, arrowAnimation])

  return (
    <Svg
      width={arrowPath.width}
      height={arrowPath.height}
      viewBox={arrowPath.viewBox}
      fill="none">
      <AnimatedPath
        d={arrowPath.path}
        stroke={
          theme.isDark
            ? lightModeColors.$textPrimary
            : darkModeColors.$textPrimary
        }
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={arrowPath.length}
        animatedProps={arrowAnimatedProps}
      />
    </Svg>
  )
}

const AnimatedPath = Animated.createAnimatedComponent(Path)

const arrowPath = {
  path: 'M2 10L9.5 17.5L25.5 1.5',
  length: 34,
  viewBox: '0 0 27 19',
  width: 27,
  height: 19
}

const hexagonPath = {
  path: `
  M53 3.9282C60.4256 -0.358983 69.5744 -0.358984 77 3.9282L117.952 27.5718C125.378 31.859 129.952 39.782 129.952 48.3564V95.6436C129.952 104.218 125.378 112.141 117.952 116.428L77 140.072C69.5744 144.359 60.4256 144.359 53 140.072L12.0481 116.428C4.62247 112.141 0.0480957 104.218 0.0480957 95.6436V48.3564C0.0480957 39.782 4.62247 31.859 12.0481 27.5718L53 3.9282Z
`,
  viewBox: '0 0 130 144'
}
