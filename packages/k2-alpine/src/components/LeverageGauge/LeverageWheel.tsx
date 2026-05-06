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
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
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
import { ImpactFeedbackStyle, impactAsync } from 'expo-haptics'
import { useTheme } from '../../hooks'
import { alpha } from '../../utils'
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
}

const PX_PER_UNIT = 50
const MAJOR_TICK_HEIGHT = 50
const MINOR_TICK_HEIGHT = 20
const ACTIVE_SCALE_MAJOR = 1.2
const ACTIVE_SCALE_MINOR = 1.4
const TICK_BASELINE_Y = MAJOR_TICK_HEIGHT * ACTIVE_SCALE_MAJOR
const TICK_WIDTH = 2
const LABEL_AREA_HEIGHT = 22
const CANVAS_HEIGHT = TICK_BASELINE_Y + LABEL_AREA_HEIGHT
const LABEL_FONT_SIZE = 11
const LABEL_BASELINE_Y = TICK_BASELINE_Y + 20
const VISUAL_TICK_STEP = 0.2

// Feel-tuning constants — adjust these to change drag/release behaviour.
const RECENT_WINDOW_MS = 60 // age of samplePrev when read at onEnd
const SLOW_DISTANCE_PX = 6 // recentDx below this counts as "held still"
const RUBBER_COEFF = 0.55 // UIKit-style rubber-band stiffness past edges
const SETTLE_MIN_MS = 200 // settle duration for an on-tick release
const SETTLE_MAX_MS = 900 // settle duration for a half-step-off release

type TickDescriptor = {
  value: number
  x: number
  isMajor: boolean
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
  coastDeceleration
}) => {
  const {
    theme: { colors }
  } = useTheme()

  const labelFont = useFont(
    require('../../assets/fonts/Inter-Medium.ttf'),
    LABEL_FONT_SIZE
  )

  const [wheelWidth, setWheelWidth] = useState(0)

  const canvasStyle = useSkiaCanvasFadeIn(!!labelFont && wheelWidth > 0)

  const ticks: TickDescriptor[] = useMemo(() => {
    const out: TickDescriptor[] = []
    if (wheelWidth <= 0) return out
    const centerX = wheelWidth / 2
    const totalVisualSteps = Math.round((max - min) / VISUAL_TICK_STEP)

    for (let i = 0; i <= totalVisualSteps; i++) {
      const value = min + i * VISUAL_TICK_STEP
      const absoluteX = centerX + (value - min) * PX_PER_UNIT
      const isMajor = Math.abs(value - Math.round(value)) < VISUAL_TICK_STEP / 2
      out.push({ value, x: absoluteX, isMajor })
    }
    return out
  }, [min, max, wheelWidth])

  const majorLabels = useMemo(() => {
    if (!labelFont) return []
    return ticks
      .filter(t => t.isMajor)
      .map(t => {
        const integer = Math.round(t.value)
        const text = String(integer)
        const textWidth = labelFont.measureText(text).width
        return { value: integer, text, x: t.x - textWidth / 2 }
      })
  }, [ticks, labelFont])

  const gestureStartValue = useSharedValue(0)
  // True only during finger-down drag — gates the step-crossing reaction
  // from flooding onChange during decay/settle.
  const isDragging = useSharedValue(false)
  // Two-sample tracking so onEnd's recentDx always spans at least one frame —
  // avoiding the race where a fresh single-sample refresh leaves it near zero.
  const lastFrameTx = useSharedValue(0)
  const samplePrevTx = useSharedValue(0)
  const samplePrevAt = useSharedValue(0)
  // Latched at rubber-band entry so the "wall hit" haptic fires once, not
  // continuously while the finger sits past the edge.
  const wasOverEdge = useSharedValue(false)

  // Worklet helpers — closure-capture min/max/step/currentValue from above.
  const applyRubberBandTranslation = (next: number): void => {
    'worklet'
    if (next < min) {
      const overshoot = min - next
      const range = max - min
      const rubber = (1 - 1 / (overshoot / range + 1)) * range * RUBBER_COEFF
      currentValue.value = min - rubber
    } else if (next > max) {
      const overshoot = next - max
      const range = max - min
      const rubber = (1 - 1 / (overshoot / range + 1)) * range * RUBBER_COEFF
      currentValue.value = max + rubber
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
      lastFrameTx.value = 0
      samplePrevTx.value = 0
      samplePrevAt.value = Date.now()
      wasOverEdge.value = false
    })
    .onUpdate(event => {
      const nowMs = Date.now()
      if (nowMs - samplePrevAt.value >= RECENT_WINDOW_MS) {
        samplePrevTx.value = lastFrameTx.value
        samplePrevAt.value = nowMs
      }
      lastFrameTx.value = event.translationX
      const next = gestureStartValue.value - event.translationX / PX_PER_UNIT
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
      // Zero the velocity when recent finger motion was small to suppress
      // Android's leaked velocity (fast → slow → lift would otherwise slide).
      const recentDx = event.translationX - samplePrevTx.value
      const valueVelocity =
        Math.abs(recentDx) < SLOW_DISTANCE_PX
          ? 0
          : (-event.velocityX / PX_PER_UNIT) * velocityPower

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

  const lastStepIndex = useSharedValue<number>(
    Math.round((currentValue.value - min) / step)
  )

  const maxStepIndex = Math.round((max - min) / step)

  const fireStepHaptic = (stepIndex: number): void => {
    'worklet'
    const atEdge = stepIndex === 0 || stepIndex === maxStepIndex
    const snappedValue = min + stepIndex * step
    const isMajor = Math.abs(snappedValue - Math.round(snappedValue)) < step / 2
    if (atEdge) scheduleOnRN(fireEdgeHaptic)
    else if (isMajor) scheduleOnRN(fireMajorHaptic)
    else scheduleOnRN(fireMinorHaptic)
  }

  useAnimatedReaction(
    // Clamp the observed step to [0, maxStepIndex]. While the wheel sits in
    // the rubber-band zone past min/max, the clamped index doesn't change, so
    // the reaction stays quiet — no out-of-range onChange, no repeat haptics.
    () => {
      const raw = Math.round((currentValue.value - min) / step)
      if (raw < 0) return 0
      if (raw > maxStepIndex) return maxStepIndex
      return raw
    },
    (stepIndex, prevStepIndex) => {
      if (prevStepIndex === null || stepIndex === prevStepIndex) return
      // Only forward onChange during finger-down drag — the decay path
      // schedules the final onChange itself, so firing here as well would
      // flood the JS queue with stale values on fast flicks.
      if (isDragging.value) {
        const value = snapToStep(min + stepIndex * step, min, step)
        scheduleOnRN(onChange, value)
      }
      // Haptics fire only on user-initiated motion (drag, flick, settle).
      // Typing leaves isActive=false; preset presses set isProgrammatic=true.
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
    const offset = -(currentValue.value - min) * PX_PER_UNIT
    return [{ translateX: offset }]
  })

  const tickColor = alpha(colors.$textPrimary, 0.35)
  const labelColor = alpha(colors.$textPrimary, 0.6)
  const centerX = wheelWidth / 2

  return (
    <GestureDetector gesture={panGesture}>
      <View
        onLayout={e => {
          const w = e.nativeEvent.layout.width
          if (w === wheelWidth) return
          setWheelWidth(w)
        }}>
        <Animated.View style={canvasStyle}>
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
                  animatable={!integersOnly || t.isMajor}
                  // In integersOnly mode, the "neighbor" of an integer tick is
                  // the next integer (1 unit away), not the adjacent minor —
                  // so fade over the full integer span for progressive scale.
                  fadeSpan={integersOnly ? 1 : VISUAL_TICK_STEP}
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
    </GestureDetector>
  )
}

// Callers MUST pass stable onChange/onCommit refs for the memo to bail out;
// otherwise we reconcile the Skia canvas + ~196 TickMarks on every parent render.
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
   * tick) down to 0 (neighbor). Match it to the spacing of the *animated*
   * neighbor — e.g. 0.2 for adjacent sub-step ticks, 1 for integer-only mode.
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
  const baseHeight = tick.isMajor ? MAJOR_TICK_HEIGHT : MINOR_TICK_HEIGHT
  const peakScale = tick.isMajor ? ACTIVE_SCALE_MAJOR : ACTIVE_SCALE_MINOR

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
  // animated value instead of four (width/height/x/y) — matters at ~196 ticks.
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
