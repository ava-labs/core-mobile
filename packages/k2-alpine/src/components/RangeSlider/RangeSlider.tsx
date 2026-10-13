import React, { FC, useEffect, useState } from 'react'
import { LayoutChangeEvent, ViewStyle } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import { useTheme } from '../../hooks'
import { alpha } from '../../utils'
import { Text, View } from '../Primitives'

const THUMB_WIDTH = 38
const THUMB_HEIGHT = 24
const TRACK_HEIGHT = 6
const LABEL_HEIGHT = 20
const LABEL_GAP = 8

type RangeSliderProps = {
  min: number
  max: number
  /** Granularity the thumbs snap to. Defaults to 1. */
  step?: number
  /** Lower selected value (controlled). In `single` mode this is the value. */
  low: number
  /** Upper selected value (controlled). Ignored / optional in `single` mode. */
  high?: number
  onChange: (low: number, high: number) => void
  /**
   * Pin the upper thumb (e.g. an "uptime ≥ X" filter where the max stays at
   * 100). Only the lower thumb is draggable when set.
   */
  lockHigh?: boolean
  /**
   * Single-thumb mode: renders one thumb at `low`, fills from the rail's left
   * edge to the thumb (e.g. a "min X" filter). `high` is unused.
   */
  single?: boolean
  /** Formats the value labels rendered above each thumb. */
  formatValue?: (value: number) => string
  style?: ViewStyle
}

/**
 * Slider built on gesture-handler + reanimated (dragging stays on the UI
 * thread). Two modes:
 *
 * - Range (default): two thumbs that can't cross; fill spans between them.
 * - `single`: one thumb; fill spans from the rail's left edge to the thumb.
 *
 * Values snap to `step` on release. Visuals: white pill thumbs with a soft
 * shadow, a dark selected fill, and a value label tracking above each thumb.
 */
export const RangeSlider: FC<RangeSliderProps> = ({
  min,
  max,
  step = 1,
  low,
  high = max,
  onChange,
  lockHigh = false,
  single = false,
  formatValue = String,
  style
}) => {
  const {
    theme: { colors }
  } = useTheme()

  // Guard against a non-positive `step` (it's used as a divisor below, so 0 /
  // negative would yield NaN / Infinity and break snapping).
  const safeStep = step > 0 ? step : 1
  const range = Math.max(1e-9, max - min)
  // Cap the step to the range: a `step` larger than `max - min` would snap
  // every position to `min` (the thumb could never reach `max`), so clamp it
  // so snapping stays well-defined even for very small / degenerate ranges.
  const effectiveStep = Math.min(safeStep, range)
  const stepProgress = effectiveStep / range

  const toProgress = (value: number): number => {
    const p = (value - min) / range
    return Math.min(Math.max(p, 0), 1)
  }
  const toValue = (progress: number): number => {
    const raw = min + progress * range
    // Snap relative to `min` (not the 0-based grid) so the value lands on
    // `min + N*step`. Snapping as `round(raw/step)*step` would misalign when
    // `min` isn't a multiple of `step` (e.g. min=2,step=5 → 7 snaps to 5), and
    // would disagree with the progress snapping in `onEnd`, which is min-based.
    const snapped =
      min + Math.round((raw - min) / effectiveStep) * effectiveStep
    return Math.min(Math.max(snapped, min), max)
  }

  const usableWidth = useSharedValue(0)
  const lowP = useSharedValue(toProgress(low))
  const highP = useSharedValue(toProgress(high))
  const startLowP = useSharedValue(0)
  const startHighP = useSharedValue(0)
  const isDragging = useSharedValue(false)
  // Measured label widths so each label can center over its thumb (and clamp
  // within the track) without a fixed width that would truncate long values.
  const lowLabelW = useSharedValue(0)
  const highLabelW = useSharedValue(0)

  const [displayLow, setDisplayLow] = useState(low)
  const [displayHigh, setDisplayHigh] = useState(high)

  // Sync external value changes (e.g. Reset) into the thumbs, but never while
  // the user is dragging — that would fight the gesture. Also re-runs when
  // `min`/`max` change (bounds are often derived from fetched data), since
  // the value→progress mapping shifts with them even if `low`/`high` don't.
  useEffect(() => {
    if (isDragging.value) return
    lowP.value = toProgress(low)
    highP.value = toProgress(high)
    setDisplayLow(low)
    setDisplayHigh(high)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [low, high, min, max])

  // Live label update during a drag: touches only this component's state (not
  // the parent), so a complex parent screen doesn't re-render every frame.
  const updateDisplay = (nextLowP: number, nextHighP: number): void => {
    setDisplayLow(toValue(nextLowP))
    setDisplayHigh(toValue(nextHighP))
  }
  // Commit once on release: sync labels and notify the parent via `onChange`.
  const commit = (nextLowP: number, nextHighP: number): void => {
    const lowValue = toValue(nextLowP)
    const highValue = toValue(nextHighP)
    setDisplayLow(lowValue)
    setDisplayHigh(highValue)
    onChange(lowValue, highValue)
  }

  const lowPan = Gesture.Pan()
    .onStart(() => {
      'worklet'
      isDragging.value = true
      startLowP.value = lowP.value
    })
    .onUpdate(event => {
      'worklet'
      if (usableWidth.value <= 0) return
      const delta = event.translationX / usableWidth.value
      lowP.value = Math.min(Math.max(startLowP.value + delta, 0), highP.value)
      runOnJS(updateDisplay)(lowP.value, highP.value)
    })
    .onEnd(() => {
      'worklet'
      // Snap to step.
      lowP.value = Math.min(
        Math.max(Math.round(lowP.value / stepProgress) * stepProgress, 0),
        highP.value
      )
      isDragging.value = false
      runOnJS(commit)(lowP.value, highP.value)
    })
    // Fallback for cancelled/failed gestures (e.g. a parent scroll takes over):
    // `onEnd` may not fire, which would leave `isDragging` stuck true and block
    // the prop→thumb sync effect. `onFinalize` always runs, so finish the snap
    // here when `onEnd` didn't (guarded on `isDragging` so the success path,
    // where `onEnd` already cleared it, doesn't double-commit).
    .onFinalize(() => {
      'worklet'
      if (!isDragging.value) return
      lowP.value = Math.min(
        Math.max(Math.round(lowP.value / stepProgress) * stepProgress, 0),
        highP.value
      )
      isDragging.value = false
      runOnJS(commit)(lowP.value, highP.value)
    })

  const highPan = Gesture.Pan()
    .enabled(!lockHigh)
    .onStart(() => {
      'worklet'
      isDragging.value = true
      startHighP.value = highP.value
    })
    .onUpdate(event => {
      'worklet'
      if (usableWidth.value <= 0) return
      const delta = event.translationX / usableWidth.value
      highP.value = Math.min(Math.max(startHighP.value + delta, lowP.value), 1)
      runOnJS(updateDisplay)(lowP.value, highP.value)
    })
    .onEnd(() => {
      'worklet'
      highP.value = Math.min(
        Math.max(
          Math.round(highP.value / stepProgress) * stepProgress,
          lowP.value
        ),
        1
      )
      isDragging.value = false
      runOnJS(commit)(lowP.value, highP.value)
    })
    // See `lowPan.onFinalize` — same cancellation fallback for the high thumb.
    .onFinalize(() => {
      'worklet'
      if (!isDragging.value) return
      highP.value = Math.min(
        Math.max(
          Math.round(highP.value / stepProgress) * stepProgress,
          lowP.value
        ),
        1
      )
      isDragging.value = false
      runOnJS(commit)(lowP.value, highP.value)
    })

  const onLayout = (e: LayoutChangeEvent): void => {
    usableWidth.value = Math.max(0, e.nativeEvent.layout.width - THUMB_WIDTH)
  }

  const lowTranslateStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: lowP.value * usableWidth.value }]
  }))
  const highTranslateStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: highP.value * usableWidth.value }]
  }))

  // Labels center over their thumb but stay within the track [0, fullWidth]
  // so a wide label near an end doesn't get clipped by the card. Uses the
  // measured label width so the box hugs its content.
  const labelLeft = (progress: number, labelWidth: number): number => {
    'worklet'
    const fullWidth = usableWidth.value + THUMB_WIDTH
    const center = progress * usableWidth.value + THUMB_WIDTH / 2
    const maxLeft = Math.max(0, fullWidth - labelWidth)
    return Math.min(Math.max(center - labelWidth / 2, 0), maxLeft)
  }
  const lowLabelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: labelLeft(lowP.value, lowLabelW.value) }]
  }))
  const highLabelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: labelLeft(highP.value, highLabelW.value) }]
  }))
  // Anchor the fill to the thumb edges so a thumb dragged to an end sits flush
  // with the full-width rail. Range: from the low thumb's left to the high
  // thumb's right. Single: from the rail's left edge to the (only) thumb's
  // right.
  const fillStyle = useAnimatedStyle(() =>
    single
      ? {
          left: 0,
          width: lowP.value * usableWidth.value + THUMB_WIDTH
        }
      : {
          left: lowP.value * usableWidth.value,
          width:
            Math.max(0, (highP.value - lowP.value) * usableWidth.value) +
            THUMB_WIDTH
        }
  )

  const renderThumb = (): JSX.Element => (
    <View
      style={{
        width: THUMB_WIDTH,
        height: THUMB_HEIGHT,
        borderRadius: THUMB_HEIGHT / 2,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 4,
        elevation: 3
      }}
    />
  )

  const renderLabel = (value: number): JSX.Element => (
    <Text
      variant="body1"
      numberOfLines={1}
      sx={{ color: '$textPrimary', fontWeight: '500' }}>
      {formatValue(value)}
    </Text>
  )

  return (
    <View style={style}>
      {/* Value labels tracking above each thumb */}
      <View style={{ height: LABEL_HEIGHT, marginBottom: LABEL_GAP }}>
        <Animated.View
          onLayout={e => {
            lowLabelW.value = e.nativeEvent.layout.width
          }}
          style={[{ position: 'absolute', left: 0 }, lowLabelStyle]}>
          {renderLabel(displayLow)}
        </Animated.View>
        {!single && (
          <Animated.View
            onLayout={e => {
              highLabelW.value = e.nativeEvent.layout.width
            }}
            style={[{ position: 'absolute', left: 0 }, highLabelStyle]}>
            {renderLabel(displayHigh)}
          </Animated.View>
        )}
      </View>

      <View
        onLayout={onLayout}
        style={{ height: THUMB_HEIGHT, justifyContent: 'center' }}>
        {/* Rail — spans the full component width to match the separator. */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: TRACK_HEIGHT,
            borderRadius: 100,
            backgroundColor: alpha(colors.$textPrimary, 0.1)
          }}
        />
        {/* Selected fill */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              height: TRACK_HEIGHT,
              borderRadius: 100,
              backgroundColor: colors.$textPrimary
            },
            fillStyle
          ]}
        />
        {/*
         * Thumbs. In range mode the high thumb is rendered first (below) and
         * the low thumb last (on top) so that when the two overlap the low
         * thumb still wins the touch and stays draggable. When `lockHigh`, the
         * high thumb is non-interactive (`pointerEvents="none"`) so it never
         * intercepts the low thumb's gesture as it reaches the pinned max.
         * `single` mode renders only the low thumb.
         */}
        {!single &&
          (lockHigh ? (
            <Animated.View
              pointerEvents="none"
              style={[{ position: 'absolute', left: 0 }, highTranslateStyle]}>
              {renderThumb()}
            </Animated.View>
          ) : (
            <GestureDetector gesture={highPan}>
              <Animated.View
                style={[{ position: 'absolute', left: 0 }, highTranslateStyle]}>
                {renderThumb()}
              </Animated.View>
            </GestureDetector>
          ))}
        <GestureDetector gesture={lowPan}>
          <Animated.View
            style={[{ position: 'absolute', left: 0 }, lowTranslateStyle]}>
            {renderThumb()}
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  )
}
