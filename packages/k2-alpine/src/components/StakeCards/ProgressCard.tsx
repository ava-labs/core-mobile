import React, { useEffect, useMemo, useRef } from 'react'
import Animated, {
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'
import { Platform } from 'react-native'
import { View } from '../Primitives'
import { Motion, useTheme } from '../../hooks'
import { BaseCard, DEFAULT_CARD_WIDTH, getCardHeight } from './BaseCard'
import { Label } from './Label'

export const ProgressCard = ({
  progress,
  title,
  width = DEFAULT_CARD_WIDTH,
  motion,
  onPress
}: ProgressCardProps): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const height = getCardHeight(width)
  const lastUpdateTime = useRef(Date.now())
  const waveWidth = useMemo(() => width * 2, [width])
  const baseHeight = height * (1 - progress)
  const amplitude = useSharedValue(0)
  const phase = useSharedValue(0)
  const phaseConstant = useMemo(() => Math.random() * 0.4 + 0.8, []) // randomize phase a bit, from 0.8 to 1.2
  const rotation = useSharedValue(motion?.rotation.value.roll ?? 0)

  const rotationStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateZ: `${-rotation.value * 0.5}rad` }]
    }
  })
  const fillColor = colors.$borderPrimary

  // create path based on amplitude and phase
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

  useAnimatedReaction(
    () => motion?.rotation.value.roll ?? 0,
    (currentRoll, previousRoll) => {
      const currentRollWeight = 0.1
      const result =
        (currentRoll * currentRollWeight +
          (previousRoll ?? 0) * (1 - currentRollWeight)) /
        2

      const diff = currentRoll - (previousRoll ?? 0)
      if (
        Math.abs(diff) < ROTATION_DIFF_THRESHOLD &&
        Math.abs(result) < ROTATION_VALUE_THRESHOLD
      ) {
        rotation.value = result
      }
    }
  )

  // update amplitude based on motion
  useDerivedValue(() => {
    if (!motion) return

    const { x, y, z } = motion.accelerometer.value
    const accMagnitude = Math.sqrt(x ** 2 + y ** 2 + z ** 2)
    if (accMagnitude > ACCELERATION_MAGNITUDE_THRESHOLD) {
      amplitude.value = withTiming(accMagnitude * AMPLITUDE_MULTIPLIER, {
        duration: 300
      })
      lastUpdateTime.current = Date.now()
    }
  }, [motion])

  // reset amplitude if no motion detected for 1 second
  useEffect(() => {
    if (motion) {
      const interval = setInterval(() => {
        const now = Date.now()
        if (now - lastUpdateTime.current > 1000) {
          amplitude.value = withSpring(0, { duration: 15000 })
        }
      }, 1000)
      return () => clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motion])

  // update phase when motion is available
  useEffect(() => {
    let animationFrameId: number

    const updatePhase = (): void => {
      if (motion) {
        phase.value =
          ((phase.value + 0.1 * phaseConstant) % (2 * Math.PI)) *
          PHASE_MULTIPLIER
      }
      animationFrameId = requestAnimationFrame(updatePhase)
    }

    animationFrameId = requestAnimationFrame(updatePhase)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseConstant, motion])

  return (
    <BaseCard
      onPress={onPress}
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
      <Label>{title}</Label>
    </BaseCard>
  )
}

export type ProgressCardProps = {
  progress: number
  title: string
  width?: number
  motion?: Motion
  onPress?: () => void
}

const AnimatedPath = Animated.createAnimatedComponent(Path)

const PHASE_MULTIPLIER = Platform.OS === 'ios' ? 1 : 1.1
const ACCELERATION_MAGNITUDE_THRESHOLD = Platform.OS === 'ios' ? 10.5 : 2
const AMPLITUDE_MULTIPLIER = Platform.OS === 'ios' ? 1 : 2
const ROTATION_DIFF_THRESHOLD = 0.1
const ROTATION_VALUE_THRESHOLD = 1
