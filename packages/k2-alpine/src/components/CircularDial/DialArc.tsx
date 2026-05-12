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

// Canvas is wider/taller than the arc bounding box so the knob's
// BoxShadow (blur 13 + dy 6) can render fully at the endpoints without
// being clipped at the canvas edge.
export const CANVAS_WIDTH = 280
export const CANVAS_HEIGHT = 161
const STROKE_WIDTH = 6
const KNOB_RADIUS = 11
const REFERENCE_TICK_RADIUS = 3
export const ARC_RADIUS = 110
export const ARC_CX = CANVAS_WIDTH / 2
export const ARC_CY = CANVAS_HEIGHT - 35

// ~7% of the sweep ≈ 12.6° — the negative-space halo around the tick.
const TICK_GAP = 0.07
const ZONE_CROSSFADE_MS = 120

type DialArcProps = {
  progressSv: SharedValue<number>
  max: number
  value: number
  referenceValue: number | undefined
}

export const DialArc: FC<DialArcProps> = ({
  progressSv,
  max,
  value,
  referenceValue
}) => {
  const {
    theme: { colors }
  } = useTheme()

  const referenceTickProgress = useMemo(() => {
    if (referenceValue === undefined) return null
    if (referenceValue < 0 || referenceValue > max) return null
    return valueToProgress(referenceValue, max)
  }, [referenceValue, max])
  const hasReferenceTick = referenceTickProgress !== null

  const referenceTickPoint = useMemo(() => {
    if (referenceTickProgress === null) return null
    return progressToPoint({
      progress: referenceTickProgress,
      cx: ARC_CX,
      cy: ARC_CY,
      radius: ARC_RADIUS
    })
  }, [referenceTickProgress])

  // Clamp into [0, 1] so a tick near either end of the arc doesn't
  // produce out-of-range start/end values for Skia's `Path.start`/`end`.
  const tickLeftEdge =
    referenceTickProgress !== null
      ? Math.max(0, referenceTickProgress - TICK_GAP / 2)
      : 1
  const tickRightEdge =
    referenceTickProgress !== null
      ? Math.min(1, referenceTickProgress + TICK_GAP / 2)
      : 0

  // Zone opacities cross-fade with their inverse track opacities so
  // colour swaps are smooth as the knob crosses the tick.
  const initialProgress = hasReferenceTick ? valueToProgress(value, max) : 0
  const initialDangerActive = hasReferenceTick && initialProgress < tickLeftEdge
  const initialSuccessActive =
    hasReferenceTick && initialProgress > tickRightEdge
  const dangerZoneOpacity = useSharedValue(initialDangerActive ? 1 : 0)
  const successZoneOpacity = useSharedValue(initialSuccessActive ? 1 : 0)

  useAnimatedReaction(
    () => {
      if (referenceTickProgress === null) return 0
      // Trigger on `< referenceTickProgress` (not `< tickLeftEdge`),
      // so the danger colour engages at the same threshold the text
      // uses (`< referenceValue`). Otherwise the gap halo around the
      // tick creates a band where text is red but the track isn't.
      return progressSv.value < referenceTickProgress ? 1 : 0
    },
    (target, prev) => {
      if (prev === null || target === prev) return
      dangerZoneOpacity.value = withTiming(target, {
        duration: ZONE_CROSSFADE_MS
      })
    },
    [referenceTickProgress]
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

  // Fill endpoints clamp at the tick edges. When the knob leaves a
  // zone, endpoints lock to that zone's outer edge so the fill stays
  // fully extended while the zone's opacity animates to 0.
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

  // rrect (not Circle) so we can stack BoxShadows on the knob.
  const knobBox = useDerivedValue(() => {
    const { x, y } = progressToPoint({
      progress: progressSv.value,
      cx: ARC_CX,
      cy: ARC_CY,
      radius: ARC_RADIUS
    })
    return rrect(
      rect(x - KNOB_RADIUS, y - KNOB_RADIUS, KNOB_RADIUS * 2, KNOB_RADIUS * 2),
      KNOB_RADIUS,
      KNOB_RADIUS
    )
  })

  const trackColor = alpha(colors.$textPrimary, 0.1)
  const fillColor = colors.$textSuccess

  return (
    <View
      style={{
        alignSelf: 'stretch',
        height: CANVAS_HEIGHT,
        alignItems: 'center'
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
              color={fillColor}
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
  )
}
