import { Line, RoundedRect, vec } from '@shopify/react-native-skia'
import React, { FC } from 'react'
import { indexToX, priceToY } from './helpers'
import { OhlcCandle } from './types'

type Props = {
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

/** Skia primitives — must be a child of a `<Canvas>`. */
export const Candles: FC<Props> = ({
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
