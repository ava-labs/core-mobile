import {
  Canvas,
  DashPathEffect,
  Path,
  Skia,
  useFont
} from '@shopify/react-native-skia'
import React, { FC, useMemo } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import {
  SharedValue,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated'
import { useTheme } from '../../../hooks'
import { Text } from '../../Primitives'
import { AreaSeries } from './AreaSeries'
import { Candles } from './Candles'
import { ChartFooter } from './ChartFooter'
import {
  CANDLE_BODY_WIDTH_RATIO,
  CHART_FOOTER_HEIGHT,
  CHART_INSET,
  LINE_BOTTOM_PADDING,
  LINE_MODE_CROSSHAIR_WIDTH,
  PRICE_TOP_PADDING,
  VOLUME_ROW_HEIGHT
} from './constants'
import { Crosshair } from './Crosshair'
import { CrosshairTooltip } from './CrosshairTooltip'
import { LineChartDot } from './LineChartDot'
import {
  indexToX,
  priceToY,
  rangeBounds,
  touchXToIndex,
  traceSmoothLine,
  yAxisTicks
} from './helpers'
import { ChartState, OhlcCandle, PriceChartMode } from './types'
import { VolumeRow } from './VolumeRow'
import { YAxisLabels } from './YAxisLabels'

type Props = {
  candles: OhlcCandle[]
  width: number
  height: number
  volumeRowHeight?: number
  state?: ChartState
  onRetry?: () => void
  /** Rendering mode for the price series — candle bodies + wicks, or a
   * single line joining the close prices. All other affordances (volume
   * row, crosshair, footer) are shared. Defaults to 'candlestick'. */
  mode?: PriceChartMode
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

export const PriceChart: FC<Props> = ({
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

  // Skia font for the y-axis labels. `useFont` returns null until the font
  // file is loaded; the labels render nothing until then.
  const labelFont = useFont(
    require('../../../assets/fonts/Inter-Medium.ttf'),
    11
  )

  const { minPrice, maxPrice } = useMemo(() => rangeBounds(candles), [candles])

  // Line / area chart fills the canvas edge-to-edge; candles keep the inset.
  const chartInset = mode === 'line' ? 0 : CHART_INSET
  const innerWidth = Math.max(0, width - 2 * chartInset)
  const slotWidth = candles.length > 0 ? innerWidth / candles.length : 0
  const bodyWidth = slotWidth * CANDLE_BODY_WIDTH_RATIO

  const showVolume = mode === 'candlestick'
  const footerH = CHART_FOOTER_HEIGHT
  // In candle mode, volume occupies its own row below the candles. In line /
  // area mode the volume row is skipped and that slot is absorbed into the
  // chart area, so the line extends further down while the footer stays in
  // the same place.
  const volH = showVolume ? volumeRowHeight ?? VOLUME_ROW_HEIGHT : 0
  const candleH = Math.max(0, height - volH - footerH)
  // Top padding leaves room for the y-axis label of the max-price gridline
  // (the label sits above its line). Bottom padding is the breathing room
  // below the line/area in area-chart mode.
  const priceTopPadding = PRICE_TOP_PADDING
  const priceBottomPadding = mode === 'line' ? LINE_BOTTOM_PADDING : 0
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
              <AreaSeries
                areaPath={areaPath}
                linePath={linePath}
                color={lineColor}
                topY={priceTopPadding}
                bottomY={priceTopPadding + priceAreaH}
              />
            )}
            {mode === 'candlestick' && (
              <Candles
                candles={candles}
                innerWidth={innerWidth}
                chartInset={chartInset}
                bodyWidth={bodyWidth}
                priceAreaH={priceAreaH}
                priceTopPadding={priceTopPadding}
                priceMin={minPrice}
                priceMax={maxPrice}
                upColor={greenColor}
                downColor={redColor}
              />
            )}
            <YAxisLabels
              isActive={isActive}
              ticks={tickPositions}
              font={labelFont}
              color={theme.colors.$textPrimary ?? '#000'}
            />
          </Canvas>
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
          width={mode === 'line' ? LINE_MODE_CROSSHAIR_WIDTH : bodyWidth}
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
