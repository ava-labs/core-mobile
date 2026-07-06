import React, { forwardRef, useState } from 'react'
import {
  AccessibilityActionEvent,
  LayoutChangeEvent,
  View as RNView
} from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import { useSharedValue } from 'react-native-reanimated'
import { useTheme } from '../../hooks'
import { colors } from '../../theme/tokens/colors'
import { View } from '../Primitives'
import { BidirectionalTrack } from './BidirectionalTrack'
import {
  THUMB_INSET,
  THUMB_SIZE,
  TRACK_HEIGHT,
  TRACK_RADIUS
} from './constants'
import { computeMaxTravel, normalizeThreshold } from './helpers'
import { SingleTrack } from './SingleTrack'
import type { SlidingButtonProps, ToneColors } from './types'
import { useSlidingCommit } from './useSlidingCommit'
import { useSlidingGesture } from './useSlidingGesture'

// Tone contrasts against the surrounding surface: light UI gets a dark track
// (so the pill reads as a CTA), dark UI gets a light track. We pick the
// opposite of the theme mode, not the same.
const TONE_COLORS: Record<'dark' | 'light', ToneColors> = {
  dark: {
    track: colors.$neutral850,
    thumbBackground: colors.$neutralWhite,
    thumbContent: colors.$neutral850,
    label: colors.$neutralWhite
  },
  light: {
    track: colors.$neutralWhite,
    thumbBackground: colors.$neutral850,
    thumbContent: colors.$neutralWhite,
    label: colors.$neutral850
  }
}

const ACTIVATE_ACTION = 'activate'

export const SlidingButton = forwardRef<RNView, SlidingButtonProps>(
  (props, ref) => {
    const [trackWidth, setTrackWidth] = useState(0)
    const translateX = useSharedValue(0)
    const startX = useSharedValue(0)
    const isSingle = props.mode === 'single'
    const fullMaxTravel = computeMaxTravel({
      trackWidth,
      thumbSize: THUMB_SIZE,
      padding: THUMB_INSET
    })
    // In bidirectional mode the thumb starts at track centre, so each side only
    // gets half of the full travel range. `maxTravel` is the max |translateX|
    // in the current mode.
    const maxTravel = isSingle ? fullMaxTravel : fullMaxTravel / 2
    const threshold = normalizeThreshold(props.threshold)
    const { theme } = useTheme()
    const resolvedTone = theme.isDark ? 'light' : 'dark'
    const toneColors = TONE_COLORS[resolvedTone]

    const { state, handleCommit } = useSlidingCommit(props, translateX)

    const pan = useSlidingGesture({
      isSingle,
      maxTravel,
      threshold,
      disabled: !!props.disabled,
      state,
      translateX,
      startX,
      handleCommit
    })

    const onLayout = (e: LayoutChangeEvent): void => {
      setTrackWidth(e.nativeEvent.layout.width)
    }

    // Screen readers can't perform a pan gesture. Expose explicit activation
    // actions so VoiceOver/TalkBack users can trigger the commit directly.
    const accessibility = buildAccessibility(props, state, handleCommit)

    return (
      <GestureDetector gesture={pan}>
        <View
          ref={ref}
          testID={props.testID}
          {...accessibility}
          style={[
            { height: TRACK_HEIGHT },
            props.disabled ? { opacity: 0.3 } : null,
            props.style
          ]}>
          <View
            onLayout={onLayout}
            style={{
              height: TRACK_HEIGHT,
              borderRadius: TRACK_RADIUS,
              backgroundColor: toneColors.track,
              justifyContent: 'center'
            }}>
            {props.mode === 'single' ? (
              <SingleTrack
                {...props}
                state={state}
                translateX={translateX}
                maxTravel={maxTravel}
                toneColors={toneColors}
                trackWidth={trackWidth}
              />
            ) : (
              <BidirectionalTrack
                {...props}
                state={state}
                translateX={translateX}
                maxTravel={maxTravel}
                toneColors={toneColors}
                trackWidth={trackWidth}
              />
            )}
          </View>
        </View>
      </GestureDetector>
    )
  }
)

const buildAccessibility = (
  props: SlidingButtonProps,
  state: ReturnType<typeof useSlidingCommit>['state'],
  handleCommit: (side: 'left' | 'right') => void
): {
  accessibilityRole: 'button'
  accessibilityLabel: string
  accessibilityHint: string
  accessibilityState: { disabled: boolean; busy: boolean }
  accessibilityActions: { name: string; label?: string }[]
  onAccessibilityAction: (event: AccessibilityActionEvent) => void
} => {
  const disabled = !!props.disabled
  const busy = state === 'confirming'
  // Gate accessibility-driven commits on the same conditions as the gesture —
  // `disabled` and non-idle state. `accessibilityState.disabled` is advisory
  // and screen readers may still forward custom actions; the in-flight ref in
  // `handleCommit` catches the race but surfacing the guard here is clearer.
  const inert = disabled || state !== 'idle'
  if (props.mode === 'single') {
    return {
      accessibilityRole: 'button',
      accessibilityLabel: props.label,
      accessibilityHint: 'Activates to confirm',
      accessibilityState: { disabled, busy },
      accessibilityActions: [{ name: ACTIVATE_ACTION, label: props.label }],
      onAccessibilityAction: event => {
        if (inert) return
        if (event.nativeEvent.actionName === ACTIVATE_ACTION) {
          handleCommit('right')
        }
      }
    }
  }
  return {
    accessibilityRole: 'button',
    accessibilityLabel: `${props.leftLabel} or ${props.rightLabel}`,
    accessibilityHint: `Available actions: ${props.leftLabel}, ${props.rightLabel}`,
    accessibilityState: { disabled, busy },
    accessibilityActions: [
      { name: 'left', label: props.leftLabel },
      { name: 'right', label: props.rightLabel }
    ],
    onAccessibilityAction: event => {
      if (inert) return
      const { actionName } = event.nativeEvent
      if (actionName === 'left') handleCommit('left')
      else if (actionName === 'right') handleCommit('right')
    }
  }
}

SlidingButton.displayName = 'SlidingButton'
