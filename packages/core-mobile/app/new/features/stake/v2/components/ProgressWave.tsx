import { alpha, Motion, useTheme } from '@avalabs/k2-alpine'
import React, { useEffect, useMemo, useRef } from 'react'
import { Platform } from 'react-native'
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

const PHASE_MULTIPLIER = Platform.OS === 'ios' ? 1 : 1.1
const ACCELERATION_MAGNITUDE_THRESHOLD = Platform.OS === 'ios' ? 10.5 : 2
const AMPLITUDE_MULTIPLIER = Platform.OS === 'ios' ? 1 : 2
const ROTATION_DIFF_THRESHOLD = 0.1
const ROTATION_VALUE_THRESHOLD = 1
const FRAME_INTERVAL = 33 // ~30fps (1000ms / 30 = 33.33ms)

const AnimatedPath = Animated.createAnimatedComponent(Path)

export type ProgressWaveProps = {
  /** Card content width in px. */
  width: number
  /** Card content height in px. Pass 0 while still measuring; the wave will stay invisible. */
  height: number
  /** 0..1 — how full the wave should be (0 = empty, 1 = full). */
  progress: number
  /** Optional accelerometer motion driver for natural sway/ripple. */
  motion?: Motion
}

/**
 * Renders the wave-fill background used by the V1 `ProgressCard`, decoupled
 * from the card layout so V2 cards (which have dynamic height) can size it via
 * `onLayout` measurement.
 *
 * Must be placed inside a `position: relative` container with `overflow:
 * hidden` (e.g. a `BaseCard`). It absolutely fills its parent.
 */
export const ProgressWave = ({
  width,
  height,
  progress,
  motion
}: ProgressWaveProps): JSX.Element => {
  const { theme } = useTheme()
  const lastUpdateTime = useRef(Date.now())
  const waveWidth = useMemo(() => width * 2, [width])
  const baseHeight = height * (1 - progress)
  const amplitude = useSharedValue(0)
  const phase = useSharedValue(0)
  // randomize phase a bit, from 0.8 to 1.2
  const phaseConstant = useMemo(() => Math.random() * 0.4 + 0.8, [])
  const rotation = useSharedValue(motion?.rotation.value.roll ?? 0)

  const rotationStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateZ: `${-rotation.value * 0.5}rad` }]
    }
  })
  // Matches Figma's exported wave (`fill-opacity="0.05"` over $textPrimary).
  // Adapts to theme: rgba(40,40,46,0.05) in light, rgba(255,255,255,0.05) in dark.
  const fillColor = alpha(theme.colors.$textPrimary, 0.05)

  // create path based on amplitude and phase
  const animatedProps = useAnimatedProps(() => {
    const A = amplitude.value
    const φ = phase.value

    const numberOfPoints = 20
    const step = waveWidth / (numberOfPoints - 1)
    const points: string[] = [`M 0 ${height} L 0 ${baseHeight}`]

    for (let i = 0; i < numberOfPoints; i++) {
      const x = i * step
      const y = baseHeight + A * Math.sin((x / waveWidth) * 2 * Math.PI + φ)
      points.push(`L ${x} ${y}`)
    }

    points.push(`L ${waveWidth} ${height} Z`)

    return { d: points.join(' ') }
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
  // throttled to ~30fps to reduce memory pressure from SVG path string generation
  useEffect(() => {
    if (!motion) return
    let animationFrameId: number
    let lastFrameTime = 0

    const updatePhase = (currentTime: number): void => {
      if (motion && currentTime - lastFrameTime >= FRAME_INTERVAL) {
        phase.value =
          ((phase.value + 0.1 * phaseConstant) % (2 * Math.PI)) *
          PHASE_MULTIPLIER
        lastFrameTime = currentTime
      }
      animationFrameId = requestAnimationFrame(updatePhase)
    }

    animationFrameId = requestAnimationFrame(updatePhase)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseConstant, motion])

  if (height === 0) {
    return <></>
  }

  return (
    <Animated.View
      pointerEvents="none"
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
      <Animated.View style={{ backgroundColor: fillColor, flex: 1 }} />
    </Animated.View>
  )
}
