import { Canvas, Path, Skia } from '@shopify/react-native-skia'
import React, { useEffect, useMemo } from 'react'
import {
  Easing,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'

import { useTheme } from '../../hooks'
import { alpha } from '../../utils'
import { Text, View } from '../Primitives'

// Canvas and arc geometry mirror `CircularDial`'s visual track but drop the
// extra padding the dial reserves for its draggable knob & shadow. The arc
// baseline is anchored near the bottom of the canvas so the readout sits in
// the empty top half of the semicircle.
const CANVAS_WIDTH = 280
const CANVAS_HEIGHT = 140
const STROKE_WIDTH = 6
const ARC_RADIUS = 110
const ARC_CX = CANVAS_WIDTH / 2
const ARC_CY = CANVAS_HEIGHT - 14

const FILL_TRANSITION_MS = 300

export type ProgressDialProps = {
  /** Progress as a fraction in `[0, 1]`. Values outside the range are clamped. */
  progress: number
  /** Optional value text rendered prominently inside the arc (e.g. "89%"). */
  value?: string
  /** Optional caption text below the value (e.g. "Staking progress"). */
  caption?: string
}

/**
 * Read-only semicircular progress dial. Visually mirrors `CircularDial` but
 * strips out gesture handling, presets, manual input, knob, and the
 * `min`-threshold danger/success zones — appropriate for displaying a value
 * that the user can't edit (e.g. staking progress).
 */
export const ProgressDial = ({
  progress,
  value,
  caption
}: ProgressDialProps): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  const clamped = Math.max(0, Math.min(1, progress))
  const progressSv = useSharedValue(clamped)

  // Animate the fill when `progress` changes so re-mounts/value updates are
  // smooth instead of snapping.
  useEffect(() => {
    progressSv.value = withTiming(clamped, {
      duration: FILL_TRANSITION_MS,
      easing: Easing.out(Easing.cubic)
    })
  }, [clamped, progressSv])

  const trackPath = useMemo(() => {
    const p = Skia.Path.Make()
    p.addArc(
      {
        x: ARC_CX - ARC_RADIUS,
        y: ARC_CY - ARC_RADIUS,
        width: ARC_RADIUS * 2,
        height: ARC_RADIUS * 2
      },
      180, // start angle (left edge)
      180 // sweep (semicircle to the right edge)
    )
    return p
  }, [])

  const trackColor = alpha(colors.$textPrimary, 0.1)
  const fillColor = colors.$textSuccess

  return (
    <View
      style={{
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        alignSelf: 'center'
      }}>
      <Canvas
        pointerEvents="none"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
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
      </Canvas>
      {(value !== undefined || caption !== undefined) && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            // Anchor readout to the arc baseline (bottom of the dial) so the
            // value + caption stack hugs the lower-inner portion of the
            // semicircle — matches the Figma layout.
            bottom: CANVAS_HEIGHT - ARC_CY,
            alignItems: 'center',
            gap: 2
          }}>
          {value !== undefined && (
            <Text
              sx={{
                fontFamily: 'Aeonik-Medium',
                fontSize: 50,
                lineHeight: 50,
                color: '$textPrimary'
              }}>
              {value}
            </Text>
          )}
          {caption !== undefined && (
            <Text variant="subtitle2" sx={{ color: '$textSecondary' }}>
              {caption}
            </Text>
          )}
        </View>
      )}
    </View>
  )
}
