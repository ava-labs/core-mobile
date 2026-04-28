import {
  Box,
  BoxShadow,
  Canvas,
  Circle,
  Group,
  Path,
  rect,
  rrect,
  Skia
} from '@shopify/react-native-skia'
import React, { FC, useMemo } from 'react'
import {
  ComposedGesture,
  GestureDetector,
  GestureType
} from 'react-native-gesture-handler'
import {
  SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { useTheme } from '../../hooks'
import { alpha } from '../../utils'
import { View } from '../Primitives'
import { progressToPoint, valueToProgress } from './helpers'
import type { DialTone } from './types'

// Geometry — fixed so the knob fits cleanly inside the Canvas at both arc
// endpoints and the top of the sweep. Canvas is wider/taller than the
// arc's bounding box to give the knob's BoxShadow (blur 13 + dy 6) room
// to render at the endpoints without being clipped by the canvas edge.
const CANVAS_WIDTH = 280
const CANVAS_HEIGHT = 161
const STROKE_WIDTH = 6
const KNOB_RADIUS = 11
// Reference tick — 6x6 per Figma, so radius 3.
const REFERENCE_TICK_RADIUS = 3
export const ARC_RADIUS = 110
const ARC_CX = CANVAS_WIDTH / 2 // 140
// Bottom margin for shadow at progress 0/1 endpoints: KNOB_RADIUS + dy +
// blur ≈ 30. 35px below `ARC_CY` keeps the shadow fully on-canvas while
// keeping the bottom of the card visually compact.
const ARC_CY = CANVAS_HEIGHT - 35 // 126

// Path-fraction gap carved out of the track on either side of the tick.
// ~7% of the sweep ≈ 12.6° → clear negative-space halo around the dot.
const TICK_GAP = 0.07

// How quickly track & fill cross-fade when the knob crosses a zone edge.
const ZONE_CROSSFADE_MS = 120

type DialArcProps = {
  gesture: ComposedGesture | GestureType
  progressSv: SharedValue<number>
  min: number
  max: number
  value: number
  tone: DialTone
  referenceValue: number | undefined
}

/**
 * Skia-rendered arc: track, filled segments (with reference-tick zone
 * split when present), reference tick dot, and the knob. Wrapped in a
 * `GestureDetector` whose gesture view stretches across the full parent
 * width so touches in the side padding still control the dial.
 */
export const DialArc: FC<DialArcProps> = ({
  gesture,
  progressSv,
  min,
  max,
  value,
  tone,
  referenceValue
}) => {
  const {
    theme: { colors }
  } = useTheme()

  // Reference tick — position on the arc + zone boundaries derived from it.
  const referenceTickProgress = useMemo(() => {
    if (referenceValue === undefined) return null
    if (referenceValue < min || referenceValue > max) return null
    return valueToProgress(referenceValue, min, max)
  }, [referenceValue, min, max])
  const hasReferenceTick = referenceTickProgress !== null

  const referenceTickPoint = useMemo(() => {
    if (referenceTickProgress === null) return null
    return progressToPoint(referenceTickProgress, ARC_CX, ARC_CY, ARC_RADIUS)
  }, [referenceTickProgress])

  const tickLeftEdge =
    referenceTickProgress !== null ? referenceTickProgress - TICK_GAP / 2 : 1
  const tickRightEdge =
    referenceTickProgress !== null ? referenceTickProgress + TICK_GAP / 2 : 0

  // Zone state — smoothly animates between 0 and 1 based on which side of
  // the tick the knob is on. Track uses the inverse so track & fill
  // cross-fade instead of snapping when the zone changes.
  const initialProgress = hasReferenceTick
    ? valueToProgress(value, min, max)
    : 0
  const initialDangerActive = hasReferenceTick && initialProgress < tickLeftEdge
  const initialSuccessActive =
    hasReferenceTick && initialProgress > tickRightEdge
  const dangerZoneOpacity = useSharedValue(initialDangerActive ? 1 : 0)
  const successZoneOpacity = useSharedValue(initialSuccessActive ? 1 : 0)

  useAnimatedReaction(
    () => {
      if (!hasReferenceTick) return 0
      return progressSv.value < tickLeftEdge ? 1 : 0
    },
    (target, prev) => {
      if (prev === null || target === prev) return
      dangerZoneOpacity.value = withTiming(target, {
        duration: ZONE_CROSSFADE_MS
      })
    },
    [hasReferenceTick, tickLeftEdge]
  )
  useAnimatedReaction(
    () => {
      if (!hasReferenceTick) return 0
      return progressSv.value > tickRightEdge ? 1 : 0
    },
    (target, prev) => {
      if (prev === null || target === prev) return
      successZoneOpacity.value = withTiming(target, {
        duration: ZONE_CROSSFADE_MS
      })
    },
    [hasReferenceTick, tickRightEdge]
  )

  const leftTrackOpacity = useDerivedValue(() => 1 - dangerZoneOpacity.value)
  const rightTrackOpacity = useDerivedValue(() => 1 - successZoneOpacity.value)

  // Fill endpoints clamped so fills never extend into the tick gap. When
  // the knob leaves a zone, endpoints lock to the zone's outer edge
  // (fadedEnd = tickLeft for danger, etc.) so the fill sits at "fully
  // faded" while the zone's opacity animates down to 0.
  const dangerFadedEnd = useDerivedValue(() => {
    if (!hasReferenceTick) return 0
    const p = progressSv.value
    return p < tickLeftEdge ? p : tickLeftEdge
  }, [hasReferenceTick, tickLeftEdge])

  const dangerSolidStart = useDerivedValue(() => {
    if (!hasReferenceTick) return tickLeftEdge
    const p = progressSv.value
    return p < tickLeftEdge ? p : tickLeftEdge
  }, [hasReferenceTick, tickLeftEdge])

  const successSolidEnd = useDerivedValue(() => {
    if (!hasReferenceTick) return tickRightEdge
    const p = progressSv.value
    return p > tickRightEdge ? p : tickRightEdge
  }, [hasReferenceTick, tickRightEdge])

  const successFadedStart = useDerivedValue(() => {
    if (!hasReferenceTick) return 1
    const p = progressSv.value
    return p > tickRightEdge ? p : tickRightEdge
  }, [hasReferenceTick, tickRightEdge])

  // Skia path: 180° arc from 9 o'clock through 12 o'clock to 3 o'clock.
  const trackPath = useMemo(() => {
    const p = Skia.Path.Make()
    p.addArc(
      {
        x: ARC_CX - ARC_RADIUS,
        y: ARC_CY - ARC_RADIUS,
        width: ARC_RADIUS * 2,
        height: ARC_RADIUS * 2
      },
      180,
      180
    )
    return p
  }, [])

  // Knob: a rrect approximating a circle so we can stack two BoxShadows.
  const knobBox = useDerivedValue(() => {
    const { x, y } = progressToPoint(
      progressSv.value,
      ARC_CX,
      ARC_CY,
      ARC_RADIUS
    )
    return rrect(
      rect(x - KNOB_RADIUS, y - KNOB_RADIUS, KNOB_RADIUS * 2, KNOB_RADIUS * 2),
      KNOB_RADIUS,
      KNOB_RADIUS
    )
  })

  // Track colour per Figma: `color/neutral/850 10%` — mode-adaptive.
  const trackColor = alpha(colors.$textPrimary, 0.1)
  const toneFillColor = resolveFillColor(tone, colors)

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={{
          alignSelf: 'stretch',
          height: CANVAS_HEIGHT,
          alignItems: 'center',
        }}>
        <Canvas
          pointerEvents="none"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
          {hasReferenceTick ? (
            <>
              <Group opacity={leftTrackOpacity}>
                <Path
                  path={trackPath}
                  style="stroke"
                  strokeWidth={STROKE_WIDTH}
                  strokeCap="round"
                  color={trackColor}
                  start={0}
                  end={tickLeftEdge}
                />
              </Group>
              <Group opacity={rightTrackOpacity}>
                <Path
                  path={trackPath}
                  style="stroke"
                  strokeWidth={STROKE_WIDTH}
                  strokeCap="round"
                  color={trackColor}
                  start={tickRightEdge}
                  end={1}
                />
              </Group>
              <Group opacity={dangerZoneOpacity}>
                <Path
                  path={trackPath}
                  style="stroke"
                  strokeWidth={STROKE_WIDTH}
                  strokeCap="round"
                  color={alpha(colors.$textDanger, 0.3)}
                  start={0}
                  end={dangerFadedEnd}
                />
                <Path
                  path={trackPath}
                  style="stroke"
                  strokeWidth={STROKE_WIDTH}
                  strokeCap="round"
                  color={colors.$textDanger}
                  start={dangerSolidStart}
                  end={tickLeftEdge}
                />
              </Group>
              <Group opacity={successZoneOpacity}>
                <Path
                  path={trackPath}
                  style="stroke"
                  strokeWidth={STROKE_WIDTH}
                  strokeCap="round"
                  color={colors.$textSuccess}
                  start={tickRightEdge}
                  end={successSolidEnd}
                />
                <Path
                  path={trackPath}
                  style="stroke"
                  strokeWidth={STROKE_WIDTH}
                  strokeCap="round"
                  color={alpha(colors.$textSuccess, 0.3)}
                  start={successFadedStart}
                  end={1}
                />
              </Group>
            </>
          ) : (
            <>
              <Path
                path={trackPath}
                style="stroke"
                strokeWidth={STROKE_WIDTH}
                strokeCap="round"
                color={trackColor}
              />
              <Path
                path={trackPath}
                style="stroke"
                strokeWidth={STROKE_WIDTH}
                strokeCap="round"
                color={toneFillColor}
                start={0}
                end={progressSv}
              />
            </>
          )}
          {referenceTickPoint !== null && (
            <Circle
              cx={referenceTickPoint.x}
              cy={referenceTickPoint.y}
              r={REFERENCE_TICK_RADIUS}
              color={trackColor}
            />
          )}
          <Box box={knobBox} color="white">
            <BoxShadow dx={0} dy={0.5} blur={4} color="rgba(0,0,0,0.08)" />
            <BoxShadow dx={0} dy={6} blur={13} color="rgba(0,0,0,0.12)" />
          </Box>
        </Canvas>
      </View>
    </GestureDetector>
  )
}

const resolveFillColor = (
  tone: DialTone,
  colors: {
    $textSuccess: string
    $textDanger: string
    $textPrimary: string
  }
): string => {
  switch (tone) {
    case 'danger':
      return colors.$textDanger
    case 'neutral':
      return colors.$textPrimary
    case 'success':
    default:
      return colors.$textSuccess
  }
}
