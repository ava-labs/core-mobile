import {
  LinearGradient,
  Path,
  type SkPath,
  vec
} from '@shopify/react-native-skia'
import React, { FC } from 'react'
import {
  AREA_GRADIENT_BOTTOM_ALPHA,
  AREA_GRADIENT_TOP_ALPHA
} from './constants'

type Props = {
  /** Closed path for the gradient fill — line points + bottom of price area. */
  areaPath: SkPath
  /** Open path for the stroke. */
  linePath: SkPath
  /** Direction-coloured line/area (green if up, red if down). */
  color: string
  /** Y at which the gradient's top stop sits (top of price area). */
  topY: number
  /** Y at which the gradient's bottom stop sits (bottom of price area). */
  bottomY: number
  strokeWidth?: number
}

/**
 * Smooth area chart — gradient fill under a stroked line. Must be a child
 * of a `<Canvas>`.
 */
export const AreaSeries: FC<Props> = ({
  areaPath,
  linePath,
  color,
  topY,
  bottomY,
  strokeWidth = 2.5
}) => (
  <>
    <Path path={areaPath} style="fill">
      <LinearGradient
        start={vec(0, topY)}
        end={vec(0, bottomY)}
        colors={[
          `${color}${AREA_GRADIENT_TOP_ALPHA}`,
          `${color}${AREA_GRADIENT_BOTTOM_ALPHA}`
        ]}
      />
    </Path>
    <Path
      path={linePath}
      color={color}
      style="stroke"
      strokeWidth={strokeWidth}
      strokeJoin="round"
      strokeCap="round"
    />
  </>
)
