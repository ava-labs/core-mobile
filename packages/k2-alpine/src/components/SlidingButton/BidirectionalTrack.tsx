import React, { useEffect } from 'react'
import { ActivityIndicator, StyleSheet } from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { colors } from '../../theme/tokens/colors'
import { Icons } from '../../theme/tokens/Icons'
import { Text, View } from '../Primitives'
import {
  CHEVRON_FADE_DISTANCE,
  DEFAULT_LEFT_FILL_COLOR,
  DEFAULT_RIGHT_FILL_COLOR,
  LOADING_FADE_MS,
  MOVING_LABEL_MIN_SCALE,
  PILL_SHADOW,
  SIDE_LABELS_FADE_AT,
  THUMB_INSET,
  THUMB_SIZE
} from './constants'
import type { BidirectionalProps, TrackProps } from './types'

export const BidirectionalTrack = ({
  leftLabel,
  rightLabel,
  leftColor,
  rightColor,
  leftIcon,
  rightIcon,
  loading,
  state,
  translateX,
  maxTravel,
  toneColors,
  trackWidth
}: TrackProps<BidirectionalProps>): JSX.Element => {
  const leftFillColor =
    state === 'error'
      ? colors.$accentDanger
      : leftColor ?? DEFAULT_LEFT_FILL_COLOR
  const rightFillColor =
    state === 'error'
      ? colors.$accentDanger
      : rightColor ?? DEFAULT_RIGHT_FILL_COLOR

  // Pill geometry in resting position.
  const trackCentre = trackWidth / 2
  const restLeft = trackCentre - THUMB_SIZE / 2
  const restRight = trackCentre + THUMB_SIZE / 2

  // Crossfade progress between the active-side label (0) and spinner (1).
  // Only advances while confirming + caller opted into `loading`.
  const showSpinner = state === 'confirming' && !!loading
  const loadingProgress = useSharedValue(0)
  useEffect(() => {
    loadingProgress.value = withTiming(showSpinner ? 1 : 0, {
      duration: LOADING_FADE_MS
    })
  }, [showSpinner, loadingProgress])

  // The pill acts as both thumb and fill — it grows from a white circle at
  // rest into a coloured pill as the user drags. It only extends in the active
  // direction: on a left swipe the right edge stays pinned to rest, and on a
  // right swipe the left edge stays pinned to rest. Colour interpolates from
  // the thumb's rest background to the active side's fill colour.
  const pillStyle = useAnimatedStyle(() => {
    const t = translateX.value
    const progress = maxTravel > 0 ? Math.min(1, Math.abs(t) / maxTravel) : 0

    const colorProgress = Math.min(1, Math.abs(t) / CHEVRON_FADE_DISTANCE)
    let pillLeft: number
    let pillRight: number
    let backgroundColor: string
    if (t < 0) {
      pillLeft = restLeft + (THUMB_INSET - restLeft) * progress
      pillRight = restRight
      backgroundColor = interpolateColor(
        colorProgress,
        [0, 1],
        [toneColors.thumbBackground, leftFillColor]
      )
    } else if (t > 0) {
      pillLeft = restLeft
      pillRight = restRight + (trackWidth - THUMB_INSET - restRight) * progress
      backgroundColor = interpolateColor(
        colorProgress,
        [0, 1],
        [toneColors.thumbBackground, rightFillColor]
      )
    } else {
      pillLeft = restLeft
      pillRight = restRight
      backgroundColor = toneColors.thumbBackground
    }

    return {
      left: pillLeft,
      width: Math.max(THUMB_SIZE, pillRight - pillLeft),
      backgroundColor
    }
  })

  // Chevrons inside the pill at rest fade out as the user commits; the
  // active-side label+icon fade in to replace them.
  // Chevrons disappear quickly — they're a cue to start sliding, not a progress
  // indicator. Fade out over the first few pixels of motion.
  const restContentOpacity = useAnimatedStyle(() => {
    return {
      opacity:
        1 - Math.min(1, Math.abs(translateX.value) / CHEVRON_FADE_DISTANCE)
    }
  })

  // Active-side labels live in a container that tracks the pill's live
  // geometry (left + width). Overflow is hidden with the pill's radius so the
  // label gets clipped to the coloured pill as it grows — never bleeds out
  // onto the track. The inner view scales 0.8 → 1 as the user commits.
  const leftContainerStyle = useAnimatedStyle(() => {
    if (maxTravel <= 0) return { left: restLeft, width: THUMB_SIZE, opacity: 0 }
    const distance = Math.max(0, -translateX.value)
    const progress = Math.min(1, distance / maxTravel)
    const pillLeft = restLeft + (THUMB_INSET - restLeft) * progress
    const fadeRange = Math.max(
      1,
      maxTravel * SIDE_LABELS_FADE_AT - CHEVRON_FADE_DISTANCE
    )
    const opacity = Math.min(
      1,
      Math.max(0, (distance - CHEVRON_FADE_DISTANCE) / fadeRange)
    )
    return {
      left: pillLeft,
      width: Math.max(THUMB_SIZE, restRight - pillLeft),
      opacity
    }
  })

  const leftInnerStyle = useAnimatedStyle(() => {
    const opacity = 1 - loadingProgress.value
    if (maxTravel <= 0)
      return {
        transform: [{ scale: MOVING_LABEL_MIN_SCALE }],
        opacity
      }
    const progress = Math.min(1, Math.max(0, -translateX.value) / maxTravel)
    return {
      transform: [
        {
          scale:
            MOVING_LABEL_MIN_SCALE + (1 - MOVING_LABEL_MIN_SCALE) * progress
        }
      ],
      opacity
    }
  })

  const rightContainerStyle = useAnimatedStyle(() => {
    if (maxTravel <= 0) return { left: restLeft, width: THUMB_SIZE, opacity: 0 }
    const distance = Math.max(0, translateX.value)
    const progress = Math.min(1, distance / maxTravel)
    const pillRight =
      restRight + (trackWidth - THUMB_INSET - restRight) * progress
    const fadeRange = Math.max(
      1,
      maxTravel * SIDE_LABELS_FADE_AT - CHEVRON_FADE_DISTANCE
    )
    const opacity = Math.min(
      1,
      Math.max(0, (distance - CHEVRON_FADE_DISTANCE) / fadeRange)
    )
    return {
      left: restLeft,
      width: Math.max(THUMB_SIZE, pillRight - restLeft),
      opacity
    }
  })

  const rightInnerStyle = useAnimatedStyle(() => {
    const opacity = 1 - loadingProgress.value
    if (maxTravel <= 0)
      return {
        transform: [{ scale: MOVING_LABEL_MIN_SCALE }],
        opacity
      }
    const progress = Math.min(1, Math.max(0, translateX.value) / maxTravel)
    return {
      transform: [
        {
          scale:
            MOVING_LABEL_MIN_SCALE + (1 - MOVING_LABEL_MIN_SCALE) * progress
        }
      ],
      opacity
    }
  })

  const spinnerStyle = useAnimatedStyle(() => ({
    opacity: loadingProgress.value
  }))

  // Track-edge labels fade as the pill overtakes them.
  const sideLabelsOpacity = useAnimatedStyle(() => {
    if (maxTravel <= 0) return { opacity: 1 }
    const fadeDistance = maxTravel * SIDE_LABELS_FADE_AT
    return {
      opacity: 1 - Math.min(1, Math.abs(translateX.value) / fadeDistance)
    }
  })

  const pillContentColor = colors.$neutralWhite

  return (
    <>
      {/* Track-edge side labels — fade out as the pill grows over them */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 32
          },
          sideLabelsOpacity
        ]}
        pointerEvents="none">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {leftIcon ? leftIcon(leftFillColor) : null}
          <Text variant="heading3" style={{ color: toneColors.label }}>
            {leftLabel}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text variant="heading3" style={{ color: toneColors.label }}>
            {rightLabel}
          </Text>
          {rightIcon ? rightIcon(rightFillColor) : null}
        </View>
      </Animated.View>

      {/* The pill — thumb at rest, coloured fill as the user commits */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: THUMB_INSET,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            alignItems: 'center',
            justifyContent: 'center',
            ...PILL_SHADOW
          },
          pillStyle
        ]}
        pointerEvents="none">
        {/* Rest content: unfold chevrons */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { alignItems: 'center', justifyContent: 'center' },
            restContentOpacity
          ]}
          pointerEvents="none">
          <Icons.Navigation.Unfold
            width={36}
            height={36}
            color={toneColors.thumbContent}
          />
        </Animated.View>
      </Animated.View>

      {/* Active-side labels — container tracks the pill's live geometry and
          clips its contents to the pill shape via overflow + border radius,
          so the label never bleeds past the coloured pill. The label fades
          out and a spinner fades in at the same centre position while the
          caller reports `loading`. */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: THUMB_INSET,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center'
          },
          leftContainerStyle
        ]}
        pointerEvents="none">
        <Animated.View
          style={[
            { flexDirection: 'row', alignItems: 'center', gap: 8 },
            leftInnerStyle
          ]}>
          {leftIcon ? leftIcon(pillContentColor) : null}
          <Text variant="heading3" style={{ color: pillContentColor }}>
            {leftLabel}
          </Text>
        </Animated.View>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { alignItems: 'center', justifyContent: 'center' },
            spinnerStyle
          ]}
          pointerEvents="none">
          <ActivityIndicator size="small" color={pillContentColor} />
        </Animated.View>
      </Animated.View>

      <Animated.View
        style={[
          {
            position: 'absolute',
            top: THUMB_INSET,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center'
          },
          rightContainerStyle
        ]}
        pointerEvents="none">
        <Animated.View
          style={[
            { flexDirection: 'row', alignItems: 'center', gap: 8 },
            rightInnerStyle
          ]}>
          <Text variant="heading3" style={{ color: pillContentColor }}>
            {rightLabel}
          </Text>
          {rightIcon ? rightIcon(pillContentColor) : null}
        </Animated.View>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { alignItems: 'center', justifyContent: 'center' },
            spinnerStyle
          ]}
          pointerEvents="none">
          <ActivityIndicator size="small" color={pillContentColor} />
        </Animated.View>
      </Animated.View>
    </>
  )
}
