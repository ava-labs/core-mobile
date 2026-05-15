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
import { colors as baseColors } from '../../../theme/tokens/colors'
import { Text } from '../../Primitives'
import { AreaSeries } from './AreaSeries'
import { Candles } from './Candles'
import { ChartFooter } from './ChartFooter'
import {
  CANDLE_BODY_WIDTH_RATIO,
  CHART_FOOTER_HEIGHT,
  CHART_INSET,
  LINE_BOTTOM_PADDING,
  PRICE_TOP_PADDING,
  VOLUME_ROW_HEIGHT
} from './constants'
import { Crosshair } from './Crosshair'
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
  mode?: PriceChartMode
  /** When provided, the chart writes its press-and-hold state into these
   * SharedValues so a parent can coordinate sibling UI without re-rendering
   * (e.g. fading an idle-state price header). */
  externalIsActive?: SharedValue<boolean>
  externalActiveIndex?: SharedValue<number | null>
  externalCrosshairX?: SharedValue<number>
  /** Locale + currency-aware money formatter for y-axis labels. */
  formatPrice?: (amount: number) => string
  /** Locale + currency-aware compact formatter for the volume label. */
  formatVolume?: (volume: number) => string
}

const renderPlaceholderState = ({
  state,
  candles,
  width,
  height,
  onRetry
}: {
  state: ChartState
  candles: OhlcCandle[]
  width: number
  height: number
  onRetry?: () => void
}): React.ReactElement | null => {
  const containerStyle = {
    width,
    height,
    justifyContent: 'center' as const,
    alignItems: 'center' as const
  }
  if (state === 'loading') {
    return (
      <View style={containerStyle}>
        <ActivityIndicator />
      </View>
    )
  }
  if (state === 'empty' || candles.length === 0) {
    return (
      <View style={containerStyle}>
        <Text variant="caption" sx={{ color: '$textSecondary' }}>
          No data for this range
        </Text>
      </View>
    )
  }
  if (state === 'error') {
    return (
      <View style={{ ...containerStyle, gap: 8 }}>
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
  return null
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
  formatPrice,
  formatVolume
}) => {
  const { theme } = useTheme()

  const labelFont = useFont(
    require('../../../assets/fonts/Inter-Medium.ttf'),
    11
  )

  const { minPrice, maxPrice } = useMemo(() => rangeBounds(candles), [candles])

  // Area chart fills the canvas edge-to-edge; candles keep horizontal inset.
  const chartInset = mode === 'line' ? 0 : CHART_INSET
  const innerWidth = Math.max(0, width - 2 * chartInset)
  const slotWidth = candles.length > 0 ? innerWidth / candles.length : 0
  const bodyWidth = slotWidth * CANDLE_BODY_WIDTH_RATIO

  // Reserve the volume slot only when we actually have volume to draw —
  // candles derived from a close-only feed have `volume: null` and would
  // otherwise leave an empty band under the candles.
  const hasVolumeData = useMemo(
    () => candles.some(c => c.volume != null),
    [candles]
  )
  const showVolume = mode === 'candlestick' && hasVolumeData
  const footerH = CHART_FOOTER_HEIGHT
  const volH = showVolume ? volumeRowHeight ?? VOLUME_ROW_HEIGHT : 0
  const candleH = Math.max(0, height - volH - footerH)
  const priceTopPadding = PRICE_TOP_PADDING
  const priceBottomPadding = mode === 'line' ? LINE_BOTTOM_PADDING : 0
  const priceAreaH = Math.max(0, candleH - priceTopPadding - priceBottomPadding)

  // Shared between the gridline path and the y-axis labels so each label
  // stays locked to its dashed line (including the edge-clamping below).
  const tickPositions = useMemo(() => {
    const prices = yAxisTicks(minPrice, maxPrice, 3)
    return prices.map(price => {
      const rawY = priceToY({
        price,
        priceMin: minPrice,
        priceMax: maxPrice,
        height: priceAreaH
      })
      // Inset edge ticks so their 1px stroke isn't half-clipped by the canvas.
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

  const greenColor = baseColors.$accentSuccessL
  const redColor = baseColors.$accentDanger

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

  // Y on the close-price line at the crosshair X (linear interp between the
  // two neighboring close prices, so the dot glides vertically only).
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

  // Bottom inset for the crosshair line so it stops 8px above the active
  // volume bar; interpolated between adjacent bar heights for smoothness.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- SharedValues are stable refs.
    [candles.length, width, innerWidth]
  )

  const placeholder = renderPlaceholderState({
    state,
    candles,
    width,
    height,
    onRetry
  })
  if (placeholder) return placeholder

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ width, height }}>
        <View style={{ width, height: candleH }}>
          <Canvas style={{ width, height: candleH }}>
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
              formatPrice={formatPrice}
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
          formatVolume={formatVolume}
        />
        <Crosshair
          x={crosshairX}
          isActive={isActive}
          height={showVolume ? candleH + volH : priceTopPadding + priceAreaH}
          bottomInset={showVolume ? animatedBarHeight : undefined}
          width={3}
        />
        {mode === 'line' && (
          <LineChartDot x={crosshairX} y={activeLineY} isActive={isActive} />
        )}
      </View>
    </GestureDetector>
  )
}
