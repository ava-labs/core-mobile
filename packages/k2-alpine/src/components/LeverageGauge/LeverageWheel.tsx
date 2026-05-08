import {
  Canvas,
  Group,
  LinearGradient,
  Rect,
  RoundedRect,
  Text as SkText,
  useFont,
  vec
} from '@shopify/react-native-skia'
import React, { FC, memo, useMemo, useState } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView
} from 'react-native-gesture-handler'
import Animated, {
  cancelAnimation,
  Easing,
  interpolateColor,
  SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withDecay,
  withSpring,
  withTiming
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { useTheme } from '../../hooks'
import {
  alpha,
  fireEdgeHaptic,
  fireSelectionHaptic,
  getStepDecimals
} from '../../utils'
import { View } from '../Primitives'
import { snapToStep } from './helpers'
import { useSkiaCanvasFadeIn } from './useSkiaCanvasFadeIn'

type LeverageWheelProps = {
  currentValue: SharedValue<number>
  isActive: SharedValue<boolean>
  /** True during preset/programmatic animations — suppresses haptics. */
  isProgrammatic: SharedValue<boolean>
  min: number
  max: number
  step: number
  /** When true, only major (integer) ticks animate; sub-steps stay static. */
  integersOnly: boolean
  onChange: (value: number) => void
  onCommit: (value: number) => void
  hapticsEnabled: boolean
  /** Multiplier on finger release velocity — see LeverageGaugeProps. */
  velocityPower: number
  /** Coast-phase deceleration (0 < d < 1) — see LeverageGaugeProps. */
  coastDeceleration: number
  containerStyle?: StyleProp<ViewStyle>
  /**
   * Horizontal inset (px) for the rendered canvas. The gesture-hit area
   * stays full width so edge swipes still register; only the canvas itself
   * is inset by this amount. Default: 0.
   */
  canvasPadding?: number
}

// Sub-ticks always render this far apart on screen — pxPerUnit is derived
// from this so finer steps spread the gauge wider rather than packing
// more sub-ticks into the same width.
const SUB_TICK_PX = 10
const TIER_HEIGHTS = { major: 50, medium: 32, minor: 20 } as const
const TIER_PEAK_SCALES = { major: 1.2, medium: 1.3, minor: 1.4 } as const
const TICK_BASELINE_Y = TIER_HEIGHTS.major * TIER_PEAK_SCALES.major
const TICK_WIDTH = 2
const LABEL_AREA_HEIGHT = 22
const CANVAS_HEIGHT = TICK_BASELINE_Y + LABEL_AREA_HEIGHT
const LABEL_FONT_SIZE = 11
const LABEL_BASELINE_Y = TICK_BASELINE_Y + 20
// Cap on visual tick density: visual ticks never coarser than 0.2 (so
// integersOnly mode keeps its "barometer" look), but match the user's
// `step` when finer (so step=0.1 shows ticks every 0.1).
const VISUAL_TICK_STEP_CAP = 0.2

// Feel-tuning constants — adjust these to change drag/release behaviour.
const RECENT_WINDOW_MS = 60 // age of samplePrev when read at onEnd
const SLOW_DISTANCE_PX = 6 // recentDx below this counts as "held still"
const SETTLE_MIN_MS = 150 // settle duration for an on-tick release
const SETTLE_MAX_MS = 400 // settle duration for a half-step-off release
// Asymptotic cap on rubber-band visual offset (in pixels). The wheel
// smoothly approaches this on hard swipes past min/max — never freezes,
// never scrolls hundreds of pixels off-screen.
const MAX_RUBBER_PX = 80

type TickTier = 'major' | 'medium' | 'minor'

type TickDescriptor = {
  value: number
  x: number
  tier: TickTier
}

const LeverageWheelInner: FC<LeverageWheelProps> = ({
  currentValue,
  isActive,
  isProgrammatic,
  min,
  max,
  step,
  integersOnly,
  onChange,
  onCommit,
  hapticsEnabled,
  velocityPower,
  coastDeceleration,
  containerStyle,
  canvasPadding = 0
}) => {
  const {
    theme: { colors }
  } = useTheme()

  const [wheelWidth, setWheelWidth] = useState(0)
  const gestureStartValue = useSharedValue(0)
  // True only during finger-down drag. Animation `finished` callbacks
  // (settle/decay/spring) bail when this is true so a re-grab interrupting
  // a release doesn't fire a stale commit on top of the new gesture.
  const isDragging = useSharedValue(false)
  // Two-sample tracking so onEnd's recentDx always spans at least one frame —
  // avoiding the race where a fresh single-sample refresh leaves it near zero.
  // samplePrevAt is the time when samplePrevTx was sampled (i.e. matches
  // lastFrameAt at the moment of promotion), not the promotion time itself.
  const lastFrameTx = useSharedValue(0)
  const lastFrameAt = useSharedValue(0)
  const samplePrevTx = useSharedValue(0)
  const samplePrevAt = useSharedValue(0)
  // Latched at rubber-band entry so the "wall hit" haptic fires once, not
  // continuously while the finger sits past the edge.
  const wasOverEdge = useSharedValue(false)

  const labelFont = useFont(
    require('../../assets/fonts/Inter-Medium.ttf'),
    LABEL_FONT_SIZE
  )
  const canvasStyle = useSkiaCanvasFadeIn(!!labelFont && wheelWidth > 0)

  // Visual tick density follows user step but caps at 0.2 so integersOnly
  // (step=1) and coarser steps keep the same "barometer" look. pxPerUnit
  // scales with the tick step so sub-ticks always render SUB_TICK_PX apart
  // — finer steps make the gauge wider, not denser.
  const visualTickStep = Math.min(step, VISUAL_TICK_STEP_CAP)
  const visualTickDecimals = getStepDecimals(visualTickStep)
  const pxPerUnit = SUB_TICK_PX / visualTickStep

  const ticks: TickDescriptor[] = useMemo(() => {
    const out: TickDescriptor[] = []
    if (wheelWidth <= 0) return out
    const centerX = wheelWidth / 2
    // Align ticks to multiples of visualTickStep from 0 (not from min) so
    // integers always land exactly on a tick — otherwise a fractional min
    // pushes every tick off and float drift can promote two adjacent ticks
    // to "major", producing duplicate labels.
    const startTick = Math.ceil(min / visualTickStep) * visualTickStep
    const totalVisualSteps = Math.floor((max - startTick) / visualTickStep)
    const halfStep = visualTickStep / 2
    // Medium tier (taller tick at x.5) only kicks in for steps finer than
    // the cap. At the cap, no tick lands exactly on x.5, and float drift
    // could otherwise let ticks ~0.1 from x.5 falsely qualify.
    const allowMedium = visualTickStep < VISUAL_TICK_STEP_CAP
    for (let i = 0; i <= totalVisualSteps; i++) {
      const value = Number(
        (startTick + i * visualTickStep).toFixed(visualTickDecimals)
      )
      const absoluteX = centerX + (value - min) * pxPerUnit
      const distToInt = Math.abs(value - Math.round(value))
      const distToHalf = Math.abs(value - Math.round(value * 2) / 2)
      const tier: TickTier =
        distToInt < halfStep
          ? 'major'
          : allowMedium && distToHalf < halfStep
          ? 'medium'
          : 'minor'
      out.push({ value, x: absoluteX, tier })
    }
    return out
  }, [wheelWidth, min, max, visualTickStep, visualTickDecimals, pxPerUnit])

  const majorLabels = useMemo(() => {
    if (!labelFont) return []
    return ticks
      .filter(t => t.tier === 'major')
      .map(t => {
        const integer = Math.round(t.value)
        const text = String(integer)
        const textWidth = labelFont.measureText(text).width
        return { value: integer, text, x: t.x - textWidth / 2 }
      })
  }, [ticks, labelFont])

  const lastStepIndex = useSharedValue<number>(
    Math.round((currentValue.value - min) / step)
  )
  const maxStepIndex = Math.round((max - min) / step)

  // Worklet helpers — closure-capture min/max/step/currentValue from above.
  const fireStepHaptic = (stepIndex: number): void => {
    'worklet'
    const atEdge = stepIndex === 0 || stepIndex === maxStepIndex
    if (atEdge) scheduleOnRN(fireEdgeHaptic)
    else scheduleOnRN(fireSelectionHaptic)
  }

  const applyRubberBandTranslation = (next: number): void => {
    'worklet'
    // Rubber-band asymptotes to MAX_RUBBER_PX in pixel space (UIKit-style
    // formula applied with r = MAX_RUBBER_PX). Smoothly approaches the cap
    // — never freezes, regardless of pxPerUnit.
    if (next < min) {
      const overshootPx = (min - next) * pxPerUnit
      const rubberPx =
        (1 - 1 / (overshootPx / MAX_RUBBER_PX + 1)) * MAX_RUBBER_PX
      currentValue.value = min - rubberPx / pxPerUnit
    } else if (next > max) {
      const overshootPx = (next - max) * pxPerUnit
      const rubberPx =
        (1 - 1 / (overshootPx / MAX_RUBBER_PX + 1)) * MAX_RUBBER_PX
      currentValue.value = max + rubberPx / pxPerUnit
    } else {
      currentValue.value = next
    }
  }

  const settleTo = (snapped: number): void => {
    'worklet'
    const distance = Math.abs(snapped - currentValue.value)
    // Already on the snap target — commit synchronously so the user doesn't
    // perceive a 200 ms gap on a held-still on-tick release.
    if (distance === 0) {
      isActive.value = false
      scheduleOnRN(onChange, snapped)
      scheduleOnRN(onCommit, snapped)
      return
    }
    // Distance-scaled duration: in-place releases land snappy, far-from-snap
    // releases keep the confident slow landing. fraction in (0, 1] since max
    // post-snap distance is step/2.
    const fraction = Math.min(1, (distance * 2) / step)
    const duration = SETTLE_MIN_MS + (SETTLE_MAX_MS - SETTLE_MIN_MS) * fraction
    currentValue.value = withTiming(
      snapped,
      { duration, easing: Easing.out(Easing.cubic) },
      finished => {
        if (!finished || isDragging.value) return
        isActive.value = false
        scheduleOnRN(onChange, snapped)
        scheduleOnRN(onCommit, snapped)
      }
    )
  }

  // Rubber-band release: spring back to the clamped edge. Over-damped
  // (ζ ≈ 1.33) so it doesn't overshoot. If the release velocity would push
  // further PAST the edge, we zero it — otherwise the spring's initial
  // momentum reads as "bounce further, then return".
  const releaseFromOverEdge = (valueVelocity: number): void => {
    'worklet'
    const target = currentValue.value < min ? min : max
    const inwardVelocity =
      (target === min && valueVelocity < 0) ||
      (target === max && valueVelocity > 0)
        ? 0
        : valueVelocity
    currentValue.value = withSpring(
      target,
      { velocity: inwardVelocity, damping: 30, stiffness: 160, mass: 0.8 },
      finished => {
        if (!finished || isDragging.value) return
        settleTo(snapToStep(target, min, step))
      }
    )
  }

  const coastWithDecay = (valueVelocity: number): void => {
    'worklet'
    currentValue.value = withDecay(
      {
        velocity: valueVelocity,
        deceleration: coastDeceleration,
        clamp: [min, max],
        rubberBandEffect: false
      },
      finished => {
        if (!finished || isDragging.value) return
        // snapToStep also rounds away float drift (e.g. 2.4000000004 → 2.4).
        const snapped = snapToStep(currentValue.value, min, step)
        settleTo(snapped)
      }
    )
  }

  const panGesture = Gesture.Pan()
    // Cancel any in-flight release animation on touch down — Pan activates
    // after a movement threshold, so without this a tap-to-halt wouldn't
    // fire onStart and the wheel would keep coasting under the finger.
    .onTouchesDown(() => {
      cancelAnimation(currentValue)
      isProgrammatic.value = false
    })
    .onStart(() => {
      isActive.value = true
      isDragging.value = true
      // Clear isProgrammatic in case this gesture is interrupting a preset
      // animation — otherwise haptics stay suppressed for the whole drag.
      isProgrammatic.value = false
      gestureStartValue.value = currentValue.value
      const t0 = Date.now()
      lastFrameTx.value = 0
      lastFrameAt.value = t0
      samplePrevTx.value = 0
      samplePrevAt.value = t0
      wasOverEdge.value = false
    })
    .onUpdate(event => {
      const nowMs = Date.now()
      // Promote: copy lastFrame's (tx, at) to samplePrev so the pair stays
      // consistent — samplePrevAt is the time *when samplePrevTx was sampled*,
      // not the time of promotion.
      if (nowMs - samplePrevAt.value >= RECENT_WINDOW_MS) {
        samplePrevTx.value = lastFrameTx.value
        samplePrevAt.value = lastFrameAt.value
      }
      lastFrameTx.value = event.translationX
      lastFrameAt.value = nowMs
      const next = gestureStartValue.value - event.translationX / pxPerUnit
      const overEdge = next < min || next > max
      if (overEdge && !wasOverEdge.value && hapticsEnabled) {
        scheduleOnRN(fireEdgeHaptic)
      }
      wasOverEdge.value = overEdge
      applyRubberBandTranslation(next)
    })
    .onEnd(event => {
      isDragging.value = false
      // isActive stays true through the release animation so a parent
      // re-render can't trigger useLeverageValue's prop-sync mid-flight.
      // Zero the velocity when recent finger motion was small, and otherwise
      // cap event.velocityX by what we measured ourselves over the recent
      // window — Android's velocityX can leak momentum from earlier in the
      // gesture even after the user slows down, and our measurement is the
      // truthful "what did the finger actually do recently".
      const recentDx = event.translationX - samplePrevTx.value
      const recentDt = Date.now() - samplePrevAt.value
      const measuredVelocityPx = recentDt > 0 ? (recentDx / recentDt) * 1000 : 0
      const platformVelocityPx = event.velocityX
      const finalVelocityPx =
        Math.abs(measuredVelocityPx) < Math.abs(platformVelocityPx)
          ? measuredVelocityPx
          : platformVelocityPx
      const valueVelocity =
        Math.abs(recentDx) < SLOW_DISTANCE_PX
          ? 0
          : (-finalVelocityPx / pxPerUnit) * velocityPower

      if (currentValue.value < min || currentValue.value > max) {
        releaseFromOverEdge(valueVelocity)
        return
      }
      if (valueVelocity === 0) {
        settleTo(snapToStep(currentValue.value, min, step))
        return
      }
      coastWithDecay(valueVelocity)
    })
    // Tap that didn't activate Pan — onStart/onEnd never fire but
    // onTouchesDown already cancelled any animation. Without this fallback,
    // isActive would stay true forever and prop sync would stay blocked.
    .onFinalize((_event, success) => {
      // success=true means onEnd ran and already scheduled a settle.
      if (success || isDragging.value) return
      if (!isActive.value) return
      const snapped = snapToStep(currentValue.value, min, step)
      if (snapped === currentValue.value) {
        isActive.value = false
        scheduleOnRN(onChange, snapped)
        scheduleOnRN(onCommit, snapped)
        return
      }
      // Quick snap on a tap-to-stop — the user's intent was a definitive
      // halt, not another long settle phase.
      currentValue.value = withTiming(
        snapped,
        { duration: 150, easing: Easing.out(Easing.cubic) },
        finished => {
          if (!finished || isDragging.value) return
          isActive.value = false
          scheduleOnRN(onChange, snapped)
          scheduleOnRN(onCommit, snapped)
        }
      )
    })

  // Step-crossing reaction — haptics only. onChange fires on commit
  // (settle/decay/spring/onFinalize), never per-frame during drag: stale
  // queued values would race with onCommit on Android and snap the wheel
  // back. LeverageDisplay reads currentValue (SharedValue) directly for
  // live readout, so dropping per-frame onChange has no visual cost.
  useAnimatedReaction(
    // Clamp the observed step to [0, maxStepIndex]. While the wheel sits in
    // the rubber-band zone past min/max, the clamped index doesn't change, so
    // the reaction stays quiet — no repeat haptics.
    () => {
      const raw = Math.round((currentValue.value - min) / step)
      if (raw < 0) return 0
      if (raw > maxStepIndex) return maxStepIndex
      return raw
    },
    (stepIndex, prevStepIndex) => {
      if (prevStepIndex === null || stepIndex === prevStepIndex) return
      // Haptics fire on user-initiated motion (drag, flick, settle). Typing
      // keeps isActive=false; preset animations set isProgrammatic=true.
      // One haptic per frame max — looping over multi-step crossings flooded
      // the OS vibrator (each new selectionAsync cancels the previous before
      // it can play). Slow motion still feels one-per-step; fast motion
      // degrades gracefully to a continuous tick stream.
      if (
        hapticsEnabled &&
        isActive.value &&
        !isProgrammatic.value &&
        stepIndex !== lastStepIndex.value
      ) {
        lastStepIndex.value = stepIndex
        fireStepHaptic(stepIndex)
      }
    }
  )

  const groupTransform = useDerivedValue(() => {
    const offset = -(currentValue.value - min) * pxPerUnit
    return [{ translateX: offset }]
  })

  const tickColor = alpha(colors.$textPrimary, 0.35)
  const labelColor = alpha(colors.$textPrimary, 0.6)
  const centerX = wheelWidth / 2

  return (
    <GestureHandlerRootView style={{ flexGrow: 1 }}>
      <GestureDetector gesture={panGesture}>
        <View style={containerStyle}>
          <View
            style={{ paddingHorizontal: canvasPadding, overflow: 'hidden' }}>
            <Animated.View
              style={canvasStyle}
              onLayout={e => {
                // Measure the canvas's actual content area (after the
                // horizontal padding) so wheelWidth matches what Canvas
                // renders into. The outer View stays full-width for the
                // gesture-hit area.
                const w = e.nativeEvent.layout.width
                if (w === wheelWidth) return
                setWheelWidth(w)
              }}>
              <Canvas style={{ width: wheelWidth, height: CANVAS_HEIGHT }}>
                <Group transform={groupTransform}>
                  {ticks.map(t => (
                    <TickMark
                      key={`tick-${t.value}`}
                      tick={t}
                      currentValue={currentValue}
                      min={min}
                      max={max}
                      dimColor={tickColor}
                      activeColor={colors.$textPrimary}
                      animatable={!integersOnly || t.tier === 'major'}
                      // In integersOnly mode, the "neighbor" of an integer tick is
                      // the next integer (1 unit away), not the adjacent minor —
                      // so fade over the full integer span for progressive scale.
                      fadeSpan={integersOnly ? 1 : visualTickStep}
                    />
                  ))}
                  {labelFont &&
                    majorLabels.map(l => (
                      <SkText
                        key={`label-${l.value}`}
                        x={l.x + 1}
                        y={LABEL_BASELINE_Y}
                        text={l.text}
                        font={labelFont}
                        color={labelColor}
                      />
                    ))}
                </Group>

                <Rect x={0} y={0} width={centerX} height={CANVAS_HEIGHT}>
                  <LinearGradient
                    start={vec(0, 0)}
                    end={vec(centerX, 0)}
                    colors={[
                      colors.$surfaceSecondary,
                      alpha(colors.$surfaceSecondary, 0)
                    ]}
                  />
                </Rect>

                <Rect x={centerX} y={0} width={centerX} height={CANVAS_HEIGHT}>
                  <LinearGradient
                    start={vec(centerX, 0)}
                    end={vec(wheelWidth, 0)}
                    colors={[
                      alpha(colors.$surfaceSecondary, 0),
                      colors.$surfaceSecondary
                    ]}
                  />
                </Rect>
              </Canvas>
            </Animated.View>
          </View>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  )
}

// Callers MUST pass stable onChange/onCommit refs for the memo to bail out;
// otherwise we reconcile the Skia canvas + every TickMark on every parent
// render — count scales with range/visualTickStep, can be hundreds.
export const LeverageWheel = memo(LeverageWheelInner)

const TickMark: FC<{
  tick: TickDescriptor
  currentValue: SharedValue<number>
  min: number
  max: number
  dimColor: string
  activeColor: string
  /**
   * If false, the tick stays at its base size and dim color regardless of
   * the wheel position — used for sub-step ticks when the gauge is in
   * integersOnly mode.
   */
  animatable: boolean
  /**
   * Distance (in value units) over which fade progresses from 1 (at this
   * tick) down to 0 (neighbor). Should match the spacing of the *animated*
   * neighbor — visualTickStep when sub-ticks animate, 1 in integer-only mode.
   */
  fadeSpan: number
}> = ({
  tick,
  currentValue,
  min,
  max,
  dimColor,
  activeColor,
  animatable,
  fadeSpan
}) => {
  const baseHeight = TIER_HEIGHTS[tick.tier]
  const peakScale = TIER_PEAK_SCALES[tick.tier]

  const fade = useDerivedValue(() => {
    if (!animatable) return 0
    const raw = currentValue.value
    const clamped = raw < min ? min : raw > max ? max : raw
    const dist = Math.abs(tick.value - clamped)
    return Math.max(0, 1 - dist / fadeSpan)
  })
  const color = useDerivedValue(() =>
    interpolateColor(fade.value, [0, 1], [dimColor, activeColor])
  )
  // Group transform scales around bottom-center so we drive size with one
  // animated value instead of four (width/height/x/y) — matters when the
  // wheel renders hundreds of ticks at fine steps.
  const transform = useDerivedValue(() => [
    { scale: 1 + fade.value * (peakScale - 1) }
  ])
  const origin = vec(tick.x, TICK_BASELINE_Y)

  return (
    <Group transform={transform} origin={origin}>
      <RoundedRect
        x={tick.x - TICK_WIDTH / 2}
        y={TICK_BASELINE_Y - baseHeight}
        width={TICK_WIDTH}
        height={baseHeight}
        r={TICK_WIDTH}
        color={color}
      />
    </Group>
  )
}
