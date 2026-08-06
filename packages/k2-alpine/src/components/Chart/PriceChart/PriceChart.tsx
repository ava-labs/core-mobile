import {
  Canvas,
  DashPathEffect,
  Group,
  Path,
  Skia,
  type SkFont
} from '@shopify/react-native-skia'
import React, { FC, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Image, View } from 'react-native'
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
// CP-14918 TEMP PROBE
import { perfCount, perfNow } from './_cp14918PerfProbe'
import { ChartFooter } from './ChartFooter'
import {
  CANDLE_BODY_MAX_WIDTH,
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
  /** Crosshair state mirrored into the parent so it can drive sibling UI
   * (e.g. fading the idle price header) without re-rendering this chart. */
  externalIsActive?: SharedValue<boolean>
  externalActiveIndex?: SharedValue<number | null>
  externalCrosshairX?: SharedValue<number>
  formatPrice?: (amount: number) => string
  formatVolume?: (volume: number) => string
  /** User-initiated refetch (range/currency switch with placeholder data) —
   * dims the chart and shows the spinner overlay. Silent background
   * revalidations are not signalled here. */
  isFetching?: boolean
}

const renderPlaceholderState = ({
  state,
  width,
  height
}: {
  state: ChartState
  width: number
  height: number
}): React.ReactElement | null => {
  // `loading` and `empty` fall through to keep gridlines mounted under
  // the spinner / overlay; only `error` swaps the layout.
  if (state === 'error') {
    return (
      <View
        style={{
          width,
          height,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        <Text variant="caption" sx={{ color: '$textSecondary' }}>
          Couldn't load chart data
        </Text>
      </View>
    )
  }
  return null
}

// CP-14918 item 4 (see the `lineYsSV`/`volumesSV` declarations below):
// pulled out to module scope so the same computation can back both the
// lazy shared-value initializer (mount) and the sync effect (updates)
// without duplicating the flattening logic.
const computeLineYs = (points: { x: number; y: number }[]): Float32Array => {
  const ys = new Float32Array(points.length)
  points.forEach((p, i) => {
    ys[i] = p.y
  })
  return ys
}

const computeVolumes = (candles: OhlcCandle[]): Float32Array => {
  const vols = new Float32Array(candles.length)
  candles.forEach((c, i) => {
    vols[i] = c.volume ?? -1
  })
  return vols
}

// CP-14918 TEMP PROBE: module-level so the mount-effect (request) and the
// labelFont-ready-effect (resolve) can share the timestamp across renders.
let fontRequestT0: number | undefined

// CP-14918 item 3: `useFont` has no internal cache (see
// @shopify/react-native-skia's Data.js/Typeface.js) — every call re-runs
// `Skia.Data.fromURI` + `Skia.Typeface.MakeFreeTypeFaceFromData` on a fresh
// async native round trip and allocates a brand-new SkTypeface/SkFont, even
// though the bytes never change. Load the axis-label font once at module
// scope and hand the same SkFont to every PriceChart mount. (Unrelated to
// `usePreloadSkiaFonts`'s `SkiaPreload`, which warms Skia's glyph
// rasterization *atlas* at app start but still calls `useFont` itself, so it
// does not remove this per-mount typeface allocation.)
const LABEL_FONT_SIZE = 11
let labelFontCache: SkFont | null = null
let labelFontPromise: Promise<SkFont | null> | null = null
const labelFontListeners = new Set<() => void>()

const loadLabelFontOnce = (): Promise<SkFont | null> => {
  if (labelFontPromise) return labelFontPromise
  labelFontPromise = (async (): Promise<SkFont | null> => {
    try {
      const source = require('../../../assets/fonts/Inter-Medium.ttf')
      const uri = Image.resolveAssetSource(source).uri
      const data = await Skia.Data.fromURI(uri)
      const typeface = Skia.Typeface.MakeFreeTypeFaceFromData(data)
      if (!typeface) {
        // Same permanent-cache hazard as the catch block below — a failed
        // (non-throwing) typeface creation must not stick around forever.
        labelFontPromise = null
        return null
      }
      const font = Skia.Font(typeface, LABEL_FONT_SIZE)
      labelFontCache = font
      labelFontListeners.forEach(listener => listener())
      return font
    } catch {
      // CP-14918 fix round 1: don't cache a failed load forever. The old
      // per-mount `useFont` retried naturally on every mount; caching a
      // resolved-null promise here would turn one transient load failure
      // (e.g. a flaky first `Skia.Data.fromURI` read) into session-permanent
      // blank axis labels on every future PriceChart, since every mount
      // short-circuits on `if (labelFontPromise) return labelFontPromise`.
      // Clearing it lets the next mount's `loadLabelFontOnce()` call retry.
      labelFontPromise = null
      return null
    }
  })()
  return labelFontPromise
}

/** Module-scoped singleton — see comment above `loadLabelFontOnce`. */
const useLabelFont = (): SkFont | null => {
  const [font, setFont] = useState<SkFont | null>(labelFontCache)

  useEffect(() => {
    if (labelFontCache) {
      setFont(labelFontCache)
      return
    }
    const listener = (): void => setFont(labelFontCache)
    labelFontListeners.add(listener)
    loadLabelFontOnce()
    return () => {
      labelFontListeners.delete(listener)
    }
  }, [])

  return font
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

  // CP-14918 TEMP PROBE: component body cost (shared values, derived, gesture
  // build) per render pass, plus the font-ready gap / second-Skia-rebuild check.
  const t0Body = perfNow()

  const labelFont = useLabelFont()

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log(`PERFMARK priceChart.fontRequested ${perfNow().toFixed(1)}`)
    fontRequestT0 = perfNow()
  }, [])

  useEffect(() => {
    if (labelFont && fontRequestT0 !== undefined) {
      const gap = perfNow() - fontRequestT0
      // eslint-disable-next-line no-console
      console.log(
        `PERFMARK priceChart.fontReady gapMs=${gap.toFixed(
          1
        )} ${perfNow().toFixed(1)}`
      )
      fontRequestT0 = undefined
    }
  }, [labelFont])

  const { minPrice, maxPrice } = useMemo(() => rangeBounds(candles), [candles])

  // Area chart fills the canvas edge-to-edge; candles keep horizontal inset.
  const chartInset = mode === 'line' ? 0 : CHART_INSET
  const innerWidth = Math.max(0, width - 2 * chartInset)
  const slotWidth = candles.length > 0 ? innerWidth / candles.length : 0
  const bodyWidth = Math.min(
    slotWidth * CANDLE_BODY_WIDTH_RATIO,
    CANDLE_BODY_MAX_WIDTH
  )

  const hasVolumeData = useMemo(
    () => candles.some(c => c.volume != null),
    [candles]
  )
  const showVolume = mode === 'candlestick' && hasVolumeData
  const footerH = CHART_FOOTER_HEIGHT
  // Reserve the volume slot in the math even when hidden so gridlines and
  // candle scaling stay locked across mode toggles.
  const volH = VOLUME_ROW_HEIGHT
  const candleH = Math.max(0, height - volH - footerH)
  const priceTopPadding = PRICE_TOP_PADDING
  const priceAreaH = Math.max(0, candleH - priceTopPadding)
  const canvasH = candleH + volH
  // Area fill bleeds into the volume band for visual continuity in line
  // mode; the line itself still hugs the gridlines via `priceAreaH`.
  const areaBottomY = priceTopPadding + priceAreaH + volH

  const modeAnim = useSharedValue(mode === 'candlestick' ? 1 : 0)
  useEffect(() => {
    modeAnim.value = withTiming(mode === 'candlestick' ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.quad)
    })
  }, [mode, modeAnim])
  const candleOpacity = useDerivedValue(() => modeAnim.value)
  const lineOpacity = useDerivedValue(() => 1 - modeAnim.value)

  const isPanActive = useSharedValue(false)
  const isLongPressActive = useSharedValue(false)
  const touchStartX = useSharedValue(0)
  const touchStartY = useSharedValue(0)
  const hasDecided = useSharedValue(false)

  const chartContentOpacity = useSharedValue(1)
  useEffect(() => {
    // Stay at full opacity while loading/empty so the gridlines remain
    // visible behind the spinner / "no data" overlay. `isFetching` dims to
    // 0.4 to visibly stale the previous range during a placeholder refetch.
    let target: number
    if (isFetching) target = 0.4
    else target = 1
    chartContentOpacity.value = withTiming(target, {
      duration: 250,
      easing: Easing.out(Easing.quad)
    })
  }, [isFetching, chartContentOpacity])
  const chartContentStyle = useAnimatedStyle(() => ({
    opacity: chartContentOpacity.value
  }))

  const spinnerOpacity = useSharedValue(0)
  useEffect(() => {
    const target = state === 'loading' || isFetching ? 1 : 0
    spinnerOpacity.value = withTiming(target, {
      duration: target === 0 ? 180 : 200,
      easing: Easing.out(Easing.quad)
    })
  }, [state, isFetching, spinnerOpacity])
  const spinnerStyle = useAnimatedStyle(() => ({
    opacity: spinnerOpacity.value
  }))

  const hasCandles = candles.length > 0

  // When `candles` is empty, evenly-spaced placeholder positions keep the
  // empty-state grid intact (real labels are gated behind `hasCandles`).
  const tickPositions = useMemo(() => {
    if (!hasCandles) {
      const count = 3
      return Array.from({ length: count + 1 }, (_, i) => {
        const rawY = (i / count) * priceAreaH
        const clamped = Math.max(2, Math.min(priceAreaH - 3, rawY))
        return { price: 0, y: clamped + priceTopPadding }
      })
    }
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
  }, [hasCandles, priceAreaH, minPrice, maxPrice, priceTopPadding])

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

  // CP-14918 item 4: `activeLineY`/`animatedBarHeight` only ever read the Y
  // (resp. volume) field off `linePoints`/`candles` at the crosshair's
  // fractional index. Closing over the full 48-object arrays forced a fresh
  // shareable conversion of both arrays to the UI runtime on every
  // dependency change; flattening just the field each worklet actually
  // reads into a typed array, mirrored into a SharedValue from an effect
  // (not captured directly in the worklet closure), removes that
  // conversion cost from the hot path.
  //
  // CP-14918 fix round 1: lazy-initialize from the CURRENT render's
  // `linePoints`/`candles` (mirrors VolumeRow.tsx's `barGeomSV` init)
  // instead of an empty array. Initializing empty and populating only via
  // the effect below left a one-JS-tick window, on mount and on every
  // range switch, where the worklets read a stale-length array against
  // fresh clamp bounds — bounds-safe (indexes are clamped to the stale
  // array's own length) but could briefly highlight the wrong candle if a
  // crosshair drag was in flight when the range changed. The effect is
  // kept for subsequent updates; the lazy-init closure runs once per mount,
  // same as `useState`'s lazy initializer.
  const lineYsSV = useSharedValue<Float32Array>(() => computeLineYs(linePoints))
  useEffect(() => {
    lineYsSV.value = computeLineYs(linePoints)
  }, [linePoints, lineYsSV])

  // -1 sentinel for "no volume" (real volumes are always >= 0).
  const volumesSV = useSharedValue<Float32Array>(() => computeVolumes(candles))
  useEffect(() => {
    volumesSV.value = computeVolumes(candles)
  }, [candles, volumesSV])

  // Y on the close-price line at the crosshair X (linear interp between the
  // two neighboring close prices, so the dot glides vertically only).
  const activeLineY = useDerivedValue(() => {
    const ys = lineYsSV.value
    const last = ys.length - 1
    if (last < 0 || innerWidth === 0) return 0
    const fracIndex = Math.max(
      0,
      Math.min(last, ((crosshairX.value - chartInset) / innerWidth) * last)
    )
    const lo = Math.floor(fracIndex)
    const hi = Math.ceil(fracIndex)
    const t = fracIndex - lo
    const a = ys[lo]
    const b = ys[hi]
    if (a === undefined || b === undefined) return 0
    return a + (b - a) * t
  }, [innerWidth, chartInset])

  // Bottom inset for the crosshair line so it stops 8px above the active
  // volume bar; interpolated between adjacent bar heights for smoothness.
  const animatedBarHeight = useDerivedValue(() => {
    const vols = volumesSV.value
    const last = vols.length - 1
    if (last < 0 || maxVolume === 0 || innerWidth === 0) return 0
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
    const va = vols[lo]
    const vb = vols[hi]
    const ha = va !== undefined && va >= 0 ? (va / maxVolume) * volH : 0
    const hb = vb !== undefined && vb >= 0 ? (vb / maxVolume) * volH : 0
    const interp = ha + (hb - ha) * t
    return interp + 8
  }, [maxVolume, volH, innerWidth, chartInset])

  // Two simultaneous gestures coordinate the crosshair interaction:
  //   - LongPress (≥200ms with <3px wander): activates the crosshair at the
  //     touch location without requiring any drag.
  //   - Pan with manualActivation + direction-based commit: once motion
  //     exceeds TAP_SLOP, horizontal-dominant motion activates the
  //     crosshair, vertical-dominant fails so the parent scroll takes the
  //     touch. Once LongPress has already activated, Pan accepts any
  //     direction so the user can drag the crosshair vertically without
  //     losing it.
  //
  // CP-14918 item 5 (investigated, not landed here): removing this
  // suppression alone does NOT let the React Compiler regain memoization
  // for this component. Verified by sweeping a copy of this file with only
  // this comment stripped (no other changes): the compiler still bails,
  // now with ~15 "existing manual memoization could not be preserved" /
  // "dependency may be mutated later" errors instead of the single
  // "found suppression" one — coming from `modeAnim`, `chartContentOpacity`,
  // and `spinnerOpacity`'s effects above, all of which list a SharedValue
  // directly in their own dependency arrays (pre-existing, unrelated to
  // this gesture memo). Making this component fully compiler-eligible
  // needs a restructure of every SharedValue-in-deps effect in this file,
  // not just this one spot — out of scope for this pass; see
  // task-V-report.md for the isolated repro. A `useRef`-container
  // workaround was also tried and separately rejected: it trades this
  // bailout for "Cannot access refs during render" once the worklets below
  // read through it, so it isn't a viable path either without deeper
  // restructuring (and this is the highest-risk code in the file to change
  // without on-device gesture verification).
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

  // CP-14918 TEMP PROBE: component body cost, end of pair started at t0Body
  perfCount('priceChart.bodyMs', perfNow() - t0Body)

  const placeholder = renderPlaceholderState({
    state,
    width,
    height
  })
  if (placeholder) return placeholder

  const isEmpty = state === 'empty' && !hasCandles

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
              {hasCandles && (
                <YAxisLabels
                  isActive={isActive}
                  ticks={tickPositions}
                  font={labelFont}
                  color={theme.colors.$textPrimary ?? '#000'}
                  formatPrice={formatPrice}
                />
              )}
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
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: priceTopPadding,
              left: 0,
              right: 0,
              height: priceAreaH,
              justifyContent: 'center',
              alignItems: 'center'
            },
            spinnerStyle
          ]}>
          <ActivityIndicator />
        </Animated.View>
        {isEmpty && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: priceTopPadding,
              left: 0,
              right: 0,
              height: priceAreaH,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <Text variant="caption" sx={{ color: '$textSecondary' }}>
              No data for this range
            </Text>
          </View>
        )}
      </View>
    </GestureDetector>
  )
}
