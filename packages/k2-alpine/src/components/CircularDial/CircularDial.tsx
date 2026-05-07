import React, { FC, useCallback, useMemo, useRef } from 'react'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import {
  Easing,
  useAnimatedReaction,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { useStableCallbacks, useTheme } from '../../hooks'
import {
  clamp,
  fireEdgeHaptic,
  fireMajorHaptic,
  fireSelectionHaptic,
  getStepDecimals
} from '../../utils'
import { Text, View } from '../Primitives'
import { ARC_RADIUS, CANVAS_HEIGHT, CANVAS_WIDTH, DialArc } from './DialArc'
import { DialPresets } from './DialPresets'
import { DialReadout, DialReadoutHandle } from './DialReadout'
import { snapToStep, validateRange } from './helpers'
import { useDialValue } from './useDialValue'
import type { CircularDialProps, PresetButton } from './types'

const DEFAULT_PRESETS: PresetButton[] = [
  { label: '25%', fraction: 0.25 },
  { label: '50%', fraction: 0.5 },
  { label: 'Max', fraction: 1 }
]
const noop = (): void => undefined

// Half-angle (degrees) of the activation wedge measured from the
// horizontal axis. A swipe within this many degrees of horizontal
// activates the dial; anything more vertical falls through to the
// parent scroll. 70° matches the eager horizontal bias of Apple's
// Camera zoom dial — the user has to swipe nearly straight up/down
// to escape the dial.
const ACTIVATION_HALF_ANGLE_DEG = 70
const ACTIVATION_TAN = Math.tan((ACTIVATION_HALF_ANGLE_DEG * Math.PI) / 180)

export const CircularDial: FC<CircularDialProps> = ({
  value,
  onChange,
  // The track always spans 0..max. `min` is the threshold below which
  // values flip to the danger colour and a reference tick is rendered.
  min: minThreshold = 0,
  max,
  step,
  decimals,
  maxDecimals,
  label,
  placeholder,
  caption,
  presets = DEFAULT_PRESETS,
  enableManualInput = false,
  onCommit = noop,
  hapticsEnabled = true,
  testID,
  containerStyle,
  canvasPadding = 0
}) => {
  const {
    theme: { colors }
  } = useTheme()

  const { stablePrimary: stableOnChange, stableSecondary: stableOnCommit } =
    useStableCallbacks(onChange, onCommit)

  const effectiveStep = useMemo(() => {
    if (typeof step === 'number') return step
    return Math.max(0.1, max / 1000)
  }, [step, max])

  const {
    max: vMax,
    step: vStep,
    isValid
  } = useMemo(
    () => validateRange({ max, step: effectiveStep }),
    [max, effectiveStep]
  )

  // Public `min` doubles as the reference-tick value when > 0. Below it,
  // values are flagged as invalid; out-of-range thresholds are dropped with
  // a console warning (matches validateRange's style).
  const referenceValue = useMemo(() => {
    if (minThreshold < 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `[CircularDial] min (${minThreshold}) must be ≥ 0. Ignoring threshold.`
      )
      return undefined
    }
    if (minThreshold === 0) return undefined
    if (minThreshold > vMax) {
      // eslint-disable-next-line no-console
      console.warn(
        `[CircularDial] min (${minThreshold}) must be ≤ max (${vMax}). Ignoring threshold.`
      )
      return undefined
    }
    return minThreshold
  }, [minThreshold, vMax])

  // Progress-space position of the reference tick (or null if unset). Read
  // by the threshold-crossing haptic below.
  const referenceTickProgress = useMemo(() => {
    if (referenceValue === undefined) return null
    return referenceValue / vMax
  }, [referenceValue, vMax])

  // Floor (not round) so stepIdx * vStep can never exceed vMax — e.g.
  // vMax=7, vStep=2 → 3 steps, not 4 (which would land on 8).
  const stepCount = useMemo(
    () => Math.max(1, Math.floor(vMax / vStep)),
    [vMax, vStep]
  )

  const vDecimals = useMemo(() => {
    if (typeof decimals === 'number') return Math.max(0, Math.floor(decimals))
    return getStepDecimals(vStep)
  }, [decimals, vStep])

  const presetBuckets = useMemo(
    () => presets.map(p => Math.round(clamp(p.fraction, 0, 1) * 100)),
    [presets]
  )

  const { progressSv, isActive } = useDialValue({
    value,
    max: vMax,
    step: vStep
  })
  const isDragging = useSharedValue(false)

  // Track translation deltas from this anchor so tapping anywhere
  // doesn't snap the knob — the knob only moves with finger motion
  // after the first touch.
  const gestureStartProgress = useSharedValue(0)

  // First-touch coordinates, captured in onTouchesDown so the
  // direction-based activation logic in onTouchesMove can measure
  // total motion from the touch's true origin.
  const touchStartX = useSharedValue(0)
  const touchStartY = useSharedValue(0)
  // One-shot latch so the direction check only runs once per touch.
  // Without this, onTouchesMove keeps re-evaluating the wedge for the
  // whole gesture — a mid-drag vertical swing would flip the predicate
  // and `manager.fail()` would kill the already-active gesture.
  const hasDecided = useSharedValue(false)

  // Lets quick taps recognise first as a tap (below `maxDistance`)
  // before promoting to a pan.
  const TAP_SLOP = 10

  const readoutRef = useRef<DialReadoutHandle>(null)

  // manualActivation + direction-based commit: once total motion
  // exceeds TAP_SLOP, activate as a pan iff horizontal motion
  // dominates. A predominantly vertical swipe fails the gesture so
  // the parent scroll container can take over the touch. This avoids
  // the failOffsetY threshold race where slight vertical drift killed
  // the gesture before activeOffsetX could fire.
  const panGesture = Gesture.Pan()
    .manualActivation(true)
    .onTouchesDown(event => {
      'worklet'
      const touch = event.allTouches[0]
      if (!touch) return
      touchStartX.value = touch.absoluteX
      touchStartY.value = touch.absoluteY
      hasDecided.value = false
    })
    .onTouchesMove((event, manager) => {
      'worklet'
      if (hasDecided.value) return
      const touch = event.allTouches[0]
      if (!touch) return
      const dx = touch.absoluteX - touchStartX.value
      const dy = touch.absoluteY - touchStartY.value
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)
      if (absDx <= TAP_SLOP && absDy <= TAP_SLOP) return
      // Activate when the swipe lies within ACTIVATION_HALF_ANGLE_DEG
      // of horizontal (|dy| < |dx| * tan(angle)); otherwise let the
      // parent scroll claim the touch. Latched so subsequent motion
      // — including a mid-drag direction change — can't unmake the
      // decision.
      hasDecided.value = true
      if (absDy < absDx * ACTIVATION_TAN) {
        manager.activate()
      } else {
        manager.fail()
      }
    })
    .onStart(() => {
      'worklet'
      isActive.value = true
      isDragging.value = true
      gestureStartProgress.value = progressSv.value
    })
    .onUpdate(event => {
      'worklet'
      // 2×ARC_RADIUS pixels of translation = full 0→1 sweep.
      const deltaProgress = event.translationX / (2 * ARC_RADIUS)
      const target = gestureStartProgress.value + deltaProgress
      progressSv.value = target < 0 ? 0 : target > 1 ? 1 : target
    })
    .onEnd(() => {
      'worklet'
      isDragging.value = false
      isActive.value = false
      const raw = progressSv.value * vMax
      const snapped = snapToStep(raw, vStep, vMax)
      progressSv.value = snapped / vMax
      scheduleOnRN(stableOnChange, snapped)
      scheduleOnRN(stableOnCommit, snapped)
    })

  const handleTap = useCallback(() => {
    readoutRef.current?.startEdit()
  }, [])
  const tapGesture = Gesture.Tap()
    .maxDistance(TAP_SLOP)
    .onEnd(() => {
      'worklet'
      scheduleOnRN(handleTap)
    })

  // Emit onChange on every step crossing while the dial is active so the
  // readout text (driven by the parent's controlled `value`) updates live.
  useAnimatedReaction(
    () => {
      const raw = progressSv.value * vMax
      const idx = Math.round(raw / vStep)
      return idx < 0 ? 0 : idx > stepCount ? stepCount : idx
    },
    (stepIdx, prev) => {
      if (prev === null || stepIdx === prev) return
      if (!isActive.value) return
      const snapped = stepIdx * vStep
      scheduleOnRN(stableOnChange, snapped)
    }
  )

  // Haptics at 1% bucket crossings.
  useAnimatedReaction(
    () => Math.round(progressSv.value * 100),
    (bucket, prev) => {
      if (prev === null || bucket === prev) return
      if (!isDragging.value || !hapticsEnabled) return
      const isEnd = bucket === 0 || bucket === 100
      const isPresetCrossing = presetBuckets.indexOf(bucket) >= 0
      if (isEnd) scheduleOnRN(fireEdgeHaptic)
      else if (isPresetCrossing) scheduleOnRN(fireMajorHaptic)
      else scheduleOnRN(fireSelectionHaptic)
    }
  )

  // Fire one major haptic each time the dial crosses the reference
  // tick (above ↔ below `min`), regardless of input method.
  useAnimatedReaction(
    () => {
      if (referenceTickProgress === null) return false
      return progressSv.value < referenceTickProgress
    },
    (isBelow, prev) => {
      if (prev === null || isBelow === prev) return
      if (!hapticsEnabled) return
      scheduleOnRN(fireMajorHaptic)
    },
    [referenceTickProgress, hapticsEnabled]
  )

  const handlePresetPress = useCallback(
    (fraction: number) => {
      if (!Number.isFinite(fraction)) return
      const targetValue = clamp(fraction, 0, 1) * vMax
      const snapped = snapToStep(targetValue, vStep, vMax)
      // Heavy at end stops (0% / 100%), medium on intermediate.
      if (hapticsEnabled) {
        if (fraction <= 0 || fraction >= 1) fireEdgeHaptic()
        else fireMajorHaptic()
      }
      isActive.value = true
      progressSv.value = withTiming(
        snapped / vMax,
        { duration: 300, easing: Easing.out(Easing.cubic) },
        finished => {
          // Bail on cancellation so an interrupting gesture keeps
          // ownership of `isActive`.
          if (!finished) return
          isActive.value = false
          scheduleOnRN(stableOnChange, snapped)
          scheduleOnRN(stableOnCommit, snapped)
        }
      )
    },
    [
      hapticsEnabled,
      isActive,
      progressSv,
      stableOnChange,
      stableOnCommit,
      vMax,
      vStep
    ]
  )

  if (!isValid) {
    return (
      <View style={containerStyle} testID={testID}>
        <Text style={{ color: colors.$textSecondary }}>Invalid dial range</Text>
      </View>
    )
  }

  return (
    // Outer pan covers the canvas-padded wrapper + DialPresets so swipes
    // that start anywhere — including on a preset button or in the
    // canvasPadding zones — promote to a dial drag after the
    // `activeOffsetX` slop. Inner tap is scoped to the canvas-only
    // wrapper so tapping the canvasPadding zones (or a preset) doesn't
    // focus the readout's manual input.
    <GestureDetector gesture={panGesture}>
      <View
        style={[
          {
            alignItems: 'center'
          },
          containerStyle
        ]}
        testID={testID}>
        <View
          style={{
            alignSelf: 'stretch',
            paddingVertical: canvasPadding,
            alignItems: 'center'
          }}>
          <GestureDetector gesture={tapGesture}>
            <View
              style={{
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT
              }}>
              <DialArc
                progressSv={progressSv}
                max={vMax}
                value={value}
                referenceValue={referenceValue}
              />
              <DialReadout
                ref={readoutRef}
                value={value}
                max={vMax}
                decimals={vDecimals}
                maxDecimals={maxDecimals}
                label={label}
                placeholder={placeholder}
                caption={caption}
                enableManualInput={enableManualInput}
                referenceValue={referenceValue}
                progressSv={progressSv}
                isActive={isActive}
                onChange={stableOnChange}
                onCommit={stableOnCommit}
                testIDPrefix={testID}
              />
            </View>
          </GestureDetector>
        </View>
        <DialPresets
          presets={presets}
          progressSv={progressSv}
          max={vMax}
          step={vStep}
          onPresetPress={handlePresetPress}
          testIDPrefix={testID}
          canvasPadding={canvasPadding}
        />
      </View>
    </GestureDetector>
  )
}
