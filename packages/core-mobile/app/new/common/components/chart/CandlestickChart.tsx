import { Text, useTheme } from '@avalabs/k2-alpine'
import {
  Canvas,
  DashPathEffect,
  Line,
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
import { indexToX, priceToY, rangeBounds, touchXToIndex } from './helpers'
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
  externalIsActive,
  externalActiveIndex,
  externalCrosshairX,
  hideInternalTooltip = false
}) => {
  const { theme } = useTheme()

  const { minPrice, maxPrice } = useMemo(() => rangeBounds(candles), [candles])

  const innerWidth = Math.max(0, width - 2 * CHART_INSET)
  const slotWidth = candles.length > 0 ? innerWidth / candles.length : 0
  const bodyWidth = slotWidth * CANDLE_BODY_WIDTH_RATIO

  const volH = volumeRowHeight ?? 30
  const footerH = 24
  const candleH = Math.max(0, height - volH - footerH)

  const gridPath = useMemo(() => {
    const p = Skia.Path.Make()
    for (const ratio of [0.25, 0.5, 0.75]) {
      const y = candleH * ratio
      p.moveTo(CHART_INSET, y)
      p.lineTo(CHART_INSET + innerWidth, y)
    }
    return p
  }, [innerWidth, candleH])

  const greenColor = theme.colors.$textSuccess ?? '#1FA95E'
  const redColor = theme.colors.$textDanger ?? '#E84142'

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
            Math.min(last, ((crosshairX.value - CHART_INSET) / innerWidth) * last)
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
            CHART_INSET,
            Math.min(width - CHART_INSET, e.x)
          )
          crosshairX.value = clampedX
          activeIndex.value = touchXToIndex(
            e.x - CHART_INSET,
            candles.length,
            innerWidth
          )
          isActive.value = true
        })
        .onChange(e => {
          const clampedX = Math.max(
            CHART_INSET,
            Math.min(width - CHART_INSET, e.x)
          )
          crosshairX.value = clampedX
          activeIndex.value = touchXToIndex(
            e.x - CHART_INSET,
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
            {candles.map((c, i) => {
              const xCenter =
                indexToX(i, candles.length, innerWidth) + CHART_INSET
              const x = xCenter - bodyWidth / 2
              const isUp = c.close >= c.open
              const top = priceToY({
                price: Math.max(c.open, c.close),
                priceMin: minPrice,
                priceMax: maxPrice,
                height: candleH
              })
              const bottom = priceToY({
                price: Math.min(c.open, c.close),
                priceMin: minPrice,
                priceMax: maxPrice,
                height: candleH
              })
              const bodyHeight = Math.max(1, bottom - top)
              const wickTop = priceToY({
                price: c.high,
                priceMin: minPrice,
                priceMax: maxPrice,
                height: candleH
              })
              const wickBottom = priceToY({
                price: c.low,
                priceMin: minPrice,
                priceMax: maxPrice,
                height: candleH
              })
              const bodyRadius = Math.min(bodyWidth, bodyHeight) / 2
              return (
                <React.Fragment key={c.ts}>
                  <Line
                    p1={vec(xCenter, wickTop)}
                    p2={vec(xCenter, wickBottom)}
                    color={isUp ? greenColor : redColor}
                    strokeWidth={2}
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
            minPrice={minPrice}
            maxPrice={maxPrice}
            height={candleH}
          />
        </View>
        <VolumeRow
          candles={candles}
          width={width}
          height={volH}
          crosshairX={crosshairX}
          isActive={isActive}
        />
        <ChartFooter
          candles={candles}
          activeIndex={activeIndex}
          isActive={isActive}
          x={crosshairX}
          width={width}
          height={footerH}
        />
        <Crosshair
          x={crosshairX}
          isActive={isActive}
          height={candleH + volH}
          bottomInset={animatedBarHeight}
          width={bodyWidth}
        />
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
