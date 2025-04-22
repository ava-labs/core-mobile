import MaskedView from '@react-native-masked-view/masked-view'
import { Image } from 'expo-image'
import React, { useEffect, useState } from 'react'
import { ImageSourcePropType, Platform, ViewStyle } from 'react-native'
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming
} from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'
import { useTheme } from '../../hooks'
import {
  colors,
  darkModeColors,
  lightModeColors
} from '../../theme/tokens/colors'
import { alpha } from '../../utils'
import { View } from '../Primitives'
import { Icons } from '../../theme/tokens/Icons'

export const HexagonImageView = ({
  source,
  height,
  backgroundColor,
  isSelected,
  hasLoading = false,
  showAddIcon = false
}: {
  source?: ImageSourcePropType
  height: number
  backgroundColor: string
  isSelected?: boolean
  hasLoading?: boolean
  showAddIcon?: boolean
}): JSX.Element => {
  const { theme } = useTheme()
  const selectedAnimation = useSharedValue(0)
  const selectedAnimatedStyle = useAnimatedStyle(() => ({
    opacity: selectedAnimation.value
  }))
  const [isLoading, setIsLoading] = useState(false)

  const handleLoadStart = (): void => {
    setIsLoading(true)
  }

  const handleLoadEnd = (): void => {
    setIsLoading(false)
  }

  useEffect(() => {
    selectedAnimation.value = withTiming(isSelected ? 1 : 0, {
      duration: 200,
      easing: Easing.inOut(Easing.ease)
    })
  }, [isSelected, selectedAnimation])

  return (
    <MaskedView
      maskElement={
        <Svg width={height} height={height} viewBox={hexagonPath.viewBox}>
          <Path d={hexagonPath.path} fill={theme.colors.$surfacePrimary} />
        </Svg>
      }>
      <Image
        key={`image-${source}`}
        recyclingKey={`image-recycling-${source}`}
        contentFit="cover"
        source={source}
        style={{ width: height, height: height, backgroundColor }}
        onLoadStart={hasLoading ? handleLoadStart : undefined}
        onLoadEnd={hasLoading ? handleLoadEnd : undefined}
      />
      {isLoading && (
        <LoadingView
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        />
      )}
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
        <Arrow key={theme.isDark ? 'dark' : 'light'} isSelected={isSelected} />
      </Animated.View>
      {showAddIcon && (
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
          <Icons.Content.Add
            color={theme.colors.$textPrimary}
            width={40}
            height={40}
          />
        </View>
      )}
    </MaskedView>
  )
}

export const HexagonBorder = ({ height }: { height: number }): JSX.Element => {
  const { theme } = useTheme()

  const strokeWidth = Math.floor(150 / height)

  return (
    <Svg
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      width={height}
      height={height}
      viewBox={hexagonBorderPath.viewBox}>
      <Path
        d={hexagonBorderPath.path}
        fill="none"
        stroke={theme.isDark ? colors.$neutralWhite : 'black'}
        strokeOpacity={0.1}
        strokeWidth={strokeWidth}
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
    // arrowAnimimation doesn't work on Android
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

const hexagonBorderPath = {
  path: `
  M76.75 4.36122L117.702 28.0048C124.973 32.2027 129.452 39.9607 129.452 48.3564V95.6436C129.452 104.039 124.973 111.797 117.702 115.995L76.75 139.639C69.4791 143.837 60.5209 143.837 53.25 139.639L12.2981 115.995C5.02717 111.797 0.548096 104.039 0.548096 95.6436V48.3564C0.548096 39.9607 5.02717 32.2027 12.2981 28.0048L53.25 4.36122C60.5209 0.163346 69.4791 0.163345 76.75 4.36122Z
`,
  viewBox: '0 0 130 144'
}

const LoadingView = ({ style }: { style: ViewStyle }): JSX.Element => {
  const backgroundAnimation = useSharedValue(0)
  const { theme } = useTheme()

  useEffect(() => {
    backgroundAnimation.value = withDelay(
      Math.random() * 1000,
      withRepeat(withTiming(1, { duration: 1000 }), -1, true)
    )
  }, [backgroundAnimation])

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      backgroundAnimation.value,
      [0, 1],
      [theme.colors.$surfacePrimary, theme.colors.$surfaceSecondary]
    )

    return {
      backgroundColor
    }
  })

  return <Animated.View style={[style, animatedStyle]} />
}
