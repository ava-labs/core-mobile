import React, { useEffect } from 'react'
import { ActivityIndicator, StyleSheet } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { Text } from '../Primitives'
import { Icons } from '../../theme/tokens/Icons'
import { colors } from '../../theme/tokens/colors'
import {
  CHEVRON_FADE_DISTANCE,
  LOADING_FADE_MS,
  PILL_SHADOW,
  THUMB_INSET,
  THUMB_SIZE
} from './constants'
import type { SingleProps, TrackProps } from './types'

export const SingleTrack = ({
  label,
  color,
  loading,
  state,
  translateX,
  toneColors,
  trackWidth
}: TrackProps<SingleProps>): JSX.Element => {
  const pillBackgroundColor =
    state === 'error'
      ? colors.$accentDanger
      : color ?? toneColors.thumbBackground

  // Pill grows rightward from the thumb's rest position as the user drags.
  const pillStyle = useAnimatedStyle(() => {
    const t = Math.max(0, translateX.value)
    return { width: t + THUMB_SIZE }
  })

  // Separate clip container matches the pill's geometry so the inverse-colour
  // label inside gets clipped to the pill shape.
  const pillClipStyle = useAnimatedStyle(() => {
    return { width: Math.max(0, translateX.value) + THUMB_SIZE }
  })

  // Chevron fades out as the pill takes over — no translation, the icon
  // stays anchored to the rest-thumb position.
  const restContentStyle = useAnimatedStyle(() => {
    const t = Math.max(0, translateX.value)
    return {
      opacity: 1 - Math.min(1, t / CHEVRON_FADE_DISTANCE)
    }
  })

  const pillContentColor = toneColors.thumbContent

  // Crossfade progress between the committed label (0) and spinner (1). Only
  // advances while confirming + caller opted into `loading`. Mirrors the
  // bidirectional track's behaviour so single-mode spinners feel the same.
  const showSpinner = state === 'confirming' && !!loading
  const loadingProgress = useSharedValue(0)
  useEffect(() => {
    loadingProgress.value = withTiming(showSpinner ? 1 : 0, {
      duration: LOADING_FADE_MS
    })
  }, [showSpinner, loadingProgress])

  const labelsOpacity = useAnimatedStyle(() => ({
    opacity: 1 - loadingProgress.value
  }))
  const spinnerStyle = useAnimatedStyle(() => ({
    opacity: loadingProgress.value
  }))

  return (
    <>
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center'
          },
          labelsOpacity
        ]}
        pointerEvents="none">
        <Text variant="buttonMedium" style={{ color: toneColors.label }}>
          {label}
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          {
            position: 'absolute',
            left: THUMB_INSET,
            top: THUMB_INSET,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            backgroundColor: pillBackgroundColor,
            ...PILL_SHADOW
          },
          pillStyle
        ]}
        pointerEvents="none"
      />

      <Animated.View
        style={[
          {
            position: 'absolute',
            left: THUMB_INSET,
            top: THUMB_INSET,
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            alignItems: 'center',
            justifyContent: 'center'
          },
          restContentStyle
        ]}
        pointerEvents="none">
        <Icons.Navigation.ArrowForwardIOS
          width={24}
          height={24}
          color={pillContentColor}
        />
      </Animated.View>

      {/* Inverse-colour label clipped to the pill shape. Positioned as a
          sibling of the pill (same geometry, overflow: hidden) with a
          track-wide inner view so the label lines up with the base label
          underneath — only the portion inside the pill is visible. The
          spinner is rendered inside the same clip container so it fades in
          at the pill's centre as the label fades out. */}
      {trackWidth > 0 ? (
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: THUMB_INSET,
              top: THUMB_INSET,
              height: THUMB_SIZE,
              borderRadius: THUMB_SIZE / 2,
              overflow: 'hidden'
            },
            pillClipStyle
          ]}
          pointerEvents="none">
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: -THUMB_INSET,
                top: 0,
                width: trackWidth,
                height: THUMB_SIZE,
                alignItems: 'center',
                justifyContent: 'center'
              },
              labelsOpacity
            ]}>
            <Text variant="buttonMedium" style={{ color: pillContentColor }}>
              {label}
            </Text>
          </Animated.View>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { alignItems: 'center', justifyContent: 'center' },
              spinnerStyle
            ]}>
            <ActivityIndicator size="small" color={pillContentColor} />
          </Animated.View>
        </Animated.View>
      ) : null}
    </>
  )
}
