import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import React, { FC, useCallback, useEffect, useMemo, useRef } from 'react'
import { Gesture } from 'react-native-gesture-handler'
import {
  Easing,
  useAnimatedReaction,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { useTheme } from '../../hooks'
import { Text, View } from '../Primitives'
import { DialArc, ARC_RADIUS } from './DialArc'
import { DialPresets } from './DialPresets'
import { DialReadout, DialReadoutHandle } from './DialReadout'
import { clamp, getStepDecimals, snapToStep, validateRange } from './helpers'
import { useDialValue } from './useDialValue'
import type { CircularDialProps, PresetButton } from './types'

const DEFAULT_PRESETS: PresetButton[] = [
  { label: '25%', fraction: 0.25 },
  { label: '50%', fraction: 0.5 },
  { label: 'Max', fraction: 1 }
]
const noop = (): void => undefined

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
  containerStyle
}) => {
  const {
    theme: { colors }
  } = useTheme()

  // Refs so downstream sub-components bail on re-renders even when
  // consumers pass fresh callbacks every render.
  const onChangeRef = useRef(onChange)
  const onCommitRef = useRef(onCommit)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])
  useEffect(() => {
    onCommitRef.current = onCommit
  }, [onCommit])
  const stableOnChange = useCallback((v: number) => onChangeRef.current(v), [])
  const stableOnCommit = useCallback((v: number) => onCommitRef.current(v), [])

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

  // Public `min` doubles as the reference-tick value when > 0; below
  // that, values are invalid (danger colour + tick on the track). Out
  // of range → drop the tick and warn so consumers get a clear signal
  // (matches `validateRange`'s style).
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

  // Progress-space position of the reference tick, or `null` when no
  // valid reference is set. Used by the threshold-crossing haptic
  // below so the user feels a beat each time the dial crosses min.
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

  // Lets quick taps recognise first as a tap (below `maxDistance`)
  // before promoting to a pan.
  const TAP_SLOP = 10

  const readoutRef = useRef<DialReadoutHandle>(null)

  const panGesture = Gesture.Pan()
    .activeOffsetX([-TAP_SLOP, TAP_SLOP])
    .failOffsetY([-TAP_SLOP, TAP_SLOP])
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

  const combinedGesture = Gesture.Race(tapGesture, panGesture)

  // Emit onChange on every step crossing while the dial is active
  // (drag or preset). Drives the displayed text via the parent's
  // controlled `value` — readout text re-renders each step.
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
      else scheduleOnRN(fireMinorHaptic)
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
      <View style={{ alignSelf: 'stretch' }} testID={testID}>
        <View
          style={{
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            height: 240,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.$surfaceSecondary
          }}>
          <Text style={{ color: colors.$textSecondary }}>
            Invalid dial range
          </Text>
        </View>
      </View>
    )
  }

  return (
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
          position: 'relative',
          alignSelf: 'stretch',
          alignItems: 'center'
        }}>
        <DialArc
          gesture={combinedGesture}
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
      <DialPresets
        presets={presets}
        progressSv={progressSv}
        max={vMax}
        step={vStep}
        onPresetPress={handlePresetPress}
        testIDPrefix={testID}
      />
    </View>
  )
}

const fireMinorHaptic = (): void => {
  impactAsync(ImpactFeedbackStyle.Light).catch(() => undefined)
}
const fireMajorHaptic = (): void => {
  impactAsync(ImpactFeedbackStyle.Medium).catch(() => undefined)
}
const fireEdgeHaptic = (): void => {
  impactAsync(ImpactFeedbackStyle.Heavy).catch(() => undefined)
}
