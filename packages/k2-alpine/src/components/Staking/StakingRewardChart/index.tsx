import React, {
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState
} from 'react'
import { LayoutChangeEvent, ViewStyle } from 'react-native'
import {
  Canvas,
  PaintStyle,
  Path,
  Skia,
  StrokeCap,
  TileMode,
  vec
} from '@shopify/react-native-skia'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  Easing,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { View } from '../../Primitives'
import { useTheme } from '../../../hooks'
import { getYFromX, makeCurve } from '../../../utils/chart'
import { alpha } from '../../../utils'
import { SelectionIndicator } from './SelectionIndicator'
import { useSelectionTitleLayoutAndStyle } from './useSelectionTitleLayoutAndStyle'
import { DashedLine } from './DashedLine'

export const StakeRewardChart = forwardRef<
  StakeRewardChartHandle,
  {
    style?: ViewStyle
    data: { value: number; duration: string; index: number }[]
    renderSelectionTitle?: () => JSX.Element | undefined
    renderSelectionSubtitle?: () => JSX.Element | undefined
    selectedIndex: SharedValue<number | undefined>
    initialIndex?: number
  }
>(
  (
    {
      style,
      data,
      renderSelectionTitle,
      renderSelectionSubtitle,
      selectedIndex,
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
    const selectionX = useSharedValue<number | undefined>(undefined)

    const selectIndex = useCallback(
      (index: number | undefined): void => {
        selectionX.value =
          index !== undefined
            ? withTiming(gridWidth * index, { duration: 300 })
            : undefined
      },
      [gridWidth, selectionX]
    )

    useAnimatedReaction(
      () => selectionX.value,
      x => {
        if (gridWidth === 0) return

        selectedIndex.value =
          x === undefined ? undefined : Math.round(x / gridWidth)
      }
    )

    useEffect(() => {
      selectIndex(initialIndex)
    }, [initialIndex, selectIndex])

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
                setGraphSize({ width: layout.width, height: layout.height })
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
        runOnJS(updateSelectionY)(x)
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
