import {
  LinearGradient,
  Path,
  type SkPath,
  vec
} from '@shopify/react-native-skia'
import React, { FC, memo } from 'react'
import {
  AREA_GRADIENT_BOTTOM_ALPHA,
  AREA_GRADIENT_TOP_ALPHA
} from './constants'

type Props = {
  /** Closed path for the gradient fill. */
  areaPath: SkPath
  /** Open path for the stroke. */
  linePath: SkPath
  color: string
  topY: number
  bottomY: number
  strokeWidth?: number
}

/** Skia primitives — must be a child of a `<Canvas>`. */
export const AreaSeries: FC<Props> = memo(
  ({ areaPath, linePath, color, topY, bottomY, strokeWidth = 2.5 }) => (
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
)
