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
  Easing,
  FadeIn,
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
  onHapticTick: boolean
  /** Multiplier on finger release velocity — see LeverageGaugeProps. */
  velocityPower: number
  /** Coast-phase deceleration (0 < d < 1) — see LeverageGaugeProps. */
  coastDeceleration: number
}

const PX_PER_UNIT = 50
// Ticks align at a common bottom baseline; majors reach higher than minors.
const MAJOR_TICK_HEIGHT = 50
const MINOR_TICK_HEIGHT = 20
// How much a tick blooms at full active. Major/minor can differ if you want
// integers to pop more than sub-steps.
const ACTIVE_SCALE_MAJOR = 1.2
const ACTIVE_SCALE_MINOR = 1.4
// Baseline is deep enough that even the scaled-up major tick fits inside
// the canvas (otherwise the top of a bloomed major gets clipped).
const TICK_BASELINE_Y = MAJOR_TICK_HEIGHT * ACTIVE_SCALE_MAJOR
const TICK_WIDTH = 2
const LABEL_AREA_HEIGHT = 22
const CANVAS_HEIGHT = TICK_BASELINE_Y + LABEL_AREA_HEIGHT
const EDGE_FADE_WIDTH = 70
const LABEL_FONT_SIZE = 11
const LABEL_BASELINE_Y = TICK_BASELINE_Y + 20
// Ruler shows 4 minor ticks between integers, regardless of selection step.
const VISUAL_TICK_STEP = 0.2

type TickDescriptor = {
  value: number
  x: number
  isMajor: boolean
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
  onHapticTick,
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

  // Width fills the parent container. Measured via onLayout and mirrored to
  // a shared value so UI-thread worklets (groupTransform, activeTickX) can
  // read the current width without triggering re-renders per frame.
  const [wheelWidth, setWheelWidth] = useState(0)
  const wheelWidthSv = useSharedValue(0)

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
  // True only during finger-down drag. During decay/settle it's false, which
  // lets the step-crossing reaction skip onChange and avoid flooding the JS
  // queue with stale values that could fire after the settle completes.
  const isDragging = useSharedValue(false)

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isActive.value = true
      isDragging.value = true
      gestureStartValue.value = currentValue.value
    })
    .onUpdate(event => {
      const deltaValue = -event.translationX / PX_PER_UNIT
      const next = gestureStartValue.value + deltaValue
      const range = max - min
      // Rubber-band past the edges so the wheel moves with the finger but
      // meets increasing resistance. Uses UIKit's formula:
      //   rubber = (1 - 1 / (offset/range + 1)) * range * coeff
      const RUBBER_COEFF = 0.55
      if (next < min) {
        const overshoot = min - next
        const rubber = (1 - 1 / (overshoot / range + 1)) * range * RUBBER_COEFF
        currentValue.value = min - rubber
      } else if (next > max) {
        const overshoot = next - max
        const rubber = (1 - 1 / (overshoot / range + 1)) * range * RUBBER_COEFF
        currentValue.value = max + rubber
      } else {
        currentValue.value = next
      }
    })
    // eslint-disable-next-line sonarjs/cognitive-complexity
    .onEnd(event => {
      isDragging.value = false
      // Keep isActive=true through the release animation so that prop-sync in
      // useLeverageValue doesn't interrupt when the parent re-renders.
      const valueVelocity = (-event.velocityX / PX_PER_UNIT) * velocityPower

      const settleTo = (snapped: number): void => {
        'worklet'
        scheduleOnRN(onChange, snapped)
        currentValue.value = withTiming(
          snapped,
          { duration: 900, easing: Easing.out(Easing.cubic) },
          finished => {
            // If cancelled by a new gesture (finished=false, or a drag is
            // currently in progress), do NOT touch isActive / commit —
            // otherwise we hand control back to the sync effect mid-gesture.
            if (!finished || isDragging.value) return
            isActive.value = false
            scheduleOnRN(onChange, snapped)
            scheduleOnRN(onCommit, snapped)
          }
        )
      }

      // If released in the rubber-band zone, spring back to the clamped edge.
      // Over-damped (ζ ≈ 1.33) so it doesn't overshoot past the edge.
      // If the user's release velocity would push further PAST the edge, we
      // zero it — otherwise the spring's initial momentum carries the wheel
      // deeper into the rubber-band before reversing, which reads as an
      // unwanted "bounce further, then return".
      if (currentValue.value < min || currentValue.value > max) {
        const target = currentValue.value < min ? min : max
        const inwardVelocity =
          (target === min && valueVelocity < 0) ||
          (target === max && valueVelocity > 0)
            ? 0
            : valueVelocity
        currentValue.value = withSpring(
          target,
          {
            velocity: inwardVelocity,
            damping: 30,
            stiffness: 160,
            mass: 0.8
          },
          finished => {
            if (!finished || isDragging.value) return
            settleTo(snapToStep(target, min, step))
          }
        )
        return
      }

      // Normal inside-bounds release: decay coast, then timed snap to step.
      currentValue.value = withDecay(
        {
          velocity: valueVelocity,
          deceleration: coastDeceleration,
          clamp: [min, max],
          rubberBandEffect: false
        },
        finished => {
          // Cancelled by a new gesture — let the new one handle settling.
          if (!finished || isDragging.value) return
          // snapToStep also rounds away float drift (e.g. 2.4000000004 → 2.4).
          const snapped = snapToStep(currentValue.value, min, step)
          settleTo(snapped)
        }
      )
    })

  const lastStepIndex = useSharedValue<number>(
    Math.round((currentValue.value - min) / step)
  )

  // Three haptic tiers so each kind of tick feels distinct:
  //  - Minor (sub-step): Light tap
  //  - Major (integer):  Medium thump
  //  - Edge (min/max):   Heavy "wall bump"
  const fireMinorHaptic = (): void => {
    impactAsync(ImpactFeedbackStyle.Light).catch(() => undefined)
  }
  const fireMajorHaptic = (): void => {
    impactAsync(ImpactFeedbackStyle.Medium).catch(() => undefined)
  }
  const fireEdgeHaptic = (): void => {
    impactAsync(ImpactFeedbackStyle.Heavy).catch(() => undefined)
  }

  const maxStepIndex = Math.round((max - min) / step)

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
      // Only forward onChange during finger-down drag. The decay phase
      // explicitly schedules the final onChange(snap); emitting here too
      // would flood the queue with stale values on fast flicks.
      if (isDragging.value) {
        const value = snapToStep(min + stepIndex * step, min, step)
        scheduleOnRN(onChange, value)
      }
      // Only emit haptics for user-initiated motion (drag, flick, snap). Skip
      // passive animations (typing → isActive=false) and programmatic ones
      // (preset press → isActive=true but isProgrammatic=true).
      if (
        onHapticTick &&
        isActive.value &&
        !isProgrammatic.value &&
        stepIndex !== lastStepIndex.value
      ) {
        lastStepIndex.value = stepIndex
        const atEdge = stepIndex === 0 || stepIndex === maxStepIndex
        const snappedValue = min + stepIndex * step
        const isMajor =
          Math.abs(snappedValue - Math.round(snappedValue)) < step / 2
        if (atEdge) scheduleOnRN(fireEdgeHaptic)
        else if (isMajor) scheduleOnRN(fireMajorHaptic)
        else scheduleOnRN(fireMinorHaptic)
      }
    }
  )

  const groupTransform = useDerivedValue(() => {
    const offset = -(currentValue.value - min) * PX_PER_UNIT
    return [{ translateX: offset }]
  })

  // Hidden active-line marker kept intact for potential re-enable later.
  const activeTickHeight = useDerivedValue(() => {
    const raw = currentValue.value
    const clamped = raw < min ? min : raw > max ? max : raw
    const index = (clamped - min) / step
    const floor = Math.floor(index)
    const ceil = floor + 1
    const t = index - floor
    const heightOf = (i: number): number => {
      const v = min + i * step
      const isMajor = Math.abs(v - Math.round(v)) < step / 2
      return isMajor ? MAJOR_TICK_HEIGHT : MINOR_TICK_HEIGHT
    }
    return heightOf(floor) + t * (heightOf(ceil) - heightOf(floor))
  })
  const activeTickY = useDerivedValue(
    () => TICK_BASELINE_Y - activeTickHeight.value
  )
  const activeTickX = useDerivedValue(() => {
    const v = currentValue.value
    const center = wheelWidthSv.value / 2
    let x = center
    if (v < min) x = center + (min - v) * PX_PER_UNIT
    else if (v > max) x = center - (v - max) * PX_PER_UNIT
    return x - TICK_WIDTH / 2
  })

  const tickColor = alpha(colors.$textPrimary, 0.35)
  const labelColor = alpha(colors.$textPrimary, 0.6)

  return (
    <GestureDetector gesture={panGesture}>
      <View
        onLayout={e => {
          const w = e.nativeEvent.layout.width
          if (w === wheelWidth) return
          setWheelWidth(w)
          wheelWidthSv.value = w
        }}>
        <Animated.View entering={FadeIn.delay(650).duration(550)}>
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

            {/* Left fade */}
            <Rect x={0} y={0} width={EDGE_FADE_WIDTH} height={CANVAS_HEIGHT}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(EDGE_FADE_WIDTH, 0)}
                colors={[
                  colors.$surfaceSecondary,
                  alpha(colors.$surfaceSecondary, 0)
                ]}
              />
            </Rect>

            {/* Right fade */}
            <Rect
              x={wheelWidth - EDGE_FADE_WIDTH}
              y={0}
              width={EDGE_FADE_WIDTH}
              height={CANVAS_HEIGHT}>
              <LinearGradient
                start={vec(wheelWidth - EDGE_FADE_WIDTH, 0)}
                end={vec(wheelWidth, 0)}
                colors={[
                  alpha(colors.$surfaceSecondary, 0),
                  colors.$surfaceSecondary
                ]}
              />
            </Rect>

            {/* Active-line marker — hidden; per-tick bloom carries the visual
              for now. Logic kept intact so it's easy to re-enable. */}
            <RoundedRect
              x={activeTickX}
              y={activeTickY}
              width={TICK_WIDTH}
              height={activeTickHeight}
              r={TICK_WIDTH}
              color="transparent"
            />
          </Canvas>
        </Animated.View>
      </View>
    </GestureDetector>
  )
}

// Memoized — callers MUST pass stable onChange/onCommit refs (see
// LeverageGauge's stableOnChange/stableOnCommit) or the bail-out doesn't
// help. Skips reconciling the whole Skia canvas + 196 TickMarks when the
// parent re-renders for unrelated reasons.
export const LeverageWheel = memo(LeverageWheelInner)

/**
 * Single tick on the ruler. Height animates with currentValue — the tick at
 * the center grows toward MAJOR_TICK_HEIGHT (regardless of base category),
 * falling back to its base height as it moves away. Each tick has its own
 * derived value that reads currentValue, so the whole ruler "breathes"
 * around the live position.
 */
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

  // Progressive fade across `fadeSpan` — peaks at 1 when this tick is
  // exactly at currentValue, drops to 0 once a neighbor is on top of it.
  // When `animatable` is false, always returns 0 so the tick stays dim.
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
  // Group-level transform scales the tick around its bottom-center so we
  // only need one animated value for size instead of four (width/height/x/y).
  // Reduces the per-tick derived-value count from 7 → 3 which matters when
  // there are hundreds of ticks updating each frame.
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
