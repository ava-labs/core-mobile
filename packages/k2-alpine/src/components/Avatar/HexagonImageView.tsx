import React, { useEffect, useId, useState } from 'react'
import { Platform, ViewStyle } from 'react-native'
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
import Svg, {
  ClipPath,
  Defs,
  G,
  Image as SvgImage,
  Path
} from 'react-native-svg'
import { useTheme } from '../../hooks'
import {
  colors,
  darkModeColors,
  lightModeColors
} from '../../theme/tokens/colors'
import { Icons } from '../../theme/tokens/Icons'
import { alpha } from '../../utils'
import { View } from '../Primitives'
import { AvatarType } from './Avatar'

export const HexagonImageView = ({
  source,
  height,
  imageKey,
  backgroundColor,
  isSelected,
  hasLoading = false,
  showAddIcon = false
}: {
  source?: AvatarType['source']
  height: number
  backgroundColor: string
  imageKey?: string
  isSelected?: boolean
  hasLoading?: boolean
  showAddIcon?: boolean
}): JSX.Element => {
  const { theme } = useTheme()
  // react-native-svg requires unique ids when multiple instances render.
  // useId() returns a string containing ":"; strip it to keep the id a safe,
  // stable SVG identifier.
  const clipId = `hexagon-clip-${useId().replace(/:/g, '')}`
  const selectedAnimation = useSharedValue(0)
  const selectedAnimatedStyle = useAnimatedStyle(() => ({
    opacity: selectedAnimation.value
  }))

  const isSvgComponent = typeof source === 'function'
  const hasValidSource = source !== null && source !== undefined
  const isRasterSource = hasValidSource && !isSvgComponent

  const [isLoading, setIsLoading] = useState(false)

  const handleLoadEnd = (): void => {
    setIsLoading(false)
  }

  useEffect(() => {
    selectedAnimation.value = withTiming(isSelected ? 1 : 0, {
      duration: 200,
      easing: Easing.inOut(Easing.ease)
    })
  }, [isSelected, selectedAnimation])

  // react-native-svg's <Image> only exposes onLoad (no onLoadStart). Start in
  // the loading state for raster sources and clear it once the image loads.
  useEffect(() => {
    if (hasLoading && isRasterSource) {
      setIsLoading(true)
    }
  }, [hasLoading, isRasterSource, imageKey, source])

  const backgroundFill = backgroundColor || theme.colors.$surfaceSecondary
  const overlayColor = alpha(
    theme.isDark ? colors.$neutralWhite : colors.$neutral850,
    0.8
  )

  return (
    <View style={{ width: height, height: height }}>
      {/* Hexagon-clipped background + avatar */}
      <Svg width={height} height={height} viewBox={`0 0 ${height} ${height}`}>
        <Defs>
          <ClipPath id={clipId}>
            <Path d={hexagonPath.path} transform={hexagonTransform(height)} />
          </ClipPath>
        </Defs>
        <G clipPath={`url(#${clipId})`}>
          <Path
            d={hexagonPath.path}
            transform={hexagonTransform(height)}
            fill={backgroundFill}
          />
          {hasValidSource &&
            (isSvgComponent ? (
              // Local SVG component: nest it inside the clipped group. Rendered
              // at the full square so it fills the hexagon, matching the legacy
              // square render exactly.
              React.createElement(source, { width: height, height: height })
            ) : (
              // Raster image clipped via react-native-svg (drops expo-image
              // caching; accepted tradeoff for the Fabric crash fix).
              <SvgImage
                key={`svg-image-${imageKey ?? ''}`}
                href={source}
                x={0}
                y={0}
                width={height}
                height={height}
                preserveAspectRatio="xMidYMid slice"
                onLoad={hasLoading ? handleLoadEnd : undefined}
              />
            ))}
        </G>
      </Svg>

      {/* Loading shimmer (raster only), hexagon-shaped */}
      {isLoading && (
        <LoadingView
          height={height}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        />
      )}

      {/* Selected-state dark overlay (hexagon-shaped) + checkmark */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center'
          },
          selectedAnimatedStyle
        ]}>
        <Svg
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          width={height}
          height={height}
          viewBox={`0 0 ${height} ${height}`}>
          <Path
            d={hexagonPath.path}
            transform={hexagonTransform(height)}
            fill={overlayColor}
          />
        </Svg>
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
    </View>
  )
}

// Places the hexagon path (authored in the 130 x 144 viewBox) inside a square
// `height` x `height` viewport. The legacy MaskedView mask used an <Svg
// viewBox="0 0 130 144"> with the default preserveAspectRatio "xMidYMid meet",
// i.e. the hexagon was scaled UNIFORMLY to fit and centered — NOT stretched to
// fill the width. Replicate that exactly (uniform scale + horizontal center) so
// the clip matches HexagonBorder (which still uses the meet behavior) and
// avatars aren't horizontally widened.
const hexagonTransform = (height: number): string => {
  const scale = height / 144
  const translateX = (height - 130 * scale) / 2
  return `translate(${translateX}, 0) scale(${scale})`
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

const LoadingView = ({
  height,
  style
}: {
  height: number
  style: ViewStyle
}): JSX.Element => {
  const backgroundAnimation = useSharedValue(0)
  const { theme } = useTheme()

  useEffect(() => {
    backgroundAnimation.value = withDelay(
      Math.random() * 1000,
      withRepeat(withTiming(1, { duration: 1000 }), -1, true)
    )
  }, [backgroundAnimation])

  const animatedProps = useAnimatedProps(() => ({
    fill: interpolateColor(
      backgroundAnimation.value,
      [0, 1],
      [theme.colors.$surfacePrimary, theme.colors.$surfaceSecondary]
    )
  }))

  return (
    <Svg
      style={style}
      width={height}
      height={height}
      viewBox={`0 0 ${height} ${height}`}>
      <AnimatedPath
        d={hexagonPath.path}
        transform={hexagonTransform(height)}
        animatedProps={animatedProps}
      />
    </Svg>
  )
}
