import {
  LinearGradient,
  Path,
  Skia,
  type SkPath,
  vec
} from '@shopify/react-native-skia'
import React, { FC, memo, useMemo } from 'react'
import Animated, {
  SharedValue,
  useAnimatedStyle
} from 'react-native-reanimated'
import { useTheme } from '../../../hooks'
import {
  AREA_GRADIENT_BOTTOM_ALPHA,
  AREA_GRADIENT_TOP_ALPHA
} from './constants'
import { indexToX, priceToY } from './helpers'
import { OhlcCandle } from './types'

type AreaSeriesProps = {
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
export const AreaSeries: FC<AreaSeriesProps> = memo(
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

type CandlesProps = {
  candles: OhlcCandle[]
  innerWidth: number
  chartInset: number
  bodyWidth: number
  /** Price-area height (excludes top + bottom padding). */
  priceAreaH: number
  priceTopPadding: number
  priceMin: number
  priceMax: number
  upColor: string
  downColor: string
}

/**
 * `Candles`: 4 `SkPath`s (up/down body, up/down wick) instead of 2N
 * `<Line>`+`<RoundedRect>` elements. Wicks draw before bodies so paint order
 * matches the original per-candle behavior. CP-14918.
 */
export const Candles: FC<CandlesProps> = memo(
  ({
    candles,
    innerWidth,
    chartInset,
    bodyWidth,
    priceAreaH,
    priceTopPadding,
    priceMin,
    priceMax,
    upColor,
    downColor
  }) => {
    const { upBody, downBody, upWick, downWick, wickStrokeWidth } =
      useMemo(() => {
        const bodies = { up: Skia.Path.Make(), down: Skia.Path.Make() }
        const wicks = { up: Skia.Path.Make(), down: Skia.Path.Make() }
        // Loop-invariant (depends only on bodyWidth) — same value the
        // per-candle version computed each iteration.
        const stroke = Math.max(1, bodyWidth / 4)

        candles.forEach((c, i) => {
          const xCenter = indexToX(i, candles.length, innerWidth) + chartInset
          const x = xCenter - bodyWidth / 2
          const isUp = c.close >= c.open
          const top =
            priceToY({
              price: Math.max(c.open, c.close),
              priceMin,
              priceMax,
              height: priceAreaH
            }) + priceTopPadding
          const bottom =
            priceToY({
              price: Math.min(c.open, c.close),
              priceMin,
              priceMax,
              height: priceAreaH
            }) + priceTopPadding
          const bodyHeight = Math.max(1, bottom - top)
          const wickTop =
            priceToY({
              price: c.high,
              priceMin,
              priceMax,
              height: priceAreaH
            }) + priceTopPadding
          const wickBottom =
            priceToY({
              price: c.low,
              priceMin,
              priceMax,
              height: priceAreaH
            }) + priceTopPadding
          const bodyRadius = Math.min(bodyWidth, bodyHeight) / 2

          const bodyPath = isUp ? bodies.up : bodies.down
          bodyPath.addRRect(
            Skia.RRectXY(
              Skia.XYWHRect(x, top, bodyWidth, bodyHeight),
              bodyRadius,
              bodyRadius
            )
          )

          const wickPath = isUp ? wicks.up : wicks.down
          wickPath.moveTo(xCenter, wickTop)
          wickPath.lineTo(xCenter, wickBottom)
        })

        return {
          upBody: bodies.up,
          downBody: bodies.down,
          upWick: wicks.up,
          downWick: wicks.down,
          wickStrokeWidth: stroke
        }
      }, [
        candles,
        innerWidth,
        chartInset,
        bodyWidth,
        priceAreaH,
        priceTopPadding,
        priceMin,
        priceMax
      ])

    return (
      <>
        <Path
          path={upWick}
          color={upColor}
          style="stroke"
          strokeWidth={wickStrokeWidth}
          strokeCap="round"
          opacity={0.5}
        />
        <Path
          path={downWick}
          color={downColor}
          style="stroke"
          strokeWidth={wickStrokeWidth}
          strokeCap="round"
          opacity={0.5}
        />
        <Path path={upBody} color={upColor} style="fill" />
        <Path path={downBody} color={downColor} style="fill" />
      </>
    )
  }
)

type LineChartDotProps = {
  x: SharedValue<number>
  y: SharedValue<number>
  isActive: SharedValue<boolean>
  size?: number
  color?: string
}

export const LineChartDot: FC<LineChartDotProps> = ({
  x,
  y,
  isActive,
  size = 9,
  color: colorProp
}) => {
  const { theme } = useTheme()
  const color = colorProp ?? theme.colors.$textPrimary ?? '#000'

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: isActive.value ? 1 : 0,
    transform: [
      { translateX: x.value - size / 2 },
      { translateY: y.value - size / 2 }
    ]
  }))

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color
        },
        animatedStyle
      ]}
    />
  )
}
