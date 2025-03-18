import React, { useEffect, useMemo, useRef } from 'react'
import { SxProp } from 'dripsy'
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated'
import { DeviceMotion } from 'expo-sensors'
import Svg, { Path } from 'react-native-svg'
import { ImageBackground } from 'expo-image'
import { ImageSourcePropType } from 'react-native'
import { Text, View } from '../Primitives'
import { useInversedTheme, useTheme } from '../../hooks'
import { Icons } from '../../theme/tokens/Icons'
import { AnimatedPressable } from '../Animated/AnimatedPressable'
import { Button } from '../Button/Button'

export const ProgressCard = ({
  progress,
  title,
  width = DEFAULT_CARD_WIDTH,
  animated = true
}: ProgressCardProps): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  const phaseConstant = useMemo(() => Math.random() * 0.4 + 0.8, []) // randomize phase a bit

  const amplitude = useSharedValue(0)
  const phase = useSharedValue(0)
  const height = Math.max(width * CARD_SIZE_RATIO, PROGRESS_CARD_MIN_HEIGHT)
  const baseHeight = height * (1 - progress)

  const lastUpdateTime = useRef(Date.now())

  const waveWidth = useMemo(() => width * 2, [width])

  const rotationZ = useSharedValue(0)

  const rotationStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateZ: `${-rotationZ.value * 0.5}rad` }]
    }
  })

  const animatedProps = useAnimatedProps(() => {
    const A = amplitude.value
    const φ = phase.value

    const numberOfPoints = 20
    const step = waveWidth / (numberOfPoints - 1)
    let d = `M 0 ${height} L 0 ${baseHeight}`
    for (let i = 0; i < numberOfPoints; i++) {
      const x = i * step
      const y = baseHeight + A * Math.sin((x / waveWidth) * 2 * Math.PI + φ)
      d += ` L ${x} ${y}`
    }
    d += ` L ${waveWidth} ${height} Z`

    return { d }
  })

  const fillColor = colors.$borderPrimary

  // subscribe to device motion
  useEffect(() => {
    const subscription = DeviceMotion.addListener(motion => {
      if (!animated) return

      const { accelerationIncludingGravity, rotation } = motion

      if (accelerationIncludingGravity) {
        const accMagnitude = Math.sqrt(
          accelerationIncludingGravity.x ** 2 +
            accelerationIncludingGravity.y ** 2 +
            accelerationIncludingGravity.z ** 2
        )

        if (accMagnitude > 10.5) {
          amplitude.value = withTiming(accMagnitude, {
            duration: 300
          })
          lastUpdateTime.current = Date.now()
        }
      }

      rotationZ.value = withTiming(rotation.gamma, { duration: 100 })
    })

    return () => subscription && subscription.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animated])

  // reset amplitude if no motion detected for 1 second
  useEffect(() => {
    if (animated) {
      const interval = setInterval(() => {
        const now = Date.now()
        if (now - lastUpdateTime.current > 1000) {
          amplitude.value = withSpring(0, { duration: 10000 })
        }
      }, 1000)
      return () => clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animated])

  useEffect(() => {
    let animationFrameId: number

    const updatePhase = (): void => {
      if (animated) {
        phase.value = (phase.value + 0.1 * phaseConstant) % (2 * Math.PI)
      }
      animationFrameId = requestAnimationFrame(updatePhase)
    }

    animationFrameId = requestAnimationFrame(updatePhase)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseConstant, animated])

  return (
    <BaseCard
      sx={{
        paddingVertical: 20,
        paddingHorizontal: 18,
        width,
        height
      }}>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: -width / 2,
              right: -width / 2,
              top: 0,
              bottom: -height / 2
            },
            rotationStyle
          ]}>
          <Svg width={waveWidth} height={height}>
            <AnimatedPath animatedProps={animatedProps} fill={fillColor} />
          </Svg>
          <View style={{ backgroundColor: fillColor, flex: 1 }} />
        </Animated.View>
      </View>
      <Text sx={{ fontFamily: 'Aeonik-Bold', fontSize: 24, lineHeight: 22 }}>
        {title}
      </Text>
    </BaseCard>
  )
}

export type ProgressCardProps = {
  progress: number
  title: string
  width?: number
  animated?: boolean
}

export const AddCard = ({
  width = DEFAULT_CARD_WIDTH
}: AddCardProps): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  const height = Math.max(width * CARD_SIZE_RATIO, PROGRESS_CARD_MIN_HEIGHT)

  return (
    <BaseCard
      sx={{ justifyContent: 'center', alignItems: 'center', width, height }}>
      <Icons.Content.Add width={40} height={40} color={colors.$textPrimary} />
    </BaseCard>
  )
}

export type AddCardProps = {
  width?: number
}

export const CompletedCard = ({
  title,
  action,
  width = DEFAULT_CARD_WIDTH,
  backgroundImageSource
}: CompletedCardProps): JSX.Element => {
  const { theme } = useTheme()
  const { theme: inversedTheme } = useInversedTheme({ isDark: theme.isDark })
  const height = Math.max(width * CARD_SIZE_RATIO, PROGRESS_CARD_MIN_HEIGHT)
  const backgroundColor = action ? undefined : theme.colors.$textPrimary

  return (
    <BaseCard
      sx={{
        paddingVertical: 20,
        paddingHorizontal: 18,
        backgroundColor,
        width,
        height
      }}>
      {action && backgroundImageSource && (
        <ImageBackground
          style={{
            position: 'absolute',
            left: -5,
            right: -5,
            top: -5,
            bottom: -5
          }}
          source={backgroundImageSource}
        />
      )}
      <View sx={{ gap: 11, alignItems: 'flex-start' }}>
        <Text
          sx={{
            fontFamily: 'Aeonik-Bold',
            fontSize: 24,
            lineHeight: 22,
            color: inversedTheme.colors.$textPrimary
          }}>
          {title}
        </Text>
        {action && (
          <View onTouchStart={e => e.stopPropagation()}>
            <Button
              type="primary"
              size="small"
              style={{ minWidth: 72 }}
              shouldInverseTheme={true}
              onPress={action.onPress}>
              {action.title}
            </Button>
          </View>
        )}
      </View>
    </BaseCard>
  )
}

export type CompletedCardProps = {
  title: string
  action?: {
    title: string
    onPress: () => void
  }
  width?: number

  backgroundImageSource?: ImageSourcePropType
}

const BaseCard = ({
  onPress,
  sx,
  children
}: {
  onPress?: () => void
  sx?: SxProp
  children: React.ReactNode
}): JSX.Element => {
  const { theme } = useTheme()
  const borderColor = theme.isDark ? '#FFFFFF1A' : '#0000001A'

  return (
    <AnimatedPressable style={{ flex: 1 }} onPress={onPress}>
      <View
        sx={{
          borderRadius: 18,
          borderWidth: 1,
          borderColor,
          backgroundColor: '$surfaceSecondary',
          overflow: 'hidden',
          ...sx
        }}>
        {children}
      </View>
    </AnimatedPressable>
  )
}

const PROGRESS_CARD_MIN_HEIGHT = 210
const DEFAULT_CARD_WIDTH = 200
const CARD_SIZE_RATIO = 5 / 4

const AnimatedPath = Animated.createAnimatedComponent(Path)
