import {
  Canvas,
  PaintStyle,
  Path,
  Skia,
  StrokeCap,
  TileMode,
  vec
} from '@shopify/react-native-skia'
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react'
import { LayoutChangeEvent, ViewStyle } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  Easing,
  SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { useTheme } from '../../../hooks'
import { alpha } from '../../../utils'
import { getYFromX, makeCurve } from '../../../utils/chart'
import { View } from '../../Primitives'
import { DashedLine } from './DashedLine'
import { SelectionIndicator } from './SelectionIndicator'
import { useSelectionTitleLayoutAndStyle } from './useSelectionTitleLayoutAndStyle'

export const StakeRewardChart = forwardRef<
  StakeRewardChartHandle,
  {
    style?: ViewStyle
    data: { value: number; duration: string; index: number }[]
    renderSelectionTitle?: () => JSX.Element | undefined
    renderSelectionSubtitle?: () => JSX.Element | undefined
    animatedSelectedIndex: SharedValue<number | undefined>
    initialIndex?: number
  }
>(
  (
    {
      style,
      data,
      renderSelectionTitle,
      renderSelectionSubtitle,
      animatedSelectedIndex,
      initialIndex
    },
    ref
  ) => {
    const { theme } = useTheme()
    const [graphSize, setGraphSize] = useState<{
      width: number
      height: number
    }>({ width: 0, height: 0 })

    const path = useMemo(() => {
      const { path: curvedLine } = makeCurve({
        data: data.map((item, index) => ({ index, value: item.value })),
        size: graphSize,
        xPadding: GRAPH_STROKE_WIDTH,
        yPadding: GRAPH_STROKE_WIDTH
      })
      return curvedLine ? Skia.Path.MakeFromSVGString(curvedLine) : null
    }, [graphSize, data])

    const paint = useMemo(() => {
      const skiaColors = POSITIVE_GRADIENT_FILL_COLORS.map(color =>
        Skia.Color(color)
      )
      const gradientShader = Skia.Shader.MakeLinearGradient(
        vec(0, 0),
        vec(graphSize.width, graphSize.height),
        skiaColors,
        null,
        TileMode.Clamp
      )
      const newPaint = Skia.Paint()
      newPaint.setStyle(PaintStyle.Stroke)
      newPaint.setStrokeCap(StrokeCap.Round)
      newPaint.setStrokeWidth(GRAPH_STROKE_WIDTH)
      newPaint.setShader(gradientShader)
      return newPaint
    }, [graphSize])

    const gridWidth =
      (graphSize.width - GRAPH_STROKE_WIDTH * 2) / (data.length - 1)
    // Captured as a plain number for the reaction worklet below: referencing
    // `data` inside the worklet would clone the whole array into the UI
    // runtime on every closure rebuild.
    const lastDataIndex = data.length - 1
    // Explicitly requires ≥ 2 data points: the formula alone is not enough
    // (an unmeasured width with EMPTY data yields (0−stroke)/(0−1) = +stroke,
    // a positive finite number that would pass the numeric checks while
    // `lastDataIndex` is −1).
    const isGridWidthValid =
      data.length > 1 && Number.isFinite(gridWidth) && gridWidth > 0
    const selectionX = useSharedValue<number | undefined>(undefined)

    const selectIndex = useCallback(
      (index: number | undefined, duration = 300): void => {
        if (index === undefined) {
          // Clearing is written to BOTH shared values here, explicitly — the
          // reaction below deliberately ignores `undefined` (see there), so
          // this is the only path that may clear the selected index.
          selectionX.value = undefined
          animatedSelectedIndex.value = undefined
          return
        }
        if (!isGridWidthValid) {
          // The grid isn't measurable yet (no layout, or < 2 data points) —
          // NaN/Infinity/negative pixels must never reach `selectionX` (they
          // feed animated styles). Record the INTENT instead, so a selection
          // made while the reward data is still loading isn't lost: the
          // anchor effect below turns it into pixels once the grid is real.
          // Deliberately NOT clamped: it's intent against data that hasn't
          // arrived yet (`lastDataIndex` may be −1 here); the pixel path
          // below clamps once the real grid exists.
          animatedSelectedIndex.value = index
          return
        }
        // Defensive clamp: an out-of-range index (e.g. a stale consumer
        // `initialIndex` after a data refresh) would otherwise anchor pixels
        // outside the grid — indicator drawn off the chart while the
        // reaction reports a different, clamped index.
        const clampedIndex = Math.min(Math.max(index, 0), lastDataIndex)
        selectionX.value = withTiming(gridWidth * clampedIndex, {
          duration: duration
        })
      },
      [
        gridWidth,
        isGridWidthValid,
        lastDataIndex,
        selectionX,
        animatedSelectedIndex
      ]
    )

    // Pixel position → selected index. Guards, in order:
    // - `x === undefined` is load-bearing for CP-14721: the mapper evaluates
    //   eagerly on registration AND on every re-registration (any render
    //   where a captured value like `gridWidth` changed — first layout,
    //   reward data arriving), NOT only when `selectionX` actually moves.
    //   Until the anchor effect below runs, `selectionX` is still
    //   `undefined`, and writing that through would clobber the
    //   consumer-provided initial index — the intermittently "Custom"
    //   initial duration on the staking screens. It is safe to skip because
    //   `undefined` never comes from a gesture (pan positions are clamped
    //   pixels); clearing goes through `selectIndex(undefined)`, which
    //   writes the cleared index itself above. (Note Reanimated's `previous`
    //   argument can NOT stand in for this: it is a persistent shared value,
    //   `null` only on the very first evaluation of the component's life,
    //   not on re-registrations.)
    // - `gridWidth` is garbage until BOTH the graph has a measured width and
    //   the data has ≥ 2 points ((0−stroke)/(len−1) is negative or even
    //   positive nonsense for empty data); an `=== 0` check misses those.
    // - Clamping keeps a stale pixel value read against a fresh `gridWidth`
    //   from ever emitting an out-of-range index.
    useAnimatedReaction(
      () => selectionX.value,
      x => {
        if (x === undefined) return
        if (!isGridWidthValid) return

        animatedSelectedIndex.value = Math.min(
          Math.max(Math.round(x / gridWidth), 0),
          lastDataIndex
        )
      }
    )

    // `selectionX` is in pixels, so it must be (re)anchored whenever the
    // geometry (`graphSize`/`gridWidth`, baked into `selectIndex`) changes.
    // Only the very first anchoring applies `initialIndex`; later re-runs
    // re-anchor whatever is CURRENTLY selected — including `undefined`
    // (custom selection cleared via the ref) — because a layout pass or a
    // data refresh must not override a selection the user has since changed
    // (it used to snap a custom stake duration back to the initial preset,
    // CP-14721).
    const hasAnchoredRef = useRef(false)
    useEffect(() => {
      // Anchor synchronously the moment layout AND real data are available
      // (an empty/single-point grid would produce garbage pixels — see the
      // gridWidth note above; the effect re-runs once the data lands, since
      // `selectIndex`'s identity changes with `gridWidth`). This used to be
      // deferred via `InteractionManager.runAfterInteractions`, but on the
      // New Architecture that API is a deprecated stub (plain `setImmediate`
      // semantics), so the deferral bought nothing except a nondeterministic
      // window in which consumers observed the not-yet-anchored selection.
      if (graphSize.width > 0 && graphSize.height > 0 && data.length > 1) {
        // First anchor: prefer whatever is already recorded on the shared
        // value — a selection made through the ref while the reward data was
        // still loading (see `selectIndex`'s intent path) — falling back to
        // `initialIndex` for an unseeded value. Later anchors always re-apply
        // the current selection, INCLUDING a deliberately cleared
        // `undefined` (CP-14721), which is why the `??` fallback must not
        // apply once anchored.
        selectIndex(
          hasAnchoredRef.current
            ? animatedSelectedIndex.value
            : animatedSelectedIndex.value ?? initialIndex,
          0
        )
        hasAnchoredRef.current = true
      }
      // `animatedSelectedIndex` is a stable SharedValue ref; its `.value` is
      // read on purpose only when the geometry changes. `data.length` is
      // covered transitively by `selectIndex` (via `gridWidth`).
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialIndex, selectIndex, graphSize])

    const {
      onLayout: onSelectionTitleLayout,
      animatedStyle: animatedTitleStyle
    } = useSelectionTitleLayoutAndStyle({
      selectionX,
      graphWidth: graphSize.width,
      horizontalInset: GESTURE_HORIZONTAL_INSET
    })

    const {
      onLayout: onSelectionSubtitleLayout,
      animatedStyle: animatedSubtitleStyle
    } = useSelectionTitleLayoutAndStyle({
      selectionX,
      graphWidth: graphSize.width,
      horizontalInset: GESTURE_HORIZONTAL_INSET
    })

    const gradientAreaPath = useMemo(() => {
      if (!path) return null

      const area = path.copy()
      const bottomY = graphSize.height

      const bounds = path.computeTightBounds()
      if (bounds) {
        area.lineTo(bounds.x + bounds.width, bottomY)
        area.lineTo(bounds.x, bottomY)
        area.close()
      }
      return area
    }, [path, graphSize.height])

    const gradientAreaPaint = useMemo(() => {
      const skiaColors = [
        '#3AC48599',
        alpha(theme.colors.$surfacePrimary, 0)
      ].map(color => Skia.Color(color))
      const gradientShader = Skia.Shader.MakeLinearGradient(
        vec(0, 0),
        vec(0, graphSize.height),
        skiaColors,
        null,
        TileMode.Clamp
      )
      const newPaint = Skia.Paint()
      newPaint.setStyle(PaintStyle.Fill)
      newPaint.setShader(gradientShader)
      return newPaint
    }, [graphSize, theme])

    useImperativeHandle(ref, () => ({
      selectIndex
    }))

    return (
      <View
        style={[
          {
            backgroundColor: theme.colors.$surfaceSecondary,
            borderRadius: 12,
            paddingBottom: 15
          },
          style
        ]}>
        <View style={{ flexGrow: 1 }}>
          <View
            style={{
              paddingTop: 11,
              paddingBottom: 8,
              alignItems: 'flex-start'
            }}>
            {renderSelectionTitle && (
              <Animated.View
                style={animatedTitleStyle}
                onLayout={onSelectionTitleLayout}>
                {renderSelectionTitle()}
              </Animated.View>
            )}
            {renderSelectionSubtitle && (
              <Animated.View
                style={animatedSubtitleStyle}
                onLayout={onSelectionSubtitleLayout}>
                {renderSelectionSubtitle()}
              </Animated.View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <View
              style={{
                flex: 1,
                marginBottom: 36,
                marginHorizontal: 36
              }}
              onLayout={({ nativeEvent: { layout } }) =>
                // Only commit when the rect actually changed: a fresh object
                // per event would re-run the anchoring effect above on every
                // redundant layout pass.
                setGraphSize(prev =>
                  prev.width === layout.width && prev.height === layout.height
                    ? prev
                    : { width: layout.width, height: layout.height }
                )
              }>
              <Canvas
                style={{ width: graphSize.width, height: graphSize.height }}>
                {gradientAreaPath && (
                  <Path
                    style="fill"
                    path={gradientAreaPath}
                    paint={gradientAreaPaint}
                  />
                )}
                {path && (
                  <Path
                    style="stroke"
                    path={path}
                    strokeWidth={GRAPH_STROKE_WIDTH}
                    paint={paint}
                  />
                )}
              </Canvas>
            </View>
            <Grid data={data} graphSize={graphSize} selectionX={selectionX} />
          </View>
        </View>
      </View>
    )
  }
)

const Grid = ({
  data,
  graphSize,
  selectionX
}: {
  data: { index: number; value: number; duration: string }[]
  graphSize: { width: number; height: number }
  selectionX: SharedValue<number | undefined>
}): JSX.Element => {
  const [layout, setLayout] = useState<{ width: number; height: number }>()
  const handleLayout = (event: LayoutChangeEvent): void => {
    setLayout(event.nativeEvent.layout)
  }
  const width = layout?.width ?? 0
  const gridWidth = width / (data.length - 1)
  const selectionY = useSharedValue(0)

  const updateSelectionY = (x: number): void => {
    selectionY.value = getYFromX({
      x,
      data,
      size: graphSize,
      xPadding: GRAPH_STROKE_WIDTH,
      yPadding: GRAPH_STROKE_WIDTH
    })
  }

  const isInteracting = useSharedValue(false)

  const panGesture = Gesture.Pan()
    .onStart(event => {
      const x = clampSelectionX(event.x, width)
      selectionX.value = x
      isInteracting.value = true
    })
    .onUpdate(event => {
      selectionX.value = clampSelectionX(event.x, width)
    })
    .onEnd(event => {
      if (!gridWidth) return
      const x = clampSelectionX(event.x, width)
      const nearestIndex = Math.round(x / gridWidth)
      selectionX.value = withTiming(nearestIndex * gridWidth, {
        duration: 300,
        easing: Easing.inOut(Easing.cubic)
      })
      isInteracting.value = false
    })

  const selectedIndex = useDerivedValue(() => {
    if (!gridWidth || selectionX.value === undefined) return undefined

    return selectionX.value / gridWidth
  })

  useAnimatedReaction(
    () => selectionX.value,
    x => {
      if (x !== undefined) {
        // updateSelectionY should be called on the JS thread,
        // since getYFromX function can't be a worklet, as it uses d3 functions
        scheduleOnRN(updateSelectionY, x)
      }
    }
  )

  return (
    <GestureDetector gesture={panGesture}>
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Animated.View
          style={{
            flex: 1,
            marginHorizontal: GESTURE_HORIZONTAL_INSET
          }}
          onLayout={handleLayout}>
          {data.map((item, index) => (
            <DashedLine
              key={index}
              label={item.duration}
              x={gridWidth * index}
              index={index}
              gridWidth={gridWidth}
              selectedIndex={selectedIndex}
              isInteracting={isInteracting}
              type={
                index === 0
                  ? 'first'
                  : index === data.length - 1
                  ? 'last'
                  : 'middle'
              }
            />
          ))}
          <SelectionIndicator x={selectionX} y={selectionY} />
        </Animated.View>
      </View>
    </GestureDetector>
  )
}

const POSITIVE_COLOR_LEFT = '#1FC626'
const POSITIVE_COLOR_RIGHT = '#42C49F'

const POSITIVE_GRADIENT_FILL_COLORS = [
  POSITIVE_COLOR_LEFT,
  POSITIVE_COLOR_RIGHT
]

const GRAPH_STROKE_WIDTH = 3
const GESTURE_HORIZONTAL_INSET = 36 + GRAPH_STROKE_WIDTH

const clampSelectionX = (x: number, maxWidth: number): number => {
  'worklet'
  return Math.min(Math.max(x - GESTURE_HORIZONTAL_INSET, 0), maxWidth)
}

export type StakeRewardChartHandle = {
  selectIndex: (index?: number) => void
}
