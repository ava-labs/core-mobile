import {
  Canvas,
  DashPathEffect,
  Group,
  Path,
  Skia,
  useFont
} from '@shopify/react-native-skia'
import React, { FC, useEffect, useMemo } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { useTheme } from '../../../hooks'
import { colors as baseColors } from '../../../theme/tokens/colors'
import { Text } from '../../Primitives'
import { ChartFooter } from './ChartFooter'
import {
  CANDLE_BODY_WIDTH_RATIO,
  CHART_FOOTER_HEIGHT,
  CHART_INSET,
  PRICE_TOP_PADDING,
  VOLUME_ROW_HEIGHT
} from './constants'
import { Crosshair } from './Crosshair'
import {
  indexToX,
  priceToY,
  rangeBounds,
  touchXToIndex,
  traceSmoothLine,
  yAxisTicks
} from './helpers'
import { AreaSeries, Candles, LineChartDot } from './Series'
import { ChartState, OhlcCandle, PriceChartMode } from './types'
import { VolumeRow } from './VolumeRow'
import { YAxisLabels } from './YAxisLabels'

type Props = {
  candles: OhlcCandle[]
  width: number
  height: number
  state?: ChartState
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
  /** Background refetch (e.g., on range change). Dims the chart and shows a spinner overlay. */
  isFetching?: boolean
}

const renderPlaceholderState = ({
  state,
  candles,
  width,
  height
}: {
  state: ChartState
  candles: OhlcCandle[]
  width: number
  height: number
}): React.ReactElement | null => {
  const containerStyle = {
    width,
    height,
    justifyContent: 'center' as const,
    alignItems: 'center' as const
  }
  // 'loading' falls through to the main render so we get a stable layout
  // with a spinner overlay and fade-in instead of swapping layouts.
  if (state === 'empty' && candles.length === 0) {
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
      <View style={containerStyle}>
        <Text variant="caption" sx={{ color: '$textSecondary' }}>
          Couldn't load chart data
        </Text>
      </View>
    )
  }
  return null
}

export const PriceChart: FC<Props> = ({
  candles,
  width,
  height,
  state = 'loaded',
  mode = 'candlestick',
  externalIsActive,
  externalActiveIndex,
  externalCrosshairX,
  formatPrice,
  formatVolume,
  isFetching = false
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

  const hasVolumeData = useMemo(
    () => candles.some(c => c.volume != null),
    [candles]
  )
  const showVolume = mode === 'candlestick' && hasVolumeData
  const footerH = CHART_FOOTER_HEIGHT
  // Volume slot is always reserved in the math so gridlines + candle
  // scaling stay locked across modes. The canvas spans the full chart
  // area (candle body + volume band) so both line/area and candles can
  // stay mounted and swap via opacity without resizing the Canvas.
  const volH = VOLUME_ROW_HEIGHT
  const candleH = Math.max(0, height - volH - footerH)
  const priceTopPadding = PRICE_TOP_PADDING
  const priceAreaH = Math.max(0, candleH - priceTopPadding)
  const canvasH = candleH + volH
  // Area fill extends below the bottom gridline into the volume-row band
  // for visual continuity in line mode (the line itself still hugs the
  // gridlines via `priceAreaH`).
  const areaBottomY = priceTopPadding + priceAreaH + volH

  const modeAnim = useSharedValue(mode === 'candlestick' ? 1 : 0)
  useEffect(() => {
    modeAnim.value = mode === 'candlestick' ? 1 : 0
  }, [mode, modeAnim])
  const candleOpacity = useDerivedValue(() => modeAnim.value)
  const lineOpacity = useDerivedValue(() => 1 - modeAnim.value)

  const isPanActive = useSharedValue(false)
  const isLongPressActive = useSharedValue(false)
  const touchStartX = useSharedValue(0)
  const touchStartY = useSharedValue(0)
  const hasDecided = useSharedValue(false)

  const chartContentOpacity = useSharedValue(0)
  useEffect(() => {
    let target: number
    if (state !== 'loaded') target = 0
    else if (isFetching) target = 0.4
    else target = 1
    chartContentOpacity.value = withTiming(target, {
      duration: target === 0 ? 120 : 250,
      easing: Easing.out(Easing.quad)
    })
  }, [state, isFetching, chartContentOpacity])
  const chartContentStyle = useAnimatedStyle(() => ({
    opacity: chartContentOpacity.value
  }))
  const showSpinner = state === 'loading' || isFetching

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
    p.lineTo(last.x, areaBottomY)
    p.lineTo(first.x, areaBottomY)
    p.close()
    return p
  }, [linePoints, areaBottomY])

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

  // Two simultaneous gestures coordinate the crosshair interaction:
  //   - LongPress (≥200ms with <3px wander): activates the crosshair at the
  //     touch location without requiring any drag.
  //   - Pan with manualActivation + direction-based commit: once motion
  //     exceeds TAP_SLOP, horizontal-dominant motion activates the
  //     crosshair, vertical-dominant fails so the parent scroll takes the
  //     touch. Once LongPress has already activated, Pan accepts any
  //     direction so the user can drag the crosshair vertically without
  //     losing it.
  // eslint-disable-next-line sonarjs/cognitive-complexity
  const gesture = useMemo(() => {
    const clampX = (x: number): number => {
      'worklet'
      return Math.max(chartInset, Math.min(width - chartInset, x))
    }
    const indexAt = (x: number): number => {
      'worklet'
      return touchXToIndex(x - chartInset, candles.length, innerWidth)
    }

    const longPress = Gesture.LongPress()
      .minDuration(200)
      .maxDistance(3)
      .onStart(e => {
        'worklet'
        isLongPressActive.value = true
        crosshairX.value = clampX(e.x)
        activeIndex.value = indexAt(e.x)
        isActive.value = true
      })
      .onFinalize(() => {
        'worklet'
        isLongPressActive.value = false
        if (!isPanActive.value) {
          isActive.value = false
          activeIndex.value = null
        }
      })

    const TAP_SLOP = 5

    const pan = Gesture.Pan()
      .manualActivation(true)
      .onTouchesDown(event => {
        'worklet'
        const t = event.allTouches[0]
        if (!t) return
        touchStartX.value = t.absoluteX
        touchStartY.value = t.absoluteY
        hasDecided.value = false
      })
      .onTouchesMove((event, manager) => {
        'worklet'
        if (hasDecided.value) return
        // If the press already activated (LongPress confirmed), accept any
        // direction — the user is in deliberate crosshair-drag mode and
        // vertical motion should still move the crosshair X, not scroll.
        if (isLongPressActive.value) {
          hasDecided.value = true
          manager.activate()
          return
        }
        const t = event.allTouches[0]
        if (!t) return
        const dx = t.absoluteX - touchStartX.value
        const dy = t.absoluteY - touchStartY.value
        const absDx = Math.abs(dx)
        const absDy = Math.abs(dy)
        if (absDx <= TAP_SLOP && absDy <= TAP_SLOP) return
        hasDecided.value = true
        if (absDx > absDy) {
          manager.activate()
        } else {
          manager.fail()
        }
      })
      .onStart(e => {
        'worklet'
        isPanActive.value = true
        crosshairX.value = clampX(e.x)
        activeIndex.value = indexAt(e.x)
        isActive.value = true
      })
      .onChange(e => {
        'worklet'
        crosshairX.value = clampX(e.x)
        activeIndex.value = indexAt(e.x)
      })
      .onFinalize(() => {
        'worklet'
        isPanActive.value = false
        if (!isLongPressActive.value) {
          isActive.value = false
          activeIndex.value = null
        }
      })

    return Gesture.Simultaneous(longPress, pan)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- SharedValues are stable refs.
  }, [candles.length, width, innerWidth, chartInset])

  const placeholder = renderPlaceholderState({
    state,
    candles,
    width,
    height
  })
  if (placeholder) return placeholder

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ width, height }}>
        <Animated.View style={[{ width, height }, chartContentStyle]}>
          <View style={{ width, height: canvasH }}>
            <Canvas style={{ width, height: canvasH }}>
              <Path
                path={gridPath}
                color={theme.colors.$textSecondary ?? '#888'}
                style="stroke"
                strokeWidth={1}
                opacity={0.3}>
                <DashPathEffect intervals={[2, 4]} />
              </Path>
              <Group opacity={lineOpacity}>
                <AreaSeries
                  areaPath={areaPath}
                  linePath={linePath}
                  color={lineColor}
                  topY={priceTopPadding}
                  bottomY={areaBottomY}
                />
              </Group>
              <Group opacity={candleOpacity}>
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
              </Group>
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
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: candleH,
                left: 0,
                width,
                height: volH
              }}>
              <VolumeRow
                candles={candles}
                width={width}
                height={volH}
                crosshairX={crosshairX}
                isActive={isActive}
              />
            </View>
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
            height={candleH + volH}
            bottomInset={showVolume ? animatedBarHeight : undefined}
          />
          {mode === 'line' && (
            <LineChartDot x={crosshairX} y={activeLineY} isActive={isActive} />
          )}
        </Animated.View>
        {showSpinner && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <ActivityIndicator />
          </View>
        )}
      </View>
    </GestureDetector>
  )
}
