import React, { FC, useEffect, useMemo } from 'react'
import { View } from 'react-native'
import Animated, {
  Easing,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { Text } from '../../Primitives'
import {
  formatLastUpdate,
  formatVolume as defaultFormatVolume
} from './helpers'
import { useActiveIndex } from './hooks'
import { OhlcCandle } from './types'

type Props = {
  candles: OhlcCandle[]
  activeIndex: SharedValue<number | null>
  isActive: SharedValue<boolean>
  x: SharedValue<number>
  width: number
  height: number
  /** When false, the footer stays on "Last update: …" even while pressed. */
  showVolume?: boolean
  /** Locale + currency-aware money formatter. Falls back to compact `$X.XX[B|M|K]`. */
  formatVolume?: (volume: number) => string
}

const VOLUME_WIDTH = 140
const EDGE_PADDING = 8
const FADE_DURATION = 180

export const ChartFooter: FC<Props> = ({
  candles,
  activeIndex,
  isActive,
  x,
  width,
  height,
  showVolume = true,
  formatVolume = defaultFormatVolume
}) => {
  const idx = useActiveIndex(activeIndex)

  const formattedVolumes = useMemo(
    () => candles.map(c => (c.volume != null ? formatVolume(c.volume) : '')),
    [candles, formatVolume]
  )
  const idleText = useMemo(() => {
    const latest = candles[candles.length - 1]
    return latest ? formatLastUpdate(latest.ts) : ''
  }, [candles])

  // Opacity lives in its own SharedValue driven by reactions on `isActive` /
  // `showVolume`, so the per-frame `translateX` in `activeStyle` doesn't
  // restart the `withTiming` opacity animation every crosshair frame.
  const idleOpacity = useSharedValue(1)
  const activeOpacity = useSharedValue(0)
  useAnimatedReaction(
    () => isActive.value,
    active => {
      idleOpacity.value = withTiming(active ? 0 : 1, {
        duration: FADE_DURATION,
        easing: Easing.out(Easing.quad)
      })
      activeOpacity.value = withTiming(showVolume && active ? 1 : 0, {
        duration: FADE_DURATION,
        easing: Easing.out(Easing.quad)
      })
    },
    [showVolume]
  )
  // `useAnimatedReaction` re-registers on dep change but doesn't auto-fire,
  // so push `showVolume` flips through an effect.
  useEffect(() => {
    const active = isActive.value
    activeOpacity.value = withTiming(showVolume && active ? 1 : 0, {
      duration: FADE_DURATION,
      easing: Easing.out(Easing.quad)
    })
  }, [showVolume, isActive, activeOpacity])

  const idleStyle = useAnimatedStyle(() => ({ opacity: idleOpacity.value }))
  const activeStyle = useAnimatedStyle(() => {
    const target = x.value - VOLUME_WIDTH / 2
    const min = EDGE_PADDING
    const max = width - VOLUME_WIDTH - EDGE_PADDING
    const clamped = Math.max(min, Math.min(max, target))
    return {
      opacity: activeOpacity.value,
      transform: [{ translateX: clamped }]
    }
  })

  const activeText = idx !== null ? formattedVolumes[idx] ?? '' : ''

  return (
    <View
      style={{
        height,
        justifyContent: 'center'
      }}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 12,
            left: 16,
            right: 16,
            alignItems: 'center'
          },
          idleStyle
        ]}>
        <Text
          variant="caption"
          sx={{
            fontFamily: 'Inter-Medium',
            color: '$textSecondary',
            textAlign: 'center'
          }}>
          {idleText}
        </Text>
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 12,
            left: 0,
            width: VOLUME_WIDTH,
            alignItems: 'center'
          },
          activeStyle
        ]}>
        <Text
          variant="caption"
          sx={{ fontFamily: 'Inter-SemiBold', textAlign: 'center' }}>
          {activeText}
        </Text>
      </Animated.View>
    </View>
  )
}
