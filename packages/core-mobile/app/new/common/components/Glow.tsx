import { wait } from '@avalabs/core-utils-sdk'
import { ANIMATED } from '@avalabs/k2-alpine/src/utils'
import {
  Blur,
  Canvas,
  Circle,
  Group,
  Paint,
  SweepGradient,
  vec
} from '@shopify/react-native-skia'
import React, {
  forwardRef,
  ReactNode,
  useCallback,
  useImperativeHandle
} from 'react'
import { ViewStyle } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'

const START_ROTATION = 0
const END_ROTATION = START_ROTATION + 270
const START_OPACITY = 0
const END_OPACITY = 1
const START_SCALE = 1
const END_SCALE = 0.6

const ANIMATION_CONFIG = {
  ...ANIMATED.TIMING_CONFIG,
  duration: 2000
}

const FADE_IN_CONFIG = {
  ...ANIMATED.TIMING_CONFIG,
  duration: 100
}

const FADE_OUT_CONFIG = {
  ...ANIMATED.TIMING_CONFIG,
  duration: 500
}

export interface GlowRef {
  startAnimation: () => void
}

export const Glow = forwardRef<
  GlowRef,
  { size: number; autoPlay?: boolean; style?: ViewStyle }
>(({ size = 256, autoPlay, style }, ref): ReactNode => {
  const circleSize = size * 0.7

  const rotation = useSharedValue(START_ROTATION)
  const opacity = useSharedValue(START_OPACITY)
  const scale = useSharedValue(START_SCALE)
  const animating = useSharedValue(false)

  useImperativeHandle(ref, () => ({
    startAnimation: () => {
      if (!animating.value) startAnimation()
    }
  }))

  const resetAnimation = useCallback(() => {
    'worklet'
    animating.value = false
    rotation.value = START_ROTATION
    opacity.value = START_OPACITY
    scale.value = START_SCALE
  }, [animating, opacity, rotation, scale])

  const startAnimation = useCallback(async (): Promise<void> => {
    'worklet'
    if (animating.value) {
      resetAnimation()
    }
    animating.value = true
    opacity.value = withTiming(END_OPACITY, FADE_IN_CONFIG)
    rotation.value = withTiming(END_ROTATION, ANIMATION_CONFIG)
    scale.value = withTiming(END_SCALE, ANIMATION_CONFIG)

    await wait(ANIMATION_CONFIG.duration - FADE_OUT_CONFIG.duration)
    opacity.value = withTiming(START_OPACITY, FADE_OUT_CONFIG, () => {
      resetAnimation()
    })
  }, [animating, opacity, resetAnimation, rotation, scale])

  React.useEffect(() => {
    if (autoPlay) startAnimation()
  }, [autoPlay, startAnimation])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        {
          scale: scale.value
        },
        {
          rotate: `${rotation.value}deg`
        }
      ]
    }
  })

  return (
    <Animated.View
      style={[{ width: size, height: size }, style, animatedStyle]}>
      <Canvas style={{ flex: 1 }}>
        <Group
          layer={
            <Paint>
              <Blur blur={50} />
            </Paint>
          }>
          <Circle cx={size / 2} cy={size / 2} r={circleSize / 2}>
            <SweepGradient
              c={vec(size / 2, size / 2)}
              colors={[
                '#B0FF18',
                '#B0FF18',
                '#A1FF68',
                '#26F2FF',
                '#7748FF',
                '#FF048C'
              ]}
              positions={[0.05, 0.08, 0.25, 0.35, 0.5, 0.7]}
            />
          </Circle>
        </Group>
      </Canvas>
    </Animated.View>
  )
})
