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
  min,
  max,
  step,
  decimals,
  maxDecimals,
  label,
  placeholder,
  caption,
  presets = DEFAULT_PRESETS,
  tone = 'success',
  referenceValue,
  enableManualInput = false,
  gestureSensitivity = 1,
  onCommit = noop,
  hapticsEnabled = true,
  testID
}) => {
  const {
    theme: { colors }
  } = useTheme()

  // Stabilize callbacks behind refs so downstream sub-components bail on
  // re-renders even when consumers pass fresh callbacks every render.
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

  // Default step derived from `max` so the dial always offers ~1000
  // stops across the available range, regardless of magnitude:
  //   max 10000 → step 10, max 1000 → step 1, max <100 → step 0.1.
  // Consumer-provided `step` always wins.
  const effectiveStep = useMemo(() => {
    if (typeof step === 'number') return step
    return Math.max(0.1, max / 1000)
  }, [step, max])

  const {
    min: vMin,
    max: vMax,
    step: vStep,
    isValid
  } = useMemo(
    () => validateRange({ min, max, step: effectiveStep }),
    [min, max, effectiveStep]
  )

  const stepCount = useMemo(
    () => Math.max(1, Math.round((vMax - vMin) / vStep)),
    [vMin, vMax, vStep]
  )

  const vDecimals = useMemo(() => {
    if (typeof decimals === 'number') return Math.max(0, Math.floor(decimals))
    return getStepDecimals(vStep)
  }, [decimals, vStep])

  // Precompute haptic/preset buckets in percent [0, 100].
  const presetBuckets = useMemo(
    () => presets.map(p => Math.round(clamp(p.fraction, 0, 1) * 100)),
    [presets]
  )

  const { progressSv, isActive } = useDialValue({
    value,
    min: vMin,
    max: vMax,
    step: vStep
  })
  const isDragging = useSharedValue(false)

  // Progress captured at gesture start — we track translation deltas from
  // here instead of mapping absolute touch to progress, so tapping
  // anywhere doesn't snap the knob. The knob moves only with the
  // finger's motion after first touch.
  const gestureStartProgress = useSharedValue(0)

  // --- Gesture ---

  // Small movement threshold so quick taps don't register as pans; this
  // also lets the tap gesture (below) recognise first for short presses.
  const TAP_SLOP = 10

  // Imperative handle to the readout — lets the gestures open / cancel
  // the TextInput without coupling their state together.
  const readoutRef = useRef<DialReadoutHandle>(null)

  const panGesture = Gesture.Pan()
    .activeOffsetX([-TAP_SLOP, TAP_SLOP])
    .activeOffsetY([-TAP_SLOP, TAP_SLOP])
    .onStart(() => {
      'worklet'
      isActive.value = true
      isDragging.value = true
      gestureStartProgress.value = progressSv.value
    })
    .onUpdate(event => {
      'worklet'
      // Base mapping: 2×ARC_RADIUS pixels covers the full 0→1 sweep.
      // `gestureSensitivity` scales that — values below 1 require a
      // longer swipe for the same change, useful for huge ranges.
      const deltaProgress =
        (event.translationX * gestureSensitivity) / (2 * ARC_RADIUS)
      const target = gestureStartProgress.value + deltaProgress
      progressSv.value = target < 0 ? 0 : target > 1 ? 1 : target
    })
    .onEnd(() => {
      'worklet'
      isDragging.value = false
      isActive.value = false
      const raw = vMin + progressSv.value * (vMax - vMin)
      const snapped = snapToStep(
        raw < vMin ? vMin : raw > vMax ? vMax : raw,
        vMin,
        vStep
      )
      progressSv.value = (snapped - vMin) / (vMax - vMin)
      scheduleOnRN(stableOnChange, snapped)
      scheduleOnRN(stableOnCommit, snapped)
    })

  // Tap → open manual input. Races with pan so a short release without
  // movement opens editing, while any drag past `maxDistance` cancels
  // the tap and hands control to pan.
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

  // --- onChange emission on step crossings while dragging ---

  useAnimatedReaction(
    () => {
      const raw = vMin + progressSv.value * (vMax - vMin)
      const idx = Math.round((raw - vMin) / vStep)
      return idx < 0 ? 0 : idx > stepCount ? stepCount : idx
    },
    (stepIdx, prev) => {
      if (prev === null || stepIdx === prev) return
      if (!isDragging.value) return
      const snapped = vMin + stepIdx * vStep
      scheduleOnRN(stableOnChange, snapped)
    }
  )

  // --- Haptics at 1% bucket crossings ---

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

  // --- Preset press ---

  const handlePresetPress = useCallback(
    (fraction: number) => {
      const targetValue = vMin + clamp(fraction, 0, 1) * (vMax - vMin)
      const snapped = snapToStep(
        targetValue < vMin ? vMin : targetValue > vMax ? vMax : targetValue,
        vMin,
        vStep
      )
      const targetProgress = (snapped - vMin) / (vMax - vMin)
      isActive.value = true
      progressSv.value = withTiming(
        targetProgress,
        { duration: 600, easing: Easing.out(Easing.cubic) },
        finished => {
          // Early-return on cancellation so an interrupting gesture keeps
          // ownership of the active flag.
          if (!finished) return
          isActive.value = false
          scheduleOnRN(stableOnChange, snapped)
          scheduleOnRN(stableOnCommit, snapped)
        }
      )
    },
    [isActive, progressSv, stableOnChange, stableOnCommit, vMin, vMax, vStep]
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
      style={{
        alignSelf: 'stretch',
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        alignItems: 'center',
        backgroundColor: colors.$surfaceSecondary,
        paddingVertical: 30
      }}
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
          min={vMin}
          max={vMax}
          value={value}
          tone={tone}
          referenceValue={referenceValue}
        />
        <DialReadout
          ref={readoutRef}
          value={value}
          min={vMin}
          max={vMax}
          step={vStep}
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
        />
      </View>
      <DialPresets
        presets={presets}
        value={value}
        min={vMin}
        max={vMax}
        step={vStep}
        onPresetPress={handlePresetPress}
      />
    </View>
  )
}

// --- Haptic callbacks (JS-thread) ---

const fireMinorHaptic = (): void => {
  impactAsync(ImpactFeedbackStyle.Light).catch(() => undefined)
}
const fireMajorHaptic = (): void => {
  impactAsync(ImpactFeedbackStyle.Medium).catch(() => undefined)
}
const fireEdgeHaptic = (): void => {
  impactAsync(ImpactFeedbackStyle.Heavy).catch(() => undefined)
}
