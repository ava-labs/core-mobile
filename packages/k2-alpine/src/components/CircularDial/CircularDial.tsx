import React, { FC, useCallback, useEffect, useMemo, useRef } from 'react'
import type { LayoutChangeEvent } from 'react-native'
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
import {
  ARC_CX,
  ARC_CY,
  ARC_RADIUS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DialArc
} from './DialArc'
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
// parent scroll. Horizontal-aware (rather than tangent-aware) so
// vertical scroll always escapes regardless of where on the arc the
// touch starts — once the dial is active, the tangent-aware
// projection in onUpdate handles natural off-axis finger motion.
const ACTIVATION_HALF_ANGLE_DEG = 80
const ACTIVATION_TAN = Math.tan((ACTIVATION_HALF_ANGLE_DEG * Math.PI) / 180)

// Touches that start within this radius of the knob bypass the
// activation wedge entirely — the knob itself is a deliberate
// "grab" target, so any subsequent motion (including pure vertical)
// should drive the dial rather than fall through to scroll. ~3× the
// visible knob (KNOB_RADIUS=11) for a comfortable touch target.
const KNOB_HIT_RADIUS = 32

// Cap on how often the dial emits onChange to the parent during a drag.
// A fast swipe crosses a step every frame; emitting each one floods the
// JS thread faster than the parent can render and builds a backlog that
// drains *after* the finger lifts — making the value keep changing on its
// own. ~80ms (≈12/s) is live enough for a readout/caption yet slow enough
// that the parent keeps up and nothing is left queued to fire post-lift.
const EMIT_THROTTLE_MS = 80

// How long after release to keep blocking prop→progressSv sync, covering
// the last in-flight throttled onChange echo as it drains on the JS thread.
const SETTLE_WINDOW_MS = 250

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
  canvasPadding = 0,
  labelSx
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

  const { progressSv, isActive, isSettling } = useDialValue({
    value,
    max: vMax,
    step: vStep
  })
  const isDragging = useSharedValue(false)

  // UI-thread timestamp of the last throttled onChange emission; gates the
  // step-crossing reaction to EMIT_THROTTLE_MS. Reset on each gesture start.
  const lastEmitMs = useSharedValue(0)
  // Monotonic token so only the most recent settle window clears
  // isSettling — during rapid repeated swipes an older timer must not cut a
  // newer window short.
  const settleToken = useSharedValue(0)

  // Track translation deltas from this anchor so tapping anywhere
  // doesn't snap the knob — the knob only moves with finger motion
  // after the first touch.
  const gestureStartProgress = useSharedValue(0)

  // Vertical weight of the arc tangent at the gesture's starting
  // progress = cos θ where θ = π + p·π. At p=0.5 (top) it's 0 — pure
  // X drives the dial. At p=1 (right edge) it's +1 — down adds
  // forward. At p=0 (left edge) it's −1 — up adds forward. X is
  // always full-strength so horizontal swipes feel uniform across
  // the whole sweep (no "stuck" feeling at the curved ends); Y is
  // weighted so it only contributes where the arc is actually
  // moving vertically.
  const startTangentY = useSharedValue(0)

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

  // Set in onTouchesDown when the touch lands inside the knob's hit
  // disc. Read in onTouchesMove to bypass the activation wedge so a
  // deliberate knob grab drags the dial in any direction, including
  // pure vertical — the parent scroll never claims a knob-grab.
  const startedOnKnob = useSharedValue(false)
  // Outer container width, captured via onLayout. Needed to convert
  // the touch's view-relative x into canvas-relative x (the canvas is
  // horizontally centered inside the outer container).
  const outerWidth = useSharedValue(0)
  const handleOuterLayout = useCallback(
    (e: LayoutChangeEvent) => {
      outerWidth.value = e.nativeEvent.layout.width
    },
    [outerWidth]
  )

  // Lets quick taps recognise first as a tap (below `maxDistance`)
  // before promoting to a pan.
  const TAP_SLOP = 10

  const readoutRef = useRef<DialReadoutHandle>(null)

  // Pending settle-window timer, so rapid repeated swipes cancel the prior
  // one instead of piling up dozens of timeouts that all wake to no-op.
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clears the settling guard once the post-release window elapses. Cancels
  // any in-flight window first; the token check is a belt-and-suspenders
  // against a stale timer reopening prop sync mid-settle and letting an
  // echo through.
  const clearSettlingSoon = useCallback(
    (token: number) => {
      if (settleTimerRef.current !== null) clearTimeout(settleTimerRef.current)
      settleTimerRef.current = setTimeout(() => {
        settleTimerRef.current = null
        if (settleToken.value === token) isSettling.value = false
      }, SETTLE_WINDOW_MS)
    },
    [isSettling, settleToken]
  )

  // Cancel a pending settle timer on unmount so it can't fire ~250ms later
  // and write to shared values after the component is gone (mirrors the rAF
  // cleanup in DialReadout).
  useEffect(
    () => () => {
      if (settleTimerRef.current !== null) clearTimeout(settleTimerRef.current)
    },
    []
  )

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
      // Convert touch from outer-container coords into canvas coords
      // and check whether it landed on the knob. Canvas is
      // horizontally centered inside the outer container and sits
      // below the canvasPadding top inset.
      const ow = outerWidth.value
      if (ow <= 0) {
        startedOnKnob.value = false
        return
      }
      const canvasX = touch.x - (ow - CANVAS_WIDTH) / 2
      const canvasY = touch.y - canvasPadding
      const knobAngle = Math.PI + progressSv.value * Math.PI
      const knobX = ARC_CX + ARC_RADIUS * Math.cos(knobAngle)
      const knobY = ARC_CY + ARC_RADIUS * Math.sin(knobAngle)
      const dxKnob = canvasX - knobX
      const dyKnob = canvasY - knobY
      startedOnKnob.value =
        dxKnob * dxKnob + dyKnob * dyKnob <= KNOB_HIT_RADIUS * KNOB_HIT_RADIUS
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
      hasDecided.value = true
      // Knob grabs claim the gesture for any direction; touches
      // elsewhere on the dial canvas still gate on the horizontal
      // wedge so vertical scroll can escape.
      if (startedOnKnob.value) {
        manager.activate()
        return
      }
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
      // Zero so the first step crossing of this drag emits immediately
      // rather than waiting out a throttle window left over from before.
      lastEmitMs.value = 0
      gestureStartProgress.value = progressSv.value
      const startAngle = Math.PI + progressSv.value * Math.PI
      startTangentY.value = Math.cos(startAngle)
    })
    .onUpdate(event => {
      'worklet'
      // X drives the dial directly (always 100% efficient); Y is
      // weighted by the tangent's vertical component so it
      // contributes only where the arc is moving vertically. 2×
      // ARC_RADIUS pixels of horizontal motion = full 0→1 sweep,
      // matching the slider-like feel users expect.
      const proj = event.translationX + event.translationY * startTangentY.value
      const deltaProgress = proj / (2 * ARC_RADIUS)
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
      // Open a settle window: isActive just flipped false, but the last
      // throttled onChange echo may still be draining on the JS thread and
      // would otherwise be re-synced back into progressSv, jerking the arc.
      isSettling.value = true
      settleToken.value += 1
      scheduleOnRN(clearSettlingSoon, settleToken.value)
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

  // Emit onChange on step crossings while the dial is active so consumers —
  // and parent-derived UI such as the fiat caption — track the value live.
  // (The readout number itself is now driven by progressSv on the UI thread
  // in DialReadout, so it no longer depends on this round-trip.) Throttled
  // on the UI thread to EMIT_THROTTLE_MS via a leading-edge time gate (no
  // trailing timer, so nothing is queued to fire after release); onEnd
  // always emits the final snapped value, so throttled-away crossings are
  // never lost.
  useAnimatedReaction(
    () => {
      const raw = progressSv.value * vMax
      const idx = Math.round(raw / vStep)
      return idx < 0 ? 0 : idx > stepCount ? stepCount : idx
    },
    (stepIdx, prev) => {
      if (prev === null || stepIdx === prev) return
      if (!isActive.value) return
      const now = Date.now()
      if (now - lastEmitMs.value < EMIT_THROTTLE_MS) return
      lastEmitMs.value = now
      scheduleOnRN(stableOnChange, stepIdx * vStep)
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
          // Same post-commit settle window as a drag release, so the
          // preset's own onChange echo can't bounce back into progressSv.
          isSettling.value = true
          settleToken.value += 1
          scheduleOnRN(clearSettlingSoon, settleToken.value)
          scheduleOnRN(stableOnChange, snapped)
          scheduleOnRN(stableOnCommit, snapped)
        }
      )
    },
    [
      clearSettlingSoon,
      isSettling,
      settleToken,
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
        onLayout={handleOuterLayout}
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
                labelSx={labelSx}
                value={value}
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
