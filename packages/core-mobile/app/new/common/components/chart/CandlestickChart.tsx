import { Text, useTheme } from '@avalabs/k2-alpine'
import {
  Canvas,
  DashPathEffect,
  Line,
  LinearGradient,
  Path,
  RoundedRect,
  Skia,
  vec
} from '@shopify/react-native-skia'
import React, { FC, useMemo } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import {
  SharedValue,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated'
import { ChartFooter } from './ChartFooter'
import { CHART_INSET } from './constants'
import { Crosshair } from './Crosshair'
import { CrosshairTooltip } from './CrosshairTooltip'
import { LineChartDot } from './LineChartDot'
import {
  indexToX,
  priceToY,
  rangeBounds,
  touchXToIndex,
  yAxisTicks
} from './helpers'
import { OhlcCandle } from './types'
import { VolumeRow } from './VolumeRow'
import { YAxisLabels } from './YAxisLabels'

type Props = {
  candles: OhlcCandle[]
  width: number
  height: number
  volumeRowHeight?: number // defaults to 30
  state?: 'loaded' | 'loading' | 'empty' | 'error'
  onRetry?: () => void
  /** Rendering mode for the price series — candle bodies + wicks, or a
   * single line joining the close prices. All other affordances (volume
   * row, crosshair, footer) are shared. Defaults to 'candlestick'. */
  mode?: 'candlestick' | 'line'
  /** Optional external SharedValue — when provided, the chart writes its
   * press-and-hold state into it so a parent can coordinate other UI
   * (e.g. fading an idle-state price header). Defaults to internal. */
  externalIsActive?: SharedValue<boolean>
  externalActiveIndex?: SharedValue<number | null>
  /** Optional external SharedValue for the crosshair X position, so a parent
   * can render the CrosshairTooltip elsewhere (e.g. overlaying a sibling). */
  externalCrosshairX?: SharedValue<number>
  /** When true, the chart skips rendering its internal CrosshairTooltip so the
   * parent can render it positioned anywhere it wants. */
  hideInternalTooltip?: boolean
}

const CANDLE_BODY_WIDTH_RATIO = 0.6 // candle body occupies 60% of the per-candle slot

export const CandlestickChart: FC<Props> = ({
  candles,
  width,
  height,
  volumeRowHeight,
  state = 'loaded',
  onRetry,
  mode = 'candlestick',
  externalIsActive,
  externalActiveIndex,
  externalCrosshairX,
  hideInternalTooltip = false
}) => {
  const { theme } = useTheme()

  const { minPrice, maxPrice } = useMemo(() => rangeBounds(candles), [candles])

  // Line / area chart fills the canvas edge-to-edge; candles keep the inset.
  const chartInset = mode === 'line' ? 0 : CHART_INSET
  const innerWidth = Math.max(0, width - 2 * chartInset)
  const slotWidth = candles.length > 0 ? innerWidth / candles.length : 0
  const bodyWidth = slotWidth * CANDLE_BODY_WIDTH_RATIO

  const showVolume = mode === 'candlestick'
  const footerH = 24
  // In candle mode, volume occupies its own row below the candles. In line /
  // area mode the volume row is skipped and that slot is absorbed into the
  // chart area, so the line extends further down while the footer stays in
  // the same place.
  const volH = showVolume ? volumeRowHeight ?? 30 : 0
  const candleH = Math.max(0, height - volH - footerH)
  // Top padding leaves room for the y-axis label of the max-price gridline
  // (the label sits above its line). Bottom padding is the breathing room
  // below the line/area in area-chart mode.
  const priceTopPadding = 14
  const priceBottomPadding = mode === 'line' ? 30 : 0
  const priceAreaH = Math.max(0, candleH - priceTopPadding - priceBottomPadding)

  // Canvas-relative y position for each y-axis tick — shared between the
  // gridline path and the YAxisLabels so the labels stay locked to their
  // gridlines (including any edge clamping for visibility).
  const tickPositions = useMemo(() => {
    const prices = yAxisTicks(minPrice, maxPrice, 3) // 4 evenly-spaced prices
    return prices.map(price => {
      const rawY = priceToY({
        price,
        priceMin: minPrice,
        priceMax: maxPrice,
        height: priceAreaH
      })
      const clamped = Math.max(2, Math.min(priceAreaH - 3, rawY))
      return { price, y: clamped + priceTopPadding }
    })
  }, [priceAreaH, minPrice, maxPrice, priceTopPadding])

  const gridPath = useMemo(() => {
    const p = Skia.Path.Make()
    for (const { y } of tickPositions) {
      p.moveTo(chartInset, y)
      p.lineTo(chartInset + innerWidth, y)
    }
    return p
  }, [innerWidth, chartInset, tickPositions])

  // Close-price points used by both the line stroke and the area fill.
  const linePoints = useMemo(
    () =>
      candles.map((c, i) => ({
        x: indexToX(i, candles.length, innerWidth) + chartInset,
        y:
          priceToY({
            price: c.close,
            priceMin: minPrice,
            priceMax: maxPrice,
            height: priceAreaH
          }) + priceTopPadding
      })),
    [
      candles,
      innerWidth,
      priceAreaH,
      minPrice,
      maxPrice,
      chartInset,
      priceTopPadding
    ]
  )

  // Trace `linePoints` onto `p` using Catmull-Rom-to-Bezier so the line
  // glides smoothly through each point rather than zig-zagging.
  const traceSmoothLine = (
    p: ReturnType<typeof Skia.Path.Make>,
    points: { x: number; y: number }[]
  ): void => {
    if (points.length === 0) return
    const first = points[0]
    if (!first) return
    p.moveTo(first.x, first.y)
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? i : i - 1]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1]
      if (!p0 || !p1 || !p2 || !p3) continue
      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1.y + (p2.y - p0.y) / 6
      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2.y - (p3.y - p1.y) / 6
      p.cubicTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
    }
  }

  const linePath = useMemo(() => {
    const p = Skia.Path.Make()
    traceSmoothLine(p, linePoints)
    return p
  }, [linePoints])

  // Closed area path = smooth line extended down to the bottom of the price
  // area (above the bottom padding), filled with a vertical gradient.
  const areaPath = useMemo(() => {
    const p = Skia.Path.Make()
    if (linePoints.length === 0) return p
    traceSmoothLine(p, linePoints)
    const last = linePoints[linePoints.length - 1]
    const first = linePoints[0]
    if (!last || !first) return p
    const bottomY = priceTopPadding + priceAreaH
    p.lineTo(last.x, bottomY)
    p.lineTo(first.x, bottomY)
    p.close()
    return p
  }, [linePoints, priceAreaH, priceTopPadding])

  const greenColor = theme.colors.$textSuccess ?? '#1FA95E'
  const redColor = theme.colors.$textDanger ?? '#E84142'

  // Direction-coloured line/area/dot — green if overall close >= overall open.
  const lineColor = useMemo(() => {
    const last = candles[candles.length - 1]
    const first = candles[0]
    if (!last || !first) return greenColor
    return last.close >= first.open ? greenColor : redColor
  }, [candles, greenColor, redColor])

  const internalCrosshairX = useSharedValue(0)
  const internalIsActive = useSharedValue(false)
  const internalActiveIndex = useSharedValue<number | null>(null)
  const crosshairX = externalCrosshairX ?? internalCrosshairX
  const isActive = externalIsActive ?? internalIsActive
  const activeIndex = externalActiveIndex ?? internalActiveIndex

  const maxVolume = useMemo(
    () => candles.reduce((m, c) => Math.max(m, c.volume ?? 0), 0),
    [candles]
  )

  // Y position for the tracker dot — linearly interpolated between the two
  // adjacent close prices so the dot just moves up or down between candles
  // instead of wobbling along Bezier curvature.
  const activeLineY = useDerivedValue(() => {
    if (linePoints.length === 0 || innerWidth === 0) return 0
    const last = linePoints.length - 1
    const fracIndex = Math.max(
      0,
      Math.min(last, ((crosshairX.value - chartInset) / innerWidth) * last)
    )
    const lo = Math.floor(fracIndex)
    const hi = Math.ceil(fracIndex)
    const t = fracIndex - lo
    const a = linePoints[lo]
    const b = linePoints[hi]
    if (!a || !b) return 0
    return a.y + (b.y - a.y) * t
  }, [linePoints, innerWidth])

  // Continuous bottom inset for the crosshair line — interpolates between the
  // bar heights of the two adjacent candles based on the actual finger X,
  // so the line glides between sizes as the finger crosses between candles.
  const animatedBarHeight = useDerivedValue(() => {
    if (candles.length === 0 || maxVolume === 0 || innerWidth === 0) return 0
    const last = candles.length - 1
    const fracIndex =
      last > 0
        ? Math.max(
            0,
            Math.min(
              last,
              ((crosshairX.value - chartInset) / innerWidth) * last
            )
          )
        : 0
    const lo = Math.floor(fracIndex)
    const hi = Math.ceil(fracIndex)
    const t = fracIndex - lo
    const a = candles[lo]
    const b = candles[hi]
    const ha = a && a.volume != null ? (a.volume / maxVolume) * volH : 0
    const hb = b && b.volume != null ? (b.volume / maxVolume) * volH : 0
    const interp = ha + (hb - ha) * t
    return interp + 8
  }, [candles, maxVolume, volH, innerWidth])

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(150)
        .onStart(e => {
          const clampedX = Math.max(
            chartInset,
            Math.min(width - chartInset, e.x)
          )
          crosshairX.value = clampedX
          activeIndex.value = touchXToIndex(
            e.x - chartInset,
            candles.length,
            innerWidth
          )
          isActive.value = true
        })
        .onChange(e => {
          const clampedX = Math.max(
            chartInset,
            Math.min(width - chartInset, e.x)
          )
          crosshairX.value = clampedX
          activeIndex.value = touchXToIndex(
            e.x - chartInset,
            candles.length,
            innerWidth
          )
        })
        .onFinalize(() => {
          isActive.value = false
          activeIndex.value = null
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- SharedValues from useSharedValue are stable refs, not reactive deps
    [candles.length, width, innerWidth]
  )

  // Loading state
  if (state === 'loading') {
    return (
      <View
        style={{
          width,
          height,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <ActivityIndicator />
      </View>
    )
  }

  // Empty state
  if (state === 'empty' || candles.length === 0) {
    return (
      <View
        style={{
          width,
          height,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <Text variant="caption" sx={{ color: '$textSecondary' }}>
          No data for this range
        </Text>
      </View>
    )
  }

  // Error state
  if (state === 'error') {
    return (
      <View
        style={{
          width,
          height,
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8
        }}>
        <Text variant="caption" sx={{ color: '$textSecondary' }}>
          Couldn't load chart data
        </Text>
        {onRetry && (
          <Pressable onPress={onRetry}>
            <Text variant="caption" sx={{ color: '$textPrimary' }}>
              Retry
            </Text>
          </Pressable>
        )}
      </View>
    )
  }

  // Loaded: existing JSX
  return (
    <GestureDetector gesture={gesture}>
      <View style={{ width, height }}>
        <View style={{ width, height: candleH }}>
          <Canvas style={{ width, height: candleH }}>
            {/* Faint dashed horizontal gridlines at 25 / 50 / 75% of the candle area. */}
            <Path
              path={gridPath}
              color={theme.colors.$textSecondary ?? '#888'}
              style="stroke"
              strokeWidth={1}
              opacity={0.3}>
              <DashPathEffect intervals={[2, 4]} />
            </Path>
            {mode === 'line' && (
              <React.Fragment>
                <Path path={areaPath} style="fill">
                  <LinearGradient
                    start={vec(0, priceTopPadding)}
                    end={vec(0, priceTopPadding + priceAreaH)}
                    colors={[`${lineColor}66`, `${lineColor}00`]}
                  />
                </Path>
                <Path
                  path={linePath}
                  color={lineColor}
                  style="stroke"
                  strokeWidth={2.5}
                  strokeJoin="round"
                  strokeCap="round"
                />
              </React.Fragment>
            )}
            {mode === 'candlestick' &&
              candles.map((c, i) => {
                const xCenter =
                  indexToX(i, candles.length, innerWidth) + chartInset
                const x = xCenter - bodyWidth / 2
                const isUp = c.close >= c.open
                const top =
                  priceToY({
                    price: Math.max(c.open, c.close),
                    priceMin: minPrice,
                    priceMax: maxPrice,
                    height: priceAreaH
                  }) + priceTopPadding
                const bottom =
                  priceToY({
                    price: Math.min(c.open, c.close),
                    priceMin: minPrice,
                    priceMax: maxPrice,
                    height: priceAreaH
                  }) + priceTopPadding
                const bodyHeight = Math.max(1, bottom - top)
                const wickTop =
                  priceToY({
                    price: c.high,
                    priceMin: minPrice,
                    priceMax: maxPrice,
                    height: priceAreaH
                  }) + priceTopPadding
                const wickBottom =
                  priceToY({
                    price: c.low,
                    priceMin: minPrice,
                    priceMax: maxPrice,
                    height: priceAreaH
                  }) + priceTopPadding
                const bodyRadius = Math.min(bodyWidth, bodyHeight) / 2
                const wickStroke = Math.max(1, bodyWidth / 4)
                return (
                  <React.Fragment key={c.ts}>
                    <Line
                      p1={vec(xCenter, wickTop)}
                      p2={vec(xCenter, wickBottom)}
                      color={isUp ? greenColor : redColor}
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
                      color={isUp ? greenColor : redColor}
                    />
                  </React.Fragment>
                )
              })}
          </Canvas>
          <YAxisLabels
            isActive={isActive}
            ticks={tickPositions}
            containerHeight={candleH}
          />
        </View>
        {showVolume && (
          <VolumeRow
            candles={candles}
            width={width}
            height={volH}
            crosshairX={crosshairX}
            isActive={isActive}
          />
        )}
        <ChartFooter
          candles={candles}
          activeIndex={activeIndex}
          isActive={isActive}
          x={crosshairX}
          width={width}
          height={footerH}
          showVolume={showVolume}
        />
        <Crosshair
          x={crosshairX}
          isActive={isActive}
          height={showVolume ? candleH + volH : priceTopPadding + priceAreaH}
          bottomInset={showVolume ? animatedBarHeight : undefined}
          width={mode === 'line' ? 3 : bodyWidth}
        />
        {mode === 'line' && (
          <LineChartDot x={crosshairX} y={activeLineY} isActive={isActive} />
        )}
        {!hideInternalTooltip && (
          <CrosshairTooltip
            candles={candles}
            activeIndex={activeIndex}
            isActive={isActive}
            x={crosshairX}
            width={width}
          />
        )}
      </View>
    </GestureDetector>
  )
}
