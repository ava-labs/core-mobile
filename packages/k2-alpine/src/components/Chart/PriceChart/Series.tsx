import {
  Line,
  LinearGradient,
  Path,
  RoundedRect,
  type SkPath,
  vec
} from '@shopify/react-native-skia'
import React, { FC, memo } from 'react'
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
  }) => (
    <>
      {candles.map((c, i) => {
        const xCenter = indexToX(i, candles.length, innerWidth) + chartInset
        const x = xCenter - bodyWidth / 2
        const isUp = c.close >= c.open
        const color = isUp ? upColor : downColor
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
        const wickStroke = Math.max(1, bodyWidth / 4)
        return (
          <React.Fragment key={c.ts}>
            <Line
              p1={vec(xCenter, wickTop)}
              p2={vec(xCenter, wickBottom)}
              color={color}
              strokeWidth={wickStroke}
              strokeCap="round"
              opacity={0.5}
            />
            <RoundedRect
              x={x}
              y={top}
              width={bodyWidth}
              height={bodyHeight}
              r={bodyRadius}
              color={color}
            />
          </React.Fragment>
        )
      })}
    </>
  )
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
